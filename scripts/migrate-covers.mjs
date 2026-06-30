// Migrate existing cover images from "products" bucket to "covers" bucket.
// Run: node scripts/migrate-covers.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const envPath = resolve(root, ".env.local");
const envVars = {};
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    envVars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env or .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("→ Fetching products with cover images...");
  const { data: products, error } = await supabase
    .from("products")
    .select("id, slug, title, cover_path, creator_id")
    .not("cover_path", "is", null);

  if (error) {
    console.error("✖ Failed to query products:", error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log("  No products with cover images found.");
    return;
  }

  console.log(`  Found ${products.length} products with covers.`);
  let copied = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of products) {
    const path = product.cover_path;
    if (!path) { skipped++; continue; }

    // Check if already exists in "covers" bucket
    const { data: existing } = await supabase.storage.from("covers").list(path.split("/")[0], {
      search: path.split("/").slice(1).join("/"),
    });

    if (existing && existing.length > 0) {
      console.log(`  ⏭  ${product.slug} — cover already in covers bucket`);
      skipped++;
      continue;
    }

    // Download from "products" bucket
    const { data: fileData, error: dlError } = await supabase.storage.from("products").download(path);
    if (dlError || !fileData) {
      console.error(`  ✖ ${product.slug} — failed to download from products bucket: ${dlError?.message}`);
      failed++;
      continue;
    }

    // Upload to "covers" bucket
    const { error: ulError } = await supabase.storage.from("covers").upload(path, fileData, {
      contentType: fileData.type || "image/jpeg",
      upsert: false,
    });

    if (ulError) {
      console.error(`  ✖ ${product.slug} — failed to upload to covers bucket: ${ulError.message}`);
      failed++;
      continue;
    }

    console.log(`  ✓ ${product.slug} — copied to covers bucket`);
    copied++;

    // Optionally delete from "products" bucket (commented out — safe to delete after verifying)
    // await supabase.storage.from("products").remove([path]);
  }

  console.log(`\n✔ Done. ${copied} copied, ${skipped} skipped, ${failed} failed.`);
  if (copied > 0) {
    console.log("\nTo clean up old files from the products bucket, uncomment the remove() line above");
    console.log("after verifying covers display correctly on the store.");
  }
}

main().catch((err) => {
  console.error("\n✖ Migration failed:", err.message);
  process.exit(1);
});
