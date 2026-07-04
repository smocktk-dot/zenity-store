CREATE TYPE "public"."app_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."key_status" AS ENUM('active', 'used', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."plan_level" AS ENUM('basic', 'premium', 'lifetime');--> statement-breakpoint
CREATE TYPE "public"."reseller_status" AS ENUM('active', 'inactive', 'banned');--> statement-breakpoint
CREATE TYPE "public"."reseller_type" AS ENUM('credits', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('add', 'deduct', 'purchase');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"version" varchar(32) DEFAULT 'v1.0',
	"categoryId" integer,
	"status" "app_status" DEFAULT 'active' NOT NULL,
	"maxUsers" integer DEFAULT 5000,
	"features" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"resellerId" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"balanceBefore" numeric(12, 2) NOT NULL,
	"balanceAfter" numeric(12, 2) NOT NULL,
	"description" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyValue" varchar(128) NOT NULL,
	"resellerId" integer NOT NULL,
	"appId" integer NOT NULL,
	"planId" integer,
	"planName" varchar(64),
	"durationDays" integer NOT NULL,
	"creditsSpent" numeric(10, 2) NOT NULL,
	"status" "key_status" DEFAULT 'active' NOT NULL,
	"usedBy" varchar(128),
	"hwid" varchar(255),
	"activatedAt" timestamp,
	"expiresAt" timestamp,
	"note" text,
	"customMask" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "license_keys_keyValue_unique" UNIQUE("keyValue")
);
--> statement-breakpoint
CREATE TABLE "reseller_apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"resellerId" integer NOT NULL,
	"appId" integer NOT NULL,
	"assignedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resellers" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"email" varchar(320),
	"credits" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"totalPurchases" integer DEFAULT 0 NOT NULL,
	"discountPercent" numeric(5, 2) DEFAULT '35.00' NOT NULL,
	"resellerType" "reseller_type" DEFAULT 'credits' NOT NULL,
	"status" "reseller_status" DEFAULT 'active' NOT NULL,
	"location" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastLoginAt" timestamp,
	CONSTRAINT "resellers_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"appId" integer NOT NULL,
	"name" varchar(64) NOT NULL,
	"durationDays" integer NOT NULL,
	"priceCredits" numeric(10, 2) NOT NULL,
	"pricePercentage" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"level" "plan_level" DEFAULT 'basic' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_resellerId_resellers_id_fk" FOREIGN KEY ("resellerId") REFERENCES "public"."resellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_resellerId_resellers_id_fk" FOREIGN KEY ("resellerId") REFERENCES "public"."resellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_appId_apps_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_planId_subscription_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_apps" ADD CONSTRAINT "reseller_apps_resellerId_resellers_id_fk" FOREIGN KEY ("resellerId") REFERENCES "public"."resellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_apps" ADD CONSTRAINT "reseller_apps_appId_apps_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_appId_apps_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE no action ON UPDATE no action;