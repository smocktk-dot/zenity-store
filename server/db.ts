import { eq, and, asc, desc, sql, inArray, or, aliasedTable, ilike, lower } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, admins, resellers, resellerApiKeys, categories, apps, subscriptionPlans, resellerApps, licenseKeys, appStock, appDownloads, creditTransactions, ipWhitelist, pixPayments, tickets, ticketMessages, resellerApplications, applicationMessages, supportTickets, supportMessages, otherStoreResellers, otherStoreHwids, resellerInfoProducts, vgauthApps, vgauthLicenses, vgauthUsers, vgauthBans, vgauthSessions, vgauthLogs } from "../drizzle/schema";
import type { InsertAdmin, InsertReseller, InsertResellerApiKey, InsertCategory, InsertApp, InsertSubscriptionPlan, InsertResellerApp, InsertLicenseKey, InsertAppStock, InsertAppDownload, InsertCreditTransaction, InsertPixPayment, InsertTicket, InsertTicketMessage, InsertResellerApplication, InsertApplicationMessage, InsertSupportTicket, InsertSupportMessage, InsertOtherStoreReseller, InsertOtherStoreHwid, InsertResellerInfoProduct, InsertVgauthApp, InsertVgauthLicense, InsertVgauthUser, InsertVgauthBan, InsertVgauthSession, InsertVgauthLog } from "../drizzle/schema";
import { ENV } from './_core/env';
import { randomUUID } from "crypto";

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlClient: ReturnType<typeof postgres> | null = null;
let _pixPaymentSchemaReady: Promise<void> | null = null;

