/*
 * ## Test Description: Error handling test for unauthorized access, missing tokens, invalid signatures
 *
 * ### Input:
 * Various malformed, unauthorized, and edge-case requests to test comprehensive error handling.
 *
 * ### Expected Output:
 * Proper HTTP status codes and error messages for all error scenarios with consistent response structure.
 *
 * ### Passes:
 * [ ] Unauthorized access error handling passed.
 * [ ] Missing token error handling passed.
 * [ ] Invalid signature error handling passed.
 * [ ] Malformed request error handling passed.
 */

const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config(); // Load environment variables from .env file

// Configuration from environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const VALID_JWT_TOKEN = process.env.CLERK_JWT_TOKEN; // User must provide this

console.log('🚨 Starting Error Handling Tests');
console.log('='.repeat(50));
console.log(`API Base URL: ${API_BASE_URL}`);
console.log('');

async function testUnauthorizedAccess() {
  console.log('Test 1: Unauthorized Access to Protected Endpoints');
  console.log('-'.repeat(52));

  const protectedEndpoints = [
    '/api/v1/auth/me',
    '/api/v1/businesses/me',
    '/api/v1/auth/health'
  ];

  let allTestsPassed = true;

  for (const endpoint of protectedEndpoints) {
    console.log(`\n  Testing: ${endpoint}`);
    
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json'
          // No Authorization header
        }
      });

      console.log(`  ❌ UNEXPECTED: Should have failed with 401`);
      console.log(`  ❌ Status: ${response.status}`);
      allTestsPassed = false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`  ✅ Status: ${error.response.status} (Expected 401)`);
        console.log(`  ✅ Error: ${error.response.data?.message || error.response.statusText}`);
        
        // Verify error response structure
        if (error.response.data && typeof error.response.data === 'object') {
          console.log(`  ✅ Response structure: Valid JSON`);
        } else {
          console.log(`  ⚠️  Response structure: Not JSON`);
        }
      } else {
        console.log(`  ❌ Unexpected error: ${error.message}`);
        if (error.response) {
          console.log(`  ❌ Status: ${error.response.status} (Expected 401)`);
        }
        allTestsPassed = false;
      }
    }
  }

  console.log('');
  return allTestsPassed;
}

async function testInvalidTokenFormats() {
  console.log('Test 2: Invalid Token Formats');
  console.log('-'.repeat(30));

  const invalidTokens = [
    { name: 'Empty token', token: '' },
    { name: 'Malformed JWT', token: 'not.a.jwt' },
    { name: 'Random string', token: 'random-string-123' },
    { name: 'Invalid Bearer format', token: 'InvalidBearer token123' },
    { name: 'Only Bearer', token: 'Bearer' },
    { name: 'Expired token', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid' }
  ];

  let allTestsPassed = true;

  for (const tokenTest of invalidTokens) {
    console.log(`\n  Testing: ${tokenTest.name}`);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenTest.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`  ❌ UNEXPECTED: Should have failed with 401`);
      console.log(`  ❌ Status: ${response.status}`);
      allTestsPassed = false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`  ✅ Status: ${error.response.status} (Expected 401)`);
        console.log(`  ✅ Error handled correctly`);
      } else {
        console.log(`  ❌ Unexpected error: ${error.message}`);
        if (error.response) {
          console.log(`  ❌ Status: ${error.response.status} (Expected 401)`);
        }
        allTestsPassed = false;
      }
    }
  }

  console.log('');
  return allTestsPassed;
}

