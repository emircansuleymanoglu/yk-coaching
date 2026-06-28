// Bir .sql dosyasını doğrudan Postgres'e uygular.
// Kullanım: DATABASE_URL="postgresql://..." node scripts/run-migration.mjs <dosya.sql>
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
const file = process.argv[2];
if (!url || !file) {
  console.error("DATABASE_URL ve <dosya.sql> gerekli.");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`✓ Uygulandı: ${file}`);
} catch (e) {
  console.error("HATA:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
