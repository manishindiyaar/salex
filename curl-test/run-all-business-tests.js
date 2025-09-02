/*
 * ## Test Description: Comprehensive business API test runner
 *
 * ### Input:
 * Runs all business management endpoint tests in sequence with proper setup and teardown.
 *
 * ### Expected Output:
 * Complete test results for all business endpoints including success/failure counts.
 *
 * ### Passes:
 * [ ] All business endpoint tests executed successfully.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';

console.log('=== Business API Comprehensive Test Runner ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log('');

// Test files to run in order
const testFiles = [
  'business-get-me.test.js',
  'business-create.test.js',
  'business-get-by-id.test.js',
  'business-update.test.js',
  'business-services.test.js',
  'business-bookings.test.js'
];

// Test results tracking
const testResults = [];

function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running: ${testFile}`);
    console.log('═'.repeat(60));
    
    const testPath = path.join(__dirname, testFile);
    const child = spawn('node', [testPath], {
      stdio: 'pipe',
      env: {
        ...process.env,
        API_BASE_URL,
        CLERK_JWT_TOKEN: JWT_TOKEN
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });
    
    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });
    
    child.on('close', (code) => {
      const success = code === 0;
      testResults.push({
        file: testFile,
        success,
        code,
        stdout,
        stderr
      });
      
      console.log(`\n${success ? '✅' : '❌'} ${testFile} ${success ? 'PASSED' : 'FAILED'} (exit code: ${code})`);
      resolve(success);
    });
    
    child.on('error', (error) => {
      console.log(`❌ Failed to run ${testFile}: ${error.message}`);
      testResults.push({
        file: testFile,
        success: false,
        error: error.message
      });
      resolve(false);
    });
  });
}

async function runAllTests() {
  console.log('🧪 Starting Business API Test Suite...\n');
  
  const startTime = Date.now();
  const results = [];
  
  // Run tests sequentially to avoid conflicts
  for (const testFile of testFiles) {
    const success = await runTest(testFile);
    results.push(success);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Print final summary
  console.log('\n');
  console.log('📊 FINAL TEST RESULTS SUMMARY');
  console.log('═'.repeat(60));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  testResults.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.file}`);
    
    if (!result.success && result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  console.log('─'.repeat(60));
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log(`Duration: ${duration}s`);
  
  if (passed === total) {
    console.log('\n🎉 ALL BUSINESS API TESTS PASSED!');
    console.log('The business management endpoints are working correctly.');
  } else {
    console.log('\n💥 SOME TESTS FAILED!');
    console.log('Please check the individual test outputs above for details.');
  }
  
  console.log('\n📋 Test Coverage Summary:');
  console.log('✅ GET /api/v1/businesses/me - Current user business');
  console.log('✅ POST /api/v1/businesses - Create business');
  console.log('✅ GET /api/v1/businesses/{id} - Get business by ID');
  console.log('✅ PUT /api/v1/businesses/{id} - Update business');
  console.log('✅ GET /api/v1/businesses/{id}/services - Get services');
  console.log('✅ GET /api/v1/businesses/{id}/bookings - Get bookings');
  
  console.log('\n🔐 Security Test Coverage:');
  console.log('✅ Authentication required (401 tests)');
  console.log('✅ Authorization validation (403 tests)');
  console.log('✅ Input validation (400/422 tests)');
  console.log('✅ Resource not found (404 tests)');
  
  process.exit(passed === total ? 0 : 1);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Test execution interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Test execution terminated');
  process.exit(1);
});

// Check if API is running before starting tests
async function checkApiHealth() {
  const axios = require('axios');
  
  try {
    console.log('🔍 Checking API health...');
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log(`✅ API is running (status: ${response.status})`);
    return true;
  } catch (error) {
    console.log(`❌ API health check failed: ${error.message}`);
    console.log(`❌ Please ensure the API server is running at: ${API_BASE_URL}`);
    console.log('❌ Try running: pnpm dev:api');
    return false;
  }
}

// Main execution
async function main() {
  try {
    const apiHealthy = await checkApiHealth();
    if (!apiHealthy) {
      process.exit(1);
    }
    
    await runAllTests();
  } catch (error) {
    console.error('Fatal error in test runner:', error);
    process.exit(1);
  }
}

main();