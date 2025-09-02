/*
 * ## Test Description: Comprehensive verification of Story 1.2 local development environment setup
 *
 * ### Input:
 * Tests local Supabase services, API connectivity, environment variables, and development server startup
 *
 * ### Expected Output:
 * All acceptance criteria for Story 1.2 validated: Supabase running, database connected, env vars loaded, API responding
 *
 * ### Passes:
 * [ ] Supabase services are running locally
 * [ ] Database connectivity works via API health endpoint
 * [ ] Environment variables are properly loaded
 * [ ] API server starts successfully on expected port
 * [ ] All required endpoints respond correctly
 */

const axios = require('axios');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from parent directory .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SUPABASE_API_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_DB_PORT = process.env.SUPABASE_DB_PORT || '54322';
const SUPABASE_STUDIO_PORT = process.env.SUPABASE_STUDIO_PORT || '54323';

// Test results tracker
const testResults = {
  supabaseRunning: false,
  databaseConnectivity: false,
  environmentVariables: false,
  apiServerStartup: false,
  endpointsResponding: false
};

console.log('🚀 Starting Story 1.2 Verification Tests');
console.log('=====================================\n');

// Utility function to check if a port is listening
function checkPort(port, host = 'localhost') {
  return new Promise((resolve) => {
    const net = require('net');
    const timeout = 3000;
    
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

// Test 1: Verify Supabase is running locally
async function testSupabaseRunning() {
  console.log('📋 Test 1: Verifying Supabase local services are running...');
  
  try {
    // Check database port
    const dbRunning = await checkPort(SUPABASE_DB_PORT);
    console.log(`   Database (port ${SUPABASE_DB_PORT}): ${dbRunning ? '✅ Running' : '❌ Not running'}`);
    
    // Check API port
    const apiRunning = await checkPort(54321);
    console.log(`   API (port 54321): ${apiRunning ? '✅ Running' : '❌ Not running'}`);
    
    // Check Studio port
    const studioRunning = await checkPort(SUPABASE_STUDIO_PORT);
    console.log(`   Studio (port ${SUPABASE_STUDIO_PORT}): ${studioRunning ? '✅ Running' : '❌ Not running'}`);
    
    // Try to ping Supabase API
    try {
      const response = await axios.get(`${SUPABASE_API_URL}/rest/v1/`, {
        timeout: 5000,
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY || 'test-key'
        }
      });
      console.log(`   Supabase REST API: ✅ Responding (status: ${response.status})`);
    } catch (error) {
      console.log(`   Supabase REST API: ⚠️  Not accessible (${error.message})`);
    }
    
    const allRunning = dbRunning && apiRunning && studioRunning;
    testResults.supabaseRunning = allRunning;
    
    console.log(`   Result: ${allRunning ? '✅ PASS' : '❌ FAIL'} - Supabase services ${allRunning ? 'are' : 'are not'} running\n`);
    
  } catch (error) {
    console.log(`   Result: ❌ FAIL - Error checking Supabase services: ${error.message}\n`);
    testResults.supabaseRunning = false;
  }
}

// Test 2: Test database connectivity via API endpoints
async function testDatabaseConnectivity() {
  console.log('📋 Test 2: Testing database connectivity via API endpoints...');
  
  try {
    // Test basic health endpoint
    const healthResponse = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 10000
    });
    console.log(`   Basic health endpoint: ✅ Responding (status: ${healthResponse.status})`);
    console.log(`   Response: ${JSON.stringify(healthResponse.data)}`);
    
    // Test database health endpoint
    const dbHealthResponse = await axios.get(`${API_BASE_URL}/health/db`, {
      timeout: 10000
    });
    console.log(`   Database health endpoint: ✅ Responding (status: ${dbHealthResponse.status})`);
    console.log(`   Database status: ${dbHealthResponse.data.database}`);
    console.log(`   Response: ${JSON.stringify(dbHealthResponse.data)}`);
    
    const dbConnected = dbHealthResponse.data.database === 'connected';
    testResults.databaseConnectivity = dbConnected;
    
    console.log(`   Result: ${dbConnected ? '✅ PASS' : '❌ FAIL'} - Database ${dbConnected ? 'is' : 'is not'} connected\n`);
    
  } catch (error) {
    console.log(`   Result: ❌ FAIL - Error testing database connectivity: ${error.message}`);
    if (error.response) {
      console.log(`   Response status: ${error.response.status}`);
      console.log(`   Response data: ${JSON.stringify(error.response.data)}`);
    }
    console.log('');
    testResults.databaseConnectivity = false;
  }
}

// Test 3: Test environment variable loading
async function testEnvironmentVariables() {
  console.log('📋 Test 3: Testing environment variable loading...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const optionalEnvVars = [
    'REDIS_URL',
    'CLERK_SECRET_KEY',
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'WHATSAPP_API_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'FCM_SERVER_KEY'
  ];
  
  let requiredPresent = 0;
  let optionalPresent = 0;
  
  console.log('   Required environment variables:');
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    const isPresent = value && value.length > 0;
    if (isPresent) requiredPresent++;
    console.log(`     ${envVar}: ${isPresent ? '✅ Set' : '❌ Missing'}`);
  });
  
  console.log('   Optional environment variables:');
  optionalEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    const isPresent = value && value.length > 0;
    if (isPresent) optionalPresent++;
    console.log(`     ${envVar}: ${isPresent ? '✅ Set' : '⚠️  Not set'}`);
  });
  
  // Check if .env.example exists
  const envExamplePath = path.join(process.cwd(), '../.env.example');
  const envExampleExists = fs.existsSync(envExamplePath);
  console.log(`   .env.example file: ${envExampleExists ? '✅ Exists' : '❌ Missing'}`);
  
  const allRequiredPresent = requiredPresent === requiredEnvVars.length;
  testResults.environmentVariables = allRequiredPresent;
  
  console.log(`   Result: ${allRequiredPresent ? '✅ PASS' : '❌ FAIL'} - ${requiredPresent}/${requiredEnvVars.length} required env vars present, ${optionalPresent}/${optionalEnvVars.length} optional vars present\n`);
}

