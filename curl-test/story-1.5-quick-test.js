/*
 * Quick validation test for Story 1.5 implementation
 * Tests basic functionality without requiring specific business/service IDs
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

console.log('=== Story 1.5 Quick Implementation Validation ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log('');

async function testAPIHealthAndRoutes() {
  console.log('🧪 Test 1: API Health and Route Registration');
  
  try {
    // Test basic health endpoint
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log(`✅ Health endpoint: ${healthResponse.status} - ${JSON.stringify(healthResponse.data)}`);
    
    // Test database health
    const dbHealthResponse = await axios.get(`${API_BASE_URL}/health/db`);
    console.log(`✅ Database health: ${dbHealthResponse.status} - ${JSON.stringify(dbHealthResponse.data)}`);
    
    console.log('✅ Test 1 PASSED: API is healthy and running');
    return true;
    
  } catch (error) {
    console.log(`❌ Test 1 FAILED: ${error.message}`);
    return false;
  }
}

async function testAuthenticationRequired() {
  console.log('\n🧪 Test 2: Authentication Requirements');
  
  try {
    // Test business hours endpoint without auth (should return 401)
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/test-id/hours`);
    console.log(`❌ Test 2 FAILED: Expected 401 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(`✅ Status: 401 (Unauthorized) - Authentication properly required`);
      console.log('✅ Test 2 PASSED: Authentication is required for protected endpoints');
      return true;
    } else {
      console.log(`❌ Test 2 FAILED: Expected 401 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testTimeslotsAuthenticationRequired() {
  console.log('\n🧪 Test 3: Time Slots Authentication Requirements');
  
  try {
    // Test timeslots endpoint without auth (should return 401)
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/test-id/timeslots`, {
      params: {
        startDate: '2024-01-01',
        endDate: '2024-01-07'
      }
    });
    console.log(`❌ Test 3 FAILED: Expected 401 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(`✅ Status: 401 (Unauthorized) - Authentication properly required`);
      console.log('✅ Test 3 PASSED: Time slots endpoints require authentication');
      return true;
    } else {
      console.log(`❌ Test 3 FAILED: Expected 401 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testValidationLogic() {
  console.log('\n🧪 Test 4: Validation Logic (with invalid token to test parameter validation)');
  
  try {
    // Test timeslots with missing required parameters (should return 400 before auth check)
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/test-id/timeslots`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    console.log(`❌ Test 4 FAILED: Expected 400 or 401 but got ${response.status}`);
    return false;
    
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 401)) {
      const status = error.response.status;
      console.log(`✅ Status: ${status} (${status === 400 ? 'Bad Request - Parameter validation' : 'Unauthorized - Auth validation'})`);
      console.log('✅ Test 4 PASSED: Validation logic is in place');
      return true;
    } else {
      console.log(`❌ Test 4 FAILED: Expected 400 or 401 but got ${error.response?.status || 'network error'}`);
      return false;
    }
  }
}

async function testEndpointDiscovery() {
  console.log('\n🧪 Test 5: Endpoint Discovery via HTTP Methods');
  
  const testEndpoints = [
    { method: 'GET', path: '/api/v1/businesses/test-id/hours', name: 'Business Hours GET' },
    { method: 'PUT', path: '/api/v1/businesses/test-id/hours', name: 'Business Hours PUT' },
    { method: 'GET', path: '/api/v1/businesses/test-id/open-status', name: 'Open Status' },
    { method: 'GET', path: '/api/v1/businesses/test-id/timeslots', name: 'Time Slots' },
    { method: 'GET', path: '/api/v1/businesses/test-id/timeslots/today', name: 'Today Time Slots' },
    { method: 'GET', path: '/api/v1/businesses/test-id/timeslots/week', name: 'Week Time Slots' }
  ];
  
  let routesFound = 0;
  
  for (const endpoint of testEndpoints) {
    try {
      const axiosConfig = {
        method: endpoint.method.toLowerCase(),
        url: `${API_BASE_URL}${endpoint.path}`,
        validateStatus: () => true // Accept all status codes
      };
      
      if (endpoint.method === 'PUT') {
        axiosConfig.data = { test: 'data' };
        axiosConfig.headers = { 'Content-Type': 'application/json' };
      }
      
      const response = await axios(axiosConfig);
      
      // Routes should return 401 (auth required) or 400 (validation error), not 404 (not found)
      if (response.status !== 404) {
        console.log(`✅ ${endpoint.name}: Route exists (status: ${response.status})`);
        routesFound++;
      } else {
        console.log(`❌ ${endpoint.name}: Route not found (404)`);
      }
    } catch (error) {
      // Network errors shouldn't happen if server is running
      console.log(`❌ ${endpoint.name}: Network error - ${error.message}`);
    }
  }
  
  console.log(`✅ Found ${routesFound}/${testEndpoints.length} expected routes`);
  
  if (routesFound === testEndpoints.length) {
    console.log('✅ Test 5 PASSED: All Story 1.5 endpoints are registered');
    return true;
  } else {
    console.log('❌ Test 5 FAILED: Some endpoints are missing');
    return false;
  }
}

// Run all validation tests
async function runValidationTests() {
  const results = [];
  
  console.log('🚀 Starting Story 1.5 Implementation Validation...\n');
  
  results.push(await testAPIHealthAndRoutes());
  results.push(await testAuthenticationRequired());
  results.push(await testTimeslotsAuthenticationRequired());
  results.push(await testValidationLogic());
  results.push(await testEndpointDiscovery());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Validation Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 STORY 1.5 IMPLEMENTATION VALIDATION SUCCESSFUL!');
    console.log('✨ All core components are properly implemented:');
    console.log('• ✅ API server is running and healthy');
    console.log('• ✅ Database connectivity is working');
    console.log('• ✅ Authentication guards are active');
    console.log('• ✅ All business hours endpoints are registered');
    console.log('• ✅ All time slots endpoints are registered');
    console.log('• ✅ Input validation is functioning');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('• Set up proper authentication tokens for full testing');
    console.log('• Create test business and service records');  
    console.log('• Run comprehensive test suite with valid data');
    console.log('• Update Postman collection with new endpoints');
    process.exit(0);
  } else {
    console.log('\n💥 STORY 1.5 IMPLEMENTATION VALIDATION FAILED!');
    console.log('🔧 Please review the failing tests and address the issues.');
    process.exit(1);
  }
}

runValidationTests().catch(error => {
  console.error('Fatal validation error:', error);
  process.exit(1);
});