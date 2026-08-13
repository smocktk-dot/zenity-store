var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  serial
} from "drizzle-orm/pg-core";
var userRoleEnum, resellerTypeEnum, resellerStatusEnum, appStatusEnum, planLevelEnum, keyStatusEnum, transactionTypeEnum, pixPaymentStatusEnum, ticketStatusEnum, ticketSenderEnum, applicationStatusEnum, applicationSenderEnum, supportTicketStatusEnum, supportMessageSenderEnum, users, admins, resellers, categories, apps, stockStatusEnum, subscriptionPlans, resellerApps, licenseKeys, appStock, creditTransactions, pixPayments, ipWhitelist, tickets, ticketMessages, resellerApplications, applicationMessages, supportTickets, supportMessages;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    userRoleEnum = pgEnum("user_role", ["user", "admin"]);
    resellerTypeEnum = pgEnum("reseller_type", ["credits", "percentage"]);
    resellerStatusEnum = pgEnum("reseller_status", ["active", "inactive", "banned"]);
    appStatusEnum = pgEnum("app_status", ["active", "inactive"]);
    planLevelEnum = pgEnum("plan_level", ["basic", "premium", "lifetime"]);
    keyStatusEnum = pgEnum("key_status", ["active", "used", "revoked", "expired"]);
    transactionTypeEnum = pgEnum("transaction_type", ["add", "deduct", "purchase"]);
    pixPaymentStatusEnum = pgEnum("pix_payment_status", ["pending", "paid", "expired", "refunded", "cancelled"]);
    ticketStatusEnum = pgEnum("ticket_status", ["open", "closed", "archived"]);
    ticketSenderEnum = pgEnum("ticket_sender", ["reseller", "admin"]);
    applicationStatusEnum = pgEnum("application_status", ["pending", "pre_approved", "approved", "rejected", "archived"]);
    applicationSenderEnum = pgEnum("application_sender", ["applicant", "admin"]);
    supportTicketStatusEnum = pgEnum("support_ticket_status", ["open", "closed", "archived"]);
    supportMessageSenderEnum = pgEnum("support_message_sender", ["user", "admin"]);
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: userRoleEnum("role").default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    admins = pgTable("admins", {
      id: serial("id").primaryKey(),
      username: varchar("username", { length: 64 }).notNull().unique(),
      passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    resellers = pgTable("resellers", {
      id: serial("id").primaryKey(),
      username: varchar("username", { length: 64 }).notNull().unique(),
      passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }),
      credits: decimal("credits", { precision: 12, scale: 2 }).default("0.00").notNull(),
      totalPurchases: integer("totalPurchases").default(0).notNull(),
      discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("35.00").notNull(),
      resellerType: resellerTypeEnum("resellerType").default("credits").notNull(),
      status: resellerStatusEnum("status").default("active").notNull(),
      location: varchar("location", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastLoginAt: timestamp("lastLoginAt")
    });
    categories = pgTable("categories", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 128 }).notNull().unique(),
      description: text("description"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    apps = pgTable("apps", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 128 }).notNull(),
      description: text("description"),
      version: varchar("version", { length: 32 }).default("v1.0"),
      categoryId: integer("categoryId").references(() => categories.id),
      status: appStatusEnum("status").default("active").notNull(),
      maxUsers: integer("maxUsers").default(5e3),
      features: text("features"),
      // JSON string of feature list
      keyauthSellerKey: varchar("keyauthSellerKey", { length: 64 }),
      // KeyAuth Seller API Key for this app
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    stockStatusEnum = pgEnum("stock_status", ["available", "sold"]);
    subscriptionPlans = pgTable("subscription_plans", {
      id: serial("id").primaryKey(),
      appId: integer("appId").notNull().references(() => apps.id),
      name: varchar("name", { length: 64 }).notNull(),
      // e.g. "Daily", "Weekly", "Monthly", "Lifetime"
      durationDays: integer("durationDays").notNull(),
      // 1, 7, 30, 9999
      priceCredits: decimal("priceCredits", { precision: 10, scale: 2 }).notNull(),
      pricePercentage: decimal("pricePercentage", { precision: 10, scale: 2 }).default("0.00").notNull(),
      resellerSellingPrice: decimal("resellerSellingPrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
      level: planLevelEnum("level").default("basic").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    resellerApps = pgTable("reseller_apps", {
      id: serial("id").primaryKey(),
      resellerId: integer("resellerId").notNull().references(() => resellers.id),
      appId: integer("appId").notNull().references(() => apps.id),
      assignedAt: timestamp("assignedAt").defaultNow().notNull()
    });
    licenseKeys = pgTable("license_keys", {
      id: serial("id").primaryKey(),
      keyValue: varchar("keyValue", { length: 128 }).notNull().unique(),
      resellerId: integer("resellerId").notNull().references(() => resellers.id),
      appId: integer("appId").notNull().references(() => apps.id),
      planId: integer("planId").references(() => subscriptionPlans.id),
      planName: varchar("planName", { length: 64 }),
      durationDays: integer("durationDays").notNull(),
      creditsSpent: decimal("creditsSpent", { precision: 10, scale: 2 }).notNull(),
      status: keyStatusEnum("status").default("active").notNull(),
      usedBy: varchar("usedBy", { length: 128 }),
      // username who activated
      hwid: varchar("hwid", { length: 255 }),
      activatedAt: timestamp("activatedAt"),
      expiresAt: timestamp("expiresAt"),
      note: text("note"),
      customMask: varchar("customMask", { length: 128 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    appStock = pgTable("app_stock", {
      id: serial("id").primaryKey(),
      appId: integer("appId").notNull().references(() => apps.id),
      planId: integer("planId").notNull().references(() => subscriptionPlans.id),
      keyValue: varchar("keyValue", { length: 128 }).notNull().unique(),
      status: stockStatusEnum("status").default("available").notNull(),
      resellerId: integer("resellerId").references(() => resellers.id),
      soldAt: timestamp("soldAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    creditTransactions = pgTable("credit_transactions", {
      id: serial("id").primaryKey(),
      resellerId: integer("resellerId").notNull().references(() => resellers.id),
      type: transactionTypeEnum("type").notNull(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      balanceBefore: decimal("balanceBefore", { precision: 12, scale: 2 }).notNull(),
      balanceAfter: decimal("balanceAfter", { precision: 12, scale: 2 }).notNull(),
      description: varchar("description", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    pixPayments = pgTable("pix_payments", {
      id: serial("id").primaryKey(),
      resellerId: integer("resellerId").notNull().references(() => resellers.id),
      paymentId: varchar("paymentId", { length: 128 }).notNull().unique(),
      // psc_...
      amountCents: integer("amountCents").notNull(),
      credits: decimal("credits", { precision: 10, scale: 2 }).notNull(),
      // credits to add (0 for key purchases)
      status: pixPaymentStatusEnum("status").notNull().default("pending"),
      brCode: text("brCode"),
      qrCodeImage: text("qrCodeImage"),
      expiresAt: timestamp("expiresAt"),
      paidAt: timestamp("paidAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      // Key purchase fields (null for credit purchases)
      paymentType: varchar("paymentType", { length: 32 }).default("credits").notNull(),
      // 'credits' | 'key'
      paymentMethod: varchar("paymentMethod", { length: 16 }).default("pix"),
      // 'pix' | 'ltc'
      appId: integer("appId").references(() => apps.id),
      planId: integer("planId").references(() => subscriptionPlans.id),
      quantity: integer("quantity").default(1)
    });
    ipWhitelist = pgTable("ip_whitelist", {
      id: serial("id").primaryKey(),
      ip: varchar("ip", { length: 64 }).notNull(),
      label: varchar("label", { length: 128 }),
      userType: varchar("userType", { length: 32 }).notNull().default("admin"),
      userId: integer("userId"),
      // null = any admin; for reseller = reseller.id
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    tickets = pgTable("tickets", {
      id: serial("id").primaryKey(),
      resellerId: integer("resellerId").notNull().references(() => resellers.id),
      subject: varchar("subject", { length: 255 }).notNull(),
      status: ticketStatusEnum("status").default("open").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    ticketMessages = pgTable("ticket_messages", {
      id: serial("id").primaryKey(),
      ticketId: integer("ticketId").notNull().references(() => tickets.id),
      senderType: ticketSenderEnum("senderType").notNull(),
      message: text("message").notNull(),
      imageUrl: text("imageUrl"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    resellerApplications = pgTable("reseller_applications", {
      id: serial("id").primaryKey(),
      discordLink: text("discordLink").notNull(),
      discordId: text("discordId").notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      product: text("product").notNull(),
      reason: text("reason").notNull(),
      status: applicationStatusEnum("status").default("pending").notNull(),
      ip: varchar("ip", { length: 64 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    applicationMessages = pgTable("application_messages", {
      id: serial("id").primaryKey(),
      applicationId: integer("applicationId").notNull().references(() => resellerApplications.id),
      senderType: applicationSenderEnum("senderType").notNull(),
      message: text("message").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    supportTickets = pgTable("support_tickets", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 128 }).notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      subject: varchar("subject", { length: 256 }).notNull(),
      question: text("question").notNull(),
      status: supportTicketStatusEnum("status").default("open").notNull(),
      ip: varchar("ip", { length: 64 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    supportMessages = pgTable("support_messages", {
      id: serial("id").primaryKey(),
      ticketId: integer("ticketId").notNull().references(() => supportTickets.id),
      senderType: supportMessageSenderEnum("senderType").notNull(),
      message: text("message").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addIpToWhitelist: () => addIpToWhitelist,
  addStockBatch: () => addStockBatch,
  assignAppToReseller: () => assignAppToReseller,
  createAdmin: () => createAdmin,
  createApp: () => createApp,
  createApplicationMessage: () => createApplicationMessage,
  createCategory: () => createCategory,
  createCreditTransaction: () => createCreditTransaction,
  createLicenseKey: () => createLicenseKey,
  createPixPayment: () => createPixPayment,
  createPlan: () => createPlan,
  createReseller: () => createReseller,
  createResellerApplication: () => createResellerApplication,
  createSupportMessage: () => createSupportMessage,
  createSupportTicket: () => createSupportTicket,
  createTicket: () => createTicket,
  createTicketMessage: () => createTicketMessage,
  deleteApp: () => deleteApp,
  deleteCategory: () => deleteCategory,
  deletePlan: () => deletePlan,
  deleteResellerApplication: () => deleteResellerApplication,
  deleteStock: () => deleteStock,
  deleteSupportTicket: () => deleteSupportTicket,
  deleteTicket: () => deleteTicket,
  ensurePixPaymentSchema: () => ensurePixPaymentSchema,
  getAdminById: () => getAdminById,
  getAdminByUsername: () => getAdminByUsername,
  getAllApps: () => getAllApps,
  getAllCategories: () => getAllCategories,
  getAllIpWhitelist: () => getAllIpWhitelist,
  getAllKeys: () => getAllKeys,
  getAllResellerApplications: () => getAllResellerApplications,
  getAllResellers: () => getAllResellers,
  getAllSupportTickets: () => getAllSupportTickets,
  getAllTickets: () => getAllTickets,
  getAppById: () => getAppById,
  getApplicationMessages: () => getApplicationMessages,
  getAppsByResellerId: () => getAppsByResellerId,
  getAssignedAppIds: () => getAssignedAppIds,
  getAvailableStockForPlan: () => getAvailableStockForPlan,
  getDb: () => getDb,
  getKeyById: () => getKeyById,
  getKeysByPaymentId: () => getKeysByPaymentId,
  getKeysByResellerId: () => getKeysByResellerId,
  getPendingPixPaymentsByReseller: () => getPendingPixPaymentsByReseller,
  getPixPaymentByPaymentId: () => getPixPaymentByPaymentId,
  getPixPaymentsByReseller: () => getPixPaymentsByReseller,
  getPlanById: () => getPlanById,
  getPlansByAppId: () => getPlansByAppId,
  getResellerApplicationByEmail: () => getResellerApplicationByEmail,
  getResellerApplicationById: () => getResellerApplicationById,
  getResellerById: () => getResellerById,
  getResellerByUsername: () => getResellerByUsername,
  getStockByApp: () => getStockByApp,
  getStockCountsByApp: () => getStockCountsByApp,
  getSupportMessages: () => getSupportMessages,
  getSupportTicketById: () => getSupportTicketById,
  getTicketById: () => getTicketById,
  getTicketMessages: () => getTicketMessages,
  getTicketsByResellerId: () => getTicketsByResellerId,
  getTransactionsByResellerId: () => getTransactionsByResellerId,
  getUserByOpenId: () => getUserByOpenId,
  isAdminIpAllowed: () => isAdminIpAllowed,
  isIpWhitelisted: () => isIpWhitelisted,
  isResellerIpAllowed: () => isResellerIpAllowed,
  normalizeIp: () => normalizeIp,
  removeAppFromReseller: () => removeAppFromReseller,
  removeIpFromWhitelist: () => removeIpFromWhitelist,
  reserveStockForReseller: () => reserveStockForReseller,
  updateAdminPassword: () => updateAdminPassword,
  updateApp: () => updateApp,
  updateCategory: () => updateCategory,
  updateLicenseKey: () => updateLicenseKey,
  updatePixPaymentStatus: () => updatePixPaymentStatus,
  updatePlan: () => updatePlan,
  updateReseller: () => updateReseller,
  updateResellerApplicationStatus: () => updateResellerApplicationStatus,
  updateResellerApplicationTimestamp: () => updateResellerApplicationTimestamp,
  updateResellerCredits: () => updateResellerCredits,
  updateResellerPassword: () => updateResellerPassword,
  updateSupportTicketStatus: () => updateSupportTicketStatus,
  updateSupportTicketTimestamp: () => updateSupportTicketTimestamp,
  updateTicketStatus: () => updateTicketStatus,
  updateTicketTimestamp: () => updateTicketTimestamp,
  upsertUser: () => upsertUser
});
import { eq, and, desc, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
async function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      try {
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
async function ensurePixPaymentSchema() {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");
  if (!_pixPaymentSchemaReady) {
    _pixPaymentSchemaReady = _sqlClient.begin(async (sql2) => {
      await sql2.unsafe(`ALTER TABLE "pix_payments" ADD COLUMN IF NOT EXISTS "paymentType" varchar(32) DEFAULT 'credits' NOT NULL`);
      await sql2.unsafe(`ALTER TABLE "pix_payments" ADD COLUMN IF NOT EXISTS "paymentMethod" varchar(16) DEFAULT 'pix'`);
      await sql2.unsafe(`ALTER TABLE "pix_payments" ADD COLUMN IF NOT EXISTS "appId" integer`);
      await sql2.unsafe(`ALTER TABLE "pix_payments" ADD COLUMN IF NOT EXISTS "planId" integer`);
      await sql2.unsafe(`ALTER TABLE "pix_payments" ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 1`);
    }).then(() => void 0).catch((error) => {
      _pixPaymentSchemaReady = null;
      console.error("[Database] Failed to ensure Pix payment schema:", error);
      throw new Error("N\xE3o foi poss\xEDvel preparar o banco para compras via Pix");
    });
  }
  return _pixPaymentSchemaReady;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  textFields.forEach((field) => {
    const value = user[field];
    if (value === void 0) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAdminByUsername(username) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(admins).where(eq(admins.username, username)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createAdmin(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(admins).values(data);
}
async function getAdminById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getResellerByUsername(username) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(resellers).where(eq(resellers.username, username)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getResellerById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(resellers).where(eq(resellers.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllResellers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellers).orderBy(desc(resellers.createdAt));
}
async function createReseller(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(resellers).values(data);
}
async function updateReseller(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellers).set(data).where(eq(resellers.id, id));
}
async function updateResellerCredits(id, newCredits, newPurchases, newDiscount) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellers).set({
    credits: newCredits,
    totalPurchases: newPurchases,
    discountPercent: newDiscount
  }).where(eq(resellers.id, id));
}
async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}
async function createCategory(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(categories).values(data);
}
async function updateCategory(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}
async function deleteCategory(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(categories).where(eq(categories.id, id));
}
async function getAllApps() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apps).orderBy(desc(apps.createdAt));
}
async function getAppById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(apps).where(eq(apps.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createApp(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(apps).values(data);
  return result;
}
async function updateApp(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(apps).set(data).where(eq(apps.id, id));
}
async function deleteApp(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.appId, id));
  for (const plan of plans) {
    await db.delete(licenseKeys).where(eq(licenseKeys.planId, plan.id));
  }
  await db.delete(subscriptionPlans).where(eq(subscriptionPlans.appId, id));
  await db.delete(resellerApps).where(eq(resellerApps.appId, id));
  await db.delete(apps).where(eq(apps.id, id));
}
async function getPlansByAppId(appId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.appId, appId));
}
async function getPlanById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createPlan(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(subscriptionPlans).values(data);
}
async function updatePlan(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id));
}
async function deletePlan(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(licenseKeys).where(eq(licenseKeys.planId, id));
  await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
}
async function getAppsByResellerId(resellerId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ app: apps, assignedAt: resellerApps.assignedAt }).from(resellerApps).innerJoin(apps, eq(resellerApps.appId, apps.id)).where(eq(resellerApps.resellerId, resellerId));
  return rows;
}
async function assignAppToReseller(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(resellerApps).where(and(eq(resellerApps.resellerId, data.resellerId), eq(resellerApps.appId, data.appId))).limit(1);
  if (existing.length > 0) return;
  await db.insert(resellerApps).values(data);
}
async function removeAppFromReseller(resellerId, appId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(resellerApps).where(and(eq(resellerApps.resellerId, resellerId), eq(resellerApps.appId, appId)));
}
async function getAssignedAppIds(resellerId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ appId: resellerApps.appId }).from(resellerApps).where(eq(resellerApps.resellerId, resellerId));
  return rows.map((r) => r.appId);
}
async function getKeysByResellerId(resellerId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenseKeys).where(eq(licenseKeys.resellerId, resellerId)).orderBy(desc(licenseKeys.createdAt));
}
async function getAllKeys() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenseKeys).orderBy(desc(licenseKeys.createdAt));
}
async function getKeyById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createLicenseKey(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const requiredValues = {
    keyValue: data.keyValue,
    resellerId: data.resellerId,
    appId: data.appId,
    planId: data.planId ?? null,
    planName: data.planName ?? null,
    durationDays: data.durationDays,
    creditsSpent: data.creditsSpent
  };
  const optionalValues = {};
  if (data.note !== void 0 && data.note !== null) optionalValues.note = data.note;
  if (data.customMask !== void 0 && data.customMask !== null) optionalValues.customMask = data.customMask;
  if (data.expiresAt !== void 0 && data.expiresAt !== null) optionalValues.expiresAt = data.expiresAt;
  await db.insert(licenseKeys).values({ ...requiredValues, ...optionalValues });
}
async function updateLicenseKey(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(licenseKeys).set(data).where(eq(licenseKeys.id, id));
}
async function getTransactionsByResellerId(resellerId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions).where(eq(creditTransactions.resellerId, resellerId)).orderBy(desc(creditTransactions.createdAt)).limit(50);
}
async function createCreditTransaction(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(creditTransactions).values(data);
}
function normalizeIp(raw) {
  if (!raw) return "";
  const s = raw.trim();
  const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  if (s === "::1" || s === "0:0:0:0:0:0:0:1") return "127.0.0.1";
  return s;
}
async function getAllIpWhitelist() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ipWhitelist).orderBy(desc(ipWhitelist.createdAt));
}
async function addIpToWhitelist(ip, label, userType = "admin", userId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const normalized = normalizeIp(ip);
  await db.insert(ipWhitelist).values({
    ip: normalized,
    label: label || null,
    userType,
    userId: userId ?? null
  });
}
async function removeIpFromWhitelist(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(ipWhitelist).where(eq(ipWhitelist.id, id));
}
async function isAdminIpAllowed(rawIp) {
  const db = await getDb();
  if (!db) return true;
  const ip = normalizeIp(rawIp);
  const adminEntries = await db.select().from(ipWhitelist).where(eq(ipWhitelist.userType, "admin"));
  if (adminEntries.length === 0) return true;
  return adminEntries.some((e) => normalizeIp(e.ip) === ip);
}
async function isResellerIpAllowed(rawIp, resellerId) {
  const db = await getDb();
  if (!db) return true;
  const ip = normalizeIp(rawIp);
  const entries = await db.select().from(ipWhitelist).where(
    and(eq(ipWhitelist.userType, "reseller"), eq(ipWhitelist.userId, resellerId))
  );
  if (entries.length === 0) return true;
  return entries.some((e) => normalizeIp(e.ip) === ip);
}
async function isIpWhitelisted(ip) {
  return isAdminIpAllowed(ip);
}
async function createPixPayment(data) {
  await ensurePixPaymentSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(pixPayments).values(data).returning();
  return row;
}
async function getPixPaymentByPaymentId(paymentId) {
  await ensurePixPaymentSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(pixPayments).where(eq(pixPayments.paymentId, paymentId));
  return row ?? null;
}
async function updatePixPaymentStatus(paymentId, status, paidAt) {
  await ensurePixPaymentSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(pixPayments).set({ status, ...paidAt ? { paidAt } : {} }).where(eq(pixPayments.paymentId, paymentId));
}
async function getPendingPixPaymentsByReseller(resellerId) {
  await ensurePixPaymentSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pixPayments).where(and(eq(pixPayments.resellerId, resellerId), eq(pixPayments.status, "pending"))).orderBy(desc(pixPayments.createdAt));
}
async function getPixPaymentsByReseller(resellerId) {
  await ensurePixPaymentSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pixPayments).where(eq(pixPayments.resellerId, resellerId)).orderBy(desc(pixPayments.createdAt)).limit(20);
}
async function getKeysByPaymentId(paymentId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ keyValue: licenseKeys.keyValue }).from(licenseKeys).where(
    or(
      eq(licenseKeys.note, `pix:${paymentId}`),
      eq(licenseKeys.note, `ltc:${paymentId}`)
    )
  );
  return rows.map((r) => r.keyValue);
}
async function updateAdminPassword(id, passwordHash) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(admins).set({ passwordHash }).where(eq(admins.id, id));
}
async function updateResellerPassword(id, passwordHash) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellers).set({ passwordHash }).where(eq(resellers.id, id));
}
async function getTicketsByResellerId(resellerId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tickets).where(eq(tickets.resellerId, resellerId)).orderBy(desc(tickets.updatedAt));
}
async function getAllTickets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tickets).orderBy(desc(tickets.updatedAt));
}
async function getTicketById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const [row] = await db.select().from(tickets).where(eq(tickets.id, id));
  return row;
}
async function createTicket(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(tickets).values(data).returning();
  return row;
}
async function updateTicketStatus(id, status) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tickets).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(tickets.id, id));
}
async function updateTicketTimestamp(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tickets).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(tickets.id, id));
}
async function deleteTicket(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(ticketMessages).where(eq(ticketMessages.ticketId, id));
  await db.delete(tickets).where(eq(tickets.id, id));
}
async function getTicketMessages(ticketId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, ticketId)).orderBy(ticketMessages.createdAt);
}
async function createTicketMessage(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(ticketMessages).values(data).returning();
  return row;
}
async function createResellerApplication(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(resellerApplications).values(data).returning();
  return row;
}
async function getResellerApplicationById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const [row] = await db.select().from(resellerApplications).where(eq(resellerApplications.id, id));
  return row;
}
async function getResellerApplicationByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const [row] = await db.select().from(resellerApplications).where(eq(resellerApplications.email, email)).orderBy(desc(resellerApplications.createdAt)).limit(1);
  return row;
}
async function getAllResellerApplications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellerApplications).orderBy(desc(resellerApplications.updatedAt));
}
async function updateResellerApplicationStatus(id, status) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellerApplications).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(resellerApplications.id, id));
}
async function updateResellerApplicationTimestamp(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellerApplications).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(resellerApplications.id, id));
}
async function deleteResellerApplication(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(applicationMessages).where(eq(applicationMessages.applicationId, id));
  await db.delete(resellerApplications).where(eq(resellerApplications.id, id));
}
async function getApplicationMessages(applicationId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applicationMessages).where(eq(applicationMessages.applicationId, applicationId)).orderBy(applicationMessages.createdAt);
}
async function createApplicationMessage(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(applicationMessages).values(data).returning();
  return row;
}
async function createSupportTicket(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(supportTickets).values(data).returning();
  return row;
}
async function getSupportTicketById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const [row] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
  return row;
}
async function getAllSupportTickets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTickets).orderBy(desc(supportTickets.updatedAt));
}
async function updateSupportTicketStatus(id, status) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(supportTickets).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(supportTickets.id, id));
}
async function updateSupportTicketTimestamp(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(supportTickets).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(supportTickets.id, id));
}
async function deleteSupportTicket(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(supportMessages).where(eq(supportMessages.ticketId, id));
  await db.delete(supportTickets).where(eq(supportTickets.id, id));
}
async function getSupportMessages(ticketId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportMessages).where(eq(supportMessages.ticketId, ticketId)).orderBy(supportMessages.createdAt);
}
async function createSupportMessage(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(supportMessages).values(data).returning();
  return row;
}
async function getAvailableStockForPlan(appId, planId, limit) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appStock).where(
    and(eq(appStock.appId, appId), eq(appStock.planId, planId), eq(appStock.status, "available"))
  ).orderBy(appStock.createdAt).limit(limit);
}
async function reserveStockForReseller(id, resellerId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(appStock).set({ status: "sold", resellerId, soldAt: /* @__PURE__ */ new Date() }).where(eq(appStock.id, id)).returning();
  return row;
}
async function addStockBatch(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.length === 0) return [];
  return db.insert(appStock).values(data).returning();
}
async function getStockByApp(appId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appStock).where(eq(appStock.appId, appId)).orderBy(desc(appStock.createdAt));
}
async function getStockCountsByApp(appId) {
  const db = await getDb();
  if (!db) return { available: 0, sold: 0 };
  const rows = await db.select({ status: appStock.status, count: sql`count(*)` }).from(appStock).where(eq(appStock.appId, appId)).groupBy(appStock.status);
  return {
    available: rows.find((r) => r.status === "available")?.count ?? 0,
    sold: rows.find((r) => r.status === "sold")?.count ?? 0
  };
}
async function deleteStock(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(appStock).where(eq(appStock.id, id));
}
var _db, _sqlClient, _pixPaymentSchemaReady;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
    _sqlClient = null;
    _pixPaymentSchemaReady = null;
  }
});

