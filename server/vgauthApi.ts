import type { Express, Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  createVgauthBan,
  createVgauthLog,
  createVgauthSession,
  createVgauthUser,
  findActiveVgauthShutdown,
  findVgauthBan,
  getVgauthAppByDlCode,
  getVgauthAppById,
  getVgauthAppByOwnerId,
  getVgauthLicenseById,
  getVgauthLicenseByKey,
  getVgauthLicensesByApp,
  getVgauthLogs,
  getVgauthFile,
  putVgauthFile,
  deleteVgauthFile,
  getVgauthSessionByToken,
  getVgauthUserByUsername,
  updateVgauthApp,
  updateVgauthLicense,
  updateVgauthSession,
  updateVgauthUser,
} from "./db";
import { storagePut } from "./storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIp(req: Request): string {
  const h = req.headers;
  const candidates = [
    (h["cf-connecting-ip"] as string) || "",
    (h["true-client-ip"] as string) || "",
    (h["x-real-ip"] as string) || "",
    ((h["x-forwarded-for"] as string) || "").split(",")[0].trim(),
    req.socket?.remoteAddress || "",
  ];
  let ip = (candidates.find(c => c && c.length > 0) || "").trim();
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) ip = mapped[1];
  return ip || "unknown";
}

function randToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

// Screenshot enviado pelo cliente (.hpp) quando o anti-tamper dispara.
// Salva no storage e devolve a URL pública — vai no detail JSON do alerta.
async function uploadTamperShot(shot: string): Promise<string | null> {
  try {
    if (shot.length > 12_000_000) return null;
    const m = shot.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return null;
    const buffer = Buffer.from(m[2], "base64");
    if (buffer.length === 0 || buffer.length > 9_000_000) return null;
    const ext = m[1] === "jpeg" ? "jpg" : "png";
    const { url } = await storagePut(
      `vgauth-protect/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`,
      buffer,
      `image/${m[1]}`
    );
    return url;
  } catch {
    return null;
  }
}

