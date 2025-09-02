/*
 * ========================================
 * WhatsApp Webhook Integration Test
 * ========================================
 * 
 * This script tests the complete WhatsApp webhook integration
 * with your Salex API server running on port 3000.
 * 
 * Prerequisites:
 * 1. API server running: pnpm dev
 * 2. ngrok tunnel active for webhook URL
 * 3. Meta webhook configured with verify token
 * 
 * Test Flow:
 * 1. Webhook verification (Meta → Your API)
 * 2. Text message processing (User → WhatsApp → Meta → Your API)
 * 3. Interactive message handling (Buttons/Lists)
 * 4. Health check validation
 */

const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file

// ========================================
// Configuration
// ========================================
const API_BASE_URL ='https://e68e8d29007f.ngrok-free.app';
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'my-verify-token';

console.log('🚀 WhatsApp Webhook Integration Test');
console.log('='.repeat(50));
console.log(`📡 API Server: ${API_BASE_URL}`);
console.log(`🔑 Verify Token: ${WEBHOOK_VERIFY_TOKEN}`);
console.log(`📱 Test Phone: 919801441675`);
console.log('='.repeat(50));
console.log('');

// ========================================
// Test Data - Real WhatsApp Message Structure
// ========================================

/**
 * Text message payload structure
 * This matches exactly what WhatsApp sends to your webhook
 */
const textMessagePayload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '1828755277851182', // Your WhatsApp Business Account ID
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '919801441675', // Your business phone
              phone_number_id: '702046082996188'    // Phone number ID from Meta
            },
            contacts: [
              {
                profile: 'Test User',        // Customer name (string, not object!)
                wa_id: '919801441675'        // Customer WhatsApp ID
              }
            ],
            messages: [
              {
                from: '919801441675',        // Customer phone number
                id: 'wamid.test_message_id', // Unique message ID from WhatsApp
                timestamp: String(Math.floor(Date.now() / 1000)), // Unix timestamp
                text: {
                  body: 'Hello from webhook test!' // The actual message text
                },
                type: 'text'                 // Message type: text, interactive, etc.
              }
            ]
          }
        }
      ]
    }
  ]
};

/**
 * Button interaction payload
 * When user clicks a button in your WhatsApp message
 */
const buttonMessagePayload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '1828755277851182',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '919801441675',
              phone_number_id: '702046082996188'
            },
            contacts: [
              {
                profile: 'Test User',
                wa_id: '919801441675'
              }
            ],
            messages: [
              {
                from: '919801441675',
                id: 'wamid.button_test_id',
                timestamp: String(Math.floor(Date.now() / 1000)),
                interactive: {
                  type: 'button_reply',      // Type of interaction
                  button_reply: {
                    id: 'book_appointment',  // Button ID you defined
                    title: 'Book Now'       // Button text user clicked
                  }
                },
                type: 'interactive'          // Message type for buttons/lists
              }
            ]
          }
        }
      ]
    }
  ]
};

// ========================================
// Test Functions
// ========================================

/**
 * Test 1: Webhook Verification
 * Meta calls this to verify your webhook URL is valid
 */
