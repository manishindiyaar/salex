const express = require('express');
const axios = require('axios');

// Use your updated credentials
const WHATSAPP_ACCESS_TOKEN = 'EAAKxlAuEuZAcBPJKugI7doFivVZAuLY4gaejMlTjxBi4IrsMWZAuYQFIFjhF5VktZA8QZA7JA8tPKCqHMjy4QGr4k2GWSgIhA08uZAFISmENbk1fwsvwOVYXpnyYoCSmhgVmVa2RK7t39hLKIcRouh5iIwUZAmbsBGLkGqpPyP3DjZB8QKvQLFD9oYgW3nYycenZCZCMZBAZCCTSmN4D9wyyy6rShrC80n0aZA2ZAcIOku1w8Dm6cZD';
const WHATSAPP_PHONE_NUMBER_ID = '702046082996188';
const WEBHOOK_VERIFY_TOKEN = 'my-verify-token';

const app = express();
app.use(express.json());

console.log('🚀 WhatsApp Message Tester Server');
console.log('='.repeat(50));
console.log('📱 Phone Number ID:', WHATSAPP_PHONE_NUMBER_ID);
console.log('🔗 Webhook URL: https://35eea077e3b9.ngrok-free.app/webhook');
console.log('🔑 Verify Token:', WEBHOOK_VERIFY_TOKEN);
console.log('='.repeat(50));

app.get('/', (req, res) => {
  res.send(`
    <h1>🚀 WhatsApp Message Tester</h1>
    <p><strong>Status:</strong> Server is running and ready to receive messages!</p>
    <p><strong>Webhook URL:</strong> https://35eea077e3b9.ngrok-free.app/webhook</p>
    <p><strong>Verify Token:</strong> my-verify-token</p>
    <p><strong>Phone Number ID:</strong> ${WHATSAPP_PHONE_NUMBER_ID}</p>
    <hr>
    <h3>📋 Setup Instructions:</h3>
    <ol>
      <li>Go to <a href="https://developers.facebook.com" target="_blank">Meta Developer Console</a></li>
      <li>Select your WhatsApp Business app</li>
      <li>Navigate to WhatsApp > Configuration</li>
      <li>Set Webhook URL: <code>https://35eea077e3b9.ngrok-free.app/webhook</code></li>
      <li>Set Verify Token: <code>my-verify-token</code></li>
      <li>Subscribe to 'messages' field</li>
      <li>Send WhatsApp messages to test!</li>
    </ol>
    <p><em>Watch the terminal for real-time message logs!</em></p>
  `);
});

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];

  console.log('\n🔐 WEBHOOK VERIFICATION REQUEST:');
  console.log(`Mode: ${mode}`);
  console.log(`Token: ${token}`);
  console.log(`Challenge: ${challenge}`);

  if (mode && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    console.log('🎉 Meta can now send webhooks to this endpoint');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed!');
    res.sendStatus(403);
  }
});

// Webhook message handling endpoint
app.post('/webhook', async (req, res) => {
  console.log('\n📨 INCOMING WEBHOOK DATA:');
  console.log('='.repeat(40));
  
  const { entry } = req.body;

  if (!entry || entry.length === 0) {
    console.log('❌ Invalid request - no entry data');
    return res.status(400).send('Invalid Request');
  }

  const changes = entry[0].changes;

  if (!changes || changes.length === 0) {
    console.log('❌ Invalid request - no changes data');
    return res.status(400).send('Invalid Request');
  }

  const statuses = changes[0].value.statuses ? changes[0].value.statuses[0] : null;
  const messages = changes[0].value.messages ? changes[0].value.messages[0] : null;

  // Handle message status updates
  if (statuses) {
    console.log('\n📊 MESSAGE STATUS UPDATE:');
    console.log(`🆔 ID: ${statuses.id}`);
    console.log(`📋 STATUS: ${statuses.status}`);
    console.log(`⏰ TIMESTAMP: ${statuses.timestamp}`);
    console.log(`👤 RECIPIENT: ${statuses.recipient_id || 'N/A'}`);
  }

  // Handle incoming messages
  if (messages) {
    console.log('\n💬 NEW MESSAGE RECEIVED:');
    console.log(`👤 FROM: ${messages.from}`);
    console.log(`🆔 MESSAGE ID: ${messages.id}`);
    console.log(`⏰ TIMESTAMP: ${messages.timestamp}`);
    console.log(`📝 TYPE: ${messages.type}`);

    if (messages.type === 'text') {
      console.log(`💭 TEXT: "${messages.text.body}"`);
      
      // Auto-reply logic based on POC
      const messageText = messages.text.body.toLowerCase();
      
      if (messageText === 'hello') {
        console.log('🤖 Sending auto-reply: "Hello. How are you?"');
        await replyMessage(messages.from, 'Hello. How are you?', messages.id);
      } else if (messageText === 'list') {
        console.log('🤖 Sending interactive list');
        await sendList(messages.from);
      } else if (messageText === 'buttons') {
        console.log('🤖 Sending reply buttons');
        await sendReplyButtons(messages.from);
      } else {
        console.log('🤖 Sending echo reply');
        await sendMessage(messages.from, `You said: "${messages.text.body}"`);
      }
    }

    if (messages.type === 'interactive') {
      console.log(`🎯 INTERACTIVE TYPE: ${messages.interactive.type}`);
      
      if (messages.interactive.type === 'list_reply') {
        const listReply = messages.interactive.list_reply;
        console.log(`📋 LIST SELECTION - ID: ${listReply.id}, Title: ${listReply.title}`);
        await sendMessage(messages.from, `You selected: ${listReply.title} (ID: ${listReply.id})`);
      }

      if (messages.interactive.type === 'button_reply') {
        const buttonReply = messages.interactive.button_reply;
        console.log(`🔘 BUTTON PRESSED - ID: ${buttonReply.id}, Title: ${buttonReply.title}`);
        await sendMessage(messages.from, `You clicked: ${buttonReply.title} (ID: ${buttonReply.id})`);
      }
    }

    // Print full message JSON for debugging
    console.log('\n🔍 FULL MESSAGE DATA:');
    console.log(JSON.stringify(messages, null, 2));
  }

  console.log('\n✅ Webhook processed successfully');
  console.log('='.repeat(40));
  res.status(200).send('Webhook processed');
});

