DO $$ BEGIN
    CREATE TYPE "public"."ticket_status" AS ENUM('open', 'closed', 'archived');
    CREATE TYPE "public"."ticket_sender" AS ENUM('reseller', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" serial PRIMARY KEY,
    "resellerId" integer NOT NULL,
    "subject" varchar(255) NOT NULL,
    "status" "public"."ticket_status" DEFAULT 'open' NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_resellerId_resellers_id_fk" FOREIGN KEY ("resellerId") REFERENCES "public"."resellers"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."ticket_messages" (
    "id" serial PRIMARY KEY,
    "ticketId" integer NOT NULL,
    "senderType" "public"."ticket_sender" NOT NULL,
    "message" text NOT NULL,
    "imageUrl" text,
    "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public"."ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_tickets_id_fk" FOREIGN KEY ("ticketId") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;
