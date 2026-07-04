import postgres from "postgres";

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  console.error("SUPABASE_DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

async function main() {
  console.log("=== Checking ip_whitelist table structure ===");
  const cols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'ip_whitelist'
    ORDER BY ordinal_position
  `;
  console.log("Columns:", JSON.stringify(cols, null, 2));

  console.log("\n=== Current ip_whitelist entries ===");
  const entries = await sql`SELECT * FROM ip_whitelist ORDER BY "createdAt" DESC`;
  console.log("Entries:", JSON.stringify(entries, null, 2));

  console.log("\n=== Checking enums ===");
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