export async function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("[Database] DATABASE_URL is not set");
    }
    try {
      // Nunca logue a connectionString completa — pode conter credenciais
      const sslRequired = connectionString.includes("sslmode=require") || connectionString.includes("ssl=true");
      const client = postgres(connectionString, sslRequired ? { ssl: "require" } : {});
      _sqlClient = client;
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect (check DATABASE_URL)");
      _db = null;
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

let _appsSchemaReady: Promise<void> | null = null;

export async function ensureAppsSchema(): Promise<void> {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");

  if (!_appsSchemaReady) {
    _appsSchemaReady = (async () => {
      try {
        await _sqlClient!.unsafe(`ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "keyMask" varchar(64)`);
      } catch (e) {
        console.error("[Database] Failed to ensure apps schema:", e);
        throw e;
      }
    })().then(() => undefined).catch(error => {
      _appsSchemaReady = null;
      console.error("[Database] Failed to ensure apps schema:", error);
      throw new Error("Não foi possível preparar o banco para apps");
    });
  }

  return _appsSchemaReady;
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
        await _sqlClient!.unsafe(`ALTER TABLE "reseller_api_keys" ADD COLUMN IF NOT EXISTS "allowUnpaidTake" boolean DEFAULT false NOT NULL`);
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

let _otherStoreSchemaReady: Promise<void> | null = null;

export async function ensureOtherStoreSchema(): Promise<void> {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");

  if (!_otherStoreSchemaReady) {
    _otherStoreSchemaReady = (async () => {
      try {
        await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "other_store_resellers" (
          "id" serial PRIMARY KEY,
          "resellerId" integer NOT NULL REFERENCES "resellers"("id"),
          "label" varchar(128),
          "purinApiKey" varchar(128),
          "recipientEmail" varchar(320) NOT NULL,
          "discordId" varchar(64),
          "splitPercent" decimal(5, 2) DEFAULT '45.00' NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL
        )`);
        await _sqlClient!.unsafe(`ALTER TABLE "other_store_resellers" ADD COLUMN IF NOT EXISTS "discordId" varchar(64)`).catch(() => {});
      } catch (e) {
        console.error("[Database] Failed to create other_store_resellers:", e);
        throw e;
      }

      try {
        await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "other_store_hwids" (
          "id" serial PRIMARY KEY,
          "otherStoreResellerId" integer NOT NULL REFERENCES "other_store_resellers"("id") ON DELETE CASCADE,
          "hwid" varchar(128) NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )`);
      } catch (e) {
        console.error("[Database] Failed to create other_store_hwids:", e);
        throw e;
      }
    })().then(() => undefined).catch(error => {
      _otherStoreSchemaReady = null;
      console.error("[Database] Failed to ensure other store schema:", error);
      throw new Error("Não foi possível preparar o banco para other store");
    });
  }

  return _otherStoreSchemaReady;
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
async function ensureResellerColumns() {
  if (!_sqlClient) return;
  await _sqlClient.unsafe(`ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "parentResellerId" integer`).catch(() => {});
  await _sqlClient.unsafe(`ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "canCreateSubResellers" boolean DEFAULT false`).catch(() => {});
}

export async function getResellerByUsername(username: string) {
  await ensureResellerColumns();
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

export async function getResellersByParentId(parentResellerId: number) {
  await ensureResellerColumns();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellers).where(eq(resellers.parentResellerId, parentResellerId)).orderBy(desc(resellers.createdAt));
}

export async function getResellerParent(parentResellerId: number) {
  return getResellerById(parentResellerId);
}

export async function getAllResellers() {
  await ensureResellerColumns();
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

export async function createResellerApiKey(data: { resellerId: number; name?: string | null; allowedIps?: string | null; allowUnpaidTake?: boolean }) {
  await ensureResellerApiKeySchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(resellerApiKeys).values({
    resellerId: data.resellerId,
    apiKey: randomUUID(),
    name: data.name ?? null,
    allowedIps: data.allowedIps ?? null,
    allowUnpaidTake: data.allowUnpaidTake ?? false,
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
  await ensureAppsSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apps).orderBy(desc(apps.createdAt));
}

export async function getAppById(id: number) {
  await ensureAppsSchema();
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apps).where(eq(apps.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppByName(name: string) {
  await ensureAppsSchema();
  const db = await getDb();
  if (!db) return undefined;
  const n = name.trim();
  const result = await db.select().from(apps).where(or(ilike(apps.name, n), sql`lower(${apps.name}) = lower(${n})`)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppByNameLike(term: string) {
  await ensureAppsSchema();
  const db = await getDb();
  if (!db) return undefined;
  const t = `%${term.trim().toLowerCase()}%`;
  const result = await db.select().from(apps).where(sql`lower(${apps.name}) like ${t}`).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createApp(data: InsertApp) {
  await ensureAppsSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(apps).values(data);
  return result;
}

export async function updateApp(id: number, data: Partial<InsertApp>) {
  await ensureAppsSchema();
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
  // Ordena por duração: diário → trial → semanal → mensal → lifetime
  return db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.appId, appId))
    .orderBy(asc(subscriptionPlans.durationDays), asc(subscriptionPlans.id));
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
  await ensureAppsSchema();
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

export async function getKeysByResellerIdWithApp(resellerId: number) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ key: licenseKeys, appName: apps.name })
    .from(licenseKeys)
    .leftJoin(apps, eq(licenseKeys.appId, apps.id))
    .where(eq(licenseKeys.resellerId, resellerId))
    .orderBy(desc(licenseKeys.createdAt));
  return rows.map(r => ({ ...r.key, appName: r.appName }));
}

export async function getAllKeys() {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenseKeys).orderBy(desc(licenseKeys.createdAt));
}

export async function getAllKeysWithReseller() {
  await ensureLicenseKeysSchema();
  await ensureResellerColumns();
  const db = await getDb();
  if (!db) return [];
  const parentResellers = aliasedTable(resellers, "parentResellers");
  const rows = await db.select({
    key: licenseKeys,
    reseller: resellers,
    parent: parentResellers,
    plan: subscriptionPlans,
  })
    .from(licenseKeys)
    .leftJoin(resellers, eq(licenseKeys.resellerId, resellers.id))
    .leftJoin(parentResellers, eq(resellers.parentResellerId, parentResellers.id))
    .leftJoin(subscriptionPlans, eq(licenseKeys.planId, subscriptionPlans.id))
    .orderBy(desc(licenseKeys.createdAt));
  return rows.map(r => ({
    ...r.key,
    resellerName: r.reseller?.username ?? "—",
    parentResellerName: r.parent?.username,
    resellerType: r.reseller?.resellerType ?? "credits",
    planPrice: r.plan?.resellerSellingPrice ?? "0.00",
    planPercentage: r.plan?.pricePercentage ?? "0.00",
    planCredits: r.plan?.priceCredits ?? "0.00",
    resellerDiscount: r.reseller?.discountPercent ?? "0",
  }));
}

export async function countKeysByReseller(resellerId: number, status?: "active" | "used" | "revoked" | "expired") {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return 0;
  const conds = [eq(licenseKeys.resellerId, resellerId)];
  if (status) conds.push(eq(licenseKeys.status, status));
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(licenseKeys)
    .where(and(...conds));
  return rows[0]?.count ?? 0;
}

export async function transferResellerKeys(fromResellerId: number, toResellerId: number, status?: "active" | "used" | "revoked" | "expired") {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const conds = [eq(licenseKeys.resellerId, fromResellerId)];
  if (status) conds.push(eq(licenseKeys.status, status));
  const updated = await db
    .update(licenseKeys)
    .set({ resellerId: toResellerId })
    .where(and(...conds))
    .returning({ id: licenseKeys.id });
  return updated.length;
}

export async function getSubResellerKeyStats(parentResellerId: number) {
  await ensureLicenseKeysSchema();
  await ensureResellerColumns();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    resellerId: resellers.id,
    username: resellers.username,
    count: sql<number>`count(${licenseKeys.id})`.as("count"),
    total: sql<string>`sum(${licenseKeys.creditsSpent})`.as("total"),
  })
    .from(resellers)
    .leftJoin(licenseKeys, eq(resellers.id, licenseKeys.resellerId))
    .where(eq(resellers.parentResellerId, parentResellerId))
    .groupBy(resellers.id, resellers.username)
    .orderBy(desc(sql`count`));
  return rows;
}

export async function getSubResellerKeyLogs(parentResellerId: number) {
  await ensureLicenseKeysSchema();
  await ensureResellerColumns();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    key: licenseKeys,
    reseller: resellers,
  })
    .from(licenseKeys)
    .innerJoin(resellers, eq(licenseKeys.resellerId, resellers.id))
    .where(eq(resellers.parentResellerId, parentResellerId))
    .orderBy(desc(licenseKeys.createdAt));
  return rows.map(r => ({ ...r.key, resellerName: r.reseller?.username ?? "—" }));
}

