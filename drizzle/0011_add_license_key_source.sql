ALTER TABLE "public"."license_keys" ADD COLUMN IF NOT EXISTS "source" varchar(32) DEFAULT 'panel';
