import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const failureRate = new Rate("download_failures");
const downloadDuration = new Trend("download_duration");

export const options = {
  stages: [
    { duration: "10s", target: 50 },
    { duration: "20s", target: 100 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    download_failures: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://keevanstore.in";

const orderTokens = [
  "sample-token-001",
  "sample-token-002",
  "sample-token-003",
];

export default function () {
  const token = orderTokens[__VU % orderTokens.length];
  const orderId = `550e8400-e29b-41d4-a716-${String(__VU).padStart(12, "0")}`;

  const res = http.get(`${BASE_URL}/api/orders/${orderId}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  downloadDuration.add(res.timings.duration);
  failureRate.add(res.status >= 400);

  check(res, {
    "download URL generation succeeds (2xx)": (r) => r.status >= 200 && r.status < 300,
    "response time < 3s": (r) => r.timings.duration < 3000,
  });

  sleep(1);
}
