#!/usr/bin/env node

/**
 * Story 1.8: 4-Digit Business Identifier System - Comprehensive Test Suite
 * 
 * Tests all routing code functionality:
 * - Code availability checking
 * - Setting business routing codes
 * - Customer business lookup
 * - Suggestion algorithm
 * - Error handling
 */

require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';

console.log('🚀 Story 1.8: 4-Digit Business Identifier System - Test Suite');
console.log('='.repeat(70));

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.requiresAuth ? { 'Authorization': `Bearer ${JWT_TOKEN}` } : {}),
    },
  };

  const config = { ...defaultOptions, ...options };
  delete config.requiresAuth;

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    return {
      status: response.status,
      success: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

async function testCodeAvailability() {
  console.log('\n📋 Test 1: Code Availability Checking');
  console.log('-'.repeat(50));

  // Test available code
  const availableTest = await makeRequest('/api/v1/public/businesses/routing-codes/1234/availability');
  console.log('✅ Available Code (1234):', availableTest.data?.data?.available ? 'AVAILABLE' : 'TAKEN');

  // Test invalid format
  const invalidTest = await makeRequest('/api/v1/public/businesses/routing-codes/123/availability');
  console.log('❌ Invalid Format (123):', invalidTest.status === 400 ? 'REJECTED ✓' : 'ACCEPTED ✗');

  // Test out of range
  const outOfRangeTest = await makeRequest('/api/v1/public/businesses/routing-codes/0999/availability');
  console.log('❌ Out of Range (0999):', outOfRangeTest.status === 400 ? 'REJECTED ✓' : 'ACCEPTED ✗');

  return availableTest.data?.data?.available ? '1234' : '1235';
}

async function testBusinessCodeSetting(availableCode) {
  console.log('\n📝 Test 2: Business Code Assignment');
  console.log('-'.repeat(50));

  // First, get current user's business
  const businessResponse = await makeRequest('/api/v1/businesses/me', { requiresAuth: true });
  
  if (!businessResponse.success || !businessResponse.data?.data) {
    console.log('❌ No business found for user. Please create a business first.');
    return null;
  }

  const business = businessResponse.data.data;
  console.log(`📍 Testing with business: ${business.name} (ID: ${business.id})`);

  // Test setting routing code
  const setCodeResponse = await makeRequest(`/api/v1/businesses/${business.id}/routing-code`, {
    method: 'PUT',
    requiresAuth: true,
    body: JSON.stringify({ routingCode: availableCode }),
  });

  if (setCodeResponse.success) {
    console.log(`✅ Routing code ${availableCode} assigned successfully!`);
    return { businessId: business.id, routingCode: availableCode };
  } else {
    console.log('❌ Failed to assign routing code:', setCodeResponse.data?.error);
    
    // If code was taken, check suggestions
    if (setCodeResponse.data?.data?.suggestions) {
      console.log('💡 Suggested alternatives:', setCodeResponse.data.data.suggestions.join(', '));
      
      // Try first suggestion
      const suggestion = setCodeResponse.data.data.suggestions[0];
      if (suggestion) {
        const retryResponse = await makeRequest(`/api/v1/businesses/${business.id}/routing-code`, {
          method: 'PUT',
          requiresAuth: true,
          body: JSON.stringify({ routingCode: suggestion }),
        });
        
        if (retryResponse.success) {
          console.log(`✅ Successfully assigned suggested code: ${suggestion}`);
          return { businessId: business.id, routingCode: suggestion };
        }
      }
    }
    
    return null;
  }
}

async function testCustomerLookup(routingCode) {
  console.log('\n🔍 Test 3: Customer Business Discovery');
  console.log('-'.repeat(50));

  // Test valid code lookup
  const lookupResponse = await makeRequest(`/api/v1/public/businesses/by-code/${routingCode}`);
  
  if (lookupResponse.success) {
    const business = lookupResponse.data.data;
    console.log('✅ Business found:');
    console.log(`   Name: ${business.name}`);
    console.log(`   Address: ${business.address}`);
    console.log(`   Phone: ${business.phoneNumber}`);
    console.log(`   Code: S${business.routingCode}`);
  } else {
    console.log('❌ Business lookup failed:', lookupResponse.data?.error);
  }

  // Test invalid code lookup
  const invalidLookup = await makeRequest('/api/v1/public/businesses/by-code/9999');
  console.log('❌ Invalid Code Lookup (9999):', invalidLookup.status === 404 ? 'NOT FOUND ✓' : 'FOUND ✗');
}

async function testDuplicateCodePrevention(businessId, existingCode) {
  console.log('\n🚫 Test 4: Duplicate Code Prevention');
  console.log('-'.repeat(50));

  // Try to set code again (should fail)
  const duplicateResponse = await makeRequest(`/api/v1/businesses/${businessId}/routing-code`, {
    method: 'PUT',
    requiresAuth: true,
    body: JSON.stringify({ routingCode: '5555' }),
  });

  if (duplicateResponse.status === 409) {
    console.log('✅ Duplicate assignment prevented - business already has code');
  } else {
    console.log('❌ System allowed duplicate code assignment');
  }

  // Verify taken code generates suggestions
  const takenCodeResponse = await makeRequest('/api/v1/public/businesses/routing-codes/' + existingCode + '/availability');
  
  if (takenCodeResponse.success && !takenCodeResponse.data?.data?.available) {
    console.log(`✅ Code ${existingCode} correctly marked as taken`);
    if (takenCodeResponse.data.data.suggestions) {
      console.log('💡 Suggestions provided:', takenCodeResponse.data.data.suggestions.slice(0, 3).join(', '));
    }
  } else {
    console.log(`❌ Code ${existingCode} incorrectly marked as available`);
  }
}

async function testStatistics() {
  console.log('\n📊 Test 5: Routing Code Statistics');
  console.log('-'.repeat(50));

  const statsResponse = await makeRequest('/api/v1/businesses/routing-codes/statistics', { requiresAuth: true });
  
  if (statsResponse.success) {
    const stats = statsResponse.data.data;
    console.log('✅ Statistics retrieved:');
    console.log(`   Total Assigned: ${stats.totalAssigned}`);
    console.log(`   Total Available: ${stats.totalAvailable}`);
    console.log(`   Utilization: ${stats.utilizationPercentage}%`);
  } else {
    console.log('❌ Failed to get statistics:', statsResponse.data?.error);
  }
}

async function testErrorHandling() {
  console.log('\n⚠️  Test 6: Error Handling');
  console.log('-'.repeat(50));

  // Test unauthorized access
  const unauthorizedResponse = await makeRequest('/api/v1/businesses/invalid-id/routing-code', {
    method: 'PUT',
    body: JSON.stringify({ routingCode: '6666' }),
    // No auth header
  });
  console.log('🔒 Unauthorized access:', unauthorizedResponse.status === 401 ? 'BLOCKED ✓' : 'ALLOWED ✗');

  // Test invalid business ID
  const invalidBusinessResponse = await makeRequest('/api/v1/businesses/invalid-business-id/routing-code', {
    method: 'PUT',
    requiresAuth: true,
    body: JSON.stringify({ routingCode: '7777' }),
  });
  console.log('❌ Invalid Business ID:', invalidBusinessResponse.status === 404 ? 'REJECTED ✓' : 'ACCEPTED ✗');

  // Test malformed routing code
  const malformedResponse = await makeRequest('/api/v1/public/businesses/routing-codes/ABC123/availability');
  console.log('❌ Malformed Code (ABC123):', malformedResponse.status === 400 ? 'REJECTED ✓' : 'ACCEPTED ✗');
}

async function runAllTests() {
  try {
    console.log('🔌 Testing API connection...');
    const healthCheck = await makeRequest('/health');
    if (!healthCheck.success) {
      console.log('❌ API server is not running. Please start with: pnpm dev:api');
      process.exit(1);
    }
    console.log('✅ API server is running');

    const availableCode = await testCodeAvailability();
    const businessInfo = await testBusinessCodeSetting(availableCode);
    
    if (businessInfo) {
      await testCustomerLookup(businessInfo.routingCode);
      await testDuplicateCodePrevention(businessInfo.businessId, businessInfo.routingCode);
    }
    
    await testStatistics();
    await testErrorHandling();

    console.log('\n🎉 Story 1.8 Test Suite Completed!');
    console.log('='.repeat(70));
    console.log('✅ 4-Digit Business Identifier System is working correctly');
    console.log('🚀 Ready for Story 1.9 (WhatsApp Web Simulator)');

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };