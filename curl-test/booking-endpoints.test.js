/*
 * ## Test Description: Individual booking endpoint testing with specific scenarios
 *
 * ### Input:
 * Tests each booking endpoint individually with focused test cases and validation.
 *
 * ### Expected Output:
 * Validation of each booking API endpoint with detailed response verification.
 *
 * ### Passes:
 * [ ] Test case 1 passed: POST /api/v1/businesses/{id}/bookings creates booking successfully.
 * [ ] Test case 2 passed: GET /api/v1/bookings/{id} retrieves booking details.
 * [ ] Test case 3 passed: PUT /api/v1/bookings/{id} updates booking correctly.
 * [ ] Test case 4 passed: PUT /api/v1/bookings/{id}/confirm changes status to CONFIRMED.
 * [ ] Test case 5 passed: PUT /api/v1/bookings/{id}/complete changes status to COMPLETED.
 * [ ] Test case 6 passed: PUT /api/v1/bookings/{id}/cancel-customer handles customer cancellation.
 * [ ] Test case 7 passed: PUT /api/v1/bookings/{id}/cancel handles salon cancellation.
 * [ ] Test case 8 passed: DELETE /api/v1/bookings/{id} removes booking.
 * [ ] Test case 9 passed: GET /api/v1/customers/{phone}/bookings returns customer bookings.
 * [ ] Test case 10 passed: GET /api/v1/businesses/{id}/bookings returns business bookings.
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

console.log('=== Booking Endpoints Individual Test ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log('');

// Test constants
const ROUTING_CODE = "1234";
const TEST_CUSTOMER = {
  name: "John Doe",
  phoneNumber: "+1234567890",
  email: "john.doe@example.com"
};

// Global test variables
let testBusinessId = null;
let testServiceId = null;
let createdBookingId = null;

/**
 * Helper function for making API requests
 */
