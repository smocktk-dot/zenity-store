/**
 * Script para criar a tabela ip_whitelist no banco de dados próprio.
 * Uso: DATABASE_URL=postgres://... node scripts/create-ip-whitelist.mjs
 */
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sslRequired = connectionString.includes("sslmode=require") || connectionString.includes("ssl=true");
const sql = postgres(connectionString, sslRequired ? { ssl: "require", max: 1 } : { max: 1 });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS ip_whitelist (
      id SERIAL PRIMARY KEY,
      ip VARCHAR(64) NOT NULL,
      label VARCHAR(128),
      "userType" VARCHAR(32) NOT NULL DEFAULT 'admin',
      "userId" INTEGER,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  console.log("✅ Tabela ip_whitelist criada com sucesso!");
} catch (e) {
  console.error("Erro:", e.message);
} finally {
  await sql.end();
}
