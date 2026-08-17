                                                                                                                                                                                                                                                                                                                                                                                  import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { keyauthCreateLicense } from "./keyauth";
import { calcDiscount } from "./resellerPricing";
import { checkPurinPaymentStatus, processPurinPaymentUpdate } from "./purinCashWebhook";
import { storagePut } from "./storage";
import {
  getAdminByUsername, getAdminById, createAdmin,
  getResellerByUsername, getResellerById, getAllResellers, createReseller, updateReseller, updateResellerCredits,
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getAllApps, getAppById, createApp, updateApp, deleteApp,
  getPlansByAppId, getPlanById, createPlan, updatePlan, deletePlan,
  getAppsByResellerId, assignAppToReseller, removeAppFromReseller, getAssignedAppIds,
  getKeysByResellerId, getAllKeys, getAllKeysWithReseller, getKeyById, createLicenseKey, updateLicenseKey,
  getTransactionsByResellerId, createCreditTransaction,
  getAllIpWhitelist, addIpToWhitelist, removeIpFromWhitelist, isIpWhitelisted,
  listResellerApiKeys, createResellerApiKey, revokeResellerApiKey,
  isAdminIpAllowed, isResellerIpAllowed, normalizeIp,
  updateAdminPassword, updateResellerPassword,
  createPixPayment, getPixPaymentByPaymentId, updatePixPaymentStatus,
  getPendingPixPaymentsByReseller, getPixPaymentsByReseller,
  getTicketsByResellerId, getAllTickets, getTicketById, createTicket, updateTicketStatus, updateTicketTimestamp, deleteTicket,
  getTicketMessages, createTicketMessage,
  getAvailableStockForPlan, reserveStockForReseller, addStockBatch, getStockByApp, getStockCountsByApp, deleteStock,
  getDownloadsByAppId, getDownloadById, createAppDownload, updateAppDownload, deleteAppDownload,
  createResellerApplication, getResellerApplicationById, getResellerApplicationByEmail, getAllResellerApplications,
  updateResellerApplicationStatus, updateResellerApplicationTimestamp, deleteResellerApplication,
  getApplicationMessages, createApplicationMessage,
  createSupportTicket, getSupportTicketById, getAllSupportTickets,
  updateSupportTicketStatus, updateSupportTicketTimestamp, deleteSupportTicket,
  getSupportMessages, createSupportMessage,
  getOtherStoreResellers, createOtherStoreReseller, updateOtherStoreReseller, deleteOtherStoreReseller,
  getOtherStoreResellerById, getOtherStoreResellerByHwid, getOtherStoreHwidsByResellerId,
  createOtherStoreHwid, deleteOtherStoreHwid,
} from "./db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "cv-reseller-secret-key-2024");
const CUSTOM_COOKIE = "cv_session";

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
const KEYAUTH_SELLER_KEY = process.env.KEYAUTH_SELLER_KEY || "dd1d4c88ede441586316b84e6c71dac7";

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

async function signCustomJwt(payload: object) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

async function verifyCustomJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

