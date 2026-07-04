import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
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
function generateKeyValue(prefix: string, mask?: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  if (mask) {
    return mask.replace(/X/g, () => chars[Math.floor(Math.random() * chars.length)]);
  }
  const p = prefix.toUpperCase().slice(0, 4).padEnd(4, "X");
  return `${p}-${rand(4)}-${rand(4)}-${rand(4)}-${rand(8)}`;
}

function calcDiscount(totalPurchases: number): number {
  if (totalPurchases >= 20) return 50;
  if (totalPurchases >= 10) return 40;
  return 35;
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
      ctx.res.cookie(CUSTOM_COOKIE, token, {
        httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 7 * 24 * 3600,
      });
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
          ctx.res.cookie(CUSTOM_COOKIE, token, {
            httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 7 * 24 * 3600,
          });
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
      ctx.res.cookie(CUSTOM_COOKIE, token, {
        httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 7 * 24 * 3600,
      });
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
    ctx.res.clearCookie(CUSTOM_COOKIE, { httpOnly: true, secure: true, sameSite: "none", path: "/" });
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
    }))
    .mutation(async ({ input }) => { await createApp(input as any); return { success: true }; }),

  updateApp: adminProcedure
    .input(z.object({
      id: z.number(), name: z.string().optional(), description: z.string().optional(),
      version: z.string().optional(), categoryId: z.number().optional().nullable(),
      status: z.enum(["active", "inactive"]).optional(),
      maxUsers: z.number().optional(), features: z.string().optional(),
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
    const discount = calcDiscount(purchases);
    const nextLevel = purchases < 10 ? { target: 10, discount: 40 } : purchases < 20 ? { target: 20, discount: 50 } : null;
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
      const assigned = await getAssignedAppIds(ctx.resellerId);
      if (!assigned.includes(input.appId)) throw new TRPCError({ code: "FORBIDDEN", message: "App não disponível" });

      const plan = await getPlanById(input.planId);
      if (!plan || plan.appId !== input.appId) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });

      const app = await getAppById(input.appId);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });

      const discount = calcDiscount(reseller.totalPurchases);
      const basePrice = parseFloat(plan.priceCredits as string);
      const discountedPrice = basePrice * (1 - discount / 100);
      const totalCost = discountedPrice * input.quantity;

      const currentCredits = parseFloat(reseller.credits as string);
      if (currentCredits < totalCost) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Créditos insuficientes. Necessário: ${totalCost.toFixed(2)}, Disponível: ${currentCredits.toFixed(2)}` });
      }

      const newCredits = currentCredits - totalCost;
      const newPurchases = reseller.totalPurchases + input.quantity;
      const newDiscount = calcDiscount(newPurchases);

      await updateResellerCredits(ctx.resellerId, newCredits.toFixed(2), newPurchases, newDiscount.toFixed(2));

      await createCreditTransaction({
        resellerId: ctx.resellerId, type: "deduct",
        amount: totalCost.toFixed(2),
        balanceBefore: currentCredits.toFixed(2),
        balanceAfter: newCredits.toFixed(2),
        description: `Geração de ${input.quantity}x key(s) - ${app.name} (${plan.name})`,
      });

      const generatedKeys: string[] = [];
      for (let i = 0; i < input.quantity; i++) {
        const keyValue = generateKeyValue(app.name, input.customMask);
        const expiresAt = plan.durationDays < 9000 ? new Date(Date.now() + plan.durationDays * 86400000) : undefined;
        await createLicenseKey({
          keyValue, resellerId: ctx.resellerId, appId: input.appId,
          planId: plan.id, planName: plan.name, durationDays: plan.durationDays,
          creditsSpent: discountedPrice.toFixed(2),
          expiresAt: expiresAt || null,
          note: input.note || null,
          customMask: input.customMask || null,
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
      await updateLicenseKey(input.keyId, { hwid: null });
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

      const discount = calcDiscount(reseller.totalPurchases);
      const basePrice = parseFloat((plan as any).pricePercentage ?? "0");
      const discountedPrice = basePrice * (1 - discount / 100);
      const totalCost = discountedPrice * input.quantity;

      const newPurchases = reseller.totalPurchases + input.quantity;
      const newDiscount = calcDiscount(newPurchases);
      await updateResellerCredits(ctx.resellerId, reseller.credits as string, newPurchases, newDiscount.toFixed(2));

      const generatedKeys: string[] = [];
      for (let i = 0; i < input.quantity; i++) {
        const keyValue = generateKeyValue(app.name);
        const expiresAt = plan.durationDays < 9000 ? new Date(Date.now() + plan.durationDays * 86400000) : undefined;
        await createLicenseKey({
          keyValue, resellerId: ctx.resellerId, appId: input.appId,
          planId: plan.id, planName: plan.name, durationDays: plan.durationDays,
          creditsSpent: discountedPrice.toFixed(2),
          expiresAt: expiresAt || null,
          note: `Compra via porcentagem - R$ ${totalCost.toFixed(2)}`,
          customMask: null,
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
