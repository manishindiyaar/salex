/*
 * ## Test Description: Analytics test suite runner
 *
 * ### Input:
 * Executes all analytics-related test scripts in sequence with proper reporting.
 *
 * ### Expected Output:
 * Consolidated test results from all analytics test files with overall pass/fail status.
 *
 * ### Passes:
 * [ ] All analytics tests execute successfully
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Running Analytics Test Suite');
console.log('='.repeat(50));

const testFiles = [
  'analytics-quick-test.js',
  'business-analytics.test.js'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running ${testFile}...`);
    console.log('-'.repeat(30));

    const testProcess = spawn('node', [path.join(__dirname, testFile)], {
      stdio: 'inherit',
      env: process.env
    });

    testProcess.on('close', (code) => {
      totalTests++;
      if (code === 0) {
        passedTests++;
        console.log(`✅ ${testFile} PASSED`);
      } else {
        failedTests++;
        console.log(`❌ ${testFile} FAILED (exit code: ${code})`);
      }
      resolve(code);
    });

    testProcess.on('error', (error) => {
      totalTests++;
      failedTests++;
      console.error(`❌ ${testFile} ERROR: ${error.message}`);
      resolve(1);
    });
  });
}

async function runAllTests() {
  for (const testFile of testFiles) {
    await runTest(testFile);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 ANALYTICS TEST SUITE SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Test Files: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
  console.log('='.repeat(50));

  if (failedTests > 0) {
    console.log('❌ Some analytics tests failed. Please check the implementation.');
    process.exit(1);
  } else {
    console.log('✅ All analytics tests passed! API is ready for production.');
    process.exit(0);
  }
}

// Check environment
if (!process.env.CLERK_JWT_TOKEN) {
  console.error('❌ CLERK_JWT_TOKEN environment variable is required');
  console.error('Please set it in your .env file');
  process.exit(1);
}

runAllTests().catch(error => {
  console.error('❌ Test suite execution failed:', error.message);
  process.exit(1);
});