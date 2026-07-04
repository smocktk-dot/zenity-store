import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, admins, resellers, categories, apps, subscriptionPlans, resellerApps, licenseKeys, creditTransactions, ipWhitelist } from "../drizzle/schema";
import type { InsertAdmin, InsertReseller, InsertCategory, InsertApp, InsertSubscriptionPlan, InsertResellerApp, InsertLicenseKey, InsertCreditTransaction } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
    if (connectionString) {
      try {
        const client = postgres(connectionString, { ssl: "require" });
        _db = drizzle(client);
      } catch (error) {
        console.warn("[Database] Failed to connect:", error);
        _db = null;
      }
    }
  }
  return _db;
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
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenseKeys).where(eq(licenseKeys.resellerId, resellerId)).orderBy(desc(licenseKeys.createdAt));
}

export async function getAllKeys() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenseKeys).orderBy(desc(licenseKeys.createdAt));
}

export async function getKeyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLicenseKey(data: InsertLicenseKey) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(licenseKeys).values(data);
}

export async function updateLicenseKey(id: number, data: Partial<InsertLicenseKey>) {
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
export async function getAllIpWhitelist() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ipWhitelist).orderBy(desc(ipWhitelist.createdAt));
}

export async function addIpToWhitelist(ip: string, label?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(ipWhitelist).values({ ip, label: label || null });
}

export async function removeIpFromWhitelist(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(ipWhitelist).where(eq(ipWhitelist.id, id));
}

export async function isIpWhitelisted(ip: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true; // if DB unavailable, allow
  const list = await db.select().from(ipWhitelist);
  if (list.length === 0) return true; // if no IPs configured, allow all
  return list.some(entry => entry.ip === ip);
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
