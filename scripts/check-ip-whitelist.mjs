/**
 * Script para verificar a estrutura e conteúdo da tabela ip_whitelist.
 * Uso: DATABASE_URL=postgres://... node scripts/check-ip-whitelist.mjs
 */
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sslRequired = connectionString.includes("sslmode=require") || connectionString.includes("ssl=true");
const sql = postgres(connectionString, sslRequired ? { ssl: "require", max: 1 } : { max: 1 });

async function main() {
  console.log("=== Verificando estrutura da tabela ip_whitelist ===");
  const cols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'ip_whitelist'
    ORDER BY ordinal_position
  `;
  console.log("Colunas:", JSON.stringify(cols, null, 2));

  console.log("\n=== Entradas atuais na ip_whitelist ===");
  const entries = await sql`SELECT * FROM ip_whitelist ORDER BY "createdAt" DESC`;
  console.log("Entradas:", JSON.stringify(entries, null, 2));

  console.log("\n=== Verificando enums ===");
  const enums = await sql`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname LIKE '%ip%' OR t.typname LIKE '%user_type%'
    ORDER BY t.typname, e.enumsortorder
  `;
  console.log("Enums:", JSON.stringify(enums, null, 2));

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
