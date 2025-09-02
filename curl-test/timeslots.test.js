/*
 * ## Test Description: Time slots calculation endpoints comprehensive test
 *
 * ### Input:
 * Tests for GET /api/v1/businesses/{id}/timeslots, /timeslots/today, and /timeslots/week with various parameters and validation scenarios.
 *
 * ### Expected Output:
 * Validates time slots calculation with different date ranges, slot intervals, service durations, and error handling scenarios.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Get available time slots for date range.
 * [ ] Test case 2 passed: Get today's available slots.
 * [ ] Test case 3 passed: Get week's available slots.
 * [ ] Test case 4 passed: Custom slot interval parameter.
 * [ ] Test case 5 passed: Service-specific time slots.
 * [ ] Test case 6 passed: Invalid date format validation.
 * [ ] Test case 7 passed: Invalid date range validation.
 * [ ] Test case 8 passed: Date range too large validation.
 * [ ] Test case 9 passed: Missing required parameters validation.
 * [ ] Test case 10 passed: Unauthorized access returns 401.
 * [ ] Test case 11 passed: Business not found returns 404.
 * [ ] Test case 12 passed: Service not found returns 404.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';
const TEST_BUSINESS_ID = process.env.TEST_BUSINESS_ID || 'test-business-id';
const TEST_SERVICE_ID = process.env.TEST_SERVICE_ID || 'test-service-id';

console.log('=== Time Slots Calculation Tests ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log(`Test Business ID: ${TEST_BUSINESS_ID}`);
console.log(`Test Service ID: ${TEST_SERVICE_ID}`);
console.log('');

// Helper function to get formatted date
function getFormattedDate(daysFromToday = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
}

async function testGetAvailableSlotsDateRange() {
  console.log('🧪 Test 1: Get available time slots for date range');
  
  const startDate = getFormattedDate(0); // Today
  const endDate = getFormattedDate(7);   // 7 days from today
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: {
        startDate,
        endDate,
        slotInterval: 30
      },
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
      console.log(`❌ Missing time slots data in response`);
      return false;
    }
    
    const slotsResponse = data.data;
    
    // Validate TimeSlotsResponse structure
    if (slotsResponse.businessId !== TEST_BUSINESS_ID) {
      console.log(`❌ Incorrect businessId: ${slotsResponse.businessId}`);
      return false;
    }
    
    if (!slotsResponse.dateRange || !slotsResponse.dateRange.start || !slotsResponse.dateRange.end) {
      console.log(`❌ Missing or invalid dateRange`);
      return false;
    }
    
    if (!Array.isArray(slotsResponse.slots)) {
      console.log(`❌ Slots is not an array`);
      return false;
    }
    
    if (typeof slotsResponse.slotInterval !== 'number') {
      console.log(`❌ Invalid slotInterval: ${slotsResponse.slotInterval}`);
      return false;
    }
    
    if (!slotsResponse.businessHours) {
      console.log(`❌ Missing businessHours in response`);
      return false;
    }
    
    console.log(`✅ Date range: ${slotsResponse.dateRange.start} to ${slotsResponse.dateRange.end}`);
    console.log(`✅ Total slots found: ${slotsResponse.slots.length}`);
    console.log(`✅ Slot interval: ${slotsResponse.slotInterval} minutes`);
    
    // Validate a few slots structure
    if (slotsResponse.slots.length > 0) {
      const slot = slotsResponse.slots[0];
      if (!slot.startTime || !slot.endTime || typeof slot.available !== 'boolean' || !slot.date) {
        console.log(`❌ Invalid slot structure: ${JSON.stringify(slot)}`);
        return false;
      }
      console.log(`✅ Sample slot: ${slot.date} ${slot.startTime}-${slot.endTime} (${slot.available ? 'Available' : 'Booked'})`);
    }
    
    console.log(`✅ Message: ${data.message}`);
    console.log('✅ Test 1 PASSED: Get available slots for date range successful');
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

async function testGetTodayAvailableSlots() {
  console.log('\n🧪 Test 2: Get today\'s available slots');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots/today`, {
      params: {
        slotInterval: 30
      },
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
      console.log(`❌ Missing time slots data in response`);
      return false;
    }
    
    const slotsResponse = data.data;
    
    // Validate today's date range
    const today = getFormattedDate(0);
    if (slotsResponse.dateRange.start !== today || slotsResponse.dateRange.end !== today) {
      console.log(`❌ Incorrect date range for today: ${slotsResponse.dateRange.start} to ${slotsResponse.dateRange.end}`);
      return false;
    }
    
    console.log(`✅ Today's date: ${today}`);
    console.log(`✅ Today's slots count: ${slotsResponse.slots.length}`);
    console.log(`✅ Slot interval: ${slotsResponse.slotInterval} minutes`);
    
    console.log(`✅ Message: ${data.message}`);
    console.log('✅ Test 2 PASSED: Get today\'s available slots successful');
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

async function testGetWeekAvailableSlots() {
  console.log('\n🧪 Test 3: Get week\'s available slots');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots/week`, {
      params: {
        slotInterval: 30
      },
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
      console.log(`❌ Missing time slots data in response`);
      return false;
    }
    
    const slotsResponse = data.data;
    
    // Validate week range (today + 6 days)
    const startDate = getFormattedDate(0);
    const endDate = getFormattedDate(6);
    
    if (slotsResponse.dateRange.start !== startDate || slotsResponse.dateRange.end !== endDate) {
      console.log(`❌ Incorrect week date range: expected ${startDate} to ${endDate}, got ${slotsResponse.dateRange.start} to ${slotsResponse.dateRange.end}`);
      return false;
    }
    
    console.log(`✅ Week range: ${slotsResponse.dateRange.start} to ${slotsResponse.dateRange.end}`);
    console.log(`✅ Week's slots count: ${slotsResponse.slots.length}`);
    console.log(`✅ Slot interval: ${slotsResponse.slotInterval} minutes`);
    
    console.log(`✅ Message: ${data.message}`);
    console.log('✅ Test 3 PASSED: Get week\'s available slots successful');
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

async function testCustomSlotInterval() {
  console.log('\n🧪 Test 4: Custom slot interval parameter');
  
  const startDate = getFormattedDate(0);
  const endDate = getFormattedDate(1);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: {
        startDate,
        endDate,
        slotInterval: 15 // 15-minute intervals
      },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    
    const data = response.data;
    
    if (!data.success || !data.data) {
      console.log(`❌ Invalid response structure`);
      return false;
    }
    
    const slotsResponse = data.data;
    
    if (slotsResponse.slotInterval !== 15) {
      console.log(`❌ Incorrect slot interval: expected 15, got ${slotsResponse.slotInterval}`);
      return false;
    }
    
    console.log(`✅ Custom slot interval: ${slotsResponse.slotInterval} minutes`);
    console.log(`✅ Slots count with 15-min intervals: ${slotsResponse.slots.length}`);
    
    console.log('✅ Test 4 PASSED: Custom slot interval successful');
    return true;
    
  } catch (error) {
    console.log(`❌ Test 4 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testServiceSpecificSlots() {
  console.log('\n🧪 Test 5: Service-specific time slots');
  
  const startDate = getFormattedDate(0);
  const endDate = getFormattedDate(2);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: {
        startDate,
        endDate,
        serviceId: TEST_SERVICE_ID,
        slotInterval: 30
      },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    
    const data = response.data;
    
    if (!data.success || !data.data) {
      console.log(`❌ Invalid response structure`);
      return false;
    }
    
    const slotsResponse = data.data;
    
    if (slotsResponse.serviceId !== TEST_SERVICE_ID) {
      console.log(`❌ Incorrect serviceId: expected ${TEST_SERVICE_ID}, got ${slotsResponse.serviceId}`);
      return false;
    }
    
    console.log(`✅ Service ID: ${slotsResponse.serviceId}`);
    console.log(`✅ Service-specific slots count: ${slotsResponse.slots.length}`);
    
    console.log('✅ Test 5 PASSED: Service-specific time slots successful');
    return true;
    
  } catch (error) {
    console.log(`❌ Test 5 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testInvalidDateFormat() {
  console.log('\n🧪 Test 6: Invalid date format validation');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: {
        startDate: '2024-13-01', // Invalid month
        endDate: '2024-12-01',
        slotInterval: 30
      },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 6 FAILED: Expected 400 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log(`✅ Status: 400 (Bad Request)`);
      console.log(`✅ Invalid date format properly caught: ${error.response.data.message || error.response.data.error}`);
      console.log('✅ Test 6 PASSED: Invalid date format validation successful');
      return true;
    } else {
      console.log(`❌ Test 6 FAILED: Expected 400 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testInvalidDateRange() {
  console.log('\n🧪 Test 7: Invalid date range validation (start > end)');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: {
        startDate: getFormattedDate(5), // 5 days from today
        endDate: getFormattedDate(1),   // 1 day from today (before start)
        slotInterval: 30
      },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 7 FAILED: Expected 400 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log(`✅ Status: 400 (Bad Request)`);
      console.log(`✅ Invalid date range properly caught: ${error.response.data.message || error.response.data.error}`);
      console.log('✅ Test 7 PASSED: Invalid date range validation successful');
      return true;
    } else {
      console.log(`❌ Test 7 FAILED: Expected 400 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testDateRangeTooLarge() {
  console.log('\n🧪 Test 8: Date range too large validation (> 30 days)');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: {
        startDate: getFormattedDate(0),
        endDate: getFormattedDate(35), // 35 days (exceeds 30-day limit)
        slotInterval: 30
      },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 8 FAILED: Expected 400 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log(`✅ Status: 400 (Bad Request)`);
      console.log(`✅ Date range limit properly enforced: ${error.response.data.message || error.response.data.error}`);
      console.log('✅ Test 8 PASSED: Date range too large validation successful');
      return true;
    } else {
      console.log(`❌ Test 8 FAILED: Expected 400 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testMissingRequiredParameters() {
  console.log('\n🧪 Test 9: Missing required parameters validation');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: {
        // Missing startDate and endDate
        slotInterval: 30
      },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 9 FAILED: Expected 400 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log(`✅ Status: 400 (Bad Request)`);
      console.log(`✅ Missing parameters properly caught: ${error.response.data.message || error.response.data.error}`);
      console.log('✅ Test 9 PASSED: Missing required parameters validation successful');
      return true;
    } else {
      console.log(`❌ Test 9 FAILED: Expected 400 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🧪 Test 10: Unauthorized access (no token)');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots/today`);
    
    console.log(`❌ Test 10 FAILED: Expected 401 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(`✅ Status: 401 (Unauthorized)`);
      console.log(`✅ Test 10 PASSED: Unauthorized access properly blocked`);
      return true;
    } else {
      console.log(`❌ Test 10 FAILED: Expected 401 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testBusinessNotFound() {
  console.log('\n🧪 Test 11: Business not found (404)');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/non-existent-business-id/timeslots/week`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 11 FAILED: Expected 404 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`✅ Status: 404 (Not Found)`);
      console.log(`✅ Test 11 PASSED: Business not found properly handled`);
      return true;
    } else {
      console.log(`❌ Test 11 FAILED: Expected 404 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testServiceNotFound() {
  console.log('\n🧪 Test 12: Service not found (404)');
  
  const startDate = getFormattedDate(0);
  const endDate = getFormattedDate(2);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
      params: {
        startDate,
        endDate,
        serviceId: 'non-existent-service-id',
        slotInterval: 30
      },
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ Test 12 FAILED: Expected 404 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`✅ Status: 404 (Not Found)`);
      console.log(`✅ Test 12 PASSED: Service not found properly handled`);
      return true;
    } else {
      console.log(`❌ Test 12 FAILED: Expected 404 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

// Run all tests
async function runTests() {
  const results = [];
  
  console.log('🚀 Starting Time Slots Tests...\n');
  
  results.push(await testGetAvailableSlotsDateRange());
  results.push(await testGetTodayAvailableSlots());
  results.push(await testGetWeekAvailableSlots());
  results.push(await testCustomSlotInterval());
  results.push(await testServiceSpecificSlots());
  results.push(await testInvalidDateFormat());
  results.push(await testInvalidDateRange());
  results.push(await testDateRangeTooLarge());
  results.push(await testMissingRequiredParameters());
  results.push(await testUnauthorizedAccess());
  results.push(await testBusinessNotFound());
  results.push(await testServiceNotFound());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All time slots tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some time slots tests failed!');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});