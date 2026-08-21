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
  boolean,
  serial
} from "drizzle-orm/pg-core";
var userRoleEnum, resellerTypeEnum, resellerStatusEnum, appStatusEnum, planLevelEnum, keyStatusEnum, transactionTypeEnum, pixPaymentStatusEnum, ticketStatusEnum, ticketSenderEnum, applicationStatusEnum, applicationSenderEnum, supportTicketStatusEnum, supportMessageSenderEnum, appDownloadTypeEnum, users, admins, resellers, resellerApiKeys, categories, apps, stockStatusEnum, subscriptionPlans, resellerApps, licenseKeys, appStock, creditTransactions, pixPayments, ipWhitelist, otherStoreResellers, otherStoreHwids, tickets, ticketMessages, resellerApplications, applicationMessages, supportTickets, supportMessages, appDownloads;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    userRoleEnum = pgEnum("user_role", ["user", "admin"]);
    resellerTypeEnum = pgEnum("reseller_type", ["credits", "percentage", "other"]);
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
    appDownloadTypeEnum = pgEnum("app_download_type", ["download", "tutorial"]);
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
      parentResellerId: integer("parentResellerId"),
      canCreateSubResellers: boolean("canCreateSubResellers").default(false).notNull(),
      status: resellerStatusEnum("status").default("active").notNull(),
      location: varchar("location", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastLoginAt: timestamp("lastLoginAt")
    });
    resellerApiKeys = pgTable("reseller_api_keys", {
      id: serial("id").primaryKey(),
      resellerId: integer("resellerId").notNull().references(() => resellers.id),
      apiKey: varchar("apiKey", { length: 128 }).notNull().unique(),
      name: varchar("name", { length: 64 }),
      isActive: boolean("isActive").default(true).notNull(),
      allowedIps: text("allowedIps"),
      lastUsedAt: timestamp("lastUsedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
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
      resellerCredits: decimal("resellerCredits", { precision: 12, scale: 2 }),
      status: keyStatusEnum("status").default("active").notNull(),
      usedBy: varchar("usedBy", { length: 128 }),
      // username who activated
      hwid: varchar("hwid", { length: 255 }),
      activatedAt: timestamp("activatedAt"),
      expiresAt: timestamp("expiresAt"),
      note: text("note"),
      customMask: varchar("customMask", { length: 128 }),
      source: varchar("source", { length: 32 }).default("panel").notNull(),
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
    otherStoreResellers = pgTable("other_store_resellers", {
      id: serial("id").primaryKey(),
      resellerId: integer("resellerId").notNull().references(() => resellers.id),
      label: varchar("label", { length: 128 }),
      purinApiKey: varchar("purinApiKey", { length: 128 }),
      recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
      discordId: varchar("discordId", { length: 64 }),
      splitPercent: decimal("splitPercent", { precision: 5, scale: 2 }).default("45.00").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    otherStoreHwids = pgTable("other_store_hwids", {
      id: serial("id").primaryKey(),
      otherStoreResellerId: integer("otherStoreResellerId").notNull().references(() => otherStoreResellers.id, { onDelete: "cascade" }),
      hwid: varchar("hwid", { length: 128 }).notNull(),
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
    appDownloads = pgTable("app_downloads", {
      id: serial("id").primaryKey(),
      appId: integer("appId").notNull().references(() => apps.id),
      type: appDownloadTypeEnum("type").notNull(),
      title: varchar("title", { length: 128 }).notNull(),
      url: text("url").notNull(),
      videoUrl: text("videoUrl"),
      sortOrder: integer("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
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
  createAppDownload: () => createAppDownload,
  createApplicationMessage: () => createApplicationMessage,
  createCategory: () => createCategory,
  createCreditTransaction: () => createCreditTransaction,
  createLicenseKey: () => createLicenseKey,
  createOtherStoreHwid: () => createOtherStoreHwid,
  createOtherStoreReseller: () => createOtherStoreReseller,
  createPixPayment: () => createPixPayment,
  createPlan: () => createPlan,
  createReseller: () => createReseller,
  createResellerApiKey: () => createResellerApiKey,
  createResellerApplication: () => createResellerApplication,
  createSupportMessage: () => createSupportMessage,
  createSupportTicket: () => createSupportTicket,
  createTicket: () => createTicket,
  createTicketMessage: () => createTicketMessage,
  deleteApp: () => deleteApp,
  deleteAppDownload: () => deleteAppDownload,
  deleteCategory: () => deleteCategory,
  deleteOtherStoreHwid: () => deleteOtherStoreHwid,
  deleteOtherStoreReseller: () => deleteOtherStoreReseller,
  deletePlan: () => deletePlan,
  deleteResellerApplication: () => deleteResellerApplication,
  deleteResellerById: () => deleteResellerById,
  deleteStock: () => deleteStock,
  deleteSupportTicket: () => deleteSupportTicket,
  deleteTicket: () => deleteTicket,
  ensureAppDownloadsSchema: () => ensureAppDownloadsSchema,
  ensureAppStockSchema: () => ensureAppStockSchema,
  ensureLicenseKeysSchema: () => ensureLicenseKeysSchema,
  ensureOtherStoreSchema: () => ensureOtherStoreSchema,
  ensurePixPaymentSchema: () => ensurePixPaymentSchema,
  ensureResellerApiKeySchema: () => ensureResellerApiKeySchema,
  getAdminById: () => getAdminById,
  getAdminByUsername: () => getAdminByUsername,
  getAllApps: () => getAllApps,
  getAllCategories: () => getAllCategories,
  getAllIpWhitelist: () => getAllIpWhitelist,
  getAllKeys: () => getAllKeys,
  getAllKeysWithReseller: () => getAllKeysWithReseller,
  getAllResellerApplications: () => getAllResellerApplications,
  getAllResellers: () => getAllResellers,
  getAllSupportTickets: () => getAllSupportTickets,
  getAllTickets: () => getAllTickets,
  getAppById: () => getAppById,
  getAppByName: () => getAppByName,
  getAppByNameLike: () => getAppByNameLike,
  getApplicationMessages: () => getApplicationMessages,
  getAppsByResellerId: () => getAppsByResellerId,
  getAssignedAppIds: () => getAssignedAppIds,
  getAvailableStockForPlan: () => getAvailableStockForPlan,
  getDashboardKeysByMonth: () => getDashboardKeysByMonth,
  getDashboardTopApps: () => getDashboardTopApps,
  getDb: () => getDb,
  getDownloadById: () => getDownloadById,
  getDownloadsByAppId: () => getDownloadsByAppId,
  getKeyById: () => getKeyById,
  getKeysByPaymentId: () => getKeysByPaymentId,
  getKeysByResellerId: () => getKeysByResellerId,
  getOtherStoreHwidsByResellerId: () => getOtherStoreHwidsByResellerId,
  getOtherStoreResellerByDiscordId: () => getOtherStoreResellerByDiscordId,
  getOtherStoreResellerByHwid: () => getOtherStoreResellerByHwid,
  getOtherStoreResellerById: () => getOtherStoreResellerById,
  getOtherStoreResellerByOwnerResellerId: () => getOtherStoreResellerByOwnerResellerId,
  getOtherStoreResellerByResellerId: () => getOtherStoreResellerByResellerId,
  getOtherStoreResellers: () => getOtherStoreResellers,
  getPendingPixPaymentsByReseller: () => getPendingPixPaymentsByReseller,
  getPixPaymentByPaymentId: () => getPixPaymentByPaymentId,
  getPixPaymentsByReseller: () => getPixPaymentsByReseller,
  getPlanById: () => getPlanById,
  getPlansByAppId: () => getPlansByAppId,
  getResellerApiKeyByKey: () => getResellerApiKeyByKey,
  getResellerApplicationByEmail: () => getResellerApplicationByEmail,
  getResellerApplicationById: () => getResellerApplicationById,
  getResellerByApiKey: () => getResellerByApiKey,
  getResellerById: () => getResellerById,
  getResellerByUsername: () => getResellerByUsername,
  getResellerKeyStatsByType: () => getResellerKeyStatsByType,
  getResellerKeysByApp: () => getResellerKeysByApp,
  getResellerKeysByMonth: () => getResellerKeysByMonth,
  getResellerParent: () => getResellerParent,
  getResellersByParentId: () => getResellersByParentId,
  getStockByApp: () => getStockByApp,
  getStockCountsByApp: () => getStockCountsByApp,
  getSubResellerKeyLogs: () => getSubResellerKeyLogs,
  getSubResellerKeyStats: () => getSubResellerKeyStats,
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
  listResellerApiKeys: () => listResellerApiKeys,
  normalizeIp: () => normalizeIp,
  releaseStockReservation: () => releaseStockReservation,
  removeAppFromReseller: () => removeAppFromReseller,
  removeIpFromWhitelist: () => removeIpFromWhitelist,
  reserveStockForReseller: () => reserveStockForReseller,
  revokeResellerApiKey: () => revokeResellerApiKey,
  updateAdminPassword: () => updateAdminPassword,
  updateApp: () => updateApp,
  updateAppDownload: () => updateAppDownload,
  updateCategory: () => updateCategory,
  updateLicenseKey: () => updateLicenseKey,
  updateOtherStoreReseller: () => updateOtherStoreReseller,
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
import { eq, and, desc, sql, or, aliasedTable, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { randomUUID } from "crypto";
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
async function ensureAppStockSchema() {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");
  if (!_appStockSchemaReady) {
    _appStockSchemaReady = (async () => {
      try {
        await _sqlClient.unsafe(`DO $$ BEGIN CREATE TYPE "stock_status" AS ENUM('available', 'sold'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
      } catch (e) {
      }
      try {
        await _sqlClient.unsafe(`CREATE TABLE IF NOT EXISTS "app_stock" (
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
    })().then(() => void 0).catch((error) => {
      _appStockSchemaReady = null;
      console.error("[Database] Failed to ensure app stock schema:", error);
      throw new Error("N\xE3o foi poss\xEDvel preparar o banco para estoque");
    });
  }
  return _appStockSchemaReady;
}
async function ensureLicenseKeysSchema() {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");
  if (!_licenseKeysSchemaReady) {
    _licenseKeysSchemaReady = (async () => {
      try {
        await _sqlClient.unsafe(`ALTER TABLE "license_keys" ADD COLUMN IF NOT EXISTS "resellerCredits" decimal(12, 2)`);
      } catch (e) {
        console.error("[Database] Failed to ensure license_keys schema:", e);
        throw e;
      }
    })().then(() => void 0).catch((error) => {
      _licenseKeysSchemaReady = null;
      console.error("[Database] Failed to ensure license_keys schema:", error);
      throw new Error("N\xE3o foi poss\xEDvel preparar o banco para license keys");
    });
  }
  return _licenseKeysSchemaReady;
}
async function ensureAppDownloadsSchema() {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");
  if (!_appDownloadsSchemaReady) {
    _appDownloadsSchemaReady = (async () => {
      try {
        await _sqlClient.unsafe(`DO $$ BEGIN CREATE TYPE "app_download_type" AS ENUM('download', 'tutorial'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
      } catch (e) {
      }
      try {
        await _sqlClient.unsafe(`CREATE TABLE IF NOT EXISTS "app_downloads" (
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
    })().then(() => void 0).catch((error) => {
      _appDownloadsSchemaReady = null;
      console.error("[Database] Failed to ensure app downloads schema:", error);
      throw new Error("N\xE3o foi poss\xEDvel preparar o banco para downloads");
    });
  }
  return _appDownloadsSchemaReady;
}
async function ensureResellerApiKeySchema() {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");
  if (!_resellerApiKeysSchemaReady) {
    _resellerApiKeysSchemaReady = (async () => {
      try {
        await _sqlClient.unsafe(`CREATE TABLE IF NOT EXISTS "reseller_api_keys" (
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
    })().then(() => void 0).catch((error) => {
      _resellerApiKeysSchemaReady = null;
      console.error("[Database] Failed to ensure reseller_api_keys schema:", error);
      throw new Error("N\xE3o foi poss\xEDvel preparar o banco para reseller API keys");
    });
  }
  return _resellerApiKeysSchemaReady;
}
async function ensureOtherStoreSchema() {
  await getDb();
  if (!_sqlClient) throw new Error("DB not available");
  if (!_otherStoreSchemaReady) {
    _otherStoreSchemaReady = (async () => {
      try {
        await _sqlClient.unsafe(`CREATE TABLE IF NOT EXISTS "other_store_resellers" (
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
        await _sqlClient.unsafe(`ALTER TABLE "other_store_resellers" ADD COLUMN IF NOT EXISTS "discordId" varchar(64)`).catch(() => {
        });
      } catch (e) {
        console.error("[Database] Failed to create other_store_resellers:", e);
        throw e;
      }
      try {
        await _sqlClient.unsafe(`CREATE TABLE IF NOT EXISTS "other_store_hwids" (
          "id" serial PRIMARY KEY,
          "otherStoreResellerId" integer NOT NULL REFERENCES "other_store_resellers"("id") ON DELETE CASCADE,
          "hwid" varchar(128) NOT NULL,
          "createdAt" timestamp DEFAULT now() NOT NULL
        )`);
      } catch (e) {
        console.error("[Database] Failed to create other_store_hwids:", e);
        throw e;
      }
    })().then(() => void 0).catch((error) => {
      _otherStoreSchemaReady = null;
      console.error("[Database] Failed to ensure other store schema:", error);
      throw new Error("N\xE3o foi poss\xEDvel preparar o banco para other store");
    });
  }
  return _otherStoreSchemaReady;
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
async function ensureResellerColumns() {
  if (!_sqlClient) return;
  await _sqlClient.unsafe(`ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "parentResellerId" integer`).catch(() => {
  });
  await _sqlClient.unsafe(`ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "canCreateSubResellers" boolean DEFAULT false`).catch(() => {
  });
}
async function getResellerByUsername(username) {
  await ensureResellerColumns();
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
async function getResellersByParentId(parentResellerId) {
  await ensureResellerColumns();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellers).where(eq(resellers.parentResellerId, parentResellerId)).orderBy(desc(resellers.createdAt));
}
async function getResellerParent(parentResellerId) {
  return getResellerById(parentResellerId);
}
async function getAllResellers() {
  await ensureResellerColumns();
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
async function getResellerByApiKey(apiKey) {
  await ensureResellerApiKeySchema();
  const db = await getDb();
  if (!db) return void 0;
  const rows = await db.select({ reseller: resellers, key: resellerApiKeys }).from(resellerApiKeys).innerJoin(resellers, eq(resellerApiKeys.resellerId, resellers.id)).where(and(eq(resellerApiKeys.apiKey, apiKey), eq(resellerApiKeys.isActive, true))).limit(1);
  if (rows.length === 0) return void 0;
  const { reseller, key } = rows[0];
  await db.update(resellerApiKeys).set({ lastUsedAt: /* @__PURE__ */ new Date() }).where(eq(resellerApiKeys.id, key.id));
  return reseller;
}
async function getResellerApiKeyByKey(apiKey) {
  await ensureResellerApiKeySchema();
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(resellerApiKeys).where(eq(resellerApiKeys.apiKey, apiKey)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createResellerApiKey(data) {
  await ensureResellerApiKeySchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(resellerApiKeys).values({
    resellerId: data.resellerId,
    apiKey: randomUUID(),
    name: data.name ?? null,
    allowedIps: data.allowedIps ?? null,
    isActive: true
  }).returning();
  return row;
}
async function listResellerApiKeys(resellerId) {
  await ensureResellerApiKeySchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resellerApiKeys).where(eq(resellerApiKeys.resellerId, resellerId)).orderBy(desc(resellerApiKeys.createdAt));
}
async function revokeResellerApiKey(id) {
  await ensureResellerApiKeySchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(resellerApiKeys).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(resellerApiKeys.id, id));
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
async function getAppByName(name) {
  const db = await getDb();
  if (!db) return void 0;
  const n = name.trim();
  const result = await db.select().from(apps).where(or(ilike(apps.name, n), sql`lower(${apps.name}) = lower(${n})`)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAppByNameLike(term) {
  const db = await getDb();
  if (!db) return void 0;
  const t2 = `%${term.trim().toLowerCase()}%`;
  const result = await db.select().from(apps).where(sql`lower(${apps.name}) like ${t2}`).limit(1);
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
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenseKeys).where(eq(licenseKeys.resellerId, resellerId)).orderBy(desc(licenseKeys.createdAt));
}
async function getAllKeys() {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(licenseKeys).orderBy(desc(licenseKeys.createdAt));
}
async function getAllKeysWithReseller() {
  await ensureLicenseKeysSchema();
  await ensureResellerColumns();
  const db = await getDb();
  if (!db) return [];
  const parentResellers = aliasedTable(resellers, "parentResellers");
  const rows = await db.select({
    key: licenseKeys,
    reseller: resellers,
    parent: parentResellers
  }).from(licenseKeys).leftJoin(resellers, eq(licenseKeys.resellerId, resellers.id)).leftJoin(parentResellers, eq(resellers.parentResellerId, parentResellers.id)).orderBy(desc(licenseKeys.createdAt));
  return rows.map((r) => ({
    ...r.key,
    resellerName: r.reseller?.username ?? "\u2014",
    parentResellerName: r.parent?.username,
    resellerType: r.reseller?.resellerType ?? "credits"
  }));
}
async function getSubResellerKeyStats(parentResellerId) {
  await ensureLicenseKeysSchema();
  await ensureResellerColumns();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    resellerId: resellers.id,
    username: resellers.username,
    count: sql`count(${licenseKeys.id})`.as("count"),
    total: sql`sum(${licenseKeys.creditsSpent})`.as("total")
  }).from(resellers).leftJoin(licenseKeys, eq(resellers.id, licenseKeys.resellerId)).where(eq(resellers.parentResellerId, parentResellerId)).groupBy(resellers.id, resellers.username).orderBy(desc(sql`count`));
  return rows;
}
async function getSubResellerKeyLogs(parentResellerId) {
  await ensureLicenseKeysSchema();
  await ensureResellerColumns();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    key: licenseKeys,
    reseller: resellers
  }).from(licenseKeys).innerJoin(resellers, eq(licenseKeys.resellerId, resellers.id)).where(eq(resellers.parentResellerId, parentResellerId)).orderBy(desc(licenseKeys.createdAt));
  return rows.map((r) => ({ ...r.key, resellerName: r.reseller?.username ?? "\u2014" }));
}
async function getResellerKeyStatsByType(resellerType, limit = 20) {
  await ensureLicenseKeysSchema();
  await ensureResellerColumns();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    resellerId: resellers.id,
    username: resellers.username,
    count: sql`count(${licenseKeys.id})`.as("count"),
    total: sql`sum(${licenseKeys.creditsSpent})`.as("total")
  }).from(resellers).leftJoin(licenseKeys, eq(resellers.id, licenseKeys.resellerId)).where(eq(resellers.resellerType, resellerType)).groupBy(resellers.id, resellers.username).orderBy(desc(sql`count`)).limit(limit);
  return rows;
}
async function getDashboardKeysByMonth(months = 6) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    month: sql`to_char(${licenseKeys.createdAt}, 'YYYY-MM')`.as("month"),
    count: sql`count(${licenseKeys.id})`.as("count"),
    total: sql`sum(${licenseKeys.creditsSpent})`.as("total")
  }).from(licenseKeys).where(sql`${licenseKeys.createdAt} >= now() - interval '6 months'`).groupBy(sql`to_char(${licenseKeys.createdAt}, 'YYYY-MM')`).orderBy(sql`month`);
  return result;
}
async function getDashboardTopApps(limit = 6) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    appId: licenseKeys.appId,
    count: sql`count(${licenseKeys.id})`.as("count"),
    total: sql`sum(${licenseKeys.creditsSpent})`.as("total")
  }).from(licenseKeys).groupBy(licenseKeys.appId).orderBy(desc(sql`count`)).limit(limit);
  return result;
}
async function getResellerKeysByMonth(resellerId) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    month: sql`to_char(${licenseKeys.createdAt}, 'YYYY-MM')`.as("month"),
    count: sql`count(${licenseKeys.id})`.as("count"),
    total: sql`sum(${licenseKeys.creditsSpent})`.as("total")
  }).from(licenseKeys).where(and(eq(licenseKeys.resellerId, resellerId), sql`${licenseKeys.createdAt} >= now() - interval '6 months'`)).groupBy(sql`to_char(${licenseKeys.createdAt}, 'YYYY-MM')`).orderBy(sql`month`);
  return result;
}
async function getResellerKeysByApp(resellerId) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    appId: licenseKeys.appId,
    count: sql`count(${licenseKeys.id})`.as("count")
  }).from(licenseKeys).where(eq(licenseKeys.resellerId, resellerId)).groupBy(licenseKeys.appId).orderBy(desc(sql`count`)).limit(5);
  return result;
}
async function getKeyById(id) {
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createLicenseKey(data) {
  await ensureLicenseKeysSchema();
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
  if (data.source !== void 0 && data.source !== null) optionalValues.source = data.source;
  await db.insert(licenseKeys).values({ ...requiredValues, ...optionalValues });
}
async function updateLicenseKey(id, data) {
  await ensureLicenseKeysSchema();
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
  await ensureLicenseKeysSchema();
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ keyValue: licenseKeys.keyValue }).from(licenseKeys).where(
    or(
      eq(licenseKeys.note, `pix:${paymentId}`),
      eq(licenseKeys.note, `ltc:${paymentId}`),
      eq(licenseKeys.note, `other-store:${paymentId}`)
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
async function deleteResellerById(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(resellers).where(eq(resellers.id, id));
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
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appStock).where(
    and(eq(appStock.appId, appId), eq(appStock.planId, planId), eq(appStock.status, "available"))
  ).orderBy(appStock.createdAt).limit(limit);
}
async function reserveStockForReseller(id, resellerId) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(appStock).set({ status: "sold", resellerId, soldAt: /* @__PURE__ */ new Date() }).where(and(eq(appStock.id, id), eq(appStock.status, "available"))).returning();
  return row;
}
async function releaseStockReservation(id) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(appStock).set({ status: "available", resellerId: null, soldAt: null }).where(and(eq(appStock.id, id), eq(appStock.status, "sold"))).returning();
  return row;
}
async function addStockBatch(data) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.length === 0) return [];
  return db.insert(appStock).values(data).onConflictDoNothing({ target: appStock.keyValue }).returning();
}
async function getStockByApp(appId) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appStock).where(eq(appStock.appId, appId)).orderBy(desc(appStock.createdAt));
}
async function getStockCountsByApp(appId) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) return { available: 0, sold: 0 };
  const rows = await db.select({ status: appStock.status, count: sql`count(*)` }).from(appStock).where(eq(appStock.appId, appId)).groupBy(appStock.status);
  return {
    available: rows.find((r) => r.status === "available")?.count ?? 0,
    sold: rows.find((r) => r.status === "sold")?.count ?? 0
  };
}
async function deleteStock(id) {
  await ensureAppStockSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(appStock).where(eq(appStock.id, id));
}
async function getDownloadsByAppId(appId) {
  await ensureAppDownloadsSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appDownloads).where(eq(appDownloads.appId, appId)).orderBy(appDownloads.sortOrder, appDownloads.createdAt);
}
async function getDownloadById(id) {
  await ensureAppDownloadsSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(appDownloads).where(eq(appDownloads.id, id));
  return row ?? null;
}
async function createAppDownload(data) {
  await ensureAppDownloadsSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(appDownloads).values(data).returning();
  return row;
}
async function updateAppDownload(id, data) {
  await ensureAppDownloadsSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(appDownloads).set(data).where(eq(appDownloads.id, id)).returning();
  return row;
}
async function deleteAppDownload(id) {
  await ensureAppDownloadsSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(appDownloads).where(eq(appDownloads.id, id));
}
async function createOtherStoreReseller(data) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(otherStoreResellers).values(data).returning();
  return row;
}
async function getOtherStoreResellers() {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(otherStoreResellers).orderBy(desc(otherStoreResellers.createdAt));
}
async function getOtherStoreResellerById(id) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(otherStoreResellers).where(eq(otherStoreResellers.id, id));
  return row;
}
async function getOtherStoreResellerByHwid(hwid) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ o: otherStoreResellers, i: otherStoreHwids }).from(otherStoreHwids).innerJoin(otherStoreResellers, eq(otherStoreHwids.otherStoreResellerId, otherStoreResellers.id)).where(eq(otherStoreHwids.hwid, hwid));
  return rows[0]?.o ?? null;
}
async function getOtherStoreResellerByDiscordId(discordId) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(otherStoreResellers).where(eq(otherStoreResellers.discordId, discordId));
  return rows[0] ?? null;
}
async function getOtherStoreResellerByOwnerResellerId(ownerResellerId) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(otherStoreResellers).where(eq(otherStoreResellers.resellerId, ownerResellerId));
  return rows[0] ?? null;
}
async function getOtherStoreResellerByResellerId(resellerId) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(otherStoreResellers).where(eq(otherStoreResellers.resellerId, resellerId));
  return rows[0] ?? null;
}
async function updateOtherStoreReseller(id, data) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.update(otherStoreResellers).set(data).where(eq(otherStoreResellers.id, id)).returning();
  return row;
}
async function deleteOtherStoreReseller(id) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(otherStoreResellers).where(eq(otherStoreResellers.id, id));
}
async function createOtherStoreHwid(data) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.insert(otherStoreHwids).values(data).returning();
  return row;
}
async function getOtherStoreHwidsByResellerId(otherStoreResellerId) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(otherStoreHwids).where(eq(otherStoreHwids.otherStoreResellerId, otherStoreResellerId));
}
async function deleteOtherStoreHwid(id) {
  await ensureOtherStoreSchema();
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(otherStoreHwids).where(eq(otherStoreHwids.id, id));
}
var _db, _sqlClient, _pixPaymentSchemaReady, _appStockSchemaReady, _licenseKeysSchemaReady, _appDownloadsSchemaReady, _resellerApiKeysSchemaReady, _otherStoreSchemaReady;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
    _sqlClient = null;
    _pixPaymentSchemaReady = null;
    _appStockSchemaReady = null;
    _licenseKeysSchemaReady = null;
    _appDownloadsSchemaReady = null;
    _resellerApiKeysSchemaReady = null;
    _otherStoreSchemaReady = null;
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
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1"]);
function isIpAddress(host) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getCookieDomain(req) {
  const hostname = req.hostname || req.headers["x-forwarded-host"] || req.headers.host;
  if (!hostname) return void 0;
  const host = hostname.split(":")[0].toLowerCase();
  if (LOCAL_HOSTS.has(host) || isIpAddress(host)) {
    return void 0;
  }
  const parts = host.split(".");
  if (parts.length <= 2) {
    return host;
  }
  return `.${parts.slice(-2).join(".")}`;
}
function getSessionCookieOptions(req) {
  return {
    domain: getCookieDomain(req),
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

// server/resellerApi.ts
init_db();
async function authReseller(req) {
  let apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    const auth = req.headers.authorization;
    if (auth?.toLowerCase().startsWith("bearer ")) apiKey = auth.slice(7).trim();
  }
  if (!apiKey) return void 0;
  return getResellerByApiKey(apiKey);
}
async function resolvePlan(appId, planId, planName) {
  if (planId) {
    const plan = await getPlanById(Number(planId));
    if (plan && plan.appId === appId) return plan;
    return void 0;
  }
  if (!planName) return void 0;
  const plans = await getPlansByAppId(appId);
  const name = String(planName).toLowerCase().trim();
  return plans.find((p) => p.name.toLowerCase().trim() === name);
}
function registerResellerApi(app2) {
  app2.post("/api/reseller/v1/auth/verify", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
    const { passwordHash, ...safe } = reseller;
    res.json({ reseller: safe, balance: reseller.credits });
  });
  app2.get("/api/reseller/v1/products", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
    const rows = await getAppsByResellerId(reseller.id);
    const result = await Promise.all(rows.map(async ({ app: app3 }) => {
      const [plans, stock] = await Promise.all([getPlansByAppId(app3.id), getStockByApp(app3.id)]);
      const planList = plans.map((p) => ({
        id: p.id,
        name: p.name,
        durationDays: p.durationDays,
        priceCredits: p.priceCredits,
        resellerSellingPrice: p.resellerSellingPrice,
        stockCount: stock.filter((s) => s.planId === p.id && s.status === "available").length
      }));
      return { id: app3.id, name: app3.name, description: app3.description, version: app3.version, plans: planList };
    }));
    res.json(result);
  });
  app2.get("/api/reseller/v1/stock", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
    const appId = req.query.appId ? Number(req.query.appId) : void 0;
    const rows = await getAppsByResellerId(reseller.id);
    const apps2 = appId ? rows.filter((r) => r.app.id === appId) : rows;
    const result = await Promise.all(apps2.map(async ({ app: app3 }) => {
      const plans = await getPlansByAppId(app3.id);
      const stock = await Promise.all(plans.map(async (p) => {
        const available = await getAvailableStockForPlan(app3.id, p.id, 1e3);
        return {
          id: p.id,
          name: p.name,
          durationDays: p.durationDays,
          priceCredits: p.priceCredits,
          resellerSellingPrice: p.resellerSellingPrice,
          stockCount: available.length,
          inStock: available.length > 0
        };
      }));
      return { id: app3.id, name: app3.name, stock };
    }));
    res.json(result);
  });
  app2.post("/api/reseller/v1/stock/take", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
    const { appId, planId, planName, quantity = 1, customer, note } = req.body;
    if (!appId) return res.status(400).json({ error: "appId is required" });
    if (!planId && !planName) return res.status(400).json({ error: "planId or planName is required" });
    const app3 = await getAppById(Number(appId));
    if (!app3) return res.status(404).json({ error: "App not found" });
    const assigned = await getAssignedAppIds(reseller.id);
    if (!assigned.includes(app3.id)) return res.status(403).json({ error: "App not assigned" });
    const plan = await resolvePlan(app3.id, planId ? Number(planId) : void 0, planName);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    const qty = Math.max(1, Math.min(100, Number(quantity) || 1));
    const stock = await getAvailableStockForPlan(app3.id, plan.id, qty);
    if (stock.length < qty) return res.status(409).json({ error: `Insufficient stock. Available: ${stock.length}, requested: ${qty}` });
    const reserved = [];
    for (const s of stock) {
      const r = await reserveStockForReseller(s.id, reseller.id);
      if (!r) return res.status(409).json({ error: "Stock reservation failed" });
      reserved.push(r);
    }
    const noteParts = [];
    if (customer) noteParts.push(`customer: ${customer}`);
    if (note) noteParts.push(note);
    const noteValue = noteParts.length ? noteParts.join(" | ") : void 0;
    const keys = [];
    for (const r of reserved) {
      await createLicenseKey({
        keyValue: r.keyValue,
        resellerId: reseller.id,
        appId: app3.id,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
        creditsSpent: "0",
        source: "api",
        ...noteValue ? { note: noteValue } : {}
      });
      keys.push(r.keyValue);
    }
    res.json({ keys, plan: { id: plan.id, name: plan.name, durationDays: plan.durationDays } });
  });
  const gatewayTake = async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ data: null, error: "Invalid API key" });
    const source = req.method === "GET" ? req.query : req.body;
    const raw = source;
    const appId = raw.appId ?? raw.appID ?? raw.app_id ?? raw.idApp ?? raw.productId ?? raw.produtoId ?? raw.app;
    let planId = raw.planId ?? raw.planID ?? raw.plan_id;
    let planName = raw.planName ?? raw.plan ?? raw.plano;
    if (!planId && !planName) {
      const fallback = raw.produto ?? raw.producto ?? raw.product ?? raw.prod;
      if (fallback && !/^[0-9]+$/.test(String(fallback))) planName = fallback;
      else if (fallback) planId = fallback;
    }
    const quantity = raw.qtd ?? raw.quantidade ?? raw.quantity ?? raw.qty ?? 1;
    const customer = raw.customer ?? raw.cliente ?? raw.client ?? raw.email ?? raw.buyerEmail;
    if (!appId && !planId && !planName) return res.status(400).json({ data: null, error: "appId or produto is required" });
    let app3 = appId ? await getAppById(Number(appId)) : null;
    let plan;
    const assignedRows = await getAppsByResellerId(reseller.id);
    const assignedApps = assignedRows.map((r) => r.app);
    const assignedIds = assignedApps.map((a) => a.id);
    if (!app3 && planName) {
      const matches = [];
      for (const a of assignedApps) {
        const plans = await getPlansByAppId(a.id);
        const p = plans.find((pl) => pl.name.toLowerCase().trim() === String(planName).toLowerCase().trim());
        if (p) matches.push({ app: a, plan: p });
      }
      if (matches.length === 1) {
        app3 = matches[0].app;
        plan = matches[0].plan;
      } else if (matches.length > 1) {
        return res.status(400).json({ data: null, error: `Multiple products match "${planName}". Please include appId or productId.` });
      }
    }
    if (app3 && !plan) {
      if (!planId && !planName) return res.status(400).json({ data: null, error: "planId or planName is required" });
      plan = await resolvePlan(app3.id, planId ? Number(planId) : void 0, planName);
    }
    if (!plan) return res.status(404).json({ data: null, error: "Plan not found" });
    const qty = Math.max(1, Math.min(100, Number(quantity) || 1));
    const stock = await getAvailableStockForPlan(app3.id, plan.id, qty);
    if (stock.length < qty) return res.status(409).json({ data: null, error: `Insufficient stock. Available: ${stock.length}, requested: ${qty}` });
    const reserved = [];
    for (const s of stock) {
      const r = await reserveStockForReseller(s.id, reseller.id);
      if (!r) return res.status(409).json({ data: null, error: "Stock reservation failed" });
      reserved.push(r);
    }
    const noteParts = [];
    if (customer) noteParts.push(`customer: ${customer}`);
    const noteValue = noteParts.length ? noteParts.join(" | ") : void 0;
    const keys = [];
    for (const r of reserved) {
      await createLicenseKey({
        keyValue: r.keyValue,
        resellerId: reseller.id,
        appId: app3.id,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
        creditsSpent: "0",
        source: "gateway",
        ...noteValue ? { note: noteValue } : {}
      });
      keys.push(r.keyValue);
    }
    res.json({
      data: {
        key: keys[0],
        keys: keys.length > 1 ? keys : void 0,
        plan: { id: plan.id, name: plan.name, durationDays: plan.durationDays }
      }
    });
  };
  app2.get("/api/reseller/v1/gateway/take", gatewayTake);
  app2.post("/api/reseller/v1/gateway/take", gatewayTake);
  app2.post("/api/reseller/v1/buy", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
    if (reseller.resellerType !== "credits") return res.status(403).json({ error: "Not a credits reseller" });
    const { appId, planId, planName, quantity = 1, customer, note } = req.body;
    if (!appId) return res.status(400).json({ error: "appId is required" });
    if (!planId && !planName) return res.status(400).json({ error: "planId or planName is required" });
    const app3 = await getAppById(Number(appId));
    if (!app3) return res.status(404).json({ error: "App not found" });
    const assigned = await getAssignedAppIds(reseller.id);
    if (!assigned.includes(app3.id)) return res.status(403).json({ error: "App not assigned" });
    const plan = await resolvePlan(app3.id, planId ? Number(planId) : void 0, planName);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    const qty = Math.max(1, Math.min(100, Number(quantity) || 1));
    const basePrice = parseFloat(plan.priceCredits);
    const discount = parseFloat(reseller.discountPercent);
    const pricePerKey = basePrice * (1 - discount / 100);
    const totalCost = pricePerKey * qty;
    let currentCredits = parseFloat(reseller.credits);
    if (currentCredits < totalCost) return res.status(402).json({ error: `Insufficient credits. Need: ${totalCost.toFixed(2)}, have: ${currentCredits.toFixed(2)}` });
    const stock = await getAvailableStockForPlan(app3.id, plan.id, qty);
    if (stock.length < qty) return res.status(409).json({ error: `Insufficient stock. Available: ${stock.length}, requested: ${qty}` });
    const reserved = [];
    for (const s of stock) {
      const r = await reserveStockForReseller(s.id, reseller.id);
      if (!r) return res.status(409).json({ error: "Stock reservation failed" });
      reserved.push(r);
    }
    const freshReseller = await getResellerById(reseller.id);
    currentCredits = parseFloat(String(freshReseller?.credits ?? reseller.credits));
    if (currentCredits < totalCost) {
      for (const r of reserved) await releaseStockReservation(r.id);
      return res.status(402).json({ error: `Insufficient credits after reservation. Need: ${totalCost.toFixed(2)}, have: ${currentCredits.toFixed(2)}` });
    }
    const newCredits = currentCredits - totalCost;
    const newPurchases = reseller.totalPurchases + qty;
    const noteParts = [];
    if (customer) noteParts.push(`customer: ${customer}`);
    if (note) noteParts.push(note);
    const noteValue = noteParts.length ? noteParts.join(" | ") : void 0;
    const keys = [];
    for (const r of reserved) {
      await createLicenseKey({
        keyValue: r.keyValue,
        resellerId: reseller.id,
        appId: app3.id,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
        creditsSpent: pricePerKey.toFixed(2),
        resellerCredits: newCredits.toFixed(2),
        source: "api",
        ...noteValue ? { note: noteValue } : {}
      });
      keys.push(r.keyValue);
    }
    await updateResellerCredits(reseller.id, newCredits.toFixed(2), newPurchases, reseller.discountPercent);
    await createCreditTransaction({
      resellerId: reseller.id,
      type: "deduct",
      amount: totalCost.toFixed(2),
      balanceBefore: reseller.credits,
      balanceAfter: newCredits.toFixed(2),
      description: `API buy ${qty}x ${app3.name} (${plan.name})`
    });
    res.json({ keys, cost: totalCost.toFixed(2), balanceAfter: newCredits.toFixed(2), plan: { id: plan.id, name: plan.name, durationDays: plan.durationDays } });
  });
  app2.post("/api/reseller/v1/other-store/hwid", async (_req, res) => {
    const crypto3 = await import("crypto");
    const hwid = "oshw_" + crypto3.randomUUID().replace(/-/g, "");
    res.json({ hwid });
  });
  app2.post("/api/reseller/v1/other-store/charge", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
    const hwid = req.headers["x-other-store-hwid"];
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const ip = String(clientIp).split(",")[0]?.trim() || "";
    const otherStore = hwid ? await getOtherStoreResellerByHwid(hwid) : null;
    if (!otherStore || otherStore.resellerId !== reseller.id) return res.status(403).json({ error: "HWID not authorized for Other Store" });
    const { appId, planName, quantity = 1, customer } = req.body;
    if (!appId) return res.status(400).json({ error: "appId is required" });
    if (!planName) return res.status(400).json({ error: "planName is required" });
    const app3 = await getAppById(Number(appId));
    if (!app3) return res.status(404).json({ error: "App not found" });
    const assigned = await getAssignedAppIds(reseller.id);
    if (!assigned.includes(app3.id)) return res.status(403).json({ error: "App not assigned" });
    const plan = await resolvePlan(app3.id, void 0, planName);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    const qty = Math.max(1, Math.min(100, Number(quantity) || 1));
    const available = await getAvailableStockForPlan(app3.id, plan.id, qty);
    if (available.length < qty) return res.status(409).json({ error: `Insufficient stock. Available: ${available.length}, requested: ${qty}` });
    const price = parseFloat(String(plan.resellerSellingPrice));
    if (!price || price <= 0) return res.status(400).json({ error: "Reseller selling price not set for plan" });
    const amountCents = Math.round(price * 100 * qty);
    const splitPercent = parseFloat(String(otherStore.splitPercent));
    const PURIN_API_KEY2 = process.env.PURIN_CASH_API_KEY;
    if (!PURIN_API_KEY2) return res.status(500).json({ error: "PurinCash not configured" });
    const callbackUrl = `${process.env.VITE_APP_URL || "https://vgsellers.lat"}/api/webhooks/purincash`;
    const body = {
      amountCents,
      description: `Key ${plan.name} - Other Store`,
      splits: [{ recipientEmail: otherStore.recipientEmail, percentage: splitPercent }],
      callbackUrl,
      customer: customer ? { name: reseller.username, email: customer } : { name: reseller.username, email: reseller.email || `${reseller.username}@other-store.local` }
    };
    const response = await fetch("https://api.purincash.com/v1/split-charges", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${PURIN_API_KEY2}` },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[PurinCash] split charge error:", err);
      return res.status(500).json({ error: "Failed to create split charge" });
    }
    const data = await response.json();
    const brCode = data?.pix?.brCode || data?.brCode || null;
    const qrCodeImage = data?.pix?.qrCodeImage || data?.qrCodeImage || null;
    res.json({ paymentId: data.paymentId, amountCents, brCode, qrCodeImage, expiresAt: data.expiresAt, plan: { id: plan.id, name: plan.name, durationDays: plan.durationDays } });
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

// server/purinCashWebhook.ts
init_db();
import crypto2 from "crypto";
var FINAL_PAYMENT_STATUSES = /* @__PURE__ */ new Set(["expired", "cancelled", "refunded"]);
var PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
var PURIN_WEBHOOK_SECRET = process.env.PURINCASH_WEBHOOK_SECRET;
function isValidHmac(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const sig = Array.isArray(signature) ? signature[0] : signature;
  const expected = crypto2.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (sig.length !== expected.length) return false;
  try {
    return crypto2.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
async function handlePurinCashWebhook(req, res) {
  try {
    const rawBody = req.body;
    const signature = req.headers["x-webhook-signature"];
    const webhookId = req.headers["x-webhook-id"];
    console.log("[PurinCash Webhook] hit", {
      method: req.method,
      url: req.url,
      host: req.headers.host,
      forwardedHost: req.headers["x-forwarded-host"],
      contentType: req.headers["content-type"],
      webhookId,
      hasSecret: !!PURIN_WEBHOOK_SECRET,
      bodyLength: rawBody?.length
    });
    if (!PURIN_WEBHOOK_SECRET) {
      console.error("[PurinCash Webhook] missing PURINCASH_WEBHOOK_SECRET");
      return res.status(401).json({ error: "Webhook n\xE3o configurado" });
    }
    if (!isValidHmac(rawBody, signature, PURIN_WEBHOOK_SECRET)) {
      console.warn("[PurinCash Webhook] invalid signature");
      return res.status(401).json({ error: "Assinatura inv\xE1lida" });
    }
    const payload = rawBody ? JSON.parse(rawBody.toString("utf8")) : {};
    const { event, paymentId, status, paidAt } = payload;
    if (!paymentId || !status) {
      console.warn("[PurinCash Webhook] missing paymentId or status", { event, paymentId, status });
      return res.status(400).json({ error: "Missing paymentId or status" });
    }
    console.log(`[PurinCash Webhook] paymentId=${paymentId} status=${status} event=${event}`);
    const result = await processPurinPaymentUpdate(paymentId, status, paidAt ? new Date(paidAt) : /* @__PURE__ */ new Date());
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[PurinCash Webhook] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function checkPurinPaymentStatus(paymentId) {
  if (!PURIN_API_KEY) return null;
  const isSplit = paymentId.startsWith("psplit_");
  const isCharge = paymentId.startsWith("psc_") || isSplit;
  const url = isSplit ? `https://api.purincash.com/v1/split-charges/${paymentId}` : isCharge ? `https://api.purincash.com/v1/charges/${paymentId}` : `https://api.purincash.com/v1/payments/${paymentId}`;
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${PURIN_API_KEY}` }
    });
    if (!response.ok) {
      console.error("[PurinCash Polling] HTTP", response.status, await response.text());
      return null;
    }
    const data = await response.json();
    console.log("[PurinCash Polling] paymentId=", paymentId, "status=", data.status);
    return data;
  } catch (e) {
    console.error("[PurinCash Polling] Error:", e);
    return null;
  }
}
async function processPurinPaymentUpdate(paymentId, status, paidAt) {
  const payment = await getPixPaymentByPaymentId(paymentId);
  if (!payment) {
    console.warn("[PurinCash] Payment not found:", paymentId);
    return { status: 404, body: { error: "Payment not found" } };
  }
  if (status === "paid") {
    const reseller = await getResellerById(payment.resellerId);
    if (!reseller) {
      return { status: 404, body: { error: "Reseller not found" } };
    }
    if (payment.paymentType === "other-store") {
      const appId = payment.appId;
      const planId = payment.planId;
      const quantity = payment.quantity ?? 1;
      if (!appId || !planId || quantity < 1) {
        throw new Error(`Pagamento other-store ${paymentId} sem app, plano ou quantidade v\xE1lida`);
      }
      const existingKeys = await getKeysByPaymentId(paymentId);
      if (payment.status === "paid" && existingKeys.length >= quantity) {
        return { status: 200, body: { ok: true, message: "Already processed" } };
      }
      const app2 = await getAppById(appId);
      const plan = await getPlanById(planId);
      if (!app2 || !plan || plan.appId !== appId) {
        throw new Error(`App ou plano n\xE3o encontrado para o pagamento other-store ${paymentId}`);
      }
      const missingQuantity = Math.max(0, quantity - existingKeys.length);
      if (missingQuantity > 0) {
        const stockItems = await getAvailableStockForPlan(appId, planId, missingQuantity);
        if (stockItems.length < missingQuantity) {
          throw new Error(`Estoque insuficiente para ${plan.name}: tem ${stockItems.length}, precisa ${missingQuantity}`);
        }
        for (const item of stockItems) {
          const reserved = await reserveStockForReseller(item.id, payment.resellerId);
          if (!reserved) {
            throw new Error(`Falha ao reservar key do estoque: ${item.id}`);
          }
          await createLicenseKey({
            keyValue: reserved.keyValue,
            resellerId: payment.resellerId,
            appId,
            planId: plan.id,
            planName: plan.name,
            durationDays: plan.durationDays,
            creditsSpent: "0",
            resellerCredits: reseller.credits,
            note: `other-store:${paymentId}`,
            source: "other-store"
          });
        }
      }
      if (payment.status !== "paid") {
        const newPurchases = reseller.totalPurchases + quantity;
        await updateResellerCredits(
          payment.resellerId,
          reseller.credits,
          newPurchases,
          reseller.discountPercent
        );
      }
      await updatePixPaymentStatus(paymentId, "paid", paidAt);
      console.log(`[PurinCash] Delivered ${quantity} key(s) for other-store payment ${paymentId}`);
      return { status: 200, body: { ok: true } };
    } else if (payment.paymentType === "key") {
      const appId = payment.appId;
      const planId = payment.planId;
      const quantity = payment.quantity ?? 1;
      if (!appId || !planId || quantity < 1) {
        throw new Error(`Pagamento de key ${paymentId} sem app, plano ou quantidade v\xE1lida`);
      }
      const existingKeys = await getKeysByPaymentId(paymentId);
      if (payment.status === "paid" && existingKeys.length >= quantity) {
        return { status: 200, body: { ok: true, message: "Already processed" } };
      }
      const app2 = await getAppById(appId);
      const plan = await getPlanById(planId);
      if (!app2 || !plan || plan.appId !== appId) {
        throw new Error(`App ou plano n\xE3o encontrado para o pagamento ${paymentId}`);
      }
      const missingQuantity = Math.max(0, quantity - existingKeys.length);
      if (missingQuantity > 0) {
        const stockItems = await getAvailableStockForPlan(appId, planId, missingQuantity);
        if (stockItems.length < missingQuantity) {
          throw new Error(`Estoque insuficiente para ${plan.name}: tem ${stockItems.length}, precisa ${missingQuantity}`);
        }
        const pricePerKey = payment.amountCents / quantity / 100;
        const notePrefix = payment.paymentMethod === "ltc" ? "ltc" : "pix";
        for (const item of stockItems) {
          const reserved = await reserveStockForReseller(item.id, payment.resellerId);
          if (!reserved) {
            throw new Error(`Falha ao reservar key do estoque: ${item.id}`);
          }
          await createLicenseKey({
            keyValue: reserved.keyValue,
            resellerId: payment.resellerId,
            appId,
            planId: plan.id,
            planName: plan.name,
            durationDays: plan.durationDays,
            creditsSpent: pricePerKey.toFixed(2),
            resellerCredits: reseller.credits,
            note: `${notePrefix}:${paymentId}`
          });
        }
      }
      if (payment.status !== "paid") {
        const newPurchases = reseller.totalPurchases + quantity;
        await updateResellerCredits(
          payment.resellerId,
          reseller.credits,
          newPurchases,
          reseller.discountPercent
        );
      }
      await updatePixPaymentStatus(paymentId, "paid", paidAt);
      console.log(`[PurinCash] Delivered ${quantity} key(s) for payment ${paymentId}`);
      return { status: 200, body: { ok: true } };
    } else {
      if (payment.status === "paid") {
        return { status: 200, body: { ok: true, message: "Already processed" } };
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
      await updatePixPaymentStatus(paymentId, "paid", paidAt);
      console.log(`[PurinCash] Added ${creditsToAdd} credits for payment ${paymentId}`);
      return { status: 200, body: { ok: true } };
    }
  } else if (FINAL_PAYMENT_STATUSES.has(status) && payment.status === "pending") {
    await updatePixPaymentStatus(paymentId, status);
    return { status: 200, body: { ok: true } };
  }
  return { status: 200, body: { ok: true } };
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
function extractPixData(data) {
  return {
    paymentId: data?.paymentId,
    amountCents: data?.amountCents,
    expiresAt: data?.expiresAt,
    brCode: data?.pix?.brCode || data?.pix?.copiaECola || data?.pix?.copia_e_cola || data?.brCode || data?.br_code || data?.copiaECola || null,
    qrCodeImage: data?.pix?.qrCodeImage || data?.pix?.qrCodeBase64 || data?.pix?.qr_code || data?.qrCodeImage || data?.qrCodeBase64 || data?.qrCode || data?.qr_code || null
  };
}
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
    if (!ipAllowed) throw new TRPCError3({ code: "FORBIDDEN", message: "Acesso negado: IP nao autorizado" });
    const admin = await getAdminByUsername(input.username);
    if (!admin) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    const valid = await bcrypt.compare(input.password, admin.passwordHash);
    if (!valid) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    const token = await signCustomJwt({ sub: String(admin.id), role: "admin", username: admin.username });
    ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge: 7 * 24 * 3600 });
    return { success: true, role: "admin", username: admin.username };
  }),
  resellerLogin: publicProcedure.input(z2.object({
    username: z2.string(),
    password: z2.string(),
    remember: z2.boolean().default(false)
  })).mutation(async ({ input, ctx }) => {
    const admin = await getAdminByUsername(input.username);
    if (admin) {
      const validAdmin = await bcrypt.compare(input.password, admin.passwordHash);
      if (validAdmin) {
        const clientIp = getClientIp(ctx.req);
        const ipAllowed = await isAdminIpAllowed(clientIp);
        if (!ipAllowed) throw new TRPCError3({ code: "FORBIDDEN", message: "Acesso negado: IP nao autorizado" });
        const token2 = await signCustomJwt({ sub: String(admin.id), role: "admin", username: admin.username });
        const maxAge2 = input.remember ? 30 * 24 * 3600 : 7 * 24 * 3600;
        ctx.res.cookie(CUSTOM_COOKIE, token2, { ...getSessionCookieOptions(ctx.req), maxAge: maxAge2 });
        return { success: true, role: "admin", username: admin.username };
      }
    }
    const reseller = await getResellerByUsername(input.username);
    if (!reseller) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    if (reseller.status !== "active") throw new TRPCError3({ code: "FORBIDDEN", message: "Conta desativada" });
    const valid = await bcrypt.compare(input.password, reseller.passwordHash);
    if (!valid) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Credenciais inv\xE1lidas" });
    await updateReseller(reseller.id, { lastLoginAt: /* @__PURE__ */ new Date() });
    const otherStoreOwnerId = reseller.parentResellerId ?? reseller.id;
    const otherStore = await getOtherStoreResellerByOwnerResellerId(otherStoreOwnerId);
    const tokenPayload = { sub: String(reseller.id), role: "reseller", username: reseller.username };
    if (otherStore && otherStore.resellerId === reseller.id) {
      tokenPayload.otherStoreId = otherStore.id;
    }
    const token = await signCustomJwt(tokenPayload);
    const maxAge = input.remember ? 30 * 24 * 3600 : 7 * 24 * 3600;
    ctx.res.cookie(CUSTOM_COOKIE, token, { ...getSessionCookieOptions(ctx.req), maxAge });
    return { success: true, role: "reseller", username: reseller.username };
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
      const otherStoreId = payload?.otherStoreId ?? null;
      const otherStore = otherStoreId ? await getOtherStoreResellerById(otherStoreId) : null;
      return {
        id: reseller.id,
        username: reseller.username,
        role: "reseller",
        credits: reseller.credits,
        discountPercent: reseller.discountPercent,
        totalPurchases: reseller.totalPurchases,
        status: reseller.status,
        canCreateSubResellers: reseller.canCreateSubResellers,
        otherStore: otherStore ? {
          id: otherStore.id,
          label: otherStore.label,
          splitPercent: otherStore.splitPercent
        } : null
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
  const otherStoreOwnerId = reseller.parentResellerId ?? reseller.id;
  const otherStore = await getOtherStoreResellerByOwnerResellerId(otherStoreOwnerId);
  return next({ ctx: { ...ctx, resellerId, reseller, otherStore } });
});
var adminRouter = router({
  // Resellers
  listResellers: adminProcedure2.query(async () => {
    const list = await getAllResellers();
    return list.map((r) => ({ ...r, passwordHash: void 0 }));
  }),
  resellerStats: adminProcedure2.query(async () => {
    const [credits, percentage, other] = await Promise.all([
      getResellerKeyStatsByType("credits"),
      getResellerKeyStatsByType("percentage"),
      getResellerKeyStatsByType("other")
    ]);
    return { credits, percentage, other };
  }),
  dashboardStats: adminProcedure2.query(async () => {
    const [resellers2, apps2, allKeys, months, topApps] = await Promise.all([
      getAllResellers(),
      getAllApps(),
      getAllKeys(),
      getDashboardKeysByMonth(),
      getDashboardTopApps()
    ]);
    const appsById = new Map(apps2.map((a) => [a.id, a]));
    const activeResellers = resellers2.filter((r) => r.status === "active").length;
    const activeKeys = allKeys.filter((k) => k.status === "active").length;
    const usedKeys = allKeys.filter((k) => k.status === "used").length;
    const totalCredits = allKeys.reduce((sum, k) => sum + (parseFloat(String(k.creditsSpent)) || 0), 0);
    return {
      counts: { resellers: resellers2.length, activeResellers, apps: apps2.length, keys: allKeys.length, activeKeys, usedKeys, totalCredits: totalCredits.toFixed(2) },
      months,
      topApps: topApps.map((a) => ({ ...a, appName: appsById.get(a.appId)?.name || `App #${a.appId}` }))
    };
  }),
  createReseller: adminProcedure2.input(z2.object({
    username: z2.string().min(3).max(64),
    password: z2.string().min(6),
    email: z2.string().email().optional(),
    location: z2.string().optional(),
    resellerType: z2.enum(["credits", "percentage", "other"]).default("credits"),
    canCreateSubResellers: z2.boolean().default(false)
  })).mutation(async ({ input }) => {
    const existing = await getResellerByUsername(input.username);
    if (existing) throw new TRPCError3({ code: "CONFLICT", message: "Username j\xE1 existe" });
    const passwordHash = await bcrypt.hash(input.password, 10);
    await createReseller({
      username: input.username,
      passwordHash,
      email: input.email,
      location: input.location,
      resellerType: input.resellerType,
      canCreateSubResellers: input.canCreateSubResellers
    });
    return { success: true };
  }),
  updateReseller: adminProcedure2.input(z2.object({
    id: z2.number(),
    email: z2.string().email().optional().nullable(),
    location: z2.string().optional().nullable(),
    status: z2.enum(["active", "inactive", "banned"]).optional(),
    password: z2.string().min(6).optional(),
    resellerType: z2.enum(["credits", "percentage", "other"]).optional(),
    discountPercent: z2.number().min(0).max(100).optional(),
    canCreateSubResellers: z2.boolean().optional()
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
    const duplicates = lines.length - rows.length;
    return { added: rows.length, duplicates };
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
  // ─── App Downloads ───────────────────────────────────────────────────────────
  getDownloadsByApp: adminProcedure2.input(z2.object({ appId: z2.number() })).query(async ({ input }) => {
    return getDownloadsByAppId(input.appId);
  }),
  createAppDownload: adminProcedure2.input(z2.object({
    appId: z2.number(),
    type: z2.enum(["download", "tutorial"]),
    title: z2.string().min(1),
    url: z2.string().min(1),
    videoUrl: z2.string().optional(),
    sortOrder: z2.number().default(0)
  })).mutation(async ({ input }) => {
    await createAppDownload(input);
    return { success: true };
  }),
  updateAppDownload: adminProcedure2.input(z2.object({
    id: z2.number(),
    type: z2.enum(["download", "tutorial"]).optional(),
    title: z2.string().min(1).optional(),
    url: z2.string().min(1).optional(),
    videoUrl: z2.string().optional().nullable(),
    sortOrder: z2.number().optional()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateAppDownload(id, data);
    return { success: true };
  }),
  deleteAppDownload: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteAppDownload(input.id);
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
  listAllKeys: adminProcedure2.query(() => getAllKeysWithReseller()),
  // Reseller API Keys
  listResellerApiKeys: adminProcedure2.input(z2.object({ resellerId: z2.number() })).query(async ({ input }) => {
    const keys = await listResellerApiKeys(input.resellerId);
    return keys.map((k) => ({ ...k, apiKey: k.apiKey.slice(0, 8) + "..." + k.apiKey.slice(-4) }));
  }),
  createResellerApiKey: adminProcedure2.input(z2.object({ resellerId: z2.number(), name: z2.string().optional(), allowedIps: z2.string().optional() })).mutation(async ({ input }) => {
    const key = await createResellerApiKey({ resellerId: input.resellerId, name: input.name, allowedIps: input.allowedIps });
    return { apiKey: key.apiKey, id: key.id };
  }),
  revokeResellerApiKey: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await revokeResellerApiKey(input.id);
    return { success: true };
  }),
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
  }),
  // ─── Other Store ─────────────────────────────────────────────────────────────
  listOtherStoreResellers: adminProcedure2.query(async () => {
    const list = await getOtherStoreResellers();
    const hwids = await Promise.all(list.map((r) => getOtherStoreHwidsByResellerId(r.id)));
    return list.map((r, i) => ({ ...r, hwids: hwids[i] }));
  }),
  getOtherStoreReseller: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    const r = await getOtherStoreResellerById(input.id);
    if (!r) throw new TRPCError3({ code: "NOT_FOUND" });
    const hwids = await getOtherStoreHwidsByResellerId(r.id);
    return { ...r, hwids };
  }),
  createOtherStoreReseller: adminProcedure2.input(z2.object({
    resellerId: z2.number(),
    label: z2.string().optional(),
    purinApiKey: z2.string().optional(),
    recipientEmail: z2.string().email(),
    discordId: z2.string().optional(),
    splitPercent: z2.number().min(0.01).max(99.99)
  })).mutation(async ({ input }) => {
    const r = await createOtherStoreReseller({
      resellerId: input.resellerId,
      label: input.label,
      purinApiKey: input.purinApiKey,
      recipientEmail: input.recipientEmail,
      discordId: input.discordId,
      splitPercent: String(input.splitPercent)
    });
    return r;
  }),
  updateOtherStoreReseller: adminProcedure2.input(z2.object({
    id: z2.number(),
    resellerId: z2.number().optional(),
    label: z2.string().optional(),
    purinApiKey: z2.string().optional(),
    recipientEmail: z2.string().email().optional(),
    discordId: z2.string().optional(),
    splitPercent: z2.number().min(0.01).max(99.99).optional()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const r = await updateOtherStoreReseller(id, data);
    return r;
  }),
  deleteOtherStoreReseller: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteOtherStoreReseller(input.id);
    return { success: true };
  }),
  addOtherStoreHwid: adminProcedure2.input(z2.object({ otherStoreResellerId: z2.number(), hwid: z2.string().min(1) })).mutation(async ({ input }) => {
    const row = await createOtherStoreHwid({
      otherStoreResellerId: input.otherStoreResellerId,
      hwid: input.hwid
    });
    return row;
  }),
  removeOtherStoreHwid: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteOtherStoreHwid(input.id);
    return { success: true };
  })
});
var resellerRouter = router({
  dashboard: resellerProcedure.query(async ({ ctx }) => {
    const [monthly, byApp, myKeys, subs] = await Promise.all([
      getResellerKeysByMonth(ctx.resellerId),
      getResellerKeysByApp(ctx.resellerId),
      getKeysByResellerId(ctx.resellerId),
      getSubResellerKeyStats(ctx.resellerId)
    ]);
    const apps2 = await getAllApps();
    const appsById = new Map(apps2.map((a) => [a.id, a]));
    const totalSpent = myKeys.reduce((sum, k) => sum + (parseFloat(String(k.creditsSpent)) || 0), 0);
    const totalKeys = myKeys.length;
    return {
      monthly,
      byApp: byApp.map((a) => ({ ...a, appName: appsById.get(a.appId)?.name || `App #${a.appId}` })),
      counts: { totalKeys, totalSpent: totalSpent.toFixed(2), activeKeys: myKeys.filter((k) => k.status === "active").length, usedKeys: myKeys.filter((k) => k.status === "used").length },
      subResellers: subs
    };
  }),
  profile: resellerProcedure.query(async ({ ctx }) => {
    const r = ctx.reseller;
    const purchases = r.totalPurchases;
    const discount = parseFloat(r.discountPercent) || 0;
    const isPercentLike = r.resellerType === "percentage" || r.resellerType === "other";
    const nextLevel = isPercentLike && purchases < 10 ? { target: 10, discount: 40 } : isPercentLike && purchases < 20 ? { target: 20, discount: 50 } : null;
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
      canCreateSubResellers: r.canCreateSubResellers,
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
  getDownloadsByApp: resellerProcedure.input(z2.object({ appId: z2.number() })).query(async ({ input }) => {
    return getDownloadsByAppId(input.appId);
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
        resellerCredits: newCredits.toFixed(2),
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
  // ─── Other Store (split) ─────────────────────────────────────────────────────
  createOtherStoreSplitCharge: resellerProcedure.input(z2.object({
    appId: z2.number(),
    planId: z2.number(),
    quantity: z2.number().min(1).max(100)
  })).mutation(async ({ ctx, input }) => {
    const PURIN_API_KEY2 = process.env.PURIN_CASH_API_KEY;
    if (!PURIN_API_KEY2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento n\xE3o configurado" });
    const otherStore = ctx.otherStore;
    if (!otherStore) throw new TRPCError3({ code: "FORBIDDEN", message: "Acesso Other Store n\xE3o autorizado" });
    const plan = await getPlanById(input.planId);
    if (!plan || plan.appId !== input.appId) throw new TRPCError3({ code: "NOT_FOUND", message: "Plano n\xE3o encontrado" });
    const assigned = await getAssignedAppIds(ctx.resellerId);
    if (!assigned.includes(input.appId)) throw new TRPCError3({ code: "FORBIDDEN", message: "App n\xE3o atribu\xEDdo" });
    const qty = input.quantity;
    const available = await getAvailableStockForPlan(input.appId, input.planId, qty);
    if (available.length < qty) throw new TRPCError3({ code: "BAD_REQUEST", message: `Estoque insuficiente: ${available.length} dispon\xEDvel` });
    const price = parseFloat(String(plan.resellerSellingPrice));
    if (!price || price <= 0) throw new TRPCError3({ code: "BAD_REQUEST", message: "Pre\xE7o de venda n\xE3o configurado para este plano" });
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
        externalId: String(ctx.resellerId)
      }
    };
    const response = await fetch("https://api.purincash.com/v1/split-charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PURIN_API_KEY2}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[PurinCash] Error creating split charge:", err);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cobran\xE7a split" });
    }
    const data = await response.json();
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
      quantity: qty
    });
    return {
      paymentId: data.paymentId,
      amountCents,
      totalCost: amountCents / 100,
      brCode,
      qrCodeImage,
      expiresAt: data.expiresAt,
      status: "pending"
    };
  }),
  // ─── Pix / Purin Cash ──────────────────────────────────────────────────────
  createPixCharge: resellerProcedure.input(z2.object({
    credits: z2.number().min(600, "M\xEDnimo 600 cr\xE9ditos").max(1e4, "M\xE1ximo 10000 cr\xE9ditos")
  })).mutation(async ({ ctx, input }) => {
    const PURIN_API_KEY2 = process.env.PURIN_CASH_API_KEY;
    if (!PURIN_API_KEY2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Pix n\xE3o configurado" });
    const reseller = ctx.reseller;
    const amountCents = Math.round(input.credits * 100);
    const callbackUrl = `${process.env.VITE_APP_URL || "https://vgsellers.lat"}/api/webhooks/purincash`;
    const body = {
      valueCents: amountCents,
      description: `Compra de ${input.credits} cr\xE9dito(s) - VG SELLERS`,
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
        "Authorization": `Bearer ${PURIN_API_KEY2}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[PurinCash] Error creating charge:", err);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cobran\xE7a Pix" });
    }
    const data = await response.json();
    console.log("[PurinCash] createKeyPixCharge response:", data);
    const { brCode, qrCodeImage } = extractPixData(data);
    await createPixPayment({
      resellerId: reseller.id,
      paymentId: data.paymentId,
      amountCents: data.amountCents,
      credits: input.credits.toFixed(2),
      status: "pending",
      brCode,
      qrCodeImage,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
    });
    return {
      paymentId: data.paymentId,
      amountCents: data.amountCents,
      credits: input.credits,
      brCode,
      qrCodeImage,
      expiresAt: data.expiresAt,
      status: "pending"
    };
  }),
  // Criar cobrança LTC para compra de créditos
  createLtcCreditsCharge: resellerProcedure.input(z2.object({
    credits: z2.number().min(600, "M\xEDnimo 600 cr\xE9ditos").max(1e4, "M\xE1ximo 10000 cr\xE9ditos")
  })).mutation(async ({ ctx, input }) => {
    const PURIN_API_KEY2 = process.env.PURIN_CASH_API_KEY;
    if (!PURIN_API_KEY2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Crypto n\xE3o configurado" });
    const reseller = ctx.reseller;
    const totalCost = input.credits;
    const amountCents = Math.round(input.credits * 100);
    if (amountCents < 100) throw new TRPCError3({ code: "BAD_REQUEST", message: "Valor m\xEDnimo \xE9 R$ 1,00" });
    const callbackUrl = `${process.env.VITE_APP_URL || "https://vgsellers.lat"}/api/webhooks/purincash`;
    const body = {
      valueCents: amountCents,
      description: `Compra de ${input.credits} cr\xE9dito(s) - VG SELLERS`,
      paymentMethod: "ltc",
      callbackUrl,
      customer: {
        name: reseller.username,
        email: reseller.email || `${reseller.username}@zenitystore.com`,
        externalId: String(reseller.id)
      },
      metadata: JSON.stringify({ resellerId: reseller.id, credits: input.credits })
    };
    const response = await fetch("https://api.purincash.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PURIN_API_KEY2}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[PurinCash LTC Credits] Error creating charge:", err);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: `Erro ao criar cobran\xE7a LTC: ${err}` });
    }
    const data = await response.json();
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
      paymentMethod: "ltc"
    });
    return {
      paymentId: data.paymentId,
      amountCents: data.amountCents || amountCents,
      credits: input.credits,
      ltcAddress,
      ltcAmount,
      ltcPriceBrl,
      expiresAt: data.expiresAt,
      status: "pending"
    };
  }),
  checkPixStatus: resellerProcedure.input(z2.object({ paymentId: z2.string() })).query(async ({ ctx, input }) => {
    let payment = await getPixPaymentByPaymentId(input.paymentId);
    if (!payment || payment.resellerId !== ctx.resellerId) {
      throw new TRPCError3({ code: "NOT_FOUND" });
    }
    if (payment.status === "pending") {
      const remote = await checkPurinPaymentStatus(input.paymentId);
      if (remote?.status === "paid" && payment.status !== "paid") {
        await processPurinPaymentUpdate(input.paymentId, "paid", remote.paidAt ? new Date(remote.paidAt) : /* @__PURE__ */ new Date());
        payment = await getPixPaymentByPaymentId(input.paymentId);
      } else if (remote?.status && ["expired", "cancelled", "refunded"].includes(remote.status) && payment.status === "pending") {
        await processPurinPaymentUpdate(input.paymentId, remote.status, /* @__PURE__ */ new Date());
        payment = await getPixPaymentByPaymentId(input.paymentId);
      }
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
    if (reseller.resellerType !== "percentage" && reseller.resellerType !== "other") {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Esta a\xE7\xE3o \xE9 apenas para resellers de porcentagem" });
    }
    const PURIN_API_KEY2 = process.env.PURIN_CASH_API_KEY;
    if (!PURIN_API_KEY2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Pix n\xE3o configurado" });
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
    const callbackUrl = `${process.env.VITE_APP_URL || "https://vgsellers.lat"}/api/webhooks/purincash`;
    const body = {
      valueCents: amountCents,
      description: `${input.quantity}x key(s) ${app2.name} - ${plan.name} - VG SELLERS`,
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
        "Authorization": `Bearer ${PURIN_API_KEY2}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[PurinCash] Error creating key charge:", err);
      throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar cobran\xE7a Pix" });
    }
    const data = await response.json();
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
      quantity: input.quantity
    });
    return {
      paymentId: data.paymentId,
      amountCents: data.amountCents,
      totalCost,
      brCode,
      qrCodeImage,
      expiresAt: data.expiresAt,
      status: "pending"
    };
  }),
  // Verificar status de pagamento Pix de key e retornar keys se pago
  checkKeyPixStatus: resellerProcedure.input(z2.object({ paymentId: z2.string() })).query(async ({ ctx, input }) => {
    let payment = await getPixPaymentByPaymentId(input.paymentId);
    if (!payment || payment.resellerId !== ctx.resellerId) {
      throw new TRPCError3({ code: "NOT_FOUND" });
    }
    if (payment.status === "pending") {
      const remote = await checkPurinPaymentStatus(input.paymentId);
      if (remote?.status === "paid" && payment.status !== "paid") {
        await processPurinPaymentUpdate(input.paymentId, "paid", remote.paidAt ? new Date(remote.paidAt) : /* @__PURE__ */ new Date());
        payment = await getPixPaymentByPaymentId(input.paymentId);
      } else if (remote?.status && ["expired", "cancelled", "refunded"].includes(remote.status) && payment.status === "pending") {
        await processPurinPaymentUpdate(input.paymentId, remote.status, /* @__PURE__ */ new Date());
        payment = await getPixPaymentByPaymentId(input.paymentId);
      }
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
    if (reseller.resellerType !== "percentage" && reseller.resellerType !== "other") {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Esta a\xE7\xE3o \xE9 apenas para resellers de porcentagem" });
    }
    const PURIN_API_KEY2 = process.env.PURIN_CASH_API_KEY;
    if (!PURIN_API_KEY2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Pagamento Crypto n\xE3o configurado" });
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
    const callbackUrl = `${process.env.VITE_APP_URL || "https://vgsellers.lat"}/api/webhooks/purincash`;
    const body = {
      valueCents: amountCents,
      description: `${input.quantity}x key(s) ${app2.name} - ${plan.name} - VG SELLERS`,
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
        "Authorization": `Bearer ${PURIN_API_KEY2}`
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
  }),
  listSubResellers: resellerProcedure.query(async ({ ctx }) => {
    return getResellersByParentId(ctx.resellerId);
  }),
  deleteSubReseller: resellerProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const sub = await getResellerById(input.id);
    if (!sub || sub.parentResellerId !== ctx.resellerId) throw new TRPCError3({ code: "FORBIDDEN", message: "Reseller nao pertence a voce" });
    await deleteResellerById(input.id);
    return { success: true };
  }),
  subResellerStats: resellerProcedure.query(async ({ ctx }) => {
    const stats = await getSubResellerKeyStats(ctx.resellerId);
    const logs = await getSubResellerKeyLogs(ctx.resellerId);
    return { stats, logs };
  }),
  createSubReseller: resellerProcedure.input(z2.object({
    username: z2.string().min(3).max(32),
    password: z2.string().min(6),
    email: z2.string().email().optional(),
    discountPercent: z2.enum(["35", "40", "50"]).default("35")
  })).mutation(async ({ ctx, input }) => {
    if (!ctx.reseller.canCreateSubResellers) throw new TRPCError3({ code: "FORBIDDEN", message: "Sem permissao para criar resellers" });
    const existing = await getResellerByUsername(input.username);
    if (existing) throw new TRPCError3({ code: "CONFLICT", message: "Username ja existe" });
    const passwordHash = await bcrypt.hash(input.password, 10);
    await createReseller({
      username: input.username,
      passwordHash,
      email: input.email,
      resellerType: "other",
      parentResellerId: ctx.resellerId,
      credits: "0.00",
      discountPercent: input.discountPercent + ".00"
    });
    const newReseller = await getResellerByUsername(input.username);
    if (!newReseller) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar reseller criado" });
    let publicEmulator = await getAppByName("EMULATOR PUBLIC");
    if (!publicEmulator) publicEmulator = await getAppByName("Public Emulator");
    if (!publicEmulator) publicEmulator = await getAppByNameLike("emulator");
    if (!publicEmulator) publicEmulator = await getAppByNameLike("public");
    if (!publicEmulator) throw new TRPCError3({ code: "NOT_FOUND", message: "Nenhum app Public/Emulator encontrado" });
    await assignAppToReseller({ resellerId: newReseller.id, appId: publicEmulator.id });
    return { success: true };
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
  } catch {
    user = null;
  }
  if (!user) {
    try {
      const token = getCustomToken(opts.req);
      if (token) {
        const payload = await verifyCustomJwt(token);
        if (payload?.sub && typeof payload.sub === "string") {
          const id = Number(payload.sub);
          if (!Number.isNaN(id)) {
            user = {
              id,
              openId: payload.sub,
              name: payload.username || void 0,
              email: null,
              loginMethod: "cv_session",
              role: payload.role === "admin" ? "admin" : "user",
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date(),
              lastSignedIn: /* @__PURE__ */ new Date()
            };
          }
        }
      }
    } catch (err) {
      console.error("[Context] cv_session verification failed:", err);
    }
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/serverless.ts
var app = express();
app.set("trust proxy", true);
app.post("/api/webhooks/purincash", express.raw({ type: "application/json" }), handlePurinCashWebhook);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerOAuthRoutes(app);
registerResellerApi(app);
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
