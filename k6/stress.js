/**
 * k6 Stress Test — Sunu Shop
 *
 * Purpose : find the breaking point by ramping VUs from 0 → 200 in short waves.
 * Run     : k6 run k6/stress.js
 * Warning : this will saturate the API. Run ONLY against staging/dev.
 *
 * Stages:
 *   0 → 50   VUs  over 2 min  (warm-up)
 *   50 → 100 VUs  over 3 min  (light stress)
 *   100 → 200 VUs over 3 min  (heavy stress)
 *   200 → 0  VUs  over 2 min  (cool-down)
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, authHeaders } from './utils/auth.js';

const errorRate  = new Rate('errors');
const p95Overall = new Trend('p95_overall', true);

export const options = {
  stages: [
    { duration: '2m', target: 50  },
    { duration: '3m', target: 100 },
    { duration: '3m', target: 200 },
    { duration: '2m', target: 0   },
  ],
  thresholds: {
    // Stress test — relaxed thresholds (we expect degradation)
    http_req_duration: ['p(95)<3000'],
    errors:            ['rate<0.10'],
  },
};

export default function () {
  const headers = authHeaders('');

  // Hit the most expensive endpoint: catalog with filter + sort
  const res = http.get(
    `${BASE_URL}/products?page=1&limit=12&sort=price_asc&isActive=true`,
    headers,
  );
  p95Overall.add(res.timings.duration);
  check(res, { 'status < 500': (r) => r.status < 500 });
  errorRate.add(res.status >= 500);

  sleep(0.5);

  // Category list — lightweight DB query
  const cats = http.get(`${BASE_URL}/categories`, headers);
  check(cats, { 'categories < 500': (r) => r.status < 500 });
  errorRate.add(cats.status >= 500);

  sleep(0.3);
}
