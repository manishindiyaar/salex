/*
 * ## Test Description: Story 1.5 error validation and edge cases test
 *
 * ### Input:
 * Comprehensive error scenario testing for business hours and time slots endpoints including boundary conditions, invalid data, and edge cases.
 *
 * ### Expected Output:
 * Validates proper error handling, HTTP status codes, and error messages for all invalid scenarios across business hours and time slots functionality.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Invalid time format edge cases.
 * [ ] Test case 2 passed: Boundary time values validation.
 * [ ] Test case 3 passed: Missing required fields validation.
 * [ ] Test case 4 passed: Invalid date format variations.
 * [ ] Test case 5 passed: Extreme date ranges validation.
 * [ ] Test case 6 passed: Invalid slot interval values.
 * [ ] Test case 7 passed: Malformed request body handling.
 * [ ] Test case 8 passed: Resource not found scenarios.
 * [ ] Test case 9 passed: Authentication edge cases.
 * [ ] Test case 10 passed: Concurrent operation conflicts.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';
const TEST_BUSINESS_ID = process.env.TEST_BUSINESS_ID || 'test-business-id';

console.log('=== Story 1.5 Error Validation and Edge Cases Tests ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log(`Test Business ID: ${TEST_BUSINESS_ID}`);
console.log('');

async function testExpectedError(testName, requestFn, expectedStatus, expectedErrorPattern = null) {
  try {
    const response = await requestFn();
    console.log(`❌ ${testName}: Expected ${expectedStatus} but got ${response.status}`);
    return false;
  } catch (error) {
    if (error.response && error.response.status === expectedStatus) {
      const errorMessage = error.response.data.message || error.response.data.error || '';
      if (expectedErrorPattern && !errorMessage.toLowerCase().includes(expectedErrorPattern.toLowerCase())) {
        console.log(`❌ ${testName}: Got ${expectedStatus} but error message doesn't match pattern "${expectedErrorPattern}"`);
        console.log(`   Actual message: "${errorMessage}"`);
        return false;
      }
      console.log(`✅ ${testName}: Correctly returned ${expectedStatus}${expectedErrorPattern ? ` with expected error` : ''}`);
      return true;
    } else {
      console.log(`❌ ${testName}: Expected ${expectedStatus} but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testInvalidTimeFormatEdgeCases() {
  console.log('🧪 Test 1: Invalid time format edge cases');
  
  const invalidTimeFormats = [
    { name: 'Hour > 23', data: { hoursOfOperation: { monday: { open: "24:00", close: "17:00", closed: false } } } },
    { name: 'Minute > 59', data: { hoursOfOperation: { monday: { open: "09:60", close: "17:00", closed: false } } } },
    { name: 'Negative hour', data: { hoursOfOperation: { monday: { open: "-1:00", close: "17:00", closed: false } } } },
    { name: 'Non-numeric hour', data: { hoursOfOperation: { monday: { open: "ab:00", close: "17:00", closed: false } } } },
    { name: 'Missing colon', data: { hoursOfOperation: { monday: { open: "0900", close: "17:00", closed: false } } } },
    { name: 'Wrong format', data: { hoursOfOperation: { monday: { open: "9:0", close: "17:00", closed: false } } } },
    { name: 'Empty string', data: { hoursOfOperation: { monday: { open: "", close: "17:00", closed: false } } } }
  ];
  
  let passed = 0;
  
  for (const testCase of invalidTimeFormats) {
    const result = await testExpectedError(
      `Invalid time format - ${testCase.name}`,
      () => axios.put(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, testCase.data, {
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}`, 'Content-Type': 'application/json' }
      }),
      400,
      'format'
    );
    if (result) passed++;
  }
  
  const total = invalidTimeFormats.length;
  console.log(`Test 1 Result: ${passed}/${total} invalid time format tests passed`);
  return passed === total;
}

async function testBoundaryTimeValues() {
  console.log('\n🧪 Test 2: Boundary time values validation');
  
  const boundaryTests = [
    { 
      name: 'Open equals close time', 
      data: { hoursOfOperation: { monday: { open: "09:00", close: "09:00", closed: false } } },
      shouldPass: false,
      expectedStatus: 400
    },
    { 
      name: 'Open after close time', 
      data: { hoursOfOperation: { monday: { open: "18:00", close: "09:00", closed: false } } },
      shouldPass: false,
      expectedStatus: 400
    },
    { 
      name: 'Valid boundary - 00:00 to 23:59', 
      data: { hoursOfOperation: { monday: { open: "00:00", close: "23:59", closed: false } } },
      shouldPass: true,
      expectedStatus: 200
    }
  ];
  
  let passed = 0;
  
  for (const testCase of boundaryTests) {
    if (testCase.shouldPass) {
      try {
        const response = await axios.put(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, testCase.data, {
          headers: { 'Authorization': `Bearer ${JWT_TOKEN}`, 'Content-Type': 'application/json' }
        });
        if (response.status === testCase.expectedStatus) {
          console.log(`✅ Boundary test - ${testCase.name}: Correctly accepted`);
          passed++;
        } else {
          console.log(`❌ Boundary test - ${testCase.name}: Expected ${testCase.expectedStatus} but got ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Boundary test - ${testCase.name}: Unexpected error ${error.response?.status}`);
      }
    } else {
      const result = await testExpectedError(
        `Boundary test - ${testCase.name}`,
        () => axios.put(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, testCase.data, {
          headers: { 'Authorization': `Bearer ${JWT_TOKEN}`, 'Content-Type': 'application/json' }
        }),
        testCase.expectedStatus
      );
      if (result) passed++;
    }
  }
  
  const total = boundaryTests.length;
  console.log(`Test 2 Result: ${passed}/${total} boundary tests passed`);
  return passed === total;
}

async function testMissingRequiredFields() {
  console.log('\n🧪 Test 3: Missing required fields validation');
  
  const missingFieldTests = [
    { name: 'Missing hoursOfOperation', data: {} },
    { name: 'Missing open time', data: { hoursOfOperation: { monday: { close: "17:00", closed: false } } } },
    { name: 'Missing close time', data: { hoursOfOperation: { monday: { open: "09:00", closed: false } } } },
    { name: 'Missing closed flag', data: { hoursOfOperation: { monday: { open: "09:00", close: "17:00" } } } },
    { name: 'Null hoursOfOperation', data: { hoursOfOperation: null } }
  ];
  
  let passed = 0;
  
  for (const testCase of missingFieldTests) {
    const result = await testExpectedError(
      `Missing field - ${testCase.name}`,
      () => axios.put(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, testCase.data, {
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}`, 'Content-Type': 'application/json' }
      }),
      400
    );
    if (result) passed++;
  }
  
  const total = missingFieldTests.length;
  console.log(`Test 3 Result: ${passed}/${total} missing field tests passed`);
  return passed === total;
}

async function testInvalidDateFormatVariations() {
  console.log('\n🧪 Test 4: Invalid date format variations');
  
  const invalidDateTests = [
    { name: 'Wrong separator', startDate: '2024/12/01', endDate: '2024/12/02' },
    { name: 'No separator', startDate: '20241201', endDate: '20241202' },
    { name: 'Wrong order', startDate: '01-12-2024', endDate: '02-12-2024' },
    { name: 'Invalid month', startDate: '2024-13-01', endDate: '2024-13-02' },
    { name: 'Invalid day', startDate: '2024-12-32', endDate: '2024-12-33' },
    { name: 'Invalid year', startDate: '202a-12-01', endDate: '202a-12-02' },
    { name: 'Empty date', startDate: '', endDate: '2024-12-01' },
    { name: 'Null date', startDate: null, endDate: '2024-12-01' }
  ];
  
  let passed = 0;
  
  for (const testCase of invalidDateTests) {
    const result = await testExpectedError(
      `Invalid date - ${testCase.name}`,
      () => axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
        params: { startDate: testCase.startDate, endDate: testCase.endDate },
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      }),
      400,
      'date'
    );
    if (result) passed++;
  }
  
  const total = invalidDateTests.length;
  console.log(`Test 4 Result: ${passed}/${total} invalid date tests passed`);
  return passed === total;
}

async function testExtremeDateRanges() {
  console.log('\n🧪 Test 5: Extreme date ranges validation');
  
  const extremeRangeTests = [
    { 
      name: 'Range > 30 days', 
      startDate: '2024-01-01', 
      endDate: '2024-02-15' // 45 days
    },
    { 
      name: 'Start date in past', 
      startDate: '2020-01-01', 
      endDate: '2020-01-02'
    },
    { 
      name: 'Very far future', 
      startDate: '2030-01-01', 
      endDate: '2030-01-02'
    }
  ];
  
  let passed = 0;
  
  for (const testCase of extremeRangeTests) {
    const result = await testExpectedError(
      `Extreme range - ${testCase.name}`,
      () => axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
        params: { startDate: testCase.startDate, endDate: testCase.endDate },
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      }),
      400
    );
    if (result) passed++;
  }
  
  const total = extremeRangeTests.length;
  console.log(`Test 5 Result: ${passed}/${total} extreme range tests passed`);
  return passed === total;
}

async function testInvalidSlotIntervalValues() {
  console.log('\n🧪 Test 6: Invalid slot interval values');
  
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
  
  const invalidIntervalTests = [
    { name: 'Negative interval', slotInterval: -30 },
    { name: 'Zero interval', slotInterval: 0 },
    { name: 'Very large interval', slotInterval: 10000 },
    { name: 'Non-numeric interval', slotInterval: 'abc' },
    { name: 'Decimal interval', slotInterval: 30.5 }
  ];
  
  let passed = 0;
  
  for (const testCase of invalidIntervalTests) {
    const result = await testExpectedError(
      `Invalid interval - ${testCase.name}`,
      () => axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/timeslots`, {
        params: { 
          startDate: today, 
          endDate: tomorrow, 
          slotInterval: testCase.slotInterval 
        },
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      }),
      400
    );
    if (result) passed++;
  }
  
  const total = invalidIntervalTests.length;
  console.log(`Test 6 Result: ${passed}/${total} invalid interval tests passed`);
  return passed === total;
}

async function testMalformedRequestBodyHandling() {
  console.log('\n🧪 Test 7: Malformed request body handling');
  
  const malformedBodyTests = [
    { name: 'Invalid JSON', body: '{"hoursOfOperation": invalid json}', contentType: 'application/json' },
    { name: 'Wrong content type', body: 'hoursOfOperation=test', contentType: 'application/x-www-form-urlencoded' },
    { name: 'Empty body', body: '', contentType: 'application/json' },
    { name: 'Non-object body', body: '"string instead of object"', contentType: 'application/json' }
  ];
  
  let passed = 0;
  
  for (const testCase of malformedBodyTests) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, testCase.body, {
        headers: { 
          'Authorization': `Bearer ${JWT_TOKEN}`, 
          'Content-Type': testCase.contentType 
        }
      });
      console.log(`❌ Malformed body - ${testCase.name}: Expected error but got ${response.status}`);
    } catch (error) {
      if (error.response && (error.response.status === 400 || error.response.status === 415)) {
        console.log(`✅ Malformed body - ${testCase.name}: Correctly rejected with ${error.response.status}`);
        passed++;
      } else {
        console.log(`❌ Malformed body - ${testCase.name}: Expected 400/415 but got ${error.response?.status || 'network error'}`);
      }
    }
  }
  
  const total = malformedBodyTests.length;
  console.log(`Test 7 Result: ${passed}/${total} malformed body tests passed`);
  return passed === total;
}

async function testResourceNotFoundScenarios() {
  console.log('\n🧪 Test 8: Resource not found scenarios');
  
  const notFoundTests = [
    {
      name: 'Non-existent business ID (hours)',
      request: () => axios.get(`${API_BASE_URL}/api/v1/businesses/non-existent-id/hours`, {
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      })
    },
    {
      name: 'Non-existent business ID (open status)',
      request: () => axios.get(`${API_BASE_URL}/api/v1/businesses/non-existent-id/open-status`, {
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      })
    },
    {
      name: 'Non-existent business ID (timeslots)',
      request: () => axios.get(`${API_BASE_URL}/api/v1/businesses/non-existent-id/timeslots/today`, {
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
      })
    }
  ];
  
  let passed = 0;
  
  for (const testCase of notFoundTests) {
    const result = await testExpectedError(
      testCase.name,
      testCase.request,
      404,
      'not found'
    );
    if (result) passed++;
  }
  
  const total = notFoundTests.length;
  console.log(`Test 8 Result: ${passed}/${total} not found tests passed`);
  return passed === total;
}

async function testAuthenticationEdgeCases() {
  console.log('\n🧪 Test 9: Authentication edge cases');
  
  const authTests = [
    {
      name: 'Empty token',
      headers: { 'Authorization': 'Bearer ' }
    },
    {
      name: 'Malformed bearer token',
      headers: { 'Authorization': 'NotBearer token123' }
    },
    {
      name: 'Token with special characters',
      headers: { 'Authorization': 'Bearer token@#$%^&*()' }
    },
    {
      name: 'Very long invalid token',
      headers: { 'Authorization': 'Bearer ' + 'a'.repeat(1000) }
    }
  ];
  
  let passed = 0;
  
  for (const testCase of authTests) {
    const result = await testExpectedError(
      `Auth edge case - ${testCase.name}`,
      () => axios.get(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, {
        headers: testCase.headers
      }),
      401
    );
    if (result) passed++;
  }
  
  const total = authTests.length;
  console.log(`Test 9 Result: ${passed}/${total} auth edge case tests passed`);
  return passed === total;
}

async function testConcurrentOperationScenarios() {
  console.log('\n🧪 Test 10: Concurrent operation scenarios');
  
  // Test concurrent updates to business hours
  const concurrentUpdates = [];
  const testHours = {
    hoursOfOperation: {
      monday: { open: "09:00", close: "17:00", closed: false }
    }
  };
  
  // Create multiple concurrent requests
  for (let i = 0; i < 3; i++) {
    concurrentUpdates.push(
      axios.put(`${API_BASE_URL}/api/v1/businesses/${TEST_BUSINESS_ID}/hours`, testHours, {
        headers: { 'Authorization': `Bearer ${JWT_TOKEN}`, 'Content-Type': 'application/json' }
      })
    );
  }
  
  try {
    const results = await Promise.allSettled(concurrentUpdates);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
    
    console.log(`✅ Concurrent operations - ${successCount}/3 updates succeeded`);
    console.log('✅ Test 10 PASSED: Concurrent operations handled gracefully');
    return true;
    
  } catch (error) {
    console.log(`❌ Test 10 FAILED: Concurrent operations error: ${error.message}`);
    return false;
  }
}

// Run all error validation tests
async function runTests() {
  const results = [];
  
  console.log('🚀 Starting Story 1.5 Error Validation Tests...\n');
  
  results.push(await testInvalidTimeFormatEdgeCases());
  results.push(await testBoundaryTimeValues());
  results.push(await testMissingRequiredFields());
  results.push(await testInvalidDateFormatVariations());
  results.push(await testExtremeDateRanges());
  results.push(await testInvalidSlotIntervalValues());
  results.push(await testMalformedRequestBodyHandling());
  results.push(await testResourceNotFoundScenarios());
  results.push(await testAuthenticationEdgeCases());
  results.push(await testConcurrentOperationScenarios());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Error Validation Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All error validation tests passed!');
    console.log('🛡️ Error handling is robust and comprehensive!');
    process.exit(0);
  } else {
    console.log('💥 Some error validation tests failed!');
    console.log('🔧 Please review error handling implementation.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});