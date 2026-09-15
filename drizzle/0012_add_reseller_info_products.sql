DO $$ BEGIN
    CREATE TYPE "public"."reseller_info_status" AS ENUM('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."reseller_info_products" (
    "id" serial PRIMARY KEY,
    "title" varchar(128) NOT NULL,
    "slug" varchar(128) NOT NULL UNIQUE,
    "tagline" varchar(255),
    "description" text,
    "pricingCredits" text,
    "pricingPercentage" text,
    "imageUrl" text,
    "galleryImages" text,
    "discordUrl" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "status" "public"."reseller_info_status" DEFAULT 'active' NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);
