import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api/v1';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'testuser@sunushop.sn';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'TestPass123!';

/**
 * Authenticate and return an access token.
 * Call once per VU setup (exec: 'setup') to avoid hammering auth.
 */
export function getAuthToken() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, { 'login 200': (r) => r.status === 200 });

  try {
    return res.json('data.accessToken') || '';
  } catch {
    return '';
  }
}

export function authHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

export { BASE_URL };
