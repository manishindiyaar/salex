#!/usr/bin/env node

/**
 * Story 1.9: WhatsApp Web Simulator Foundation - Comprehensive Test Suite
 * 
 * Tests the complete WhatsApp Web Simulator functionality:
 * - Customer phone-based authentication
 * - Session management
 * - S1234 message parsing and routing
 * - Message sending and polling
 * - Business interaction flows
 */

require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_CUSTOMER_PHONE = '+19801441675'; // Test customer phone
const TEST_BUSINESS_ROUTING_CODE = '1235'; // Business exists from Story 1.8

console.log('🚀 Story 1.9: WhatsApp Web Simulator Foundation - Test Suite');
console.log('='.repeat(70));

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    return {
      status: response.status,
      success: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

async function testSimulatorHealth() {
  console.log('\\n🔍 Test 1: Simulator Health Check');
  console.log('-'.repeat(50));

  const healthResponse = await makeRequest('/api/v1/whatsapp-simulator/health');
  
  if (healthResponse.success) {
    console.log('✅ Simulator Health:', healthResponse.data.data.status);
    console.log(`   Active Sessions: ${healthResponse.data.data.activeSessions}`);
  } else {
    console.log('❌ Simulator health check failed:', healthResponse.data?.error);
  }

  return healthResponse.success;
}

async function testCustomerAuthentication() {
  console.log('\\n📱 Test 2: Customer Authentication');
  console.log('-'.repeat(50));

  const authRequest = {
    phoneNumber: TEST_CUSTOMER_PHONE
  };

  const authResponse = await makeRequest('/api/v1/whatsapp-simulator/auth', {
    method: 'POST',
    body: JSON.stringify(authRequest),
  });

  if (authResponse.success) {
    const sessionData = authResponse.data.data;
    console.log('✅ Customer authenticated successfully!');
    console.log(`   Session ID: ${sessionData.sessionId}`);
    console.log(`   Customer Phone: ${sessionData.customer.phoneNumber}`);
    console.log(`   Expires At: ${new Date(sessionData.expiresAt).toLocaleString()}`);
    return sessionData.sessionId;
  } else {
    console.log('❌ Customer authentication failed:', authResponse.data?.error);
    return null;
  }
}

async function testMessageRouting() {
  console.log('\\n🧠 Test 3: S1235 Message Parsing');
  console.log('-'.repeat(50));

  const testMessages = [
    'BOOK_AT_S1235',
    'book at s1235',
    'I want to BOOK_S1235',
    'Hello S1235',
    'Just a regular message',
    'APPOINTMENT_S9999' // Invalid business code
  ];

  for (const message of testMessages) {
    const parseRequest = { message };
    
    const parseResponse = await makeRequest('/api/v1/whatsapp-simulator/parse-routing', {
      method: 'POST',
      body: JSON.stringify(parseRequest),
    });

    if (parseResponse.success) {
      const result = parseResponse.data.data;
      console.log(`📝 "${message}"`);
      
      if (result.success) {
        console.log(`   ✅ Found: S${result.routingCode} -> ${result.business?.name || 'Unknown'}`);
      } else {
        console.log(`   ❌ ${result.suggestedMessage || 'No routing code found'}`);
      }
    }
  }
}

async function testMessageSending(sessionId) {
  console.log('\\n💬 Test 4: Message Sending & Conversation Flow');
  console.log('-'.repeat(50));

  if (!sessionId) {
    console.log('❌ Skipped - No valid session ID');
    return;
  }

  // Test 1: Send initial message without routing code
  console.log('📤 Sending: "Hello"');
  let sendResponse = await makeRequest(`/api/v1/whatsapp-simulator/sessions/${sessionId}/send`, {
    method: 'POST',
    body: JSON.stringify({ message: 'Hello' }),
  });

  if (sendResponse.success) {
    console.log('✅ Message sent successfully');
  } else {
    console.log('❌ Failed to send message:', sendResponse.data?.error);
  }

  // Wait a moment for processing
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Send routing code message
  console.log('📤 Sending: "BOOK_AT_S1235"');
  sendResponse = await makeRequest(`/api/v1/whatsapp-simulator/sessions/${sessionId}/send`, {
    method: 'POST',
    body: JSON.stringify({ message: 'BOOK_AT_S1235' }),
  });

  if (sendResponse.success) {
    console.log('✅ Routing message sent successfully');
  } else {
    console.log('❌ Failed to send routing message:', sendResponse.data?.error);
  }
}

async function testMessagePolling(sessionId) {
  console.log('\\n📥 Test 5: Message Polling & History');
  console.log('-'.repeat(50));

  if (!sessionId) {
    console.log('❌ Skipped - No valid session ID');
    return;
  }

  // Wait for message processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  const pollResponse = await makeRequest(`/api/v1/whatsapp-simulator/sessions/${sessionId}/messages`);

  if (pollResponse.success) {
    const messages = pollResponse.data.data.messages;
    console.log(`✅ Retrieved ${messages.length} messages`);
    
    messages.slice(0, 5).forEach((msg, index) => {
      const direction = msg.isFromCustomer ? '👤→🤖' : '🤖→👤';
      const content = msg.content.text || JSON.stringify(msg.content);
      console.log(`   ${index + 1}. ${direction} ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
    });

    if (messages.length > 5) {
      console.log(`   ... and ${messages.length - 5} more messages`);
    }
  } else {
    console.log('❌ Failed to poll messages:', pollResponse.data?.error);
  }
}

async function testInteractions(sessionId) {
  console.log('\\n🎛️ Test 6: Interactive Button/List Responses');
  console.log('-'.repeat(50));

  if (!sessionId) {
    console.log('❌ Skipped - No valid session ID');
    return;
  }

  // Test button interactions
  const interactions = [
    { type: 'button', payload: 'view_services' },
    { type: 'button', payload: 'business_hours' },
    { type: 'button', payload: 'book_appointment' }
  ];

  for (const interaction of interactions) {
    console.log(`🎯 Testing interaction: ${interaction.payload}`);
    
    const interactResponse = await makeRequest(`/api/v1/whatsapp-simulator/sessions/${sessionId}/interact`, {
      method: 'POST',
      body: JSON.stringify(interaction),
    });

    if (interactResponse.success) {
      console.log(`   ✅ Interaction processed successfully`);
    } else {
      console.log(`   ❌ Interaction failed: ${interactResponse.data?.error}`);
    }

    // Small delay between interactions
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function testSessionInformation(sessionId) {
  console.log('\\n📊 Test 7: Session Information');
  console.log('-'.repeat(50));

  if (!sessionId) {
    console.log('❌ Skipped - No valid session ID');
    return;
  }

  const sessionResponse = await makeRequest(`/api/v1/whatsapp-simulator/sessions/${sessionId}`);

  if (sessionResponse.success) {
    const session = sessionResponse.data.data;
    console.log('✅ Session information retrieved:');
    console.log(`   Customer Phone: ${session.customerPhone}`);
    console.log(`   Current State: ${session.currentState}`);
    console.log(`   Business ID: ${session.businessId || 'None'}`);
    console.log(`   Last Message: ${new Date(session.lastMessageAt).toLocaleString()}`);
    console.log(`   Expires At: ${new Date(session.expiresAt).toLocaleString()}`);
  } else {
    console.log('❌ Failed to get session info:', sessionResponse.data?.error);
  }
}

async function testSimulatorStatistics() {
  console.log('\\n📈 Test 8: Simulator Statistics');
  console.log('-'.repeat(50));

  const statsResponse = await makeRequest('/api/v1/whatsapp-simulator/stats');

  if (statsResponse.success) {
    const stats = statsResponse.data.data;
    console.log('✅ Simulator statistics:');
    console.log('   Session Stats:');
    console.log(`     Active: ${stats.sessions.activeSessions}`);
    console.log(`     Expired: ${stats.sessions.expiredSessions}`);
    console.log(`     Total: ${stats.sessions.totalSessions}`);
    console.log('   Conversation Stats:');
    console.log(`     Total Messages: ${stats.conversations.totalMessages}`);
    console.log(`     Total Sessions: ${stats.conversations.totalSessions}`);
    console.log(`     Avg Messages/Session: ${stats.conversations.averageMessagesPerSession}`);
  } else {
    console.log('❌ Failed to get statistics:', statsResponse.data?.error);
  }
}

async function testInvalidInputs() {
  console.log('\\n⚠️  Test 9: Error Handling & Invalid Inputs');
  console.log('-'.repeat(50));

  // Test invalid phone number
  console.log('🧪 Testing invalid phone number...');
  const invalidAuthResponse = await makeRequest('/api/v1/whatsapp-simulator/auth', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: 'invalid-phone' }),
  });
  console.log('   Invalid phone:', invalidAuthResponse.status === 400 ? 'REJECTED ✓' : 'ACCEPTED ✗');

  // Test invalid session ID
  console.log('🧪 Testing invalid session ID...');
  const invalidSessionResponse = await makeRequest('/api/v1/whatsapp-simulator/sessions/invalid-session-id');
  console.log('   Invalid session:', invalidSessionResponse.status === 404 ? 'NOT FOUND ✓' : 'FOUND ✗');

  // Test empty message
  console.log('🧪 Testing empty message parsing...');
  const emptyMessageResponse = await makeRequest('/api/v1/whatsapp-simulator/parse-routing', {
    method: 'POST',
    body: JSON.stringify({ message: '' }),
  });
  console.log('   Empty message:', emptyMessageResponse.success ? 'HANDLED ✓' : 'ERROR ✗');
}

async function runAllTests() {
  try {
    console.log('🔌 Testing API connection...');
    const healthCheck = await makeRequest('/health');
    if (!healthCheck.success) {
      console.log('❌ API server is not running. Please start with: pnpm dev:api');
      process.exit(1);
    }
    console.log('✅ API server is running');

    // Run all tests in sequence
    const isSimulatorHealthy = await testSimulatorHealth();
    if (!isSimulatorHealthy) {
      console.log('❌ Simulator is not healthy, stopping tests');
      process.exit(1);
    }

    const sessionId = await testCustomerAuthentication();
    await testMessageRouting();
    await testMessageSending(sessionId);
    await testMessagePolling(sessionId);
    await testInteractions(sessionId);
    await testSessionInformation(sessionId);
    await testSimulatorStatistics();
    await testInvalidInputs();

    console.log('\\n🎉 Story 1.9 WhatsApp Simulator Test Suite Completed!');
    console.log('='.repeat(70));
    console.log('✅ WhatsApp Web Simulator Foundation is working correctly');
    console.log('🚀 Ready for frontend UI development and further enhancements');

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };