import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Core users table (Manus OAuth, kept for compatibility) ───────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Admin accounts (username/password auth) ─────────────────────────────────
export const admins = mysqlTable("admins", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

// ─── Reseller accounts ────────────────────────────────────────────────────────
export const resellers = mysqlTable("resellers", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  credits: decimal("credits", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalPurchases: int("totalPurchases").default(0).notNull(),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("35.00").notNull(),
  resellerType: mysqlEnum("resellerType", ["credits", "percentage"]).default("credits").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "banned"]).default("active").notNull(),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

export type Reseller = typeof resellers.$inferSelect;
export type InsertReseller = typeof resellers.$inferInsert;

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Apps / Products ──────────────────────────────────────────────────────────
export const apps = mysqlTable("apps", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 32 }).default("v1.0"),
  categoryId: int("categoryId").references(() => categories.id),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  maxUsers: int("maxUsers").default(5000),
  features: text("features"), // JSON string of feature list
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type App = typeof apps.$inferSelect;
export type InsertApp = typeof apps.$inferInsert;

// ─── Subscription Plans (per app) ────────────────────────────────────────────
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  appId: int("appId").notNull().references(() => apps.id),
  name: varchar("name", { length: 64 }).notNull(), // e.g. "Daily", "Weekly", "Monthly", "Lifetime"
  durationDays: int("durationDays").notNull(), // 1, 7, 30, 9999
  priceCredits: decimal("priceCredits", { precision: 10, scale: 2 }).notNull(),
  pricePercentage: decimal("pricePercentage", { precision: 10, scale: 2 }).default("0.00").notNull(),
  level: mysqlEnum("level", ["basic", "premium", "lifetime"]).default("basic").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

// ─── Reseller <-> App assignments ────────────────────────────────────────────
export const resellerApps = mysqlTable("reseller_apps", {
  id: int("id").autoincrement().primaryKey(),
  resellerId: int("resellerId").notNull().references(() => resellers.id),
  appId: int("appId").notNull().references(() => apps.id),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type ResellerApp = typeof resellerApps.$inferSelect;
export type InsertResellerApp = typeof resellerApps.$inferInsert;

// ─── License Keys ─────────────────────────────────────────────────────────────
export const licenseKeys = mysqlTable("license_keys", {
  id: int("id").autoincrement().primaryKey(),
  keyValue: varchar("keyValue", { length: 128 }).notNull().unique(),
  resellerId: int("resellerId").notNull().references(() => resellers.id),
  appId: int("appId").notNull().references(() => apps.id),
  planId: int("planId").references(() => subscriptionPlans.id),
  planName: varchar("planName", { length: 64 }),
  durationDays: int("durationDays").notNull(),
  creditsSpent: decimal("creditsSpent", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["active", "used", "revoked", "expired"]).default("active").notNull(),
  usedBy: varchar("usedBy", { length: 128 }), // username who activated
  hwid: varchar("hwid", { length: 255 }),
  activatedAt: timestamp("activatedAt"),
  expiresAt: timestamp("expiresAt"),
  note: text("note"),
  customMask: varchar("customMask", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LicenseKey = typeof licenseKeys.$inferSelect;
export type InsertLicenseKey = typeof licenseKeys.$inferInsert;

// ─── Credit Transactions ──────────────────────────────────────────────────────
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  resellerId: int("resellerId").notNull().references(() => resellers.id),
  type: mysqlEnum("type", ["add", "deduct", "purchase"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balanceBefore", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
