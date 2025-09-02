/*
 * ## Test Description: Firebase authentication test runner for all Firebase auth test suites
 *
 * ### Input:
 * Runs all Firebase authentication tests in sequence: configuration, phone auth flow,
 * error handling, and backend integration tests.
 *
 * ### Expected Output:
 * Complete test report showing results from all Firebase authentication test scenarios.
 *
 * ### Passes:
 * [ ] All individual test suites execute successfully
 * [ ] Overall test summary is generated
 * [ ] Exit code reflects overall test success/failure
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TESTS = [
  {
    name: 'Firebase Configuration Test',
    file: 'firebase-config.test.js',
    description: 'Verifies Firebase setup and configuration files'
  },
  {
    name: 'Firebase Phone Auth Flow Test', 
    file: 'firebase-phone-auth-flow.test.js',
    description: 'Tests complete phone authentication flow with OTP'
  },
  {
    name: 'Firebase Auth Error Handling Test',
    file: 'firebase-auth-error-handling.test.js', 
    description: 'Tests error scenarios and edge cases'
  },
  {
    name: 'Firebase Backend Integration Test',
    file: 'firebase-backend-integration.test.js',
    description: 'Tests Firebase ID token validation with backend API'
  }
];

console.log('🔥 Firebase Authentication Test Suite Runner');
console.log('============================================');
console.log(`Running ${TESTS.length} test suites...\n`);

async function runFirebaseAuthTests() {
  const results = [];
  let overallSuccess = true;

  // Check if all test files exist
  console.log('📋 Checking test files...');
  for (const test of TESTS) {
    const testPath = path.join(__dirname, test.file);
    if (fs.existsSync(testPath)) {
      console.log(`✅ ${test.file} - Found`);
    } else {
      console.log(`❌ ${test.file} - Missing`);
      overallSuccess = false;
    }
  }
  
  if (!overallSuccess) {
    console.log('\n❌ Some test files are missing. Aborting test run.');
    return false;
  }

  console.log('\n🚀 Starting test execution...\n');

  // Run each test sequentially
  for (let i = 0; i < TESTS.length; i++) {
    const test = TESTS[i];
    const testNumber = i + 1;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 TEST ${testNumber}/${TESTS.length}: ${test.name}`);
    console.log(`📄 Description: ${test.description}`);
    console.log(`📁 File: ${test.file}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const testResult = await runSingleTest(test.file);
      
      results.push({
        name: test.name,
        file: test.file,
        success: testResult.success,
        output: testResult.output,
        error: testResult.error
      });

      if (testResult.success) {
        console.log(`\n✅ ${test.name} - PASSED\n`);
      } else {
        console.log(`\n❌ ${test.name} - FAILED`);
        console.log(`Error: ${testResult.error}\n`);
        overallSuccess = false;
      }

    } catch (error) {
      console.log(`\n❌ ${test.name} - EXECUTION ERROR`);
      console.log(`Error: ${error.message}\n`);
      
      results.push({
        name: test.name,
        file: test.file,
        success: false,
        output: '',
        error: error.message
      });
      
      overallSuccess = false;
    }
  }

  // Generate final report
  generateFinalReport(results, overallSuccess);
  
  return overallSuccess;
}

function runSingleTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(__dirname, testFile);
    const child = spawn('node', [testPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text); // Show output in real-time
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      error += text;
      process.stderr.write(text); // Show errors in real-time
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output,
        error: error || (code !== 0 ? `Process exited with code ${code}` : '')
      });
    });

    child.on('error', (err) => {
      resolve({
        success: false,
        output: output,
        error: `Failed to start test: ${err.message}`
      });
    });
  });
}

function generateFinalReport(results, overallSuccess) {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 FIREBASE AUTHENTICATION TEST SUITE FINAL REPORT');
  console.log('='.repeat(80));
  
  const passedTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Total Tests: ${results.length}`);
  console.log(`   Passed: ${passedTests.length}`);
  console.log(`   Failed: ${failedTests.length}`);
  console.log(`   Success Rate: ${Math.round((passedTests.length / results.length) * 100)}%`);

  if (passedTests.length > 0) {
    console.log(`\n✅ PASSED TESTS:`);
    passedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.name}`);
    });
  }

  if (failedTests.length > 0) {
    console.log(`\n❌ FAILED TESTS:`);
    failedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.name}`);
      console.log(`      Error: ${test.error}`);
    });
  }

  console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!overallSuccess) {
    console.log(`\n💡 NEXT STEPS FOR FAILED TESTS:`);
    console.log(`   1. Check the detailed error messages above`);
    console.log(`   2. Ensure Firebase is properly configured in the project`);
    console.log(`   3. Make sure the backend API server is running`);
    console.log(`   4. Verify environment variables are set correctly`);
    console.log(`   5. Run individual tests for more detailed debugging`);
  } else {
    console.log(`\n🎉 ALL FIREBASE AUTHENTICATION TESTS PASSED!`);
    console.log(`   Your Firebase phone authentication is properly configured and working.`);
  }
  
  console.log('\n' + '='.repeat(80));
}

// Help function
function showHelp() {
  console.log(`
Firebase Authentication Test Suite Runner

Usage:
  node run-firebase-auth-tests.js [options]

Options:
  --help          Show this help message
  --list          List all available tests
  --test <file>   Run a specific test file only

Examples:
  node run-firebase-auth-tests.js
  node run-firebase-auth-tests.js --test firebase-config.test.js
  node run-firebase-auth-tests.js --list

Environment Variables:
  EXPO_PUBLIC_API_URL    Backend API URL (default: http://localhost:3000)
`);
}

function listTests() {
  console.log('Available Firebase Authentication Tests:');
  TESTS.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test.name}`);
    console.log(`     File: ${test.file}`);
    console.log(`     Description: ${test.description}`);
    console.log('');
  });
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--list')) {
  listTests();
  process.exit(0);
}

const testIndex = args.indexOf('--test');
if (testIndex !== -1 && args[testIndex + 1]) {
  const specificTestFile = args[testIndex + 1];
  console.log(`Running specific test: ${specificTestFile}`);
  
  runSingleTest(specificTestFile)
    .then((result) => {
      console.log(`\nTest completed: ${result.success ? 'PASSED' : 'FAILED'}`);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
} else {
  // Run all tests
  runFirebaseAuthTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test suite execution failed:', error);
      process.exit(1);
    });
}