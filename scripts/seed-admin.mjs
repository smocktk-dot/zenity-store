import bcrypt from "bcryptjs";
import postgres from "postgres";

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  console.error("SUPABASE_DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

async function seedAdmin() {
  const username = "admin";
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  // Check if admin already exists
  const existing = await sql`SELECT id FROM admins WHERE username = ${username}`;
  if (existing.length > 0) {
    console.log("Admin already exists, updating password...");
    await sql`UPDATE admins SET "passwordHash" = ${passwordHash} WHERE username = ${username}`;
  } else {
    await sql`INSERT INTO admins (username, "passwordHash") VALUES (${username}, ${passwordHash})`;
    console.log("Admin created successfully!");
  }

  console.log(`Admin credentials: ${username} / ${password}`);
  await sql.end();
}

seedAdmin().catch(console.error);