export async function getResellerKeyStatsByType(resellerType: "credits" | "percentage" | "other", limit = 20) {
  await ensureLicenseKeysSchema();
  await ensureResellerColumns();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    resellerId: resellers.id,
    username: resellers.username,
    count: sql<number>`count(${licenseKeys.id})`.as("count"),
    total: sql<string>`sum(${licenseKeys.creditsSpent})`.as("total"),
  })
    .from(resellers)
    .leftJoin(licenseKeys, eq(resellers.id, licenseKeys.resellerId))
    .where(eq(resellers.resellerType, resellerType))
    .groupBy(resellers.id, resellers.username)
    .orderBy(desc(sql`count`))
    .limit(limit);
  return rows;
}

export async function getDashboardKeysByMonth(months = 6) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    month: sql<string>`to_char(${licenseKeys.createdAt}, 'YYYY-MM')`.as("month"),
    count: sql<number>`count(${licenseKeys.id})`.as("count"),
    total: sql<string>`sum(${licenseKeys.creditsSpent})`.as("total"),
  })
    .from(licenseKeys)
    .where(sql`${licenseKeys.createdAt} >= now() - interval '6 months'`)
    .groupBy(sql`to_char(${licenseKeys.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`month`);
  return result;
}

export async function getDashboardTopApps(limit = 6) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    appId: licenseKeys.appId,
    count: sql<number>`count(${licenseKeys.id})`.as("count"),
    total: sql<string>`sum(${licenseKeys.creditsSpent})`.as("total"),
  })
    .from(licenseKeys)
    .groupBy(licenseKeys.appId)
    .orderBy(desc(sql`count`))
    .limit(limit);
  return result;
}

export async function getResellerKeysByMonth(resellerId: number) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    month: sql<string>`to_char(${licenseKeys.createdAt}, 'YYYY-MM')`.as("month"),
    count: sql<number>`count(${licenseKeys.id})`.as("count"),
    total: sql<string>`sum(${licenseKeys.creditsSpent})`.as("total"),
  })
    .from(licenseKeys)
    .where(and(eq(licenseKeys.resellerId, resellerId), sql`${licenseKeys.createdAt} >= now() - interval '6 months'`))
    .groupBy(sql`to_char(${licenseKeys.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`month`);
  return result;
}

export async function getResellerKeysByApp(resellerId: number) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    appId: licenseKeys.appId,
    count: sql<number>`count(${licenseKeys.id})`.as("count"),
  })
    .from(licenseKeys)
    .where(eq(licenseKeys.resellerId, resellerId))
    .groupBy(licenseKeys.appId)
    .orderBy(desc(sql`count`))
    .limit(5);
  return result;
}

