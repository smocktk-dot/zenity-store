import { eq, and, desc, sql, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, admins, resellers, resellerApiKeys, categories, apps, subscriptionPlans, resellerApps, licenseKeys, appStock, appDownloads, creditTransactions, ipWhitelist, pixPayments, tickets, ticketMessages, resellerApplications, applicationMessages, supportTickets, supportMessages } from "../drizzle/schema";
import type { InsertAdmin, InsertReseller, InsertResellerApiKey, InsertCategory, InsertApp, InsertSubscriptionPlan, InsertResellerApp, InsertLicenseKey, InsertAppStock, InsertAppDownload, InsertCreditTransaction, InsertPixPayment, InsertTicket, InsertTicketMessage, InsertResellerApplication, InsertApplicationMessage, InsertSupportTicket, InsertSupportMessage } from "../drizzle/schema";
import { ENV } from './_core/env';
import { randomUUID } from "crypto";

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlClient: ReturnType<typeof postgres> | null = null;
let _pixPaymentSchemaReady: Promise<void> | null = null;

export async function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      try {
        // Detecta se a URL usa SSL (ex: postgres com ?sslmode=require) e configura automaticamente
        const sslRequired = connectionString.includes("sslmode=require") || connectionString.includes("ssl=true");
        const client = postgres(connectionString, sslRequired ? { ssl: "require" } : {});
        _sqlClient = client;
        _db = drizzle(client);
      } catch (error) {
        console.warn("[Database] Failed to connect:", error);
        _db = null;
      }
    }
  }
  return _db;
}

/**
 * Ensure the columns used by percentage-reseller key purchases exist.
 *
 * Vercel deploys application code independently from Drizzle migrations. Without
 * this idempotent guard, a successful deploy can still fail at runtime with
 * "column paymentType does not exist" until migration 0003 is applied manually.
 */
export async function ensurePixPaymentSchema(): Promise<void> {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");

  if (!_pixPaymentSchemaReady) {
    _pixPaymentSchemaReady = _sqlClient.begin(async sql => {
      await sql.unsafe(`ALTER TABLE "pix_payments" ADD COLUMN IF NOT EXISTS "paymentType" varchar(32) DEFAULT 'credits' NOT NULL`);
      await sql.unsafe(`ALTER TABLE "pix_payments" ADD COLUMN IF NOT EXISTS "paymentMethod" varchar(16) DEFAULT 'pix'`);
      await sql.unsafe(`ALTER TABLE "pix_payments" ADD COLUMN IF NOT EXISTS "appId" integer`);
      await sql.unsafe(`ALTER TABLE "pix_payments" ADD COLUMN IF NOT EXISTS "planId" integer`);
      await sql.unsafe(`ALTER TABLE "pix_payments" ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 1`);
    }).then(() => undefined).catch(error => {
      _pixPaymentSchemaReady = null;
      console.error("[Database] Failed to ensure Pix payment schema:", error);
      throw new Error("Não foi possível preparar o banco para compras via Pix");
    });
  }

  return _pixPaymentSchemaReady;
}

let _appStockSchemaReady: Promise<void> | null = null;

export async function ensureAppStockSchema(): Promise<void> {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");

  if (!_appStockSchemaReady) {
    _appStockSchemaReady = (async () => {
      try {
        await _sqlClient!.unsafe(`DO $$ BEGIN CREATE TYPE "stock_status" AS ENUM('available', 'sold'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
      } catch (e) { /* ignore duplicate */ }

      try {
        await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "app_stock" (
          "id" serial PRIMARY KEY,
          "appId" integer NOT NULL,
          "planId" integer NOT NULL,
          "keyValue" varchar(128) NOT NULL UNIQUE,
          "status" "stock_status" DEFAULT 'available' NOT NULL,
          "resellerId" integer,
          "soldAt" timestamp,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )`);
      } catch (e) {
        console.error("[Database] Failed to create app_stock table:", e);
        throw e;
      }
    })().then(() => undefined).catch(error => {
      _appStockSchemaReady = null;
      console.error("[Database] Failed to ensure app stock schema:", error);
      throw new Error("Não foi possível preparar o banco para estoque");
    });
  }

  return _appStockSchemaReady;
}

