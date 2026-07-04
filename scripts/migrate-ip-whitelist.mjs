/**
 * Script de migração para atualizar a tabela ip_whitelist com suporte a userType e userId.
 * Uso: DATABASE_URL=postgres://... node scripts/migrate-ip-whitelist.mjs
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
  // 1. Criar enum se não existir
  await sql`DO $$ BEGIN
    CREATE TYPE ip_user_type AS ENUM ('admin', 'reseller');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`;
  console.log('✓ Enum ip_user_type criado (ou já existia)');

  // 2. Remover constraint unique antiga no ip (agora ip pode repetir entre usuários)
  await sql`ALTER TABLE ip_whitelist DROP CONSTRAINT IF EXISTS ip_whitelist_ip_unique`;
  console.log('✓ Constraint unique antiga removida');

  // 3. Adicionar coluna userType
  await sql`ALTER TABLE ip_whitelist ADD COLUMN IF NOT EXISTS "userType" ip_user_type NOT NULL DEFAULT 'admin'`;
  console.log('✓ Coluna userType adicionada');

  // 4. Adicionar coluna userId
  await sql`ALTER TABLE ip_whitelist ADD COLUMN IF NOT EXISTS "userId" integer`;
  console.log('✓ Coluna userId adicionada');

  // 5. Adicionar constraint unique em (ip, userType, userId)
  await sql`ALTER TABLE ip_whitelist DROP CONSTRAINT IF EXISTS ip_whitelist_ip_user_unique`;
  await sql`ALTER TABLE ip_whitelist ADD CONSTRAINT ip_whitelist_ip_user_unique UNIQUE (ip, "userType", "userId")`;
  console.log('✓ Constraint unique em (ip, userType, userId) adicionada');

  console.log('\n✅ Migração concluída com sucesso!');
} catch (e) {
  console.error('Erro na migração:', e.message);
  process.exit(1);
} finally {
  await sql.end();
}
