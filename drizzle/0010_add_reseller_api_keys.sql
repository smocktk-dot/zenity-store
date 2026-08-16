CREATE TABLE IF NOT EXISTS "public"."reseller_api_keys" (
    "id" serial PRIMARY KEY,
    "resellerId" integer NOT NULL,
    "apiKey" varchar(128) NOT NULL UNIQUE,
    "name" varchar(64),
    "isActive" boolean DEFAULT true NOT NULL,
    "allowedIps" text,
    "lastUsedAt" timestamp,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public"."reseller_api_keys" ADD CONSTRAINT "reseller_api_keys_resellerId_resellers_id_fk" FOREIGN KEY ("resellerId") REFERENCES "public"."resellers"("id") ON DELETE no action ON UPDATE no action;