async function makeRequest(method, endpoint, data = null, auth = true, expectedStatus = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (auth) {
      config.headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    
    if (expectedStatus && response.status !== expectedStatus) {
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
 * Get tomorrow's date at a specific time
 */
function getTomorrowAt(hour, minute = 0) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hour, minute, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Setup: Get test business and service data
 */
async function setupTestData() {
  console.log('\n🔍 Setup: Getting Test Business Data');
  console.log('-'.repeat(50));

  try {
    // Find business by routing code
    const businessLookup = await axios.get(
      `${API_BASE_URL}/api/v1/public/businesses/by-code/${ROUTING_CODE}`
    );
    
    if (!businessLookup.data?.success || !businessLookup.data.data) {
      throw new Error(`Test business not found. Run comprehensive-business-onboarding.test.js first.`);
    }
    
    const business = businessLookup.data.data;
    testBusinessId = business.id;
    console.log(`✅ Found test business: ${business.name} (ID: ${testBusinessId})`);
    
    // Get first service
    const servicesResponse = await makeRequest('GET', `/api/v1/businesses/${testBusinessId}/services`, null, false);
    const services = Array.isArray(servicesResponse.data) ? servicesResponse.data : servicesResponse.data.services || [];
    
    if (services.length === 0) {
      throw new Error('No services found for test business');
    }
    
    testServiceId = services[0].id;
    console.log(`✅ Using test service: ${services[0].name} (ID: ${testServiceId})`);
    
    console.log('✅ Setup completed successfully');
    
  } catch (error) {
    console.log(`❌ Setup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test 1: POST /api/v1/businesses/{businessId}/bookings - Create booking
 */
async function testCreateBooking() {
  console.log('\n📅 Test 1: Create Booking');
  console.log('-'.repeat(50));

  try {
    const bookingData = {
      serviceId: testServiceId,
      customerName: TEST_CUSTOMER.name,
      customerPhone: TEST_CUSTOMER.phoneNumber,
      customerEmail: TEST_CUSTOMER.email,
      appointmentTime: getTomorrowAt(14, 30), // Tomorrow at 2:30 PM
      notes: "Test booking for endpoint validation"
    };

    console.log(`Creating booking for ${TEST_CUSTOMER.name}...`);
    console.log(`Service ID: ${testServiceId}, Time: ${new Date(bookingData.appointmentTime).toLocaleString()}`);

    const response = await makeRequest(
      'POST',
      `/api/v1/businesses/${testBusinessId}/bookings`,
      bookingData,
      false, // Public endpoint
      201
    );

    if (!response.success || !response.data) {
      throw new Error('Create booking response invalid');
    }

    const booking = response.data;
    createdBookingId = booking.id;

    // Validate response structure
    const requiredFields = ['id', 'businessId', 'serviceId', 'customerName', 'customerPhone', 'appointmentTime', 'status'];
    for (const field of requiredFields) {
      if (booking[field] === undefined) {
        throw new Error(`Missing field in response: ${field}`);
      }
    }

    // Validate values
    if (booking.businessId !== testBusinessId) {
      throw new Error(`Business ID mismatch: expected ${testBusinessId}, got ${booking.businessId}`);
    }

    if (booking.serviceId !== testServiceId) {
      throw new Error(`Service ID mismatch: expected ${testServiceId}, got ${booking.serviceId}`);
    }

    if (booking.customerName !== TEST_CUSTOMER.name) {
      throw new Error(`Customer name mismatch: expected ${TEST_CUSTOMER.name}, got ${booking.customerName}`);
    }

    if (booking.status !== 'PENDING') {
      throw new Error(`Initial status should be PENDING, got ${booking.status}`);
    }

    console.log(`✅ Booking created successfully:`);
    console.log(`   • ID: ${booking.id}`);
    console.log(`   • Status: ${booking.status}`);
    console.log(`   • Customer: ${booking.customerName}`);
    console.log(`   • Time: ${new Date(booking.appointmentTime).toLocaleString()}`);

    console.log('✅ Test 1 PASSED: Create booking endpoint working correctly');

  } catch (error) {
    console.log(`❌ Test 1 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Test 2: GET /api/v1/bookings/{bookingId} - Get booking details
 */
async function testGetBookingDetails() {
  console.log('\n🔍 Test 2: Get Booking Details');
  console.log('-'.repeat(50));

  try {
    console.log(`Getting details for booking ${createdBookingId}...`);

    const response = await makeRequest(
      'GET',
      `/api/v1/bookings/${createdBookingId}`,
      null,
      false, // Public endpoint
      200
    );

    if (!response.success || !response.data) {
      throw new Error('Get booking details response invalid');
    }

    const booking = response.data;

    // Validate booking ID matches
    if (booking.id !== createdBookingId) {
      throw new Error(`Booking ID mismatch: expected ${createdBookingId}, got ${booking.id}`);
    }

    // Should include service and business details
    if (!booking.service) {
      console.log('⚠️  Warning: Service details not included in response');
    } else {
      console.log(`   • Service: ${booking.service.name} ($${booking.service.price})`);
    }

    if (!booking.business) {
      console.log('⚠️  Warning: Business details not included in response');
    } else {
      console.log(`   • Business: ${booking.business.name}`);
    }

    console.log(`✅ Booking details retrieved:`);
    console.log(`   • ID: ${booking.id}`);
    console.log(`   • Status: ${booking.status}`);
    console.log(`   • Customer: ${booking.customerName} (${booking.customerPhone})`);
    console.log(`   • Time: ${new Date(booking.appointmentTime).toLocaleString()}`);

    console.log('✅ Test 2 PASSED: Get booking details endpoint working correctly');

  } catch (error) {
    console.log(`❌ Test 2 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Test 3: PUT /api/v1/bookings/{bookingId} - Update booking
 */
async function testUpdateBooking() {
  console.log('\n✏️ Test 3: Update Booking');
  console.log('-'.repeat(50));

  try {
    const updateData = {
      appointmentTime: getTomorrowAt(16, 0), // Change to 4:00 PM
      notes: "Updated booking - rescheduled by test"
    };

    console.log(`Updating booking ${createdBookingId}...`);
    console.log(`New time: ${new Date(updateData.appointmentTime).toLocaleString()}`);

    const response = await makeRequest(
      'PUT',
      `/api/v1/bookings/${createdBookingId}`,
      updateData,
      true, // Protected endpoint
      200
    );

    if (!response.success || !response.data) {
      throw new Error('Update booking response invalid');
    }

    const updatedBooking = response.data;

    // Validate updates
    if (new Date(updatedBooking.appointmentTime).getTime() !== new Date(updateData.appointmentTime).getTime()) {
      throw new Error('Appointment time was not updated correctly');
    }

    if (updatedBooking.notes !== updateData.notes) {
      throw new Error('Notes were not updated correctly');
    }

    // Status should remain the same
    if (updatedBooking.status !== 'PENDING') {
      console.log(`⚠️  Status changed during update: ${updatedBooking.status}`);
    }

    console.log(`✅ Booking updated successfully:`);
    console.log(`   • New time: ${new Date(updatedBooking.appointmentTime).toLocaleString()}`);
    console.log(`   • New notes: ${updatedBooking.notes}`);
    console.log(`   • Status: ${updatedBooking.status}`);

    console.log('✅ Test 3 PASSED: Update booking endpoint working correctly');

  } catch (error) {
    console.log(`❌ Test 3 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Test 4: PUT /api/v1/bookings/{bookingId}/confirm - Confirm booking
 */
async function testConfirmBooking() {
  console.log('\n✅ Test 4: Confirm Booking');
  console.log('-'.repeat(50));

  try {
    console.log(`Confirming booking ${createdBookingId}...`);

    const response = await makeRequest(
      'PUT',
      `/api/v1/bookings/${createdBookingId}/confirm`,
      {},
      true, // Protected endpoint
      200
    );

    if (!response.success || !response.data) {
      throw new Error('Confirm booking response invalid');
    }

    const confirmedBooking = response.data;

    // Validate status changed to CONFIRMED
    if (confirmedBooking.status !== 'CONFIRMED') {
      throw new Error(`Expected status CONFIRMED, got: ${confirmedBooking.status}`);
    }

    console.log(`✅ Booking confirmed successfully:`);
    console.log(`   • Status: ${confirmedBooking.status}`);
    console.log(`   • Confirmed at: ${new Date().toLocaleString()}`);

    console.log('✅ Test 4 PASSED: Confirm booking endpoint working correctly');

  } catch (error) {
    console.log(`❌ Test 4 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Test 5: PUT /api/v1/bookings/{bookingId}/complete - Complete booking
 */
async function testCompleteBooking() {
  console.log('\n🎯 Test 5: Complete Booking');
  console.log('-'.repeat(50));

  try {
    const completionData = {
      notes: "Service completed successfully - test scenario",
      actualDuration: 60
    };

    console.log(`Completing booking ${createdBookingId}...`);

    const response = await makeRequest(
      'PUT',
      `/api/v1/bookings/${createdBookingId}/complete`,
      completionData,
      true, // Protected endpoint
      200
    );

    if (!response.success || !response.data) {
      throw new Error('Complete booking response invalid');
    }

    const completedBooking = response.data;

    // Validate status changed to COMPLETED
    if (completedBooking.status !== 'COMPLETED') {
      throw new Error(`Expected status COMPLETED, got: ${completedBooking.status}`);
    }

    console.log(`✅ Booking completed successfully:`);
    console.log(`   • Status: ${completedBooking.status}`);
    console.log(`   • Completion notes: ${completionData.notes}`);

    console.log('✅ Test 5 PASSED: Complete booking endpoint working correctly');

  } catch (error) {
    console.log(`❌ Test 5 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Test 6: Create a new booking for cancellation tests
 */
async function createBookingForCancellation() {
  console.log('\n📅 Setup: Creating Booking for Cancellation Tests');
  console.log('-'.repeat(50));

  try {
    const bookingData = {
      serviceId: testServiceId,
      customerName: "Jane Smith",
      customerPhone: "+1234567891",
      customerEmail: "jane.smith@example.com",
      appointmentTime: getTomorrowAt(10, 0), // Tomorrow at 10:00 AM
      notes: "Test booking for cancellation"
    };

    const response = await makeRequest(
      'POST',
      `/api/v1/businesses/${testBusinessId}/bookings`,
      bookingData,
      false,
      201
    );

    const booking = response.data.data;
    console.log(`✅ Created cancellation test booking: ${booking.id}`);
    
    return booking.id;

  } catch (error) {
    console.log(`❌ Failed to create cancellation test booking: ${error.message}`);
    throw error;
  }
}

/**
 * Test 6: PUT /api/v1/bookings/{bookingId}/cancel-customer - Customer cancellation
 */
async function testCustomerCancellation() {
  console.log('\n❌ Test 6: Customer Cancellation');
  console.log('-'.repeat(50));

  try {
    const cancellationBookingId = await createBookingForCancellation();
    
    const cancelData = {
      customerPhone: "+1234567891", // Must match the booking
      reason: "Customer requested cancellation - test"
    };

    console.log(`Customer cancelling booking ${cancellationBookingId}...`);

    const response = await makeRequest(
      'PUT',
      `/api/v1/bookings/${cancellationBookingId}/cancel-customer`,
      cancelData,
      false, // Public endpoint
      200
    );

    if (!response.success || !response.data) {
      throw new Error('Customer cancel response invalid');
    }

    const cancelledBooking = response.data;

    // Validate status changed
    if (cancelledBooking.status !== 'CANCELLED_BY_CUSTOMER') {
      throw new Error(`Expected status CANCELLED_BY_CUSTOMER, got: ${cancelledBooking.status}`);
    }

    console.log(`✅ Booking cancelled by customer:`);
    console.log(`   • Status: ${cancelledBooking.status}`);
    console.log(`   • Reason: ${cancelData.reason}`);

    console.log('✅ Test 6 PASSED: Customer cancellation endpoint working correctly');

  } catch (error) {
    console.log(`❌ Test 6 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Test 7: PUT /api/v1/bookings/{bookingId}/cancel - Salon cancellation
 */
async function testSalonCancellation() {
  console.log('\n🏪 Test 7: Salon Cancellation');
  console.log('-'.repeat(50));

  try {
    const cancellationBookingId = await createBookingForCancellation();
    
    const cancelData = {
      reason: "Salon emergency - staff unavailable",
      refundOffered: true
    };

    console.log(`Salon cancelling booking ${cancellationBookingId}...`);

    const response = await makeRequest(
      'PUT',
      `/api/v1/bookings/${cancellationBookingId}/cancel`,
      cancelData,
      true, // Protected endpoint
      200
    );

    if (!response.success || !response.data) {
      throw new Error('Salon cancel response invalid');
    }

    const cancelledBooking = response.data;

    // Validate status changed
    if (cancelledBooking.status !== 'CANCELLED_BY_SALON') {
      throw new Error(`Expected status CANCELLED_BY_SALON, got: ${cancelledBooking.status}`);
    }

    console.log(`✅ Booking cancelled by salon:`);
    console.log(`   • Status: ${cancelledBooking.status}`);
    console.log(`   • Reason: ${cancelData.reason}`);
    console.log(`   • Refund offered: ${cancelData.refundOffered}`);

    console.log('✅ Test 7 PASSED: Salon cancellation endpoint working correctly');

  } catch (error) {
    console.log(`❌ Test 7 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Test 8: DELETE /api/v1/bookings/{bookingId} - Delete booking
 */
async function testDeleteBooking() {
  console.log('\n🗑️ Test 8: Delete Booking');
  console.log('-'.repeat(50));

  try {
    const deleteBookingId = await createBookingForCancellation();
    
    console.log(`Deleting booking ${deleteBookingId}...`);

    const response = await makeRequest(
      'DELETE',
      `/api/v1/bookings/${deleteBookingId}`,
      null,
      true, // Protected endpoint
      200
    );

    if (!response.success) {
      throw new Error('Delete booking response invalid');
    }

    console.log(`✅ Booking deleted successfully`);

    // Verify booking is gone by trying to get it
    try {
      await makeRequest(
        'GET',
        `/api/v1/bookings/${deleteBookingId}`,
        null,
        false,
        404
      );
      console.log(`✅ Verified: Booking no longer exists`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`✅ Verified: Booking no longer exists`);
      } else {
        throw new Error(`Unexpected error verifying deletion: ${error.message}`);
      }
    }

    console.log('✅ Test 8 PASSED: Delete booking endpoint working correctly');

  } catch (error) {
    console.log(`❌ Test 8 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Test 9: GET /api/v1/customers/{customerPhone}/bookings - Get customer bookings
 */
async function testGetCustomerBookings() {
  console.log('\n👤 Test 9: Get Customer Bookings');
  console.log('-'.repeat(50));

  try {
    const customerPhone = TEST_CUSTOMER.phoneNumber;
    
    console.log(`Getting bookings for customer: ${customerPhone}`);

    const response = await makeRequest(
      'GET',
      `/api/v1/customers/${encodeURIComponent(customerPhone)}/bookings`,
      null,
      false, // Public endpoint
      200
    );

    if (!response.success || !response.data) {
      throw new Error('Get customer bookings response invalid');
    }

    const customerBookings = Array.isArray(response.data) ? response.data : response.data.bookings || [];

    // Should find our created booking
    const foundBooking = customerBookings.find(b => b.customerPhone === customerPhone);
    if (!foundBooking) {
      throw new Error(`No booking found for customer ${customerPhone}`);
    }

    console.log(`✅ Found ${customerBookings.length} booking(s) for customer:`);
    customerBookings.forEach(booking => {
      console.log(`   • Booking ${booking.id}: ${booking.status} - ${new Date(booking.appointmentTime).toLocaleString()}`);
    });

    console.log('✅ Test 9 PASSED: Get customer bookings endpoint working correctly');

  } catch (error) {
    console.log(`❌ Test 9 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Test 10: GET /api/v1/businesses/{businessId}/bookings - Get business bookings
 */
async function testGetBusinessBookings() {
  console.log('\n🏢 Test 10: Get Business Bookings');
  console.log('-'.repeat(50));

  try {
    console.log(`Getting all bookings for business: ${testBusinessId}`);

    const response = await makeRequest(
      'GET',
      `/api/v1/businesses/${testBusinessId}/bookings`,
      null,
      true, // Protected endpoint
      200
    );

    if (!response.success || !response.data) {
      throw new Error('Get business bookings response invalid');
    }

    const businessBookings = Array.isArray(response.data) ? response.data : response.data.bookings || [];

    console.log(`✅ Found ${businessBookings.length} total booking(s) for business:`);
    
    // Group by status
    const statusGroups = businessBookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    Object.entries(statusGroups).forEach(([status, count]) => {
      console.log(`   • ${status}: ${count} booking(s)`);
    });

    // Should include our test booking
    const ourBooking = businessBookings.find(b => b.id === createdBookingId);
    if (ourBooking) {
      console.log(`   • Our test booking found: ${ourBooking.id} (${ourBooking.status})`);
    } else {
      console.log(`   • Our test booking not found in results`);
    }

    console.log('✅ Test 10 PASSED: Get business bookings endpoint working correctly');

  } catch (error) {
    console.log(`❌ Test 10 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Main test execution
 */
async function runBookingEndpointsTest() {
  console.log('🚀 Starting Individual Booking Endpoints Test...\n');
  const startTime = Date.now();
  
  let passedTests = 0;
  let totalTests = 10;

  try {
    await setupTestData();

    // Run each test individually and track results
    const tests = [
      { name: 'Create Booking', func: testCreateBooking },
      { name: 'Get Booking Details', func: testGetBookingDetails },
      { name: 'Update Booking', func: testUpdateBooking },
      { name: 'Confirm Booking', func: testConfirmBooking },
      { name: 'Complete Booking', func: testCompleteBooking },
      { name: 'Customer Cancellation', func: testCustomerCancellation },
      { name: 'Salon Cancellation', func: testSalonCancellation },
      { name: 'Delete Booking', func: testDeleteBooking },
      { name: 'Get Customer Bookings', func: testGetCustomerBookings },
      { name: 'Get Business Bookings', func: testGetBusinessBookings }
    ];

    for (const test of tests) {
      try {
        await test.func();
        passedTests++;
      } catch (error) {
        console.log(`⚠️  Test "${test.name}" failed but continuing with other tests...`);
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Results summary
    console.log('\n🎉 BOOKING ENDPOINTS TEST COMPLETED!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 Test Results:');
    console.log(`   • Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`   • Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    console.log(`   • Duration: ${duration} seconds`);
    console.log('');
    console.log('✅ Endpoints Tested:');
    console.log('   • POST /api/v1/businesses/{id}/bookings');
    console.log('   • GET /api/v1/bookings/{id}');
    console.log('   • PUT /api/v1/bookings/{id}');
    console.log('   • PUT /api/v1/bookings/{id}/confirm');
    console.log('   • PUT /api/v1/bookings/{id}/complete');
    console.log('   • PUT /api/v1/bookings/{id}/cancel-customer');
    console.log('   • PUT /api/v1/bookings/{id}/cancel');
    console.log('   • DELETE /api/v1/bookings/{id}');
    console.log('   • GET /api/v1/customers/{phone}/bookings');
    console.log('   • GET /api/v1/businesses/{id}/bookings');

    if (passedTests === totalTests) {
      console.log('\n✅ ALL BOOKING ENDPOINTS WORKING CORRECTLY!');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed - review output above`);
      process.exit(1);
    }

  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n💥 BOOKING ENDPOINTS TEST FAILED!');
    console.log('='.repeat(60));
    console.log(`❌ Fatal Error: ${error.message}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Tests Passed: ${passedTests}/${totalTests}`);
    
    process.exit(1);
  }
}

// Execute test if called directly
if (require.main === module) {
  runBookingEndpointsTest();
}

module.exports = {
  runBookingEndpointsTest,
  makeRequest,
  testBusinessId,
  testServiceId
};