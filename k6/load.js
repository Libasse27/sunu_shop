/**
 * k6 Load Test — Sunu Shop
 *
 * Purpose : simulate realistic peak traffic on catalog + product endpoints.
 * Run     : k6 run k6/load.js
 * Stages  : ramp-up 1→50 VUs over 2 min, steady 50 VUs for 3 min, ramp-down 1 min.
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, getAuthToken, authHeaders } from './utils/auth.js';

const errorRate = new Rate('errors');
const p95Catalog = new Trend('p95_catalog', true);
const p95Product = new Trend('p95_product', true);
const p95Search  = new Trend('p95_search', true);
const requests   = new Counter('total_requests');

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0  },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    errors:            ['rate<0.02'],
    p95_catalog:       ['p(95)<600'],
    p95_product:       ['p(95)<500'],
    p95_search:        ['p(95)<800'],
  },
};

// Shared token acquired once per VU (in setup phase)
export function setup() {
  return { token: getAuthToken() };
}

export default function ({ token }) {
  const headers = authHeaders(token);

  // ── Catalog browsing (most common scenario) ────────────────────────────────
  group('catalog', () => {
    const page = Math.ceil(Math.random() * 5);
    const categories = ['informatique', 'telephones', 'electronique', 'gaming', 'accessoires'];
    const cat = categories[Math.floor(Math.random() * categories.length)];

    const res = http.get(
      `${BASE_URL}/products?page=${page}&limit=12&category=${cat}`,
      headers,
    );
    p95Catalog.add(res.timings.duration);
    requests.add(1);
    check(res, { 'catalog ok': (r) => r.status === 200 });
    errorRate.add(res.status >= 400);
  });

  sleep(Math.random() * 1.5 + 0.5);

  // ── Product detail page ────────────────────────────────────────────────────
  group('product_detail', () => {
    // Fetch a random product from catalog first to get a real slug
    const list = http.get(`${BASE_URL}/products?page=1&limit=50`, headers);
    requests.add(1);
    let slug = null;
    try {
      const products = list.json('data.products');
      if (Array.isArray(products) && products.length > 0) {
        slug = products[Math.floor(Math.random() * products.length)].slug;
      }
    } catch { /* noop */ }

    if (slug) {
      const res = http.get(`${BASE_URL}/products/slug/${slug}`, headers);
      p95Product.add(res.timings.duration);
      requests.add(1);
      check(res, { 'product ok': (r) => r.status === 200 });
      errorRate.add(res.status >= 400);
    }
  });

  sleep(Math.random() * 1 + 0.5);

  // ── Search (25 % of users search) ─────────────────────────────────────────
  if (Math.random() < 0.25) {
    group('search', () => {
      const queries = ['iphone', 'samsung', 'laptop', 'climatiseur', 'écran'];
      const q = queries[Math.floor(Math.random() * queries.length)];
      const res = http.get(`${BASE_URL}/products/search?q=${encodeURIComponent(q)}`, headers);
      p95Search.add(res.timings.duration);
      requests.add(1);
      check(res, { 'search ok': (r) => r.status === 200 });
      errorRate.add(res.status >= 400);
    });
  }

  sleep(Math.random() * 2 + 1);
}
