/*
 * ## Test Description: Create new business endpoint test with automatic Salon creation
 *
 * ### Input:
 * POST request to /api/v1/businesses with valid business data including name, businessType, phoneNumber, address, and hoursOfOperation.
 *
 * ### Expected Output:
 * A 200 OK response with ApiResponse<Business> format containing the created business with Salon data included.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Valid business creation returns proper Business with Salon.
 * [ ] Test case 2 passed: Invalid data returns validation errors.
 * [ ] Test case 3 passed: Unauthorized request returns 401 status.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';

console.log('=== Business Create Endpoint Test ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log('');

// Test data from Postman collection
const validBusinessData = {
  name: "Test Elegant Hair Salon",
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
};

async function testCreateValidBusiness() {
  console.log('🧪 Test 1: Create business with valid data');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/businesses`, validBusinessData, {
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
    console.log(`✅ Business created: ${business.name}`);
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
    
    // Validate businessType is forced to SALON
    if (business.businessType !== 'SALON') {
      console.log(`❌ Expected businessType: SALON, got: ${business.businessType}`);
      return false;
    }
    
    // Check if Salon record was created
    if (business.salon) {
      console.log(`✅ Salon data included: ${business.salon.id}`);
      console.log(`✅ Salon businessId matches: ${business.salon.businessId === business.id}`);
    } else {
      console.log(`❌ Missing Salon data - should be automatically created`);
      return false;
    }
    
    // Validate hoursOfOperation
    if (business.hoursOfOperation) {
      console.log(`✅ Hours of operation preserved`);
    }
    
    console.log(`✅ Message: ${data.message}`);
    console.log('✅ Test 1 PASSED: Valid business creation successful');
    
    // Store business ID for other tests
    process.env.TEST_BUSINESS_ID = business.id;
    
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

async function testCreateInvalidBusiness() {
  console.log('\n🧪 Test 2: Create business with invalid data');
  
  const invalidData = {
    name: "", // Empty name should fail validation
    businessType: "INVALID_TYPE",
    phoneNumber: "invalid-phone",
    address: ""
  };
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/businesses`, invalidData, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    // If we get here, validation didn't work as expected
    console.log(`❌ Test 2 FAILED: Expected validation error but got ${response.status}`);
    console.log(`❌ Response: ${JSON.stringify(response.data, null, 2)}`);
    return false;
    
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 422)) {
      console.log(`✅ Status: ${error.response.status} (Validation Error)`);
      console.log(`✅ Test 2 PASSED: Invalid data properly rejected`);
      return true;
    } else {
      console.log(`❌ Test 2 FAILED: Expected 400/422 but got ${error.response?.status || 'network error'}`);
      if (error.response?.data) {
        console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }
}

async function testCreateBusinessUnauthorized() {
  console.log('\n🧪 Test 3: Create business without authorization');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/businesses`, validBusinessData, {
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

async function testCreateDuplicateBusiness() {
  console.log('\n🧪 Test 4: Create duplicate business (should work - users can have multiple businesses)');
  
  const duplicateData = {
    ...validBusinessData,
    name: "Another Test Salon",
    phoneNumber: "+19801441676"
  };
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/businesses`, duplicateData, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    
    const data = response.data;
    if (data.success && data.data) {
      console.log(`✅ Second business created: ${data.data.name}`);
      console.log(`✅ Test 4 PASSED: Multiple businesses allowed per user`);
      return true;
    } else {
      console.log(`❌ Test 4 FAILED: Could not create second business`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 4 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = [];
  
  console.log('🚀 Starting Business Create Endpoint Tests...\n');
  
  results.push(await testCreateValidBusiness());
  results.push(await testCreateInvalidBusiness());
  results.push(await testCreateBusinessUnauthorized());
  results.push(await testCreateDuplicateBusiness());
  
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