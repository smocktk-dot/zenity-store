ALTER TABLE "ip_whitelist" ALTER COLUMN "userType" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "ip_whitelist" ALTER COLUMN "userType" SET DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "keyauthSellerKey" varchar(64);--> statement-breakpoint
DROP TYPE "public"."ip_user_type";