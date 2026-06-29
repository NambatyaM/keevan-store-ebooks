import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

const failureRate = new Rate("payment_failures");
const paymentDuration = new Trend("payment_duration");
const csrfTokens = [];

export const options = {
  stages: [
    { duration: "5s", target: 50 },
    { duration: "15s", target: 200 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    payment_failures: ["rate<0.10"],
    http_req_duration: ["p(95)<8000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://keevanstore.in";

function getCSRFToken() {
  if (csrfTokens.length > 0) {
    const idx = Math.floor(Math.random() * csrfTokens.length);
    return csrfTokens[idx];
  }
  const res = http.get(`${BASE_URL}/api/csrf-token`);
  if (res.status === 200) {
    try {
      const body = res.json();
      const token = body.token || body.csrf_token;
      if (token) {
        csrfTokens.push(token);
        return token;
      }
    } catch (e) {}
  }
  return null;
}

export default function () {
  group("payment creation flow", () => {
    const csrf = getCSRFToken();

    const productSlug = `test-product-${__VU}`;
    const payload = JSON.stringify({
      productSlug,
      buyerName: `Buyer ${__VU}`,
      buyerEmail: `buyer${__VU}@test.com`,
      buyerPhone: `+256700${String(__VU).padStart(7, "0")}`,
    });

    const res = http.post(`${BASE_URL}/api/payments/create`, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrf || "",
      },
    });

    paymentDuration.add(res.timings.duration);
    failureRate.add(res.status >= 400);

    check(res, {
      "payment creation accepted (201/200)": (r) => r.status === 201 || r.status === 200,
      "response has checkout URL": (r) => {
        try { return JSON.parse(r.body).checkoutUrl !== undefined; }
        catch (e) { return false; }
      },
      "csrf present": () => csrf !== null,
    });
  });

  sleep(0.5);
}