/** Assinatura HMAC da resposta — o cliente valida com o secret do app */
function sign(secret: string, success: boolean, message: string, sessionid: string, ts: number): string {
  const payload = `${success ? "1" : "0"}|${message}|${sessionid}|${ts}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function respond(res: Response, secret: string | null, payload: Record<string, any>) {
  const ts = Math.floor(Date.now() / 1000);
  const body: Record<string, any> = { ts, ...payload };
  if (secret) {
    body.signature = sign(secret, !!payload.success, String(payload.message ?? ""), String(payload.sessionid ?? ""), ts);
  }
  return res.json(body);
}

function durationToMs(value: number, unit: string): number | null {
  const v = Math.max(0, value);
  switch (unit) {
    case "minutes": return v * 60_000;
    case "hours": return v * 3_600_000;
    case "days": return v * 86_400_000;
    case "weeks": return v * 604_800_000;
    case "months": return v * 2_592_000_000;
    case "years": return v * 31_536_000_000;
    case "lifetime": return null;
    default: return v * 86_400_000;
  }
}

// ─── Rate limiting (proteção massiva: anti brute-force) ───────────────────────
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = rateBuckets.get(key);
  if (!b || b.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count++;
  return b.count <= max;
}

setInterval(() => {
  const now = Date.now();
  rateBuckets.forEach((b, k) => { if (b.resetAt < now) rateBuckets.delete(k); });
}, 60_000).unref();

const MAX_HWID_VIOLATIONS = 3;

// ─── Proof-of-Protection (MegaProtect/Themida no cliente C++) ────────────────
// O cliente envia ptk = fnv1a32(sentinels CHECK_* + sessionid|appName).
// O valor correto so e produzido quando os markers Themida do binario respondem
// (protecao intacta). Binario unpacked/crackeado -> sentinels = 0 -> ptk errado
// -> rejeitado. Enforcement por app (ownerId) para nao quebrar clientes antigos.
const PTK_ENFORCED_OWNERS = new Set<string>([
  "3728be3ac8735641a07e5133314f4703", // EXTERNAL VG (VEX)
]);

function vgPtk(sid: string): string {
  let h = 0x811c9dc5;
  for (const v of [0x51a3, 0x2f4d, 0x7b1e]) h = Math.imul(h ^ v, 16777619) >>> 0;
  for (const b of Buffer.from(sid, "utf8")) h = Math.imul(h ^ b, 16777619) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export function registerVgAuthApi(app: Express) {
  app.post("/api/vgauth/v1", async (req: Request, res: Response) => {
    const ip = getClientIp(req);
    const body = (req.body || {}) as Record<string, any>;
    const type = String(body.type || req.query.type || "").toLowerCase();

    // Rate limit global por IP
    if (!rateLimit(`vga:${ip}`, 60, 60_000)) {
      return respond(res, null, { success: false, message: "rate_limited" });
    }

    try {
      // ── INIT ──────────────────────────────────────────────────────────────
      if (type === "init") {
        const { name, ownerid, secret, ver } = body;
        if (!name || !ownerid || !secret) {
          return respond(res, null, { success: false, message: "missing_params" });
        }
        const appRow = await getVgauthAppByOwnerId(String(ownerid));
        if (!appRow || appRow.name !== String(name) || appRow.secret !== String(secret)) {
          return respond(res, null, { success: false, message: "invalid_app_credentials" });
        }
        if (appRow.status !== "active") {
          return respond(res, appRow.secret, { success: false, message: "app_disabled" });
        }
        // proof-of-protection: no init o ptk e calculado sobre o app name
        if (PTK_ENFORCED_OWNERS.has(appRow.ownerId) && String(body.ptk || "") !== vgPtk(String(name))) {
          await createVgauthLog({ appId: appRow.id, action: "protect.ptk_rejected", detail: "init", ip });
          return respond(res, null, { success: false, message: "invalid_session" });
        }
        const sessionid = randToken(24);
        const encKey = randToken(16);
        await createVgauthSession({
          appId: appRow.id,
          token: sessionid,
          encKey,
          ip,
          expiresAt: new Date(Date.now() + 24 * 3_600_000),
        });
        await createVgauthLog({ appId: appRow.id, action: "session.init", detail: `ver=${ver || "?"}`, ip });
        return respond(res, appRow.secret, {
          success: true,
          message: "initialized",
          sessionid,
          enckey: encKey,
          appinfo: { name: appRow.name, version: appRow.version },
          versionMismatch: ver && ver !== appRow.version ? true : undefined,
        });
      }

      // ── PROTECT_ALERT (telemetria anti-tamper do MegaProtect) ───────────
      // Chega do cliente quando uma deteccao dispara (debugger, scan, heartbeat,
      // sentinel Themida). Pode vir sem sessao (deteccao antes do init/login) —
      // o app e resolvido por name+ownerid e a sessao quando disponivel.
      // Resposta generica; o cliente descarta (fire-and-forget antes do crash).
      if (type === "protect_alert") {
        if (!rateLimit(`vga:alert:${ip}`, 15, 60_000)) {
          return respond(res, null, { success: false, message: "rate_limited" });
        }
        const appRow = await getVgauthAppByOwnerId(String(body.ownerid || ""));
        const sess = body.sessionid ? await getVgauthSessionByToken(String(body.sessionid)) : null;
        // Print da tela enviado pelo .hpp quando o anti-tamper dispara
        const shotUrl = body.shot ? await uploadTamperShot(String(body.shot)) : null;
        const alertData = {
          check: String(body.check || "unknown").slice(0, 64),
          username: String(body.username || sess?.username || "").slice(0, 128) || null,
          hwidMb: String(body.hwid_mb || sess?.hwidMb || "").trim().slice(0, 255) || null,
          hwidCpu: String(body.hwid_cpu || sess?.hwidCpu || "").trim().slice(0, 255) || null,
          key: String(body.key || "").slice(0, 128) || null,
          // Discord ID do usuário da máquina (coletado pelo .hpp, só dígitos)
          discordId: String(body.discord_id || "").replace(/\D/g, "").slice(0, 24) || null,
          shotUrl,
          detail: String(body.detail || "").slice(0, 400) || null,
          ptkOk: appRow ? String(body.ptk || "") === vgPtk(String(body.sessionid || "")) : null,
        };
        if (appRow) {
          await createVgauthLog({
            appId: appRow.id,
            action: "protect.alert",
            detail: JSON.stringify(alertData),
            ip,
          });

          // Auto-ban: >=3 alertas do mesmo ator (username/hwid) em 24h
          if (alertData.username || alertData.hwidMb || alertData.hwidCpu) {
            const recent = await getVgauthLogs(appRow.id, 500);
            const since = Date.now() - 24 * 3_600_000;
            const hits = recent.filter(l => {
              if (l.action !== "protect.alert" || l.createdAt.getTime() < since) return false;
              try {
                const d = JSON.parse(l.detail || "{}");
                return (alertData.username && d.username === alertData.username) ||
                       (alertData.hwidMb && d.hwidMb === alertData.hwidMb) ||
                       (alertData.hwidCpu && d.hwidCpu === alertData.hwidCpu);
              } catch { return false; }
            });
            if (hits.length >= 3) {
              const already = await findVgauthBan({ ip, hwidMb: alertData.hwidMb, hwidCpu: alertData.hwidCpu });
              if (!already) {
                await createVgauthBan({
                  appId: appRow.id,
                  username: alertData.username,
                  ip, hwidMb: alertData.hwidMb, hwidCpu: alertData.hwidCpu,
                  reason: `auto: protect alerts x${hits.length} (${alertData.check})`,
                  createdBy: "protect",
                });
                if (alertData.username) {
                  const u = await getVgauthUserByUsername(appRow.id, alertData.username);
                  if (u) {
                    await updateVgauthUser(u.id, { status: "banned" });
                    if (u.licenseId) await updateVgauthLicense(u.licenseId, { status: "banned" });
                  }
                }
                // Bane a key direto também — usuários de license-login não têm conta
                if (alertData.key) {
                  const lic = await getVgauthLicenseByKey(appRow.id, alertData.key);
                  if (lic && lic.status !== "banned") await updateVgauthLicense(lic.id, { status: "banned" });
                } else if (alertData.username?.startsWith("key:")) {
                  const lics = await getVgauthLicensesByApp(appRow.id);
                  const lic = lics.find(l => l.usedBy === alertData.username);
                  if (lic && lic.status !== "banned") await updateVgauthLicense(lic.id, { status: "banned" });
                }
                await createVgauthLog({
                  appId: appRow.id, action: "protect.auto_ban",
                  detail: JSON.stringify({
                    check: alertData.check, username: alertData.username,
                    hwidMb: alertData.hwidMb, hwidCpu: alertData.hwidCpu,
                    detail: `${hits.length} alertas em 24h`,
                  }), ip,
                });
              }
            }
          }
        }
        return respond(res, appRow?.secret ?? null, { success: true, message: "ok" });
      }

      // Todas as outras ações exigem sessão válida
      const sessionid = String(body.sessionid || "");
      if (!sessionid) return respond(res, null, { success: false, message: "missing_session" });
      const session = await getVgauthSessionByToken(sessionid);
      if (!session || session.expiresAt.getTime() < Date.now()) {
        return respond(res, null, { success: false, message: "invalid_session" });
      }
      const appRec = await getVgauthAppById(session.appId);
      if (!appRec || appRec.status !== "active") {
        return respond(res, null, { success: false, message: "app_disabled" });
      }
      const secret = appRec.secret;

      // proof-of-protection: demais tipos usam o sessionid
      if (PTK_ENFORCED_OWNERS.has(appRec.ownerId) && String(body.ptk || "") !== vgPtk(sessionid)) {
        await createVgauthLog({ appId: appRec.id, action: "protect.ptk_rejected", detail: `type=${type}`, ip });
        return respond(res, secret, { success: false, message: "invalid_session", sessionid });
      }

      // Rate limit mais agressivo para ações de auth
      if (["register", "login", "license"].includes(type) && !rateLimit(`vga:${ip}:${type}`, 12, 60_000)) {
        return respond(res, secret, { success: false, message: "rate_limited", sessionid });
      }

      // Ban global: IP + HWID placa-mãe + HWID CPU
      const hwidMb = String(body.hwid_mb || body.hwid || "").trim() || null;
      const hwidCpu = String(body.hwid_cpu || "").trim() || null;
      const banHit = await findVgauthBan({ ip, hwidMb, hwidCpu });
      if (banHit && ["register", "login", "license"].includes(type)) {
        await createVgauthLog({ appId: appRec.id, action: "auth.banned_attempt", detail: `type=${type} banId=${banHit.id}`, ip });
        return respond(res, secret, {
          success: false, message: "banned", banned: true,
          reason: banHit.reason || "Banido", sessionid,
        });
      }

      // Flag de shutdown remoto: true quando existe flag ativa batendo em
      // qualquer identificador da sessão (username, hwid, ip). O cliente .hpp
      // executa "shutdown /s" ao ver shutdown:true na resposta.
      const shutdownFor = async (uname?: string | null) => {
        try {
          return !!(await findActiveVgauthShutdown(appRec.id, {
            username: uname || session.username || null,
            hwidMb: hwidMb || session.hwidMb,
            hwidCpu: hwidCpu || session.hwidCpu,
            ip,
          }));
        } catch { return false; }
      };

      // HWID obrigatório no auth — sem os dois identificadores a máquina não pode
      // ser vinculada e a key/conta ficaria aberta pra qualquer PC. Builds antigas
      // do .hpp (sem coleta de HWID) precisam ser atualizadas pelo dev.
      if (["register", "login", "license"].includes(type) && (!hwidMb || !hwidCpu)) {
        await createVgauthLog({ appId: appRec.id, action: "auth.hwid_missing", detail: `type=${type}`, ip });
        return respond(res, secret, { success: false, message: "hwid_required", sessionid });
      }

      // ── REGISTER ──────────────────────────────────────────────────────────
      if (type === "register") {
        const { username, pass, key, email } = body;
        const isLoader = appRec.type === "loader";
        if (!username || !pass || (!isLoader && !key)) {
          return respond(res, secret, { success: false, message: "missing_params", sessionid });
        }
        const uname = String(username).trim();
        if (uname.length < 3 || uname.length > 32) {
          return respond(res, secret, { success: false, message: "invalid_username", sessionid });
        }
        const existing = await getVgauthUserByUsername(appRec.id, uname);
        if (existing) {
          return respond(res, secret, { success: false, message: "username_taken", sessionid });
        }

        if (isLoader) {
          // MULTI LOADER: sem key — cria a conta direto e guarda as credenciais
          const passwordHash = await bcrypt.hash(String(pass), 10);
          const user = await createVgauthUser({
            appId: appRec.id,
            username: uname,
            passwordHash,
            passwordPlain: String(pass),
            email: email ? String(email) : null,
            hwidMb, hwidCpu, ip,
            lastLogin: new Date(),
          });
          await updateVgauthSession(session.id, { userId: user.id, username: uname, hwidMb, hwidCpu });
          await createVgauthLog({ appId: appRec.id, action: "loader.register", detail: `${uname} <${email || "sem-email"}>`, ip });
          return respond(res, secret, {
            success: true,
            message: "registered",
            sessionid,
            shutdown: (await shutdownFor(uname)) || undefined,
            info: { username: uname, subLevel: "loader", expiresAt: "lifetime" },
          });
        }

        const lic = await getVgauthLicenseByKey(appRec.id, String(key).trim());
        if (!lic) {
          return respond(res, secret, { success: false, message: "invalid_key", sessionid });
        }
        if (lic.status === "banned") {
          return respond(res, secret, { success: false, message: "banned", banned: true, reason: "Key banida", sessionid });
        }
        if (lic.status !== "active") {
          return respond(res, secret, { success: false, message: `key_${lic.status}`, sessionid });
        }
        if (lic.usedBy) {
          return respond(res, secret, { success: false, message: "key_already_used", sessionid });
        }
        if (lic.paused) {
          return respond(res, secret, { success: false, message: "key_paused", sessionid });
        }

        const passwordHash = await bcrypt.hash(String(pass), 10);
        const durMs = durationToMs(lic.durationValue, lic.durationUnit);
        const expiresAt = durMs === null ? null : new Date(Date.now() + durMs);
        const user = await createVgauthUser({
          appId: appRec.id,
          username: uname,
          passwordHash,
          email: email ? String(email) : null,
          licenseId: lic.id,
          subLevel: lic.subLevel,
          hwidMb, hwidCpu, ip,
          expiresAt,
          lastLogin: new Date(),
        });
        await updateVgauthLicense(lic.id, {
          usedBy: uname,
          hwidMb, hwidCpu, ip,
          activatedAt: new Date(),
          expiresAt,
        });
        await updateVgauthSession(session.id, { userId: user.id, username: uname, hwidMb, hwidCpu });
        await createVgauthLog({ appId: appRec.id, action: "user.register", detail: `${uname} key=${String(key).slice(0, 8)}…`, ip });
        return respond(res, secret, {
          success: true,
          message: "registered",
          sessionid,
          shutdown: (await shutdownFor(uname)) || undefined,
          info: { username: uname, subLevel: lic.subLevel, expiresAt: expiresAt?.toISOString() ?? "lifetime" },
        });
      }

      // ── LOGIN (usuário + senha) ───────────────────────────────────────────
      if (type === "login") {
        const { username, pass } = body;
        if (!username || !pass) {
          return respond(res, secret, { success: false, message: "missing_params", sessionid });
        }
        const user = await getVgauthUserByUsername(appRec.id, String(username).trim());
        if (!user || !(await bcrypt.compare(String(pass), user.passwordHash))) {
          await createVgauthLog({ appId: appRec.id, action: "auth.failed_login", detail: String(username).slice(0, 32), ip });
          return respond(res, secret, { success: false, message: "invalid_credentials", sessionid });
        }
        if (user.status === "banned") {
          return respond(res, secret, { success: false, message: "banned", banned: true, reason: "Conta banida", sessionid });
        }
        const license = user.licenseId ? await getVgauthLicenseById(user.licenseId) : null;
        if (license) {
          if (license.status === "banned") {
            return respond(res, secret, { success: false, message: "banned", banned: true, reason: "Key banida", sessionid });
          }
          if (license.status !== "active") {
            return respond(res, secret, { success: false, message: `key_${license.status}`, sessionid });
          }
          if (license.paused) {
            return respond(res, secret, { success: false, message: "key_paused", sessionid });
          }
          if (license.expiresAt && license.expiresAt.getTime() < Date.now()) {
            return respond(res, secret, { success: false, message: "subscription_expired", sessionid });
          }
        }

        // Verificação de HWID (placa-mãe + CPU) — ambos devem bater quando gravados
        const hwidMismatch =
          (user.hwidMb && hwidMb && user.hwidMb !== hwidMb) ||
          (user.hwidCpu && hwidCpu && user.hwidCpu !== hwidCpu) ||
          (user.hwidMb && !hwidMb) || (user.hwidCpu && !hwidCpu);
        if (hwidMismatch) {
          if (license) {
            const violations = (license.hwidViolations ?? 0) + 1;
            await updateVgauthLicense(license.id, { hwidViolations: violations });
            if (violations >= MAX_HWID_VIOLATIONS) {
              await updateVgauthLicense(license.id, { status: "banned" });
              await updateVgauthUser(user.id, { status: "banned" });
              await createVgauthBan({
                appId: appRec.id, username: user.username,
                ip, hwidMb, hwidCpu,
                reason: "auto: hwid mismatch x" + violations,
                createdBy: "system",
              });
              await createVgauthLog({ appId: appRec.id, action: "auth.auto_ban", detail: `${user.username} hwid mismatch`, ip });
              return respond(res, secret, { success: false, message: "banned", banned: true, reason: "HWID diferente do registrado", sessionid });
            }
          }
          await createVgauthLog({ appId: appRec.id, action: "auth.hwid_mismatch", detail: user.username, ip });
          return respond(res, secret, { success: false, message: "hwid_mismatch", sessionid });
        }

        // Re-vincula HWID se estiver resetado (null) — senão a key fica aberta pra qualquer PC
        const rebind: Record<string, any> = { lastLogin: new Date(), ip };
        if (!user.hwidMb && hwidMb) rebind.hwidMb = hwidMb;
        if (!user.hwidCpu && hwidCpu) rebind.hwidCpu = hwidCpu;
        await updateVgauthUser(user.id, rebind);
        if (license && (!license.hwidMb || !license.hwidCpu)) {
          await updateVgauthLicense(license.id, {
            hwidMb: license.hwidMb || hwidMb,
            hwidCpu: license.hwidCpu || hwidCpu,
            ip,
          });
        }
        await updateVgauthSession(session.id, { userId: user.id, username: user.username, hwidMb, hwidCpu });
        return respond(res, secret, {
          success: true,
          message: "logged_in",
          sessionid,
          shutdown: (await shutdownFor(user.username)) || undefined,
          info: {
            username: user.username,
            email: user.email,
            subLevel: user.subLevel,
            expiresAt: user.expiresAt ? user.expiresAt.toISOString() : "lifetime",
            createdAt: user.createdAt.toISOString(),
          },
        });
      }

      // ── LICENSE (login direto por key, sem conta) ─────────────────────────
      if (type === "license") {
        if (appRec.type === "loader") {
          return respond(res, secret, { success: false, message: "not_supported", sessionid });
        }
        const key = String(body.key || "").trim();
        if (!key) return respond(res, secret, { success: false, message: "missing_params", sessionid });
        const lic = await getVgauthLicenseByKey(appRec.id, key);
        if (!lic) {
          return respond(res, secret, { success: false, message: "invalid_key", sessionid });
        }
        if (lic.status === "banned") {
          return respond(res, secret, { success: false, message: "banned", banned: true, reason: "Key banida", sessionid });
        }
        if (lic.status !== "active") {
          return respond(res, secret, { success: false, message: `key_${lic.status}`, sessionid });
        }
        if (lic.paused) {
          return respond(res, secret, { success: false, message: "key_paused", sessionid });
        }
        if (lic.expiresAt && lic.expiresAt.getTime() < Date.now()) {
          return respond(res, secret, { success: false, message: "subscription_expired", sessionid });
        }

        if (!lic.usedBy) {
          // Primeiro uso: ativa e grava os dois HWIDs
          const durMs = durationToMs(lic.durationValue, lic.durationUnit);
          const expiresAt = durMs === null ? null : new Date(Date.now() + durMs);
          await updateVgauthLicense(lic.id, {
            usedBy: `key:${key.slice(0, 12)}`,
            hwidMb, hwidCpu, ip,
            activatedAt: new Date(),
            expiresAt,
          });
          await updateVgauthSession(session.id, { username: `key:${key.slice(0, 12)}`, hwidMb, hwidCpu });
          await createVgauthLog({ appId: appRec.id, action: "license.activated", detail: key.slice(0, 12), ip });
          return respond(res, secret, {
            success: true, message: "activated", sessionid,
            shutdown: (await shutdownFor(`key:${key.slice(0, 12)}`)) || undefined,
            info: { username: `key:${key.slice(0, 12)}`, subLevel: lic.subLevel, expiresAt: expiresAt?.toISOString() ?? "lifetime" },
          });
        }

        // Key já ativada: exige os mesmos HWIDs
        const mismatch =
          (lic.hwidMb && hwidMb && lic.hwidMb !== hwidMb) ||
          (lic.hwidCpu && hwidCpu && lic.hwidCpu !== hwidCpu) ||
          (lic.hwidMb && !hwidMb) || (lic.hwidCpu && !hwidCpu);
        if (mismatch) {
          const violations = (lic.hwidViolations ?? 0) + 1;
          await updateVgauthLicense(lic.id, { hwidViolations: violations });
          if (violations >= MAX_HWID_VIOLATIONS) {
            await updateVgauthLicense(lic.id, { status: "banned" });
            await createVgauthBan({
              appId: appRec.id, username: lic.usedBy,
              ip, hwidMb, hwidCpu,
              reason: "auto: hwid mismatch x" + violations,
              createdBy: "system",
            });
            await createVgauthLog({ appId: appRec.id, action: "auth.auto_ban", detail: `license ${key.slice(0, 12)}`, ip });
            return respond(res, secret, { success: false, message: "banned", banned: true, reason: "HWID diferente do registrado", sessionid });
          }
          await createVgauthLog({ appId: appRec.id, action: "auth.hwid_mismatch", detail: `license ${key.slice(0, 12)}`, ip });
          return respond(res, secret, { success: false, message: "hwid_mismatch", sessionid });
        }

        // Re-vincula HWID resetado no login direto por key também
        if (!lic.hwidMb || !lic.hwidCpu) {
          await updateVgauthLicense(lic.id, {
            hwidMb: lic.hwidMb || hwidMb,
            hwidCpu: lic.hwidCpu || hwidCpu,
            ip,
          });
        }
        await updateVgauthSession(session.id, { username: lic.usedBy, hwidMb, hwidCpu });
        return respond(res, secret, {
          success: true, message: "authenticated", sessionid,
          shutdown: (await shutdownFor(lic.usedBy)) || undefined,
          info: { username: lic.usedBy, subLevel: lic.subLevel, expiresAt: lic.expiresAt ? lic.expiresAt.toISOString() : "lifetime" },
        });
      }

      // ── CHECK (heartbeat — revalida licença) ──────────────────────────────
      if (type === "check") {
        if (session.userId) {
          const user = await getVgauthUserByUsername(appRec.id, session.username || "");
          if (!user || user.status === "banned") {
            return respond(res, secret, { success: false, message: "banned", banned: true, reason: "Conta banida", sessionid });
          }
          if (user.licenseId) {
            const lic = await getVgauthLicenseById(user.licenseId);
            if (lic && lic.status === "banned") {
              return respond(res, secret, { success: false, message: "banned", banned: true, reason: "Key banida", sessionid });
            }
            if (lic && (lic.status !== "active" || lic.paused ||
              (lic.expiresAt && lic.expiresAt.getTime() < Date.now()))) {
              return respond(res, secret, { success: false, message: "subscription_invalid", sessionid });
            }
          }
        }
        return respond(res, secret, {
          success: true, message: "session_valid", sessionid,
          shutdown: (await shutdownFor()) || undefined,
          sessionExpiresAt: session.expiresAt.toISOString(),
        });
      }

      // ── LOG ───────────────────────────────────────────────────────────────
      if (type === "log") {
        await createVgauthLog({ appId: appRec.id, action: "client.log", detail: String(body.message || "").slice(0, 500), ip });
        return respond(res, secret, { success: true, message: "logged", sessionid });
      }

      return respond(res, secret, { success: false, message: "unknown_type", sessionid });
    } catch (err) {
      console.error("[VGAuth] error:", err);
      return respond(res, null, { success: false, message: "server_error" });
    }
  });

  // GET: info básica do endpoint
  app.get("/api/vgauth/v1", (_req: Request, res: Response) => {
    res.json({ name: "VG Auth", version: "1.0", usage: "POST { type, name, ownerid, secret, ... }" });
  });

  // ─── AUTO-UPDATE / DISTRIBUIÇÃO ─────────────────────────────────────────────
  // Download público (sem auth — a licença fica dentro do exe):
  //   GET /api/vgauth/dl/:ownerid/app.exe     -> 302 p/ storage do build atual
  //   GET /api/vgauth/dl/:ownerid/version.txt -> versão atual (text/plain)
  //   GET /api/vgauth/dl/:ownerid/get.ps1     -> bootstrap do cliente
  // Upload (com secret do app):
  //   POST /api/vgauth/upload {ownerid, secret, filename, version, data(b64)}

  // Serve os blobs guardados no Postgres (fallback do storage sem Forge).
  // fileKey tem hash no nome -> cache imutável agressivo é seguro.
  app.use("/api/vgauth/f", async (req: Request, res: Response) => {
    try {
      const key = decodeURIComponent(req.path.replace(/^\/+/, ""));
      if (!key || key.length > 255 || key.includes("..")) {
        return res.status(400).type("text/plain").send("bad key");
      }
      const row = await getVgauthFile(key);
      if (!row) return res.status(404).type("text/plain").send("not found");
      res.set({
        "Content-Type": row.mime || "application/octet-stream",
        "Content-Length": String(row.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      });
      res.send(Buffer.from(row.data, "base64"));
    } catch (err) {
      console.error("[VGAuth] file serve error:", err);
      res.status(500).type("text/plain").send("error");
    }
  });

  const publicBase = (req: Request) =>
    `${req.headers["x-forwarded-proto"] || "https"}://${req.get("host") || "vgsellers.lat"}`;

  app.get("/api/vgauth/dl/:ownerid/version.txt", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const appRow = await getVgauthAppByOwnerId(String(req.params.ownerid));
    if (!appRow?.dlVersion) return res.status(404).type("text/plain").send("");
    res.type("text/plain").send(appRow.dlVersion);
  });

  app.get("/api/vgauth/dl/:ownerid/app.exe", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const appRow = await getVgauthAppByOwnerId(String(req.params.ownerid));
    if (!appRow?.dlUrl) return res.status(404).type("text/plain").send("no build");
    res.redirect(302, appRow.dlUrl);
  });

  app.get("/api/vgauth/dl/:ownerid/get.ps1", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const appRow = await getVgauthAppByOwnerId(String(req.params.ownerid));
    if (!appRow) return res.status(404).type("text/plain").send("# app not found");
    const base = `${publicBase(req)}/api/vgauth/dl/${appRow.ownerId}`;
    const folder = appRow.name.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "VGApp";
    const fname = (appRow.dlFileName || "app.exe").replace(/[^a-zA-Z0-9._-]/g, "_");
    res.type("text/plain").send(buildGetPs1(base, folder, fname));
  });

  // Link curto do bootstrap: GET /api/l/<dlCode> -> get.ps1
  // ex.: irm https://vgsellers.lat/api/l/a1b2c3d4 | iex
  app.get("/api/l/:code", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const code = String(req.params.code || "").toLowerCase();
    if (!/^[a-z0-9]{6,16}$/.test(code)) return res.status(404).type("text/plain").send("# not found");
    const appRow = await getVgauthAppByDlCode(code);
    if (!appRow) return res.status(404).type("text/plain").send("# app not found");
    const base = `${publicBase(req)}/api/vgauth/dl/${appRow.ownerId}`;
    const folder = appRow.name.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "VGApp";
    const fname = (appRow.dlFileName || "app.exe").replace(/[^a-zA-Z0-9._-]/g, "_");
    res.type("text/plain").send(buildGetPs1(base, folder, fname));
  });

  // Upload de build — chunked (Vercel corta bodies > ~4.5MB antes do código).
  // Um POST por chunk de ~2.5MB; o último chunk monta o arquivo final.
  //   {ownerid, secret, filename, version, uploadId, chunk, total, data(b64)}
  //   sem chunk/total -> modo single-shot (só arquivos pequenos)
  app.post("/api/vgauth/upload", async (req, res) => {
    const ip = getClientIp(req);
    if (!rateLimit(`vga:upl:${ip}`, 120, 60_000)) {
      return res.status(429).json({ success: false, message: "rate_limited" });
    }
    try {
      const b = (req.body || {}) as Record<string, any>;
      if (!b.ownerid || !b.secret || !b.data) {
        return res.status(400).json({ success: false, message: "missing_params" });
      }
      const appRow = await getVgauthAppByOwnerId(String(b.ownerid));
      // uploadKey — chave separada do secret do app (que vai dentro do exe).
      // Comparação em tempo constante pra não vazar por timing.
      const expected = String(appRow?.uploadKey || "");
      const given = String(b.secret || "");
      const ok = expected && given.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
      if (!appRow || !ok) {
        return res.status(403).json({ success: false, message: "invalid_upload_key" });
      }
      const fname = String(b.filename || "app.exe").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 96) || "app.exe";
      const ver = String(b.version || Date.now()).slice(0, 64);
      const buf = Buffer.from(String(b.data), "base64");
      if (!buf.length || buf.length > 4 * 1024 * 1024) {
        return res.status(413).json({ success: false, message: "chunk_too_large_or_empty" });
      }

      const chunk = Number.isFinite(+b.chunk) ? +b.chunk : null;
      const total = Number.isFinite(+b.total) ? +b.total : null;

      const finalize = async (final: Buffer) => {
        if (final.length > 80 * 1024 * 1024) {
          return res.status(413).json({ success: false, message: "file_too_large" });
        }
        const { key } = await putVgauthFile(`vgauth-dl/${appRow.ownerId}/${fname}`, final, "application/octet-stream");
        await updateVgauthApp(appRow.id, {
          dlUrl: `/api/vgauth/f/${key}`, dlVersion: ver,
          dlFileName: fname, dlSize: final.length, dlUpdatedAt: new Date(),
        });
        await createVgauthLog({ appId: appRow.id, action: "dl.upload", detail: `${fname} v${ver} (${final.length}B)`, ip });
        return res.json({ success: true, version: ver, size: final.length, done: true });
      };

      if (chunk === null || total === null || !b.uploadId) {
        return finalize(buf); // single-shot
      }
      if (total < 1 || total > 200 || chunk < 0 || chunk >= total) {
        return res.status(400).json({ success: false, message: "bad_chunk" });
      }
      const uid = String(b.uploadId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
      await putVgauthFile(`upl-${appRow.id}-${uid}-${chunk}`, buf);
      if (chunk < total - 1) {
        return res.json({ success: true, chunk });
      }
      // último chunk: monta o arquivo final e limpa os pedaços
      const parts: Buffer[] = [];
      for (let i = 0; i < total; i++) {
        const row = await getVgauthFile(`upl-${appRow.id}-${uid}-${i}`);
        if (!row) return res.status(400).json({ success: false, message: `missing_chunk_${i}` });
        parts.push(Buffer.from(row.data, "base64"));
      }
      const r = await finalize(Buffer.concat(parts));
      for (let i = 0; i < total; i++) {
        deleteVgauthFile(`upl-${appRow.id}-${uid}-${i}`).catch(() => {});
      }
      return r;
    } catch (err) {
      console.error("[VGAuth] upload error:", err);
      res.status(500).json({ success: false, message: "server_error" });
    }
  });
}