export async function getKeyById(id: number) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getKeyByValue(keyValue: string) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.keyValue, keyValue)).limit(1);
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
  if (data.source !== undefined && data.source !== null) optionalValues.source = data.source;

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
  // Support pix, ltc and other-store prefixes for payment notes
  const rows = await db.select({ keyValue: licenseKeys.keyValue })
    .from(licenseKeys)
    .where(
      or(
        eq(licenseKeys.note, `pix:${paymentId}`),
        eq(licenseKeys.note, `ltc:${paymentId}`),
        eq(licenseKeys.note, `other-store:${paymentId}`)
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

export async function deleteResellerById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.transaction(async (tx) => {
    const target = await tx
      .select({ parentResellerId: resellers.parentResellerId })
      .from(resellers)
      .where(eq(resellers.id, id));

    const resellerTickets = await tx
      .select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.resellerId, id));
    const ticketIds = resellerTickets.map(t => t.id);
    if (ticketIds.length) {
      await tx.delete(ticketMessages).where(inArray(ticketMessages.ticketId, ticketIds));
    }
    await tx.delete(tickets).where(eq(tickets.resellerId, id));

    const osrRows = await tx
      .select({ id: otherStoreResellers.id })
      .from(otherStoreResellers)
      .where(eq(otherStoreResellers.resellerId, id));
    const osrIds = osrRows.map(r => r.id);
    if (osrIds.length) {
      await tx.delete(otherStoreHwids).where(inArray(otherStoreHwids.otherStoreResellerId, osrIds));
    }
    await tx.delete(otherStoreResellers).where(eq(otherStoreResellers.resellerId, id));

    await tx.delete(resellerApiKeys).where(eq(resellerApiKeys.resellerId, id));
    await tx.delete(resellerApps).where(eq(resellerApps.resellerId, id));
    await tx.delete(creditTransactions).where(eq(creditTransactions.resellerId, id));
    await tx.delete(pixPayments).where(eq(pixPayments.resellerId, id));
    await tx.delete(licenseKeys).where(eq(licenseKeys.resellerId, id));

    await tx.update(appStock).set({ resellerId: null }).where(eq(appStock.resellerId, id));
    await tx
      .update(resellers)
      .set({ parentResellerId: target[0]?.parentResellerId ?? null })
      .where(eq(resellers.parentResellerId, id));
    await tx
      .delete(ipWhitelist)
      .where(and(eq(ipWhitelist.userType, "reseller"), eq(ipWhitelist.userId, id)));

    await tx.delete(resellers).where(eq(resellers.id, id));
  });
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

export async function releaseStockReservation(id: number) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(appStock)
    .set({ status: "available", resellerId: null, soldAt: null })
    .where(and(eq(appStock.id, id), eq(appStock.status, "sold")))
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
  return db.select().from(appStock).where(and(eq(appStock.appId, appId), eq(appStock.status, "available"))).orderBy(desc(appStock.createdAt));
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

// ─── Other Store ──────────────────────────────────────────────────────────────
export async function createOtherStoreReseller(data: InsertOtherStoreReseller) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(otherStoreResellers).values(data).returning();
  return row;
}

export async function getOtherStoreResellers() {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(otherStoreResellers).orderBy(desc(otherStoreResellers.createdAt));
}

export async function getOtherStoreResellerById(id: number) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(otherStoreResellers).where(eq(otherStoreResellers.id, id));
  return row;
}

export async function getOtherStoreResellerByHwid(hwid: string) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ o: otherStoreResellers, i: otherStoreHwids })
    .from(otherStoreHwids)
    .innerJoin(otherStoreResellers, eq(otherStoreHwids.otherStoreResellerId, otherStoreResellers.id))
    .where(eq(otherStoreHwids.hwid, hwid));
  return rows[0]?.o ?? null;
}

