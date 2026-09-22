                                                                                                                                                                                                                                                                                                                                                                                  import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { keyauthCreateLicense, keyauthFetchKeyInfo } from "./keyauth";
import { acquireLicenseKeyValues } from "./keyFulfillment";
import { calcDiscount } from "./resellerPricing";
import { checkPurinPaymentStatus, processPurinPaymentUpdate } from "./purinCashWebhook";
import { storagePut } from "./storage";
import {
  getAdminByUsername, getAdminById, createAdmin,
  getResellerByUsername, getResellerById, getAllResellers, createReseller, updateReseller, updateResellerCredits, deleteResellerById, getResellersByParentId, purgeResellerPurchases,
  getSubResellerKeyStats, getSubResellerKeyLogs, getResellerKeyStatsByType,
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getAllApps, getAppById, getAppByName, getAppByNameLike, createApp, updateApp, deleteApp,
  getDashboardKeysByMonth, getDashboardTopApps,
  getPlansByAppId, getPlanById, createPlan, updatePlan, deletePlan,
  getAppsByResellerId, assignAppToReseller, removeAppFromReseller, getAssignedAppIds,
  getKeysByResellerId, getKeysByResellerIdWithApp, getAllKeys, getAllKeysWithReseller, getKeyById, getKeyByValue, createLicenseKey, updateLicenseKey, deleteLicenseKeysByValues,
  countKeysByReseller, transferResellerKeys,
  getTransactionsByResellerId, createCreditTransaction,
  getAllIpWhitelist, addIpToWhitelist, removeIpFromWhitelist, isIpWhitelisted,
  listResellerApiKeys, createResellerApiKey, revokeResellerApiKey,
  isAdminIpAllowed, normalizeIp,
  updateAdminPassword, updateResellerPassword,
  createPixPayment, getPixPaymentByPaymentId, updatePixPaymentStatus,
  getPendingPixPaymentsByReseller, getPixPaymentsByReseller,
                                                                                                                                                                                                                                        getTicketsByResellerId, getAllTickets, getTicketById, createTicket, updateTicketStatus, updateTicketTimestamp, deleteTicket,
                                                                                                                                                                                                                                        getTicketMessages, createTicketMessage,
  getAvailableStockForPlan, reserveStockForReseller, addStockBatch, getStockByApp, getStockCountsByApp, deleteStock,
  getDownloadsByAppId, getDownloadById, createAppDownload, updateAppDownload, deleteAppDownload,
  getResellerKeysByMonth, getResellerKeysByApp,
  createResellerApplication, getResellerApplicationById, getResellerApplicationByEmail, getAllResellerApplications,
  updateResellerApplicationStatus, updateResellerApplicationTimestamp, deleteResellerApplication,
  getApplicationMessages, createApplicationMessage,
  createSupportTicket, getSupportTicketById, getAllSupportTickets,
  updateSupportTicketStatus, updateSupportTicketTimestamp, deleteSupportTicket,
  getSupportMessages, createSupportMessage,
  getOtherStoreResellers, createOtherStoreReseller, updateOtherStoreReseller, deleteOtherStoreReseller,
  getOtherStoreResellerById, getOtherStoreResellerByResellerId, getOtherStoreResellerByOwnerResellerId, getOtherStoreHwidsByResellerId,
  createOtherStoreHwid, deleteOtherStoreHwid,
  getAllResellerInfoProducts, getActiveResellerInfoProducts, createResellerInfoProduct, updateResellerInfoProduct, deleteResellerInfoProduct,
  getAllVgauthApps, getVgauthAppById, createVgauthApp, updateVgauthApp, deleteVgauthApp,
  getVgauthLicensesByApp, getVgauthLicenseById, getVgauthLicenseByKeyValue, createVgauthLicense, updateVgauthLicense, deleteVgauthLicense,
  pauseAllVgauthLicenses, resumeAllVgauthLicenses, addDaysAllVgauthLicenses,
  getVgauthUsersByApp, getVgauthUserByUsername, updateVgauthUser, deleteVgauthUser,
  getVgauthBans, createVgauthBan, deleteVgauthBan,
  getVgauthLogs, createVgauthLog,
} from "./db";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "JWT_SECRET não configurado. Configure a variável de ambiente para continuar.",
    });
  }
  return new TextEncoder().encode(secret);
}

export const CUSTOM_COOKIE = "cv_session";

/** Extract Pix BR code and QR code image from different PurinCash response shapes */
function extractPixData(data: any) {
  return {
    paymentId: data?.paymentId,
    amountCents: data?.amountCents,
    expiresAt: data?.expiresAt,
    brCode:
      data?.pix?.brCode ||
      data?.pix?.copiaECola ||
      data?.pix?.copia_e_cola ||
      data?.brCode ||
      data?.br_code ||
      data?.copiaECola ||
      null,
    qrCodeImage:
      data?.pix?.qrCodeImage ||
      data?.pix?.qrCodeBase64 ||
      data?.pix?.qr_code ||
      data?.qrCodeImage ||
      data?.qrCodeBase64 ||
      data?.qrCode ||
      data?.qr_code ||
      null,
  };
}

/** Extract the real client IP from all common proxy headers, normalized to IPv4 */
function getClientIp(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  const h = req.headers;
  // Priority: Cloudflare real IP > x-real-ip > first entry of x-forwarded-for > socket
  // cf-connecting-ip is the most reliable when behind Cloudflare proxy
  const candidates = [
    (h["cf-connecting-ip"] as string) || "",
    (h["true-client-ip"] as string) || "",
    (h["x-real-ip"] as string) || "",
    ((h["x-forwarded-for"] as string) || "").split(",")[0].trim(),
    (h["x-client-ip"] as string) || "",
    req.socket?.remoteAddress || "",
  ];
  const raw = candidates.find(c => c && c.length > 0) || "";
  return normalizeIp(raw);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Formato padrão das keys: ***t**-***m**-*****k
// O KeyAuth usa asterisco (*) como wildcard na máscara
const DEFAULT_KEY_MASK = "***t**-***m**-*****k";

function generateKeyValue(prefix: string, mask?: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const activeMask = mask || DEFAULT_KEY_MASK;
  // Substitui apenas os asteriscos por caracteres aleatórios, mantendo letras fixas
  return activeMask.replace(/\*/g, () => chars[Math.floor(Math.random() * chars.length)]);
}

async function uploadBase64Image(base64: string, folder = "tickets"): Promise<string | null> {
  try {
    const match = base64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return null;
    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    const ext = contentType.split("/")[1] || "png";
    const { url } = await storagePut(`${folder}/${Date.now()}.${ext}`, buffer, contentType);
    return url;
  } catch (err) {
    console.error("[Upload] failed:", err);
    return null;
  }
}

// ─── KeyAuth Seller API ───────────────────────────────────────────────────────
const KEYAUTH_SELLER_KEY = ENV.keyauthSellerKey;

async function keyauthResetHwid(sellerKey: string, username: string): Promise<void> {
  const url = new URL("https://keyauth.win/api/seller/");
  url.searchParams.set("sellerkey", sellerKey);
  url.searchParams.set("type", "resetuser");
  url.searchParams.set("user", username);
  url.searchParams.set("format", "json");
  const res = await fetch(url.toString());
  const data = await res.json() as any;
  if (!data.success) {
    console.warn("[KeyAuth] HWID reset warning:", data.message);
  }
}

// Verifica se a key pertence ao reseller ou a um sub-reseller dele
async function resellerOwnsKey(resellerId: number, key: { resellerId: number }): Promise<boolean> {
  if (key.resellerId === resellerId) return true;
  const owner = await getResellerById(key.resellerId);
  return owner?.parentResellerId === resellerId;
}

// Reseta HWID na API externa do PUB EMU (Axo) — funciona para qualquer key,
// mesmo que não exista no banco local (vendida fora do painel, etc)
async function resetPubEmuHwidExternal(keyValue: string) {
  const PUB_EMU_API_URL = "https://resellers.axovgc.site/api/v1/reset";
  // Tenta a env primeiro; se estiver inválida (401), usa a chave fallback
  const apiKeys = [...new Set([ENV.pubEmuApiKey, "axo_02e54e5771b3207c97cf6874258ad0e1957a7e6b89824df9"].filter(Boolean))] as string[];
  let lastError = "";
  for (const apiKey of apiKeys) {
    try {
      const url = new URL(PUB_EMU_API_URL);
      url.searchParams.set("apikey", apiKey);
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: keyValue, product: "PUB EMU" }),
      });
      const text = await response.text();
      if (response.status === 401) {
        console.warn("[PUB EMU HWID Reset] 401 com uma das chaves, tentando próxima:", text);
        lastError = `${response.status} ${text}`;
        continue;
      }
      if (!response.ok) {
        console.error("[PUB EMU HWID Reset] error:", response.status, text);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Erro na API de reset HWID: ${response.status} ${text}` });
      }
      try {
        const data = JSON.parse(text);
        if (data && data.success === false) {
          const msg = data.message || data.error || "Falha ao resetar no provedor";
          console.error("[PUB EMU HWID Reset] provider soft-fail:", msg);
          throw new TRPCError({ code: "BAD_REQUEST", message: `API PUB EMU: ${msg}` });
        }
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        // resposta não-JSON com 200 = sucesso
      }
      console.log("[PUB EMU HWID Reset] success:", text);
      lastError = "";
      break;
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      console.error("[PUB EMU HWID Reset] failed:", err);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Falha ao resetar HWID na API externa: ${err}` });
    }
  }
  if (lastError) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Erro na API de reset HWID: ${lastError}` });
  }
}

// Reseta HWID localmente, no KeyAuth e na API externa do PUB EMU (quando aplicável)
async function performHwidReset(key: { id: number; appId: number; keyValue: string; usedBy: string | null }) {
  await updateLicenseKey(key.id, { hwid: null });

  const app = await getAppById(key.appId);

  // Resetar HWID no KeyAuth se o usuário estiver registrado
  if (key.usedBy) {
    const sellerKey = (app as any)?.keyauthSellerKey || KEYAUTH_SELLER_KEY;
    try {
      await keyauthResetHwid(sellerKey, key.usedBy);
    } catch (err) {
      console.warn("[KeyAuth] HWID reset failed (non-critical):", err);
    }
  }

  // Resetar HWID do PUB EMU na API externa
  const appName = (app?.name || "").toUpperCase();
  if (appName === "PUB EMU" || appName === "PUBEMU" || appName === "EMULATOR PUBLIC") {
    await resetPubEmuHwidExternal(key.keyValue);
  }
}

export async function signCustomJwt(payload: object) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyCustomJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}

export function getCustomToken(req: any): string | null {
  const cookieHeader = req.headers?.cookie || "";
  const match = cookieHeader.match(new RegExp(`${CUSTOM_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}

