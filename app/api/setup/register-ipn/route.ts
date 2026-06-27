import { NextRequest } from "next/server";
import { json, requireAdmin, withErrorHandling } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);

  console.log("[register-ipn] Starting IPN registration...");

  const baseUrl = (process.env.PESAPAL_BASE_URL ?? "https://pay.pesapal.com/v3").replace(/\/+$/, "");
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://keevanstore.in";
  const webhookUrl = `${siteUrl.replace(/\/+$/, "")}/api/pesapal/ipn`;

  if (!consumerKey) {
    console.error("[register-ipn] Missing PESAPAL_CONSUMER_KEY");
    return json({ error: "PESAPAL_CONSUMER_KEY is not configured" }, { status: 500 });
  }
  if (!consumerSecret) {
    console.error("[register-ipn] Missing PESAPAL_CONSUMER_SECRET");
    return json({ error: "PESAPAL_CONSUMER_SECRET is not configured" }, { status: 500 });
  }

  // ── Step 1: Get OAuth token ──────────────────────────────
  console.log("[register-ipn] Step 1/2 — Requesting OAuth token...");

  let token: string;
  try {
    const tokenRes = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
    });

    const tokenBody: Record<string, unknown> = await tokenRes.json();
    console.log("[register-ipn] Token response status:", tokenRes.status);

    if (!tokenRes.ok) {
      console.error("[register-ipn] Token request failed:", JSON.stringify(tokenBody));
      return json({
        error: "Token request failed",
        status: tokenRes.status,
        response: tokenBody,
      }, { status: 502 });
    }

    token = tokenBody.token as string;
    if (!token) {
      console.error("[register-ipn] No token in response:", JSON.stringify(tokenBody));
      return json({
        error: "Token response missing 'token' field",
        response: tokenBody,
      }, { status: 502 });
    }

    console.log("[register-ipn] ✓ Token obtained");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[register-ipn] Network error during token request:", message);
    return json({ error: "Network error during token request", detail: message }, { status: 502 });
  }

  // ── Step 2: Register IPN URL ─────────────────────────────
  console.log("[register-ipn] Step 2/2 — Registering IPN URL...");
  console.log("[register-ipn] IPN URL:", webhookUrl);

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
    console.log("[register-ipn] IPN registration response status:", ipnRes.status);
    console.log("[register-ipn] IPN registration response:", JSON.stringify(ipnBody));

    if (!ipnRes.ok) {
      console.error("[register-ipn] IPN registration failed:", JSON.stringify(ipnBody));
      return json({
        error: "IPN registration failed",
        status: ipnRes.status,
        response: ipnBody,
      }, { status: 502 });
    }

    const ipnId = (ipnBody.ipn_id || ipnBody.id || ipnBody.ipnId || "") as string;

    if (!ipnId) {
      console.warn("[register-ipn] IPN registered but no ID field found in response");
      return json({
        message: "IPN URL registered, but could not extract IPN ID. Check the response for the ID field.",
        ipnUrl: webhookUrl,
        response: ipnBody,
        nextStep: `Copy the ipn_id from the response above into your .env as PESAPAL_IPN_ID`,
      });
    }

    console.log("[register-ipn] ✔ IPN registered successfully. ID:", ipnId);

    return json({
      success: true,
      ipn_id: ipnId,
      ipn_url: webhookUrl,
      message: "IPN URL registered successfully",
      nextStep: `Add PESAPAL_IPN_ID=${ipnId} to your Vercel environment variables and redeploy.`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[register-ipn] Network error during IPN registration:", message);
    return json({ error: "Network error during IPN registration", detail: message }, { status: 502 });
  }
});
