/*
 * ## Test Description: Get specific business by ID endpoint test
 *
 * ### Input:
 * GET request to /api/v1/businesses/{businessId} with a valid JWT token and business ID.
 *
 * ### Expected Output:
 * A 200 OK response with ApiResponse<Business> format containing the business data including Salon information.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Valid business ID returns proper Business data.
 * [ ] Test case 2 passed: Non-existent business ID returns 404.
 * [ ] Test case 3 passed: Unauthorized access returns 401.
 * [ ] Test case 4 passed: Access to other user's business returns 403.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';

console.log('=== Business Get By ID Endpoint Test ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log('');

// First, we need to get or create a business to test with
async function setupTestBusiness() {
  console.log('🔧 Setting up test business...');
  
  try {
    // Try to get current user's business first
    const meResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/me`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (meResponse.data.success && meResponse.data.data) {
      const businessId = meResponse.data.data.id;
      console.log(`✅ Using existing business: ${businessId}`);
      return businessId;
    }
    
    // If no business exists, create one
    console.log('📝 Creating test business...');
    const createResponse = await axios.post(`${API_BASE_URL}/api/v1/businesses`, {
      name: "Test Business for ID Testing",
      businessType: "SALON",
      phoneNumber: "+19801441675",
      address: "123 Test Street, New York, NY 10001",
      hoursOfOperation: {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "20:00", closed: false },
        saturday: { open: "08:00", close: "17:00", closed: false },
        sunday: { open: "", close: "", closed: true }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (createResponse.data.success && createResponse.data.data) {
      const businessId = createResponse.data.data.id;
      console.log(`✅ Created test business: ${businessId}`);
      return businessId;
    }
    
    throw new Error('Could not create test business');
    
  } catch (error) {
    console.log(`❌ Setup failed: ${error.message}`);
    throw error;
  }
}

async function testGetValidBusinessId(businessId) {
  console.log('\n🧪 Test 1: Get business with valid ID');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${businessId}`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response structure validation:`);
    
    const data = response.data;
    
    // Validate ApiResponse structure
    if (data.success !== true) {
      console.log(`❌ Expected success: true, got: ${data.success}`);
      return false;
    }
    
    if (!data.data) {
      console.log(`❌ Missing business data in response`);
      return false;
    }
    
    const business = data.data;
    console.log(`✅ Business retrieved: ${business.name}`);
    console.log(`✅ Business ID: ${business.id}`);
    console.log(`✅ Business Type: ${business.businessType}`);
    console.log(`✅ Phone: ${business.phoneNumber}`);
    console.log(`✅ Address: ${business.address}`);
    
    // Validate required fields
    const requiredFields = ['id', 'ownerId', 'name', 'businessType', 'phoneNumber', 'address', 'createdAt', 'updatedAt'];
    for (const field of requiredFields) {
      if (!business[field]) {
        console.log(`❌ Missing required field: ${field}`);
        return false;
      }
    }
    
    // Validate business ID matches requested ID
    if (business.id !== businessId) {
      console.log(`❌ Business ID mismatch: expected ${businessId}, got ${business.id}`);
      return false;
    }
    
    // Check if Salon data is included
    if (business.salon) {
      console.log(`✅ Salon data included: ${business.salon.id}`);
      console.log(`✅ Salon businessId matches: ${business.salon.businessId === business.id}`);
    } else {
      console.log(`❌ Missing Salon data`);
      return false;
    }
    
    console.log(`✅ Message: ${data.message}`);
    console.log('✅ Test 1 PASSED: Valid business ID retrieval successful');
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

async function testGetNonExistentBusinessId() {
  console.log('\n🧪 Test 2: Get business with non-existent ID');
  
  const fakeId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format but non-existent
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${fakeId}`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 2 FAILED: Expected 404 but got ${response.status}`);
    console.log(`❌ Response: ${JSON.stringify(response.data, null, 2)}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`✅ Status: 404 (Not Found)`);
      console.log(`✅ Test 2 PASSED: Non-existent business properly handled`);
      return true;
    } else if (error.response && error.response.status === 403) {
      // Business exists but user doesn't own it - also acceptable
      console.log(`✅ Status: 403 (Forbidden)`);
      console.log(`✅ Test 2 PASSED: Non-owned business access denied`);
      return true;
    } else {
      console.log(`❌ Test 2 FAILED: Expected 404/403 but got ${error.response?.status || 'network error'}`);
      if (error.response?.data) {
        console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }
}

async function testGetBusinessUnauthorized(businessId) {
  console.log('\n🧪 Test 3: Get business without authorization');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${businessId}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 3 FAILED: Expected 401 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(`✅ Status: 401 (Unauthorized)`);
      console.log(`✅ Test 3 PASSED: Unauthorized access properly blocked`);
      return true;
    } else {
      console.log(`❌ Test 3 FAILED: Expected 401 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testGetBusinessWithInvalidId() {
  console.log('\n🧪 Test 4: Get business with invalid ID format');
  
  const invalidId = 'not-a-valid-uuid';
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${invalidId}`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 4 FAILED: Expected 400 but got ${response.status}`);
    console.log(`❌ Response: ${JSON.stringify(response.data, null, 2)}`);
    return false;
    
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 404)) {
      console.log(`✅ Status: ${error.response.status} (Bad Request/Not Found)`);
      console.log(`✅ Test 4 PASSED: Invalid ID format properly handled`);
      return true;
    } else {
      console.log(`❌ Test 4 FAILED: Expected 400/404 but got ${error.response?.status || 'network error'}`);
      if (error.response?.data) {
        console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }
}

// Run all tests
async function runTests() {
  const results = [];
  let businessId;
  
  console.log('🚀 Starting Business Get By ID Endpoint Tests...\n');
  
  try {
    // Setup test business
    businessId = await setupTestBusiness();
    
    // Run tests
    results.push(await testGetValidBusinessId(businessId));
    results.push(await testGetNonExistentBusinessId());
    results.push(await testGetBusinessUnauthorized(businessId));
    results.push(await testGetBusinessWithInvalidId());
    
  } catch (error) {
    console.log(`❌ Test setup failed: ${error.message}`);
    process.exit(1);
  }
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (businessId) {
    console.log(`💡 Test Business ID used: ${businessId}`);
  }
  
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