function getCustomToken(req: any): string | null {
  const cookieHeader = req.headers?.cookie || "";
  const match = cookieHeader.match(new RegExp(`${CUSTOM_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}

// ─── Auth Router ──────────────────────────────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),

  adminLogin: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // IP whitelist check
      const clientIp = getClientIp(ctx.req);
      const ipAllowed = await isAdminIpAllowed(clientIp);
      if (!ipAllowed) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado: IP não autorizado" });
      const admin = await getAdminByUsername(input.username);
      if (!admin) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      const valid = await bcrypt.compare(input.password, admin.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      const token = await signCustomJwt({ sub: String(admin.id), role: "admin", username: admin.username });
      ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: 7 * 24 * 3600 });
      return { success: true, role: "admin" as const, username: admin.username };
    }),

  resellerLogin: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
      remember: z.boolean().default(false),
      hwid: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check admin credentials first — admin can log in via reseller form
      const admin = await getAdminByUsername(input.username);
      if (admin) {
        const validAdmin = await bcrypt.compare(input.password, admin.passwordHash);
        if (validAdmin) {
          // IP whitelist check for admin login
          const clientIp = getClientIp(ctx.req);
          const ipAllowed = await isAdminIpAllowed(clientIp);
          if (!ipAllowed) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado: IP não autorizado" });
          const token = await signCustomJwt({ sub: String(admin.id), role: "admin", username: admin.username });
          const maxAge = input.remember ? 30 * 24 * 3600 : 7 * 24 * 3600;
          ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge });
          return { success: true, role: "admin" as const, username: admin.username };
        }
      }
      // Otherwise try reseller login
      const reseller = await getResellerByUsername(input.username);
      if (!reseller) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      if (reseller.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Conta desativada" });
      const valid = await bcrypt.compare(input.password, reseller.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      // IP whitelist check for reseller
      const resellerIp = getClientIp(ctx.req);
      const resellerIpAllowed = await isResellerIpAllowed(resellerIp, reseller.id);
      if (!resellerIpAllowed) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado: IP não autorizado para este reseller" });
      await updateReseller(reseller.id, { lastLoginAt: new Date() });
      const otherStore = input.hwid ? await getOtherStoreResellerByHwid(input.hwid) : null;
      const tokenPayload: Record<string, any> = { sub: String(reseller.id), role: "reseller", username: reseller.username };
      if (otherStore && otherStore.resellerId === reseller.id) {
        tokenPayload.otherStoreId = otherStore.id;
      }
      const token = await signCustomJwt(tokenPayload);
      const maxAge = input.remember ? 30 * 24 * 3600 : 7 * 24 * 3600;
      ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge });
      return { success: true, role: "reseller" as const, username: reseller.username };
    }),

  // Returns the real IP the server sees for this request (used by admin whitelist UI)
  getMyIp: publicProcedure.query(({ ctx }) => {
    const ip = getClientIp(ctx.req);
    return { ip };
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
      return { id: admin.id, username: admin.username, role: "admin" as const };
    } else {
      const reseller = await getResellerById(id);
      if (!reseller) return null;
      const otherStoreId = (payload?.otherStoreId as number | undefined) ?? null;
      const otherStore = otherStoreId ? await getOtherStoreResellerById(otherStoreId) : null;
      return {
        id: reseller.id, username: reseller.username, role: "reseller" as const,
        credits: reseller.credits, discountPercent: reseller.discountPercent,
        totalPurchases: reseller.totalPurchases, status: reseller.status,
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
      if (input.setupKey !== "CV-SETUP-2024") throw new TRPCError({ code: "FORBIDDEN", message: "Chave de setup inválida" });
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
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
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
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
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
});

// ─── Admin middleware ─────────────────────────────────────────────────────────
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = getCustomToken(ctx.req);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
  const payload = await verifyCustomJwt(token);
  if (!payload || payload.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, adminId: parseInt(payload.sub as string) } });
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
  const otherStoreId = payload?.otherStoreId as number | undefined;
  const otherStore = otherStoreId ? await getOtherStoreResellerById(otherStoreId) : null;
  return next({ ctx: { ...ctx, resellerId, reseller, otherStore } });
});

// ─── Admin Router ─────────────────────────────────────────────────────────────
const adminRouter = router({
  // Resellers
  listResellers: adminProcedure.query(async () => {
    const list = await getAllResellers();
    return list.map(r => ({ ...r, passwordHash: undefined }));
  }),

  createReseller: adminProcedure
    .input(z.object({
      username: z.string().min(3).max(64),
      password: z.string().min(6),
      email: z.string().email().optional(),
      location: z.string().optional(),
      resellerType: z.enum(["credits", "percentage", "other"]).default("credits"),
    }))
    .mutation(async ({ input }) => {
      const existing = await getResellerByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username já existe" });
      const passwordHash = await bcrypt.hash(input.password, 10);
      await createReseller({ username: input.username, passwordHash, email: input.email, location: input.location, resellerType: input.resellerType });
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
  listApps: adminProcedure.query(() => getAllApps()),

  getApp: adminProcedure
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
    }))
    .mutation(async ({ input }) => { await createApp(input as any); return { success: true }; }),

  updateApp: adminProcedure
    .input(z.object({
      id: z.number(), name: z.string().optional(), description: z.string().optional(),
      version: z.string().optional(), categoryId: z.number().optional().nullable(),
      status: z.enum(["active", "inactive"]).optional(),
      maxUsers: z.number().optional(), features: z.string().optional(),
      keyauthSellerKey: z.string().length(32).optional().nullable(),
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
  getDownloadsByApp: adminProcedure
    .input(z.object({ appId: z.number() }))
    .query(async ({ input }) => {
      return getDownloadsByAppId(input.appId);
    }),

  createAppDownload: adminProcedure
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

  updateAppDownload: adminProcedure
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

  deleteAppDownload: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAppDownload(input.id);
      return { success: true };
    }),

  getAvailableStockForPlan: adminProcedure
    .input(z.object({ appId: z.number(), planId: z.number() }))
    .query(async ({ input }) => {
      return getAvailableStockForPlan(input.appId, input.planId, 1);
    }),

  manualDeliverKey: adminProcedure
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
  listAllKeys: adminProcedure.query(() => getAllKeysWithReseller()),

  // Reseller API Keys
  listResellerApiKeys: adminProcedure
    .input(z.object({ resellerId: z.number() }))
    .query(async ({ input }) => {
      const keys = await listResellerApiKeys(input.resellerId);
      return keys.map(k => ({ ...k, apiKey: k.apiKey.slice(0, 8) + "..." + k.apiKey.slice(-4) }));
    }),

  createResellerApiKey: adminProcedure
    .input(z.object({ resellerId: z.number(), name: z.string().optional(), allowedIps: z.string().optional() }))
    .mutation(async ({ input }) => {
      const key = await createResellerApiKey({ resellerId: input.resellerId, name: input.name, allowedIps: input.allowedIps });
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
  listTickets: adminProcedure.query(async () => {
    const rows = await getAllTickets();
    const resellers = await getAllResellers();
    const map = new Map(resellers.map(r => [r.id, r.username]));
    return rows.map(t => ({ ...t, resellerUsername: map.get(t.resellerId) || "Unknown" }));
  }),

  getTicket: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const ticket = await getTicketById(input.id);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      const messages = await getTicketMessages(input.id);
      const reseller = await getResellerById(ticket.resellerId);
      return { ...ticket, resellerUsername: reseller?.username || "Unknown", messages };
    }),

  sendTicketMessage: adminProcedure
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

  updateTicketStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["open", "closed", "archived"]),
    }))
    .mutation(async ({ input }) => {
      await updateTicketStatus(input.id, input.status);
      return { success: true };
    }),

  deleteTicket: adminProcedure
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
  listSupportTickets: adminProcedure.query(() => getAllSupportTickets()),

  getSupportTicket: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const ticket = await getSupportTicketById(input.id);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      const messages = await getSupportMessages(input.id);
      return { ...ticket, messages };
    }),

  sendSupportMessageAdmin: adminProcedure
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

  updateSupportTicketStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["open", "closed", "archived"]),
    }))
    .mutation(async ({ input }) => {
      await updateSupportTicketStatus(input.id, input.status);
      return { success: true };
    }),

  deleteSupportTicket: adminProcedure
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
      splitPercent: z.number().min(0.01).max(99.99),
    }))
    .mutation(async ({ input }) => {
      const r = await createOtherStoreReseller({
        resellerId: input.resellerId,
        label: input.label,
        purinApiKey: input.purinApiKey,
        recipientEmail: input.recipientEmail,
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
});

// ─── Reseller Router ──────────────────────────────────────────────────────────
const resellerRouter = router({
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
      status: r.status, createdAt: r.createdAt, lastLoginAt: r.lastLoginAt,
      nextLevel, transactions,
    };
  }),

  myApps: resellerProcedure.query(async ({ ctx }) => {
    const rows = await getAppsByResellerId(ctx.resellerId);
    const result = await Promise.all(rows.map(async (row) => {
      const plans = await getPlansByAppId(row.app.id);
      return { ...row.app, plans, assignedAt: row.assignedAt };
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
      return { ...app, plans };
    }),

  myKeys: resellerProcedure.query(async ({ ctx }) => {
    return getKeysByResellerId(ctx.resellerId);
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

      const newCredits = currentCredits - totalCost;
      const newPurchases = reseller.totalPurchases + input.quantity;
      // Para créditos, o discountPercent é fixo (definido pelo admin), não atualiza automaticamente
      await updateResellerCredits(ctx.resellerId, newCredits.toFixed(2), newPurchases, reseller.discountPercent as string);

      await createCreditTransaction({
        resellerId: ctx.resellerId, type: "deduct",
        amount: totalCost.toFixed(2),
        balanceBefore: currentCredits.toFixed(2),
        balanceAfter: newCredits.toFixed(2),
        description: `Geração de ${input.quantity}x key(s) - ${app.name} (${plan.name})`,
      });

      // Try to pull from pre-loaded stock first
      const reserved = await getAvailableStockForPlan(input.appId, input.planId, input.quantity);
      if (reserved.length < input.quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Estoque insuficiente. Disponível: ${reserved.length}, Solicitado: ${input.quantity}`,
        });
      }

      const generatedKeys: string[] = [];
      for (const stock of reserved) {
        await reserveStockForReseller(stock.id, ctx.resellerId);
        await createLicenseKey({
          keyValue: stock.keyValue, resellerId: ctx.resellerId, appId: input.appId,
          planId: plan.id, planName: plan.name, durationDays: plan.durationDays,
          creditsSpent: discountedPrice.toFixed(2),
          resellerCredits: newCredits.toFixed(2),
          ...(input.note ? { note: input.note } : {}),
          ...(input.customMask ? { customMask: input.customMask } : {}),
        } as any);
        generatedKeys.push(stock.keyValue);
      }

      return { success: true, keys: generatedKeys, creditsSpent: totalCost, newBalance: newCredits };
    }),

  resetHwid: resellerProcedure
    .input(z.object({ keyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const key = await getKeyById(input.keyId);
      if (!key || key.resellerId !== ctx.resellerId) throw new TRPCError({ code: "FORBIDDEN" });
      // Resetar HWID localmente
      await updateLicenseKey(input.keyId, { hwid: null });
      // Resetar HWID no KeyAuth se o usuário estiver registrado
      if (key.usedBy) {
        const app = await getAppById(key.appId);
        const sellerKey = (app as any)?.keyauthSellerKey || KEYAUTH_SELLER_KEY;
        try {
          await keyauthResetHwid(sellerKey, key.usedBy);
        } catch (err) {
          console.warn("[KeyAuth] HWID reset failed (non-critical):", err);
        }
      }
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
      const available = await getAvailableStockForPlan(input.appId, input.planId, qty);
      if (available.length < qty) throw new TRPCError({ code: "BAD_REQUEST", message: `Estoque insuficiente: ${available.length} disponível` });
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
      const payment = await getPixPaymentByPaymentId(input.paymentId);
      if (!payment || payment.resellerId !== ctx.resellerId) {
        throw new TRPCError({ code: "NOT_FOUND" });
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
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  admin: adminRouter,
  reseller: resellerRouter,
});

export type AppRouter = typeof appRouter;