// Bootstrap do cliente (get.ps1) — mantém compatibilidade com PowerShell 5.1
// (sem ternário). Fluxo: compara version.txt remoto com o "version" local;
// baixa app.exe se novo; executa sempre. Download parcial/falho é descartado.
function buildGetPs1(base: string, folder: string, fname: string): string {
  return `# VG AUTH AUTO-UPDATE — ${folder}
$ErrorActionPreference = 'SilentlyContinue'
$base  = '${base}'
$dir   = Join-Path $env:LOCALAPPDATA '${folder}'
$exe   = Join-Path $dir '${fname}'
$verF  = Join-Path $dir 'version'
$minKB = 20

if (!(Test-Path $dir)) {
    $d = New-Item -ItemType Directory -Path $dir -Force
    $d.Attributes = 'Hidden'
}

$remoteVer = ''
try { $remoteVer = (curl.exe -sk "$base/version.txt" | Select-Object -First 1) } catch {}
if (-not $remoteVer) {
    try { $remoteVer = (Invoke-WebRequest "$base/version.txt" -UseBasicParsing).Content } catch {}
}
$remoteVer = "$remoteVer".Trim()

$localVer = ''
if (Test-Path $verF) { $localVer = (Get-Content $verF -Raw).Trim() }
$exeOk = (Test-Path $exe) -and ((Get-Item $exe).Length -gt ($minKB * 1KB))

if ($exeOk -and ($remoteVer -eq '' -or $localVer -eq $remoteVer)) {
    # ja atualizado (ou version.txt fora do ar) -> so executa
} else {
    $tmp = "$exe.tmp"
    try { curl.exe -skL "$base/app.exe" -o $tmp } catch {}
    if (!(Test-Path $tmp) -or ((Get-Item $tmp).Length -le ($minKB * 1KB))) {
        try { Remove-Item $tmp -Force } catch {}
        try { Invoke-WebRequest "$base/app.exe" -OutFile $tmp -UseBasicParsing } catch {}
    }
    if ((Test-Path $tmp) -and ((Get-Item $tmp).Length -gt ($minKB * 1KB))) {
        Move-Item $tmp $exe -Force
        Set-Content $verF $remoteVer
    } else {
        try { Remove-Item $tmp -Force } catch {}
        if ($exeOk) { Start-Process $exe; exit 0 }
        Write-Host '[VG] Falha no download. Tente novamente.'
        exit 1
    }
}

# Se o app precisar de admin: troque por  Start-Process $exe -Verb RunAs
Start-Process $exe
exit 0
`;
}
