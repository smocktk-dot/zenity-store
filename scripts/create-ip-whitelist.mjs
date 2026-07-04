import postgres from "postgres";

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) { console.error("No connection string"); process.exit(1); }

const sql = postgres(connectionString, { ssl: "require" });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS ip_whitelist (
      id SERIAL PRIMARY KEY,
      ip VARCHAR(64) NOT NULL UNIQUE,
      label VARCHAR(128),
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  console.log("Table ip_whitelist created successfully!");
} catch (e) {
  console.error("Error:", e.message);
} finally {
  await sql.end();
}
