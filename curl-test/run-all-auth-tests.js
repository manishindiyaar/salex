/*
 * ## Test Description: Master test runner for all Salex authentication system tests
 *
 * ### Input:
 * Executes all individual authentication test scripts in sequence with comprehensive reporting.
 *
 * ### Expected Output:
 * Complete test suite execution with summary results and environment validation.
 *
 * ### Passes:
 * [ ] All authentication test scripts executed successfully.
 * [ ] Environment validation passed.
 * [ ] Comprehensive test reporting completed.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const TEST_SCRIPTS = [
  {
    name: 'Authentication Flow Tests',
    file: 'auth-flow.test.js',
    description: 'Tests FirebaseAuthGuard with valid/invalid ID tokens'
  },
  {
    name: 'User Synchronization Tests',
    file: 'user-sync.test.js',
    description: 'Tests user creation and retrieval from database'
  },
  {
    name: 'Protected Endpoints Tests',
    file: 'protected-endpoints.test.js',
    description: 'Tests all auth-protected endpoints'
  },
  {
    name: 'WhatsApp Webhook Tests',
    file: 'whatsapp-webhook.test.js',
    description: 'Tests webhook signature verification and business context'
  },
  {
    name: 'Error Handling Tests',
    file: 'error-handling.test.js',
    description: 'Tests unauthorized access and error scenarios'
  }
];

// Load environment variables from .env file
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const FIREBASE_ID_TOKEN = process.env.FIREBASE_ID_TOKEN;

console.log('🚀 Salex Authentication System - Master Test Runner');
console.log('='.repeat(60));
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Total Test Scripts: ${TEST_SCRIPTS.length}`);
console.log('');

function validateEnvironment() {
  console.log('🔍 Environment Validation');
  console.log('-'.repeat(30));
  
  const checks = [
    {
      name: 'API_BASE_URL',
      value: process.env.API_BASE_URL || 'http://localhost:3000',
      status: true,
      note: process.env.API_BASE_URL ? 'Using custom URL from .env' : 'Using default localhost:3000'
    },
    {
      name: 'FIREBASE_ID_TOKEN',
      value: process.env.FIREBASE_ID_TOKEN ? `[PRESENT: ${process.env.FIREBASE_ID_TOKEN.substring(0, 20)}...]` : '[MISSING]',
      status: !!process.env.FIREBASE_ID_TOKEN,
      note: process.env.FIREBASE_ID_TOKEN ? 'Loaded from .env file - required for authentication tests' : 'Some tests will be skipped'
    },
    {
      name: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
      value: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '[USING DEFAULT]',
      status: true,
      note: 'Using default test token if not provided'
    },
    {
      name: 'WHATSAPP_API_TOKEN',
      value: process.env.WHATSAPP_API_TOKEN ? '[PRESENT]' : '[MISSING]',
      status: !!process.env.WHATSAPP_API_TOKEN,
      note: process.env.WHATSAPP_API_TOKEN ? 'Required for signature verification' : 'Signature tests will be skipped'
    }
  ];

  let allValid = true;
  for (const check of checks) {
    const status = check.status ? '✅' : '⚠️ ';
    console.log(`${status} ${check.name}: ${check.value}`);
    if (check.note) {
      console.log(`   Note: ${check.note}`);
    }
    if (!check.status && check.name === 'FIREBASE_ID_TOKEN') {
      allValid = false;
    }
  }

  console.log('');
  return allValid;
}

function runTestScript(scriptName) {
  return new Promise((resolve) => {
    console.log(`\n📋 Running: ${scriptName}`);
    console.log('='.repeat(60));
    
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    child.on('close', (code) => {
      const success = code === 0;
      console.log('='.repeat(60));
      console.log(`${success ? '✅' : '❌'} ${scriptName} ${success ? 'completed successfully' : 'failed'} (exit code: ${code})`);
      resolve({ name: scriptName, success, code });
    });

    child.on('error', (error) => {
      console.error(`❌ Error running ${scriptName}: ${error.message}`);
      resolve({ name: scriptName, success: false, error: error.message });
    });
  });
}

async function checkAPIAvailability() {
  console.log('🔌 API Availability Check');
  console.log('-'.repeat(30));
  
  try {
    const axios = require('axios');
    // Try basic health endpoint first
    let response;
    try {
      response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    } catch (healthError) {
      // Fallback to WhatsApp health endpoint
      response = await axios.get(`${API_BASE_URL}/webhooks/whatsapp/health`, { timeout: 5000 });
    }
    
    console.log(`✅ API is responding (Status: ${response.status})`);
    console.log(`✅ Base URL: ${API_BASE_URL}`);
    console.log('');
    return true;
  } catch (error) {
    console.log(`❌ API is not available: ${error.message}`);
    console.log(`❌ Base URL: ${API_BASE_URL}`);
    console.log('⚠️  Make sure your API server is running (pnpm dev:api or pnpm dev)');
    console.log('');
    return false;
  }
}

async function runAllTests() {
  console.log('Starting comprehensive authentication test suite...\n');
  
  // Environment validation
  const envValid = validateEnvironment();
  
  // API availability check
  const apiAvailable = await checkAPIAvailability();
  
  if (!apiAvailable) {
    console.log('❌ Cannot proceed: API server is not available');
    console.log('\n📝 To start the API server:');
    console.log('   1. Navigate to the project root directory');
    console.log('   2. Ensure Supabase is running: supabase start');
    console.log('   3. Start the development server: pnpm dev');
    console.log('   4. Wait for the server to start on the configured port');
    return;
  }

  if (!envValid) {
    console.log('⚠️  Warning: Some environment variables are missing');
    console.log('   Some tests may be skipped or fail');
    console.log('\n📝 To set required environment variables:');
    console.log('   1. Copy .env.example to .env');
    console.log('   2. Fill in your Clerk JWT token and other credentials');
    console.log('   3. Run tests again');
    console.log('\nContinuing with available configuration...\n');
  }

  // Run all test scripts
  const results = [];
  for (const testScript of TEST_SCRIPTS) {
    const result = await runTestScript(testScript.file);
    results.push({ ...result, description: testScript.description, displayName: testScript.name });
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\n📊 Overall Results: ${passedTests}/${totalTests} test scripts passed\n`);
  
  for (const result of results) {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.displayName}`);
    console.log(`   ${result.description}`);
    if (!result.success) {
      console.log(`   Exit code: ${result.code || 'N/A'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    console.log('');
  }

  const overallSuccess = passedTests === totalTests;
  console.log('='.repeat(60));
  console.log(`${overallSuccess ? '🎉' : '⚠️'} FINAL RESULT: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (!overallSuccess) {
    console.log('\n🔧 Troubleshooting Guide:');
    console.log('1. Ensure API server is running on the correct port');
    console.log('2. Verify all environment variables are properly set');
    console.log('3. Check that Supabase/PostgreSQL is running and accessible');
    console.log('4. Confirm that Clerk authentication is properly configured');
    console.log('5. For WhatsApp tests, ensure webhook tokens are configured');
    console.log('6. Review individual test outputs for specific error details');
  } else {
    console.log('\n🎊 Congratulations! Your Salex authentication system is working correctly.');
    console.log('   All components have been validated:');
    console.log('   - ID token authentication with FirebaseAuthGuard');
    console.log('   - User synchronization with database');
    console.log('   - Protected endpoint access control');
    console.log('   - WhatsApp webhook integration');
    console.log('   - Comprehensive error handling');
  }
  
  console.log('\n📚 Test Coverage Includes:');
  console.log('   - Authentication flow validation');
  console.log('   - Database integration testing');
  console.log('   - API endpoint security verification');
  console.log('   - WhatsApp webhook signature verification');
  console.log('   - Error handling and edge cases');
  console.log('   - Response structure consistency');
  console.log('   - Performance and availability checks');
  
  console.log('');
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.log('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test execution interrupted by user');
  process.exit(1);
});

// Run all tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error running test suite:', error.message);
  process.exit(1);
});