// server/_core/serverless.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
init_env();
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT as SignJWT2, jwtVerify as jwtVerify2 } from "jose";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/keyauth.ts
var DEFAULT_KEY_MASK = "***t**-***m**-*****k";
async function keyauthCreateLicense(opts) {
  if (!opts.sellerKey) {
    throw new Error("Seller key da KeyAuth n\xE3o configurada");
  }
  const expiry = opts.durationDays >= 9e3 ? 0 : opts.durationDays;
  const url = new URL("https://keyauth.win/api/seller/");
  url.searchParams.set("sellerkey", opts.sellerKey);
  url.searchParams.set("type", "add");
  url.searchParams.set("format", "json");
  url.searchParams.set("expiry", String(expiry));
  url.searchParams.set("mask", opts.mask || DEFAULT_KEY_MASK);
  url.searchParams.set("amount", String(opts.quantity));
  if (opts.owner) url.searchParams.set("owner", opts.owner);
  if (opts.note) url.searchParams.set("note", opts.note);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15e3) });
  if (!res.ok) {
    throw new Error(`KeyAuth respondeu HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(`KeyAuth: ${data.message || "falha ao criar licen\xE7a"}`);
  }
  const keys = Array.isArray(data.keys) ? data.keys : typeof data.key === "string" && data.key.length > 0 ? [data.key] : [];
  if (keys.length !== opts.quantity || keys.some((key) => typeof key !== "string" || key.length === 0)) {
    throw new Error(`KeyAuth retornou ${keys.length} de ${opts.quantity} licen\xE7a(s)`);
  }
  return keys;
}

// server/storage.ts
init_env();
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/routers.ts
init_db();
var JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "cv-reseller-secret-key-2024");
var CUSTOM_COOKIE = "cv_session";
function getClientIp(req) {
  const h = req.headers;
  const candidates = [
    h["cf-connecting-ip"] || "",
    h["true-client-ip"] || "",
    h["x-real-ip"] || "",
    (h["x-forwarded-for"] || "").split(",")[0].trim(),
    h["x-client-ip"] || "",
    req.socket?.remoteAddress || ""
  ];
  const raw = candidates.find((c) => c && c.length > 0) || "";
  return normalizeIp(raw);
}
var DEFAULT_KEY_MASK2 = "***t**-***m**-*****k";
function generateKeyValue(prefix, mask) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const activeMask = mask || DEFAULT_KEY_MASK2;
  return activeMask.replace(/\*/g, () => chars[Math.floor(Math.random() * chars.length)]);
}
async function uploadBase64Image(base64, folder = "tickets") {
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
var KEYAUTH_SELLER_KEY = process.env.KEYAUTH_SELLER_KEY || "dd1d4c88ede441586316b84e6c71dac7";
async function keyauthResetHwid(sellerKey, username) {
  const url = new URL("https://keyauth.win/api/seller/");
  url.searchParams.set("sellerkey", sellerKey);
  url.searchParams.set("type", "resetuser");
  url.searchParams.set("user", username);
  url.searchParams.set("format", "json");
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.success) {
    console.warn("[KeyAuth] HWID reset warning:", data.message);
  }
}
async function signCustomJwt(payload) {
  return new SignJWT2(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(JWT_SECRET);
}
async function verifyCustomJwt(token) {
  try {
    const { payload } = await jwtVerify2(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}
function getCustomToken(req) {
  const cookieHeader = req.headers?.cookie || "";
  const match = cookieHeader.match(new RegExp(`${CUSTOM_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}
var authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  adminLogin: publicProcedure.input(z2.object({ username: z2.string(), password: z2.string() })).mutation(async ({ input, ctx }) => {
    const clientIp = getClientIp(ctx.req);
    const ipAllowed = await isAdminIpAllowed(clientIp);
    if (!ipAllowed) throw new TRPCError3({ code: "FORBIDDEN", message: "Acesso negado: IP n\xE3o autorizado" });
    const admin = await getAdminByUsername(input.username);
    if (!admin) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    const valid = await bcrypt.compare(input.password, admin.passwordHash);
    if (!valid) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    const token = await signCustomJwt({ sub: String(admin.id), role: "admin", username: admin.username });
    ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: 7 * 24 * 3600 });
    return { success: true, role: "admin", username: admin.username };
  }),
  resellerLogin: publicProcedure.input(z2.object({ username: z2.string(), password: z2.string() })).mutation(async ({ input, ctx }) => {
    const admin = await getAdminByUsername(input.username);
    if (admin) {
      const validAdmin = await bcrypt.compare(input.password, admin.passwordHash);
      if (validAdmin) {
        const clientIp = getClientIp(ctx.req);
        const ipAllowed = await isAdminIpAllowed(clientIp);
        if (!ipAllowed) throw new TRPCError3({ code: "FORBIDDEN", message: "Acesso negado: IP n\xE3o autorizado" });
        const token2 = await signCustomJwt({ sub: String(admin.id), role: "admin", username: admin.username });
        ctx.res.cookie(CUSTOM_COOKIE, token2, { ...getSessionCookieOptions(ctx.req), maxAge: 7 * 24 * 3600 });
        return { success: true, role: "admin", username: admin.username };
      }
    }
    const reseller = await getResellerByUsername(input.username);
    if (!reseller) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    if (reseller.status !== "active") throw new TRPCError3({ code: "FORBIDDEN", message: "Conta desativada" });
    const valid = await bcrypt.compare(input.password, reseller.passwordHash);
    if (!valid) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    const resellerIp = getClientIp(ctx.req);
    const resellerIpAllowed = await isResellerIpAllowed(resellerIp, reseller.id);
    if (!resellerIpAllowed) throw new TRPCError3({ code: "FORBIDDEN", message: "Acesso negado: IP n\xE3o autorizado para este reseller" });
    await updateReseller(reseller.id, { lastLoginAt: /* @__PURE__ */ new Date() });
    const token = await signCustomJwt({ sub: String(reseller.id), role: "reseller", username: reseller.username });
    ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: 7 * 24 * 3600 });
    return { success: true, role: "reseller", username: reseller.username };
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
    const id = parseInt(payload.sub);
    if (payload.role === "admin") {
      const admin = await getAdminById(id);
      if (!admin) return null;
      return { id: admin.id, username: admin.username, role: "admin" };
    } else {
      const reseller = await getResellerById(id);
      if (!reseller) return null;
      return {
        id: reseller.id,
        username: reseller.username,
        role: "reseller",
        credits: reseller.credits,
        discountPercent: reseller.discountPercent,
        totalPurchases: reseller.totalPurchases,
        status: reseller.status
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
  setupAdmin: publicProcedure.input(z2.object({ username: z2.string().min(3), password: z2.string().min(6), setupKey: z2.string() })).mutation(async ({ input }) => {
    if (input.setupKey !== "CV-SETUP-2024") throw new TRPCError3({ code: "FORBIDDEN", message: "Chave de setup inv\xE1lida" });
    const existing = await getAdminByUsername(input.username);
    if (existing) throw new TRPCError3({ code: "CONFLICT", message: "Admin j\xE1 existe" });
    const passwordHash = await bcrypt.hash(input.password, 10);
    await createAdmin({ username: input.username, passwordHash });
    return { success: true };
  }),
  // ─── Reseller Applications (public) ───────────────────────────────────────────
  submitResellerApplication: publicProcedure.input(z2.object({
    discordLink: z2.string().min(1),
    discordId: z2.string().min(1),
    email: z2.string().email(),
    product: z2.string().min(1),
    reason: z2.string().min(1)
  })).mutation(async ({ input, ctx }) => {
    const ip = getClientIp(ctx.req);
    const existing = await getResellerApplicationByEmail(input.email);
    if (existing && ["pending", "pre_approved"].includes(existing.status)) {
      throw new TRPCError3({ code: "CONFLICT", message: "Voc\xEA j\xE1 possui uma aplica\xE7\xE3o em andamento" });
    }
    const row = await createResellerApplication({
      ...input,
      status: "pre_approved",
      ip
    });
    return { id: row.id, status: row.status };
  }),
  getMyApplication: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    const app2 = await getResellerApplicationById(input.id);
    if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
    const messages = await getApplicationMessages(input.id);
    return { ...app2, messages };
  }),
  sendApplicationMessage: publicProcedure.input(z2.object({
    applicationId: z2.number(),
    message: z2.string().min(1)
  })).mutation(async ({ input }) => {
    const app2 = await getResellerApplicationById(input.applicationId);
    if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
    if (app2.status === "archived" || app2.status === "rejected") {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Aplica\xE7\xE3o arquivada ou rejeitada" });
    }
    const msg = await createApplicationMessage({
      applicationId: input.applicationId,
      senderType: "applicant",
      message: input.message
    });
    await updateResellerApplicationTimestamp(input.applicationId);
    return msg;
  }),
  // ─── Public Support Tickets (dúvidas) ─────────────────────────────────────────
  submitSupportTicket: publicProcedure.input(z2.object({
    name: z2.string().min(1).max(128),
    email: z2.string().email(),
    subject: z2.string().min(1).max(256),
    question: z2.string().min(1)
  })).mutation(async ({ input, ctx }) => {
    const ip = getClientIp(ctx.req);
    const row = await createSupportTicket({ ...input, status: "open", ip });
    await createSupportMessage({
      ticketId: row.id,
      senderType: "user",
      message: input.question
    });
    return { id: row.id, status: row.status };
  }),
  getMySupportTicket: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    const ticket = await getSupportTicketById(input.id);
    if (!ticket) throw new TRPCError3({ code: "NOT_FOUND" });
    const messages = await getSupportMessages(input.id);
    return { ...ticket, messages };
  }),
  sendSupportMessage: publicProcedure.input(z2.object({
    ticketId: z2.number(),
    message: z2.string().min(1)
  })).mutation(async ({ input }) => {
    const ticket = await getSupportTicketById(input.ticketId);
    if (!ticket) throw new TRPCError3({ code: "NOT_FOUND" });
    if (ticket.status === "archived" || ticket.status === "closed") {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Ticket fechado ou arquivado" });
    }
    const msg = await createSupportMessage({
      ticketId: input.ticketId,
      senderType: "user",
      message: input.message
    });
    await updateSupportTicketTimestamp(input.ticketId);
    return msg;
  })
});
var adminProcedure2 = publicProcedure.use(async ({ ctx, next }) => {
  const token = getCustomToken(ctx.req);
  if (!token) throw new TRPCError3({ code: "UNAUTHORIZED" });
  const payload = await verifyCustomJwt(token);
  if (!payload || payload.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, adminId: parseInt(payload.sub) } });
});
var resellerProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = getCustomToken(ctx.req);
  if (!token) throw new TRPCError3({ code: "UNAUTHORIZED" });
  const payload = await verifyCustomJwt(token);
  if (!payload || payload.role !== "reseller") throw new TRPCError3({ code: "FORBIDDEN" });
  const resellerId = parseInt(payload.sub);
  const reseller = await getResellerById(resellerId);
  if (!reseller || reseller.status !== "active") throw new TRPCError3({ code: "FORBIDDEN", message: "Conta desativada" });
  return next({ ctx: { ...ctx, resellerId, reseller } });
});
var adminRouter = router({
  // Resellers
  listResellers: adminProcedure2.query(async () => {
    const list = await getAllResellers();
    return list.map((r) => ({ ...r, passwordHash: void 0 }));
  }),
  createReseller: adminProcedure2.input(z2.object({
    username: z2.string().min(3).max(64),
    password: z2.string().min(6),
    email: z2.string().email().optional(),
    location: z2.string().optional(),
    resellerType: z2.enum(["credits", "percentage"]).default("credits")
  })).mutation(async ({ input }) => {
    const existing = await getResellerByUsername(input.username);
    if (existing) throw new TRPCError3({ code: "CONFLICT", message: "Username j\xE1 existe" });
    const passwordHash = await bcrypt.hash(input.password, 10);
    await createReseller({ username: input.username, passwordHash, email: input.email, location: input.location, resellerType: input.resellerType });
    return { success: true };
  }),
  updateReseller: adminProcedure2.input(z2.object({
    id: z2.number(),
    email: z2.string().email().optional().nullable(),
    location: z2.string().optional().nullable(),
    status: z2.enum(["active", "inactive", "banned"]).optional(),
    password: z2.string().min(6).optional(),
    resellerType: z2.enum(["credits", "percentage"]).optional(),
    discountPercent: z2.number().min(0).max(100).optional()
  })).mutation(async ({ input }) => {
    const { id, password, discountPercent, ...rest } = input;
    const data = { ...rest };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    if (discountPercent !== void 0) data.discountPercent = discountPercent.toFixed(2);
    await updateReseller(id, data);
    return { success: true };
  }),
  addCredits: adminProcedure2.input(z2.object({ resellerId: z2.number(), amount: z2.number().positive(), description: z2.string().optional() })).mutation(async ({ input }) => {
    const reseller = await getResellerById(input.resellerId);
    if (!reseller) throw new TRPCError3({ code: "NOT_FOUND" });
    const before = parseFloat(reseller.credits);
    const after = before + input.amount;
    await updateReseller(input.resellerId, { credits: after.toFixed(2) });
    await createCreditTransaction({
      resellerId: input.resellerId,
      type: "add",
      amount: input.amount.toFixed(2),
      balanceBefore: before.toFixed(2),
      balanceAfter: after.toFixed(2),
      description: input.description || "Cr\xE9ditos adicionados pelo admin"
    });
    return { success: true, newBalance: after };
  }),
  // Categories
  listCategories: adminProcedure2.query(() => getAllCategories()),
  createCategory: adminProcedure2.input(z2.object({ name: z2.string().min(2), description: z2.string().optional() })).mutation(async ({ input }) => {
    await createCategory(input);
    return { success: true };
  }),
  updateCategory: adminProcedure2.input(z2.object({ id: z2.number(), name: z2.string().min(2).optional(), description: z2.string().optional() })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateCategory(id, data);
    return { success: true };
  }),
  deleteCategory: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteCategory(input.id);
    return { success: true };
  }),
  // Apps
  listApps: adminProcedure2.query(() => getAllApps()),
  getApp: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    const app2 = await getAppById(input.id);
    if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
    const plans = await getPlansByAppId(input.id);
    return { ...app2, plans };
  }),
  createApp: adminProcedure2.input(z2.object({
    name: z2.string().min(2),
    description: z2.string().optional(),
    version: z2.string().optional(),
    categoryId: z2.number().optional(),
    maxUsers: z2.number().optional(),
    features: z2.string().optional(),
    keyauthSellerKey: z2.string().length(32).optional()
  })).mutation(async ({ input }) => {
    await createApp(input);
    return { success: true };
  }),
  updateApp: adminProcedure2.input(z2.object({
    id: z2.number(),
    name: z2.string().optional(),
    description: z2.string().optional(),
    version: z2.string().optional(),
    categoryId: z2.number().optional().nullable(),
    status: z2.enum(["active", "inactive"]).optional(),
    maxUsers: z2.number().optional(),
    features: z2.string().optional(),
    keyauthSellerKey: z2.string().length(32).optional().nullable()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateApp(id, data);
    return { success: true };
  }),
  deleteApp: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteApp(input.id);
    return { success: true };
  }),
  // Plans
  createPlan: adminProcedure2.input(z2.object({
    appId: z2.number(),
    name: z2.string(),
    durationDays: z2.number().positive(),
    priceCredits: z2.number().positive(),
    pricePercentage: z2.number().min(0).optional(),
    resellerSellingPrice: z2.number().min(0).optional(),
    level: z2.enum(["basic", "premium", "lifetime"]).optional()
  })).mutation(async ({ input }) => {
    await createPlan({
      ...input,
      priceCredits: input.priceCredits.toFixed(2),
      pricePercentage: (input.pricePercentage ?? 0).toFixed(2),
      resellerSellingPrice: (input.resellerSellingPrice ?? 0).toFixed(2)
    });
    return { success: true };
  }),
  updatePlan: adminProcedure2.input(z2.object({
    id: z2.number(),
    name: z2.string().optional(),
    durationDays: z2.number().optional(),
    priceCredits: z2.number().optional(),
    pricePercentage: z2.number().min(0).optional(),
    resellerSellingPrice: z2.number().min(0).optional(),
    level: z2.enum(["basic", "premium", "lifetime"]).optional()
  })).mutation(async ({ input }) => {
    const { id, priceCredits, pricePercentage, resellerSellingPrice, ...rest } = input;
    const data = { ...rest };
    if (priceCredits !== void 0) data.priceCredits = priceCredits.toFixed(2);
    if (pricePercentage !== void 0) data.pricePercentage = pricePercentage.toFixed(2);
    if (resellerSellingPrice !== void 0) data.resellerSellingPrice = resellerSellingPrice.toFixed(2);
    await updatePlan(id, data);
    return { success: true };
  }),
  deletePlan: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deletePlan(input.id);
    return { success: true };
  }),
  // ─── App Stock ────────────────────────────────────────────────────────────────
  addStock: adminProcedure2.input(z2.object({
    appId: z2.number(),
    planId: z2.number(),
    keys: z2.string().min(1)
  })).mutation(async ({ input }) => {
    const lines = input.keys.split("\n").map((k) => k.trim()).filter((k) => k.length > 0);
    if (lines.length === 0) throw new TRPCError3({ code: "BAD_REQUEST", message: "Nenhuma key informada" });
    const batch = lines.map((keyValue) => ({
      appId: input.appId,
      planId: input.planId,
      keyValue,
      status: "available"
    }));
    const rows = await addStockBatch(batch);
    return { added: rows.length };
  }),
  getStockByApp: adminProcedure2.input(z2.object({ appId: z2.number() })).query(async ({ input }) => {
    const [items, counts] = await Promise.all([
      getStockByApp(input.appId),
      getStockCountsByApp(input.appId)
    ]);
    return { items, ...counts };
  }),
  deleteStock: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteStock(input.id);
    return { success: true };
  }),
  getAvailableStockForPlan: adminProcedure2.input(z2.object({ appId: z2.number(), planId: z2.number() })).query(async ({ input }) => {
    return getAvailableStockForPlan(input.appId, input.planId, 1);
  }),
  manualDeliverKey: adminProcedure2.input(z2.object({
    resellerId: z2.number(),
    appId: z2.number(),
    planId: z2.number(),
    keyValue: z2.string().min(1),
    stockId: z2.number().optional(),
    note: z2.string().optional()
  })).mutation(async ({ input }) => {
    const reseller = await getResellerById(input.resellerId);
    if (!reseller) throw new TRPCError3({ code: "NOT_FOUND" });
    const plan = await getPlanById(input.planId);
    if (!plan) throw new TRPCError3({ code: "NOT_FOUND" });
    const app2 = await getAppById(input.appId);
    if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
    if (input.stockId) {
      const stock = await reserveStockForReseller(input.stockId, input.resellerId);
      if (!stock) throw new TRPCError3({ code: "BAD_REQUEST", message: "Estoque n\xE3o dispon\xEDvel" });
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
      ...input.note ? { note: input.note } : {}
    });
    return { success: true };
  }),
  // Assign apps to resellers
  assignApp: adminProcedure2.input(z2.object({ resellerId: z2.number(), appId: z2.number() })).mutation(async ({ input }) => {
    await assignAppToReseller(input);
    return { success: true };
  }),
  removeApp: adminProcedure2.input(z2.object({ resellerId: z2.number(), appId: z2.number() })).mutation(async ({ input }) => {
    await removeAppFromReseller(input.resellerId, input.appId);
    return { success: true };
  }),
  getResellerApps: adminProcedure2.input(z2.object({ resellerId: z2.number() })).query(async ({ input }) => {
    const assigned = await getAssignedAppIds(input.resellerId);
    const all = await getAllApps();
    return { assigned, all };
  }),
  // All keys
  listAllKeys: adminProcedure2.query(() => getAllKeys()),
  // IP Whitelist management
  listIpWhitelist: adminProcedure2.query(() => getAllIpWhitelist()),
  addIp: adminProcedure2.input(z2.object({
    ip: z2.string().min(1),
    label: z2.string().optional(),
    userType: z2.enum(["admin", "reseller"]).default("admin"),
    userId: z2.number().optional().nullable()
  })).mutation(async ({ input }) => {
    await addIpToWhitelist(input.ip, input.label, input.userType, input.userId);
    return { success: true };
  }),
  removeIp: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await removeIpFromWhitelist(input.id);
    return { success: true };
  }),
  // Password management
  changeAdminPassword: adminProcedure2.input(z2.object({
    currentPassword: z2.string().min(1),
    newPassword: z2.string().min(6, "Nova senha deve ter pelo menos 6 caracteres")
  })).mutation(async ({ input, ctx }) => {
    const admin = await getAdminById(ctx.adminId);
    if (!admin) throw new TRPCError3({ code: "NOT_FOUND" });
    const valid = await bcrypt.compare(input.currentPassword, admin.passwordHash);
    if (!valid) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Senha atual incorreta" });
    const newHash = await bcrypt.hash(input.newPassword, 10);
    await updateAdminPassword(admin.id, newHash);
    return { success: true };
  }),
  changeResellerPassword: adminProcedure2.input(z2.object({
    resellerId: z2.number(),
    newPassword: z2.string().min(6, "Nova senha deve ter pelo menos 6 caracteres")
  })).mutation(async ({ input }) => {
    const reseller = await getResellerById(input.resellerId);
    if (!reseller) throw new TRPCError3({ code: "NOT_FOUND", message: "Reseller n\xE3o encontrado" });
    const newHash = await bcrypt.hash(input.newPassword, 10);
    await updateResellerPassword(input.resellerId, newHash);
    return { success: true };
  }),
  // ─── Tickets ─────────────────────────────────────────────────────────────────
  listTickets: adminProcedure2.query(async () => {
    const rows = await getAllTickets();
    const resellers2 = await getAllResellers();
    const map = new Map(resellers2.map((r) => [r.id, r.username]));
    return rows.map((t2) => ({ ...t2, resellerUsername: map.get(t2.resellerId) || "Unknown" }));
  }),
  getTicket: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    const ticket = await getTicketById(input.id);
    if (!ticket) throw new TRPCError3({ code: "NOT_FOUND" });
    const messages = await getTicketMessages(input.id);
    const reseller = await getResellerById(ticket.resellerId);
    return { ...ticket, resellerUsername: reseller?.username || "Unknown", messages };
  }),
  sendTicketMessage: adminProcedure2.input(z2.object({
    ticketId: z2.number(),
    message: z2.string().min(1),
    imageBase64: z2.string().optional()
  })).mutation(async ({ input }) => {
    const ticket = await getTicketById(input.ticketId);
    if (!ticket) throw new TRPCError3({ code: "NOT_FOUND" });
    let imageUrl;
    if (input.imageBase64) {
      imageUrl = await uploadBase64Image(input.imageBase64) || void 0;
    }
    const msg = await createTicketMessage({
      ticketId: input.ticketId,
      senderType: "admin",
      message: input.message,
      imageUrl
    });
    await updateTicketTimestamp(input.ticketId);
    return msg;
  }),
  updateTicketStatus: adminProcedure2.input(z2.object({
    id: z2.number(),
    status: z2.enum(["open", "closed", "archived"])
  })).mutation(async ({ input }) => {
    await updateTicketStatus(input.id, input.status);
    return { success: true };
  }),
  deleteTicket: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteTicket(input.id);
    return { success: true };
  }),
  // ─── Reseller Applications ───────────────────────────────────────────────────
  listResellerApplications: adminProcedure2.query(() => getAllResellerApplications()),
  getResellerApplication: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    const app2 = await getResellerApplicationById(input.id);
    if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
    const messages = await getApplicationMessages(input.id);
    return { ...app2, messages };
  }),
  sendApplicationMessageAdmin: adminProcedure2.input(z2.object({
    applicationId: z2.number(),
    message: z2.string().min(1)
  })).mutation(async ({ input }) => {
    const app2 = await getResellerApplicationById(input.applicationId);
    if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
    const msg = await createApplicationMessage({
      applicationId: input.applicationId,
      senderType: "admin",
      message: input.message
    });
    await updateResellerApplicationTimestamp(input.applicationId);
    return msg;
  }),
  updateResellerApplicationStatus: adminProcedure2.input(z2.object({
    id: z2.number(),
    status: z2.enum(["pending", "pre_approved", "approved", "rejected", "archived"])
  })).mutation(async ({ input }) => {
    await updateResellerApplicationStatus(input.id, input.status);
    return { success: true };
  }),
  deleteResellerApplication: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteResellerApplication(input.id);
    return { success: true };
  }),
  // ─── Public Support Tickets (dúvidas) ─────────────────────────────────────────
  listSupportTickets: adminProcedure2.query(() => getAllSupportTickets()),
  getSupportTicket: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    const ticket = await getSupportTicketById(input.id);
    if (!ticket) throw new TRPCError3({ code: "NOT_FOUND" });
    const messages = await getSupportMessages(input.id);
    return { ...ticket, messages };
  }),
  sendSupportMessageAdmin: adminProcedure2.input(z2.object({
    ticketId: z2.number(),
    message: z2.string().min(1)
  })).mutation(async ({ input }) => {
    const ticket = await getSupportTicketById(input.ticketId);
    if (!ticket) throw new TRPCError3({ code: "NOT_FOUND" });
    const msg = await createSupportMessage({
      ticketId: input.ticketId,
      senderType: "admin",
      message: input.message
    });
    await updateSupportTicketTimestamp(input.ticketId);
    return msg;
  }),
  updateSupportTicketStatus: adminProcedure2.input(z2.object({
    id: z2.number(),
    status: z2.enum(["open", "closed", "archived"])
  })).mutation(async ({ input }) => {
    await updateSupportTicketStatus(input.id, input.status);
    return { success: true };
  }),
  deleteSupportTicket: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteSupportTicket(input.id);
    return { success: true };
  })
});
var resellerRouter = router({
  profile: resellerProcedure.query(async ({ ctx }) => {
    const r = ctx.reseller;
    const purchases = r.totalPurchases;
    const discount = parseFloat(r.discountPercent) || 0;
    const nextLevel = r.resellerType === "percentage" && purchases < 10 ? { target: 10, discount: 40 } : r.resellerType === "percentage" && purchases < 20 ? { target: 20, discount: 50 } : null;
    const transactions = await getTransactionsByResellerId(r.id);
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      location: r.location,
      credits: r.credits,
      discountPercent: discount,
      totalPurchases: purchases,
      resellerType: r.resellerType,
      status: r.status,
      createdAt: r.createdAt,
      lastLoginAt: r.lastLoginAt,
      nextLevel,
      transactions
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
  appDetail: resellerProcedure.input(z2.object({ appId: z2.number() })).query(async ({ ctx, input }) => {
    const assigned = await getAssignedAppIds(ctx.resellerId);
    if (!assigned.includes(input.appId)) throw new TRPCError3({ code: "FORBIDDEN" });
    const app2 = await getAppById(input.appId);
    if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
    const plans = await getPlansByAppId(input.appId);
    return { ...app2, plans };
  }),
  myKeys: resellerProcedure.query(async ({ ctx }) => {
    return getKeysByResellerId(ctx.resellerId);
  }),
  generateKeys: resellerProcedure.input(z2.object({
    appId: z2.number(),
    planId: z2.number(),
    quantity: z2.number().min(1).max(100),
    customMask: z2.string().optional(),
    note: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const reseller = ctx.reseller;
    if (reseller.resellerType !== "credits") {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Esta a\xE7\xE3o \xE9 apenas para resellers de cr\xE9ditos" });
    }
    const assigned = await getAssignedAppIds(ctx.resellerId);
    if (!assigned.includes(input.appId)) throw new TRPCError3({ code: "FORBIDDEN", message: "App n\xE3o dispon\xEDvel" });
    const plan = await getPlanById(input.planId);
    if (!plan || plan.appId !== input.appId) throw new TRPCError3({ code: "NOT_FOUND", message: "Plano n\xE3o encontrado" });
    const app2 = await getAppById(input.appId);
    if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
    const basePrice = parseFloat(plan.priceCredits);
    const discountedPrice = basePrice;
    const totalCost = discountedPrice * input.quantity;
    const currentCredits = parseFloat(reseller.credits);
    if (currentCredits < totalCost) {
      throw new TRPCError3({ code: "BAD_REQUEST", message: `Cr\xE9ditos insuficientes. Necess\xE1rio: ${totalCost.toFixed(2)}, Dispon\xEDvel: ${currentCredits.toFixed(2)}` });
    }
    const newCredits = currentCredits - totalCost;
    const newPurchases = reseller.totalPurchases + input.quantity;
    await updateResellerCredits(ctx.resellerId, newCredits.toFixed(2), newPurchases, reseller.discountPercent);
    await createCreditTransaction({
      resellerId: ctx.resellerId,
      type: "deduct",
      amount: totalCost.toFixed(2),
      balanceBefore: currentCredits.toFixed(2),
      balanceAfter: newCredits.toFixed(2),
      description: `Gera\xE7\xE3o de ${input.quantity}x key(s) - ${app2.name} (${plan.name})`
    });
    const reserved = await getAvailableStockForPlan(input.appId, input.planId, input.quantity);
    if (reserved.length < input.quantity) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: `Estoque insuficiente. Dispon\xEDvel: ${reserved.length}, Solicitado: ${input.quantity}`
      });
    }
    const generatedKeys = [];
    for (const stock of reserved) {
      await reserveStockForReseller(stock.id, ctx.resellerId);
      await createLicenseKey({
        keyValue: stock.keyValue,
        resellerId: ctx.resellerId,
        appId: input.appId,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
        creditsSpent: discountedPrice.toFixed(2),
        ...input.note ? { note: input.note } : {},
        ...input.customMask ? { customMask: input.customMask } : {}
      });
      generatedKeys.push(stock.keyValue);
    }
    return { success: true, keys: generatedKeys, creditsSpent: totalCost, newBalance: newCredits };
  }),
  resetHwid: resellerProcedure.input(z2.object({ keyId: z2.number() })).mutation(async ({ ctx, input }) => {
    const key = await getKeyById(input.keyId);
    if (!key || key.resellerId !== ctx.resellerId) throw new TRPCError3({ code: "FORBIDDEN" });
    await updateLicenseKey(input.keyId, { hwid: null });
    if (key.usedBy) {
      const app2 = await getAppById(key.appId);
      const sellerKey = app2?.keyauthSellerKey || KEYAUTH_SELLER_KEY;
      try {
        await keyauthResetHwid(sellerKey, key.usedBy);
      } catch (err) {
        console.warn("[KeyAuth] HWID reset failed (non-critical):", err);
      }
    }
    return { success: true };
  }),
  revokeKey: resellerProcedure.input(z2.object({ keyId: z2.number() })).mutation(async ({ ctx, input }) => {
    const key = await getKeyById(input.keyId);
    if (!key || key.resellerId !== ctx.resellerId) throw new TRPCError3({ code: "FORBIDDEN" });
    if (key.status === "used") throw new TRPCError3({ code: "BAD_REQUEST", message: "Key j\xE1 utilizada n\xE3o pode ser revogada" });
    await updateLicenseKey(input.keyId, { status: "revoked" });
    return { success: true };
  }),
  // ─── Pix / Purin Cash ──────────────────────────────────────────────────────
  createPixCharge: resellerProcedure.input(z2.object({
    credits: z2.number().min(1, "M\xEDnimo 1 cr\xE9dito").max(1e4, "M\xE1ximo 10000 cr\xE9ditos")
  })).mutation(async ({ ctx, input }) => {
    const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
    if (!PURIN_API_KEY) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Pix n\xE3o configurado" });
    const reseller = ctx.reseller;
    const amountCents = Math.round(input.credits * 100);
    const callbackUrl = `${process.env.VITE_APP_URL || "https://cvreseller-n3qqggx2.manus.space"}/api/webhooks/purincash`;
    const body = {
      valueCents: amountCents,
      description: `Compra de ${input.credits} cr\xE9dito(s) - ZENITY STORE`,
      callbackUrl,
      customer: {
        name: reseller.username,
        email: reseller.email || `${reseller.username}@zenitystore.com`,
        externalId: String(reseller.id)
      },
      metadata: JSON.stringify({ resellerId: reseller.id, credits: input.credits })
    };
    const response = await fetch("https://api.purincash.com/v1/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PURIN_API_KEY}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[PurinCash] Error creating charge:", err);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cobran\xE7a Pix" });
    }
    const data = await response.json();
    const payment = await createPixPayment({
      resellerId: reseller.id,
      paymentId: data.paymentId,
      amountCents: data.amountCents,
      credits: input.credits.toFixed(2),
      status: "pending",
      brCode: data.pix?.brCode || null,
      qrCodeImage: data.pix?.qrCodeImage || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
    });
    return {
      paymentId: data.paymentId,
      amountCents: data.amountCents,
      credits: input.credits,
      brCode: data.pix?.brCode,
      qrCodeImage: data.pix?.qrCodeImage,
      expiresAt: data.expiresAt,
      status: "pending"
    };
  }),
  checkPixStatus: resellerProcedure.input(z2.object({ paymentId: z2.string() })).query(async ({ ctx, input }) => {
    const payment = await getPixPaymentByPaymentId(input.paymentId);
    if (!payment || payment.resellerId !== ctx.resellerId) {
      throw new TRPCError3({ code: "NOT_FOUND" });
    }
    return {
      paymentId: payment.paymentId,
      status: payment.status,
      credits: parseFloat(payment.credits),
      amountCents: payment.amountCents,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt
    };
  }),
  myPixPayments: resellerProcedure.query(async ({ ctx }) => {
    return getPixPaymentsByReseller(ctx.resellerId);
  }),
  // Criar cobrança Pix para compra de key (resellers de porcentagem)
  createKeyPixCharge: resellerProcedure.input(z2.object({
    appId: z2.number(),
    planId: z2.number(),
    quantity: z2.number().min(1).max(100)
  })).mutation(async ({ ctx, input }) => {
    const reseller = ctx.reseller;
    if (reseller.resellerType !== "percentage") {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Esta a\xE7\xE3o \xE9 apenas para resellers de porcentagem" });
    }
    const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
    if (!PURIN_API_KEY) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Pix n\xE3o configurado" });
    const assigned = await getAssignedAppIds(ctx.resellerId);
    if (!assigned.includes(input.appId)) throw new TRPCError3({ code: "FORBIDDEN", message: "App n\xE3o dispon\xEDvel" });
    const plan = await getPlanById(input.planId);
    if (!plan || plan.appId !== input.appId) throw new TRPCError3({ code: "NOT_FOUND", message: "Plano n\xE3o encontrado" });
    const app2 = await getAppById(input.appId);
    if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
    const discount = parseFloat(reseller.discountPercent) || 0;
    const basePrice = parseFloat(plan.pricePercentage ?? "0");
    const discountedPrice = basePrice * (1 - discount / 100);
    const totalCost = discountedPrice * input.quantity;
    const amountCents = Math.round(totalCost * 100);
    if (amountCents < 100) throw new TRPCError3({ code: "BAD_REQUEST", message: "Valor m\xEDnimo \xE9 R$ 1,00" });
    const callbackUrl = `${process.env.VITE_APP_URL || "https://zenity-store.vercel.app"}/api/webhooks/purincash`;
    const body = {
      valueCents: amountCents,
      description: `${input.quantity}x key(s) ${app2.name} - ${plan.name} - ZENITY STORE`,
      callbackUrl,
      customer: {
        name: reseller.username,
        email: reseller.email || `${reseller.username}@zenitystore.com`,
        externalId: String(reseller.id)
      },
      metadata: JSON.stringify({
        resellerId: reseller.id,
        paymentType: "key",
        appId: input.appId,
        planId: input.planId,
        quantity: input.quantity
      })
    };
    const response = await fetch("https://api.purincash.com/v1/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PURIN_API_KEY}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[PurinCash] Error creating key charge:", err);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cobran\xE7a Pix" });
    }
    const data = await response.json();
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
      quantity: input.quantity
    });
    return {
      paymentId: data.paymentId,
      amountCents: data.amountCents,
      totalCost,
      brCode: data.pix?.brCode,
      qrCodeImage: data.pix?.qrCodeImage,
      expiresAt: data.expiresAt,
      status: "pending"
    };
  }),
  // Verificar status de pagamento Pix de key e retornar keys se pago
  checkKeyPixStatus: resellerProcedure.input(z2.object({ paymentId: z2.string() })).query(async ({ ctx, input }) => {
    const payment = await getPixPaymentByPaymentId(input.paymentId);
    if (!payment || payment.resellerId !== ctx.resellerId) {
      throw new TRPCError3({ code: "NOT_FOUND" });
    }
    let keys = [];
    if (payment.status === "paid") {
      const { getKeysByPaymentId: getKeysByPaymentId2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      keys = await getKeysByPaymentId2(input.paymentId);
    }
    return {
      paymentId: payment.paymentId,
      status: payment.status,
      amountCents: payment.amountCents,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt,
      keys
    };
  }),
  // Criar cobrança LTC para compra de key (resellers de porcentagem)
  createKeyLtcCharge: resellerProcedure.input(z2.object({
    appId: z2.number(),
    planId: z2.number(),
    quantity: z2.number().min(1).max(100)
  })).mutation(async ({ ctx, input }) => {
    const reseller = ctx.reseller;
    if (reseller.resellerType !== "percentage") {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Esta a\xE7\xE3o \xE9 apenas para resellers de porcentagem" });
    }
    const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
    if (!PURIN_API_KEY) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Crypto n\xE3o configurado" });
    const assigned = await getAssignedAppIds(ctx.resellerId);
    if (!assigned.includes(input.appId)) throw new TRPCError3({ code: "FORBIDDEN", message: "App n\xE3o dispon\xEDvel" });
    const plan = await getPlanById(input.planId);
    if (!plan || plan.appId !== input.appId) throw new TRPCError3({ code: "NOT_FOUND", message: "Plano n\xE3o encontrado" });
    const app2 = await getAppById(input.appId);
    if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
    const discount = parseFloat(reseller.discountPercent) || 0;
    const basePrice = parseFloat(plan.pricePercentage ?? "0");
    const discountedPrice = basePrice * (1 - discount / 100);
    const totalCost = discountedPrice * input.quantity;
    const amountCents = Math.round(totalCost * 100);
    if (amountCents < 100) throw new TRPCError3({ code: "BAD_REQUEST", message: "Valor m\xEDnimo \xE9 R$ 1,00" });
    let ltcPriceBrl = 0;
    try {
      const priceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=brl", { headers: { "Accept": "application/json" } });
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        ltcPriceBrl = priceData?.litecoin?.brl || 0;
      }
    } catch (e) {
      console.warn("[CoinGecko] LTC price failed:", e);
    }
    if (!ltcPriceBrl) {
      try {
        const binanceRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=LTCBRL");
        if (binanceRes.ok) {
          const bd = await binanceRes.json();
          ltcPriceBrl = parseFloat(bd?.price || "0");
        }
      } catch (e) {
        console.warn("[Binance] LTC price failed:", e);
      }
    }
    if (!ltcPriceBrl) ltcPriceBrl = 800;
    const ltcAmountCalc = parseFloat((totalCost / ltcPriceBrl).toFixed(8));
    const callbackUrl = `${process.env.VITE_APP_URL || "https://zenity-store.vercel.app"}/api/webhooks/purincash`;
    const body = {
      valueCents: amountCents,
      description: `${input.quantity}x key(s) ${app2.name} - ${plan.name} - ZENITY STORE`,
      paymentMethod: "ltc",
      callbackUrl,
      customer: {
        name: reseller.username,
        email: reseller.email || `${reseller.username}@zenitystore.com`,
        externalId: String(reseller.id)
      },
      metadata: JSON.stringify({
        resellerId: reseller.id,
        paymentType: "key",
        appId: input.appId,
        planId: input.planId,
        quantity: input.quantity
      })
    };
    const response = await fetch("https://api.purincash.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PURIN_API_KEY}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[PurinCash LTC] Error creating charge:", err);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: `Erro ao criar cobran\xE7a LTC: ${err}` });
    }
    const data = await response.json();
    console.log("[PurinCash LTC] Response:", JSON.stringify(data));
    const ltcAddress = data.ltc?.address || data.crypto?.address || data.address || "LaaSCwpGiZhtrCD8qWxiZGdwEFYnHqxDxK";
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
      quantity: input.quantity
    });
    return {
      paymentId: data.paymentId,
      amountCents: data.amountCents || amountCents,
      totalCost,
      ltcAddress,
      ltcAmount: ltcAmountCalc,
      ltcPriceBrl,
      expiresAt: data.expiresAt,
      status: "pending"
    };
  }),
  // Verificar status de pagamento LTC de key e retornar keys se pago
  checkKeyLtcStatus: resellerProcedure.input(z2.object({ paymentId: z2.string() })).query(async ({ ctx, input }) => {
    const payment = await getPixPaymentByPaymentId(input.paymentId);
    if (!payment || payment.resellerId !== ctx.resellerId) {
      throw new TRPCError3({ code: "NOT_FOUND" });
    }
    let keys = [];
    if (payment.status === "paid") {
      const { getKeysByPaymentId: getKeysByPaymentId2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      keys = await getKeysByPaymentId2(input.paymentId);
    }
    return {
      paymentId: payment.paymentId,
      status: payment.status,
      amountCents: payment.amountCents,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt,
      keys
    };
  }),
  // Comprar keys para resellers de porcentagem (sem débito de créditos)
  buyKey: resellerProcedure.input(z2.object({
    appId: z2.number(),
    planId: z2.number(),
    quantity: z2.number().min(1).max(100)
  })).mutation(async ({ ctx, input }) => {
    const reseller = ctx.reseller;
    if (reseller.resellerType !== "percentage") {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Esta a\xE7\xE3o \xE9 apenas para resellers de porcentagem" });
    }
    const assigned = await getAssignedAppIds(ctx.resellerId);
    if (!assigned.includes(input.appId)) throw new TRPCError3({ code: "FORBIDDEN", message: "App n\xE3o dispon\xEDvel" });
    const plan = await getPlanById(input.planId);
    if (!plan || plan.appId !== input.appId) throw new TRPCError3({ code: "NOT_FOUND", message: "Plano n\xE3o encontrado" });
    const app2 = await getAppById(input.appId);
    if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
    const discount = parseFloat(reseller.discountPercent) || 0;
    const basePrice = parseFloat(plan.pricePercentage ?? "0");
    const discountedPrice = basePrice * (1 - discount / 100);
    const totalCost = discountedPrice * input.quantity;
    const newPurchases = reseller.totalPurchases + input.quantity;
    await updateResellerCredits(ctx.resellerId, reseller.credits, newPurchases, reseller.discountPercent);
    const sellerKey = app2.keyauthSellerKey || KEYAUTH_SELLER_KEY;
    let keyauthKeys = null;
    try {
      keyauthKeys = await keyauthCreateLicense({
        sellerKey,
        durationDays: plan.durationDays,
        quantity: input.quantity,
        owner: reseller.username,
        note: `Zenity Store - ${reseller.username} - ${plan.name} - R$ ${totalCost.toFixed(2)}`
      });
    } catch (err) {
      console.error("[KeyAuth] License creation failed, using local key generation:", err);
    }
    const generatedKeys = [];
    for (let i = 0; i < input.quantity; i++) {
      const keyValue = keyauthKeys ? keyauthKeys[i] : generateKeyValue(app2.name);
      await createLicenseKey({
        keyValue,
        resellerId: ctx.resellerId,
        appId: input.appId,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
        creditsSpent: discountedPrice.toFixed(2),
        note: `Compra via porcentagem - R$ ${totalCost.toFixed(2)}`
      });
      generatedKeys.push(keyValue);
    }
    return { success: true, keys: generatedKeys, totalCost, newBalance: reseller.credits };
  }),
  // ─── Tickets ─────────────────────────────────────────────────────────────────
  myTickets: resellerProcedure.query(async ({ ctx }) => {
    return getTicketsByResellerId(ctx.resellerId);
  }),
  createTicket: resellerProcedure.input(z2.object({
    subject: z2.string().min(3).max(255),
    message: z2.string().min(1),
    imageBase64: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const ticket = await createTicket({
      resellerId: ctx.resellerId,
      subject: input.subject,
      status: "open"
    });
    let imageUrl;
    if (input.imageBase64) {
      imageUrl = await uploadBase64Image(input.imageBase64) || void 0;
    }
    await createTicketMessage({
      ticketId: ticket.id,
      senderType: "reseller",
      message: input.message,
      imageUrl
    });
    return ticket;
  }),
  getTicket: resellerProcedure.input(z2.object({ id: z2.number() })).query(async ({ ctx, input }) => {
    const ticket = await getTicketById(input.id);
    if (!ticket || ticket.resellerId !== ctx.resellerId) throw new TRPCError3({ code: "FORBIDDEN" });
    const messages = await getTicketMessages(input.id);
    return { ...ticket, messages };
  }),
  sendTicketMessage: resellerProcedure.input(z2.object({
    ticketId: z2.number(),
    message: z2.string().min(1),
    imageBase64: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const ticket = await getTicketById(input.ticketId);
    if (!ticket || ticket.resellerId !== ctx.resellerId) throw new TRPCError3({ code: "FORBIDDEN" });
    let imageUrl;
    if (input.imageBase64) {
      imageUrl = await uploadBase64Image(input.imageBase64) || void 0;
    }
    const msg = await createTicketMessage({
      ticketId: input.ticketId,
      senderType: "reseller",
      message: input.message,
      imageUrl
    });
    await updateTicketTimestamp(input.ticketId);
    return msg;
  })
});
var appRouter = router({
  system: systemRouter,
  auth: authRouter,
  admin: adminRouter,
  reseller: resellerRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/purinCashWebhook.ts
init_db();

// server/resellerPricing.ts
function calcDiscount(totalPurchases) {
  if (totalPurchases >= 20) return 50;
  if (totalPurchases >= 10) return 40;
  return 35;
}

// server/purinCashWebhook.ts
var FINAL_PAYMENT_STATUSES = /* @__PURE__ */ new Set(["expired", "cancelled", "refunded"]);
async function handlePurinCashWebhook(req, res) {
  try {
    const { paymentId, status, paidAt } = req.body;
    if (!paymentId || !status) {
      return res.status(400).json({ error: "Missing paymentId or status" });
    }
    console.log(`[PurinCash Webhook] paymentId=${paymentId} status=${status}`);
    const payment = await getPixPaymentByPaymentId(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    if (status === "paid") {
      const reseller = await getResellerById(payment.resellerId);
      if (!reseller) {
        return res.status(404).json({ error: "Reseller not found" });
      }
      if (payment.paymentType === "key") {
        const appId = payment.appId;
        const planId = payment.planId;
        const quantity = payment.quantity ?? 1;
        if (!appId || !planId || quantity < 1) {
          throw new Error(`Pagamento de key ${paymentId} sem app, plano ou quantidade v\xE1lida`);
        }
        const existingKeys = await getKeysByPaymentId(paymentId);
        if (payment.status === "paid" && existingKeys.length >= quantity) {
          return res.json({ ok: true, message: "Already processed" });
        }
        const app2 = await getAppById(appId);
        const plan = await getPlanById(planId);
        if (!app2 || !plan || plan.appId !== appId) {
          throw new Error(`App ou plano n\xE3o encontrado para o pagamento ${paymentId}`);
        }
        const missingQuantity = Math.max(0, quantity - existingKeys.length);
        const sellerKey = app2.keyauthSellerKey || process.env.KEYAUTH_SELLER_KEY || "";
        const isLtcPayment = payment.paymentMethod === "ltc";
        const generatedKeys = missingQuantity > 0 ? await keyauthCreateLicense({
          sellerKey,
          durationDays: plan.durationDays,
          quantity: missingQuantity,
          owner: reseller.username,
          note: `Zenity Store - ${reseller.username} - ${plan.name} - ${isLtcPayment ? "LTC" : "Pix"} ${paymentId}`
        }) : [];
        const pricePerKey = payment.amountCents / quantity / 100;
        const notePrefix = isLtcPayment ? "ltc" : "pix";
        for (const keyValue of generatedKeys) {
          await createLicenseKey({
            keyValue,
            resellerId: payment.resellerId,
            appId,
            planId: plan.id,
            planName: plan.name,
            durationDays: plan.durationDays,
            creditsSpent: pricePerKey.toFixed(2),
            note: `${notePrefix}:${paymentId}`
          });
        }
        if (payment.status !== "paid") {
          const newPurchases = reseller.totalPurchases + quantity;
          const newDiscount = calcDiscount(newPurchases);
          await updateResellerCredits(
            payment.resellerId,
            reseller.credits,
            newPurchases,
            newDiscount.toFixed(2)
          );
        }
        await updatePixPaymentStatus(paymentId, "paid", paidAt ? new Date(paidAt) : /* @__PURE__ */ new Date());
        console.log(`[PurinCash Webhook] Delivered ${quantity} key(s) for payment ${paymentId}`);
      } else {
        if (payment.status === "paid") {
          return res.json({ ok: true, message: "Already processed" });
        }
        const creditsToAdd = parseFloat(payment.credits);
        const currentCredits = parseFloat(reseller.credits);
        const newCredits = currentCredits + creditsToAdd;
        await updateResellerCredits(
          payment.resellerId,
          newCredits.toFixed(2),
          reseller.totalPurchases,
          reseller.discountPercent
        );
        await createCreditTransaction({
          resellerId: payment.resellerId,
          type: "add",
          amount: creditsToAdd.toFixed(2),
          balanceBefore: currentCredits.toFixed(2),
          balanceAfter: newCredits.toFixed(2),
          description: `Compra via Pix - ${creditsToAdd} cr\xE9dito(s) (${paymentId})`
        });
        await updatePixPaymentStatus(paymentId, "paid", paidAt ? new Date(paidAt) : /* @__PURE__ */ new Date());
      }
    } else if (FINAL_PAYMENT_STATUSES.has(status) && payment.status === "pending") {
      await updatePixPaymentStatus(paymentId, status);
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error("[PurinCash Webhook] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// server/_core/serverless.ts
var app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerOAuthRoutes(app);
app.get("/api/my-ip", (req, res) => {
  const h = req.headers;
  const candidates = [
    h["cf-connecting-ip"] || "",
    h["true-client-ip"] || "",
    h["x-real-ip"] || "",
    (h["x-forwarded-for"] || "").split(",")[0].trim(),
    h["x-client-ip"] || "",
    req.socket?.remoteAddress || ""
  ];
  const raw = candidates.find((c) => c && c.length > 0) || "";
  let ip = raw.trim();
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) ip = mapped[1];
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") ip = "127.0.0.1";
  res.json({ ip, raw });
});
app.post("/api/webhooks/purincash", handlePurinCashWebhook);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var serverless_default = app;
export {
  serverless_default as default
};
