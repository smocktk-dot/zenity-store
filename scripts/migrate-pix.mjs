import postgres from "postgres";

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  console.error("SUPABASE_DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

async function migrate() {
  try {
    // Create enum if not exists
    await sql`
      DO $$ BEGIN
        CREATE TYPE "public"."pix_payment_status" AS ENUM('pending', 'paid', 'expired', 'refunded', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log("✓ Enum pix_payment_status created (or already exists)");

    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS "pix_payments" (
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
      )
    `;
    console.log("✓ Table pix_payments created (or already exists)");

    // Add FK if not exists
    await sql`
      DO $$ BEGIN
        ALTER TABLE "pix_payments" ADD CONSTRAINT "pix_payments_resellerId_fkey"
          FOREIGN KEY ("resellerId") REFERENCES "resellers"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log("✓ Foreign key added (or already exists)");

    console.log("\n✅ Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