// ─── Rate limit simples por IP para logins ─────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  if (now - record.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  record.count++;
  return true;
}

// ─── Auth Router ──────────────────────────────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),

  adminLogin: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const clientIp = getClientIp(ctx.req);
      if (!checkLoginRateLimit(clientIp)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas tentativas. Tente novamente em 15 minutos." });
      }
      const admin = await getAdminByUsername(input.username);
      if (!admin) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      // IP whitelist check for admin login (por usuário: entries com userId só valem p/ aquele admin)
      const ipAllowed = await isAdminIpAllowed(clientIp, admin.id);
      if (!ipAllowed) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado: IP nao autorizado" });
      const valid = await bcrypt.compare(input.password, admin.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      const token = await signCustomJwt({ sub: String(admin.id), role: "admin", adminRole: admin.role || "full", username: admin.username });
      ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: 7 * 24 * 3600 * 1000 });
      return { success: true, role: "admin" as const, adminRole: admin.role || "full", username: admin.username };
    }),

  resellerLogin: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
      remember: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const clientIp = getClientIp(ctx.req);
      if (!checkLoginRateLimit(clientIp)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas tentativas. Tente novamente em 15 minutos." });
      }
      // Check admin credentials first — admin can log in via reseller form
      const admin = await getAdminByUsername(input.username);
      if (admin) {
        const validAdmin = await bcrypt.compare(input.password, admin.passwordHash);
        if (validAdmin) {
          // IP whitelist check for admin login
          const clientIp = getClientIp(ctx.req);
          const ipAllowed = await isAdminIpAllowed(clientIp, admin.id);
          if (!ipAllowed) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado: IP nao autorizado" });
          const token = await signCustomJwt({ sub: String(admin.id), role: "admin", adminRole: admin.role || "full", username: admin.username });
          const maxAge = (input.remember ? 30 * 24 * 3600 : 7 * 24 * 3600) * 1000;
          ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge });
          return { success: true, role: "admin" as const, adminRole: admin.role || "full", username: admin.username };
        }
      }
      // Otherwise try reseller login
      const reseller = await getResellerByUsername(input.username);
      if (!reseller) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      if (reseller.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Conta desativada" });
      const valid = await bcrypt.compare(input.password, reseller.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      await updateReseller(reseller.id, { lastLoginAt: new Date() });
      const otherStoreOwnerId = reseller.parentResellerId ?? reseller.id;
      const otherStore = await getOtherStoreResellerByOwnerResellerId(otherStoreOwnerId);
      const tokenPayload: Record<string, any> = { sub: String(reseller.id), role: "reseller", username: reseller.username };
      if (otherStore && otherStore.resellerId === reseller.id) {
        tokenPayload.otherStoreId = otherStore.id;
      }
      const token = await signCustomJwt(tokenPayload);
      const maxAge = (input.remember ? 30 * 24 * 3600 : 7 * 24 * 3600) * 1000;
      ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge });
      return { success: true, role: "reseller" as const, username: reseller.username };
    }),


  session: publicProcedure.query(async ({ ctx }) => {
    const token = getCustomToken(ctx.req);
    if (!token) return null;
    const payload = await verifyCustomJwt(token);
    if (!payload) return null;
    const id = parseInt(payload.sub as string);
    if (payload.role === "admin") {
      const admin = await getAdminById(id);
      if (!admin) return null;
      return { id: admin.id, username: admin.username, role: "admin" as const, adminRole: (admin.role || "full") as "full" | "support" };
    } else {
      const reseller = await getResellerById(id);
      if (!reseller) return null;
      const otherStoreId = (payload?.otherStoreId as number | undefined) ?? null;
      const otherStore = otherStoreId ? await getOtherStoreResellerById(otherStoreId) : null;
      return {
        id: reseller.id, username: reseller.username, role: "reseller" as const,
        credits: reseller.credits, discountPercent: reseller.discountPercent,
        totalPurchases: reseller.totalPurchases, status: reseller.status,
        resellerType: reseller.resellerType,
        canCreateSubResellers: reseller.canCreateSubResellers,
        otherStore: otherStore ? {
          id: otherStore.id,
          label: otherStore.label,
          splitPercent: otherStore.splitPercent,
        } : null,
      };
    }
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(CUSTOM_COOKIE, getSessionCookieOptions(ctx.req));
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  // Bootstrap: create first admin if none exists
  setupAdmin: publicProcedure
    .input(z.object({ username: z.string().min(3), password: z.string().min(6), setupKey: z.string() }))
    .mutation(async ({ input }) => {
      if (!ENV.adminSetupKey || input.setupKey !== ENV.adminSetupKey) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Chave de setup inválida" });
      }
      const existing = await getAdminByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Admin já existe" });
      const passwordHash = await bcrypt.hash(input.password, 10);
      await createAdmin({ username: input.username, passwordHash });
      return { success: true };
    }),

  // ─── Reseller Applications (public) ───────────────────────────────────────────
  submitResellerApplication: publicProcedure
    .input(z.object({
      discordLink: z.string().min(1),
      discordId: z.string().min(1),
      email: z.string().email(),
      product: z.string().min(1),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const ip = getClientIp(ctx.req);
      const existing = await getResellerApplicationByEmail(input.email);
      if (existing && ["pending", "pre_approved"].includes(existing.status)) {
        throw new TRPCError({ code: "CONFLICT", message: "Você já possui uma aplicação em andamento" });
      }
      const row = await createResellerApplication({
        ...input,
        status: "pre_approved",
        ip,
      });
      return { id: row.id, status: row.status };
    }),

  getMyApplication: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const app = await getResellerApplicationById(input.id);
      if (!app) return null;
      const messages = await getApplicationMessages(input.id);
      return { ...app, messages };
    }),

  sendApplicationMessage: publicProcedure
    .input(z.object({
      applicationId: z.number(),
      message: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const app = await getResellerApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.status === "archived" || app.status === "rejected") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Aplicação arquivada ou rejeitada" });
      }
      const msg = await createApplicationMessage({
        applicationId: input.applicationId,
        senderType: "applicant",
        message: input.message,
      });
      await updateResellerApplicationTimestamp(input.applicationId);
      return msg;
    }),

  // ─── Public Support Tickets (dúvidas) ─────────────────────────────────────────
  submitSupportTicket: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      email: z.string().email(),
      subject: z.string().min(1).max(256),
      question: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const ip = getClientIp(ctx.req);
      const row = await createSupportTicket({ ...input, status: "open", ip });
      await createSupportMessage({
        ticketId: row.id,
        senderType: "user",
        message: input.question,
      });
      return { id: row.id, status: row.status };
    }),

  getMySupportTicket: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const ticket = await getSupportTicketById(input.id);
      if (!ticket) return null;
      const messages = await getSupportMessages(input.id);
      return { ...ticket, messages };
    }),

  sendSupportMessage: publicProcedure
    .input(z.object({
      ticketId: z.number(),
      message: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const ticket = await getSupportTicketById(input.ticketId);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      if (ticket.status === "archived" || ticket.status === "closed") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Ticket fechado ou arquivado" });
      }
      const msg = await createSupportMessage({
        ticketId: input.ticketId,
        senderType: "user",
        message: input.message,
      });
      await updateSupportTicketTimestamp(input.ticketId);
      return msg;
    }),

  // ─── Página pública /resellerinfo — lista de produtos ─────────────────────────
  listResellerInfo: publicProcedure
    .query(async () => {
      return getActiveResellerInfoProducts();
    }),
});

// ─── Admin middleware ─────────────────────────────────────────────────────────
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = getCustomToken(ctx.req);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
  const payload = await verifyCustomJwt(token);
  if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  // Conta de suporte não acessa o admin completo
  if (payload.adminRole === "support") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao suporte" });
  return next({ ctx: { ...ctx, adminId: parseInt(payload.sub as string) } });
});

// Suporte: acesso limitado — tickets, dúvidas, license keys e entrega manual
const supportProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = getCustomToken(ctx.req);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
  const payload = await verifyCustomJwt(token);
  if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, adminId: parseInt(payload.sub as string), adminRole: payload.adminRole || "full" } });
});

// ─── Reseller middleware ──────────────────────────────────────────────────────
const resellerProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = getCustomToken(ctx.req);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
  const payload = await verifyCustomJwt(token);
  if (!payload || payload.role !== "reseller") throw new TRPCError({ code: "FORBIDDEN" });
  const resellerId = parseInt(payload.sub as string);
  const reseller = await getResellerById(resellerId);
  if (!reseller || reseller.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Conta desativada" });
  const otherStoreOwnerId = reseller.parentResellerId ?? reseller.id;
  const otherStore = await getOtherStoreResellerByOwnerResellerId(otherStoreOwnerId);
  return next({ ctx: { ...ctx, resellerId, reseller, otherStore } });
});

