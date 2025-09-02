
// this is for -> run-all-auth-tests.js

/*
 * ## Test Description: WhatsApp webhook integration test for signature verification and message processing
 *
 * ### Input:
 * GET requests for webhook verification and POST requests with WhatsApp message payloads.  
 *
 * ### Expected Output:
 * Webhook verification returns challenge token, message processing returns success response.
 *
 * ### Passes:
 * [ ] Webhook verification passed.
 * [ ] Text message processing passed.
 * [ ] Health check passed.
 */

const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config(); // Load environment variables from .env file

// Configuration from environment variables
const API_BASE_URL ='https://e68e8d29007f.ngrok-free.app';
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'my-verify-token';
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

console.log('📱 Starting WhatsApp Webhook Tests');
console.log('='.repeat(50));
console.log(`API Base URL: ${API_BASE_URL}`);
console.log('');

// Test message payload
const testMessagePayload = {
  object: 'whatsapp_business_account',
  entry: [{
    id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '1828755277851182',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: '+19801441675',
          phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '702046082996188'
        },
        messages: [{
          from: '919801441675',
          id: 'wamid.test123',
          timestamp: String(Math.floor(Date.now() / 1000)),
          type: 'text',
          text: {
            body: 'Hello, test message from webhook test!'
          }
        }]
      },
      field: 'messages'
    }]
  }]
};

async function testWebhookVerification() {
  console.log('Test 1: Webhook Verification');
  console.log('-'.repeat(30));

  try {
    const challenge = 'test-challenge-' + Date.now();
    const params = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': WEBHOOK_VERIFY_TOKEN,
      'hub.challenge': challenge
    });

    const response = await axios.get(`${API_BASE_URL}/webhooks/whatsapp?${params}`);

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response: ${response.data}`);

    if (response.status === 200 && response.data === challenge) {
      console.log('✅ Webhook verification successful');
      console.log('');
      return true;
    } else {
      console.log('❌ Webhook verification failed - challenge mismatch');
      console.log('');
      return false;
    }
  } catch (error) {
    console.log(`❌ Webhook verification failed: ${error.response?.status || 'Network Error'}`);
    console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    console.log('');
    return false;
  }
}

async function testMessageProcessing() {
  console.log('Test 2: Message Processing');
  console.log('-'.repeat(27));

  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add signature if we have the API token (for production-like testing)
    if (WHATSAPP_API_TOKEN) {
      const rawBody = JSON.stringify(testMessagePayload);
      const signature = 'sha256=' + crypto
        .createHmac('sha256', WHATSAPP_API_TOKEN)
        .update(rawBody, 'utf8')
        .digest('hex');
      headers['x-hub-signature-256'] = signature;
      console.log('✅ Added webhook signature for verification');
    } else {
      console.log('⚠️  No WHATSAPP_API_TOKEN found - skipping signature');
    }

    const response = await axios.post(`${API_BASE_URL}/webhooks/whatsapp`, testMessagePayload, {
      headers
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${response.data.success}`);
    console.log(`✅ Message: ${response.data.message}`);
    console.log(`✅ Data: ${JSON.stringify(response.data.data)}`);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Message processing successful');
      console.log('');
      return true;
    } else {
      console.log('❌ Message processing failed');
      console.log('');
      return false;
    }
  } catch (error) {
    console.log(`❌ Message processing failed: ${error.response?.status || 'Network Error'}`);
    console.log(`❌ Error: ${JSON.stringify(error.response?.data, null, 2) || error.message}`);
    console.log('');
    return false;
  }
}

async function testHealthCheck() {
  console.log('Test 3: WhatsApp Service Health Check');
  console.log('-'.repeat(38));

  try {
    const response = await axios.get(`${API_BASE_URL}/webhooks/whatsapp/health`);

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${response.data.success}`);
    console.log(`✅ Health: ${response.data.data?.status}`);
    console.log(`✅ Timestamp: ${response.data.data?.timestamp}`);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Health check successful');
      console.log('');
      return true;
    } else {
      console.log('❌ Health check failed');
      console.log('');
      return false;
    }
  } catch (error) {
    console.log(`❌ Health check failed: ${error.response?.status || 'Network Error'}`);
    console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    console.log('');
    return false;
  }
}

async function runAllTests() {
  console.log('Starting WhatsApp webhook tests...\n');

  // Environment check
  if (!WEBHOOK_VERIFY_TOKEN) {
    console.log('⚠️  WHATSAPP_WEBHOOK_VERIFY_TOKEN not found in environment');
  }
  if (!WHATSAPP_API_TOKEN) {
    console.log('⚠️  WHATSAPP_API_TOKEN not found - signature verification will be skipped');
  }
  console.log('');

  const results = [];
  results.push(await testWebhookVerification());
  results.push(await testMessageProcessing());
  results.push(await testHealthCheck());

  // Summary
  const passed = results.filter(r => r === true).length;
  const total = results.length;

  console.log('='.repeat(50));
  console.log('📱 WhatsApp Webhook Test Results');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`${passed === total ? '🎉' : '⚠️'} Overall: ${passed === total ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  console.log('');
  console.log('📝 Notes:');
  console.log('- Ensure the API server is running on the configured port');
  console.log('- Set WHATSAPP_WEBHOOK_VERIFY_TOKEN environment variable');
  console.log('- Set WHATSAPP_API_TOKEN for signature verification in production');
  console.log('- Check API logs for detailed message processing information');

  if (passed === total) {
    console.log('');
    console.log('🎉 WhatsApp webhook integration is working correctly!');
    console.log('- Webhook verification passes ✅');
    console.log('- Message processing works ✅');
    console.log('- Service health is good ✅');
    console.log('- Ready for real WhatsApp messages');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});