// Test 4: Test that API server starts successfully
async function testApiServerStartup() {
  console.log('📋 Test 4: Testing API server startup...');
  
  try {
    // Check if API server is already running
    const isRunning = await checkPort(3000);
    
    if (isRunning) {
      console.log('   API server: ✅ Already running on port 3000');
      testResults.apiServerStartup = true;
    } else {
      console.log('   API server: ⚠️  Not running on port 3000');
      console.log('   Note: Run `pnpm dev:api` to start the API server');
      testResults.apiServerStartup = false;
    }
    
    console.log(`   Result: ${testResults.apiServerStartup ? '✅ PASS' : '❌ FAIL'} - API server ${testResults.apiServerStartup ? 'is' : 'is not'} accessible\n`);
    
  } catch (error) {
    console.log(`   Result: ❌ FAIL - Error checking API server startup: ${error.message}\n`);
    testResults.apiServerStartup = false;
  }
}

// Test 5: Test that all required endpoints respond correctly
async function testEndpointsResponding() {
  console.log('📋 Test 5: Testing all required endpoints respond correctly...');
  
  const endpoints = [
    { 
      path: '/', 
      method: 'GET', 
      description: 'Root endpoint',
      expectedStatus: 200
    },
    { 
      path: '/health', 
      method: 'GET', 
      description: 'Health check endpoint',
      expectedStatus: 200
    },
    { 
      path: '/health/db', 
      method: 'GET', 
      description: 'Database health endpoint',
      expectedStatus: 200
    }
  ];
  
  let passedEndpoints = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${API_BASE_URL}${endpoint.path}`,
        timeout: 10000
      });
      
      const statusMatch = response.status === endpoint.expectedStatus;
      console.log(`   ${endpoint.method} ${endpoint.path} (${endpoint.description}): ${statusMatch ? '✅' : '❌'} Status ${response.status} ${statusMatch ? '(expected)' : `(expected ${endpoint.expectedStatus})`}`);
      
      if (statusMatch) passedEndpoints++;
      
    } catch (error) {
      console.log(`   ${endpoint.method} ${endpoint.path} (${endpoint.description}): ❌ Error - ${error.message}`);
      if (error.response) {
        console.log(`     Response status: ${error.response.status}`);
      }
    }
  }
  
  const allEndpointsResponding = passedEndpoints === endpoints.length;
  testResults.endpointsResponding = allEndpointsResponding;
  
  console.log(`   Result: ${allEndpointsResponding ? '✅ PASS' : '❌ FAIL'} - ${passedEndpoints}/${endpoints.length} endpoints responding correctly\n`);
}

// Run all tests
async function runAllTests() {
  console.log(`Testing against API base URL: ${API_BASE_URL}`);
  console.log(`Testing against Supabase URL: ${SUPABASE_API_URL}\n`);
  
  await testSupabaseRunning();
  await testDatabaseConnectivity();
  await testEnvironmentVariables();
  await testApiServerStartup();
  await testEndpointsResponding();
  
  // Summary
  console.log('📊 Test Summary');
  console.log('================');
  
  const tests = [
    { name: 'Supabase Services Running', result: testResults.supabaseRunning },
    { name: 'Database Connectivity', result: testResults.databaseConnectivity },
    { name: 'Environment Variables', result: testResults.environmentVariables },
    { name: 'API Server Startup', result: testResults.apiServerStartup },
    { name: 'Endpoints Responding', result: testResults.endpointsResponding }
  ];
  
  let passedTests = 0;
  tests.forEach((test, index) => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${test.name}: ${status}`);
    if (test.result) passedTests++;
  });
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${tests.length} tests passed`);
  
  if (passedTests === tests.length) {
    console.log('🎉 All Story 1.2 acceptance criteria verified successfully!');
    console.log('✅ Local development environment is ready for development.');
  } else {
    console.log('⚠️  Some tests failed. Please address the issues above.');
    console.log('📚 Common fixes:');
    console.log('   - Ensure Supabase is running: `supabase start`');
    console.log('   - Start the API server: `pnpm dev:api`');
    console.log('   - Check your .env file contains required variables');
    console.log('   - Verify database connection string is correct');
  }
  
  console.log('\n🔧 Development Commands:');
  console.log('   Start Supabase: `supabase start`');
  console.log('   Start API: `pnpm dev:api`');
  console.log('   Start everything: `pnpm dev`');
  console.log('   Push DB schema: `pnpm db:push`');
  console.log('   View DB: `pnpm db:studio`');
  
  process.exit(passedTests === tests.length ? 0 : 1);
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error running tests:', error);
  process.exit(1);
});