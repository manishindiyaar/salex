/*
 * ## Test Description: Simple API endpoint test for root and health endpoints
 *
 * ### Input:
 * GET requests to / and /health endpoints on running API server (localhost:3001).
 *
 * ### Expected Output:
 * Root endpoint (/) returns 200 with "Hello World! Salex API is running 🚀"
 * Health endpoint (/health) returns 200 with status "ok" and timestamp
 *
 * ### Passes:
 * [ ] Root endpoint returns expected message
 * [ ] Health endpoint returns status "ok" with timestamp
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

class SimpleAPITester {
  async testRootEndpoint() {
    console.log('🧪 Testing root endpoint (/)...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/`, {
        timeout: 5000,
        validateStatus: () => true // Accept all status codes
      });

      console.log(`Status Code: ${response.status}`);
      console.log(`Response: ${JSON.stringify(response.data)}`);

      if (response.status === 200) {
        const expectedMessage = 'Hello World! Salex API is running 🚀';
        if (response.data === expectedMessage) {
          console.log('✅ Root endpoint test PASSED');
          return { success: true, message: 'Root endpoint returned expected message' };
        } else {
          console.log('❌ Root endpoint test FAILED - Unexpected response content');
          return { success: false, message: `Expected: "${expectedMessage}", Got: "${response.data}"` };
        }
      } else {
        console.log('❌ Root endpoint test FAILED - Unexpected status code');
        return { success: false, message: `Expected status 200, got ${response.status}` };
      }
    } catch (error) {
      console.log('❌ Root endpoint test FAILED - Request error');
      console.error('Error details:', error.message);
      return { success: false, message: `Request failed: ${error.message}` };
    }
  }

  async testHealthEndpoint() {
    console.log('\n🧪 Testing health endpoint (/health)...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000,
        validateStatus: () => true // Accept all status codes
      });

      console.log(`Status Code: ${response.status}`);
      console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);

      if (response.status === 200) {
        const data = response.data;
        
        // Validate response structure
        if (data.status === 'ok' && data.timestamp) {
          // Validate timestamp format (ISO string)
          const timestamp = new Date(data.timestamp);
          if (!isNaN(timestamp.getTime())) {
            console.log('✅ Health endpoint test PASSED');
            return { success: true, message: 'Health endpoint returned valid status and timestamp' };
          } else {
            console.log('❌ Health endpoint test FAILED - Invalid timestamp format');
            return { success: false, message: 'Timestamp is not in valid ISO format' };
          }
        } else {
          console.log('❌ Health endpoint test FAILED - Invalid response structure');
          return { success: false, message: 'Response missing required fields (status: "ok", timestamp)' };
        }
      } else {
        console.log('❌ Health endpoint test FAILED - Unexpected status code');
        return { success: false, message: `Expected status 200, got ${response.status}` };
      }
    } catch (error) {
      console.log('❌ Health endpoint test FAILED - Request error');
      console.error('Error details:', error.message);
      return { success: false, message: `Request failed: ${error.message}` };
    }
  }

  async runTests() {
    console.log(`🔗 Testing API at: ${API_BASE_URL}`);
    console.log('📝 Note: Make sure the API server is running before executing this test.\n');
    
    const results = {};

    // Test root endpoint
    results.rootEndpoint = await this.testRootEndpoint();

    // Test health endpoint
    results.healthEndpoint = await this.testHealthEndpoint();

    // Print summary
    this.printSummary(results);

    // Exit with appropriate code
    const allPassed = results.rootEndpoint?.success && results.healthEndpoint?.success;
    process.exit(allPassed ? 0 : 1);
  }

  printSummary(results) {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    if (results.rootEndpoint) {
      console.log(`🏠 Root Endpoint (/): ${results.rootEndpoint.success ? '✅ PASSED' : '❌ FAILED'}`);
      if (!results.rootEndpoint.success) {
        console.log(`   └─ ${results.rootEndpoint.message}`);
      }
    }
    
    if (results.healthEndpoint) {
      console.log(`🏥 Health Endpoint (/health): ${results.healthEndpoint.success ? '✅ PASSED' : '❌ FAILED'}`);
      if (!results.healthEndpoint.success) {
        console.log(`   └─ ${results.healthEndpoint.message}`);
      }
    }
    
    const allPassed = results.rootEndpoint?.success && results.healthEndpoint?.success;
    
    console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '💥 SOME TESTS FAILED!'));
    console.log('='.repeat(50));
  }
}

// Run the tests
const tester = new SimpleAPITester();
tester.runTests().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});