export async function getOtherStoreResellerByDiscordId(discordId: string) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(otherStoreResellers).where(eq(otherStoreResellers.discordId, discordId));
  return rows[0] ?? null;
}

export async function getOtherStoreResellerByOwnerResellerId(ownerResellerId: number) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(otherStoreResellers).where(eq(otherStoreResellers.resellerId, ownerResellerId));
  return rows[0] ?? null;
}

export async function getOtherStoreResellerByResellerId(resellerId: number) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(otherStoreResellers).where(eq(otherStoreResellers.resellerId, resellerId));
  return rows[0] ?? null;
}

export async function updateOtherStoreReseller(id: number, data: Partial<InsertOtherStoreReseller>) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(otherStoreResellers).set(data).where(eq(otherStoreResellers.id, id)).returning();
  return row;
}

export async function deleteOtherStoreReseller(id: number) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(otherStoreResellers).where(eq(otherStoreResellers.id, id));
}

export async function createOtherStoreHwid(data: InsertOtherStoreHwid) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(otherStoreHwids).values(data).returning();
  return row;
}

export async function getOtherStoreHwidsByResellerId(otherStoreResellerId: number) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(otherStoreHwids).where(eq(otherStoreHwids.otherStoreResellerId, otherStoreResellerId));
}

export async function deleteOtherStoreHwid(id: number) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(otherStoreHwids).where(eq(otherStoreHwids.id, id));
}

// ─── Reseller Info Products (página pública /resellerinfo) ──────────────────────
let _resellerInfoSchemaReady: Promise<void> | null = null;

export async function ensureResellerInfoSchema(): Promise<void> {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");

  if (!_resellerInfoSchemaReady) {
    _resellerInfoSchemaReady = (async () => {
      try {
        await _sqlClient!.unsafe(`DO $$ BEGIN CREATE TYPE "reseller_info_status" AS ENUM('active', 'inactive'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
      } catch (e) { /* ignore duplicate */ }

      try {
        await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "reseller_info_products" (
          "id" serial PRIMARY KEY,
          "title" varchar(128) NOT NULL,
          "slug" varchar(128) NOT NULL UNIQUE,
          "tagline" varchar(255),
          "description" text,
          "descriptionEn" text,
          "pricingCredits" text,
          "pricingCreditsEn" text,
          "pricingPercentage" text,
          "pricingPercentageEn" text,
          "imageUrl" text,
          "galleryImages" text,
          "discordUrl" text,
          "sortOrder" integer DEFAULT 0 NOT NULL,
          "status" "reseller_info_status" DEFAULT 'active' NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL
        )`);
      } catch (e) {
        console.error("[Database] Failed to create reseller_info_products table:", e);
        throw e;
      }

      try {
        await _sqlClient!.unsafe(`ALTER TABLE "reseller_info_products"
          ADD COLUMN IF NOT EXISTS "descriptionEn" text,
          ADD COLUMN IF NOT EXISTS "pricingCreditsEn" text,
          ADD COLUMN IF NOT EXISTS "pricingPercentageEn" text
        `);
      } catch (e) { /* ignore if already exists */ }
    })().then(() => undefined).catch(error => {
      _resellerInfoSchemaReady = null;
      console.error("[Database] Failed to ensure reseller info schema:", error);
      throw new Error("Não foi possível preparar o banco para reseller info");
    });
  }

  return _resellerInfoSchemaReady;
}

export async function getAllResellerInfoProducts() {
  await ensureResellerInfoSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellerInfoProducts).orderBy(resellerInfoProducts.sortOrder, resellerInfoProducts.createdAt);
}

export async function getActiveResellerInfoProducts() {
  await ensureResellerInfoSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellerInfoProducts)
    .where(eq(resellerInfoProducts.status, "active"))
    .orderBy(resellerInfoProducts.sortOrder, resellerInfoProducts.createdAt);
}

export async function getResellerInfoProductById(id: number) {
  await ensureResellerInfoSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(resellerInfoProducts).where(eq(resellerInfoProducts.id, id));
  return row ?? null;
}

