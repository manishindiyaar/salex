# WhatsApp Simulator Testing Guide

This guide explains how to test the WhatsApp booking flow end-to-end using the WhatsApp Mock UI simulator, including detailed data flow and API call sequences.

## Overview

The WhatsApp Simulator allows you to test the customer booking experience without needing a real WhatsApp Business Account. It mimics the WhatsApp Cloud API webhook format, enabling full end-to-end testing of the conversation state machine.

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  WhatsApp Mock UI   │────▶│   Express Backend   │────▶│  Supabase Database  │
│  (Browser/HTML)     │◀────│   (Port 3001)       │◀────│  (PostgreSQL)       │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │
         │  POST /simulate-webhooks  │
         │  /whatsapp                │
         │                           │
         │  GET /api/v1/whatsapp-    │
         │  simulator/poll           │
         └───────────────────────────┘
```

## Prerequisites

1. **Start the API Server**
   ```bash
   pnpm dev:api
   ```
   Server runs on `http://localhost:3001`

2. **Ensure Development Mode**
   In `apps/api/.env`:
   ```
   NODE_ENV=development
   ```
   This enables CORS for local file:// URLs.

3. **Open the Mock UI**
   Open `WhatsappMockUI/index.html` directly in your browser (file:// protocol works).

## Step-by-Step Testing

### Step 1: Open the Simulator

1. Navigate to `WhatsappMockUI/index.html` in your browser
2. You'll see a WhatsApp-like interface with:
   - Phone number input (your simulated customer phone)
   - Message input field
   - Chat display area

### Step 2: Set Your Customer Phone Number

Enter a phone number in the format:
- `9876543210` (10 digits, auto-prefixed with +91)
- `+919876543210` (full format)

### Step 3: Send Initial Message

Type any message (e.g., "Hi" or "Hello") and send. This triggers the greeting flow.

### Step 4: Follow the Conversation Flow

The bot will guide you through:
1. **GREETING** → Welcome message with options
2. **AWAITING_BUSINESS_CODE** → Enter business routing code (e.g., "S123")
3. **SELECTING_SERVICE** → Choose from available services
4. **SELECTING_DATE** → Pick appointment date
5. **SELECTING_TIME** → Choose time slot
6. **CONFIRMING_BOOKING** → Confirm or cancel
7. **BOOKING_CONFIRMED** → Success message

---

## Data Flow Diagram

### Customer Sends Message

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER MESSAGE FLOW                                 │
└──────────────────────────────────────────────────────────────────────────────┘

1. User types message in Mock UI
         │
         ▼
2. Mock UI creates WhatsApp Cloud API format payload:
   {
     "object": "whatsapp_business_account",
     "entry": [{
       "changes": [{
         "value": {
           "metadata": { "display_phone_number": "..." },
           "messages": [{ "from": "customer_phone", "text": {...} }]
         }
       }]
     }]
   }
         │
         ▼
3. POST http://localhost:3001/simulate-webhooks/whatsapp
         │
         ▼
4. simulator.controller.ts → handleWebhook()
         │
         ▼
5. webhookEnhancerService.parseWebhookPayload()
   - Extracts: customerPhone, messageText, interactiveReply
         │
         ▼
6. conversationService.processMessage()
   - Loads/creates conversation from DB
   - Runs state machine transition
   - Generates bot response
         │
         ▼
7. simulatorMessageService.storeOutgoingMessage()
   - Stores bot response in SimulatorMessage table
   - For polling by Mock UI
         │
         ▼
8. Returns 200 OK to Mock UI
```

### Mock UI Polls for Bot Response

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         BOT RESPONSE POLLING FLOW                             │
└──────────────────────────────────────────────────────────────────────────────┘

1. Mock UI polls every 1-2 seconds:
   GET http://localhost:3001/api/v1/whatsapp-simulator/poll?customerPhone=...&since=...
         │
         ▼
2. simulator.controller.ts → pollMessages()
         │
         ▼
3. simulatorMessageService.getMessagesSince()
   - Queries SimulatorMessage table
   - Returns undelivered messages
   - Marks as delivered
         │
         ▼
4. Returns messages to Mock UI:
   {
     "success": true,
     "data": [{
       "id": "msg_123",
       "content": { "text": {...} } or { "interactive": {...} },
       "timestamp": "..."
     }]
   }
         │
         ▼
5. Mock UI renders bot message in chat
```

---

## API Endpoints Reference

### Webhook Endpoint (Primary)

```
POST /simulate-webhooks/whatsapp
```

**Purpose**: Receives WhatsApp Cloud API format webhooks from Mock UI

**Request Body** (WhatsApp Cloud API format):
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "account_id",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "+919999999999",
          "phone_number_id": "phone_id"
        },
        "contacts": [{
          "wa_id": "+919876543210",
          "profile": { "name": "Customer Name" }
        }],
        "messages": [{
          "id": "msg_id",
          "from": "+919876543210",
          "timestamp": "1234567890",
          "type": "text",
          "text": { "body": "Hello" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "msg_id"
}
```

### Poll Messages

```
GET /api/v1/whatsapp-simulator/poll
```

**Query Parameters**:
- `customerPhone` (required): Customer's phone number
- `since` (optional): Unix timestamp to fetch messages after
- `limit` (optional): Max messages to return (default: 10)

**Response**:
```json
{
  "success": true,
  "data": [{
    "id": "sim_1234567890_abc123",
    "content": {
      "text": { "body": "Welcome to Salex!" }
    },
    "timestamp": "2024-01-01T12:00:00.000Z",
    "delivered": true
  }],
  "meta": {
    "count": 1,
    "since": "2024-01-01T11:59:55.000Z"
  }
}
```

### Search Business by Routing Code

```
GET /api/v1/whatsapp-simulator/businesses/search/:code
```

**Example**: `GET /api/v1/whatsapp-simulator/businesses/search/S123`

**Response**:
```json
{
  "success": true,
  "data": {
    "businessId": "uuid",
    "name": "Salon Name",
    "routingCode": "123",
    "phoneNumber": "+919876543210",
    "isAcceptingOrders": true
  }
}
```

### Get Conversation State (Debug)

```
GET /api/v1/whatsapp-simulator/conversations/:customerPhone
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerPhone": "+919876543210",
    "businessId": "uuid",
    "businessName": "Salon Name",
    "state": "SELECTING_SERVICE",
    "contextData": { "selectedServices": [] },
    "lastMessageAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Clear Conversation (Reset)

```
DELETE /api/v1/whatsapp-simulator/conversations/:customerPhone
```

**Response**:
```json
{
  "success": true,
  "message": "Conversation cleared"
}
```

---

## Service Layer Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER DIAGRAM                                 │
└──────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────┐
                    │   simulator.controller  │
                    │   (HTTP Layer)          │
                    └───────────┬─────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ webhookEnhancer │  │ conversation    │  │ simulatorMessage│
│ Service         │  │ Service         │  │ Service         │
│                 │  │                 │  │                 │
│ - Parse payload │  │ - State machine │  │ - Store msgs    │
│ - Validate      │  │ - Process msg   │  │ - Poll msgs     │
│ - Normalize     │  │ - Generate resp │  │ - Session mgmt  │
└─────────────────┘  └────────┬────────┘  └─────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ businessService │  │ serviceService  │  │ bookingService  │
│                 │  │                 │  │                 │
│ - Get by code   │  │ - List services │  │ - Create booking│
│ - Validate      │  │ - Get by ID     │  │ - Check avail   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Prisma Client  │
                    │  (Database)     │
                    └─────────────────┘
```

---

## Database Tables Involved

| Table | Purpose |
|-------|---------|
| `Conversation` | Tracks conversation state per customer |
| `CustomerSession` | Simulator session management |
| `SimulatorMessage` | Stores messages for polling |
| `Business` | Business info and routing codes |
| `Service` | Available services per business |
| `Booking` | Created bookings |
| `TimeSlot` | Available time slots |

---

## Conversation States

| State | Description | Next States |
|-------|-------------|-------------|
| `GREETING` | Initial welcome | `AWAITING_BUSINESS_CODE` |
| `AWAITING_BUSINESS_CODE` | Waiting for S-code | `SELECTING_SERVICE` |
| `SELECTING_SERVICE` | Choose services | `SELECTING_DATE` |
| `SELECTING_DATE` | Pick date | `SELECTING_TIME` |
| `SELECTING_TIME` | Pick time slot | `CONFIRMING_BOOKING` |
| `CONFIRMING_BOOKING` | Confirm details | `BOOKING_CONFIRMED` |
| `BOOKING_CONFIRMED` | Success | `GREETING` (new flow) |

---

## Troubleshooting

### Issue: CORS Error
**Solution**: Ensure `NODE_ENV=development` in `apps/api/.env`

### Issue: 500 Error on Send
**Solution**: Check server logs. Common causes:
- Null phone number (fixed with default fallback)
- Database connection issues
- Missing business/service data

### Issue: No Bot Response
**Solution**: 
1. Check if polling is working (Network tab)
2. Verify customerPhone matches between send and poll
3. Check `SimulatorMessage` table in Prisma Studio

### Issue: Business Not Found
**Solution**: 
1. Create a business with routing code via API or Prisma Studio
2. Ensure `isAcceptingOrders: true`

---

## Testing Checklist

- [ ] Server running on port 3001
- [ ] NODE_ENV=development
- [ ] Mock UI opens without errors
- [ ] Can send initial message
- [ ] Bot responds with greeting
- [ ] Can enter business code (need business in DB)
- [ ] Can select services
- [ ] Can select date
- [ ] Can select time slot
- [ ] Booking confirmation works
- [ ] Booking created in database

---

## Files Reference

| File | Purpose |
|------|---------|
| `WhatsappMockUI/index.html` | Mock UI frontend |
| `WhatsappMockUI/js/whatsapp-simulator.js` | UI logic and API calls |
| `apps/api/src/controllers/simulator.controller.ts` | HTTP endpoints |
| `apps/api/src/services/simulator-message.service.ts` | Message storage |
| `apps/api/src/services/webhook-enhancer.service.ts` | Payload parsing |
| `apps/api/src/services/conversation.service.ts` | State machine |
| `apps/api/src/routes/simulator.routes.ts` | Route definitions |