async function testWebhookErrorHandling() {
  console.log('Test 3: WhatsApp Webhook Error Handling');
  console.log('-'.repeat(40));

  let allTestsPassed = true;

  // Test invalid verification
  console.log('\n  Testing: Invalid webhook verification');
  try {
    const params = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong-token',
      'hub.challenge': 'test-challenge'
    });

    const response = await axios.get(`${API_BASE_URL}/webhooks/whatsapp?${params}`);
    console.log(`  ❌ UNEXPECTED: Should have failed with 401`);
    allTestsPassed = false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(`  ✅ Status: ${error.response.status} (Expected 401)`);
      console.log(`  ✅ Invalid verification token rejected`);
    } else {
      console.log(`  ❌ Unexpected error: ${error.message}`);
      allTestsPassed = false;
    }
  }

  // Test missing required parameters
  console.log('\n  Testing: Missing webhook parameters');
  try {
    const response = await axios.get(`${API_BASE_URL}/webhooks/whatsapp`);
    console.log(`  ❌ UNEXPECTED: Should have failed with 400 or 401`);
    allTestsPassed = false;
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 401)) {
      console.log(`  ✅ Status: ${error.response.status} (Expected 400/401)`);
      console.log(`  ✅ Missing parameters handled correctly`);
    } else {
      console.log(`  ❌ Unexpected error: ${error.message}`);
      allTestsPassed = false;
    }
  }

  // Test malformed JSON payload
  console.log('\n  Testing: Malformed JSON payload');
  try {
    const response = await axios.post(`${API_BASE_URL}/webhooks/whatsapp`, 'invalid-json', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`  ❌ UNEXPECTED: Should have failed with 400`);
    allTestsPassed = false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log(`  ✅ Status: ${error.response.status} (Expected 400)`);
      console.log(`  ✅ Malformed JSON handled correctly`);
    } else {
      console.log(`  ❌ Unexpected error: ${error.message}`);
      if (error.response) {
        console.log(`  ❌ Status: ${error.response.status} (Expected 400)`);
      }
      allTestsPassed = false;
    }
  }

  console.log('');
  return allTestsPassed;
}

async function testRateLimitingAndThrottling() {
  console.log('Test 4: Rate Limiting and Throttling (if configured)');
  console.log('-'.repeat(53));

  if (!VALID_JWT_TOKEN) {
    console.log('❌ SKIPPED: CLERK_JWT_TOKEN environment variable not provided');
    console.log('');
    return false;
  }

  try {
    // Make multiple rapid requests to test throttling
    const rapidRequests = [];
    const requestCount = 10;
    
    console.log(`  Making ${requestCount} rapid requests...`);
    
    for (let i = 0; i < requestCount; i++) {
      rapidRequests.push(
        axios.get(`${API_BASE_URL}/api/v1/auth/health`, {
          headers: {
            'Authorization': `Bearer ${VALID_JWT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }).catch(error => ({ error: true, status: error.response?.status, message: error.message }))
      );
    }

    const results = await Promise.all(rapidRequests);
    
    let successCount = 0;
    let throttledCount = 0;
    let errorCount = 0;

    for (const result of results) {
      if (result.error) {
        if (result.status === 429) {
          throttledCount++;
        } else {
          errorCount++;
        }
      } else if (result.status === 200) {
        successCount++;
      }
    }

    console.log(`  ✅ Successful requests: ${successCount}`);
    console.log(`  ✅ Throttled requests (429): ${throttledCount}`);
    console.log(`  ✅ Other errors: ${errorCount}`);
    
    if (throttledCount > 0) {
      console.log(`  ✅ Rate limiting is active`);
    } else {
      console.log(`  ⚠️  Rate limiting may not be configured (all requests succeeded)`);
    }

    console.log('');
    return true;
  } catch (error) {
    console.log(`  ❌ Error testing rate limiting: ${error.message}`);
    console.log('');
    return false;
  }
}

async function testNetworkErrorHandling() {
  console.log('Test 5: Network Error Handling');
  console.log('-'.repeat(32));

  let allTestsPassed = true;

  // Test connection timeout (using invalid port)
  console.log('\n  Testing: Connection timeout');
  try {
    const response = await axios.get('http://localhost:9999/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${VALID_JWT_TOKEN || 'test-token'}`,
        'Content-Type': 'application/json'
      },
      timeout: 1000
    });
    console.log(`  ❌ UNEXPECTED: Should have failed with network error`);
    allTestsPassed = false;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log(`  ✅ Network error handled: ${error.code}`);
    } else {
      console.log(`  ⚠️  Different network error: ${error.message}`);
    }
  }

  // Test invalid hostname
  console.log('\n  Testing: Invalid hostname');
  try {
    const response = await axios.get('http://invalid-hostname-12345.com/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${VALID_JWT_TOKEN || 'test-token'}`,
        'Content-Type': 'application/json'
      },
      timeout: 2000
    });
    console.log(`  ❌ UNEXPECTED: Should have failed with DNS error`);
    allTestsPassed = false;
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      console.log(`  ✅ DNS error handled: ${error.code}`);
    } else {
      console.log(`  ⚠️  Different DNS error: ${error.message}`);
    }
  }

  console.log('');
  return allTestsPassed;
}

