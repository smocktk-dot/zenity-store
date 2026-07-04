/**
 * Script para criar o admin inicial no banco de dados próprio.
 * Uso: DATABASE_URL=postgres://... node scripts/seed-admin.mjs
 */
import bcrypt from "bcryptjs";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sslRequired = connectionString.includes("sslmode=require") || connectionString.includes("ssl=true");
const sql = postgres(connectionString, sslRequired ? { ssl: "require", max: 1 } : { max: 1 });

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  // Verifica se já existe
  const existing = await sql`SELECT id FROM admins WHERE username = ${username}`;
  if (existing.length > 0) {
    console.log(`Admin '${username}' já existe. Atualizando senha...`);
    await sql`UPDATE admins SET "passwordHash" = ${passwordHash}, "updatedAt" = NOW() WHERE username = ${username}`;
    console.log("✅ Senha atualizada com sucesso!");
  } else {
    await sql`INSERT INTO admins (username, "passwordHash") VALUES (${username}, ${passwordHash})`;
    console.log(`✅ Admin '${username}' criado com sucesso!`);
  }

  console.log(`Credenciais: ${username} / ${password}`);
  await sql.end();
}

seedAdmin().catch(console.error);