// ─── Admin Router ─────────────────────────────────────────────────────────────
const adminRouter = router({
  // Resellers
  listResellers: supportProcedure.query(async () => {
    const list = await getAllResellers();
    return list.map(r => ({ ...r, passwordHash: undefined }));
  }),

  resellerStats: adminProcedure
    .query(async () => {
      const [credits, percentage, other] = await Promise.all([
        getResellerKeyStatsByType("credits"),
        getResellerKeyStatsByType("percentage"),
        getResellerKeyStatsByType("other"),
      ]);
      return { credits, percentage, other };
    }),

  dashboardStats: adminProcedure
    .query(async () => {
      const [resellers, apps, allKeys, months, topApps] = await Promise.all([
        getAllResellers(),
        getAllApps(),
        getAllKeys(),
        getDashboardKeysByMonth(),
        getDashboardTopApps(),
      ]);
      const appsById = new Map(apps.map(a => [a.id, a]));
      const activeResellers = resellers.filter(r => r.status === "active").length;
      const activeKeys = allKeys.filter(k => k.status === "active").length;
      const usedKeys = allKeys.filter(k => k.status === "used").length;
      const totalCredits = allKeys.reduce((sum, k) => sum + (parseFloat(String(k.creditsSpent)) || 0), 0);
      return {
        counts: { resellers: resellers.length, activeResellers, apps: apps.length, keys: allKeys.length, activeKeys, usedKeys, totalCredits: totalCredits.toFixed(2) },
        months,
        topApps: topApps.map(a => ({ ...a, appName: appsById.get(a.appId)?.name || `App #${a.appId}` })),
      };
    }),

  createReseller: adminProcedure
    .input(z.object({
      username: z.string().min(3).max(64),
      password: z.string().min(6),
      email: z.string().email().optional(),
      location: z.string().optional(),
      resellerType: z.enum(["credits", "percentage", "other"]).default("credits"),
      canCreateSubResellers: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const existing = await getResellerByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username já existe" });
      const passwordHash = await bcrypt.hash(input.password, 10);
      await createReseller({
        username: input.username,
        passwordHash,
        email: input.email,
        location: input.location,
        resellerType: input.resellerType,
        canCreateSubResellers: input.canCreateSubResellers,
      });
      return { success: true };
    }),

  updateReseller: adminProcedure
    .input(z.object({
      id: z.number(),
      email: z.string().email().optional().nullable(),
      location: z.string().optional().nullable(),
      status: z.enum(["active", "inactive", "banned"]).optional(),
      password: z.string().min(6).optional(),
      resellerType: z.enum(["credits", "percentage", "other"]).optional(),
      discountPercent: z.number().min(0).max(100).optional(),
      canCreateSubResellers: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, password, discountPercent, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (password) data.passwordHash = await bcrypt.hash(password, 10);
      if (discountPercent !== undefined) data.discountPercent = discountPercent.toFixed(2);
      await updateReseller(id, data as any);
      return { success: true };
    }),

  addCredits: adminProcedure
    .input(z.object({ resellerId: z.number(), amount: z.number().positive(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      const reseller = await getResellerById(input.resellerId);
      if (!reseller) throw new TRPCError({ code: "NOT_FOUND" });
      const before = parseFloat(reseller.credits as string);
      const after = before + input.amount;
      await updateReseller(input.resellerId, { credits: after.toFixed(2) });
      await createCreditTransaction({
        resellerId: input.resellerId, type: "add", amount: input.amount.toFixed(2),
        balanceBefore: before.toFixed(2), balanceAfter: after.toFixed(2),
        description: input.description || "Créditos adicionados pelo admin",
      });
      return { success: true, newBalance: after };
    }),

  // Apaga todas as keys do reseller + logs de compra e recalcula o faturamento
  purgeResellerPurchases: adminProcedure
    .input(z.object({ resellerId: z.number(), confirmUsername: z.string() }))
    .mutation(async ({ input }) => {
      const reseller = await getResellerById(input.resellerId);
      if (!reseller) throw new TRPCError({ code: "NOT_FOUND" });
      if (input.confirmUsername !== reseller.username) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Confirmação incorreta — digite o username exato" });
      }
      return purgeResellerPurchases(input.resellerId);
    }),

  // Categories
  listCategories: adminProcedure.query(() => getAllCategories()),

  createCategory: adminProcedure
    .input(z.object({ name: z.string().min(2), description: z.string().optional() }))
    .mutation(async ({ input }) => { await createCategory(input); return { success: true }; }),

  updateCategory: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().min(2).optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => { const { id, ...data } = input; await updateCategory(id, data); return { success: true }; }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await deleteCategory(input.id); return { success: true }; }),

  // Apps
  listApps: supportProcedure.query(() => getAllApps()),

  getApp: supportProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const app = await getAppById(input.id);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      const plans = await getPlansByAppId(input.id);
      return { ...app, plans };
    }),

  createApp: adminProcedure
    .input(z.object({
      name: z.string().min(2), description: z.string().optional(),
      version: z.string().optional(), categoryId: z.number().optional(),
      maxUsers: z.number().optional(), features: z.string().optional(),
      keyauthSellerKey: z.string().length(32).optional(),
      keyMask: z.string().max(64).optional(),
    }))
    .mutation(async ({ input }) => { await createApp(input as any); return { success: true }; }),

  updateApp: adminProcedure
    .input(z.object({
      id: z.number(), name: z.string().optional(), description: z.string().optional(),
      version: z.string().optional(), categoryId: z.number().optional().nullable(),
      status: z.enum(["active", "inactive"]).optional(),
      maxUsers: z.number().optional(), features: z.string().optional(),
      keyauthSellerKey: z.string().length(32).optional().nullable(),
      keyMask: z.string().max(64).optional().nullable(),
    }))
    .mutation(async ({ input }) => { const { id, ...data } = input; await updateApp(id, data as any); return { success: true }; }),

  deleteApp: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await deleteApp(input.id); return { success: true }; }),

  // Plans
  createPlan: adminProcedure
    .input(z.object({
      appId: z.number(), name: z.string(), durationDays: z.number().positive(),
      priceCredits: z.number().positive(),
      pricePercentage: z.number().min(0).optional(),
      resellerSellingPrice: z.number().min(0).optional(),
      level: z.enum(["basic", "premium", "lifetime"]).optional(),
    }))
    .mutation(async ({ input }) => {
      await createPlan({
        ...input,
        priceCredits: input.priceCredits.toFixed(2),
        pricePercentage: (input.pricePercentage ?? 0).toFixed(2),
        resellerSellingPrice: (input.resellerSellingPrice ?? 0).toFixed(2),
      } as any);
      return { success: true };
    }),

  updatePlan: adminProcedure
    .input(z.object({
      id: z.number(), name: z.string().optional(), durationDays: z.number().optional(),
      priceCredits: z.number().optional(),
      pricePercentage: z.number().min(0).optional(),
      resellerSellingPrice: z.number().min(0).optional(),
      level: z.enum(["basic", "premium", "lifetime"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, priceCredits, pricePercentage, resellerSellingPrice, ...rest } = input;
      const data: any = { ...rest };
      if (priceCredits !== undefined) data.priceCredits = priceCredits.toFixed(2);
      if (pricePercentage !== undefined) data.pricePercentage = pricePercentage.toFixed(2);
      if (resellerSellingPrice !== undefined) data.resellerSellingPrice = resellerSellingPrice.toFixed(2);
      await updatePlan(id, data);
      return { success: true };
    }),

  deletePlan: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await deletePlan(input.id); return { success: true }; }),

  // ─── App Stock ────────────────────────────────────────────────────────────────
  addStock: adminProcedure
    .input(z.object({
      appId: z.number(),
      planId: z.number(),
      keys: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const lines = input.keys
        .split("\n")
        .map(k => k.trim())
        .filter(k => k.length > 0);
      if (lines.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma key informada" });
      const batch = lines.map(keyValue => ({
        appId: input.appId,
        planId: input.planId,
        keyValue,
        status: "available" as const,
      }));
      const rows = await addStockBatch(batch);
      const duplicates = lines.length - rows.length;
      return { added: rows.length, duplicates };
    }),

  getStockByApp: adminProcedure
    .input(z.object({ appId: z.number() }))
    .query(async ({ input }) => {
      const [items, counts] = await Promise.all([
        getStockByApp(input.appId),
        getStockCountsByApp(input.appId),
      ]);
      return { items, ...counts };
    }),

  deleteStock: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteStock(input.id);
      return { success: true };
    }),

  // ─── App Downloads ───────────────────────────────────────────────────────────
  getDownloadsByApp: supportProcedure
    .input(z.object({ appId: z.number() }))
    .query(async ({ input }) => {
      return getDownloadsByAppId(input.appId);
    }),

  createAppDownload: supportProcedure
    .input(z.object({
      appId: z.number(),
      type: z.enum(["download", "tutorial"]),
      title: z.string().min(1),
      url: z.string().min(1),
      videoUrl: z.string().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      await createAppDownload(input);
      return { success: true };
    }),

  updateAppDownload: supportProcedure
    .input(z.object({
      id: z.number(),
      type: z.enum(["download", "tutorial"]).optional(),
      title: z.string().min(1).optional(),
      url: z.string().min(1).optional(),
      videoUrl: z.string().optional().nullable(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAppDownload(id, data as any);
      return { success: true };
    }),

  deleteAppDownload: supportProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAppDownload(input.id);
      return { success: true };
    }),

  getAvailableStockForPlan: supportProcedure
    .input(z.object({ appId: z.number(), planId: z.number() }))
    .query(async ({ input }) => {
      return getAvailableStockForPlan(input.appId, input.planId, 1);
    }),

  manualDeliverKey: supportProcedure
    .input(z.object({
      resellerId: z.number(),
      appId: z.number(),
      planId: z.number(),
      keyValue: z.string().min(1),
      stockId: z.number().optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const reseller = await getResellerById(input.resellerId);
      if (!reseller) throw new TRPCError({ code: "NOT_FOUND" });
      const plan = await getPlanById(input.planId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND" });
      const app = await getAppById(input.appId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.stockId) {
        const stock = await reserveStockForReseller(input.stockId, input.resellerId);
        if (!stock) throw new TRPCError({ code: "BAD_REQUEST", message: "Estoque não disponível" });
      }

      await createLicenseKey({
        keyValue: input.keyValue,
        resellerId: input.resellerId,
        appId: input.appId,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
        creditsSpent: "0.00",
        status: "active",
        source: "manual",
        ...(input.note ? { note: input.note } : {}),
      } as any);

      return { success: true };
    }),

  // Assign apps to resellers
  assignApp: adminProcedure
    .input(z.object({ resellerId: z.number(), appId: z.number() }))
    .mutation(async ({ input }) => {
      await assignAppToReseller(input);
      return { success: true };
    }),

  removeApp: adminProcedure
    .input(z.object({ resellerId: z.number(), appId: z.number() }))
    .mutation(async ({ input }) => {
      await removeAppFromReseller(input.resellerId, input.appId);
      return { success: true };
    }),

  getResellerApps: adminProcedure
    .input(z.object({ resellerId: z.number() }))
    .query(async ({ input }) => {
      const assigned = await getAssignedAppIds(input.resellerId);
      const all = await getAllApps();
      return { assigned, all };
    }),

  // All keys
  listAllKeys: supportProcedure.query(() => getAllKeysWithReseller()),

  // Transfer keys between resellers
  resellerKeyCount: adminProcedure
    .input(z.object({
      resellerId: z.number(),
      status: z.enum(["active", "used", "revoked", "expired"]).optional(),
    }))
    .query(async ({ input }) => ({
      count: await countKeysByReseller(input.resellerId, input.status),
    })),

  transferKeys: adminProcedure
    .input(z.object({
      fromResellerId: z.number(),
      toResellerId: z.number(),
      status: z.enum(["active", "used", "revoked", "expired"]).optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.fromResellerId === input.toResellerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Origem e destino são o mesmo revendedor" });
      }
      const [from, to] = await Promise.all([
        getResellerById(input.fromResellerId),
        getResellerById(input.toResellerId),
      ]);
      if (!from || !to) throw new TRPCError({ code: "NOT_FOUND", message: "Revendedor não encontrado" });
      const transferred = await transferResellerKeys(input.fromResellerId, input.toResellerId, input.status);
      return { success: true, transferred };
    }),

  // Reseller API Keys
  listResellerApiKeys: adminProcedure
    .input(z.object({ resellerId: z.number() }))
    .query(async ({ input }) => {
      const keys = await listResellerApiKeys(input.resellerId);
      return keys.map(k => ({ ...k, apiKey: k.apiKey.slice(0, 8) + "..." + k.apiKey.slice(-4) }));
    }),

  createResellerApiKey: adminProcedure
    .input(z.object({ resellerId: z.number(), name: z.string().optional(), allowedIps: z.string().optional(), allowUnpaidTake: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const key = await createResellerApiKey({ resellerId: input.resellerId, name: input.name, allowedIps: input.allowedIps, allowUnpaidTake: input.allowUnpaidTake });
      return { apiKey: key.apiKey, id: key.id };
    }),

  revokeResellerApiKey: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await revokeResellerApiKey(input.id);
      return { success: true };
    }),

  // IP Whitelist management
  listIpWhitelist: adminProcedure.query(() => getAllIpWhitelist()),

  addIp: adminProcedure
    .input(z.object({
      ip: z.string().min(1),
      label: z.string().optional(),
      userType: z.enum(["admin", "reseller"]).default("admin"),
      userId: z.number().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      await addIpToWhitelist(input.ip, input.label, input.userType, input.userId);
      return { success: true };
    }),

  removeIp: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await removeIpFromWhitelist(input.id);
      return { success: true };
    }),

  // Password management
  changeAdminPassword: adminProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await getAdminById(ctx.adminId);
      if (!admin) throw new TRPCError({ code: "NOT_FOUND" });
      const valid = await bcrypt.compare(input.currentPassword, admin.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta" });
      const newHash = await bcrypt.hash(input.newPassword, 10);
      await updateAdminPassword(admin.id, newHash);
      return { success: true };
    }),

  changeResellerPassword: adminProcedure
    .input(z.object({
      resellerId: z.number(),
      newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ input }) => {
      const reseller = await getResellerById(input.resellerId);
      if (!reseller) throw new TRPCError({ code: "NOT_FOUND", message: "Reseller não encontrado" });
      const newHash = await bcrypt.hash(input.newPassword, 10);
      await updateResellerPassword(input.resellerId, newHash);
      return { success: true };
    }),

  // ─── Tickets ─────────────────────────────────────────────────────────────────
  listTickets: supportProcedure.query(async () => {
    const rows = await getAllTickets();
    const resellers = await getAllResellers();
    const map = new Map(resellers.map(r => [r.id, r.username]));
    return rows.map(t => ({ ...t, resellerUsername: map.get(t.resellerId) || "Unknown" }));
  }),

  getTicket: supportProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const ticket = await getTicketById(input.id);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      const messages = await getTicketMessages(input.id);
      const reseller = await getResellerById(ticket.resellerId);
      return { ...ticket, resellerUsername: reseller?.username || "Unknown", messages };
    }),

  sendTicketMessage: supportProcedure
    .input(z.object({
      ticketId: z.number(),
      message: z.string().min(1),
      imageBase64: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const ticket = await getTicketById(input.ticketId);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      let imageUrl: string | undefined;
      if (input.imageBase64) {
        imageUrl = (await uploadBase64Image(input.imageBase64)) || undefined;
      }
      const msg = await createTicketMessage({
        ticketId: input.ticketId,
        senderType: "admin",
        message: input.message,
        imageUrl,
      });
      await updateTicketTimestamp(input.ticketId);
      return msg;
    }),

  updateTicketStatus: supportProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["open", "closed", "archived"]),
    }))
    .mutation(async ({ input }) => {
      await updateTicketStatus(input.id, input.status);
      return { success: true };
    }),

  deleteTicket: supportProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteTicket(input.id);
      return { success: true };
    }),

  // ─── Reseller Applications ───────────────────────────────────────────────────
  listResellerApplications: adminProcedure.query(() => getAllResellerApplications()),

  getResellerApplication: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const app = await getResellerApplicationById(input.id);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      const messages = await getApplicationMessages(input.id);
      return { ...app, messages };
    }),

  sendApplicationMessageAdmin: adminProcedure
    .input(z.object({
      applicationId: z.number(),
      message: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const app = await getResellerApplicationById(input.applicationId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      const msg = await createApplicationMessage({
        applicationId: input.applicationId,
        senderType: "admin",
        message: input.message,
      });
      await updateResellerApplicationTimestamp(input.applicationId);
      return msg;
    }),

  updateResellerApplicationStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "pre_approved", "approved", "rejected", "archived"]),
    }))
    .mutation(async ({ input }) => {
      await updateResellerApplicationStatus(input.id, input.status);
      return { success: true };
    }),

  deleteResellerApplication: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteResellerApplication(input.id);
      return { success: true };
    }),

  // ─── Public Support Tickets (dúvidas) ─────────────────────────────────────────
  listSupportTickets: supportProcedure.query(() => getAllSupportTickets()),

  getSupportTicket: supportProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const ticket = await getSupportTicketById(input.id);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      const messages = await getSupportMessages(input.id);
      return { ...ticket, messages };
    }),

  sendSupportMessageAdmin: supportProcedure
    .input(z.object({
      ticketId: z.number(),
      message: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const ticket = await getSupportTicketById(input.ticketId);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      const msg = await createSupportMessage({
        ticketId: input.ticketId,
        senderType: "admin",
        message: input.message,
      });
      await updateSupportTicketTimestamp(input.ticketId);
      return msg;
    }),

  updateSupportTicketStatus: supportProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["open", "closed", "archived"]),
    }))
    .mutation(async ({ input }) => {
      await updateSupportTicketStatus(input.id, input.status);
      return { success: true };
    }),

  deleteSupportTicket: supportProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSupportTicket(input.id);
      return { success: true };
    }),

  // ─── Other Store ─────────────────────────────────────────────────────────────
  listOtherStoreResellers: adminProcedure.query(async () => {
    const list = await getOtherStoreResellers();
    const hwids = await Promise.all(list.map(r => getOtherStoreHwidsByResellerId(r.id)));
    return list.map((r, i) => ({ ...r, hwids: hwids[i] }));
  }),

  getOtherStoreReseller: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const r = await getOtherStoreResellerById(input.id);
      if (!r) throw new TRPCError({ code: "NOT_FOUND" });
      const hwids = await getOtherStoreHwidsByResellerId(r.id);
      return { ...r, hwids };
    }),

  createOtherStoreReseller: adminProcedure
    .input(z.object({
      resellerId: z.number(),
      label: z.string().optional(),
      purinApiKey: z.string().optional(),
      recipientEmail: z.string().email(),
      discordId: z.string().optional(),
      splitPercent: z.number().min(0.01).max(99.99),
    }))
    .mutation(async ({ input }) => {
      const r = await createOtherStoreReseller({
        resellerId: input.resellerId,
        label: input.label,
        purinApiKey: input.purinApiKey,
        recipientEmail: input.recipientEmail,
        discordId: input.discordId,
        splitPercent: String(input.splitPercent),
      } as any);
      return r;
    }),

  updateOtherStoreReseller: adminProcedure
    .input(z.object({
      id: z.number(),
      resellerId: z.number().optional(),
      label: z.string().optional(),
      purinApiKey: z.string().optional(),
      recipientEmail: z.string().email().optional(),
      discordId: z.string().optional(),
      splitPercent: z.number().min(0.01).max(99.99).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const r = await updateOtherStoreReseller(id, data as any);
      return r;
    }),

  deleteOtherStoreReseller: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteOtherStoreReseller(input.id);
      return { success: true };
    }),

  addOtherStoreHwid: adminProcedure
    .input(z.object({ otherStoreResellerId: z.number(), hwid: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const row = await createOtherStoreHwid({
        otherStoreResellerId: input.otherStoreResellerId,
        hwid: input.hwid,
      } as any);
      return row;
    }),

  removeOtherStoreHwid: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteOtherStoreHwid(input.id);
      return { success: true };
    }),

  // ─── Reseller Info Products (página pública /resellerinfo) ────────────────────
  listResellerInfoProducts: adminProcedure
    .query(async () => {
      return getAllResellerInfoProducts();
    }),

  createResellerInfoProduct: adminProcedure
    .input(z.object({
      title: z.string().min(2),
      slug: z.string().min(2),
      tagline: z.string().optional(),
      description: z.string().optional(),
      descriptionEn: z.string().optional(),
      pricingCredits: z.string().optional(),
      pricingCreditsEn: z.string().optional(),
      pricingPercentage: z.string().optional(),
      pricingPercentageEn: z.string().optional(),
      imageUrlBase64: z.string().optional(),
      galleryImagesBase64: z.array(z.string()).optional(),
      discordUrl: z.string().optional(),
      sortOrder: z.number().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }))
    .mutation(async ({ input }) => {
      let imageUrl: string | undefined;
      if (input.imageUrlBase64) {
        const uploaded = await uploadBase64Image(input.imageUrlBase64, "reseller-info");
        imageUrl = uploaded ?? input.imageUrlBase64;
      }
      let galleryImages: string | undefined;
      if (input.galleryImagesBase64 && input.galleryImagesBase64.length > 0) {
        const entries: string[] = [];
        for (const b64 of input.galleryImagesBase64) {
          const url = await uploadBase64Image(b64, "reseller-info");
          entries.push(url ?? b64);
        }
        if (entries.length > 0) galleryImages = JSON.stringify(entries);
      }
      const { imageUrlBase64, galleryImagesBase64, ...data } = input;
      const row = await createResellerInfoProduct({
        ...data,
        imageUrl,
        galleryImages,
      } as any);
      return row;
    }),

  updateResellerInfoProduct: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(2).optional(),
      slug: z.string().min(2).optional(),
      tagline: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      descriptionEn: z.string().optional().nullable(),
      pricingCredits: z.string().optional().nullable(),
      pricingCreditsEn: z.string().optional().nullable(),
      pricingPercentage: z.string().optional().nullable(),
      pricingPercentageEn: z.string().optional().nullable(),
      imageUrlBase64: z.string().optional(),
      clearImage: z.boolean().optional(),
      galleryImagesBase64: z.array(z.string()).optional(),
      clearGallery: z.boolean().optional(),
      discordUrl: z.string().optional().nullable(),
      sortOrder: z.number().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, imageUrlBase64, clearImage, galleryImagesBase64, clearGallery, ...data } = input;
      let imageUrl: string | undefined | null;
      if (imageUrlBase64) {
        const uploaded = await uploadBase64Image(imageUrlBase64, "reseller-info");
        imageUrl = uploaded ?? imageUrlBase64;
      } else if (clearImage) {
        imageUrl = null;
      }
      let galleryImages: string | undefined | null;
      if (galleryImagesBase64 && galleryImagesBase64.length > 0) {
        const entries: string[] = [];
        for (const b64 of galleryImagesBase64) {
          const url = await uploadBase64Image(b64, "reseller-info");
          entries.push(url ?? b64);
        }
        if (entries.length > 0) galleryImages = JSON.stringify(entries);
      } else if (clearGallery) {
        galleryImages = null;
      }
      const row = await updateResellerInfoProduct(id, {
        ...data,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(galleryImages !== undefined ? { galleryImages } : {}),
      } as any);
      return row;
    }),

  deleteResellerInfoProduct: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteResellerInfoProduct(input.id);
      return { success: true };
    }),
});

