/*
 * ## Test Description: User synchronization test for user creation and retrieval from database
 *
 * ### Input:
 * GET requests to /api/v1/auth/me with valid JWT to trigger user sync and verify database operations.
 *
 * ### Expected Output:
 * Successful user synchronization with database, user record creation/retrieval working correctly.
 *
 * ### Passes:
 * [ ] User synchronization from JWT claims passed.
 * [ ] Database user record creation/update passed.
 * [ ] User data consistency verification passed.
 */

const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file

// Configuration from environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const VALID_JWT_TOKEN = process.env.CLERK_JWT_TOKEN; // User must provide this

console.log('👤 Starting User Synchronization Tests');
console.log('='.repeat(50));
console.log(`API Base URL: ${API_BASE_URL}`);
console.log('');

async function testUserSyncFromJWT() {
  console.log('Test 1: User Synchronization from JWT Claims');
  console.log('-'.repeat(45));

  if (!VALID_JWT_TOKEN) {
    console.log('❌ SKIPPED: CLERK_JWT_TOKEN environment variable not provided');
    console.log('   Please set CLERK_JWT_TOKEN with a valid Clerk JWT token');
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
      console.log(`✅ Created At: ${userData.createdAt}`);
      console.log(`✅ Updated At: ${userData.updatedAt}`);
      
      // Verify required fields are present
      if (!userData.id || !userData.email) {
        console.log('❌ Missing required user fields (id or email)');
        console.log('');
        return false;
      }
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

async function testUserDataConsistency() {
  console.log('Test 2: User Data Consistency Verification');
  console.log('-'.repeat(45));

  if (!VALID_JWT_TOKEN) {
    console.log('❌ SKIPPED: CLERK_JWT_TOKEN environment variable not provided');
    console.log('');
    return false;
  }

  try {
    // Make two sequential requests to verify data consistency
    const firstResponse = await axios.get(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Wait a moment and make another request
    await new Promise(resolve => setTimeout(resolve, 100));

    const secondResponse = await axios.get(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const userData1 = firstResponse.data.data;
    const userData2 = secondResponse.data.data;

    // Verify both requests were successful
    if (!userData1 || !userData2) {
      console.log('❌ One or both requests failed to return user data');
      console.log('');
      return false;
    }

    // Verify data consistency
    const consistencyChecks = [
      { field: 'id', val1: userData1.id, val2: userData2.id },
      { field: 'email', val1: userData1.email, val2: userData2.email },
      { field: 'firstName', val1: userData1.firstName, val2: userData2.firstName },
      { field: 'lastName', val1: userData1.lastName, val2: userData2.lastName },
      { field: 'phone', val1: userData1.phone, val2: userData2.phone },
      { field: 'createdAt', val1: userData1.createdAt, val2: userData2.createdAt },
    ];

    let allConsistent = true;
    for (const check of consistencyChecks) {
      if (check.val1 !== check.val2) {
        console.log(`❌ ${check.field} inconsistent: "${check.val1}" vs "${check.val2}"`);
        allConsistent = false;
      } else {
        console.log(`✅ ${check.field}: Consistent`);
      }
    }

    // updatedAt might change, so we just verify it exists and is valid
    if (userData1.updatedAt && userData2.updatedAt) {
      const updated1 = new Date(userData1.updatedAt);
      const updated2 = new Date(userData2.updatedAt);
      if (updated2 >= updated1) {
        console.log(`✅ updatedAt: Valid progression (${userData1.updatedAt} -> ${userData2.updatedAt})`);
      } else {
        console.log(`❌ updatedAt: Invalid regression (${userData1.updatedAt} -> ${userData2.updatedAt})`);
        allConsistent = false;
      }
    }

    console.log('');
    return allConsistent;
  } catch (error) {
    if (error.response) {
      console.log(`❌ Status: ${error.response.status}`);
      console.log(`❌ Error: ${error.response.data?.error || error.response.statusText}`);
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
    console.log('');
    return false;
  }
}

async function testDatabaseHealthCheck() {
  console.log('Test 3: Database Health Check');
  console.log('-'.repeat(30));

  if (!VALID_JWT_TOKEN) {
    console.log('❌ SKIPPED: CLERK_JWT_TOKEN environment variable not provided');
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
      
      if (healthData.status !== 'authenticated') {
        console.log('❌ Expected status to be "authenticated"');
        console.log('');
        return false;
      }
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
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
    console.log('');
    return false;
  }
}

async function runAllTests() {
  const results = [];
  
  console.log('Starting user synchronization tests...\n');
  
  results.push(await testUserSyncFromJWT());
  results.push(await testUserDataConsistency());
  results.push(await testDatabaseHealthCheck());

  console.log('='.repeat(50));
  console.log('👤 User Synchronization Test Results');
  console.log('='.repeat(50));
  
  const passedTests = results.filter(result => result === true).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`${passedTests === totalTests ? '🎉' : '⚠️'} Overall: ${passedTests === totalTests ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (passedTests < totalTests) {
    console.log('\n📝 Notes:');
    console.log('- Ensure the API server is running and connected to database');
    console.log('- Set CLERK_JWT_TOKEN environment variable with a valid Clerk JWT token');
    console.log('- Verify database migrations have been applied (pnpm db:push)');
    console.log('- Check Supabase/PostgreSQL is running (supabase start)');
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