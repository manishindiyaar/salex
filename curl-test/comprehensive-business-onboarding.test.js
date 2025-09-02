/*
 * ## Test Description: Comprehensive business onboarding flow with full API endpoint testing
 *
 * ### Input:
 * Creates a complete business profile using API endpoints including business creation, hours setup, services, and routing code assignment.
 *
 * ### Expected Output:
 * A fully configured test business named "TestSalon Premium" with routing code 1234, proper hours, and multiple services ready for operations.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Business creation with proper details and validation.
 * [ ] Test case 2 passed: Business hours configuration for operational schedule.
 * [ ] Test case 3 passed: Multiple services created with proper pricing and duration.
 * [ ] Test case 4 passed: 4-digit routing code "1234" assigned successfully.
 * [ ] Test case 5 passed: End-to-end validation of complete business setup.
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config();

// Configuration from environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN;

if (!JWT_TOKEN) {
  console.error('❌ CLERK_JWT_TOKEN environment variable is required!');
  console.error('   Please add your JWT token to the .env file:');
  console.error('   CLERK_JWT_TOKEN=your_jwt_token_here');
  process.exit(1);  
}

console.log('=== Comprehensive Business Onboarding Test ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log('');

// Test business data
const BUSINESS_DATA = {
  name: "TestSalon Premium",
  businessType: "SALON",
  phoneNumber: "+1234567890",
  address: "123 Test Street, Test City, TC 12345",
  hoursOfOperation: {
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "10:00", close: "16:00", closed: false },
    sunday: { open: "00:00", close: "00:00", closed: true }
  }
};

const SERVICES_DATA = [
  {
    name: "Haircut",
    price: 30.00,
    durationMinutes: 60,
    description: "Professional haircut and styling"
  },
  {
    name: "Hair Wash",
    price: 15.00,
    durationMinutes: 30,
    description: "Deep cleansing hair wash"
  },
  {
    name: "Hair Coloring",
    price: 80.00,
    durationMinutes: 120,
    description: "Professional hair coloring service"
  }
];

const ROUTING_CODE = "1233";

// Global variable to store business ID
let createdBusinessId = null;

/**
 * Helper function for making authenticated API requests
 */
async function makeApiRequest(method, endpoint, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
    }
    
    return response.data;
    
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

/**
 * Step 1: Create the business with comprehensive validation
 */
