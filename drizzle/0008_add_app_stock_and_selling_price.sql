DO $$ BEGIN
    CREATE TYPE "public"."stock_status" AS ENUM('available', 'sold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "public"."subscription_plans" ADD COLUMN "resellerSellingPrice" decimal(10, 2) DEFAULT '0.00' NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."app_stock" (
    "id" serial PRIMARY KEY,
    "appId" integer NOT NULL,
    "planId" integer NOT NULL,
    "keyValue" varchar(128) NOT NULL UNIQUE,
    "status" "public"."stock_status" DEFAULT 'available' NOT NULL,
    "resellerId" integer,
    "soldAt" timestamp,
    "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public"."app_stock" ADD CONSTRAINT "app_stock_appId_apps_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "public"."app_stock" ADD CONSTRAINT "app_stock_planId_subscription_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;
