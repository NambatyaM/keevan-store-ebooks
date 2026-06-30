import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const envPath = resolve(root, ".env");
if (!existsSync(envPath)) {
  console.error("❌ .env file not found. Copy .env.example to .env and configure your variables.");
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = env.ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const adminPassword = env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log(`→ Creating admin user: ${adminEmail}`);

  const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { role: "admin" },
  });

  if (createError) {
    if (createError.message.includes("already been registered") || createError.message.includes("already exists")) {
      console.log("  ✓ Admin user already exists in auth");
      const { data: existingAuth } = await supabase.auth.admin.listUsers();
      const existing = existingAuth.users.find((u) => u.email === adminEmail);
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, {
          user_metadata: { ...existing.user_metadata, role: "admin" },
        });
        console.log("  ✓ Admin role updated in user_metadata");
      }
    } else {
      throw createError;
    }
  } else {
    console.log(`  ✓ Auth user created: ${authUser.user.id}`);
  }

  const { data: existingProfile } = await supabase
    .from("users")
    .select("id")
    .eq("email", adminEmail)
    .single();

  if (existingProfile) {
    const { error: updateError } = await supabase
      .from("users")
      .update({ role: "admin", full_name: "Admin" })
      .eq("id", existingProfile.id);

    if (updateError) throw updateError;
    console.log("  ✓ Admin role confirmed in users table");
  } else {
    const adminUserId = authUser?.user?.id;
    if (!adminUserId) {
      const { data: userByEmail } = await supabase.auth.admin.listUsers();
      const found = userByEmail.users.find((u) => u.email === adminEmail);
      if (!found) throw new Error("Could not resolve admin user ID");
      const { error: insertError } = await supabase.from("users").insert({
        id: found.id,
        email: adminEmail,
        full_name: "Admin",
        role: "admin",
      });
      if (insertError) throw insertError;
      console.log(`  ✓ Profile created in users table: ${found.id}`);
    } else {
      const { error: insertError } = await supabase.from("users").insert({
        id: adminUserId,
        email: adminEmail,
        full_name: "Admin",
        role: "admin",
      });
      if (insertError) throw insertError;
      console.log(`  ✓ Profile created in users table: ${adminUserId}`);
    }
  }

  console.log("\n✔ Admin user ready. Sign in at /auth/login with:");
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
}

main().catch((err) => {
  console.error("\n✖ Failed to seed admin user:", err.message);
  process.exit(1);
});
