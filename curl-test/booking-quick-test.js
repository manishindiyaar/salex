/*
 * ## Test Description: Quick booking API validation test
 *
 * ### Input:
 * Rapid test of core booking functionality - create, retrieve, update, confirm workflow.
 *
 * ### Expected Output:
 * Quick validation that booking endpoints are working with basic CRUD operations.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Booking creation works.
 * [ ] Test case 2 passed: Booking retrieval works.  
 * [ ] Test case 3 passed: Booking update works.
 * [ ] Test case 4 passed: Booking confirmation works.
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN;

if (!JWT_TOKEN) {
  console.error('❌ CLERK_JWT_TOKEN required in .env file');
  process.exit(1);  
}

console.log('=== Quick Booking Test ===');
console.log(`API: ${API_BASE_URL}`);
console.log('');

const ROUTING_CODE = "1234";

async function quickBookingTest() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Finding test business...');
    
    // Get test business
    const businessResponse = await axios.get(`${API_BASE_URL}/api/v1/public/businesses/by-code/${ROUTING_CODE}`);
    const business = businessResponse.data.data;
    const businessId = business.id;
    console.log(`✅ Business: ${business.name} (${businessId})`);
    
    // Get services
    const servicesResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/${businessId}/services`);
    const services = servicesResponse.data.data || servicesResponse.data;
    const serviceId = services[0].id;
    console.log(`✅ Service: ${services[0].name} (${serviceId})`);
    
    // Create booking
    console.log('\n📅 Creating booking...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);
    
    const bookingData = {
      serviceId: serviceId,
      customerName: "Quick Test Customer",
      customerPhone: "+1234567999",
      customerEmail: "quicktest@example.com",
      appointmentTime: tomorrow.toISOString(),
      notes: "Quick test booking"
    };
    
    const createResponse = await axios.post(
      `${API_BASE_URL}/api/v1/businesses/${businessId}/bookings`,
      bookingData,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const booking = createResponse.data.data;
    const bookingId = booking.id;
    console.log(`✅ Created: ${bookingId} (Status: ${booking.status})`);
    
    // Get booking details
    console.log('🔍 Getting booking details...');
    const getResponse = await axios.get(`${API_BASE_URL}/api/v1/bookings/${bookingId}`);
    const retrievedBooking = getResponse.data.data;
    console.log(`✅ Retrieved: ${retrievedBooking.customerName} - ${retrievedBooking.status}`);
    
    // Update booking
    console.log('✏️ Updating booking...');
    const updateData = {
      notes: "Updated by quick test",
      appointmentTime: new Date(tomorrow.getTime() + 3600000).toISOString() // +1 hour
    };
    
    const updateResponse = await axios.put(
      `${API_BASE_URL}/api/v1/bookings/${bookingId}`,
      updateData,
      { headers: { 
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json' 
      }}
    );
    
    const updatedBooking = updateResponse.data.data;
    console.log(`✅ Updated: ${new Date(updatedBooking.appointmentTime).toLocaleTimeString()}`);
    
    // Confirm booking
    console.log('✅ Confirming booking...');
    const confirmResponse = await axios.put(
      `${API_BASE_URL}/api/v1/bookings/${bookingId}/confirm`,
      {},
      { headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }}
    );
    
    const confirmedBooking = confirmResponse.data.data;
    console.log(`✅ Confirmed: Status ${confirmedBooking.status}`);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n🎉 QUICK BOOKING TEST PASSED!');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📋 Booking ID: ${bookingId}`);
    console.log('🚀 All core booking operations working!');
    
  } catch (error) {
    console.log(`\n❌ QUICK BOOKING TEST FAILED!`);
    console.log(`Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

quickBookingTest();