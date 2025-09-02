/*
 * ## Test Description: Complete validation of business analytics API endpoints
 *
 * ### Input:
 * GET requests to /api/v1/businesses/{businessId}/analytics/daily with various scenarios including authentication, date parameters, timezone handling, and error cases.
 *
 * ### Expected Output:
 * A 200 OK response with analytics data for valid requests, appropriate error codes (401, 403, 400) for invalid requests, and proper data structure validation.
 *
 * ### Passes:
 * [ ] Test case 1: Get daily analytics for current business (successful case)
 * [ ] Test case 2: Get analytics for specific date with date parameter
 * [ ] Test case 3: Get analytics with timezone parameter
 * [ ] Test case 4: Test unauthorized access (no auth token)
 * [ ] Test case 5: Test access to non-owned business (403 error)
 * [ ] Test case 6: Test with invalid date format
 * [ ] Test case 7: Test business with no bookings (should return 0s)
 */

const axios = require('axios');

// Configuration from environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const CLERK_JWT_TOKEN = process.env.CLERK_JWT_TOKEN;
const BUSINESS_ID = process.env.BUSINESS_ID;

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CLERK_JWT_TOKEN}`
  }
};

console.log('🧪 Starting Business Analytics API Tests');
console.log('='.repeat(50));
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using Business ID: ${BUSINESS_ID || 'Will be fetched from /me endpoint'}`);
console.log(`Auth Token Present: ${CLERK_JWT_TOKEN ? 'Yes' : 'No'}`);
console.log('='.repeat(50));

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
  console.log('');
}

async function validateAnalyticsResponse(response, expectedBusinessId = null) {
  if (!response.data) {
    throw new Error('No data in response');
  }

  const { success, data, message } = response.data;

  if (typeof success !== 'boolean') {
    throw new Error('success field should be boolean');
  }

  if (!success) {
    throw new Error(`API returned success: false. Message: ${message}`);
  }

  if (!data) {
    throw new Error('data field missing in successful response');
  }

  // Validate data structure
  const requiredFields = ['businessId', 'date', 'totalBookings', 'totalRevenue', 'timezone'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate data types
  if (typeof data.businessId !== 'string') {
    throw new Error('businessId should be string');
  }

  if (typeof data.date !== 'string') {
    throw new Error('date should be string');
  }

  if (typeof data.totalBookings !== 'number') {
    throw new Error('totalBookings should be number');
  }

  if (typeof data.totalRevenue !== 'number') {
    throw new Error('totalRevenue should be number');
  }

  if (typeof data.timezone !== 'string') {
    throw new Error('timezone should be string');
  }

  // Validate business ID if provided
  if (expectedBusinessId && data.businessId !== expectedBusinessId) {
    throw new Error(`Expected businessId ${expectedBusinessId}, got ${data.businessId}`);
  }

  // Validate date format (should be YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.date)) {
    throw new Error(`Invalid date format: ${data.date}. Expected YYYY-MM-DD`);
  }

  // Validate non-negative numbers
  if (data.totalBookings < 0 || data.totalRevenue < 0) {
    throw new Error('totalBookings and totalRevenue should be non-negative');
  }

  return data;
}

