/**
 * OTP Flow smoke test using your running API and real Clerk credentials.
 * This ONLY checks that /auth/otp/start responds with a signInId for the provided phone number.
 * It DOES NOT assert delivery (which is handled by Clerk), but you should receive an SMS on your phone.
 *
 * Usage:
 *   1) Ensure apps/api is running with valid CLERK_SECRET_KEY in apps/api/.env
 *   2) From project root: pnpm --filter curl-test run start (or node curl-test/otp-flow.test.js)
 *   3) Check console for the signInId. You should receive the OTP SMS on your device.
 */
let fetchFn;
try {
  // Node 18+ has global fetch
  fetchFn = global.fetch ? global.fetch : undefined;
} catch {}
if (!fetchFn) {
  // fallback to node-fetch for older Node
  fetchFn = require('node-fetch');
}
const fetch = (...args) => fetchFn(...args);

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_PHONE = process.env.OTP_TEST_PHONE || '+919801441675';

async function startOtp() {
  const url = `${BASE_URL}/api/v1/auth/otp/start`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phoneNumber: TEST_PHONE }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('OTP start failed:', res.status, body);
    process.exit(1);
  }

  if (!body?.signInId) {
    console.error('No signInId returned. Response:', body);
    process.exit(1);
  }

  console.log('OTP start OK. signInId:', body.signInId);
  console.log('Expect an SMS OTP to arrive on:', TEST_PHONE);
}

startOtp().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
