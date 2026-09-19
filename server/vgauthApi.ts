import type { Express, Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  createVgauthBan,
  createVgauthLog,
  createVgauthSession,
  createVgauthUser,
  findVgauthBan,
  getVgauthAppById,
  getVgauthAppByOwnerId,
  getVgauthLicenseById,
  getVgauthLicenseByKey,
  getVgauthSessionByToken,
  getVgauthUserByUsername,
  updateVgauthLicense,
  updateVgauthSession,
  updateVgauthUser,
} from "./db";

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
        return respond(res, secret, { success: false, message: "banned", sessionid });
      }

      // ── REGISTER ──────────────────────────────────────────────────────────
      if (type === "register") {
        const { username, pass, key, email } = body;
        if (!username || !pass || !key) {
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
        const lic = await getVgauthLicenseByKey(appRec.id, String(key).trim());
        if (!lic || lic.status !== "active") {
          return respond(res, secret, { success: false, message: "invalid_key", sessionid });
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
          return respond(res, secret, { success: false, message: "banned", sessionid });
        }
        const license = user.licenseId ? await getVgauthLicenseById(user.licenseId) : null;
        if (license) {
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
              return respond(res, secret, { success: false, message: "banned", sessionid });
            }
          }
          await createVgauthLog({ appId: appRec.id, action: "auth.hwid_mismatch", detail: user.username, ip });
          return respond(res, secret, { success: false, message: "hwid_mismatch", sessionid });
        }

        await updateVgauthUser(user.id, { lastLogin: new Date(), ip });
        await updateVgauthSession(session.id, { userId: user.id, username: user.username, hwidMb, hwidCpu });
        return respond(res, secret, {
          success: true,
          message: "logged_in",
          sessionid,
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
        const key = String(body.key || "").trim();
        if (!key) return respond(res, secret, { success: false, message: "missing_params", sessionid });
        const lic = await getVgauthLicenseByKey(appRec.id, key);
        if (!lic || lic.status !== "active") {
          return respond(res, secret, { success: false, message: "invalid_key", sessionid });
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
            return respond(res, secret, { success: false, message: "banned", sessionid });
          }
          await createVgauthLog({ appId: appRec.id, action: "auth.hwid_mismatch", detail: `license ${key.slice(0, 12)}`, ip });
          return respond(res, secret, { success: false, message: "hwid_mismatch", sessionid });
        }

        await updateVgauthSession(session.id, { username: lic.usedBy, hwidMb, hwidCpu });
        return respond(res, secret, {
          success: true, message: "authenticated", sessionid,
          info: { username: lic.usedBy, subLevel: lic.subLevel, expiresAt: lic.expiresAt ? lic.expiresAt.toISOString() : "lifetime" },
        });
      }

      // ── CHECK (heartbeat — revalida licença) ──────────────────────────────
      if (type === "check") {
        if (session.userId) {
          const user = await getVgauthUserByUsername(appRec.id, session.username || "");
          if (!user || user.status === "banned") {
            return respond(res, secret, { success: false, message: "banned", sessionid });
          }
          if (user.licenseId) {
            const lic = await getVgauthLicenseById(user.licenseId);
            if (lic && (lic.status !== "active" || lic.paused ||
              (lic.expiresAt && lic.expiresAt.getTime() < Date.now()))) {
              return respond(res, secret, { success: false, message: "subscription_invalid", sessionid });
            }
          }
        }
        return respond(res, secret, {
          success: true, message: "session_valid", sessionid,
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
}