async function runTests() {
  let currentBusinessId = BUSINESS_ID;

  // Get business ID if not provided
  if (!currentBusinessId) {
    try {
      console.log('🔍 Fetching business ID from /me endpoint...');
      const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/me`, {
        headers: { 'Authorization': `Bearer ${CLERK_JWT_TOKEN}` },
        timeout: TEST_CONFIG.timeout
      });

      if (response.data && response.data.data && response.data.data.id) {
        currentBusinessId = response.data.data.id;
        console.log(`✅ Retrieved business ID: ${currentBusinessId}\n`);
      } else {
        console.log('❌ Could not retrieve business ID. Some tests may fail.\n');
      }
    } catch (error) {
      console.log(`❌ Failed to fetch business ID: ${error.message}\n`);
    }
  }

  // Test 1: Get daily analytics for current business (successful case)
  try {
    console.log('🧪 Test 1: Get daily analytics for current business');
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/businesses/${currentBusinessId}/analytics/daily`,
      {
        headers: TEST_CONFIG.headers,
        timeout: TEST_CONFIG.timeout
      }
    );

    const analyticsData = await validateAnalyticsResponse(response, currentBusinessId);
    logTest(
      'Get daily analytics for current business',
      true,
      `Status: ${response.status}, Bookings: ${analyticsData.totalBookings}, Revenue: $${analyticsData.totalRevenue}, Date: ${analyticsData.date}, Timezone: ${analyticsData.timezone}`
    );
  } catch (error) {
    logTest(
      'Get daily analytics for current business',
      false,
      `Error: ${error.response?.data?.message || error.message}`
    );
  }

  // Test 2: Get analytics for specific date with date parameter
  try {
    console.log('🧪 Test 2: Get analytics for specific date');
    const testDate = '2025-07-30';
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/businesses/${currentBusinessId}/analytics/daily?date=${testDate}`,
      {
        headers: TEST_CONFIG.headers,
        timeout: TEST_CONFIG.timeout
      }
    );

    const analyticsData = await validateAnalyticsResponse(response, currentBusinessId);
    const isCorrectDate = analyticsData.date === testDate;
    
    logTest(
      'Get analytics for specific date',
      isCorrectDate,
      `Status: ${response.status}, Requested Date: ${testDate}, Returned Date: ${analyticsData.date}, Bookings: ${analyticsData.totalBookings}, Revenue: $${analyticsData.totalRevenue}`
    );
  } catch (error) {
    logTest(
      'Get analytics for specific date',
      false,
      `Error: ${error.response?.data?.message || error.message}`
    );
  }

  // Test 3: Get analytics with timezone parameter
  try {
    console.log('🧪 Test 3: Get analytics with timezone parameter');
    const testTimezone = 'America/Los_Angeles';
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/businesses/${currentBusinessId}/analytics/daily?timezone=${testTimezone}`,
      {
        headers: TEST_CONFIG.headers,
        timeout: TEST_CONFIG.timeout
      }
    );

    const analyticsData = await validateAnalyticsResponse(response, currentBusinessId);
    const isCorrectTimezone = analyticsData.timezone === testTimezone;
    
    logTest(
      'Get analytics with timezone parameter',
      isCorrectTimezone,
      `Status: ${response.status}, Requested Timezone: ${testTimezone}, Returned Timezone: ${analyticsData.timezone}, Date: ${analyticsData.date}`
    );
  } catch (error) {
    logTest(
      'Get analytics with timezone parameter',
      false,
      `Error: ${error.response?.data?.message || error.message}`
    );
  }

  // Test 4: Test unauthorized access (no auth token)
  try {
    console.log('🧪 Test 4: Test unauthorized access (no auth token)');
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/businesses/${currentBusinessId}/analytics/daily`,
      {
        timeout: TEST_CONFIG.timeout
      }
    );

    // If we get here, the test failed (should have thrown an error)
    logTest(
      'Unauthorized access should fail',
      false,
      `Expected 401 error, but got status: ${response.status}`
    );
  } catch (error) {
    const isUnauthorized = error.response?.status === 401;
    logTest(
      'Unauthorized access should fail',
      isUnauthorized,
      `Status: ${error.response?.status || 'No response'}, Message: ${error.response?.data?.message || error.message}`
    );
  }

  // Test 5: Test access to non-owned business (403 error)
  try {
    console.log('🧪 Test 5: Test access to non-owned business');
    const fakeBusinessId = 'fake-business-id-12345';
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/businesses/${fakeBusinessId}/analytics/daily`,
      {
        headers: TEST_CONFIG.headers,
        timeout: TEST_CONFIG.timeout
      }
    );

    // If we get here, the test failed (should have thrown an error)
    logTest(
      'Access to non-owned business should fail',
      false,
      `Expected 403/404 error, but got status: ${response.status}`
    );
  } catch (error) {
    const isForbiddenOrNotFound = error.response?.status === 403 || error.response?.status === 404;
    logTest(
      'Access to non-owned business should fail',
      isForbiddenOrNotFound,
      `Status: ${error.response?.status || 'No response'}, Message: ${error.response?.data?.message || error.message}`
    );
  }

  // Test 6: Test with invalid date format
  try {
    console.log('🧪 Test 6: Test with invalid date format');
    const invalidDate = '2025/07/30'; // Wrong format - should be YYYY-MM-DD
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/businesses/${currentBusinessId}/analytics/daily?date=${invalidDate}`,
      {
        headers: TEST_CONFIG.headers,
        timeout: TEST_CONFIG.timeout
      }
    );

    // If we get here, the test failed (should have thrown an error)
    logTest(
      'Invalid date format should fail',
      false,
      `Expected 400 error, but got status: ${response.status}`
    );
  } catch (error) {
    const isBadRequest = error.response?.status === 400;
    logTest(
      'Invalid date format should fail',
      isBadRequest,
      `Status: ${error.response?.status || 'No response'}, Message: ${error.response?.data?.message || error.message}`
    );
  }

  // Test 7: Test business with no bookings (should return 0s)
  try {
    console.log('🧪 Test 7: Test business with no bookings (future date)');
    const futureDate = '2026-12-31'; // Far future date with no bookings
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/businesses/${currentBusinessId}/analytics/daily?date=${futureDate}`,
      {
        headers: TEST_CONFIG.headers,
        timeout: TEST_CONFIG.timeout
      }
    );

    const analyticsData = await validateAnalyticsResponse(response, currentBusinessId);
    const hasZeroValues = analyticsData.totalBookings === 0 && analyticsData.totalRevenue === 0;
    
    logTest(
      'Business with no bookings should return zeros',
      hasZeroValues,
      `Status: ${response.status}, Date: ${analyticsData.date}, Bookings: ${analyticsData.totalBookings}, Revenue: $${analyticsData.totalRevenue}`
    );
  } catch (error) {
    logTest(
      'Business with no bookings should return zeros',
      false,
      `Error: ${error.response?.data?.message || error.message}`
    );
  }

  // Test Summary
  console.log('='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (testResults.failed > 0) {
    console.log('❌ Some tests failed. Please check the API implementation.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed! Analytics API is working correctly.');
  }
}

// Check for required environment variables
if (!CLERK_JWT_TOKEN) {
  console.error('❌ Error: CLERK_JWT_TOKEN environment variable is required');
  console.error('Please set it in your .env file or export it as an environment variable');
  process.exit(1);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});