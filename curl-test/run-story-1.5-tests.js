/*
 * ## Test Description: Story 1.5 test runner for all business hours and time slots tests
 *
 * ### Input:
 * Executes all Story 1.5 related test scripts in sequence and provides consolidated results.
 *
 * ### Expected Output:
 * Complete test execution report for business hours management and time slots calculation functionality.
 *
 * ### Passes:
 * [ ] All business hours tests passed.
 * [ ] All time slots tests passed.
 * [ ] All comprehensive integration tests passed.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== Story 1.5 Test Suite Runner ===');
console.log('Running all tests for business hours and time slots functionality...\n');

// Test files to run in order
const testFiles = [
  'business-hours.test.js',
  'timeslots.test.js',
  'story-1.5-error-validation.test.js',
  'story-1.5-comprehensive.test.js'
];

// Results tracking
const results = {
  total: testFiles.length,
  passed: 0,
  failed: 0,
  details: []
};

function runTest(filename) {
  return new Promise((resolve) => {
    console.log(`🧪 Running ${filename}...`);
    console.log('='.repeat(50));
    
    const testPath = path.join(__dirname, filename);
    const child = spawn('node', [testPath], {
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      const passed = code === 0;
      results.details.push({
        filename,
        passed,
        exitCode: code
      });
      
      if (passed) {
        results.passed++;
        console.log(`✅ ${filename} PASSED\n`);
      } else {
        results.failed++;
        console.log(`❌ ${filename} FAILED (exit code: ${code})\n`);
      }
      
      resolve();
    });
    
    child.on('error', (error) => {
      console.error(`Failed to start test ${filename}:`, error);
      results.failed++;
      results.details.push({
        filename,
        passed: false,
        error: error.message
      });
      resolve();
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting Story 1.5 test execution...\n');
  
  // Run tests sequentially
  for (const testFile of testFiles) {
    await runTest(testFile);
  }
  
  // Print final summary
  console.log('📊 FINAL TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('');
  
  // Detailed results
  console.log('📋 Detailed Results:');
  results.details.forEach((result, index) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const extra = result.error ? ` (${result.error})` : result.exitCode ? ` (exit: ${result.exitCode})` : '';
    console.log(`${index + 1}. ${result.filename}: ${status}${extra}`);
  });
  
  console.log('');
  
  if (results.failed === 0) {
    console.log('🎉 ALL STORY 1.5 TESTS PASSED!');
    console.log('✨ Business hours and time slots functionality is fully working!');
    console.log('');
    console.log('Story 1.5 Features Validated:');
    console.log('• ✅ Business hours management (CRUD operations)');
    console.log('• ✅ Business open status checking');
    console.log('• ✅ Time slots calculation for date ranges');
    console.log('• ✅ Today and week time slots endpoints');
    console.log('• ✅ Custom slot intervals');
    console.log('• ✅ Service-specific time slots');
    console.log('• ✅ Comprehensive error handling');
    console.log('• ✅ Authentication and authorization');
    console.log('• ✅ Response format validation');
    console.log('• ✅ Business hours and time slots integration');
    process.exit(0);
  } else {
    console.log('💥 SOME STORY 1.5 TESTS FAILED!');
    console.log('🔧 Please review the failing tests and address the issues.');
    console.log('');
    console.log('Failed Test Files:');
    results.details
      .filter(r => !r.passed)
      .forEach(result => {
        console.log(`• ❌ ${result.filename}`);
      });
    process.exit(1);
  }
}

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n⚠️ Test execution interrupted by user');
  process.exit(1);
});

// Start test execution
runAllTests().catch(error => {
  console.error('Fatal error in test runner:', error);
  process.exit(1);
});