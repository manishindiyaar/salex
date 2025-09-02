/*
 * ## Test Description: Booking test suite runner
 *
 * ### Input:
 * Executes all booking-related tests in sequence with proper setup and reporting.
 *
 * ### Expected Output:
 * Complete test suite execution with comprehensive reporting of all booking functionality.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Quick booking test validates core functionality.
 * [ ] Test case 2 passed: Individual endpoint tests validate all booking endpoints.
 * [ ] Test case 3 passed: Comprehensive flow test validates complete booking lifecycle.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Booking Test Suite Runner');
console.log('='.repeat(50));
console.log('');

// Test configuration
const tests = [
  {
    name: 'Quick Booking Test',
    script: 'booking-quick-test.js',
    description: 'Rapid validation of core booking functionality',
    timeout: 30000 // 30 seconds
  },
  {
    name: 'Individual Endpoint Tests',
    script: 'booking-endpoints.test.js', 
    description: 'Detailed testing of each booking endpoint',
    timeout: 120000 // 2 minutes
  },
  {
    name: 'Comprehensive Booking Flow',
    script: 'comprehensive-booking-flow.test.js',
    description: 'Complete booking lifecycle testing with multiple scenarios',
    timeout: 180000 // 3 minutes
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

/**
 * Run a single test script
 */
function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n📋 Running: ${test.name}`);
    console.log(`   Script: ${test.script}`);
    console.log(`   Description: ${test.description}`);
    console.log('-'.repeat(40));

    const startTime = Date.now();
    const child = spawn('node', [path.join(__dirname, test.script)], {
      stdio: 'inherit',
      cwd: __dirname
    });

    // Set timeout
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n⏰ ${test.name} TIMED OUT after ${duration} seconds`);
      resolve({ success: false, error: 'Test timed out', duration });
    }, test.timeout);

    child.on('close', (code) => {
      clearTimeout(timeout);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (code === 0) {
        console.log(`\n✅ ${test.name} PASSED (${duration}s)`);
        resolve({ success: true, duration });
      } else {
        console.log(`\n❌ ${test.name} FAILED with exit code ${code} (${duration}s)`);
        resolve({ success: false, error: `Exit code ${code}`, duration });
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n❌ ${test.name} ERROR: ${error.message} (${duration}s)`);
      resolve({ success: false, error: error.message, duration });
    });
  });
}

/**
 * Main test runner
 */
async function runBookingTestSuite() {
  const suiteStartTime = Date.now();
  console.log(`Starting booking test suite at ${new Date().toLocaleString()}`);
  console.log(`Total tests to run: ${tests.length}`);
  console.log('');

  // Check prerequisites
  console.log('🔍 Checking prerequisites...');
  try {
    require('dotenv').config();
    const JWT_TOKEN = process.env.CLERK_JWT_TOKEN;
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
    
    if (!JWT_TOKEN) {
      throw new Error('CLERK_JWT_TOKEN not found in .env file');
    }
    
    console.log(`✅ Environment configured (API: ${API_BASE_URL})`);
    console.log(`✅ JWT token found: ${JWT_TOKEN.substring(0, 20)}...`);
  } catch (error) {
    console.log(`❌ Prerequisites failed: ${error.message}`);
    console.log('\n💡 Make sure to:');
    console.log('   1. Run comprehensive-business-onboarding.test.js first');
    console.log('   2. Set CLERK_JWT_TOKEN in .env file');
    console.log('   3. Ensure API server is running');
    process.exit(1);
  }

  console.log('');

  // Run each test
  for (const test of tests) {
    totalTests++;
    const result = await runTest(test);
    
    if (result.success) {
      passedTests++;
    } else {
      failedTests.push({
        name: test.name,
        error: result.error,
        duration: result.duration
      });
    }
    
    // Add pause between tests
    if (totalTests < tests.length) {
      console.log('\n⏳ Pausing 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Final results
  const suiteEndTime = Date.now();
  const totalDuration = ((suiteEndTime - suiteStartTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('🎯 BOOKING TEST SUITE RESULTS');
  console.log('='.repeat(60));
  console.log('');
  console.log('📊 Summary:');
  console.log(`   • Total Tests: ${totalTests}`);
  console.log(`   • Passed: ${passedTests}`);
  console.log(`   • Failed: ${failedTests.length}`);
  console.log(`   • Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  console.log(`   • Total Duration: ${totalDuration} seconds`);
  console.log('');

  if (failedTests.length > 0) {
    console.log('❌ Failed Tests:');
    failedTests.forEach(test => {
      console.log(`   • ${test.name}: ${test.error} (${test.duration}s)`);
    });
    console.log('');
  }

  if (passedTests === totalTests) {
    console.log('🎉 ALL BOOKING TESTS PASSED!');
    console.log('✅ Booking system is fully operational');
    console.log('');
    console.log('🚀 Validated Features:');
    console.log('   • Booking creation (public endpoint)');
    console.log('   • Booking retrieval (customer & business views)');
    console.log('   • Booking updates and rescheduling');
    console.log('   • Booking confirmation workflow');
    console.log('   • Booking completion workflow');
    console.log('   • Customer cancellation with phone verification');
    console.log('   • Salon-initiated cancellation');
    console.log('   • Booking deletion (admin function)');
    console.log('   • Time conflict detection');
    console.log('   • Error handling and validation');
    console.log('');
    console.log('✅ BOOKING SYSTEM READY FOR PRODUCTION!');
    process.exit(0);
  } else {
    console.log('⚠️  SOME BOOKING TESTS FAILED');
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check API server is running and accessible');
    console.log('   2. Verify JWT token is valid and not expired');
    console.log('   3. Ensure test business exists (run onboarding test first)');
    console.log('   4. Check database connectivity and constraints');
    console.log('   5. Review individual test outputs above for specific errors');
    console.log('');
    console.log('💡 Tips:');
    console.log('   • Run tests individually to isolate issues');
    console.log('   • Check API logs for detailed error information');
    console.log('   • Ensure booking endpoints are properly implemented');
    
    process.exit(1);
  }
}

// Run the test suite
runBookingTestSuite().catch(error => {
  console.log('\n💥 TEST SUITE RUNNER FAILED!');
  console.log(`Error: ${error.message}`);
  process.exit(1);
});