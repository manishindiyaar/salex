/*
 * ## Test Description: Get current user's business profile endpoint test
 *
 * ### Input:
 * GET request to /api/v1/businesses/me with a valid JWT token to retrieve the current user's business.
 *
 * ### Expected Output:
 * A 200 OK response with ApiResponse<Business | null> format containing the user's business or null if no business exists.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Authenticated request returns proper ApiResponse structure.
 * [ ] Test case 2 passed: Unauthorized request returns 401 status.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';

console.log('=== Business Get Me Endpoint Test ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log('');

async function testGetCurrentUserBusiness() {
  console.log('🧪 Test 1: Get current user\'s business (authenticated)');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/me`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response structure validation:`);
    
    const data = response.data;
    
    // Validate ApiResponse structure
    if (typeof data.success !== 'boolean') {
      console.log(`❌ Missing or invalid 'success' field`);
      return false;
    }
    
    if (data.success && data.data !== null && data.data !== undefined) {
      // Validate Business structure if data exists
      const business = data.data;
      console.log(`✅ Business found: ${business.name}`);
      console.log(`✅ Business ID: ${business.id}`);
      console.log(`✅ Business Type: ${business.businessType}`);
      console.log(`✅ Phone: ${business.phoneNumber}`);
      console.log(`✅ Address: ${business.address}`);
      
      if (business.salon) {
        console.log(`✅ Salon data included: ${business.salon.id}`);
      }
      
      // Validate required fields
      const requiredFields = ['id', 'ownerId', 'name', 'businessType', 'phoneNumber', 'address', 'createdAt', 'updatedAt'];
      for (const field of requiredFields) {
        if (!business[field]) {
          console.log(`❌ Missing required field: ${field}`);
          return false;
        }
      }
      
    } else if (data.success && data.data === null) {
      console.log(`✅ No business found for user (data is null)`);
    }
    
    console.log(`✅ Message: ${data.message}`);
    console.log('✅ Test 1 PASSED: Authenticated request successful');
    return true;
    
  } catch (error) {
    console.log(`❌ Test 1 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🧪 Test 2: Unauthorized access (no token)');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/me`);
    
    console.log(`❌ Test 2 FAILED: Expected 401 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(`✅ Status: 401 (Unauthorized)`);
      console.log(`✅ Test 2 PASSED: Unauthorized access properly blocked`);
      return true;
    } else {
      console.log(`❌ Test 2 FAILED: Expected 401 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testInvalidToken() {
  console.log('\n🧪 Test 3: Invalid token');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/me`, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 3 FAILED: Expected 401 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(`✅ Status: 401 (Unauthorized)`);
      console.log(`✅ Test 3 PASSED: Invalid token properly rejected`);
      return true;
    } else {
      console.log(`❌ Test 3 FAILED: Expected 401 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

// Run all tests
async function runTests() {
  const results = [];
  
  console.log('🚀 Starting Business Get Me Endpoint Tests...\n');
  
  results.push(await testGetCurrentUserBusiness());
  results.push(await testUnauthorizedAccess());
  results.push(await testInvalidToken());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});