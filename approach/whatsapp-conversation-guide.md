# WhatsApp Conversation & Simulator Guide

## Overview

The WhatsApp conversation system enables customers to book appointments through WhatsApp using interactive buttons and lists. The simulator allows end-to-end testing without the actual WhatsApp Cloud API.

## Architecture

```
WhatsApp Mock UI (Browser)
        │
        ▼
┌─────────────────────────────────────┐
│  Simulator Controller               │
│  /api/v1/whatsapp-simulator/*       │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  Conversation Service               │
│  State Machine + Business Logic     │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  Booking Service                    │
│  Creates actual bookings            │
└─────────────────────────────────────┘
```

## State Machine

```
GREETING → AWAITING_ROUTING_CODE → SERVICE_SELECTION → TIME_SELECTION → CONFIRMATION → COMPLETED
    │              │                      │                  │               │
    │              │                      │                  │               └── New Booking → GREETING
    │              │                      │                  └── Cancel → SERVICE_SELECTION
    │              │                      └── Back → SERVICE_SELECTION
    │              └── Invalid Code → AWAITING_ROUTING_CODE
    └── 24hr timeout → GREETING (reset)
```

## API Endpoints

### Simulator Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/whatsapp-simulator/health` | Health check |
| POST | `/api/v1/whatsapp-simulator/send` | Send text message |
| POST | `/api/v1/whatsapp-simulator/send-interactive` | Send button/list reply |
| GET | `/api/v1/whatsapp-simulator/poll` | Poll for bot responses |
| GET | `/api/v1/whatsapp-simulator/businesses/search/:code` | Find business |
| GET | `/api/v1/whatsapp-simulator/conversations/:phone` | Debug state |
| GET | `/api/v1/whatsapp-simulator/conversations/:phone/messages` | Get messages |
| DELETE | `/api/v1/whatsapp-simulator/conversations/:phone` | Reset conversation |
| POST | `/simulate-webhooks/whatsapp` | Legacy webhook (Mock UI) |

## Usage Examples

### 1. Start Conversation
```bash
curl -X POST http://localhost:3001/api/v1/whatsapp-simulator/send \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+918001234567",
    "businessPhone": "+919801441675",
    "message": "Hi"
  }'
```

### 2. Send Routing Code
```bash
curl -X POST http://localhost:3001/api/v1/whatsapp-simulator/send \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+918001234567",
    "businessPhone": "+919801441675",
    "message": "6952"
  }'
```

### 3. Select Service (Interactive)
```bash
curl -X POST http://localhost:3001/api/v1/whatsapp-simulator/send-interactive \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+918001234567",
    "businessPhone": "+919801441675",
    "interactiveType": "list_reply",
    "replyId": "service_<SERVICE_ID>",
    "replyTitle": "Haircut"
  }'
```

### 4. Select Time Slot
```bash
curl -X POST http://localhost:3001/api/v1/whatsapp-simulator/send-interactive \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+918001234567",
    "businessPhone": "+919801441675",
    "interactiveType": "list_reply",
    "replyId": "timeslot_2026-01-03T05:30:00.000Z",
    "replyTitle": "11:00 am"
  }'
```

### 5. Confirm Booking
```bash
curl -X POST http://localhost:3001/api/v1/whatsapp-simulator/send-interactive \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+918001234567",
    "businessPhone": "+919801441675",
    "interactiveType": "button_reply",
    "replyId": "btn_confirm_booking",
    "replyTitle": "✅ Confirm"
  }'
```

### 6. Poll for Responses
```bash
SINCE=$(($(date +%s) * 1000 - 60000))
curl "http://localhost:3001/api/v1/whatsapp-simulator/poll?customerPhone=%2B918001234567&since=${SINCE}"
```

## Interactive Message Types

### Button Message
```json
{
  "type": "button",
  "header": { "type": "text", "text": "Header" },
  "body": { "text": "Message body" },
  "action": {
    "buttons": [
      { "type": "reply", "reply": { "id": "btn_id", "title": "Button Text" } }
    ]
  }
}
```

### List Message
```json
{
  "type": "list",
  "header": { "type": "text", "text": "Header" },
  "body": { "text": "Message body" },
  "footer": { "text": "Footer" },
  "action": {
    "button": "View Options",
    "sections": [{
      "title": "Section Title",
      "rows": [
        { "id": "item_1", "title": "Item 1", "description": "Description" }
      ]
    }]
  }
}
```

## Files Created

| File | Purpose |
|------|---------|
| `services/conversation.service.ts` | State machine, customer/conversation management |
| `services/simulator-message.service.ts` | Message storage for polling |
| `services/webhook-enhancer.service.ts` | WhatsApp Cloud API format payloads |
| `controllers/simulator.controller.ts` | HTTP handlers |
| `routes/simulator.routes.ts` | Route definitions |