export async function createResellerInfoProduct(data: InsertResellerInfoProduct) {
  await ensureResellerInfoSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(resellerInfoProducts).values(data).returning();
  return row;
}

export async function updateResellerInfoProduct(id: number, data: Partial<InsertResellerInfoProduct>) {
  await ensureResellerInfoSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(resellerInfoProducts).set({ ...data, updatedAt: new Date() }).where(eq(resellerInfoProducts.id, id)).returning();
  return row;
}

export async function deleteResellerInfoProduct(id: number) {
  await ensureResellerInfoSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(resellerInfoProducts).where(eq(resellerInfoProducts.id, id));
}

// ═══════════════════════════════════════════════════════════════════════════════
// VG AUTH — sistema de autenticação (apps, licenses, users, bans, sessions, logs)
// ═══════════════════════════════════════════════════════════════════════════════

let _vgauthSchemaReady: Promise<void> | null = null;

export async function ensureVgAuthSchema(): Promise<void> {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");

  if (!_vgauthSchemaReady) {
    _vgauthSchemaReady = (async () => {
      await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "vgauth_apps" (
        "id" serial PRIMARY KEY,
        "name" varchar(128) NOT NULL,
        "ownerId" varchar(64) NOT NULL UNIQUE,
        "secret" varchar(128) NOT NULL UNIQUE,
        "version" varchar(32) DEFAULT '1.0' NOT NULL,
        "status" varchar(16) DEFAULT 'active' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      )`);
      await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "vgauth_licenses" (
        "id" serial PRIMARY KEY,
        "appId" integer NOT NULL REFERENCES "vgauth_apps"("id"),
        "keyValue" varchar(128) NOT NULL UNIQUE,
        "note" varchar(255),
        "subLevel" varchar(64) DEFAULT 'default' NOT NULL,
        "durationValue" integer NOT NULL,
        "durationUnit" varchar(16) DEFAULT 'days' NOT NULL,
        "status" varchar(16) DEFAULT 'active' NOT NULL,
        "usedBy" varchar(128),
        "hwidMb" varchar(255),
        "hwidCpu" varchar(255),
        "ip" varchar(64),
        "hwidViolations" integer DEFAULT 0 NOT NULL,
        "activatedAt" timestamp,
        "expiresAt" timestamp,
        "paused" boolean DEFAULT false NOT NULL,
        "pausedRemainingSec" integer,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )`);
      await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "vgauth_users" (
        "id" serial PRIMARY KEY,
        "appId" integer NOT NULL REFERENCES "vgauth_apps"("id"),
        "username" varchar(128) NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        "email" varchar(320),
        "licenseId" integer REFERENCES "vgauth_licenses"("id"),
        "subLevel" varchar(64) DEFAULT 'default' NOT NULL,
        "hwidMb" varchar(255),
        "hwidCpu" varchar(255),
        "ip" varchar(64),
        "status" varchar(16) DEFAULT 'active' NOT NULL,
        "expiresAt" timestamp,
        "lastLogin" timestamp,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )`);
      await _sqlClient!.unsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "vgauth_users_app_username" ON "vgauth_users" ("appId", "username")`);
      await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "vgauth_bans" (
        "id" serial PRIMARY KEY,
        "appId" integer REFERENCES "vgauth_apps"("id"),
        "username" varchar(128),
        "ip" varchar(64),
        "hwidMb" varchar(255),
        "hwidCpu" varchar(255),
        "reason" varchar(255),
        "createdBy" varchar(64) DEFAULT 'admin' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )`);
      await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "vgauth_sessions" (
        "id" serial PRIMARY KEY,
        "appId" integer NOT NULL REFERENCES "vgauth_apps"("id"),
        "token" varchar(128) NOT NULL UNIQUE,
        "encKey" varchar(128),
        "userId" integer,
        "username" varchar(128),
        "hwidMb" varchar(255),
        "hwidCpu" varchar(255),
        "ip" varchar(64),
        "expiresAt" timestamp NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )`);
      await _sqlClient!.unsafe(`CREATE TABLE IF NOT EXISTS "vgauth_logs" (
        "id" serial PRIMARY KEY,
        "appId" integer REFERENCES "vgauth_apps"("id"),
        "action" varchar(64) NOT NULL,
        "detail" text,
        "ip" varchar(64),
        "createdAt" timestamp DEFAULT now() NOT NULL
      )`);
    })().then(() => undefined).catch(error => {
      _vgauthSchemaReady = null;
      console.error("[Database] Failed to ensure vgauth schema:", error);
      throw new Error("Não foi possível preparar o banco para VG Auth");
    });
  }

  return _vgauthSchemaReady;
}