// Send simple text message
async function sendMessage(to, body) {
  try {
    console.log(`📤 Sending message to ${to}: "${body}"`);
    await axios({
      url: `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body }
      })
    });
    console.log('✅ Message sent successfully');
  } catch (error) {
    console.log('❌ Failed to send message:', error.response?.data || error.message);
  }
}

// Reply to a specific message
async function replyMessage(to, body, messageId) {
  try {
    console.log(`↩️ Replying to message ${messageId}: "${body}"`);
    await axios({
      url: `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
        context: { message_id: messageId }
      })
    });
    console.log('✅ Reply sent successfully');
  } catch (error) {
    console.log('❌ Failed to send reply:', error.response?.data || error.message);
  }
}

// Send interactive list
async function sendList(to) {
  try {
    console.log(`📋 Sending interactive list to ${to}`);
    await axios({
      url: `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          header: {
            type: 'text',
            text: 'Choose a Service'
          },
          body: {
            text: 'Select from our available services:'
          },
          footer: {
            text: 'Salex Booking System'
          },
          action: {
            button: 'View Services',
            sections: [
              {
                title: 'Hair Services',
                rows: [
                  {
                    id: 'haircut',
                    title: 'Hair Cut',
                    description: 'Professional hair cutting service'
                  },
                  {
                    id: 'styling',
                    title: 'Hair Styling',
                    description: 'Expert hair styling and treatment'
                  }
                ]
              },
              {
                title: 'Beauty Services',
                rows: [
                  {
                    id: 'facial',
                    title: 'Facial Treatment'
                  }
                ]
              }
            ]
          }
        }
      })
    });
    console.log('✅ Interactive list sent successfully');
  } catch (error) {
    console.log('❌ Failed to send list:', error.response?.data || error.message);
  }
}

// Send reply buttons
async function sendReplyButtons(to) {
  try {
    console.log(`🔘 Sending reply buttons to ${to}`);
    await axios({
      url: `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          header: {
            type: 'text',
            text: 'Book an Appointment'
          },
          body: {
            text: 'Would you like to book an appointment with us?'
          },
          footer: {
            text: 'Salex Booking System'
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'book_now',
                  title: 'Book Now'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'view_services',
                  title: 'View Services'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'contact_info',
                  title: 'Contact Info'
                }
              }
            ]
          }
        }
      })
    });
    console.log('✅ Reply buttons sent successfully');
  } catch (error) {
    console.log('❌ Failed to send buttons:', error.response?.data || error.message);
  }
}

// Start server on port 4000 (different from your main API)
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 WhatsApp Message Tester Server running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
  console.log(`📱 Ready to receive WhatsApp messages!`);
  console.log('\n📝 Quick Test Commands:');
  console.log('- Send "hello" → Auto-reply');
  console.log('- Send "list" → Interactive list');
  console.log('- Send "buttons" → Reply buttons');
  console.log('- Send any text → Echo reply');
  console.log('\n⚡ Watching for incoming messages...\n');
});