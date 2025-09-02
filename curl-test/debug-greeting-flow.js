#!/usr/bin/env node

const API_BASE = 'http://localhost:3000';

async function testGreetingFlow() {
  console.log('🧪 Testing WhatsApp Greeting Flow Debug');
  console.log('=====================================\n');

  // Test the webhook directly with Hello message
  const webhookPayload = {
    entry: [{
      changes: [{
        field: "messages",
        value: {
          messages: [{
            id: "debug_test_123",
            from: "1234567999",
            timestamp: "1675123456",
            type: "text",
            text: {
              body: "Hello"
            }
          }]
        }
      }]
    }]
  };

  try {
    console.log('1️⃣ Testing webhook with Hello message...');
    const webhookResponse = await fetch(`${API_BASE}/simulate-webhooks/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-simulator-mode': 'true'
      },
      body: JSON.stringify(webhookPayload)
    });

    const webhookResult = await webhookResponse.json();
    console.log('📨 Webhook Response:', JSON.stringify(webhookResult, null, 2));

    if (webhookResult.success && webhookResult.responses?.length > 0) {
      console.log('✅ Webhook processing successful');
      console.log('📝 Response message:', webhookResult.responses[0].text?.body);
    } else {
      console.log('❌ Webhook processing failed or no responses');
    }

    // Check if messages are stored
    console.log('\n2️⃣ Checking stored messages...');
    const messagesResponse = await fetch(`${API_BASE}/simulator/messages/1234567999`);
    const messagesResult = await messagesResponse.json();
    console.log('💾 Stored messages:', JSON.stringify(messagesResult, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGreetingFlow();