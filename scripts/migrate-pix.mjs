/**
 * Script de migração para criar a tabela pix_payments no banco de dados próprio.
 * Uso: DATABASE_URL=postgres://... node scripts/migrate-pix.mjs
 */
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sslRequired = connectionString.includes("sslmode=require") || connectionString.includes("ssl=true");
const sql = postgres(connectionString, sslRequired ? { ssl: "require", max: 1 } : { max: 1 });

async function migrate() {
  try {
    // Criar enum se não existir
    await sql`
      DO $$ BEGIN
        CREATE TYPE "public"."pix_payment_status" AS ENUM('pending', 'paid', 'expired', 'refunded', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log("✓ Enum pix_payment_status criado (ou já existia)");

    // Criar tabela se não existir
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
    console.log("✓ Tabela pix_payments criada (ou já existia)");

    // Adicionar FK se não existir
    await sql`
      DO $$ BEGIN
        ALTER TABLE "pix_payments" ADD CONSTRAINT "pix_payments_resellerId_fkey"
          FOREIGN KEY ("resellerId") REFERENCES "resellers"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log("✓ Foreign key adicionada (ou já existia)");

    console.log("\n✅ Migração concluída com sucesso!");
  } catch (err) {
    console.error("Migração falhou:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
