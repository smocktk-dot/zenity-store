import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: '/home/ubuntu/cv_reseller_panel/.env' });

const postgres = (await import('postgres')).default;
const sql = postgres(process.env.SUPABASE_DATABASE_URL, { ssl: 'require', max: 1 });

try {
  // 1. Create the enum
  await sql`DO $$ BEGIN
    CREATE TYPE ip_user_type AS ENUM ('admin', 'reseller');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`;
  console.log('✓ Enum ip_user_type created');

  // 2. Drop the unique constraint on ip column (since now ip can repeat across users)
  await sql`ALTER TABLE ip_whitelist DROP CONSTRAINT IF EXISTS ip_whitelist_ip_unique`;
  console.log('✓ Dropped unique constraint on ip');

  // 3. Add userType column
  await sql`ALTER TABLE ip_whitelist ADD COLUMN IF NOT EXISTS "userType" ip_user_type NOT NULL DEFAULT 'admin'`;
  console.log('✓ Added userType column');

  // 4. Add userId column
  await sql`ALTER TABLE ip_whitelist ADD COLUMN IF NOT EXISTS "userId" integer`;
  console.log('✓ Added userId column');

  // 5. Add unique constraint on (ip, userType, userId)
  await sql`ALTER TABLE ip_whitelist DROP CONSTRAINT IF EXISTS ip_whitelist_ip_user_unique`;
  await sql`ALTER TABLE ip_whitelist ADD CONSTRAINT ip_whitelist_ip_user_unique UNIQUE (ip, "userType", "userId")`;
  console.log('✓ Added unique constraint on (ip, userType, userId)');

  console.log('\n✅ Migration completed successfully!');
} catch (e) {
  console.error('Migration error:', e.message);
  process.exit(1);
} finally {
  await sql.end();
}
