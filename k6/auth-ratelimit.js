import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const failureRate = new Rate("auth_failures");
const authDuration = new Trend("auth_duration");

export const options = {
  stages: [
    { duration: "10s", target: 100 },
    { duration: "20s", target: 500 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    auth_failures: ["rate<0.05"],
    http_req_duration: ["p(95)<5000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://keevanstore.in";

export default function () {
  const payload = JSON.stringify({
    email: `user${__VU}@test.com`,
    password: "TestPassword123!",
  });

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: { "Content-Type": "application/json" },
  });

  authDuration.add(res.timings.duration);
  failureRate.add(res.status >= 429 || res.status >= 500);

  check(res, {
    "status is acceptable (2xx/4xx)": (r) => r.status < 500 || r.status === 429,
    "response time < 5s": (r) => r.timings.duration < 5000,
  });

  sleep(1);
}