// ─── Reseller Router ──────────────────────────────────────────────────────────
const resellerRouter = router({
  dashboard: resellerProcedure.query(async ({ ctx }) => {
    const [monthly, byApp, myKeys, subs] = await Promise.all([
      getResellerKeysByMonth(ctx.resellerId),
      getResellerKeysByApp(ctx.resellerId),
      getKeysByResellerId(ctx.resellerId),
      getSubResellerKeyStats(ctx.resellerId),
    ]);
    const apps = await getAllApps();
    const appsById = new Map(apps.map(a => [a.id, a]));
    const totalSpent = myKeys.reduce((sum, k) => sum + (parseFloat(String(k.creditsSpent)) || 0), 0);
    const totalKeys = myKeys.length;
    return {
      monthly,
      byApp: byApp.map(a => ({ ...a, appName: appsById.get(a.appId)?.name || `App #${a.appId}` })),
      counts: { totalKeys, totalSpent: totalSpent.toFixed(2), activeKeys: myKeys.filter(k => k.status === "active").length, usedKeys: myKeys.filter(k => k.status === "used").length },
      subResellers: subs,
    };
  }),

  profile: resellerProcedure.query(async ({ ctx }) => {
    const r = ctx.reseller;
    const purchases = r.totalPurchases;
    const discount = parseFloat(r.discountPercent as string) || 0;
    const isPercentLike = r.resellerType === "percentage" || r.resellerType === "other";
    const nextLevel = isPercentLike && purchases < 10 ? { target: 10, discount: 40 } : isPercentLike && purchases < 20 ? { target: 20, discount: 50 } : null;
    const transactions = await getTransactionsByResellerId(r.id);
    return {
      id: r.id, username: r.username, email: r.email, location: r.location,
      credits: r.credits, discountPercent: discount, totalPurchases: purchases,
      resellerType: r.resellerType,
      canCreateSubResellers: r.canCreateSubResellers,
      status: r.status, createdAt: r.createdAt, lastLoginAt: r.lastLoginAt,
      nextLevel, transactions,
    };
  }),

  myApps: resellerProcedure.query(async ({ ctx }) => {
    const rows = await getAppsByResellerId(ctx.resellerId);
    const result = await Promise.all(rows.map(async (row) => {
      const plans = await getPlansByAppId(row.app.id);
      // Nunca expor a seller key para resellers
      const { keyauthSellerKey, ...safeApp } = row.app;
      return { ...safeApp, autoKeys: !!keyauthSellerKey, plans, assignedAt: row.assignedAt };
    }));
    return result;
  }),

  appDetail: resellerProcedure
    .input(z.object({ appId: z.number() }))
    .query(async ({ ctx, input }) => {
      const assigned = await getAssignedAppIds(ctx.resellerId);
      if (!assigned.includes(input.appId)) throw new TRPCError({ code: "FORBIDDEN" });
      const app = await getAppById(input.appId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      const plans = await getPlansByAppId(input.appId);
      // Nunca expor a seller key para resellers
      const { keyauthSellerKey, ...safeApp } = app;
      return { ...safeApp, autoKeys: !!keyauthSellerKey, plans };
    }),

  myKeys: resellerProcedure.query(async ({ ctx }) => {
    return getKeysByResellerIdWithApp(ctx.resellerId);
  }),

  myKeysByApp: resellerProcedure
    .input(z.object({ appId: z.number() }))
    .query(async ({ ctx, input }) => {
      const keys = await getKeysByResellerIdWithApp(ctx.resellerId);
      return keys.filter(k => k.appId === input.appId);
    }),

  // Detalhes da licença na KeyAuth (usada por quem, HWID, expiração real)
  keyInfo: resellerProcedure
    .input(z.object({ keyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const key = await getKeyById(input.keyId);
      if (!key || key.resellerId !== ctx.resellerId) throw new TRPCError({ code: "NOT_FOUND" });
      const app = await getAppById(key.appId);
      if (!app?.keyauthSellerKey?.trim()) return { remote: null };
      try {
        const remote = await keyauthFetchKeyInfo({ sellerKey: app.keyauthSellerKey.trim(), keyValue: key.keyValue });
        return { remote };
      } catch {
        return { remote: null };
      }
    }),

  getDownloadsByApp: resellerProcedure
    .input(z.object({ appId: z.number() }))
    .query(async ({ input }) => {
      return getDownloadsByAppId(input.appId);
    }),

  generateKeys: resellerProcedure
    .input(z.object({
      appId: z.number(), planId: z.number(), quantity: z.number().min(1).max(100),
      customMask: z.string().optional(), note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const reseller = ctx.reseller;
      if (reseller.resellerType !== "credits") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Esta ação é apenas para resellers de créditos" });
      }
      const assigned = await getAssignedAppIds(ctx.resellerId);
      if (!assigned.includes(input.appId)) throw new TRPCError({ code: "FORBIDDEN", message: "App não disponível" });

      const plan = await getPlanById(input.planId);
      if (!plan || plan.appId !== input.appId) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });

      const app = await getAppById(input.appId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });

      // Resellers de créditos pagam o preço cheio do plano (sem desconto progressivo)
      // O discountPercent só é aplicado para resellers de porcentagem
      const basePrice = parseFloat(plan.priceCredits as string);
      const discountedPrice = basePrice; // sem desconto para resellers de créditos
      const totalCost = discountedPrice * input.quantity;

      const currentCredits = parseFloat(reseller.credits as string);
      if (currentCredits < totalCost) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Créditos insuficientes. Necessário: ${totalCost.toFixed(2)}, Disponível: ${currentCredits.toFixed(2)}` });
      }

      // Adquire as keys ANTES de debitar: KeyAuth on-demand (apps com seller
      // key, ex.: Unlock All Web) ou reserva do estoque local. Se falhar,
      // nenhum crédito é cobrado.
      const acquisition = await acquireLicenseKeyValues({
        app,
        plan,
        quantity: input.quantity,
        resellerId: ctx.resellerId,
        owner: reseller.username,
        note: input.note,
        mask: input.customMask,
      });

      // Re-verifica o saldo para evitar débito concorrente deixar saldo negativo
      const freshReseller = await getResellerById(ctx.resellerId);
      const freshCredits = parseFloat(String(freshReseller?.credits ?? "0"));
      if (freshCredits < totalCost) {
        await acquisition.release();
        throw new TRPCError({ code: "BAD_REQUEST", message: `Créditos insuficientes. Necessário: ${totalCost.toFixed(2)}, Disponível: ${freshCredits.toFixed(2)}` });
      }

      const newCredits = freshCredits - totalCost;
      const newPurchases = reseller.totalPurchases + input.quantity;
      // Para créditos, o discountPercent é fixo (definido pelo admin), não atualiza automaticamente
      await updateResellerCredits(ctx.resellerId, newCredits.toFixed(2), newPurchases, reseller.discountPercent as string);

      const generatedKeys: string[] = [];
      try {
        for (const keyValue of acquisition.keyValues) {
          await createLicenseKey({
            keyValue, resellerId: ctx.resellerId, appId: input.appId,
            planId: plan.id, planName: plan.name, durationDays: plan.durationDays,
            creditsSpent: discountedPrice.toFixed(2),
            resellerCredits: newCredits.toFixed(2),
            ...(input.note ? { note: input.note } : {}),
            ...(input.customMask ? { customMask: input.customMask } : {}),
          } as any);
          generatedKeys.push(keyValue);
        }
      } catch (err) {
        // Rollback: devolve os créditos e apaga as keys parcialmente criadas,
        // senão o reseller fica cobrado por keys que não recebeu.
        await updateResellerCredits(ctx.resellerId, freshCredits.toFixed(2), reseller.totalPurchases, reseller.discountPercent as string);
        await deleteLicenseKeysByValues(generatedKeys);
        await acquisition.release();
        throw err;
      }

      await createCreditTransaction({
        resellerId: ctx.resellerId, type: "deduct",
        amount: totalCost.toFixed(2),
        balanceBefore: freshCredits.toFixed(2),
        balanceAfter: newCredits.toFixed(2),
        description: `Geração de ${input.quantity}x key(s) - ${app.name} (${plan.name})`,
      });

      return { success: true, keys: generatedKeys, creditsSpent: totalCost, newBalance: newCredits };
    }),

  resetHwid: resellerProcedure
    .input(z.object({ keyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const key = await getKeyById(input.keyId);
      if (!key || !(await resellerOwnsKey(ctx.resellerId, key))) throw new TRPCError({ code: "FORBIDDEN" });
      await performHwidReset(key);
      return { success: true };
    }),

  // Resetar HWID informando o valor da key (tela "Reset HWID" do painel).
  // Aceita qualquer key — clientes podem repassar a key pro reseller resetar
  // mesmo quando a key não aparece no painel dele (venda via gateway, sub-reseller etc).
  // Fallbacks: key local (license_keys) → key VG Auth (vgauth_licenses) →
  // API externa do PUB EMU/Axo (keys vendidas fora do painel).
  resetHwidByKey: resellerProcedure
    .input(z.object({ keyValue: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      const keyValue = input.keyValue.trim();

      const key = await getKeyByValue(keyValue);
      if (key) {
        await performHwidReset(key);
        return { success: true };
      }

      // Key de app VG Auth — limpa HWID da licença e dos usuários vinculados
      const vgLic = await getVgauthLicenseByKeyValue(keyValue);
      if (vgLic) {
        await updateVgauthLicense(vgLic.id, { hwidMb: null, hwidCpu: null, ip: null, hwidViolations: 0 });
        const users = await getVgauthUsersByApp(vgLic.appId);
        for (const u of users.filter((u) => u.licenseId === vgLic.id)) {
          await updateVgauthUser(u.id, { hwidMb: null, hwidCpu: null, ip: null });
        }
        return { success: true };
      }

      // Key não existe localmente — tenta direto na API do provedor (PUB EMU/Axo)
      await resetPubEmuHwidExternal(keyValue);
      return { success: true };
    }),

  revokeKey: resellerProcedure
    .input(z.object({ keyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const key = await getKeyById(input.keyId);
      if (!key || key.resellerId !== ctx.resellerId) throw new TRPCError({ code: "FORBIDDEN" });
      if (key.status === "used") throw new TRPCError({ code: "BAD_REQUEST", message: "Key já utilizada não pode ser revogada" });
      await updateLicenseKey(input.keyId, { status: "revoked" });
      return { success: true };
    }),

  // ─── Other Store (split) ─────────────────────────────────────────────────────
  createOtherStoreSplitCharge: resellerProcedure
    .input(z.object({
      appId: z.number(),
      planId: z.number(),
      quantity: z.number().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
      if (!PURIN_API_KEY) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento não configurado" });
      const otherStore = ctx.otherStore;
      if (!otherStore) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso Other Store não autorizado" });
      const plan = await getPlanById(input.planId);
      if (!plan || plan.appId !== input.appId) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });
      const assigned = await getAssignedAppIds(ctx.resellerId);
      if (!assigned.includes(input.appId)) throw new TRPCError({ code: "FORBIDDEN", message: "App não atribuído" });
      const qty = input.quantity;
      const chargeApp = await getAppById(input.appId);
      // Apps com geração on-demand (KeyAuth) não precisam de estoque local
      if (!chargeApp?.keyauthSellerKey?.trim()) {
        const available = await getAvailableStockForPlan(input.appId, input.planId, qty);
        if (available.length < qty) throw new TRPCError({ code: "BAD_REQUEST", message: `Estoque insuficiente: ${available.length} disponível` });
      }
      const price = parseFloat(String(plan.resellerSellingPrice));
      if (!price || price <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Preço de venda não configurado para este plano" });
      const discount = parseFloat(String(ctx.reseller.discountPercent));
      const discountedPrice = price * (1 - discount / 100);
      const amountCents = Math.round(discountedPrice * 100 * qty);
      const splitPercent = parseFloat(String(otherStore.splitPercent));
      const callbackUrl = `${process.env.VITE_APP_URL || "https://vgsellers.lat"}/api/webhooks/purincash`;
      const body = {
        amountCents,
        description: `Key ${plan.name} - Other Store`,
        splits: [{ recipientEmail: otherStore.recipientEmail, percentage: splitPercent }],
        callbackUrl,
        customer: {
          name: ctx.reseller.username,
          email: ctx.reseller.email || `${ctx.reseller.username}@other-store.local`,
          externalId: String(ctx.resellerId),
        },
      };
      const response = await fetch("https://api.purincash.com/v1/split-charges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PURIN_API_KEY}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text();
        console.error("[PurinCash] Error creating split charge:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cobrança split" });
      }
      const data = await response.json() as any;
      const { brCode, qrCodeImage } = extractPixData(data);
      await createPixPayment({
        resellerId: ctx.resellerId,
        paymentId: data.paymentId,
        amountCents,
        credits: "0",
        status: "pending",
        brCode,
        qrCodeImage,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        paymentType: "other-store",
        paymentMethod: "pix",
        appId: input.appId,
        planId: input.planId,
        quantity: qty,
      } as any);
      return {
        paymentId: data.paymentId,
        amountCents,
        totalCost: amountCents / 100,
        brCode,
        qrCodeImage,
        expiresAt: data.expiresAt,
        status: "pending" as const,
      };
    }),

  // ─── Pix / Purin Cash ──────────────────────────────────────────────────────
  createPixCharge: resellerProcedure
    .input(z.object({
      credits: z.number().min(600, "Mínimo 600 créditos").max(10000, "Máximo 10000 créditos"),
    }))
    .mutation(async ({ ctx, input }) => {
      const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
      if (!PURIN_API_KEY) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Pix não configurado" });

      const reseller = ctx.reseller;
      const amountCents = Math.round(input.credits * 100); // 1 crédito = R$ 1,00
      const callbackUrl = `${process.env.VITE_APP_URL || "https://vgsellers.lat"}/api/webhooks/purincash`;

      const body = {
        valueCents: amountCents,
        description: `Compra de ${input.credits} crédito(s) - VG SELLERS`,
        callbackUrl,
        customer: {
          name: reseller.username,
          email: reseller.email || `${reseller.username}@zenitystore.com`,
          externalId: String(reseller.id),
        },
        metadata: JSON.stringify({ resellerId: reseller.id, credits: input.credits }),
      };

      const response = await fetch("https://api.purincash.com/v1/charges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PURIN_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("[PurinCash] Error creating charge:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cobrança Pix" });
      }

      const data = await response.json() as any;
      console.log("[PurinCash] createKeyPixCharge response:", data);

      const { brCode, qrCodeImage } = extractPixData(data);

      // Persist the payment record
      await createPixPayment({
        resellerId: reseller.id,
        paymentId: data.paymentId,
        amountCents: data.amountCents,
        credits: input.credits.toFixed(2),
        status: "pending",
        brCode,
        qrCodeImage,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      });

      return {
        paymentId: data.paymentId,
        amountCents: data.amountCents,
        credits: input.credits,
        brCode,
        qrCodeImage,
        expiresAt: data.expiresAt,
        status: "pending" as const,
      };
    }),

  // Criar cobrança LTC para compra de créditos
  createLtcCreditsCharge: resellerProcedure
    .input(z.object({
      credits: z.number().min(600, "Mínimo 600 créditos").max(10000, "Máximo 10000 créditos"),
    }))
    .mutation(async ({ ctx, input }) => {
      const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
      if (!PURIN_API_KEY) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Crypto não configurado" });

      const reseller = ctx.reseller;
      const totalCost = input.credits;
      const amountCents = Math.round(input.credits * 100);

      if (amountCents < 100) throw new TRPCError({ code: "BAD_REQUEST", message: "Valor mínimo é R$ 1,00" });

      const callbackUrl = `${process.env.VITE_APP_URL || "https://vgsellers.lat"}/api/webhooks/purincash`;

      const body = {
        valueCents: amountCents,
        description: `Compra de ${input.credits} crédito(s) - VG SELLERS`,
        paymentMethod: "ltc",
        callbackUrl,
        customer: {
          name: reseller.username,
          email: reseller.email || `${reseller.username}@zenitystore.com`,
          externalId: String(reseller.id),
        },
        metadata: JSON.stringify({ resellerId: reseller.id, credits: input.credits }),
      };

      const response = await fetch("https://api.purincash.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PURIN_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("[PurinCash LTC Credits] Error creating charge:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Erro ao criar cobrança LTC: ${err}` });
      }

      const data = await response.json() as {
        paymentId: string;
        status: string;
        amountCents: number;
        ltc?: { address?: string; amount?: number; amountBrl?: number; ltcPriceBrl?: number };
        crypto?: { address?: string; amount?: number; ltcPriceBrl?: number };
        address?: string;
        expiresAt: string;
      };

      const ltcAddress = data.ltc?.address || data.crypto?.address || data.address || "LaaSCwpGiZhtrCD8qWxiZGdwEFYnHqxDxK";
      const ltcAmount = data.ltc?.amount || data.crypto?.amount || 0;
      const ltcPriceBrl = data.ltc?.ltcPriceBrl || data.ltc?.amountBrl && ltcAmount ? data.ltc.amountBrl / ltcAmount : 0;

      await createPixPayment({
        resellerId: reseller.id,
        paymentId: data.paymentId,
        amountCents: data.amountCents,
        credits: input.credits.toFixed(2),
        status: "pending",
        brCode: null,
        qrCodeImage: null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        paymentMethod: "ltc",
      } as any);

      return {
        paymentId: data.paymentId,
        amountCents: data.amountCents || amountCents,
        credits: input.credits,
        ltcAddress,
        ltcAmount,
        ltcPriceBrl,
        expiresAt: data.expiresAt,
        status: "pending" as const,
      };
    }),

  checkPixStatus: resellerProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      let payment = await getPixPaymentByPaymentId(input.paymentId);
      if (!payment || payment.resellerId !== ctx.resellerId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Polling fallback: if webhook did not arrive, ask PurinCash directly
      if (payment.status === "pending") {
        const remote = await checkPurinPaymentStatus(input.paymentId);
        if (remote?.status === "paid" && payment.status !== "paid") {
          await processPurinPaymentUpdate(input.paymentId, "paid", remote.paidAt ? new Date(remote.paidAt) : new Date());
          payment = await getPixPaymentByPaymentId(input.paymentId);
        } else if (remote?.status && ["expired", "cancelled", "refunded"].includes(remote.status) && payment.status === "pending") {
          await processPurinPaymentUpdate(input.paymentId, remote.status, new Date());
          payment = await getPixPaymentByPaymentId(input.paymentId);
        }
      }

      return {
        paymentId: payment.paymentId,
        status: payment.status,
        credits: parseFloat(payment.credits as string),
        amountCents: payment.amountCents,
        paidAt: payment.paidAt,
        expiresAt: payment.expiresAt,
      };
    }),

  myPixPayments: resellerProcedure.query(async ({ ctx }) => {
    return getPixPaymentsByReseller(ctx.resellerId);
  }),

  // Criar cobrança Pix para compra de key (resellers de porcentagem)
  createKeyPixCharge: resellerProcedure
    .input(z.object({
      appId: z.number(), planId: z.number(), quantity: z.number().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const reseller = ctx.reseller;
      if (reseller.resellerType !== "percentage" && reseller.resellerType !== "other") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Esta ação é apenas para resellers de porcentagem" });
      }

      const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
      if (!PURIN_API_KEY) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Pix não configurado" });

      const assigned = await getAssignedAppIds(ctx.resellerId);
      if (!assigned.includes(input.appId)) throw new TRPCError({ code: "FORBIDDEN", message: "App não disponível" });

      const plan = await getPlanById(input.planId);
      if (!plan || plan.appId !== input.appId) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });

      const app = await getAppById(input.appId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });

      // Calcular preço com o desconto configurado pelo admin
      const discount = parseFloat(reseller.discountPercent as string) || 0;
      const basePrice = parseFloat((plan as any).pricePercentage ?? "0");
      const discountedPrice = basePrice * (1 - discount / 100);
      const totalCost = discountedPrice * input.quantity;
      const amountCents = Math.round(totalCost * 100);

      if (amountCents < 100) throw new TRPCError({ code: "BAD_REQUEST", message: "Valor mínimo é R$ 1,00" });

      const callbackUrl = `${process.env.VITE_APP_URL || "https://vgsellers.lat"}/api/webhooks/purincash`;

      const body = {
        valueCents: amountCents,
        description: `${input.quantity}x key(s) ${app.name} - ${plan.name} - VG SELLERS`,
        callbackUrl,
        customer: {
          name: reseller.username,
          email: reseller.email || `${reseller.username}@zenitystore.com`,
          externalId: String(reseller.id),
        },
        metadata: JSON.stringify({
          resellerId: reseller.id,
          paymentType: "key",
          appId: input.appId,
          planId: input.planId,
          quantity: input.quantity,
        }),
      };

      const response = await fetch("https://api.purincash.com/v1/charges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PURIN_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("[PurinCash] Error creating key charge:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cobrança Pix" });
      }

      const data = await response.json() as any;
      console.log("[PurinCash] createKeyPixCharge response:", data);

      const { brCode, qrCodeImage } = extractPixData(data);
      await createPixPayment({
        resellerId: reseller.id,
        paymentId: data.paymentId,
        amountCents: data.amountCents,
        credits: "0.00",
        status: "pending",
        brCode,
        qrCodeImage,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        paymentType: "key",
        appId: input.appId,
        planId: input.planId,
        quantity: input.quantity,
      } as any);

      return {
        paymentId: data.paymentId,
        amountCents: data.amountCents,
        totalCost,
        brCode,
        qrCodeImage,
        expiresAt: data.expiresAt,
        status: "pending" as const,
      };
    }),

  // Verificar status de pagamento Pix de key e retornar keys se pago
  checkKeyPixStatus: resellerProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      let payment = await getPixPaymentByPaymentId(input.paymentId);
      if (!payment || payment.resellerId !== ctx.resellerId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Polling fallback: if webhook did not arrive, ask PurinCash directly
      if (payment.status === "pending") {
        const remote = await checkPurinPaymentStatus(input.paymentId);
        if (remote?.status === "paid" && payment.status !== "paid") {
          await processPurinPaymentUpdate(input.paymentId, "paid", remote.paidAt ? new Date(remote.paidAt) : new Date());
          payment = await getPixPaymentByPaymentId(input.paymentId);
        } else if (remote?.status && ["expired", "cancelled", "refunded"].includes(remote.status) && payment.status === "pending") {
          await processPurinPaymentUpdate(input.paymentId, remote.status, new Date());
          payment = await getPixPaymentByPaymentId(input.paymentId);
        }
      }

      // Se já foi pago, buscar as keys geradas para esse pagamento
      let keys: string[] = [];
      if (payment.status === "paid") {
        const { getKeysByPaymentId } = await import("./db");
        keys = await getKeysByPaymentId(input.paymentId);
      }
      return {
        paymentId: payment.paymentId,
        status: payment.status,
        amountCents: payment.amountCents,
        paidAt: payment.paidAt,
        expiresAt: payment.expiresAt,
        keys,
      };
    }),

  // Criar cobrança LTC para compra de key (resellers de porcentagem)
  createKeyLtcCharge: resellerProcedure
    .input(z.object({
      appId: z.number(), planId: z.number(), quantity: z.number().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const reseller = ctx.reseller;
      if (reseller.resellerType !== "percentage" && reseller.resellerType !== "other") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Esta ação é apenas para resellers de porcentagem" });
      }

      const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
      if (!PURIN_API_KEY) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Crypto não configurado" });

      const assigned = await getAssignedAppIds(ctx.resellerId);
      if (!assigned.includes(input.appId)) throw new TRPCError({ code: "FORBIDDEN", message: "App não disponível" });

      const plan = await getPlanById(input.planId);
      if (!plan || plan.appId !== input.appId) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });

      const app = await getAppById(input.appId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });

      // Calcular preço com o desconto configurado pelo admin
      const discount = parseFloat(reseller.discountPercent as string) || 0;
      const basePrice = parseFloat((plan as any).pricePercentage ?? "0");
      const discountedPrice = basePrice * (1 - discount / 100);
      const totalCost = discountedPrice * input.quantity;
      const amountCents = Math.round(totalCost * 100);

      if (amountCents < 100) throw new TRPCError({ code: "BAD_REQUEST", message: "Valor mínimo é R$ 1,00" });

      // Buscar cotação LTC/BRL ANTES de criar a cobrança
      let ltcPriceBrl = 0;
      try {
        const priceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=brl", { headers: { "Accept": "application/json" } });
        if (priceRes.ok) {
          const priceData = await priceRes.json() as { litecoin?: { brl?: number } };
          ltcPriceBrl = priceData?.litecoin?.brl || 0;
        }
      } catch (e) { console.warn("[CoinGecko] LTC price failed:", e); }

      if (!ltcPriceBrl) {
        try {
          const binanceRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=LTCBRL");
          if (binanceRes.ok) {
            const bd = await binanceRes.json() as { price?: string };
            ltcPriceBrl = parseFloat(bd?.price || "0");
          }
        } catch (e) { console.warn("[Binance] LTC price failed:", e); }
      }

      if (!ltcPriceBrl) ltcPriceBrl = 800; // fallback fixo ~R$800/LTC
      const ltcAmountCalc = parseFloat((totalCost / ltcPriceBrl).toFixed(8));

      const callbackUrl = `${process.env.VITE_APP_URL || "https://vgsellers.lat"}/api/webhooks/purincash`;

      const body = {
        valueCents: amountCents,
        description: `${input.quantity}x key(s) ${app.name} - ${plan.name} - VG SELLERS`,
        paymentMethod: "ltc",
        callbackUrl,
        customer: {
          name: reseller.username,
          email: reseller.email || `${reseller.username}@zenitystore.com`,
          externalId: String(reseller.id),
        },
        metadata: JSON.stringify({
          resellerId: reseller.id,
          paymentType: "key",
          appId: input.appId,
          planId: input.planId,
          quantity: input.quantity,
        }),
      };

      const response = await fetch("https://api.purincash.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PURIN_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("[PurinCash LTC] Error creating charge:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Erro ao criar cobrança LTC: ${err}` });
      }

      const data = await response.json() as {
        paymentId: string;
        status: string;
        amountCents: number;
        ltc?: { address?: string; amount?: number; amountBrl?: number; ltcPriceBrl?: number };
        crypto?: { address?: string; amount?: number; ltcPriceBrl?: number };
        address?: string;
        expiresAt: string;
      };

      console.log("[PurinCash LTC] Response:", JSON.stringify(data));

      // Usar endereço da Purin Cash se disponivel, senão usar o fixo
      const ltcAddress = data.ltc?.address || data.crypto?.address || data.address || "LaaSCwpGiZhtrCD8qWxiZGdwEFYnHqxDxK";
      // ltcAmountCalc e ltcPriceBrl já calculados antes da chamada à API

      await createPixPayment({
        resellerId: reseller.id,
        paymentId: data.paymentId,
        amountCents: data.amountCents,
        credits: "0.00",
        status: "pending",
        brCode: null,
        qrCodeImage: null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        paymentType: "key",
        paymentMethod: "ltc",
        appId: input.appId,
        planId: input.planId,
        quantity: input.quantity,
      } as any);

      return {
        paymentId: data.paymentId,
        amountCents: data.amountCents || amountCents,
        totalCost,
        ltcAddress,
        ltcAmount: ltcAmountCalc,
        ltcPriceBrl,
        expiresAt: data.expiresAt,
        status: "pending" as const,
      };
    }),

  // Verificar status de pagamento LTC de key e retornar keys se pago
  checkKeyLtcStatus: resellerProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      let payment = await getPixPaymentByPaymentId(input.paymentId);
      if (!payment || payment.resellerId !== ctx.resellerId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Polling fallback igual ao PIX: se o webhook nao chegar, pergunta direto
      // a Purin Cash e processa a entrega das keys.
      if (payment.status === "pending") {
        const remote = await checkPurinPaymentStatus(input.paymentId);
        if (remote?.status === "paid") {
          await processPurinPaymentUpdate(input.paymentId, "paid", remote.paidAt ? new Date(remote.paidAt) : new Date());
          payment = (await getPixPaymentByPaymentId(input.paymentId)) ?? payment;
        } else if (remote?.status && ["expired", "cancelled", "refunded"].includes(remote.status)) {
          await processPurinPaymentUpdate(input.paymentId, remote.status, new Date());
          payment = (await getPixPaymentByPaymentId(input.paymentId)) ?? payment;
        }
      }

      let keys: string[] = [];
      if (payment.status === "paid") {
        const { getKeysByPaymentId } = await import("./db");
        keys = await getKeysByPaymentId(input.paymentId);
      }
      return {
        paymentId: payment.paymentId,
        status: payment.status,
        amountCents: payment.amountCents,
        paidAt: payment.paidAt,
        expiresAt: payment.expiresAt,
        keys,
      };
    }),


  // ─── Tickets ─────────────────────────────────────────────────────────────────
  myTickets: resellerProcedure.query(async ({ ctx }) => {
    return getTicketsByResellerId(ctx.resellerId);
  }),

  createTicket: resellerProcedure
    .input(z.object({
      subject: z.string().min(3).max(255),
      message: z.string().min(1),
      imageBase64: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await createTicket({
        resellerId: ctx.resellerId,
        subject: input.subject,
        status: "open",
      });
      let imageUrl: string | undefined;
      if (input.imageBase64) {
        imageUrl = (await uploadBase64Image(input.imageBase64)) || undefined;
      }
      await createTicketMessage({
        ticketId: ticket.id,
        senderType: "reseller",
        message: input.message,
        imageUrl,
      });
      return ticket;
    }),

  getTicket: resellerProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const ticket = await getTicketById(input.id);
      if (!ticket || ticket.resellerId !== ctx.resellerId) throw new TRPCError({ code: "FORBIDDEN" });
      const messages = await getTicketMessages(input.id);
      return { ...ticket, messages };
    }),

  sendTicketMessage: resellerProcedure
    .input(z.object({
      ticketId: z.number(),
      message: z.string().min(1),
      imageBase64: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await getTicketById(input.ticketId);
      if (!ticket || ticket.resellerId !== ctx.resellerId) throw new TRPCError({ code: "FORBIDDEN" });
      let imageUrl: string | undefined;
      if (input.imageBase64) {
        imageUrl = (await uploadBase64Image(input.imageBase64)) || undefined;
      }
      const msg = await createTicketMessage({
        ticketId: input.ticketId,
        senderType: "reseller",
        message: input.message,
        imageUrl,
      });
      await updateTicketTimestamp(input.ticketId);
      return msg;
    }),

  listSubResellers: resellerProcedure
    .query(async ({ ctx }) => {
      return getResellersByParentId(ctx.resellerId);
    }),

  deleteSubReseller: resellerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const sub = await getResellerById(input.id);
      if (!sub || sub.parentResellerId !== ctx.resellerId) throw new TRPCError({ code: "FORBIDDEN", message: "Reseller nao pertence a voce" });
      await deleteResellerById(input.id);
      return { success: true };
    }),

  subResellerStats: resellerProcedure
    .query(async ({ ctx }) => {
      const stats = await getSubResellerKeyStats(ctx.resellerId);
      const logs = await getSubResellerKeyLogs(ctx.resellerId);
      return { stats, logs };
    }),

  createSubReseller: resellerProcedure
    .input(z.object({
      username: z.string().min(3).max(32),
      password: z.string().min(6),
      email: z.string().email().optional(),
      discountPercent: z.enum(["35", "40", "50"]).default("35"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.reseller.canCreateSubResellers) throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissao para criar resellers" });
      const existing = await getResellerByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username ja existe" });
      const passwordHash = await bcrypt.hash(input.password, 10);
      await createReseller({
        username: input.username,
        passwordHash,
        email: input.email,
        resellerType: "other",
        parentResellerId: ctx.resellerId,
        credits: "0.00",
        discountPercent: input.discountPercent + ".00",
      } as any);
      const newReseller = await getResellerByUsername(input.username);
      if (!newReseller) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar reseller criado" });
      let publicEmulator = await getAppByName("EMULATOR PUBLIC");
      if (!publicEmulator) publicEmulator = await getAppByName("Public Emulator");
      if (!publicEmulator) publicEmulator = await getAppByNameLike("emulator");
      if (!publicEmulator) publicEmulator = await getAppByNameLike("public");
      if (!publicEmulator) throw new TRPCError({ code: "NOT_FOUND", message: "Nenhum app Public/Emulator encontrado" });
      await assignAppToReseller({ resellerId: newReseller.id, appId: publicEmulator.id });
      return { success: true };
    }),
});

// ─── VG Auth Admin Router ─────────────────────────────────────────────────────
const vgauthRouter = router({
  listApps: adminProcedure.query(async () => {
    return getAllVgauthApps();
  }),

  createApp: adminProcedure
    .input(z.object({
      name: z.string().min(2).max(128),
      type: z.enum(["auth", "loader"]).default("auth"),
    }))
    .mutation(async ({ input }) => {
      const { randomBytes, createHash } = await import("crypto");
      const ownerId = createHash("sha256").update(randomBytes(32)).digest("hex").slice(0, 32);
      const secret = randomBytes(32).toString("hex");
      const app = await createVgauthApp({ name: input.name, type: input.type, ownerId, secret });
      await createVgauthLog({ appId: app.id, action: "app.created", detail: `${input.name} (${input.type})` });
      return app;
    }),

  updateApp: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(2).max(128).optional(),
      version: z.string().max(32).optional(),
      status: z.enum(["active", "disabled"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updateVgauthApp(id, data);
    }),

  regenerateSecret: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { randomBytes } = await import("crypto");
      const app = await updateVgauthApp(input.id, { secret: randomBytes(32).toString("hex") });
      await createVgauthLog({ appId: input.id, action: "app.secret_regenerated" });
      return app;
    }),

  deleteApp: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteVgauthApp(input.id);
      return { success: true };
    }),

  getAppDetail: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const app = await getVgauthAppById(input.id);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      const [licenses, users, bans, logs] = await Promise.all([
        getVgauthLicensesByApp(input.id),
        getVgauthUsersByApp(input.id),
        getVgauthBans(), // bans são globais — exibe todos
        getVgauthLogs(input.id, 300),
      ]);
      return { app, licenses, users, bans, logs };
    }),

  generateKeys: adminProcedure
    .input(z.object({
      appId: z.number(),
      amount: z.number().min(1).max(500),
      mask: z.string().max(128).default("VG-******-******-******"),
      subLevel: z.string().max(64).default("default"),
      durationValue: z.number().min(0).default(30),
      durationUnit: z.enum(["minutes", "hours", "days", "weeks", "months", "years", "lifetime"]).default("days"),
      uppercase: z.boolean().default(true),
      note: z.string().max(255).optional(),
    }))
    .mutation(async ({ input }) => {
      const app = await getVgauthAppById(input.appId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.type === "loader") throw new TRPCError({ code: "BAD_REQUEST", message: "Multi Loader não usa keys" });
      const charset = input.uppercase
        ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        : "abcdefghijklmnopqrstuvwxyz0123456789";
      const keys: string[] = [];
      for (let i = 0; i < input.amount; i++) {
        const keyValue = input.mask.replace(/\*/g, () => charset[Math.floor(Math.random() * charset.length)]);
        await createVgauthLicense({
          appId: input.appId,
          keyValue,
          note: input.note,
          subLevel: input.subLevel,
          durationValue: input.durationValue,
          durationUnit: input.durationUnit,
        });
        keys.push(keyValue);
      }
      await createVgauthLog({ appId: input.appId, action: "keys.generated", detail: `${input.amount}x ${input.durationValue} ${input.durationUnit}` });
      return { keys };
    }),

  setLicenseStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["active", "banned", "revoked"]) }))
    .mutation(async ({ input }) => {
      return updateVgauthLicense(input.id, { status: input.status });
    }),

  resetLicenseHwid: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const lic = await updateVgauthLicense(input.id, {
        hwidMb: null, hwidCpu: null, ip: null, hwidViolations: 0,
      });
      if (lic) {
        // Limpa também o HWID dos usuários vinculados a essa key —
        // o login compara user.hwidMb/hwidCpu, não só o da licença
        const users = await getVgauthUsersByApp(lic.appId);
        for (const u of users.filter(u => u.licenseId === lic.id)) {
          await updateVgauthUser(u.id, { hwidMb: null, hwidCpu: null, ip: null });
        }
        await createVgauthLog({ appId: lic.appId, action: "license.hwid_reset", detail: lic.keyValue.slice(0, 12) });
      }
      return lic;
    }),

  resetUserHwid: adminProcedure
    .input(z.object({ userId: z.number(), appId: z.number() }))
    .mutation(async ({ input }) => {
      const users = await getVgauthUsersByApp(input.appId);
      const user = users.find(u => u.id === input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      await updateVgauthUser(user.id, { hwidMb: null, hwidCpu: null, ip: null });
      if (user.licenseId) {
        await updateVgauthLicense(user.licenseId, { hwidMb: null, hwidCpu: null, ip: null, hwidViolations: 0 });
      }
      await createVgauthLog({ appId: input.appId, action: "user.hwid_reset", detail: user.username });
      return { success: true };
    }),

  deleteLicense: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteVgauthLicense(input.id);
      return { success: true };
    }),

  banUser: adminProcedure
    .input(z.object({ userId: z.number(), appId: z.number(), reason: z.string().max(255).optional() }))
    .mutation(async ({ input }) => {
      const users = await getVgauthUsersByApp(input.appId);
      const user = users.find(u => u.id === input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      await updateVgauthUser(user.id, { status: "banned" });
      // Ban global por IP + HWID placa-mãe + HWID CPU — bloqueia em TODOS os apps da auth
      await createVgauthBan({
        appId: input.appId,
        username: user.username,
        ip: user.ip, hwidMb: user.hwidMb, hwidCpu: user.hwidCpu,
        reason: input.reason || "Banido pelo admin",
      });
      await createVgauthLog({ appId: input.appId, action: "user.banned", detail: user.username });
      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.number(), appId: z.number() }))
    .mutation(async ({ input }) => {
      const users = await getVgauthUsersByApp(input.appId);
      const user = users.find(u => u.id === input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      await updateVgauthUser(user.id, { status: "active" });
      await createVgauthLog({ appId: input.appId, action: "user.unbanned", detail: user.username });
      return { success: true };
    }),

  setUserPassword: adminProcedure
    .input(z.object({ userId: z.number(), appId: z.number(), password: z.string().min(4).max(128) }))
    .mutation(async ({ input }) => {
      const users = await getVgauthUsersByApp(input.appId);
      const user = users.find(u => u.id === input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const passwordHash = await bcrypt.hash(input.password, 10);
      await updateVgauthUser(user.id, { passwordHash, passwordPlain: input.password });
      await createVgauthLog({ appId: input.appId, action: "user.password_changed", detail: user.username });
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteVgauthUser(input.userId);
      return { success: true };
    }),

  pauseAllKeys: adminProcedure
    .input(z.object({ appId: z.number() }))
    .mutation(async ({ input }) => {
      const count = await pauseAllVgauthLicenses(input.appId);
      await createVgauthLog({ appId: input.appId, action: "keys.paused_all", detail: `${count} keys` });
      return { count };
    }),

  resumeAllKeys: adminProcedure
    .input(z.object({ appId: z.number() }))
    .mutation(async ({ input }) => {
      const count = await resumeAllVgauthLicenses(input.appId);
      await createVgauthLog({ appId: input.appId, action: "keys.resumed_all", detail: `${count} keys` });
      return { count };
    }),

  addDaysAllKeys: adminProcedure
    .input(z.object({ appId: z.number(), days: z.number().min(1).max(3650) }))
    .mutation(async ({ input }) => {
      const count = await addDaysAllVgauthLicenses(input.appId, input.days);
      await createVgauthLog({ appId: input.appId, action: "keys.days_added", detail: `+${input.days}d em ${count} keys` });
      return { count };
    }),

  createBan: adminProcedure
    .input(z.object({
      appId: z.number(),
      ip: z.string().max(64).optional(),
      hwidMb: z.string().max(255).optional(),
      hwidCpu: z.string().max(255).optional(),
      reason: z.string().max(255).optional(),
    }))
    .mutation(async ({ input }) => {
      if (!input.ip && !input.hwidMb && !input.hwidCpu) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Informe ao menos um identificador" });
      }
      const ban = await createVgauthBan({
        appId: input.appId, ip: input.ip, hwidMb: input.hwidMb, hwidCpu: input.hwidCpu,
        reason: input.reason || "Ban manual",
      });
      await createVgauthLog({ appId: input.appId, action: "ban.created", detail: input.ip || input.hwidMb || input.hwidCpu });
      return ban;
    }),

  deleteBan: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteVgauthBan(input.id);
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  admin: adminRouter,
  reseller: resellerRouter,
  vgauth: vgauthRouter,
});

export type AppRouter = typeof appRouter;
