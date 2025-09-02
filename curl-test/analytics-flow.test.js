const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const CLERK_JWT_TOKEN = 'sess_30XtImo791vpBe53yYfLfGEOJzx'; // Replace with valid token

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${CLERK_JWT_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

async function testAnalyticsFlow() {
  console.log('🧪 Starting Analytics API Flow Test\n');

  try {
    // Step 1: Get current user's business
    console.log('📋 Step 1: Getting current user\'s business...');
    const businessResponse = await apiClient.get('/api/v1/businesses/me');
    
    if (!businessResponse.data.success || !businessResponse.data.data) {
      console.log('❌ No business found. Please create a business first.');
      return;
    }

    const businessId = businessResponse.data.data.id;
    console.log(`✅ Business found: ${businessResponse.data.data.name} (${businessId})\n`);

    // Step 2: Test daily analytics endpoint
    console.log('📊 Step 2: Testing daily analytics endpoint...');
    const analyticsResponse = await apiClient.get(`/api/v1/businesses/${businessId}/analytics/daily`);
    
    console.log('Analytics Response:', JSON.stringify(analyticsResponse.data, null, 2));
    
    if (analyticsResponse.data.success) {
      console.log('✅ Daily analytics retrieved successfully');
      console.log(`📈 Total Bookings: ${analyticsResponse.data.data.totalBookings}`);
      console.log(`💰 Total Revenue: $${analyticsResponse.data.data.totalRevenue}`);
      console.log(`📅 Date: ${analyticsResponse.data.data.date}`);
      console.log(`🌍 Timezone: ${analyticsResponse.data.data.timezone}\n`);
    } else {
      console.log('❌ Failed to retrieve analytics:', analyticsResponse.data.error);
      return;
    }

    // Step 3: Test analytics with specific date
    console.log('📊 Step 3: Testing analytics with specific date...');
    const today = new Date().toISOString().split('T')[0];
    const dateAnalyticsResponse = await apiClient.get(`/api/v1/businesses/${businessId}/analytics/daily`, {
      params: { date: today }
    });
    
    if (dateAnalyticsResponse.data.success) {
      console.log('✅ Date-specific analytics retrieved successfully');
      console.log(`📅 Requested Date: ${today}`);
      console.log(`📊 Bookings: ${dateAnalyticsResponse.data.data.totalBookings}`);
      console.log(`💰 Revenue: $${dateAnalyticsResponse.data.data.totalRevenue}\n`);
    } else {
      console.log('❌ Failed to retrieve date-specific analytics:', dateAnalyticsResponse.data.error);
    }

    // Step 4: Test analytics with timezone
    console.log('📊 Step 4: Testing analytics with timezone...');
    const timezoneAnalyticsResponse = await apiClient.get(`/api/v1/businesses/${businessId}/analytics/daily`, {
      params: { timezone: 'America/New_York' }
    });
    
    if (timezoneAnalyticsResponse.data.success) {
      console.log('✅ Timezone-specific analytics retrieved successfully');
      console.log(`🌍 Timezone: ${timezoneAnalyticsResponse.data.data.timezone}`);
      console.log(`📊 Bookings: ${timezoneAnalyticsResponse.data.data.totalBookings}`);
      console.log(`💰 Revenue: $${timezoneAnalyticsResponse.data.data.totalRevenue}\n`);
    } else {
      console.log('❌ Failed to retrieve timezone-specific analytics:', timezoneAnalyticsResponse.data.error);
    }

    // Step 5: Test unauthorized access
    console.log('🔒 Step 5: Testing unauthorized access...');
    try {
      const unauthorizedResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/${businessId}/analytics/daily`);
      console.log('❌ Unauthorized request should have failed but succeeded');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Unauthorized access properly blocked (401)\n');
      } else {
        console.log('⚠️ Unexpected error for unauthorized access:', error.response?.status || error.message);
      }
    }

    console.log('🎉 Analytics API Flow Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure you have a valid CLERK_JWT_TOKEN');
    }
    
    if (error.response?.status === 403) {
      console.log('\n💡 Tip: Make sure the business belongs to the authenticated user');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted by user');
  process.exit(0);
});

// Run the test
if (require.main === module) {
  testAnalyticsFlow();
}

module.exports = { testAnalyticsFlow };