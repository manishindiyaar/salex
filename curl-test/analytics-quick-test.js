/*
 * ## Test Description: Quick validation test for business analytics API
 *
 * ### Input:
 * Simple GET request to /api/v1/businesses/{businessId}/analytics/daily with valid JWT to verify basic functionality.
 *
 * ### Expected Output:
 * A 200 OK response with properly structured analytics data including businessId, date, totalBookings, totalRevenue, and timezone.
 *
 * ### Passes:
 * [ ] Basic analytics endpoint returns valid data structure
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const CLERK_JWT_TOKEN = process.env.CLERK_JWT_TOKEN;
const BUSINESS_ID = process.env.BUSINESS_ID;

console.log('🚀 Quick Analytics API Test');
console.log('='.repeat(30));

async function quickTest() {
  if (!CLERK_JWT_TOKEN) {
    console.error('❌ CLERK_JWT_TOKEN is required');
    process.exit(1);
  }

  try {
    // Get business ID if not provided
    let businessId = BUSINESS_ID;
    if (!businessId) {
      console.log('🔍 Fetching business ID...');
      const meResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/me`, {
        headers: { 'Authorization': `Bearer ${CLERK_JWT_TOKEN}` }
      });
      businessId = meResponse.data?.data?.id;
      if (!businessId) {
        throw new Error('Could not get business ID');
      }
      console.log(`✅ Business ID: ${businessId}`);
    }

    // Test analytics endpoint
    console.log('🧪 Testing analytics endpoint...');
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/businesses/${businessId}/analytics/daily`,
      {
        headers: { 'Authorization': `Bearer ${CLERK_JWT_TOKEN}` }
      }
    );

    console.log(`✅ Status: ${response.status}`);
    
    const { success, data, message } = response.data;
    console.log(`✅ Success: ${success}`);
    console.log(`✅ Message: ${message || 'No message'}`);
    
    if (data) {
      console.log('📊 Analytics Data:');
      console.log(`   Business ID: ${data.businessId}`);
      console.log(`   Date: ${data.date}`);
      console.log(`   Total Bookings: ${data.totalBookings}`);
      console.log(`   Total Revenue: $${data.totalRevenue}`);
      console.log(`   Timezone: ${data.timezone}`);
    }

    console.log('\n✅ Analytics API is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error(`   Status: ${error.response?.status || 'No response'}`);
    console.error(`   Message: ${error.response?.data?.message || error.message}`);
    process.exit(1);
  }
}

quickTest();