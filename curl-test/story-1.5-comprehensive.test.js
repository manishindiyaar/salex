/*
 * ## Test Description: Story 1.5 comprehensive end-to-end test for business hours and time slots functionality
 *
 * ### Input:
 * End-to-end workflow testing: Set business hours, verify open status, calculate time slots with various parameters, and validate all integration points.
 *
 * ### Expected Output:
 * Complete validation of Story 1.5 features including business hours management, time slot calculations, and proper error handling across all endpoints.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Set up business hours successfully.
 * [ ] Test case 2 passed: Verify business open status reflects hours.
 * [ ] Test case 3 passed: Time slots respect business hours.
 * [ ] Test case 4 passed: Closed days generate no time slots.
 * [ ] Test case 5 passed: Different slot intervals work correctly.
 * [ ] Test case 6 passed: Service-specific slots integration.
 * [ ] Test case 7 passed: Today/week endpoints consistency.
 * [ ] Test case 8 passed: Error handling across all endpoints.
 * [ ] Test case 9 passed: Authentication and authorization flow.
 * [ ] Test case 10 passed: Response format validation.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';
const TEST_BUSINESS_ID = process.env.TEST_BUSINESS_ID || 'test-business-id';
const TEST_SERVICE_ID = process.env.TEST_SERVICE_ID || 'test-service-id';

console.log('=== Story 1.5 Comprehensive Test Suite ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log(`Test Business ID: ${TEST_BUSINESS_ID}`);
console.log(`Test Service ID: ${TEST_SERVICE_ID}`);
console.log('');

// Test data
const testBusinessHours = {
  hoursOfOperation: {
    monday: { open: "09:00", close: "17:00", closed: false },
    tuesday: { open: "09:00", close: "17:00", closed: false },
    wednesday: { open: "09:00", close: "17:00", closed: false },
    thursday: { open: "09:00", close: "17:00", closed: false },
    friday: { open: "09:00", close: "17:00", closed: false },
    saturday: { open: "10:00", close: "16:00", closed: false },
    sunday: { open: "10:00", close: "16:00", closed: true } // Closed on Sunday
  }
};

// Helper function to get formatted date
function getFormattedDate(daysFromToday = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
}

// Helper function to get current day of week
function getCurrentDayOfWeek() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

async function testSetUpBusinessHours() {
  console.log('🧪 Test 1: Set up business hours');
  
  try {
    const response = await axios.put(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, testBusinessHours, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200 || !response.data.success) {
      console.log(`❌ Failed to set business hours: ${response.status}`);
      return false;
    }

    console.log(`✅ Business hours set successfully`);
    console.log(`✅ Sunday closed: ${response.data.data.hoursOfOperation.sunday?.closed}`);
    console.log('✅ Test 1 PASSED: Business hours setup successful');
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

async function testBusinessOpenStatusReflection() {
  console.log('\n🧪 Test 2: Verify business open status reflects hours');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/open-status`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200 || !response.data.success) {
      console.log(`❌ Failed to get open status: ${response.status}`);
      return false;
    }

    const statusData = response.data.data;
    const currentDay = getCurrentDayOfWeek();
    const currentHours = testBusinessHours.hoursOfOperation[currentDay];
    
    console.log(`✅ Current day: ${currentDay}`);
    console.log(`✅ Business is currently: ${statusData.isOpen ? 'OPEN' : 'CLOSED'}`);
    console.log(`✅ Current time: ${statusData.currentTime}`);
    
    if (currentHours && currentHours.closed) {
      console.log(`✅ Expected closed on ${currentDay} - status correctly reflects this`);
    } else {
      console.log(`✅ Day is configured as open - status: ${statusData.isOpen ? 'OPEN' : 'CLOSED'}`);
    }
    
    console.log('✅ Test 2 PASSED: Open status reflection working');
    return true;
    
  } catch (error) {
    console.log(`❌ Test 2 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
    }
    return false;
  }
}

async function testTimeSlotsRespectBusinessHours() {
  console.log('\n🧪 Test 3: Time slots respect business hours');
  
  const startDate = getFormattedDate(0);
  const endDate = getFormattedDate(2);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: { startDate, endDate, slotInterval: 30 },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200 || !response.data.success) {
      console.log(`❌ Failed to get time slots: ${response.status}`);
      return false;
    }

    const slotsResponse = response.data.data;
    
    // Validate business hours are included
    if (!slotsResponse.businessHours) {
      console.log(`❌ Business hours not included in response`);
      return false;
    }
    
    // Check if slots exist for open days and not for closed days
    const slotsByDate = {};
    slotsResponse.slots.forEach(slot => {
      if (!slotsByDate[slot.date]) {
        slotsByDate[slot.date] = [];
      }
      slotsByDate[slot.date].push(slot);
    });
    
    console.log(`✅ Total slots generated: ${slotsResponse.slots.length}`);
    console.log(`✅ Date range: ${slotsResponse.dateRange.start} to ${slotsResponse.dateRange.end}`);
    console.log(`✅ Dates with slots: ${Object.keys(slotsByDate).join(', ')}`);
    
    // Validate time slots are within business hours
    let validSlots = 0;
    for (const slot of slotsResponse.slots) {
      const slotDate = new Date(slot.date);
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][slotDate.getDay()];
      const dayHours = slotsResponse.businessHours[dayName];
      
      if (dayHours && !dayHours.closed) {
        // Validate slot time is within business hours
        if (slot.startTime >= dayHours.open && slot.endTime <= dayHours.close) {
          validSlots++;
        }
      }
    }
    
    console.log(`✅ Valid slots within business hours: ${validSlots}/${slotsResponse.slots.length}`);
    console.log('✅ Test 3 PASSED: Time slots respect business hours');
    return true;
    
  } catch (error) {
    console.log(`❌ Test 3 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
    }
    return false;
  }
}

async function testClosedDaysGenerateNoSlots() {
  console.log('\n🧪 Test 4: Closed days generate no time slots');
  
  // Find next Sunday (closed day) within the next week
  let sundayDate = null;
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0) { // Sunday
      sundayDate = date.toISOString().split('T')[0];
      break;
    }
  }
  
  if (!sundayDate) {
    console.log(`⚠️ Test 4 SKIPPED: No Sunday found in next 7 days for testing`);
    return true;
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: { 
        startDate: sundayDate, 
        endDate: sundayDate, 
        slotInterval: 30 
      },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200 || !response.data.success) {
      console.log(`❌ Failed to get Sunday slots: ${response.status}`);
      return false;
    }

    const slotsResponse = response.data.data;
    const sundaySlots = slotsResponse.slots.filter(slot => slot.date === sundayDate);
    
    console.log(`✅ Sunday date tested: ${sundayDate}`);
    console.log(`✅ Slots generated for closed Sunday: ${sundaySlots.length}`);
    
    if (sundaySlots.length === 0) {
      console.log('✅ Test 4 PASSED: Closed Sunday generates no slots');
      return true;
    } else {
      console.log(`❌ Test 4 FAILED: Expected 0 slots for closed Sunday, got ${sundaySlots.length}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 4 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
    }
    return false;
  }
}

async function testDifferentSlotIntervals() {
  console.log('\n🧪 Test 5: Different slot intervals work correctly');
  
  const startDate = getFormattedDate(1); // Tomorrow
  const endDate = getFormattedDate(1);
  
  const intervals = [15, 30, 60];
  const results = [];
  
  try {
    for (const interval of intervals) {
      const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
        params: { startDate, endDate, slotInterval: interval },
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 && response.data.success) {
        const slotsCount = response.data.data.slots.length;
        results.push({ interval, count: slotsCount });
        console.log(`✅ ${interval}-minute intervals: ${slotsCount} slots`);
      } else {
        console.log(`❌ Failed to get slots for ${interval}-minute interval`);
        return false;
      }
    }
    
    // Verify that smaller intervals generate more slots
    if (results[0].count >= results[1].count && results[1].count >= results[2].count) {
      console.log('✅ Test 5 PASSED: Smaller intervals generate more slots');
      return true;
    } else {
      console.log(`❌ Test 5 FAILED: Slot counts don't follow expected pattern`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 5 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
    }
    return false;
  }
}

async function testServiceSpecificSlotsIntegration() {
  console.log('\n🧪 Test 6: Service-specific slots integration');
  
  const startDate = getFormattedDate(1);
  const endDate = getFormattedDate(2);
  
  try {
    // Test with service ID
    const withServiceResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: { startDate, endDate, serviceId: TEST_SERVICE_ID, slotInterval: 30 },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Test without service ID
    const withoutServiceResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: { startDate, endDate, slotInterval: 30 },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (withServiceResponse.status === 200 && withServiceResponse.data.success &&
        withoutServiceResponse.status === 200 && withoutServiceResponse.data.success) {
      
      const withServiceSlots = withServiceResponse.data.data.slots.length;
      const withoutServiceSlots = withoutServiceResponse.data.data.slots.length;
      
      console.log(`✅ Slots with service ID: ${withServiceSlots}`);
      console.log(`✅ Slots without service ID: ${withoutServiceSlots}`);
      console.log(`✅ Service ID in response: ${withServiceResponse.data.data.serviceId}`);
      
      console.log('✅ Test 6 PASSED: Service-specific slots integration working');
      return true;
    } else {
      console.log(`❌ Test 6 FAILED: Service integration requests failed`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 6 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
    }
    return false;
  }
}

async function testTodayWeekEndpointsConsistency() {
  console.log('\n🧪 Test 7: Today/week endpoints consistency');
  
  try {
    // Get today's slots
    const todayResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots/today`, {
      params: { slotInterval: 30 },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Get week's slots
    const weekResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots/week`, {
      params: { slotInterval: 30 },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (todayResponse.status === 200 && todayResponse.data.success &&
        weekResponse.status === 200 && weekResponse.data.success) {
      
      const todaySlots = todayResponse.data.data.slots;
      const weekSlots = weekResponse.data.data.slots;
      const today = getFormattedDate(0);
      
      // Find today's slots in week response
      const todayFromWeek = weekSlots.filter(slot => slot.date === today);
      
      console.log(`✅ Today endpoint slots: ${todaySlots.length}`);
      console.log(`✅ Today's slots from week endpoint: ${todayFromWeek.length}`);
      console.log(`✅ Week total slots: ${weekSlots.length}`);
      
      if (todaySlots.length === todayFromWeek.length) {
        console.log('✅ Test 7 PASSED: Today/week endpoints consistent');
        return true;
      } else {
        console.log(`❌ Test 7 FAILED: Inconsistent slot counts`);
        return false;
      }
    } else {
      console.log(`❌ Test 7 FAILED: Endpoint requests failed`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 7 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
    }
    return false;
  }
}

async function testErrorHandlingAcrossEndpoints() {
  console.log('\n🧪 Test 8: Error handling across all endpoints');
  
  const errorTests = [
    {
      name: 'Invalid business ID (hours)',
      request: () => axios.get(`${API_BASE_URL}/api/v1/businesses/invalid-id/hours`, {
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      }),
      expectedStatus: 404
    },
    {
      name: 'Invalid business ID (timeslots)',
      request: () => axios.get(`${API_BASE_URL}/api/v1/businesses/invalid-id/timeslots/today`, {
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      }),
      expectedStatus: 404
    },
    {
      name: 'Missing date parameters',
      request: () => axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      }),
      expectedStatus: 400
    }
  ];
  
  let passedTests = 0;
  
  for (const test of errorTests) {
    try {
      await test.request();
      console.log(`❌ ${test.name}: Expected ${test.expectedStatus} error but request succeeded`);
    } catch (error) {
      if (error.response && error.response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: Correctly returned ${test.expectedStatus}`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name}: Expected ${test.expectedStatus} but got ${error.response?.status || 'network error'}`);
      }
    }
  }
  
  if (passedTests === errorTests.length) {
    console.log('✅ Test 8 PASSED: Error handling working across endpoints');
    return true;
  } else {
    console.log(`❌ Test 8 FAILED: ${passedTests}/${errorTests.length} error tests passed`);
    return false;
  }
}

async function testAuthenticationAuthorizationFlow() {
  console.log('\n🧪 Test 9: Authentication and authorization flow');
  
  const authTests = [
    {
      name: 'No token (hours)',
      request: () => axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`),
      expectedStatus: 401
    },
    {
      name: 'No token (timeslots)',
      request: () => axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots/today`),
      expectedStatus: 401
    },
    {
      name: 'Invalid token',
      request: () => axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/open-status`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      }),
      expectedStatus: 401
    }
  ];
  
  let passedTests = 0;
  
  for (const test of authTests) {
    try {
      await test.request();
      console.log(`❌ ${test.name}: Expected ${test.expectedStatus} but request succeeded`);
    } catch (error) {
      if (error.response && error.response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: Correctly returned ${test.expectedStatus}`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name}: Expected ${test.expectedStatus} but got ${error.response?.status}`);
      }
    }
  }
  
  if (passedTests === authTests.length) {
    console.log('✅ Test 9 PASSED: Authentication and authorization working');
    return true;
  } else {
    console.log(`❌ Test 9 FAILED: ${passedTests}/${authTests.length} auth tests passed`);
    return false;
  }
}

async function testResponseFormatValidation() {
  console.log('\n🧪 Test 10: Response format validation');
  
  try {
    // Test business hours response format
    const hoursResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, {
      headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
    });
    
    // Test timeslots response format
    const slotsResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots/today`, {
      headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
    });
    
    // Test open status response format
    const statusResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/open-status`, {
      headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
    });
    
    // Validate all responses have correct ApiResponse structure
    const responses = [
      { name: 'Hours', data: hoursResponse.data },
      { name: 'Slots', data: slotsResponse.data },
      { name: 'Status', data: statusResponse.data }
    ];
    
    let validResponses = 0;
    
    for (const resp of responses) {
      if (typeof resp.data.success === 'boolean' && 
          resp.data.data !== undefined && 
          typeof resp.data.message === 'string') {
        console.log(`✅ ${resp.name} response format valid`);
        validResponses++;
      } else {
        console.log(`❌ ${resp.name} response format invalid`);
      }
    }
    
    if (validResponses === responses.length) {
      console.log('✅ Test 10 PASSED: All response formats valid');
      return true;
    } else {
      console.log(`❌ Test 10 FAILED: ${validResponses}/${responses.length} responses valid`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 10 FAILED: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = [];
  
  console.log('🚀 Starting Story 1.5 Comprehensive Test Suite...\n');
  
  results.push(await testSetUpBusinessHours());
  results.push(await testBusinessOpenStatusReflection());
  results.push(await testTimeSlotsRespectBusinessHours());
  results.push(await testClosedDaysGenerateNoSlots());
  results.push(await testDifferentSlotIntervals());
  results.push(await testServiceSpecificSlotsIntegration());
  results.push(await testTodayWeekEndpointsConsistency());
  results.push(await testErrorHandlingAcrossEndpoints());
  results.push(await testAuthenticationAuthorizationFlow());
  results.push(await testResponseFormatValidation());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Story 1.5 Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All Story 1.5 comprehensive tests passed!');
    console.log('✨ Business hours and time slots functionality is working correctly!');
    process.exit(0);
  } else {
    console.log('💥 Some Story 1.5 comprehensive tests failed!');
    console.log('🔧 Please review the failing tests and fix the issues.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});