let _licenseKeysSchemaReady: Promise<void> | null = null;

export async function ensureLicenseKeysSchema(): Promise<void> {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");

  if (!_licenseKeysSchemaReady) {
    _licenseKeysSchemaReady = (async () => {
      try {
        await _sqlClient!.unsafe(`ALTER TABLE "license_keys" ADD COLUMN IF NOT EXISTS "resellerCredits" decimal(12, 2)`);
      } catch (e) {
        console.error("[Database] Failed to ensure license_keys schema:", e);
        throw e;
      }
    })().then(() => undefined).catch(error => {
      _licenseKeysSchemaReady = null;
      console.error("[Database] Failed to ensure license_keys schema:", error);
      throw new Error("Não foi possível preparar o banco para license keys");
    });
  }

  return _licenseKeysSchemaReady;
}

let _appDownloadsSchemaReady: Promise<void> | null = null;

export async function ensureAppDownloadsSchema(): Promise<void> {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");

  if (!_appDownloadsSchemaReady) {
    _appDownloadsSchemaReady = (async () => {
      try {
        await _sqlClient!.unsafe(`DO $$ BEGIN CREATE TYPE "app_download_type" AS ENUM('download', 'tutorial'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
      } catch (e) { /* ignore duplicate */ }

      try {
        await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "app_downloads" (
          "id" serial PRIMARY KEY,
          "appId" integer NOT NULL,
          "type" "app_download_type" NOT NULL,
          "title" varchar(128) NOT NULL,
          "url" text NOT NULL,
          "videoUrl" text,
          "sortOrder" integer DEFAULT 0 NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL
        )`);
      } catch (e) {
        console.error("[Database] Failed to create app_downloads table:", e);
        throw e;
      }
    })().then(() => undefined).catch(error => {
      _appDownloadsSchemaReady = null;
      console.error("[Database] Failed to ensure app downloads schema:", error);
      throw new Error("Não foi possível preparar o banco para downloads");
    });
  }

  return _appDownloadsSchemaReady;
}

let _resellerApiKeysSchemaReady: Promise<void> | null = null;

