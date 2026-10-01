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
export const resellerTypeEnum = pgEnum("reseller_type", ["credits", "percentage", "other", "unlimited"]);
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
export const appDownloadTypeEnum = pgEnum("app_download_type", ["download", "tutorial"]);

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
  role: varchar("role", { length: 16 }).default("full").notNull(), // full | support
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
  parentResellerId: integer("parentResellerId"),
  canCreateSubResellers: boolean("canCreateSubResellers").default(false).notNull(),
  status: resellerStatusEnum("status").default("active").notNull(),
  location: varchar("location", { length: 255 }),
  // Reseller "unlimited": assinatura mensal — expira aqui, login bloqueado até renovar
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

export type Reseller = typeof resellers.$inferSelect;
export type InsertReseller = typeof resellers.$inferInsert;

export const resellerApiKeys = pgTable("reseller_api_keys", {
  id: serial("id").primaryKey(),
  resellerId: integer("resellerId").notNull().references(() => resellers.id),
  apiKey: varchar("apiKey", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 64 }),
  isActive: boolean("isActive").default(true).notNull(),
  allowedIps: text("allowedIps"),
  allowUnpaidTake: boolean("allowUnpaidTake").default(false).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ResellerApiKey = typeof resellerApiKeys.$inferSelect;
export type InsertResellerApiKey = typeof resellerApiKeys.$inferInsert;

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
  keyMask: varchar("keyMask", { length: 64 }), // Máscara das keys geradas via KeyAuth (ex.: KEY-******-******)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type App = typeof apps.$inferSelect;
export type InsertApp = typeof apps.$inferInsert;

// ─── Subscription Plans (per app) ────────────────────────────────────────────
export const stockStatusEnum = pgEnum("stock_status", ["available", "sold"]);

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  appId: integer("appId").notNull().references(() => apps.id),
  name: varchar("name", { length: 64 }).notNull(), // e.g. "Daily", "Weekly", "Monthly", "Lifetime"
  durationDays: integer("durationDays").notNull(), // 1, 7, 30, 9999
  priceCredits: decimal("priceCredits", { precision: 10, scale: 2 }).notNull(),
  pricePercentage: decimal("pricePercentage", { precision: 10, scale: 2 }).default("0.00").notNull(),
  resellerSellingPrice: decimal("resellerSellingPrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
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
  resellerCredits: decimal("resellerCredits", { precision: 12, scale: 2 }),
  status: keyStatusEnum("status").default("active").notNull(),
  usedBy: varchar("usedBy", { length: 128 }), // username who activated
  hwid: varchar("hwid", { length: 255 }),
  activatedAt: timestamp("activatedAt"),
  expiresAt: timestamp("expiresAt"),
  note: text("note"),
  customMask: varchar("customMask", { length: 128 }),
  source: varchar("source", { length: 32 }).default("panel").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LicenseKey = typeof licenseKeys.$inferSelect;
export type InsertLicenseKey = typeof licenseKeys.$inferInsert;

// ─── App Stock (pre-added license keys) ───────────────────────────────────────
export const appStock = pgTable("app_stock", {
  id: serial("id").primaryKey(),
  appId: integer("appId").notNull().references(() => apps.id),
  planId: integer("planId").notNull().references(() => subscriptionPlans.id),
  keyValue: varchar("keyValue", { length: 128 }).notNull().unique(),
  status: stockStatusEnum("status").default("available").notNull(),
  resellerId: integer("resellerId").references(() => resellers.id),
  soldAt: timestamp("soldAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AppStock = typeof appStock.$inferSelect;
export type InsertAppStock = typeof appStock.$inferInsert;

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

// ─── Other Store (IP-whitelisted split resellers) ─────────────────────────────
export const otherStoreResellers = pgTable("other_store_resellers", {
  id: serial("id").primaryKey(),
  resellerId: integer("resellerId").notNull().references(() => resellers.id),
  label: varchar("label", { length: 128 }),
  purinApiKey: varchar("purinApiKey", { length: 128 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  discordId: varchar("discordId", { length: 64 }),
  splitPercent: decimal("splitPercent", { precision: 5, scale: 2 }).default("45.00").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OtherStoreReseller = typeof otherStoreResellers.$inferSelect;
export type InsertOtherStoreReseller = typeof otherStoreResellers.$inferInsert;

export const otherStoreHwids = pgTable("other_store_hwids", {
  id: serial("id").primaryKey(),
  otherStoreResellerId: integer("otherStoreResellerId").notNull().references(() => otherStoreResellers.id, { onDelete: "cascade" }),
  hwid: varchar("hwid", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OtherStoreHwid = typeof otherStoreHwids.$inferSelect;
export type InsertOtherStoreHwid = typeof otherStoreHwids.$inferInsert;

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
  accessToken: varchar("accessToken", { length: 64 }),
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
  accessToken: varchar("accessToken", { length: 64 }),
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

// ─── Protect Website: log de tentativas de ataque + IPs banidos ────────────────
export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  eventType: varchar("eventType", { length: 32 }).notNull(), // xss | sqli | idor | bruteforce | path_traversal
  ip: varchar("ip", { length: 64 }),
  identifier: varchar("identifier", { length: 255 }), // usuário/e-mail tentado
  detail: text("detail"), // o que ele tentou fazer
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = typeof securityEvents.$inferInsert;

export const bannedIps = pgTable("banned_ips", {
  id: serial("id").primaryKey(),
  ip: varchar("ip", { length: 64 }).notNull(),
  reason: text("reason"),
  bannedBy: varchar("bannedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BannedIp = typeof bannedIps.$inferSelect;
export type InsertBannedIp = typeof bannedIps.$inferInsert;

// ─── App Downloads (download links + tutorials per app) ────────────────────────
export const appDownloads = pgTable("app_downloads", {
  id: serial("id").primaryKey(),
  appId: integer("appId").notNull().references(() => apps.id),
  type: appDownloadTypeEnum("type").notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  url: text("url").notNull(),
  videoUrl: text("videoUrl"),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AppDownload = typeof appDownloads.$inferSelect;
export type InsertAppDownload = typeof appDownloads.$inferInsert;

// ─── Reseller Info Products (página pública /resellerinfo) ─────────────────────
export const resellerInfoStatusEnum = pgEnum("reseller_info_status", ["active", "inactive"]);

export const resellerInfoProducts = pgTable("reseller_info_products", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  tagline: varchar("tagline", { length: 255 }),
  description: text("description"), // PT
  descriptionEn: text("descriptionEn"), // EN
  pricingCredits: text("pricingCredits"), // PT
  pricingCreditsEn: text("pricingCreditsEn"), // EN
  pricingPercentage: text("pricingPercentage"), // PT
  pricingPercentageEn: text("pricingPercentageEn"), // EN
  imageUrl: text("imageUrl"), // imagem principal (capa)
  galleryImages: text("galleryImages"), // JSON array de URLs de imagens para preview
  discordUrl: text("discordUrl"), // override do link Discord por produto (opcional)
  sortOrder: integer("sortOrder").default(0).notNull(),
  status: resellerInfoStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ResellerInfoProduct = typeof resellerInfoProducts.$inferSelect;
export type InsertResellerInfoProduct = typeof resellerInfoProducts.$inferInsert;

// ─── VG Auth (sistema de autenticação estilo KeyAuth) ──────────────────────────
export const vgauthApps = pgTable("vgauth_apps", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  type: varchar("type", { length: 16 }).default("auth").notNull(), // auth | loader
  ownerId: varchar("ownerId", { length: 64 }).notNull().unique(),
  secret: varchar("secret", { length: 128 }).notNull().unique(),
  version: varchar("version", { length: 32 }).default("1.0").notNull(),
  status: varchar("status", { length: 16 }).default("active").notNull(), // active | disabled
  // Auto-update / distribuição (build atual servida em /api/vgauth/dl/:ownerid/*)
  dlUrl: varchar("dlUrl", { length: 512 }),
  dlVersion: varchar("dlVersion", { length: 64 }),
  dlFileName: varchar("dlFileName", { length: 128 }),
  dlSize: integer("dlSize"),
  dlUpdatedAt: timestamp("dlUpdatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type VgauthApp = typeof vgauthApps.$inferSelect;
export type InsertVgauthApp = typeof vgauthApps.$inferInsert;

export const vgauthLicenses = pgTable("vgauth_licenses", {
  id: serial("id").primaryKey(),
  appId: integer("appId").notNull().references(() => vgauthApps.id),
  keyValue: varchar("keyValue", { length: 128 }).notNull().unique(),
  note: varchar("note", { length: 255 }),
  subLevel: varchar("subLevel", { length: 64 }).default("default").notNull(),
  durationValue: integer("durationValue").notNull(),
  durationUnit: varchar("durationUnit", { length: 16 }).default("days").notNull(), // days|weeks|months|years|lifetime
  status: varchar("status", { length: 16 }).default("active").notNull(), // active | banned | revoked
  usedBy: varchar("usedBy", { length: 128 }),
  hwidMb: varchar("hwidMb", { length: 255 }),
  hwidCpu: varchar("hwidCpu", { length: 255 }),
  ip: varchar("ip", { length: 64 }),
  hwidViolations: integer("hwidViolations").default(0).notNull(),
  activatedAt: timestamp("activatedAt"),
  expiresAt: timestamp("expiresAt"),
  paused: boolean("paused").default(false).notNull(),
  pausedRemainingSec: integer("pausedRemainingSec"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VgauthLicense = typeof vgauthLicenses.$inferSelect;
export type InsertVgauthLicense = typeof vgauthLicenses.$inferInsert;

export const vgauthUsers = pgTable("vgauth_users", {
  id: serial("id").primaryKey(),
  appId: integer("appId").notNull().references(() => vgauthApps.id),
  username: varchar("username", { length: 128 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  passwordPlain: varchar("passwordPlain", { length: 255 }), // loader: senha visivel ao admin
  email: varchar("email", { length: 320 }),
  licenseId: integer("licenseId").references(() => vgauthLicenses.id),
  subLevel: varchar("subLevel", { length: 64 }).default("default").notNull(),
  hwidMb: varchar("hwidMb", { length: 255 }),
  hwidCpu: varchar("hwidCpu", { length: 255 }),
  ip: varchar("ip", { length: 64 }),
  status: varchar("status", { length: 16 }).default("active").notNull(), // active | banned
  expiresAt: timestamp("expiresAt"),
  lastLogin: timestamp("lastLogin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VgauthUser = typeof vgauthUsers.$inferSelect;
export type InsertVgauthUser = typeof vgauthUsers.$inferInsert;

export const vgauthBans = pgTable("vgauth_bans", {
  id: serial("id").primaryKey(),
  appId: integer("appId").references(() => vgauthApps.id), // app de origem (o ban é global)
  username: varchar("username", { length: 128 }),
  ip: varchar("ip", { length: 64 }),
  hwidMb: varchar("hwidMb", { length: 255 }),
  hwidCpu: varchar("hwidCpu", { length: 255 }),
  reason: varchar("reason", { length: 255 }),
  createdBy: varchar("createdBy", { length: 64 }).default("admin").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VgauthBan = typeof vgauthBans.$inferSelect;
export type InsertVgauthBan = typeof vgauthBans.$inferInsert;

export const vgauthSessions = pgTable("vgauth_sessions", {
  id: serial("id").primaryKey(),
  appId: integer("appId").notNull().references(() => vgauthApps.id),
  token: varchar("token", { length: 128 }).notNull().unique(),
  encKey: varchar("encKey", { length: 128 }),
  userId: integer("userId"),
  username: varchar("username", { length: 128 }),
  hwidMb: varchar("hwidMb", { length: 255 }),
  hwidCpu: varchar("hwidCpu", { length: 255 }),
  ip: varchar("ip", { length: 64 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VgauthSession = typeof vgauthSessions.$inferSelect;
export type InsertVgauthSession = typeof vgauthSessions.$inferInsert;

export const vgauthLogs = pgTable("vgauth_logs", {
  id: serial("id").primaryKey(),
  appId: integer("appId").references(() => vgauthApps.id),
  action: varchar("action", { length: 64 }).notNull(),
  detail: text("detail"),
  ip: varchar("ip", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VgauthLog = typeof vgauthLogs.$inferSelect;
export type InsertVgauthLog = typeof vgauthLogs.$inferInsert;

// Flags de shutdown remoto — o cliente .hpp executa "shutdown /s" quando a
// resposta do servidor traz shutdown:true (flag ativa batendo em qualquer
// identificador da sessão: username, hwid, ip)
export const vgauthShutdowns = pgTable("vgauth_shutdowns", {
  id: serial("id").primaryKey(),
  appId: integer("appId").notNull().references(() => vgauthApps.id),
  username: varchar("username", { length: 128 }),
  ip: varchar("ip", { length: 64 }),
  hwidMb: varchar("hwidMb", { length: 255 }),
  hwidCpu: varchar("hwidCpu", { length: 255 }),
  reason: varchar("reason", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VgauthShutdown = typeof vgauthShutdowns.$inferSelect;
export type InsertVgauthShutdown = typeof vgauthShutdowns.$inferInsert;

// Blob storage próprio — fallback do storagePut quando o Forge (BUILT_IN_FORGE_*)
// não está configurado. Serve builds do auto-update e screenshots do Protect
// via GET /api/vgauth/f/<fileKey> — sem dependência externa.
export const vgauthFiles = pgTable("vgauth_files", {
  id: serial("id").primaryKey(),
  fileKey: varchar("fileKey", { length: 255 }).notNull().unique(),
  data: text("data").notNull(), // base64
  mime: varchar("mime", { length: 96 }).default("application/octet-stream").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VgauthFile = typeof vgauthFiles.$inferSelect;
export type InsertVgauthFile = typeof vgauthFiles.$inferInsert;
