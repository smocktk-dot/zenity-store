CREATE TYPE "public"."ip_user_type" AS ENUM('admin', 'reseller');--> statement-breakpoint
CREATE TYPE "public"."pix_payment_status" AS ENUM('pending', 'paid', 'expired', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TABLE "ip_whitelist" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" varchar(64) NOT NULL,
	"label" varchar(128),
	"userType" "ip_user_type" DEFAULT 'admin' NOT NULL,
	"userId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pix_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"resellerId" integer NOT NULL,
	"paymentId" varchar(128) NOT NULL,
	"amountCents" integer NOT NULL,
	"credits" numeric(10, 2) NOT NULL,
	"status" "pix_payment_status" DEFAULT 'pending' NOT NULL,
	"brCode" text,
	"qrCodeImage" text,
	"expiresAt" timestamp,
	"paidAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pix_payments_paymentId_unique" UNIQUE("paymentId")
);
--> statement-breakpoint
ALTER TABLE "pix_payments" ADD CONSTRAINT "pix_payments_resellerId_resellers_id_fk" FOREIGN KEY ("resellerId") REFERENCES "public"."resellers"("id") ON DELETE no action ON UPDATE no action;