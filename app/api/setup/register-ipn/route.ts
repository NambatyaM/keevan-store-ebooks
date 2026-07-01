import { NextRequest } from "next/server";
import { json, requireAdmin, withOptionalCsrf } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = withOptionalCsrf(async (request: NextRequest) => {
  await requireAdmin(request);

  const baseUrl = (process.env.PESAPAL_BASE_URL ?? "https://pay.pesapal.com/v3").replace(/\/+$/, "");
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${new URL(request.url).origin}`;
  const webhookUrl = `${siteUrl.replace(/\/+$/, "")}/api/pesapal/ipn`;

  if (!consumerKey) {
    return json({ error: "PESAPAL_CONSUMER_KEY is not configured" }, { status: 500 });
  }
  if (!consumerSecret) {
    return json({ error: "PESAPAL_CONSUMER_SECRET is not configured" }, { status: 500 });
  }

  let token: string;
  try {
    const tokenRes = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
    });

    const tokenBody: Record<string, unknown> = await tokenRes.json();

    if (!tokenRes.ok) {
      return json({
        error: "Token request failed",
        status: tokenRes.status,
        response: tokenBody,
      }, { status: 502 });
    }

    token = tokenBody.token as string;
    if (!token) {
      return json({
        error: "Token response missing 'token' field",
        response: tokenBody,
      }, { status: 502 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: "Network error during token request", detail: message }, { status: 502 });
  }

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

    if (!ipnRes.ok) {
      return json({
        error: "IPN registration failed",
        status: ipnRes.status,
        response: ipnBody,
      }, { status: 502 });
    }

    const ipnId = (ipnBody.ipn_id || ipnBody.id || ipnBody.ipnId || "") as string;

    if (!ipnId) {
      return json({
        message: "IPN URL registered, but could not extract IPN ID. Check the response for the ID field.",
        ipnUrl: webhookUrl,
        response: ipnBody,
        nextStep: `Copy the ipn_id from the response above into your .env as PESAPAL_IPN_ID`,
      });
    }

    return json({
      success: true,
      ipn_id: ipnId,
      ipn_url: webhookUrl,
      message: "IPN URL registered successfully",
      nextStep: `Add PESAPAL_IPN_ID=${ipnId} to your Vercel environment variables and redeploy.`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: "Network error during IPN registration", detail: message }, { status: 502 });
  }
});
