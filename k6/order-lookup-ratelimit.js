import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const failureRate = new Rate("lookup_failures");
const lookupDuration = new Trend("lookup_duration");

export const options = {
  stages: [
    { duration: "5s", target: 10 },
    { duration: "15s", target: 30 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    lookup_failures: ["rate<0.10"],
    http_req_duration: ["p(95)<3000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://keevanstore.in";

export default function () {
  const email = `buyer${__VU % 10}@test.com`;

  for (let i = 0; i < 6; i++) {
    const res = http.get(`${BASE_URL}/api/orders/lookup?email=${encodeURIComponent(email)}`, {
      headers: { "Content-Type": "application/json" },
    });

    lookupDuration.add(res.timings.duration);
    failureRate.add(res.status >= 429);

    check(res, {
      "rate limited after 5 requests (429)": (r) => i < 5 || r.status === 429,
      "first 5 requests succeed (2xx)": (r) => i >= 5 || (r.status >= 200 && r.status < 300),
    });

    if (res.status === 429) {
      sleep(60);
      break;
    }
  }

  sleep(1);
}
