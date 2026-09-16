import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[seed] DATABASE_URL não encontrada. Crie um arquivo .env na raiz com DATABASE_URL=...");
  process.exit(1);
}

async function main() {
  const sqlFile = path.join(process.cwd(), "scripts", "seed_reseller_info_products.sql");
  const query = fs.readFileSync(sqlFile, "utf-8");

  const client = postgres(url, { ssl: url.includes("sslmode=require") || url.includes("ssl=true") ? "require" : undefined });
  try {
    await client.unsafe(query);
    console.log("[seed] Produtos inseridos com sucesso!");
  } catch (err) {
    console.error("[seed] Erro ao inserir produtos:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