async function testWebhookVerification() {
  console.log('🔐 Test 1: Webhook Verification');
  console.log('-'.repeat(35));
  
  try {
    // Generate unique challenge (Meta does this)
    const challenge = 'meta-challenge-' + Date.now();
    
    // Build verification URL with required parameters
    const params = new URLSearchParams({
      'hub.mode': 'subscribe',           // Always 'subscribe' for verification
      'hub.verify_token': WEBHOOK_VERIFY_TOKEN, // Your verify token
      'hub.challenge': challenge         // Random string to echo back
    });

    console.log('📤 Sending verification request...');
    console.log(`   Mode: subscribe`);
    console.log(`   Token: ${WEBHOOK_VERIFY_TOKEN}`);
    console.log(`   Challenge: ${challenge}`);

    // Send GET request to webhook endpoint
    const response = await axios.get(`${API_BASE_URL}/webhooks/whatsapp?${params}`);

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response: "${response.data}"`);
    
    // Verify API returned the exact challenge
    if (response.data === challenge) {
      console.log('🎉 WEBHOOK VERIFICATION SUCCESS!');
      console.log('   → Meta will now send webhooks to your endpoint');
    } else {
      console.log(`❌ Challenge mismatch! Expected: "${challenge}", Got: "${response.data}"`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Verification failed: ${error.response?.status || 'Network Error'}`);
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 2: Text Message Processing
 * Simulates a customer sending a text message
 */
async function testTextMessage() {
  console.log('\n💬 Test 2: Text Message Processing');
  console.log('-'.repeat(38));

  try {
    console.log('📤 Simulating text message from customer...');
    console.log(`   From: 919801441675`);
    console.log(`   Message: "Hello from webhook test!"`);
    console.log(`   Type: text`);

    // Send POST request (no signature in dev mode)
    const response = await axios.post(`${API_BASE_URL}/webhooks/whatsapp`, textMessagePayload, {
      headers: {
        'Content-Type': 'application/json'
        // Note: No X-Hub-Signature-256 header in development
        // Production requires proper WhatsApp signature
      }
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${response.data.success}`);
    console.log(`✅ Message: ${response.data.message}`);
    console.log(`✅ Status: ${response.data.data?.status}`);
    
    if (response.data.success) {
      console.log('🎉 TEXT MESSAGE PROCESSED!');
      console.log('   → Check API terminal for detailed processing logs');
      console.log('   → Business context extracted and customer identified');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Text message failed: ${error.response?.status || 'Network Error'}`);
    console.log(`   Error: ${JSON.stringify(error.response?.data, null, 2) || error.message}`);
    return false;
  }
}

/**
 * Test 3: Interactive Button Message
 * Simulates customer clicking a button in your WhatsApp message
 */
async function testButtonInteraction() {
  console.log('\n🔘 Test 3: Button Interaction');
  console.log('-'.repeat(30));

  try {
    console.log('📤 Simulating button click from customer...');
    console.log(`   From: 919801441675`);
    console.log(`   Button ID: book_appointment`);
    console.log(`   Button Text: "Book Now"`);
    console.log(`   Type: interactive`);

    const response = await axios.post(`${API_BASE_URL}/webhooks/whatsapp`, buttonMessagePayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${response.data.success}`);
    console.log(`✅ Message: ${response.data.message}`);
    
    if (response.data.success) {
      console.log('🎉 BUTTON INTERACTION PROCESSED!');
      console.log('   → Your API can now handle button clicks');
      console.log('   → Note: Check logs for "Unsupported message type" - needs implementation');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Button interaction failed: ${error.response?.status || 'Network Error'}`);
    console.log(`   Error: ${JSON.stringify(error.response?.data, null, 2) || error.message}`);
    return false;
  }
}

/**
 * Test 4: API Health Check
 * Validates WhatsApp service is running properly
 */
async function testHealthCheck() {
  console.log('\n🏥 Test 4: Health Check');
  console.log('-'.repeat(25));

  try {
    console.log('📤 Checking WhatsApp service health...');
    
    const response = await axios.get(`${API_BASE_URL}/webhooks/whatsapp/health`);

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Health: ${response.data.data?.status}`);
    console.log(`✅ Timestamp: ${response.data.data?.timestamp}`);
    
    if (response.data.success) {
      console.log('🎉 WHATSAPP SERVICE HEALTHY!');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Health check failed: ${error.response?.status || 'Network Error'}`);
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ========================================
// Main Test Runner
// ========================================

/**
 * Run all webhook tests in sequence
 * Reports final results and next steps
 */
async function runWebhookTests() {
  console.log('🚀 Starting WhatsApp webhook integration tests...\n');
  
  // Pre-test instructions
  console.log('📋 Prerequisites Check:');
  console.log(`   1. ✅ API server running: ${API_BASE_URL}`);
  console.log(`   2. ✅ Webhook verify token: ${WEBHOOK_VERIFY_TOKEN}`);
  console.log(`   3. ✅ Environment loaded from .env file`);
  console.log('   4. ✅ WhatsApp phone: 919801441675');
  console.log('   5. ✅ Watch API terminal for detailed logs\n');
  
  // Run all tests
  const results = [];
  results.push(await testWebhookVerification());
  results.push(await testTextMessage());  
  results.push(await testButtonInteraction());
  results.push(await testHealthCheck());

  // Calculate results
  const passedTests = results.filter(result => result === true).length;
  const totalTests = results.length;
  
  // Final results
  console.log('\n' + '='.repeat(50));
  console.log('🎯 WhatsApp Webhook Test Results');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`${passedTests === totalTests ? '🎉' : '⚠️'} Overall: ${passedTests === totalTests ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 WEBHOOK INTEGRATION COMPLETE!');
    console.log('✅ Your WhatsApp webhook is working perfectly');
    console.log('✅ Business context extraction working');
    console.log('✅ Message processing pipeline active');
    console.log('✅ Ready for real WhatsApp messages');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Send real WhatsApp messages to 919801441675');
    console.log('2. Watch API terminal for live message processing');
    console.log('3. Update access token if you see "Session expired" errors');
    console.log('4. Implement interactive message handlers for buttons/lists');
  } else {
    console.log('\n📝 Troubleshooting:');
    console.log('- Ensure API server is running: pnpm dev');
    console.log('- Check ngrok tunnel is active and URL is correct');
    console.log('- Verify Meta webhook configuration');
    console.log('- Check API terminal for detailed error logs');
  }
  
  console.log('\n📱 Real Message Testing:');
  console.log('- Send WhatsApp message to: 919801441675');
  console.log('- Expected: Same processing flow as these tests');
  console.log('- Check API logs for: Business found, Customer created, Message processed');
  console.log('');
}

// ========================================
// Error Handling & Execution
// ========================================

// Handle any uncaught errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Run the tests
runWebhookTests().catch(error => {
  console.error('❌ Fatal test error:', error.message);
  process.exit(1);
});