export async function ensureResellerApiKeySchema(): Promise<void> {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");
  if (!_resellerApiKeysSchemaReady) {
    _resellerApiKeysSchemaReady = (async () => {
      try {
        await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "reseller_api_keys" (
          "id" serial PRIMARY KEY,
          "resellerId" integer NOT NULL REFERENCES "resellers"("id"),
          "apiKey" varchar(128) NOT NULL UNIQUE,
          "name" varchar(64),
          "isActive" boolean DEFAULT true NOT NULL,
          "allowedIps" text,
          "lastUsedAt" timestamp,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL
        )`);
      } catch (e) {
        console.error("[Database] Failed to create reseller_api_keys:", e);
        throw e;
      }
    })().then(() => undefined).catch(error => {
      _resellerApiKeysSchemaReady = null;
      console.error("[Database] Failed to ensure reseller_api_keys schema:", error);
      throw new Error("Não foi possível preparar o banco para reseller API keys");
    });
  }
  return _resellerApiKeysSchemaReady;
}

// ─── Users (Manus OAuth) ─────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Admins ───────────────────────────────────────────────────────────────────
export async function getAdminByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAdmin(data: InsertAdmin) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(admins).values(data);
}

export async function getAdminById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Resellers ────────────────────────────────────────────────────────────────
export async function getResellerByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resellers).where(eq(resellers.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getResellerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resellers).where(eq(resellers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllResellers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellers).orderBy(desc(resellers.createdAt));
}

export async function createReseller(data: InsertReseller) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(resellers).values(data);
}

export async function updateReseller(id: number, data: Partial<InsertReseller>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellers).set(data).where(eq(resellers.id, id));
}

export async function updateResellerCredits(id: number, newCredits: string, newPurchases: number, newDiscount: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellers).set({
    credits: newCredits,
    totalPurchases: newPurchases,
    discountPercent: newDiscount,
  }).where(eq(resellers.id, id));
}

export async function getResellerByApiKey(apiKey: string) {
  await ensureResellerApiKeySchema();
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ reseller: resellers, key: resellerApiKeys })
    .from(resellerApiKeys)
    .innerJoin(resellers, eq(resellerApiKeys.resellerId, resellers.id))
    .where(and(eq(resellerApiKeys.apiKey, apiKey), eq(resellerApiKeys.isActive, true)))
    .limit(1);
  if (rows.length === 0) return undefined;
  const { reseller, key } = rows[0];
  await db.update(resellerApiKeys).set({ lastUsedAt: new Date() }).where(eq(resellerApiKeys.id, key.id));
  return reseller;
}

export async function getResellerApiKeyByKey(apiKey: string) {
  await ensureResellerApiKeySchema();
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resellerApiKeys).where(eq(resellerApiKeys.apiKey, apiKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createResellerApiKey(data: { resellerId: number; name?: string | null; allowedIps?: string | null }) {
  await ensureResellerApiKeySchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(resellerApiKeys).values({
    resellerId: data.resellerId,
    apiKey: randomUUID(),
    name: data.name ?? null,
    allowedIps: data.allowedIps ?? null,
    isActive: true,
  } as InsertResellerApiKey).returning();
  return row;
}

export async function listResellerApiKeys(resellerId: number) {
  await ensureResellerApiKeySchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellerApiKeys).where(eq(resellerApiKeys.resellerId, resellerId)).orderBy(desc(resellerApiKeys.createdAt));
}

export async function revokeResellerApiKey(id: number) {
  await ensureResellerApiKeySchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellerApiKeys).set({ isActive: false, updatedAt: new Date() }).where(eq(resellerApiKeys.id, id));
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(categories).values(data);
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(categories).where(eq(categories.id, id));
}

// ─── Apps ─────────────────────────────────────────────────────────────────────
export async function getAllApps() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apps).orderBy(desc(apps.createdAt));
}

export async function getAppById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apps).where(eq(apps.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createApp(data: InsertApp) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(apps).values(data);
  return result;
}

export async function updateApp(id: number, data: Partial<InsertApp>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(apps).set(data).where(eq(apps.id, id));
}

export async function deleteApp(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Get all plans for this app to delete their keys first
  const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.appId, id));
  for (const plan of plans) {
    await db.delete(licenseKeys).where(eq(licenseKeys.planId, plan.id));
  }
  // Delete plans, reseller assignments, then the app
  await db.delete(subscriptionPlans).where(eq(subscriptionPlans.appId, id));
  await db.delete(resellerApps).where(eq(resellerApps.appId, id));
  await db.delete(apps).where(eq(apps.id, id));
}

// ─── Subscription Plans ───────────────────────────────────────────────────────
export async function getPlansByAppId(appId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.appId, appId));
}

export async function getPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPlan(data: InsertSubscriptionPlan) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(subscriptionPlans).values(data);
}

export async function updatePlan(id: number, data: Partial<InsertSubscriptionPlan>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id));
}

export async function deletePlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete associated license keys first to avoid FK constraint violation
  await db.delete(licenseKeys).where(eq(licenseKeys.planId, id));
  await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
}

// ─── Reseller Apps ────────────────────────────────────────────────────────────
export async function getAppsByResellerId(resellerId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ app: apps, assignedAt: resellerApps.assignedAt })
    .from(resellerApps)
    .innerJoin(apps, eq(resellerApps.appId, apps.id))
    .where(eq(resellerApps.resellerId, resellerId));
  return rows;
}

export async function assignAppToReseller(data: InsertResellerApp) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Check if already assigned
  const existing = await db.select().from(resellerApps)
    .where(and(eq(resellerApps.resellerId, data.resellerId!), eq(resellerApps.appId, data.appId!)))
    .limit(1);
  if (existing.length > 0) return; // already assigned
  await db.insert(resellerApps).values(data);
}

export async function removeAppFromReseller(resellerId: number, appId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(resellerApps).where(and(eq(resellerApps.resellerId, resellerId), eq(resellerApps.appId, appId)));
}

export async function getAssignedAppIds(resellerId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ appId: resellerApps.appId }).from(resellerApps).where(eq(resellerApps.resellerId, resellerId));
  return rows.map(r => r.appId);
}

// ─── License Keys ─────────────────────────────────────────────────────────────
export async function getKeysByResellerId(resellerId: number) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenseKeys).where(eq(licenseKeys.resellerId, resellerId)).orderBy(desc(licenseKeys.createdAt));
}

export async function getAllKeys() {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenseKeys).orderBy(desc(licenseKeys.createdAt));
}

export async function getAllKeysWithReseller() {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    key: licenseKeys,
    reseller: resellers,
  })
    .from(licenseKeys)
    .leftJoin(resellers, eq(licenseKeys.resellerId, resellers.id))
    .orderBy(desc(licenseKeys.createdAt));
  return rows.map(r => ({
    ...r.key,
    resellerName: r.reseller?.username ?? "—",
    resellerType: r.reseller?.resellerType ?? "credits",
  }));
}

export async function getKeyById(id: number) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLicenseKey(data: InsertLicenseKey) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Build INSERT with only the required + explicitly provided optional fields
  // This avoids Drizzle including all columns (even those with DB DEFAULTs)
  const requiredValues = {
    keyValue: data.keyValue,
    resellerId: data.resellerId,
    appId: data.appId,
    planId: data.planId ?? null,
    planName: data.planName ?? null,
    durationDays: data.durationDays,
    creditsSpent: data.creditsSpent,
  };
  // Only include optional fields if they were explicitly provided
  const optionalValues: Record<string, unknown> = {};
  if (data.note !== undefined && data.note !== null) optionalValues.note = data.note;
  if (data.customMask !== undefined && data.customMask !== null) optionalValues.customMask = data.customMask;
  if (data.expiresAt !== undefined && data.expiresAt !== null) optionalValues.expiresAt = data.expiresAt;

  await db.insert(licenseKeys).values({ ...requiredValues, ...optionalValues } as InsertLicenseKey);
}

export async function updateLicenseKey(id: number, data: Partial<InsertLicenseKey>) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(licenseKeys).set(data).where(eq(licenseKeys.id, id));
}

// ─── Credit Transactions ──────────────────────────────────────────────────────
export async function getTransactionsByResellerId(resellerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions).where(eq(creditTransactions.resellerId, resellerId)).orderBy(desc(creditTransactions.createdAt)).limit(50);
}

export async function createCreditTransaction(data: InsertCreditTransaction) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(creditTransactions).values(data);
}

// ─── IP Whitelist ─────────────────────────────────────────────────────────────
/** Normalize IP: strip IPv6-mapped IPv4 prefix (::ffff:) and loopback variants. Real IPv6 addresses are kept as-is. */
export function normalizeIp(raw: string): string {
  if (!raw) return "";
  const s = raw.trim();
  // Convert ::ffff:x.x.x.x (IPv4-mapped IPv6) to plain IPv4
  const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  // Convert loopback IPv6 to 127.0.0.1
  if (s === "::1" || s === "0:0:0:0:0:0:0:1") return "127.0.0.1";
  // Keep real IPv6 addresses as-is (e.g. 2804:14d:7630:...)
  return s;
}

export async function getAllIpWhitelist() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ipWhitelist).orderBy(desc(ipWhitelist.createdAt));
}

export async function addIpToWhitelist(
  ip: string,
  label?: string,
  userType: "admin" | "reseller" = "admin",
  userId?: number | null
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const normalized = normalizeIp(ip);
  await db.insert(ipWhitelist).values({
    ip: normalized,
    label: label || null,
    userType,
    userId: userId ?? null,
  });
}

export async function removeIpFromWhitelist(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(ipWhitelist).where(eq(ipWhitelist.id, id));
}

/** Check if IP is allowed for admin login. Empty list = allow all. */
export async function isAdminIpAllowed(rawIp: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;
  const ip = normalizeIp(rawIp);
  const adminEntries = await db.select().from(ipWhitelist).where(eq(ipWhitelist.userType, "admin"));
  if (adminEntries.length === 0) return true;
  return adminEntries.some(e => normalizeIp(e.ip) === ip);
}

/** Check if IP is allowed for a specific reseller. Empty list for that reseller = allow all. */
export async function isResellerIpAllowed(rawIp: string, resellerId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;
  const ip = normalizeIp(rawIp);
  const entries = await db.select().from(ipWhitelist).where(
    and(eq(ipWhitelist.userType, "reseller"), eq(ipWhitelist.userId, resellerId))
  );
  if (entries.length === 0) return true;
  return entries.some(e => normalizeIp(e.ip) === ip);
}

// Backward compat alias
export async function isIpWhitelisted(ip: string): Promise<boolean> {
  return isAdminIpAllowed(ip);
}


// ─── Pix Payments (Purin Cash) ───────────────────────────────────────────────
export async function createPixPayment(data: InsertPixPayment) {
  await ensurePixPaymentSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(pixPayments).values(data).returning();
  return row;
}

export async function getPixPaymentByPaymentId(paymentId: string) {
  await ensurePixPaymentSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(pixPayments).where(eq(pixPayments.paymentId, paymentId));
  return row ?? null;
}

export async function updatePixPaymentStatus(
  paymentId: string,
  status: "pending" | "paid" | "expired" | "refunded" | "cancelled",
  paidAt?: Date
) {
  await ensurePixPaymentSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(pixPayments)
    .set({ status, ...(paidAt ? { paidAt } : {}) })
    .where(eq(pixPayments.paymentId, paymentId));
}

export async function getPendingPixPaymentsByReseller(resellerId: number) {
  await ensurePixPaymentSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pixPayments)
    .where(and(eq(pixPayments.resellerId, resellerId), eq(pixPayments.status, "pending")))
    .orderBy(desc(pixPayments.createdAt));
}

export async function getPixPaymentsByReseller(resellerId: number) {
  await ensurePixPaymentSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pixPayments)
    .where(eq(pixPayments.resellerId, resellerId))
    .orderBy(desc(pixPayments.createdAt))
    .limit(20);
}

export async function getKeysByPaymentId(paymentId: string): Promise<string[]> {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  // Support both pix: and ltc: prefixes for payment notes
  const rows = await db.select({ keyValue: licenseKeys.keyValue })
    .from(licenseKeys)
    .where(
      or(
        eq(licenseKeys.note, `pix:${paymentId}`),
        eq(licenseKeys.note, `ltc:${paymentId}`)
      )
    );
  return rows.map(r => r.keyValue);
}

// ─── Password Management ───────────────────────────────────────────────────────
export async function updateAdminPassword(id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(admins).set({ passwordHash }).where(eq(admins.id, id));
}

export async function updateResellerPassword(id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellers).set({ passwordHash }).where(eq(resellers.id, id));
}

// ─── Tickets ──────────────────────────────────────────────────────────────────
export async function getTicketsByResellerId(resellerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tickets).where(eq(tickets.resellerId, resellerId)).orderBy(desc(tickets.updatedAt));
}

export async function getAllTickets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tickets).orderBy(desc(tickets.updatedAt));
}

export async function getTicketById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(tickets).where(eq(tickets.id, id));
  return row;
}

export async function createTicket(data: InsertTicket) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(tickets).values(data).returning();
  return row;
}

export async function updateTicketStatus(id: number, status: "open" | "closed" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tickets).set({ status, updatedAt: new Date() }).where(eq(tickets.id, id));
}

export async function updateTicketTimestamp(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, id));
}

export async function deleteTicket(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(ticketMessages).where(eq(ticketMessages.ticketId, id));
  await db.delete(tickets).where(eq(tickets.id, id));
}

export async function getTicketMessages(ticketId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, ticketId)).orderBy(ticketMessages.createdAt);
}

export async function createTicketMessage(data: InsertTicketMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(ticketMessages).values(data).returning();
  return row;
}

// ─── Reseller Applications ────────────────────────────────────────────────────
export async function createResellerApplication(data: InsertResellerApplication) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(resellerApplications).values(data).returning();
  return row;
}

export async function getResellerApplicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(resellerApplications).where(eq(resellerApplications.id, id));
  return row;
}

export async function getResellerApplicationByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(resellerApplications).where(eq(resellerApplications.email, email)).orderBy(desc(resellerApplications.createdAt)).limit(1);
  return row;
}

export async function getAllResellerApplications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellerApplications).orderBy(desc(resellerApplications.updatedAt));
}

export async function updateResellerApplicationStatus(id: number, status: "pending" | "pre_approved" | "approved" | "rejected" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellerApplications).set({ status, updatedAt: new Date() }).where(eq(resellerApplications.id, id));
}

export async function updateResellerApplicationTimestamp(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellerApplications).set({ updatedAt: new Date() }).where(eq(resellerApplications.id, id));
}

export async function deleteResellerApplication(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(applicationMessages).where(eq(applicationMessages.applicationId, id));
  await db.delete(resellerApplications).where(eq(resellerApplications.id, id));
}

export async function getApplicationMessages(applicationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applicationMessages).where(eq(applicationMessages.applicationId, applicationId)).orderBy(applicationMessages.createdAt);
}

export async function createApplicationMessage(data: InsertApplicationMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(applicationMessages).values(data).returning();
  return row;
}

// ─── Public Support Tickets (dúvidas) ─────────────────────────────────────────
export async function createSupportTicket(data: InsertSupportTicket) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(supportTickets).values(data).returning();
  return row;
}

export async function getSupportTicketById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [row] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
  return row;
}

export async function getAllSupportTickets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTickets).orderBy(desc(supportTickets.updatedAt));
}

export async function updateSupportTicketStatus(id: number, status: "open" | "closed" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(supportTickets).set({ status, updatedAt: new Date() }).where(eq(supportTickets.id, id));
}

export async function updateSupportTicketTimestamp(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(supportTickets).set({ updatedAt: new Date() }).where(eq(supportTickets.id, id));
}

export async function deleteSupportTicket(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(supportMessages).where(eq(supportMessages.ticketId, id));
  await db.delete(supportTickets).where(eq(supportTickets.id, id));
}

export async function getSupportMessages(ticketId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportMessages).where(eq(supportMessages.ticketId, ticketId)).orderBy(supportMessages.createdAt);
}

export async function createSupportMessage(data: InsertSupportMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(supportMessages).values(data).returning();
  return row;
}

// ─── App Stock ────────────────────────────────────────────────────────────────
export async function getAvailableStockForPlan(appId: number, planId: number, limit: number) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appStock).where(
    and(eq(appStock.appId, appId), eq(appStock.planId, planId), eq(appStock.status, "available"))
  ).orderBy(appStock.createdAt).limit(limit);
}

export async function reserveStockForReseller(id: number, resellerId: number) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(appStock)
    .set({ status: "sold", resellerId, soldAt: new Date() })
    .where(and(eq(appStock.id, id), eq(appStock.status, "available")))
    .returning();
  return row;
}

export async function addStockBatch(data: InsertAppStock[]) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.length === 0) return [];
  return db.insert(appStock).values(data).onConflictDoNothing({ target: appStock.keyValue }).returning();
}

export async function getStockByApp(appId: number) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appStock).where(eq(appStock.appId, appId)).orderBy(desc(appStock.createdAt));
}

export async function getStockCountsByApp(appId: number) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) return { available: 0, sold: 0 };
  const rows = await db.select({ status: appStock.status, count: sql<number>`count(*)` })
    .from(appStock)
    .where(eq(appStock.appId, appId))
    .groupBy(appStock.status);
  return {
    available: rows.find(r => r.status === "available")?.count ?? 0,
    sold: rows.find(r => r.status === "sold")?.count ?? 0,
  };
}

export async function deleteStock(id: number) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(appStock).where(eq(appStock.id, id));
}

// ─── App Downloads ─────────────────────────────────────────────────────────────
export async function getDownloadsByAppId(appId: number) {
  await ensureAppDownloadsSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appDownloads).where(eq(appDownloads.appId, appId)).orderBy(appDownloads.sortOrder, appDownloads.createdAt);
}

export async function getDownloadById(id: number) {
  await ensureAppDownloadsSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(appDownloads).where(eq(appDownloads.id, id));
  return row ?? null;
}

export async function createAppDownload(data: InsertAppDownload) {
  await ensureAppDownloadsSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(appDownloads).values(data).returning();
  return row;
}

export async function updateAppDownload(id: number, data: Partial<InsertAppDownload>) {
  await ensureAppDownloadsSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(appDownloads).set(data).where(eq(appDownloads.id, id)).returning();
  return row;
}

export async function deleteAppDownload(id: number) {
  await ensureAppDownloadsSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(appDownloads).where(eq(appDownloads.id, id));
}
