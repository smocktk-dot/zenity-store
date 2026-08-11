DO $$ BEGIN
    CREATE TYPE "public"."application_status" AS ENUM('pending', 'pre_approved', 'approved', 'rejected', 'archived');
    CREATE TYPE "public"."application_sender" AS ENUM('applicant', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."reseller_applications" (
    "id" serial PRIMARY KEY,
    "discordLink" text NOT NULL,
    "discordId" text NOT NULL,
    "email" varchar(320) NOT NULL,
    "reason" text NOT NULL,
    "status" "public"."application_status" DEFAULT 'pending' NOT NULL,
    "ip" varchar(64),
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."application_messages" (
    "id" serial PRIMARY KEY,
    "applicationId" integer NOT NULL,
    "senderType" "public"."application_sender" NOT NULL,
    "message" text NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public"."application_messages" ADD CONSTRAINT "application_messages_applicationId_reseller_applications_id_fk" FOREIGN KEY ("applicationId") REFERENCES "public"."reseller_applications"("id") ON DELETE no action ON UPDATE no action;
