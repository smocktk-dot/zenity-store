ALTER TABLE "pix_payments" ADD COLUMN "paymentType" varchar(32) DEFAULT 'credits' NOT NULL;--> statement-breakpoint
ALTER TABLE "pix_payments" ADD COLUMN "appId" integer;--> statement-breakpoint
ALTER TABLE "pix_payments" ADD COLUMN "planId" integer;--> statement-breakpoint
ALTER TABLE "pix_payments" ADD COLUMN "quantity" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "pix_payments" ADD CONSTRAINT "pix_payments_appId_apps_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pix_payments" ADD CONSTRAINT "pix_payments_planId_subscription_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;