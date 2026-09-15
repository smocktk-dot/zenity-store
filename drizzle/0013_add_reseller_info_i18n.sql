-- Add i18n columns for reseller info products
ALTER TABLE "reseller_info_products"
  ADD COLUMN IF NOT EXISTS "descriptionEn" text,
  ADD COLUMN IF NOT EXISTS "pricingCreditsEn" text,
  ADD COLUMN IF NOT EXISTS "pricingPercentageEn" text;