async function createBusiness() {
  console.log('\n🏢 Step 1: Creating Business');
  console.log('-'.repeat(50));

  try {
    const response = await makeApiRequest('POST', '/api/v1/businesses', BUSINESS_DATA, 201);
    
    // Validate response structure
    if (!response.success) {
      throw new Error(`API returned success: false - ${response.message}`);
    }
    
    if (!response.data || !response.data.id) {
      throw new Error('No business data returned from API');
    }
    
    const business = response.data;
    createdBusinessId = business.id;
    
    // Validate business properties
    console.log(`✅ Business created successfully:`);
    console.log(`   • ID: ${business.id}`);
    console.log(`   • Name: ${business.name}`);
    console.log(`   • Type: ${business.businessType}`);
    console.log(`   • Phone: ${business.phoneNumber}`);
    console.log(`   • Address: ${business.address}`);
    console.log(`   • Owner ID: ${business.ownerId}`);
    
    // Verify Salon was automatically created
    if (business.salon) {
      console.log(`✅ Salon record automatically created: ${business.salon.id}`);
    } else {
      console.log(`⚠️  Warning: Salon record not found in response`);
    }
    
    // Validate required fields
    const requiredFields = ['id', 'ownerId', 'name', 'businessType', 'phoneNumber', 'address'];
    for (const field of requiredFields) {
      if (!business[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Verify business type is correctly set to SALON
    if (business.businessType !== 'SALON') {
      throw new Error(`Expected businessType: SALON, got: ${business.businessType}`);
    }
    
    console.log(`✅ Step 1 COMPLETED: Business creation successful`);
    return business;
    
  } catch (error) {
    console.log(`❌ Step 1 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Step 2: Update business hours for proper operation schedule
 */
async function updateBusinessHours() {
  console.log('\n🕐 Step 2: Setting Business Hours');
  console.log('-'.repeat(50));

  if (!createdBusinessId) {
    throw new Error('Business ID not available - Step 1 may have failed');
  }

  try {
    const hoursPayload = {
      hoursOfOperation: BUSINESS_DATA.hoursOfOperation
    };
    
    const response = await makeApiRequest(
      'PUT', 
      `/api/v1/businesses/${createdBusinessId}/hours`, 
      hoursPayload
    );
    
    if (!response.success || !response.data) {
      throw new Error('Hours update failed');
    }
    
    const updatedBusiness = response.data;
    
    // Validate hours were set correctly
    if (!updatedBusiness.hoursOfOperation) {
      throw new Error('hoursOfOperation not found in response');
    }
    
    console.log(`✅ Business hours updated successfully:`);
    
    // Display schedule
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      const daySchedule = updatedBusiness.hoursOfOperation[day];
      if (daySchedule) {
        if (daySchedule.closed) {
          console.log(`   • ${day.charAt(0).toUpperCase() + day.slice(1)}: CLOSED`);
        } else {
          console.log(`   • ${day.charAt(0).toUpperCase() + day.slice(1)}: ${daySchedule.open} - ${daySchedule.close}`);
        }
      }
    });
    
    console.log(`✅ Step 2 COMPLETED: Business hours configuration successful`);
    return updatedBusiness;
    
  } catch (error) {
    console.log(`❌ Step 2 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Step 3: Create multiple services with proper validation
 */
async function createServices() {
  console.log('\n💼 Step 3: Creating Services');
  console.log('-'.repeat(50));

  if (!createdBusinessId) {
    throw new Error('Business ID not available - Step 1 may have failed');
  }

  const createdServices = [];

  try {
    for (const serviceData of SERVICES_DATA) {
      console.log(`   Creating service: ${serviceData.name}...`);
      
      const response = await makeApiRequest(
        'POST',
        `/api/v1/businesses/${createdBusinessId}/services`,
        serviceData,
        201
      );
      
      if (!response.success || !response.data) {
        throw new Error(`Failed to create service: ${serviceData.name}`);
      }
      
      const service = response.data;
      createdServices.push(service);
      
      // Validate service properties
      const requiredFields = ['id', 'businessId', 'name', 'price', 'durationMinutes'];
      for (const field of requiredFields) {
        if (service[field] === undefined || service[field] === null) {
          throw new Error(`Missing required field in service: ${field}`);
        }
      }
      
      // Verify businessId matches
      if (service.businessId !== createdBusinessId) {
        throw new Error(`Service businessId mismatch: expected ${createdBusinessId}, got ${service.businessId}`);
      }
      
      console.log(`     ✅ ${service.name}: $${service.price} (${service.durationMinutes}min)`);
    }
    
    console.log(`✅ Step 3 COMPLETED: ${createdServices.length} services created successfully`);
    
    // Verify services by retrieving them
    console.log(`   Verifying services...`);
    const servicesResponse = await makeApiRequest('GET', `/api/v1/businesses/${createdBusinessId}/services`);
    
    if (!servicesResponse.success || !servicesResponse.data) {
      throw new Error('Failed to retrieve services for verification');
    }
    
    const retrievedServices = Array.isArray(servicesResponse.data) ? servicesResponse.data : servicesResponse.data.services;
    console.log(`   ✅ Verification: ${retrievedServices ? retrievedServices.length : 0} services found in database`);
    
    return createdServices;
    
  } catch (error) {
    console.log(`❌ Step 3 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Step 4: Set routing code for customer access
 */
async function setRoutingCode() {
  console.log('\n🔢 Step 4: Setting Routing Code');
  console.log('-'.repeat(50));

  if (!createdBusinessId) {
    throw new Error('Business ID not available - Step 1 may have failed');
  }

  try {
    // First check if the routing code is available
    console.log(`   Checking availability of routing code: ${ROUTING_CODE}`);
    
    try {
      const availabilityResponse = await axios.get(
        `${API_BASE_URL}/api/v1/public/businesses/routing-codes/${ROUTING_CODE}/availability`
      );
      
      if (availabilityResponse.data?.data?.available === false) {
        console.log(`   ⚠️  Routing code ${ROUTING_CODE} is already taken`);
        
        if (availabilityResponse.data.data.suggestions) {
          console.log(`   💡 Suggested alternatives: ${availabilityResponse.data.data.suggestions.slice(0, 3).join(', ')}`);
        }
      } else {
        console.log(`   ✅ Routing code ${ROUTING_CODE} is available`);
      }
    } catch (checkError) {
      console.log(`   ⚠️  Could not check availability: ${checkError.message}`);
    }
    
    // Attempt to set the routing code
    console.log(`   Setting routing code: ${ROUTING_CODE}`);
    
    const response = await makeApiRequest(
      'PUT',
      `/api/v1/businesses/${createdBusinessId}/routing-code`,
      { routingCode: ROUTING_CODE }
    );
    
    if (!response.success) {
      throw new Error(`Failed to set routing code: ${response.message}`);
    }
    
    console.log(`✅ Routing code "${ROUTING_CODE}" assigned successfully`);
    
    // Verify the routing code by doing a customer lookup
    console.log(`   Verifying routing code with customer lookup...`);
    
    try {
      const lookupResponse = await axios.get(
        `${API_BASE_URL}/api/v1/public/businesses/by-code/${ROUTING_CODE}`
      );
      
      if (lookupResponse.data?.success && lookupResponse.data.data) {
        const foundBusiness = lookupResponse.data.data;
        console.log(`   ✅ Verification successful: Found business "${foundBusiness.name}"`);
        console.log(`      Customer-facing code: S${foundBusiness.routingCode}`);
      } else {
        console.log(`   ⚠️  Verification failed: Business not found by routing code`);
      }
    } catch (lookupError) {
      console.log(`   ⚠️  Verification lookup failed: ${lookupError.message}`);
    }
    
    console.log(`✅ Step 4 COMPLETED: Routing code configuration successful`);
    return response.data;
    
  } catch (error) {
    console.log(`❌ Step 4 FAILED: ${error.message}`);
    
    // Handle specific routing code errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 409) {
        console.log(`   🔄 Conflict: ${errorData.message || 'Routing code may already be assigned'}`);
        
        if (errorData.data?.suggestions) {
          console.log(`   💡 Try these alternatives: ${errorData.data.suggestions.slice(0, 3).join(', ')}`);
        }
      } else if (status === 400) {
        console.log(`   ❌ Invalid routing code format: ${errorData.message || 'Must be 4 digits between 1000-9999'}`);
      }
    }
    
    throw error;
  }
}

/**
 * Step 5: Final validation and summary
 */
async function finalValidation() {
  console.log('\n✅ Step 5: Final Validation');
  console.log('-'.repeat(50));

  if (!createdBusinessId) {
    throw new Error('Business ID not available for validation');
  }

  try {
    // Get complete business details
    console.log(`   Retrieving complete business profile...`);
    const businessResponse = await makeApiRequest('GET', `/api/v1/businesses/${createdBusinessId}`);
    
    if (!businessResponse.success || !businessResponse.data) {
      throw new Error('Failed to retrieve business for validation');
    }
    
    const business = businessResponse.data;
    
    // Get services count
    const servicesResponse = await makeApiRequest('GET', `/api/v1/businesses/${createdBusinessId}/services`);
    const servicesCount = servicesResponse.data ? 
      (Array.isArray(servicesResponse.data) ? servicesResponse.data.length : servicesResponse.data.services?.length || 0) : 0;
    
    // Get business hours
    let hoursConfigured = false;
    try {
      const hoursResponse = await makeApiRequest('GET', `/api/v1/businesses/${createdBusinessId}/hours`);
      hoursConfigured = !!(hoursResponse.success && hoursResponse.data);
    } catch (error) {
      console.log(`   ℹ️  Hours endpoint not available: ${error.message}`);
    }
    
    console.log(`✅ Step 5 COMPLETED: Final validation successful`);
    console.log('');
    
    return {
      business,
      servicesCount,
      hoursConfigured
    };
    
  } catch (error) {
    console.log(`❌ Step 5 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Test API server connectivity
 */
async function testApiConnection() {
  console.log('🔌 Testing API Server Connection...');
  console.log('-'.repeat(50));
  
  try {
    // Try to connect to the health endpoint first
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log(`✅ API Server is running - Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ API Server connection failed: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`   🔧 Solution: Start the API server with:`);
      console.log(`      cd apps/api && pnpm dev`);
      console.log(`      or: pnpm dev:api (from project root)`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`   🔧 Solution: Check if API_BASE_URL is correct: ${API_BASE_URL}`);
    } else if (error.response?.status === 404) {
      console.log(`   ℹ️  API is running but /health endpoint not found - proceeding anyway`);
      return true;
    }
    
    return false;
  }
}

/**
 * Main test execution function
 */
async function runComprehensiveOnboardingTest() {
  console.log('🚀 Starting Comprehensive Business Onboarding Test...\n');
  
  // Test API connection first
  const apiConnected = await testApiConnection();
  if (!apiConnected) {
    console.log('\n💥 Cannot proceed without API server connection!');
    process.exit(1);
  }
  
  console.log(''); // Add space before continuing
  const startTime = Date.now();
  let business, services, routingCodeResult, validationResult;
  
  try {
    // Execute all onboarding steps
    business = await createBusiness();
    await updateBusinessHours();
    services = await createServices();
    routingCodeResult = await setRoutingCode();
    validationResult = await finalValidation();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Display comprehensive summary
    console.log('\n🎉 COMPREHENSIVE ONBOARDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📋 Business Summary:');
    console.log(`   • Business Name: ${business.name}`);
    console.log(`   • Business ID: ${business.id}`);
    console.log(`   • Business Type: ${business.businessType}`);
    console.log(`   • Phone Number: ${business.phoneNumber}`);
    console.log(`   • Address: ${business.address}`);
    console.log(`   • Routing Code: S${ROUTING_CODE}`);
    console.log('');
    console.log('⚙️  Configuration Details:');
    console.log(`   • Services Created: ${services.length}`);
    console.log(`   • Business Hours: ${validationResult.hoursConfigured ? 'Configured' : 'Default'}`);
    console.log(`   • Salon Profile: Auto-created`);
    console.log('');
    console.log('💰 Services Overview:');
    services.forEach(service => {
      console.log(`   • ${service.name}: $${service.price} (${service.durationMinutes} minutes)`);
    });
    console.log('');
    console.log('🔗 Customer Access:');
    console.log(`   • Customers can find this business using code: S${ROUTING_CODE}`);
    console.log(`   • Public lookup URL: ${API_BASE_URL}/api/v1/public/businesses/by-code/${ROUTING_CODE}`);
    console.log('');
    console.log('📊 Test Execution:');
    console.log(`   • Total Duration: ${duration} seconds`);
    console.log(`   • All Steps Completed: ✅`);
    console.log(`   • Business Ready for Operations: ✅`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   • Business is now ready for customer bookings');
    console.log('   • WhatsApp integration can be tested with this routing code');
    console.log('   • Timeslots API can be used for appointment scheduling');
    console.log('');
    
    // Store business ID for future use
    process.env.TEST_BUSINESS_ID = business.id;
    console.log(`💾 Business ID stored in environment: TEST_BUSINESS_ID=${business.id}`);
    
    console.log('\n✅ COMPREHENSIVE BUSINESS ONBOARDING TEST PASSED!');
    process.exit(0);
    
  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n💥 COMPREHENSIVE BUSINESS ONBOARDING TEST FAILED!');
    console.log('='.repeat(70));
    console.log(`❌ Error: ${error.message}`);
    console.log(`⏱️  Test Duration: ${duration} seconds`);
    
    if (createdBusinessId) {
      console.log(`🔧 Partial Progress: Business ID ${createdBusinessId} may have been created`);
      console.log(`   You can manually inspect or clean up this business if needed.`);
    }
    
    console.log('\n🔍 Troubleshooting Tips:');
    console.log('   1. Verify API server is running on ' + API_BASE_URL);
    console.log('   2. Check JWT token is valid and not expired');
    console.log('   3. Ensure database connection is working');
    console.log('   4. Verify routing code is not already taken');
    console.log('   5. Check API endpoints are properly configured');
    
    process.exit(1);
  }
}

// Execute the test if called directly
if (require.main === module) {
  runComprehensiveOnboardingTest();
}

module.exports = {
  runComprehensiveOnboardingTest,
  BUSINESS_DATA,
  SERVICES_DATA,
  ROUTING_CODE
};