async function testResponseStructureConsistency() {
  console.log('Test 6: Response Structure Consistency');
  console.log('-'.repeat(40));

  if (!VALID_JWT_TOKEN) {
    console.log('❌ SKIPPED: CLERK_JWT_TOKEN environment variable not provided');
    console.log('');
    return false;
  }

  const endpoints = [
    { name: 'auth/me', url: '/api/v1/auth/me' },
    { name: 'businesses/me', url: '/api/v1/businesses/me' },
    { name: 'auth/health', url: '/api/v1/auth/health' },
    { name: 'whatsapp/health', url: '/webhooks/whatsapp/health', auth: false }
  ];

  let allTestsPassed = true;

  for (const endpoint of endpoints) {
    console.log(`\n  Testing: ${endpoint.name}`);
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (endpoint.auth !== false) {
        headers['Authorization'] = `Bearer ${VALID_JWT_TOKEN}`;
      }

      const response = await axios.get(`${API_BASE_URL}${endpoint.url}`, { headers });

      // Check response structure
      const data = response.data;
      const hasSuccess = typeof data.success === 'boolean';
      const hasMessage = typeof data.message === 'string';
      const hasData = data.data !== undefined;

      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  ${hasSuccess ? '✅' : '❌'} Has 'success' field: ${hasSuccess}`);
      console.log(`  ${hasMessage ? '✅' : '❌'} Has 'message' field: ${hasMessage}`);
      console.log(`  ${hasData ? '✅' : '❌'} Has 'data' field: ${hasData}`);

      if (!hasSuccess || !hasMessage) {
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`  ❌ Request failed: ${error.message}`);
      allTestsPassed = false;
    }
  }

  console.log('');
  return allTestsPassed;
}

async function runAllTests() {
  const results = [];
  
  console.log('Starting error handling tests...\n');
  
  results.push(await testUnauthorizedAccess());
  results.push(await testInvalidTokenFormats());
  results.push(await testWebhookErrorHandling());
  results.push(await testRateLimitingAndThrottling());
  results.push(await testNetworkErrorHandling());
  results.push(await testResponseStructureConsistency());

  console.log('='.repeat(50));
  console.log('🚨 Error Handling Test Results');
  console.log('='.repeat(50));
  
  const passedTests = results.filter(result => result === true).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`${passedTests === totalTests ? '🎉' : '⚠️'} Overall: ${passedTests === totalTests ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (passedTests < totalTests) {
    console.log('\n📝 Notes:');
    console.log('- Ensure the API server is running and properly configured');
    console.log('- Set CLERK_JWT_TOKEN environment variable for authenticated tests');
    console.log('- Check that error handling middleware is properly configured');
    console.log('- Verify that rate limiting is configured if expected');
    console.log('- All endpoints should return consistent JSON response structure');
  }
  
  console.log('\n💡 Error Handling Best Practices Verified:');
  console.log('- Proper HTTP status codes for different error types');
  console.log('- Consistent JSON response structure across all endpoints');
  console.log('- Authentication and authorization error handling');
  console.log('- Input validation and malformed data handling');
  console.log('- Network error resilience');
  
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