// ─── Apps ─────────────────────────────────────────────────────────────────────
export async function getAllVgauthApps() {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vgauthApps).orderBy(desc(vgauthApps.createdAt));
}

export async function getVgauthAppById(id: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(vgauthApps).where(eq(vgauthApps.id, id));
  return row ?? null;
}

export async function getVgauthAppByOwnerId(ownerId: string) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(vgauthApps).where(eq(vgauthApps.ownerId, ownerId));
  return row ?? null;
}

export async function createVgauthApp(data: InsertVgauthApp) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(vgauthApps).values(data).returning();
  return row;
}

export async function updateVgauthApp(id: number, data: Partial<InsertVgauthApp>) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(vgauthApps).set({ ...data, updatedAt: new Date() }).where(eq(vgauthApps.id, id)).returning();
  return row;
}

export async function deleteVgauthApp(id: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(vgauthLogs).where(eq(vgauthLogs.appId, id));
  await db.delete(vgauthSessions).where(eq(vgauthSessions.appId, id));
  await db.delete(vgauthBans).where(eq(vgauthBans.appId, id));
  await db.delete(vgauthUsers).where(eq(vgauthUsers.appId, id));
  await db.delete(vgauthLicenses).where(eq(vgauthLicenses.appId, id));
  await db.delete(vgauthApps).where(eq(vgauthApps.id, id));
}

// ─── Licenses ─────────────────────────────────────────────────────────────────
export async function getVgauthLicensesByApp(appId: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vgauthLicenses).where(eq(vgauthLicenses.appId, appId)).orderBy(desc(vgauthLicenses.createdAt));
}

export async function getVgauthLicenseByKey(appId: number, keyValue: string) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(vgauthLicenses)
    .where(and(eq(vgauthLicenses.appId, appId), eq(vgauthLicenses.keyValue, keyValue)));
  return row ?? null;
}

export async function getVgauthLicenseById(id: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(vgauthLicenses).where(eq(vgauthLicenses.id, id));
  return row ?? null;
}

export async function createVgauthLicense(data: InsertVgauthLicense) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(vgauthLicenses).values(data).returning();
  return row;
}

export async function updateVgauthLicense(id: number, data: Partial<InsertVgauthLicense>) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(vgauthLicenses).set(data).where(eq(vgauthLicenses.id, id)).returning();
  return row;
}

export async function deleteVgauthLicense(id: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(vgauthLicenses).where(eq(vgauthLicenses.id, id));
}

/** Pausa todas as keys do app: congela o tempo restante */
export async function pauseAllVgauthLicenses(appId: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  const rows = await db.select().from(vgauthLicenses)
    .where(and(eq(vgauthLicenses.appId, appId), eq(vgauthLicenses.paused, false)));
  let count = 0;
  for (const lic of rows) {
    const remaining = lic.expiresAt ? Math.max(0, Math.floor((lic.expiresAt.getTime() - now.getTime()) / 1000)) : null;
    await db.update(vgauthLicenses)
      .set({ paused: true, pausedRemainingSec: remaining, expiresAt: null })
      .where(eq(vgauthLicenses.id, lic.id));
    count++;
  }
  return count;
}

/** Retoma todas as keys pausadas do app */
export async function resumeAllVgauthLicenses(appId: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return 0;
  const now = Date.now();
  const rows = await db.select().from(vgauthLicenses)
    .where(and(eq(vgauthLicenses.appId, appId), eq(vgauthLicenses.paused, true)));
  let count = 0;
  for (const lic of rows) {
    const expiresAt = lic.pausedRemainingSec != null ? new Date(now + lic.pausedRemainingSec * 1000) : null;
    await db.update(vgauthLicenses)
      .set({ paused: false, pausedRemainingSec: null, expiresAt })
      .where(eq(vgauthLicenses.id, lic.id));
    count++;
  }
  return count;
}

