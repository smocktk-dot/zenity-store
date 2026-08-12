import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const resellerTypeEnum = pgEnum("reseller_type", ["credits", "percentage"]);
export const resellerStatusEnum = pgEnum("reseller_status", ["active", "inactive", "banned"]);
export const appStatusEnum = pgEnum("app_status", ["active", "inactive"]);
export const planLevelEnum = pgEnum("plan_level", ["basic", "premium", "lifetime"]);
export const keyStatusEnum = pgEnum("key_status", ["active", "used", "revoked", "expired"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["add", "deduct", "purchase"]);
export const pixPaymentStatusEnum = pgEnum("pix_payment_status", ["pending", "paid", "expired", "refunded", "cancelled"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "closed", "archived"]);
export const ticketSenderEnum = pgEnum("ticket_sender", ["reseller", "admin"]);
export const applicationStatusEnum = pgEnum("application_status", ["pending", "pre_approved", "approved", "rejected", "archived"]);
export const applicationSenderEnum = pgEnum("application_sender", ["applicant", "admin"]);
export const supportTicketStatusEnum = pgEnum("support_ticket_status", ["open", "closed", "archived"]);
export const supportMessageSenderEnum = pgEnum("support_message_sender", ["user", "admin"]);

// ─── Core users table (Manus OAuth, kept for compatibility) ───────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Admin accounts (username/password auth) ─────────────────────────────────
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

// ─── Reseller accounts ────────────────────────────────────────────────────────
export const resellers = pgTable("resellers", {
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
  lastLoginAt: timestamp("lastLoginAt"),
});

export type Reseller = typeof resellers.$inferSelect;
export type InsertReseller = typeof resellers.$inferInsert;

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Apps / Products ──────────────────────────────────────────────────────────
export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 32 }).default("v1.0"),
  categoryId: integer("categoryId").references(() => categories.id),
  status: appStatusEnum("status").default("active").notNull(),
  maxUsers: integer("maxUsers").default(5000),
  features: text("features"), // JSON string of feature list
  keyauthSellerKey: varchar("keyauthSellerKey", { length: 64 }), // KeyAuth Seller API Key for this app
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type App = typeof apps.$inferSelect;
export type InsertApp = typeof apps.$inferInsert;

// ─── Subscription Plans (per app) ────────────────────────────────────────────
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  appId: integer("appId").notNull().references(() => apps.id),
  name: varchar("name", { length: 64 }).notNull(), // e.g. "Daily", "Weekly", "Monthly", "Lifetime"
  durationDays: integer("durationDays").notNull(), // 1, 7, 30, 9999
  priceCredits: decimal("priceCredits", { precision: 10, scale: 2 }).notNull(),
  pricePercentage: decimal("pricePercentage", { precision: 10, scale: 2 }).default("0.00").notNull(),
  level: planLevelEnum("level").default("basic").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

// ─── Reseller <-> App assignments ────────────────────────────────────────────
export const resellerApps = pgTable("reseller_apps", {
  id: serial("id").primaryKey(),
  resellerId: integer("resellerId").notNull().references(() => resellers.id),
  appId: integer("appId").notNull().references(() => apps.id),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type ResellerApp = typeof resellerApps.$inferSelect;
export type InsertResellerApp = typeof resellerApps.$inferInsert;

// ─── License Keys ─────────────────────────────────────────────────────────────
export const licenseKeys = pgTable("license_keys", {
  id: serial("id").primaryKey(),
  keyValue: varchar("keyValue", { length: 128 }).notNull().unique(),
  resellerId: integer("resellerId").notNull().references(() => resellers.id),
  appId: integer("appId").notNull().references(() => apps.id),
  planId: integer("planId").references(() => subscriptionPlans.id),
  planName: varchar("planName", { length: 64 }),
  durationDays: integer("durationDays").notNull(),
  creditsSpent: decimal("creditsSpent", { precision: 10, scale: 2 }).notNull(),
  status: keyStatusEnum("status").default("active").notNull(),
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
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  resellerId: integer("resellerId").notNull().references(() => resellers.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balanceBefore", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// ─── Pix Payments (Purin Cash) ───────────────────────────────────────────────
export const pixPayments = pgTable("pix_payments", {
  id: serial("id").primaryKey(),
  resellerId: integer("resellerId").notNull().references(() => resellers.id),
  paymentId: varchar("paymentId", { length: 128 }).notNull().unique(), // psc_...
  amountCents: integer("amountCents").notNull(),
  credits: decimal("credits", { precision: 10, scale: 2 }).notNull(), // credits to add (0 for key purchases)
  status: pixPaymentStatusEnum("status").notNull().default("pending"),
  brCode: text("brCode"),
  qrCodeImage: text("qrCodeImage"),
  expiresAt: timestamp("expiresAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // Key purchase fields (null for credit purchases)
  paymentType: varchar("paymentType", { length: 32 }).default("credits").notNull(), // 'credits' | 'key'
  paymentMethod: varchar("paymentMethod", { length: 16 }).default("pix"), // 'pix' | 'ltc'
  appId: integer("appId").references(() => apps.id),
  planId: integer("planId").references(() => subscriptionPlans.id),
  quantity: integer("quantity").default(1),
});

export type PixPayment = typeof pixPayments.$inferSelect;
export type InsertPixPayment = typeof pixPayments.$inferInsert;

// ─── IP Whitelist ─────────────────────────────────────────────────────────────
export const ipWhitelist = pgTable("ip_whitelist", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 64 }).notNull(),
  label: varchar("label", { length: 128 }),
  userType: varchar("userType", { length: 32 }).notNull().default("admin"),
  userId: integer("userId"),  // null = any admin; for reseller = reseller.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IpWhitelist = typeof ipWhitelist.$inferSelect;
export type InsertIpWhitelist = typeof ipWhitelist.$inferInsert;

// ─── Tickets ──────────────────────────────────────────────────────────────────
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  resellerId: integer("resellerId").notNull().references(() => resellers.id),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: ticketStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

export const ticketMessages = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticketId").notNull().references(() => tickets.id),
  senderType: ticketSenderEnum("senderType").notNull(),
  message: text("message").notNull(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = typeof ticketMessages.$inferInsert;

// ─── Reseller Applications ────────────────────────────────────────────────────
export const resellerApplications = pgTable("reseller_applications", {
  id: serial("id").primaryKey(),
  discordLink: text("discordLink").notNull(),
  discordId: text("discordId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  product: text("product").notNull(),
  reason: text("reason").notNull(),
  status: applicationStatusEnum("status").default("pending").notNull(),
  ip: varchar("ip", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ResellerApplication = typeof resellerApplications.$inferSelect;
export type InsertResellerApplication = typeof resellerApplications.$inferInsert;

export const applicationMessages = pgTable("application_messages", {
  id: serial("id").primaryKey(),
  applicationId: integer("applicationId").notNull().references(() => resellerApplications.id),
  senderType: applicationSenderEnum("senderType").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApplicationMessage = typeof applicationMessages.$inferSelect;
export type InsertApplicationMessage = typeof applicationMessages.$inferInsert;

// ─── Public Support Tickets (dúvidas) ─────────────────────────────────────────
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  question: text("question").notNull(),
  status: supportTicketStatusEnum("status").default("open").notNull(),
  ip: varchar("ip", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticketId").notNull().references(() => supportTickets.id),
  senderType: supportMessageSenderEnum("senderType").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;
