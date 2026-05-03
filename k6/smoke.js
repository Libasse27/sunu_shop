/**
 * k6 Smoke Test — Sunu Shop
 *
 * Purpose : verify the stack responds correctly under minimal load (1 VU).
 * Run     : k6 run k6/smoke.js
 * Env vars: BASE_URL, TEST_EMAIL, TEST_PASSWORD
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, authHeaders } from './utils/auth.js';

const errorRate = new Rate('errors');
const catalogLatency = new Trend('catalog_latency', true);
const productLatency = new Trend('product_latency', true);

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.01'],
  },
};

export default function () {
  // 1. Health check
  const health = http.get(`${BASE_URL.replace('/api/v1', '')}/health`);
  check(health, { 'health 200': (r) => r.status === 200 });
  errorRate.add(health.status !== 200);

  // 2. Catalog — first page
  const catalog = http.get(
    `${BASE_URL}/products?page=1&limit=12&isActive=true`,
    authHeaders(''),
  );
  catalogLatency.add(catalog.timings.duration);
  check(catalog, {
    'catalog 200': (r) => r.status === 200,
    'catalog has data': (r) => {
      try { return Array.isArray(r.json('data.products')); } catch { return false; }
    },
  });
  errorRate.add(catalog.status !== 200);

  // 3. Categories
  const categories = http.get(`${BASE_URL}/categories`, authHeaders(''));
  check(categories, { 'categories 200': (r) => r.status === 200 });
  errorRate.add(categories.status !== 200);

  // 4. Single product (by slug — use a well-known slug or derive from catalog)
  let productSlug = null;
  try {
    const products = catalog.json('data.products');
    if (Array.isArray(products) && products.length > 0) {
      productSlug = products[0].slug;
    }
  } catch { /* noop */ }

  if (productSlug) {
    const product = http.get(`${BASE_URL}/products/slug/${productSlug}`, authHeaders(''));
    productLatency.add(product.timings.duration);
    check(product, { 'product 200': (r) => r.status === 200 });
    errorRate.add(product.status !== 200);
  }

  // 5. Services list
  const services = http.get(`${BASE_URL}/services`, authHeaders(''));
  check(services, { 'services 200': (r) => r.status === 200 });
  errorRate.add(services.status !== 200);

  sleep(1);
}
