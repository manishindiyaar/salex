/*
 * ## Test Description: Business hours management endpoints comprehensive test
 *
 * ### Input:
 * Tests for PUT /api/v1/businesses/{id}/hours, GET /api/v1/businesses/{id}/hours, and GET /api/v1/businesses/{id}/open-status with various validation scenarios.
 *
 * ### Expected Output:
 * Validates business hours CRUD operations, time format validation, logical validation, and open status checking functionality.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Update business hours with valid data.
 * [ ] Test case 2 passed: Get business hours returns correct structure.
 * [ ] Test case 3 passed: Check business open status functionality.
 * [ ] Test case 4 passed: Invalid time format validation.
 * [ ] Test case 5 passed: Logical errors validation (open > close time).
 * [ ] Test case 6 passed: Unauthorized access returns 401.
 * [ ] Test case 7 passed: Business not found returns 404.
 * [ ] Test case 8 passed: Access violation returns 403.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';
const TEST_BUSINESS_ID = process.env.TEST_BUSINESS_ID || 'test-business-id';

console.log('=== Business Hours Management Tests ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log(`Test Business ID: ${TEST_BUSINESS_ID}`);
console.log('');

// Valid business hours data for testing
const validBusinessHours = {
  hoursOfOperation: {
    monday: {
      open: "09:00",
      close: "17:00",
      closed: false
    },
    tuesday: {
      open: "09:00",
      close: "17:00",
      closed: false
    },
    wednesday: {
      open: "09:00",
      close: "17:00",
      closed: false
    },
    thursday: {
      open: "09:00",
      close: "17:00",
      closed: false
    },
    friday: {
      open: "09:00",
      close: "17:00",
      closed: false
    },
    saturday: {
      open: "10:00",
      close: "16:00",
      closed: false
    },
    sunday: {
      open: "10:00",
      close: "16:00",
      closed: true
    }
  }
};

async function testUpdateBusinessHoursValid() {
  console.log('🧪 Test 1: Update business hours with valid data');
  
  try {
    const response = await axios.put(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, validBusinessHours, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    
    const data = response.data;
    
    // Validate ApiResponse structure
    if (typeof data.success !== 'boolean' || !data.success) {
      console.log(`❌ Invalid success field: ${data.success}`);
      return false;
    }
    
    if (!data.data) {
      console.log(`❌ Missing business data in response`);
      return false;
    }
    
    const business = data.data;
    
    // Validate business has hours
    if (!business.hoursOfOperation) {
      console.log(`❌ Missing hoursOfOperation in response`);
      return false;
    }
    
    console.log(`✅ Business hours updated successfully`);
    console.log(`✅ Monday hours: ${business.hoursOfOperation.monday?.open} - ${business.hoursOfOperation.monday?.close}`);
    console.log(`✅ Sunday closed: ${business.hoursOfOperation.sunday?.closed}`);
    console.log(`✅ Message: ${data.message}`);
    console.log('✅ Test 1 PASSED: Update business hours successful');
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

async function testGetBusinessHours() {
  console.log('\n🧪 Test 2: Get business hours');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    
    const data = response.data;
    
    // Validate ApiResponse structure
    if (typeof data.success !== 'boolean' || !data.success) {
      console.log(`❌ Invalid success field: ${data.success}`);
      return false;
    }
    
    if (!data.data) {
      console.log(`❌ Missing hours data in response`);
      return false;
    }
    
    const hours = data.data;
    
    // Validate BusinessHours structure
    const expectedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of expectedDays) {
      if (hours[day]) {
        const daySchedule = hours[day];
        if (typeof daySchedule.open !== 'string' || typeof daySchedule.close !== 'string' || typeof daySchedule.closed !== 'boolean') {
          console.log(`❌ Invalid ${day} schedule structure`);
          return false;
        }
        console.log(`✅ ${day}: ${daySchedule.closed ? 'Closed' : `${daySchedule.open} - ${daySchedule.close}`}`);
      }
    }
    
    console.log(`✅ Message: ${data.message}`);
    console.log('✅ Test 2 PASSED: Get business hours successful');
    return true;
    
  } catch (error) {
    console.log(`❌ Test 2 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testBusinessOpenStatus() {
  console.log('\n🧪 Test 3: Check business open status');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/open-status`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    
    const data = response.data;
    
    // Validate ApiResponse structure
    if (typeof data.success !== 'boolean' || !data.success) {
      console.log(`❌ Invalid success field: ${data.success}`);
      return false;
    }
    
    if (!data.data) {
      console.log(`❌ Missing open status data in response`);
      return false;
    }
    
    const statusData = data.data;
    
    if (typeof statusData.isOpen !== 'boolean') {
      console.log(`❌ Invalid isOpen field: ${statusData.isOpen}`);
      return false;
    }
    
    if (typeof statusData.currentTime !== 'string') {
      console.log(`❌ Invalid currentTime field: ${statusData.currentTime}`);
      return false;
    }
    
    console.log(`✅ Business is currently: ${statusData.isOpen ? 'OPEN' : 'CLOSED'}`);
    console.log(`✅ Current time: ${statusData.currentTime}`);
    console.log(`✅ Message: ${data.message}`);
    console.log('✅ Test 3 PASSED: Business open status check successful');
    return true;
    
  } catch (error) {
    console.log(`❌ Test 3 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testInvalidTimeFormat() {
  console.log('\n🧪 Test 4: Invalid time format validation');
  
  const invalidHours = {
    hoursOfOperation: {
      monday: {
        open: "25:00", // Invalid hour
        close: "17:00",
        closed: false
      }
    }
  };
  
  try {
    const response = await axios.put(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, invalidHours, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 4 FAILED: Expected 400 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log(`✅ Status: 400 (Bad Request)`);
      console.log(`✅ Validation error properly caught: ${error.response.data.message || error.response.data.error}`);
      console.log('✅ Test 4 PASSED: Invalid time format validation successful');
      return true;
    } else {
      console.log(`❌ Test 4 FAILED: Expected 400 but got ${error.response?.status || 'network error'}`);
      if (error.response) {
        console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }
}

async function testLogicalTimeError() {
  console.log('\n🧪 Test 5: Logical time error validation (open > close)');
  
  const logicalErrorHours = {
    hoursOfOperation: {
      monday: {
        open: "18:00", // Opens after closing time
        close: "17:00",
        closed: false
      }
    }
  };
  
  try {
    const response = await axios.put(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, logicalErrorHours, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 5 FAILED: Expected 400 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log(`✅ Status: 400 (Bad Request)`);
      console.log(`✅ Logical error properly caught: ${error.response.data.message || error.response.data.error}`);
      console.log('✅ Test 5 PASSED: Logical time error validation successful');
      return true;
    } else {
      console.log(`❌ Test 5 FAILED: Expected 400 but got ${error.response?.status || 'network error'}`);
      if (error.response) {
        console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🧪 Test 6: Unauthorized access (no token)');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`);
    
    console.log(`❌ Test 6 FAILED: Expected 401 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(`✅ Status: 401 (Unauthorized)`);
      console.log(`✅ Test 6 PASSED: Unauthorized access properly blocked`);
      return true;
    } else {
      console.log(`❌ Test 6 FAILED: Expected 401 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testBusinessNotFound() {
  console.log('\n🧪 Test 7: Business not found (404)');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/non-existent-business-id/hours`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 7 FAILED: Expected 404 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`✅ Status: 404 (Not Found)`);
      console.log(`✅ Test 7 PASSED: Business not found properly handled`);
      return true;
    } else {
      console.log(`❌ Test 7 FAILED: Expected 404 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testAccessViolation() {
  console.log('\n🧪 Test 8: Access violation test (different user\'s business)');
  
  const otherUserBusinessId = 'different-user-business-id';
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${otherUserBusinessId}/hours`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 8 FAILED: Expected 403 or 404 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      console.log(`✅ Status: ${error.response.status} (${error.response.status === 403 ? 'Forbidden' : 'Not Found'})`);
      console.log(`✅ Test 8 PASSED: Access violation properly handled`);
      return true;
    } else {
      console.log(`❌ Test 8 FAILED: Expected 403 or 404 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

// Run all tests
async function runTests() {
  const results = [];
  
  console.log('🚀 Starting Business Hours Management Tests...\n');
  
  results.push(await testUpdateBusinessHoursValid());
  results.push(await testGetBusinessHours());
  results.push(await testBusinessOpenStatus());
  results.push(await testInvalidTimeFormat());
  results.push(await testLogicalTimeError());
  results.push(await testUnauthorizedAccess());
  results.push(await testBusinessNotFound());
  results.push(await testAccessViolation());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All business hours tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some business hours tests failed!');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});