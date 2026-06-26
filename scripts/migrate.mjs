import pg from "pg";
import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const envPath = resolve(root, ".env");
if (!existsSync(envPath)) {
  console.error("❌ .env file not found. Copy .env.example to .env and configure DATABASE_URL.");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const eq = l.indexOf("=");
      if (eq === -1) return null;
      const key = l.slice(0, eq).trim();
      const value = l.slice(eq + 1).trim();
      if (!key) return null;
      return [key, value];
    })
    .filter(Boolean)
);

const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in .env. Add it like: DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres");
  process.exit(1);
}

// SSL configuration for Supabase
const poolConfig = { connectionString: DATABASE_URL };
if (DATABASE_URL.includes("supabase.co")) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new pg.Pool({
  ...poolConfig,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id serial primary key,
        name text not null unique,
        applied_at timestamptz not null default now()
      )
    `);

    const { rows: applied } = await client.query(
      "SELECT name FROM _migrations ORDER BY name"
    );
    const appliedSet = new Set(applied.map((r) => r.name));

    const migrationsDir = resolve(root, "supabase/migrations");
    if (!existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No SQL migration files found.");
      return;
    }

    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  ✓ ${file} (already applied)`);
        continue;
      }

      const sql = readFileSync(resolve(migrationsDir, file), "utf-8");
      console.log(`  → ${file} ...`);

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`  ✓ ${file} (applied)`);
        count++;
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`${file}: ${err.message}`);
      }
    }

    if (count === 0) {
      console.log("\n✔ All migrations already applied.");
    } else {
      console.log(`\n✔ Applied ${count} migration(s).`);
    }
  } finally {
    try {
      client.release();
    } catch {
      // client may already be released on error path
    }
    await pool.end();
  }
}

main().catch((err) => {
  console.error("\n✖ Migration failed:", err.message);
  process.exit(1);
});
