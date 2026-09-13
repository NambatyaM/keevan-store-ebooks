import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * One-off / maintenance tool: finds payments stuck at "pending" that have a
 * Pesapal tracking ID, asks Pesapal for the real transaction status, then:
 *   - completed + amount matches order  → finalize (customer gets download token)
 *   - completed + amount mismatch       → flagged for manual review (never fails a paying customer)
 *   - terminal failure (failed/voided/…) → mark payment+order failed via RPC
 *   - still in progress / PENDING        → left alone
 *
 * Requires .env / .env.local with SUPABASE + Pesapal credentials.
 * Run: npx tsx scripts/reconcile-stuck-payments.ts
 */
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of [resolve(root, ".env"), resolve(root, ".env.local")]) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    }
  }
  return out;
}

const TERMINAL_FAILED = new Set(["failed", "voided", "reversed", "invalid", "expired"]);

async function getPesapalToken(env: Record<string, string>): Promise<string> {
  const base = (env.PESAPAL_BASE_URL || "https://pay.pesapal.com/v3").replace(/\/+$/, "");
  const res = await fetch(`${base}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      consumer_key: env.PESAPAL_CONSUMER_KEY,
      consumer_secret: env.PESAPAL_CONSUMER_SECRET,
    }),
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok || !data.token) {
    throw new Error(`Pesapal token request failed (HTTP ${res.status}): ${JSON.stringify(data)}`);
  }
  return data.token as string;
}

async function main() {
  const env = loadEnv();
  for (const key of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PESAPAL_CONSUMER_KEY",
    "PESAPAL_CONSUMER_SECRET",
  ]) {
    if (!env[key]) {
      console.error(`Missing ${key} in .env / .env.local`);
      process.exit(1);
    }
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: items, error } = await supabase
    .from("payments")
    .select("id, order_id, merchant_reference, tracking_id")
    .eq("status", "pending")
    .not("tracking_id", "is", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const pending = items ?? [];
  console.log(`Found ${pending.length} pending payment(s) with a tracking ID.\n`);

  if (pending.length === 0) return;

  const base = (env.PESAPAL_BASE_URL || "https://pay.pesapal.com/v3").replace(/\/+$/, "");
  const token = await getPesapalToken(env);

  let finalized = 0;
  let markedFailed = 0;
  let stillPending = 0;
  let mismatch = 0;
  let errored = 0;

  for (const pay of pending) {
    const ref = pay.merchant_reference as string;
    const trk = pay.tracking_id as string;

    try {
      const res = await fetch(
        `${base}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trk)}`,
        { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) }
      );
      const raw = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        console.log(`  [ERR ] ${ref} status lookup HTTP ${res.status}`);
        errored++;
        continue;
      }

      const status = String(raw.payment_status_description ?? "").toLowerCase();
      const pesapalRef = raw.merchant_reference ?? raw.order_merchant_reference ?? null;
      const rawAmount = raw.amount;
      const amount = typeof rawAmount === "number" ? rawAmount : rawAmount != null ? Number(rawAmount) : null;

      if (pesapalRef && String(pesapalRef) !== ref) {
        console.log(`  [WARN] ${ref} Pesapal merchant_reference mismatch (${pesapalRef}); skipping`);
        mismatch++;
        continue;
      }

      if (status === "completed") {
        const { data: order } = await supabase
          .from("orders")
          .select("amount, currency, buyer_email, buyer_name")
          .eq("id", pay.order_id)
          .maybeSingle();

        const orderAmount = typeof order?.amount === "number" ? (order.amount as number) : 0;
        const currency = (order?.currency as string | undefined) ?? "UGX";
        const roundedStored = Math.round(orderAmount * 100);
        const roundedReturned = amount != null ? Math.round(amount * 100) : null;

        if (roundedReturned === null || roundedStored !== roundedReturned) {
          console.log(
            `  [MISMATCH] ${ref} Pesapal says completed but amount ${amount} != order ${orderAmount} ${currency} — manual review required`
          );
          mismatch++;
          continue;
        }

        const { data: fin, error: finalizeError } = await supabase.rpc("finalize_pesapal_payment", {
          payment_reference: ref,
          pesapal_tracking_id: trk,
          status_payload: raw,
          payment_currency: currency,
        });

        if (finalizeError || !fin?.ok) {
          console.log(`  [ERR ] ${ref} finalize_pesapal_payment failed: ${finalizeError?.message ?? fin?.error}`);
          errored++;
        } else {
          console.log(
            `  [FIXED] ${ref} finalized → order=${fin.order_id} buyer=${order?.buyer_email ?? "?"} ${fin.already_processed ? "(was already processed)" : ""}`
          );
          finalized++;
        }
      } else if (TERMINAL_FAILED.has(status)) {
        const { error: failError } = await supabase.rpc("fail_pesapal_payment", {
          payment_merchant_reference: ref,
          failure_payload: raw,
        });
        if (failError) {
          console.log(`  [ERR ] ${ref} fail_pesapal_payment failed: ${failError.message}`);
          errored++;
        } else {
          console.log(`  [FAIL] ${ref} transaction is ${status}; payment+order marked failed`);
          markedFailed++;
        }
      } else {
        console.log(`  [PEND] ${ref} status='${status}'; left pending (still in progress)`);
        stillPending++;
      }
    } catch (e) {
      console.log(`  [ERR ] ${ref} unexpected: ${e instanceof Error ? e.message : String(e)}`);
      errored++;
    }
  }

  console.log("\n─".repeat(60));
  console.log(
    `SUMMARY  processed=${pending.length} finalized=${finalized} markedFailed=${markedFailed} ` +
      `stillPending=${stillPending} mismatch=${mismatch} errored=${errored}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});