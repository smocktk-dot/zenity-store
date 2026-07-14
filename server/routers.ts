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
import {
  getAdminByUsername, getAdminById, createAdmin,
  getResellerByUsername, getResellerById, getAllResellers, createReseller, updateReseller, updateResellerCredits,
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getAllApps, getAppById, createApp, updateApp, deleteApp,
  getPlansByAppId, getPlanById, createPlan, updatePlan, deletePlan,
  getAppsByResellerId, assignAppToReseller, removeAppFromReseller, getAssignedAppIds,
  getKeysByResellerId, getAllKeys, getKeyById, createLicenseKey, updateLicenseKey,
  getTransactionsByResellerId, createCreditTransaction,
  getAllIpWhitelist, addIpToWhitelist, removeIpFromWhitelist, isIpWhitelisted,
  isAdminIpAllowed, isResellerIpAllowed, normalizeIp,
  updateAdminPassword, updateResellerPassword,
  createPixPayment, getPixPaymentByPaymentId, updatePixPaymentStatus,
  getPendingPixPaymentsByReseller, getPixPaymentsByReseller,
} from "./db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "cv-reseller-secret-key-2024");
const CUSTOM_COOKIE = "cv_session";

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
    .input(z.object({ username: z.string(), password: z.string() }))
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
          ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: 7 * 24 * 3600 });
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
      const token = await signCustomJwt({ sub: String(reseller.id), role: "reseller", username: reseller.username });
      ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: 7 * 24 * 3600 });
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
      return {
        id: reseller.id, username: reseller.username, role: "reseller" as const,
        credits: reseller.credits, discountPercent: reseller.discountPercent,
        totalPurchases: reseller.totalPurchases, status: reseller.status,
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
  return next({ ctx: { ...ctx, resellerId, reseller } });
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
      resellerType: z.enum(["credits", "percentage"]).default("credits"),
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
      resellerType: z.enum(["credits", "percentage"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, password, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (password) data.passwordHash = await bcrypt.hash(password, 10);
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
      level: z.enum(["basic", "premium", "lifetime"]).optional(),
    }))
    .mutation(async ({ input }) => {
      await createPlan({
        ...input,
        priceCredits: input.priceCredits.toFixed(2),
        pricePercentage: (input.pricePercentage ?? 0).toFixed(2),
      } as any);
      return { success: true };
    }),

  updatePlan: adminProcedure
    .input(z.object({
      id: z.number(), name: z.string().optional(), durationDays: z.number().optional(),
      priceCredits: z.number().optional(),
      pricePercentage: z.number().min(0).optional(),
      level: z.enum(["basic", "premium", "lifetime"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, priceCredits, pricePercentage, ...rest } = input;
      const data: any = { ...rest };
      if (priceCredits !== undefined) data.priceCredits = priceCredits.toFixed(2);
      if (pricePercentage !== undefined) data.pricePercentage = pricePercentage.toFixed(2);
      await updatePlan(id, data);
      return { success: true };
    }),

  deletePlan: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await deletePlan(input.id); return { success: true }; }),

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
  listAllKeys: adminProcedure.query(() => getAllKeys()),

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
});