## Database Tables Used

- `Customer` - WhatsApp customers (upserted by phone)
- `WhatsAppConversation` - Conversation state and context
- `CustomerSession` - Simulator session tracking
- `SimulatorMessage` - Message storage for polling
- `Booking` - Created when customer confirms

## WhatsApp Simulator UI

The WhatsApp Mock UI provides a visual interface to test the complete booking flow without needing the actual WhatsApp Cloud API.

### Location

```
WhatsappMockUI/
├── index.html          # Main simulator (recommended)
├── simulator.js        # Standalone JS version
└── js/
    └── whatsapp-simulator.js  # Legacy version
```

### How to Open

#### Option 1: Direct File Open (Simplest)
```bash
# macOS
open WhatsappMockUI/index.html

# Linux
xdg-open WhatsappMockUI/index.html

# Windows
start WhatsappMockUI/index.html
```

#### Option 2: Using VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click on `WhatsappMockUI/index.html`
3. Select "Open with Live Server"
4. Browser opens at `http://127.0.0.1:5500/WhatsappMockUI/index.html`

#### Option 3: Using Python HTTP Server
```bash
cd WhatsappMockUI
python3 -m http.server 8080
# Open http://localhost:8080/index.html
```

#### Option 4: Using Node.js serve
```bash
npx serve WhatsappMockUI -p 8080
# Open http://localhost:8080/index.html
```

### Prerequisites

Before using the simulator:

1. **Start the Express.js API**
   ```bash
   pnpm dev:api
   ```
   The API must be running on `http://localhost:3000`

2. **Ensure Database is Ready**
   ```bash
   cd packages/shared-types
   pnpm db:push
   ```

3. **Have a Business with Routing Code**
   - Create a business via the API or Prisma Studio
   - Note the 4-digit routing code (e.g., `6952`)

### Using the Simulator

#### Step 1: Open the UI
Open `WhatsappMockUI/index.html` in your browser

#### Step 2: Start a Conversation
Type any message like "Hi" or "Hello" and press Enter

#### Step 3: Enter Business Code
When prompted, enter the 4-digit routing code:
- Format: `6952` or `S6952`
- The simulator auto-detects business codes in messages

#### Step 4: Select Service
- An interactive list appears with available services
- Click on a service to select it

#### Step 5: Choose Time Slot
- Available time slots are displayed
- Click to select your preferred time

#### Step 6: Confirm Booking
- Review booking details
- Click "✅ Confirm" to complete the booking

### Debug Panel

Click the 🐛 button (top-right) to open the debug panel:

| Field | Description |
|-------|-------------|
| Phone | Your simulated customer phone number |
| Business | Connected business code |
| Status | Connection status (connected/disconnected) |
| Messages | Total messages sent/received |
| Polling | Whether message polling is active |
| Last Poll | Timestamp of last poll |
| Activity Log | Real-time log of all actions |

### API Endpoints Used by Simulator

| Action | Endpoint |
|--------|----------|
| Send message | `POST /simulate-webhooks/whatsapp` |
| Poll responses | `GET /api/v1/whatsapp-simulator/poll` |
| Find business | `GET /api/v1/whatsapp-simulator/businesses/search/:code` |

### Troubleshooting

#### "Connection Failed" Error
- Ensure API is running: `pnpm dev:api`
- Check API is on port 3000: `curl http://localhost:3000/health`
- Check CORS is enabled (it is by default in development)

#### No Response from Bot
- Check the debug panel for errors
- Verify business exists with the routing code
- Check API logs for errors

#### Interactive Buttons Not Appearing
- Ensure you're using `index.html` (not the legacy version)
- Check browser console for JavaScript errors
- Verify the poll endpoint is returning messages

#### Business Not Found
- Verify the routing code exists in database
- Use Prisma Studio to check: `pnpm db:studio`
- Routing codes are 4 digits (e.g., `6952`)

### Complete Test Flow Example

```
1. Open WhatsappMockUI/index.html
2. Type: "Hi" → Bot responds with greeting
3. Type: "6952" → Bot connects to business
4. Click: Service from list → Bot shows time slots
5. Click: Time slot → Bot shows confirmation
6. Click: "✅ Confirm" → Booking created!
7. Check database: Booking appears in Prisma Studio
```

## Key Features

- **24-hour timeout**: Conversations reset after 24 hours of inactivity
- **Price snapshots**: Booking prices frozen at creation time
- **Multi-service support**: Can select multiple services (future)
- **Availability check**: Validates time slots before booking
- **Source tracking**: Bookings marked with `source: "whatsapp"`
