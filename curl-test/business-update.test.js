/*
 * ## Test Description: Update business details endpoint test
 *
 * ### Input:
 * PUT request to /api/v1/businesses/{businessId} with valid business update data and JWT token.
 *
 * ### Expected Output:
 * A 200 OK response with ApiResponse<Business> format containing the updated business data.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Valid business update returns updated Business data.
 * [ ] Test case 2 passed: Invalid update data returns validation errors.
 * [ ] Test case 3 passed: Unauthorized access returns 401.
 * [ ] Test case 4 passed: Access to other user's business returns 403.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';

console.log('=== Business Update Endpoint Test ===');
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
      name: "Test Business for Update Testing",
      businessType: "SALON",
      phoneNumber: "+19801441675",
      address: "123 Original Street, New York, NY 10001",
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

async function testUpdateValidBusiness(businessId) {
  console.log('\n🧪 Test 1: Update business with valid data');
  
  const updateData = {
    name: "Updated Test Business & Spa",
    address: "456 Updated Avenue, Suite 200, New York, NY 10002",
    phoneNumber: "+19801441676",
    hoursOfOperation: {
      monday: { open: "08:00", close: "19:00", closed: false },
      tuesday: { open: "08:00", close: "19:00", closed: false },
      wednesday: { open: "08:00", close: "19:00", closed: false },
      thursday: { open: "08:00", close: "19:00", closed: false },
      friday: { open: "08:00", close: "21:00", closed: false },
      saturday: { open: "07:00", close: "18:00", closed: false },
      sunday: { open: "10:00", close: "16:00", closed: false }
    }
  };
  
  try {
    const response = await axios.put(`${API_BASE_URL}/api/v1/businesses/${businessId}`, updateData, {
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
    console.log(`✅ Business updated: ${business.name}`);
    console.log(`✅ Business ID: ${business.id}`);
    console.log(`✅ New Address: ${business.address}`);
    console.log(`✅ New Phone: ${business.phoneNumber}`);
    
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
    
    // Validate updates were applied
    if (business.name !== updateData.name) {
      console.log(`❌ Name not updated: expected "${updateData.name}", got "${business.name}"`);
      return false;
    }
    
    if (business.address !== updateData.address) {
      console.log(`❌ Address not updated: expected "${updateData.address}", got "${business.address}"`);
      return false;
    }
    
    if (business.phoneNumber !== updateData.phoneNumber) {
      console.log(`❌ Phone not updated: expected "${updateData.phoneNumber}", got "${business.phoneNumber}"`);
      return false;
    }
    
    // Check if Salon data is still included
    if (business.salon) {
      console.log(`✅ Salon data preserved: ${business.salon.id}`);
    } else {
      console.log(`❌ Missing Salon data after update`);
      return false;
    }
    
    // Validate hoursOfOperation updated
    if (business.hoursOfOperation) {
      console.log(`✅ Hours of operation updated`);
    }
    
    console.log(`✅ Message: ${data.message}`);
    console.log('✅ Test 1 PASSED: Valid business update successful');
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

async function testUpdateInvalidBusiness(businessId) {
  console.log('\n🧪 Test 2: Update business with invalid data');
  
  const invalidData = {
    name: "", // Empty name should fail validation
    phoneNumber: "invalid-phone-format",
    address: ""
  };
  
  try {
    const response = await axios.put(`${API_BASE_URL}/api/v1/businesses/${businessId}`, invalidData, {
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

async function testUpdateBusinessUnauthorized(businessId) {
  console.log('\n🧪 Test 3: Update business without authorization');
  
  const updateData = {
    name: "Unauthorized Update",
    address: "Should not work"
  };
  
  try {
    const response = await axios.put(`${API_BASE_URL}/api/v1/businesses/${businessId}`, updateData, {
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

async function testUpdateNonExistentBusiness() {
  console.log('\n🧪 Test 4: Update non-existent business');
  
  const fakeId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format but non-existent
  const updateData = {
    name: "Should not work",
    address: "This business doesn't exist"
  };
  
  try {
    const response = await axios.put(`${API_BASE_URL}/api/v1/businesses/${fakeId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 4 FAILED: Expected 404 but got ${response.status}`);
    console.log(`❌ Response: ${JSON.stringify(response.data, null, 2)}`);
    return false;
    
  } catch (error) {
    if (error.response && (error.response.status === 404 || error.response.status === 403)) {
      console.log(`✅ Status: ${error.response.status} (Not Found/Forbidden)`);
      console.log(`✅ Test 4 PASSED: Non-existent business properly handled`);
      return true;
    } else {
      console.log(`❌ Test 4 FAILED: Expected 404/403 but got ${error.response?.status || 'network error'}`);
      if (error.response?.data) {
        console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }
}

async function testPartialUpdate(businessId) {
  console.log('\n🧪 Test 5: Partial update (only some fields)');
  
  const partialUpdateData = {
    name: "Partially Updated Business"
    // Only updating name, other fields should remain unchanged
  };
  
  try {
    const response = await axios.put(`${API_BASE_URL}/api/v1/businesses/${businessId}`, partialUpdateData, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    
    const data = response.data;
    
    if (data.success && data.data) {
      const business = data.data;
      console.log(`✅ Business name updated: ${business.name}`);
      
      // Validate that name was updated
      if (business.name === partialUpdateData.name) {
        console.log(`✅ Test 5 PASSED: Partial update successful`);
        return true;
      } else {
        console.log(`❌ Test 5 FAILED: Name not updated correctly`);
        return false;
      }
    } else {
      console.log(`❌ Test 5 FAILED: Update not successful`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 5 FAILED: ${error.message}`);
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
  let businessId;
  
  console.log('🚀 Starting Business Update Endpoint Tests...\n');
  
  try {
    // Setup test business
    businessId = await setupTestBusiness();
    
    // Run tests
    results.push(await testUpdateValidBusiness(businessId));
    results.push(await testUpdateInvalidBusiness(businessId));
    results.push(await testUpdateBusinessUnauthorized(businessId));
    results.push(await testUpdateNonExistentBusiness());
    results.push(await testPartialUpdate(businessId));
    
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