/** Adiciona dias em todas as keys do app (pausadas somam no tempo restante) */
export async function addDaysAllVgauthLicenses(appId: number, days: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return 0;
  const addSec = days * 86400;
  const now = Date.now();
  const rows = await db.select().from(vgauthLicenses).where(eq(vgauthLicenses.appId, appId));
  let count = 0;
  for (const lic of rows) {
    if (lic.paused) {
      const remaining = (lic.pausedRemainingSec ?? 0) + addSec;
      await db.update(vgauthLicenses).set({ pausedRemainingSec: remaining }).where(eq(vgauthLicenses.id, lic.id));
    } else {
      // Keys nunca ativadas não têm relógio rodando — pular para não
      // começar a contagem antes do primeiro uso
      if (!lic.activatedAt && !lic.expiresAt) continue;
      const base = lic.expiresAt && lic.expiresAt.getTime() > now ? lic.expiresAt.getTime() : now;
      await db.update(vgauthLicenses).set({ expiresAt: new Date(base + addSec * 1000) }).where(eq(vgauthLicenses.id, lic.id));
    }
    count++;
  }
  return count;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function getVgauthUsersByApp(appId: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vgauthUsers).where(eq(vgauthUsers.appId, appId)).orderBy(desc(vgauthUsers.createdAt));
}

export async function getVgauthUserByUsername(appId: number, username: string) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(vgauthUsers)
    .where(and(eq(vgauthUsers.appId, appId), eq(vgauthUsers.username, username)));
  return row ?? null;
}

export async function createVgauthUser(data: InsertVgauthUser) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(vgauthUsers).values(data).returning();
  return row;
}

export async function updateVgauthUser(id: number, data: Partial<InsertVgauthUser>) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(vgauthUsers).set(data).where(eq(vgauthUsers.id, id)).returning();
  return row;
}

export async function deleteVgauthUser(id: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(vgauthUsers).where(eq(vgauthUsers.id, id));
}

// ─── Bans (globais — valem para todos os apps da auth) ─────────────────────────
export async function getVgauthBans(appId?: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return [];
  if (appId) {
    return db.select().from(vgauthBans).where(eq(vgauthBans.appId, appId)).orderBy(desc(vgauthBans.createdAt));
  }
  return db.select().from(vgauthBans).orderBy(desc(vgauthBans.createdAt));
}

/** Retorna o ban que casa com qualquer um dos identificadores (IP, HWID MB, HWID CPU) */
export async function findVgauthBan(identifiers: { ip?: string | null; hwidMb?: string | null; hwidCpu?: string | null }) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return null;
  const conds = [];
  if (identifiers.ip) conds.push(eq(vgauthBans.ip, identifiers.ip));
  if (identifiers.hwidMb) conds.push(eq(vgauthBans.hwidMb, identifiers.hwidMb));
  if (identifiers.hwidCpu) conds.push(eq(vgauthBans.hwidCpu, identifiers.hwidCpu));
  if (conds.length === 0) return null;
  const [row] = await db.select().from(vgauthBans).where(or(...conds)).limit(1);
  return row ?? null;
}

export async function createVgauthBan(data: InsertVgauthBan) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(vgauthBans).values(data).returning();
  return row;
}

export async function deleteVgauthBan(id: number) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(vgauthBans).where(eq(vgauthBans.id, id));
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export async function createVgauthSession(data: InsertVgauthSession) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(vgauthSessions).values(data).returning();
  return row;
}

export async function getVgauthSessionByToken(token: string) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(vgauthSessions).where(eq(vgauthSessions.token, token));
  return row ?? null;
}

export async function updateVgauthSession(id: number, data: Partial<InsertVgauthSession>) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(vgauthSessions).set(data).where(eq(vgauthSessions.id, id));
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
export async function createVgauthLog(data: InsertVgauthLog) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(vgauthLogs).values(data);
  } catch { /* logging must never break auth */ }
}

export async function getVgauthLogs(appId: number, limit = 200) {
  await ensureVgAuthSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vgauthLogs).where(eq(vgauthLogs.appId, appId)).orderBy(desc(vgauthLogs.createdAt)).limit(limit);
}
