DO $$ BEGIN
    CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'closed', 'archived');
    CREATE TYPE "public"."support_message_sender" AS ENUM('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "public"."reseller_applications" ADD COLUMN "product" text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" serial PRIMARY KEY,
    "name" varchar(128) NOT NULL,
    "email" varchar(320) NOT NULL,
    "question" text NOT NULL,
    "status" "public"."support_ticket_status" DEFAULT 'open' NOT NULL,
    "ip" varchar(64),
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."support_messages" (
    "id" serial PRIMARY KEY,
    "ticketId" integer NOT NULL,
    "senderType" "public"."support_message_sender" NOT NULL,
    "message" text NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public"."support_messages" ADD CONSTRAINT "support_messages_ticketId_support_tickets_id_fk" FOREIGN KEY ("ticketId") REFERENCES "public"."support_tickets"("id") ON DELETE no action ON UPDATE no action;
