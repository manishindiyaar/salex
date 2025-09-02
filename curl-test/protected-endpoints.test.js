/*
 * ## Test Description: Protected endpoints test for /auth/me, /businesses/me, /auth/health
 *
 * ### Input:
 * GET requests to all protected endpoints with valid JWT tokens to verify complete authentication integration.
 *
 * ### Expected Output:
 * All protected endpoints return 200 OK with proper response structure and user/business data.
 *
 * ### Passes:
 * [ ] /api/v1/auth/me endpoint test passed.
 * [ ] /api/v1/businesses/me endpoint test passed.
 * [ ] /api/v1/auth/health endpoint test passed.
 */

const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file

// Configuration from environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const VALID_JWT_TOKEN = process.env.FIREBASE_ID_TOKEN; // Provide a valid Firebase ID token

console.log('🔒 Starting Protected Endpoints Tests');
console.log('='.repeat(50));
console.log(`API Base URL: ${API_BASE_URL}`);
console.log('');

async function testAuthMeEndpoint() {
  console.log('Test 1: /api/v1/auth/me Endpoint');
  console.log('-'.repeat(35));

  if (!VALID_JWT_TOKEN) {
    console.log('❌ SKIPPED: FIREBASE_ID_TOKEN environment variable not provided');
    console.log('   Please set FIREBASE_ID_TOKEN with a valid Firebase ID token');
    console.log('');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${response.data.success}`);
    console.log(`✅ Message: ${response.data.message}`);
    
    const userData = response.data.data;
    if (userData) {
      console.log(`✅ User ID: ${userData.id}`);
      console.log(`✅ Email: ${userData.email}`);
      console.log(`✅ First Name: ${userData.firstName || 'Not provided'}`);
      console.log(`✅ Last Name: ${userData.lastName || 'Not provided'}`);
      console.log(`✅ Phone: ${userData.phone || 'Not provided'}`);
      console.log(`✅ Profile Image: ${userData.profileImageUrl || 'Not provided'}`);
      console.log(`✅ Created At: ${userData.createdAt}`);
      console.log(`✅ Updated At: ${userData.updatedAt}`);
      
      // Verify response structure
      if (response.data.success !== true) {
        console.log('❌ Response success should be true');
        return false;
      }
      
      if (!userData.id || !userData.email) {
        console.log('❌ Missing required user fields (id or email)');
        return false;
      }
      
      console.log('✅ Response structure: Valid');
    } else {
      console.log('❌ No user data returned');
      console.log('');
      return false;
    }
    
    console.log('');
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`❌ Error: ${error.response.data?.error || error.response.statusText}`);
      console.log(`❌ Details: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
    console.log('');
    return false;
  }
}