// ─── Reseller Router ──────────────────────────────────────────────────────────
const resellerRouter = router({
  profile: resellerProcedure.query(async ({ ctx }) => {
    const r = ctx.reseller;
    const purchases = r.totalPurchases;
    // Desconto progressivo só se aplica a resellers de porcentagem
    const isPercentage = r.resellerType === "percentage";
    const discount = isPercentage ? calcDiscount(purchases) : 0;
    const nextLevel = isPercentage && purchases < 10 ? { target: 10, discount: 40 } : isPercentage && purchases < 20 ? { target: 20, discount: 50 } : null;
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

      // Gerar licenças via KeyAuth se o app tiver seller key configurada
      const sellerKey = (app as any).keyauthSellerKey || KEYAUTH_SELLER_KEY;
      let keyauthKeys: string[] | null = null;
      try {
        keyauthKeys = await keyauthCreateLicense({
          sellerKey,
          durationDays: plan.durationDays,
          quantity: input.quantity,
          owner: reseller.username,
          note: input.note || `Zenity Store - ${reseller.username} - ${plan.name}`,
        });
      } catch (err) {
        console.error("[KeyAuth] License creation failed, using local key generation:", err);
      }

      const generatedKeys: string[] = [];
      for (let i = 0; i < input.quantity; i++) {
        // Usar a key do KeyAuth se disponível, senão gerar localmente
        const keyValue = keyauthKeys ? keyauthKeys[i] : generateKeyValue(app.name, input.customMask);
        // expiresAt é null: a contagem começa apenas quando a key for usada pela primeira vez
        await createLicenseKey({
          keyValue, resellerId: ctx.resellerId, appId: input.appId,
          planId: plan.id, planName: plan.name, durationDays: plan.durationDays,
          creditsSpent: discountedPrice.toFixed(2),
          ...(input.note ? { note: input.note } : {}),
          ...(input.customMask ? { customMask: input.customMask } : {}),
        } as any);
        generatedKeys.push(keyValue);
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

  // ─── Pix / Purin Cash ──────────────────────────────────────────────────────
  createPixCharge: resellerProcedure
    .input(z.object({
      credits: z.number().min(1, "Mínimo 1 crédito").max(10000, "Máximo 10000 créditos"),
    }))
    .mutation(async ({ ctx, input }) => {
      const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
      if (!PURIN_API_KEY) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Pix não configurado" });

      const reseller = ctx.reseller;
      const amountCents = Math.round(input.credits * 100); // 1 crédito = R$ 1,00
      const callbackUrl = `${process.env.VITE_APP_URL || "https://cvreseller-n3qqggx2.manus.space"}/api/webhooks/purincash`;

      const body = {
        valueCents: amountCents,
        description: `Compra de ${input.credits} crédito(s) - ZENITY STORE`,
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

      const data = await response.json() as {
        paymentId: string;
        status: string;
        amountCents: number;
        pix: { brCode: string; qrCodeImage: string };
        expiresAt: string;
      };

      // Persist the payment record
      const payment = await createPixPayment({
        resellerId: reseller.id,
        paymentId: data.paymentId,
        amountCents: data.amountCents,
        credits: input.credits.toFixed(2),
        status: "pending",
        brCode: data.pix?.brCode || null,
        qrCodeImage: data.pix?.qrCodeImage || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      });

      return {
        paymentId: data.paymentId,
        amountCents: data.amountCents,
        credits: input.credits,
        brCode: data.pix?.brCode,
        qrCodeImage: data.pix?.qrCodeImage,
        expiresAt: data.expiresAt,
        status: "pending" as const,
      };
    }),

  checkPixStatus: resellerProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const payment = await getPixPaymentByPaymentId(input.paymentId);
      if (!payment || payment.resellerId !== ctx.resellerId) {
        throw new TRPCError({ code: "NOT_FOUND" });
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
      if (reseller.resellerType !== "percentage") {
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

      // Calcular preço com desconto progressivo
      const discount = calcDiscount(reseller.totalPurchases);
      const basePrice = parseFloat((plan as any).pricePercentage ?? "0");
      const discountedPrice = basePrice * (1 - discount / 100);
      const totalCost = discountedPrice * input.quantity;
      const amountCents = Math.round(totalCost * 100);

      if (amountCents < 100) throw new TRPCError({ code: "BAD_REQUEST", message: "Valor mínimo é R$ 1,00" });

      const callbackUrl = `${process.env.VITE_APP_URL || "https://zenity-store.vercel.app"}/api/webhooks/purincash`;

      const body = {
        valueCents: amountCents,
        description: `${input.quantity}x key(s) ${app.name} - ${plan.name} - ZENITY STORE`,
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

      const data = await response.json() as {
        paymentId: string;
        status: string;
        amountCents: number;
        pix: { brCode: string; qrCodeImage: string };
        expiresAt: string;
      };

      await createPixPayment({
        resellerId: reseller.id,
        paymentId: data.paymentId,
        amountCents: data.amountCents,
        credits: "0.00",
        status: "pending",
        brCode: data.pix?.brCode || null,
        qrCodeImage: data.pix?.qrCodeImage || null,
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
        brCode: data.pix?.brCode,
        qrCodeImage: data.pix?.qrCodeImage,
        expiresAt: data.expiresAt,
        status: "pending" as const,
      };
    }),

  // Verificar status de pagamento Pix de key e retornar keys se pago
  checkKeyPixStatus: resellerProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const payment = await getPixPaymentByPaymentId(input.paymentId);
      if (!payment || payment.resellerId !== ctx.resellerId) {
        throw new TRPCError({ code: "NOT_FOUND" });
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
      if (reseller.resellerType !== "percentage") {
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

      // Calcular preço com desconto progressivo
      const discount = calcDiscount(reseller.totalPurchases);
      const basePrice = parseFloat((plan as any).pricePercentage ?? "0");
      const discountedPrice = basePrice * (1 - discount / 100);
      const totalCost = discountedPrice * input.quantity;
      const amountCents = Math.round(totalCost * 100);

      if (amountCents < 100) throw new TRPCError({ code: "BAD_REQUEST", message: "Valor mínimo é R$ 1,00" });

      const callbackUrl = `${process.env.VITE_APP_URL || "https://zenity-store.vercel.app"}/api/webhooks/purincash`;

      const body = {
        valueCents: amountCents,
        description: `${input.quantity}x key(s) ${app.name} - ${plan.name} - ZENITY STORE`,
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
        ltc: { address: string; amount: number; amountBrl: number; ltcPriceBrl: number };
        expiresAt: string;
      };

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
        amountCents: data.amountCents,
        totalCost,
        ltcAddress: data.ltc?.address || "",
        ltcAmount: data.ltc?.amount || 0,
        ltcPriceBrl: data.ltc?.ltcPriceBrl || 0,
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

  // Comprar keys para resellers de porcentagem (sem débito de créditos)
  buyKey: resellerProcedure
    .input(z.object({
      appId: z.number(), planId: z.number(), quantity: z.number().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const reseller = ctx.reseller;
      if (reseller.resellerType !== "percentage") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Esta ação é apenas para resellers de porcentagem" });
      }

      const assigned = await getAssignedAppIds(ctx.resellerId);
      if (!assigned.includes(input.appId)) throw new TRPCError({ code: "FORBIDDEN", message: "App não disponível" });

      const plan = await getPlanById(input.planId);
      if (!plan || plan.appId !== input.appId) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });

      const app = await getAppById(input.appId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });

      // Resellers de porcentagem usam desconto progressivo baseado em totalPurchases
      const discount = calcDiscount(reseller.totalPurchases);
      const basePrice = parseFloat((plan as any).pricePercentage ?? "0");
      const discountedPrice = basePrice * (1 - discount / 100);
      const totalCost = discountedPrice * input.quantity;

      const newPurchases = reseller.totalPurchases + input.quantity;
      const newDiscount = calcDiscount(newPurchases);
      await updateResellerCredits(ctx.resellerId, reseller.credits as string, newPurchases, newDiscount.toFixed(2));

      // Gerar licenças via KeyAuth se o app tiver seller key configurada
      const sellerKey = (app as any).keyauthSellerKey || KEYAUTH_SELLER_KEY;
      let keyauthKeys: string[] | null = null;
      try {
        keyauthKeys = await keyauthCreateLicense({
          sellerKey,
          durationDays: plan.durationDays,
          quantity: input.quantity,
          owner: reseller.username,
          note: `Zenity Store - ${reseller.username} - ${plan.name} - R$ ${totalCost.toFixed(2)}`,
        });
      } catch (err) {
        console.error("[KeyAuth] License creation failed, using local key generation:", err);
      }

      const generatedKeys: string[] = [];
      for (let i = 0; i < input.quantity; i++) {
        // Usar a key do KeyAuth se disponível, senão gerar localmente
        const keyValue = keyauthKeys ? keyauthKeys[i] : generateKeyValue(app.name);
        // expiresAt é null: a contagem começa apenas quando a key for usada pela primeira vez
        await createLicenseKey({
          keyValue, resellerId: ctx.resellerId, appId: input.appId,
          planId: plan.id, planName: plan.name, durationDays: plan.durationDays,
          creditsSpent: discountedPrice.toFixed(2),
          note: `Compra via porcentagem - R$ ${totalCost.toFixed(2)}`,
        } as any);
        generatedKeys.push(keyValue);
      }

      return { success: true, keys: generatedKeys, totalCost, newBalance: reseller.credits };
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
