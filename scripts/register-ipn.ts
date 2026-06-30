import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) {
    console.error("❌ .env file not found at:", envPath);
    console.error("   Copy .env.example to .env and add your Pesapal keys.");
    process.exit(1);
  }

  return Object.fromEntries(
    readFileSync(envPath, "utf-8")
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => {
        const eq = l.indexOf("=");
        if (eq === -1) return null;
        return [l.slice(0, eq).trim(), l.slice(eq + 1).trim()];
      })
      .filter(Boolean) as string[][]
  );
}

async function main() {
  console.log("─".repeat(50));
  console.log("  Pesapal IPN Registration Script");
  console.log("─".repeat(50));

  const env = loadEnv();
  const baseUrl = (env.PESAPAL_BASE_URL || "https://pay.pesapal.com/v3").replace(/\/+$/, "");
  const consumerKey = env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = env.PESAPAL_CONSUMER_SECRET;
  const webhookUrl = env.PESAPAL_IPN_URL || "https://keevanstore.in/api/pesapal/ipn";

  if (!consumerKey) {
    console.error("\n❌ PESAPAL_CONSUMER_KEY is not set in .env");
    process.exit(1);
  }
  if (!consumerSecret) {
    console.error("\n❌ PESAPAL_CONSUMER_SECRET is not set in .env");
    process.exit(1);
  }

  console.log("\n  Using:");
  console.log(`     Base URL:      ${baseUrl}`);
  console.log(`     Consumer Key:  ${consumerKey.slice(0, 12)}...`);
  console.log(`     IPN URL:       ${webhookUrl}`);
  console.log("");

  // ── Step 1: Get OAuth token ──────────────────────────────
  console.log("  Step 1/2 — Requesting OAuth token from Pesapal...");
  console.log(`     POST ${baseUrl}/api/Auth/RequestToken`);

  let token: string;
  try {
    const tokenRes = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
    });

    const tokenBody: Record<string, unknown> = await tokenRes.json();
    console.log(`     Status:  ${tokenRes.status}`);

    if (!tokenRes.ok) {
      console.error(`\n❌ Token request failed (HTTP ${tokenRes.status})`);
      console.error("   Response:", JSON.stringify(tokenBody, null, 2));
      process.exit(1);
    }

    console.log("     Response:", JSON.stringify(tokenBody, null, 4));

    token = tokenBody.token as string;
    if (!token) {
      console.error("\n❌ Token request succeeded but no 'token' field in response.");
      console.error("   Full response:", JSON.stringify(tokenBody, null, 2));
      process.exit(1);
    }

    console.log("  ✓ Token obtained successfully.");
  } catch (err) {
    console.error("\n❌ Network error during token request:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // ── Step 2: Register IPN URL ─────────────────────────────
  console.log("\n  Step 2/2 — Registering IPN URL with Pesapal...");
  console.log(`     POST ${baseUrl}/api/URLSetup/RegisterIPN`);
  console.log(`     Body: { url: "${webhookUrl}", ipn_notification_type: "GET" }`);

  try {
    const ipnRes = await fetch(`${baseUrl}/api/URLSetup/RegisterIPN`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: webhookUrl,
        ipn_notification_type: "GET",
      }),
    });

    const ipnBody: Record<string, unknown> = await ipnRes.json();
    console.log(`     Status:  ${ipnRes.status}`);
    console.log("     Response:", JSON.stringify(ipnBody, null, 4));

    if (!ipnRes.ok) {
      console.error(`\n❌ IPN registration failed (HTTP ${ipnRes.status})`);
      console.error("   Response:", JSON.stringify(ipnBody, null, 2));
      const message = (ipnBody.error && typeof ipnBody.error === 'object' && 'message' in ipnBody.error ? (ipnBody.error as any).message : undefined) ?? ipnBody.message ?? ipnBody.error ?? "Unknown error";
      console.error("   Reason:", message);
      process.exit(1);
    }

    const ipnId = (ipnBody.ipn_id || ipnBody.id || ipnBody.ipnId || "") as string;
    if (!ipnId) {
      console.warn("\n⚠ IPN registration succeeded but no IPN ID found in response.");
      console.warn("  Look at the response above for the ID field and use that value.");
      console.warn("  Known Pesapal field names: ipn_id, id, ipnId");
      process.exit(0);
    }

    // ── Step 3: Success output ──────────────────────────────
    console.log("\n" + "=".repeat(50));
    console.log("  ✔ IPN URL registered successfully!");
    console.log("=".repeat(50));
    console.log("");
    console.log(`  Your IPN ID:    ${ipnId}`);
    console.log(`  IPN URL:        ${webhookUrl}`);
    console.log("");

    // ── Step 4: Tell what to copy ───────────────────────────
    console.log("─".repeat(50));
    console.log("  NEXT STEP — Add to your .env and Vercel:");
    console.log("─".repeat(50));
    console.log("");
    console.log(`  Copy this into your .env:`);
    console.log(`  ┌────────────────────────────────────────────────────────────┐`);
    const line = `  │  PESAPAL_IPN_ID=${ipnId}`;
    console.log(line + " ".repeat(Math.max(1, 58 - line.length)) + "│");
    console.log(`  └────────────────────────────────────────────────────────────┘`);
    console.log("");
    console.log(`  Also add it to Vercel:`);
    console.log(`    1. Go to https://vercel.com/kevin-megans-projects/keevan-store/settings/environment-variables`);
    console.log(`    2. Add new variable:`);
    console.log(`       Name:   PESAPAL_IPN_ID`);
    console.log(`       Value:  ${ipnId}`);
    console.log(`       Env:    Production`);
    console.log(`    3. Click Save`);
    console.log(`    4. Redeploy your project`);
    console.log("");
    console.log("  Then register this IPN ID in your Pesapal dashboard");
    console.log("  so Pesapal knows where to send payment notifications.");
    console.log("");

  } catch (err) {
    console.error("\n❌ Network error during IPN registration:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