async function testBusinessesMeEndpoint() {
  console.log('Test 2: /api/v1/businesses/me Endpoint');
  console.log('-'.repeat(40));

  if (!VALID_JWT_TOKEN) {
    console.log('❌ SKIPPED: FIREBASE_ID_TOKEN environment variable not provided');
    console.log('');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/me`, {
      headers: {
        'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${response.data.success}`);
    console.log(`✅ Message: ${response.data.message}`);
    
    const businessData = response.data.data;
    if (businessData) {
      console.log(`✅ User ID: ${businessData.userId}`);
      console.log(`✅ User Email: ${businessData.userEmail}`);
      
      if (businessData.business) {
        console.log(`✅ Business ID: ${businessData.business.id}`);
        console.log(`✅ Business Name: ${businessData.business.name}`);
        console.log(`✅ Business Phone: ${businessData.business.phone || 'Not provided'}`);
        console.log(`✅ WhatsApp Number: ${businessData.business.whatsappPhoneNumber || 'Not provided'}`);
        console.log(`✅ Business Status: ${businessData.business.status}`);
        console.log(`✅ Created At: ${businessData.business.createdAt}`);
        console.log(`✅ Updated At: ${businessData.business.updatedAt}`);
      } else {
        console.log(`✅ Business: None (User has no business yet)`);
      }
      
      // Verify response structure
      if (response.data.success !== true) {
        console.log('❌ Response success should be true');
        return false;
      }
      
      if (!businessData.userId || !businessData.userEmail) {
        console.log('❌ Missing required business response fields (userId or userEmail)');
        return false;
      }
      
      console.log('✅ Response structure: Valid');
    } else {
      console.log('❌ No business data returned');
      console.log('');
      return false;
    }
    
    console.log('');
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`❌ Error: ${error.response.data?.error || error.response.statusText}`);
      console.log(`❌ Details: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
    console.log('');
    return false;
  }
}

async function testAuthHealthEndpoint() {
  console.log('Test 3: /api/v1/auth/health Endpoint');
  console.log('-'.repeat(38));

  if (!VALID_JWT_TOKEN) {
    console.log('❌ SKIPPED: FIREBASE_ID_TOKEN environment variable not provided');
    console.log('');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/auth/health`, {
      headers: {
        'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${response.data.success}`);
    console.log(`✅ Message: ${response.data.message}`);
    
    const healthData = response.data.data;
    if (healthData) {
      console.log(`✅ Auth Status: ${healthData.status}`);
      console.log(`✅ User ID: ${healthData.userId}`);
      
      // Verify response structure
      if (response.data.success !== true) {
        console.log('❌ Response success should be true');
        return false;
      }
      
      if (healthData.status !== 'authenticated') {
        console.log('❌ Expected status to be "authenticated"');
        return false;
      }
      
      if (!healthData.userId) {
        console.log('❌ Missing userId in health response');
        return false;
      }
      
      console.log('✅ Response structure: Valid');
    } else {
      console.log('❌ No health data returned');
      console.log('');
      return false;
    }
    
    console.log('');
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`❌ Error: ${error.response.data?.error || error.response.statusText}`);
      console.log(`❌ Details: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
    console.log('');
    return false;
  }
}

async function testEndpointPerformance() {
  console.log('Test 4: Endpoint Performance Check');
  console.log('-'.repeat(35));

  if (!VALID_JWT_TOKEN) {
    console.log('❌ SKIPPED: CLERK_JWT_TOKEN environment variable not provided');
    console.log('');
    return false;
  }

  const endpoints = [
    { name: 'auth/me', url: `${API_BASE_URL}/api/v1/auth/me` },
    { name: 'businesses/me', url: `${API_BASE_URL}/api/v1/businesses/me` },
    { name: 'auth/health', url: `${API_BASE_URL}/api/v1/auth/health` }
  ];

  try {
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      const response = await axios.get(endpoint.url, {
        headers: {
          'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ ${endpoint.name}: ${responseTime}ms (Status: ${response.status})`);
      
      if (responseTime > 5000) {
        console.log(`⚠️  ${endpoint.name}: Slow response (>5s)`);
      }
    }
    
    console.log('');
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ Performance test failed: ${error.response.status}`);
      console.log(`❌ Error: ${error.response.data?.error || error.response.statusText}`);
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
    console.log('');
    return false;
  }
}

async function runAllTests() {
  const results = [];
  
  console.log('Starting protected endpoints tests...\n');
  
  results.push(await testAuthMeEndpoint());
  results.push(await testBusinessesMeEndpoint());
  results.push(await testAuthHealthEndpoint());
  results.push(await testEndpointPerformance());

  console.log('='.repeat(50));
  console.log('🔒 Protected Endpoints Test Results');
  console.log('='.repeat(50));
  
  const passedTests = results.filter(result => result === true).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`${passedTests === totalTests ? '🎉' : '⚠️'} Overall: ${passedTests === totalTests ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (passedTests < totalTests) {
    console.log('\n📝 Notes:');
    console.log('- Ensure the API server is running on the configured port');
    console.log('- Set FIREBASE_ID_TOKEN environment variable with a valid Firebase ID token');
    console.log('- Verify all protected endpoints are properly configured with FirebaseAuthGuard');
    console.log('- Check database connectivity for business data queries');
  }
  
  console.log('');
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('❌ Fatal error running tests:', error.message);
  process.exit(1);
});
