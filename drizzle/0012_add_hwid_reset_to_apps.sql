BEGIN;

ALTER TABLE "public"."apps" ADD COLUMN IF NOT EXISTS "hwidResetUrl" text;
ALTER TABLE "public"."apps" ADD COLUMN IF NOT EXISTS "hwidResetApiKey" varchar(128);
ALTER TABLE "public"."apps" ADD COLUMN IF NOT EXISTS "hwidResetProductName" varchar(128);

COMMIT;
