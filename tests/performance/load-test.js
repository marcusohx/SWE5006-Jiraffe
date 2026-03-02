import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const responseTrend = new Trend("response_time");

const BASE_URL = __ENV.K6_STAGING_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 25 },
    { duration: "30s", target: 50 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
    errors: ["rate<0.1"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  const pages = [
    { name: "Homepage", path: "/" },
    { name: "Login Page", path: "/login" },
    { name: "Auth Providers", path: "/api/auth/providers" },
  ];

  for (const page of pages) {
    const res = http.get(`${BASE_URL}${page.path}`, {
      tags: { name: page.name },
    });

    const passed = check(res, {
      [`${page.name} status is 200`]: (r) => r.status === 200,
      [`${page.name} response time < 2s`]: (r) => r.timings.duration < 2000,
    });

    errorRate.add(!passed);
    responseTrend.add(res.timings.duration);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: "  ", enableColors: true }),
  };
}

function textSummary(data, opts) {
  const indent = opts.indent || "  ";
  const lines = [];
  lines.push("=== K6 Load Test Summary ===\n");

  if (data.metrics) {
    for (const [name, metric] of Object.entries(data.metrics)) {
      if (metric.values) {
        const vals = Object.entries(metric.values)
          .map(([k, v]) => `${k}=${typeof v === "number" ? v.toFixed(2) : v}`)
          .join(", ");
        lines.push(`${indent}${name}: ${vals}`);
      }
    }
  }

  return lines.join("\n") + "\n";
}
