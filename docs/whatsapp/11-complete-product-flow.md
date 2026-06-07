# Complete Product Flow — End-to-End System Documentation

## System Actors

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SALEX PLATFORM                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │
│  │  End User    │    │  Merchant    │    │  Admin (Salex Team)      │   │
│  │  (Customer)  │    │  (Salon      │    │                          │   │
│  │              │    │   Owner)     │    │  • Provision merchants   │   │
│  │  • Books via │    │              │    │  • Manage subscriptions  │   │
│  │    WhatsApp  │    │  • Manages   │    │  • Toggle business       │   │
│  │  • No app    │    │    via React │    │    active/inactive       │   │
│  │    needed    │    │    Native    │    │  • View diagnostics      │   │
│  │              │    │    app       │    │  • Record payments       │   │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┬───────────┘   │
│         │                    │                            │               │
│         │ WhatsApp           │ REST API                   │ REST API      │
│         │ Messages           │ (JWT Auth)                 │ (Admin Auth)  │
│         │                    │                            │               │
│         ▼                    ▼                            ▼               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Express.js API Server                          │   │
│  │                    (apps/api — port 3001)                         │   │
│  │                                                                    │   │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────────┐   │   │
│  │  │WhatsApp │  │ Merchant │  │  Admin  │  │ WhatsApp Workers │   │   │
│  │  │Webhook  │  │  Routes  │  │ Routes  │  │ (Inbound +       │   │   │
│  │  │Handler  │  │          │  │         │  │  Outbound)       │   │   │
│  │  └────┬────┘  └────┬─────┘  └────┬────┘  └────────┬─────────┘   │   │
│  │       │             │             │                 │             │   │
│  │       ▼             ▼             ▼                 ▼             │   │
│  │  ┌──────────────────────────────────────────────────────────┐    │   │
│  │  │              PostgreSQL (Supabase Cloud)                   │    │   │
│  │  │  Business, Service, Staff, Resource, Booking, Customer,   │    │   │
│  │  │  WhatsAppConversation, WhatsAppInboundEvent,              │    │   │
│  │  │  WhatsAppOutboundMessage, BookingIntent, Subscription...  │    │   │
│  │  └──────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│         ▲                                                                │
│         │ Meta Graph API (send messages)                                 │
│         ▼                                                                │
│  ┌──────────────────┐                                                    │
│  │  Meta WhatsApp   │                                                    │
│  │  Cloud API       │                                                    │
│  │  (External)      │                                                    │
│  └──────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## The Three Clients

### 1. End User (Customer) — WhatsApp
- **No app install required**
- Messages the Salex shared WhatsApp number (or a business's dedicated number)
- Interacts via WhatsApp interactive messages (buttons, lists)
- Books appointments entirely through chat

### 2. Merchant (Salon Owner) — React Native App (SalonMerchantApp)
- **App:** `apps/SalonMerchantApp` (Expo/React Native)
- **Auth:** Phone OTP or Password → JWT token
- **API Base:** Configured per environment (local: `http://localhost:3001/api/v1`)
- **Key Screens:** Home (today's bookings), Bookings, Catalogue (services), My Account
- **Actions:** View/confirm/reject/complete bookings, manage services, staff, hours

### 3. Admin (Salex Team) — Web Dashboard
- **App:** `apps/admin-dashboard` (React/Vite)
- **Auth:** Email/password → admin JWT token
- **API Base:** `/api/v1/admin/...`
- **Actions:** Provision merchants, manage subscriptions, toggle businesses, record payments, view diagnostics

---

## Authentication

### Merchant Auth Flow
```
SalonMerchantApp                    API Server
     │                                  │
     │ POST /api/v1/auth/password/login │
     │ { phone, password }              │
     ├─────────────────────────────────►│
     │                                  │ Verify password hash
     │                                  │ Generate JWT (Supabase)
     │◄─────────────────────────────────┤
     │ { token, user }                  │
     │                                  │
     │ GET /api/v1/businesses/me        │
     │ Authorization: Bearer {token}    │
     ├─────────────────────────────────►│
     │                                  │ authMiddleware validates JWT
     │◄─────────────────────────────────┤
     │ { business, services, ... }      │
```

### Admin Auth Flow
```
Admin Dashboard                     API Server
     │                                  │
     │ POST /api/v1/admin/auth/login    │
     │ { email, password }              │
     ├─────────────────────────────────►│
     │                                  │ Verify admin credentials
     │◄─────────────────────────────────┤
     │ { token, admin }                 │
     │                                  │
     │ All subsequent requests:         │
     │ Authorization: Bearer {token}    │
     │ adminAuthMiddleware validates    │
```

### WhatsApp "Auth" (No Traditional Auth)
- Customer identified by phone number only
- No password, no token
- Identity established via `Customer` record (upserted by phone)
- Session tracked in `WhatsAppConversation` record

---

## Complete API Endpoint Map

### Merchant App Endpoints (JWT Auth Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/auth/otp/request` | Request OTP for phone login |
| POST | `/api/v1/auth/otp/verify` | Verify OTP |
| POST | `/api/v1/auth/password/login` | Password login |
| POST | `/api/v1/auth/password/change` | Change password |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/businesses` | Create business |
| GET | `/api/v1/businesses/me` | Get my business |
| PATCH | `/api/v1/businesses/:id` | Update business |
| GET | `/api/v1/businesses/routing/:code` | Lookup by routing code (public) |
| POST | `/api/v1/bookings` | Create booking |
| GET | `/api/v1/bookings?businessId=x` | List bookings |
| GET | `/api/v1/bookings/:id` | Get booking |
| PATCH | `/api/v1/bookings/:id/status` | Update status (confirm/reject) |
| POST | `/api/v1/bookings/:id/checkout` | Complete with payment |
| PATCH | `/api/v1/bookings/:id/allocation` | Change resource/staff |
| POST | `/api/v1/bookings/check-availability` | Check time slot |
| POST | `/api/v1/businesses/:id/services` | Create service |
| GET | `/api/v1/businesses/:id/services` | List services |
| PATCH | `/api/v1/services/:id` | Update service |
| POST | `/api/v1/businesses/:id/resources` | Create resource (chair) |
| GET | `/api/v1/businesses/:id/resources` | List resources |
| POST | `/api/v1/businesses/:id/staff` | Create staff |
| GET | `/api/v1/businesses/:id/staff` | List staff |
| GET | `/api/v1/businesses/:id/availability` | Get availability |

### Admin Dashboard Endpoints (Admin Auth Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/admin/auth/login` | Admin login |
| POST | `/api/v1/admin/auth/logout` | Admin logout |
| GET | `/api/v1/admin/auth/me` | Current admin |
| GET | `/api/v1/admin/businesses` | List all businesses |
| GET | `/api/v1/admin/businesses/:id` | Business details |
| POST | `/api/v1/admin/businesses/:id/toggle` | Activate/deactivate |
| PATCH | `/api/v1/admin/businesses/:id/plan` | Change subscription |
| POST | `/api/v1/admin/merchant-accounts` | Provision new merchant |
| POST | `/api/v1/admin/payments` | Record payment |
| GET | `/api/v1/admin/payments` | List payments |
| GET | `/api/v1/admin/payments/analytics` | Payment analytics |
| GET | `/api/v1/admin/health` | System health |
| GET | `/api/v1/admin/health/stats` | Platform stats |
| GET | `/api/v1/admin/audit-logs` | Audit trail |

### WhatsApp Endpoints (No Auth — Meta Calls These)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v1/webhooks/whatsapp` | Webhook verification |
| POST | `/v1/webhooks/whatsapp` | Receive messages from Meta |
| POST | `/api/v1/whatsapp/flows/business-selection` | Meta Flow data exchange |

---

## End-to-End Booking Flow (WhatsApp)

### Complete Data Flow Diagram

```
CUSTOMER                META                 API SERVER               DATABASE
(WhatsApp)              (Cloud API)          (Express.js)             (PostgreSQL)
   │                       │                      │                       │
   │ "Faman salon"         │                      │                       │
   ├──────────────────────►│                      │                       │
   │                       │ POST /v1/webhooks/   │                       │
   │                       │ whatsapp             │                       │
   │                       ├─────────────────────►│                       │
   │                       │                      │ Verify signature      │
   │                       │                      │ Parse payload         │
   │                       │                      │ isSharedNumber? YES   │
   │                       │                      │                       │
   │                       │                      │ INSERT INTO           │
   │                       │                      │ WhatsAppInboundEvent  │
   │                       │                      ├──────────────────────►│
   │                       │                      │                       │
   │                       │                      │ kickInbound()         │
   │                       │◄─────────────────────┤ return 200            │
   │                       │                      │                       │
   │                       │                      │ ─── WORKER TICK ───   │
   │                       │                      │                       │
   │                       │                      │ Claim event (lock)    │
   │                       │                      ├──────────────────────►│
   │                       │                      │                       │
   │                       │                      │ engineRouter.route()  │
   │                       │                      │ → selectEngine()      │
   │                       │                      │ → businessId=null     │
   │                       │                      │ → engine='legacy'     │
   │                       │                      │                       │
   │                       │                      │ conversationService   │
   │                       │                      │ .processMessage()     │
   │                       │                      │                       │
   │                       │                      │ state=AWAITING_CODE   │
   │                       │                      │ SharedBusinessResolver│
   │                       │                      │ .resolve("faman")     │
   │                       │                      ├──────────────────────►│
   │                       │                      │◄─────────────────────►│ SELECT Business
   │                       │                      │ exactMatch: Faman     │ WHERE name ILIKE
   │                       │                      │                       │
   │                       │                      │ initializeSession()   │
   │                       │                      │ → featureAccess check │
   │                       │                      │ → associate business  │
   │                       │                      ├──────────────────────►│ UPDATE conversation
   │                       │                      │                       │ SET businessId, state
   │                       │                      │                       │
   │                       │                      │ Engine hands to Flow  │
   │                       │                      │ flowEngine.startFresh │
   │                       │                      │ → pin flow version    │
   │                       │                      │ → render service list │
   │                       │                      ├──────────────────────►│ SELECT Service
   │                       │                      │                       │ WHERE businessId
   │                       │                      │                       │
   │                       │                      │ Generate list message │
   │                       │                      │                       │
   │                       │                      │ Read conv.version     │
   │                       │                      │ INSERT OutboundMessage│
   │                       │                      │ (with convVersion)    │
   │                       │                      ├──────────────────────►│
   │                       │                      │                       │
   │                       │                      │ kickOutbound()        │
   │                       │                      │                       │
   │                       │                      │ ─── OUTBOUND TICK ─── │
   │                       │                      │                       │
   │                       │                      │ Claim outbound msg    │
   │                       │                      │ Stale check: OK       │
   │                       │                      │ Age check: OK         │
   │                       │                      │                       │
   │                       │ POST /{phoneId}/     │                       │
   │                       │ messages             │                       │
   │                       │◄─────────────────────┤ Send list message     │
   │                       │                      │                       │
   │                       │ { messages: [{id}] } │                       │
   │                       ├─────────────────────►│                       │
   │                       │                      │ Mark SENT             │
   │                       │                      ├──────────────────────►│
   │◄──────────────────────┤ Service list         │                       │
   │ (interactive list)    │                      │                       │
   │                       │                      │                       │
   │ (taps "Beard Trim")   │                      │                       │
   ├──────────────────────►│                      │                       │
   │                       │ POST webhook         │                       │
   │                       │ interactive.list_reply│                      │
   │                       ├─────────────────────►│                       │
   │                       │                      │ ... (same pipeline)   │
   │                       │                      │ servicePickerHandler  │
   │                       │                      │ .process()            │
   │                       │                      │ → selectedServiceIds  │
   │                       │                      │ → totalPrice: 100     │
   │                       │                      │                       │
   │                       │                      │ resolveNextNode →     │
   │                       │                      │ time_selection        │
   │                       │                      │                       │
   │                       │                      │ timePickerHandler     │
   │                       │                      │ .render()             │
   │                       │                      │ → availabilityService │
   │                       │                      │   .getBulkData()      │
   │                       │                      │ → filter available    │
   │                       │                      │ → render list         │
   │                       │                      │                       │
   │◄──────────────────────┤ Time slot list       │                       │
   │                       │                      │                       │
   │ (taps "10:00 am")     │                      │                       │
   ├──────────────────────►│                      │                       │
   │                       ├─────────────────────►│                       │
   │                       │                      │ timePickerHandler     │
   │                       │                      │ .process()            │
   │                       │                      │ → requestedTime       │
   │                       │                      │                       │
   │                       │                      │ resolveNextNode →     │
   │                       │                      │ confirmation          │
   │                       │                      │                       │
   │                       │                      │ confirmationHandler   │
   │                       │                      │ .render()             │
   │                       │                      │ → booking summary     │
   │                       │                      │ → Confirm/Cancel btns │
   │                       │                      │                       │
   │◄──────────────────────┤ Confirm screen       │                       │
   │                       │                      │                       │
   │ (taps "✅ Confirm")   │                      │                       │
   ├──────────────────────►│                      │                       │
   │                       ├─────────────────────►│                       │
   │                       │                      │ confirmationHandler   │
   │                       │                      │ .process()            │
   │                       │                      │                       │
   │                       │                      │ CREATE BookingIntent  │
   │                       │                      ├──────────────────────►│ UPSERT BookingIntent
   │                       │                      │                       │ (idempotent)
   │                       │                      │                       │
   │                       │                      │ resolveNextNode →     │
   │                       │                      │ booking               │
   │                       │                      │                       │
   │                       │                      │ bookingHandler        │
   │                       │                      │ .process()            │
   │                       │                      │                       │
   │                       │                      │ Ensure Customer       │
   │                       │                      ├──────────────────────►│ UPSERT Customer
   │                       │                      │                       │ UPSERT Person
   │                       │                      │                       │ UPSERT BusinessCustomer
   │                       │                      │                       │
   │                       │                      │ Auto-allocate         │
   │                       │                      │ resource + staff      │
   │                       │                      ├──────────────────────►│ SELECT Resource, Staff
   │                       │                      │                       │ (find available)
   │                       │                      │                       │
   │                       │                      │ CREATE Booking        │
   │                       │                      ├──────────────────────►│ INSERT Booking
   │                       │                      │                       │ (status: CONFIRMED)
   │                       │                      │                       │
   │                       │                      │ Update BookingIntent  │
   │                       │                      ├──────────────────────►│ UPDATE BookingIntent
   │                       │                      │                       │ status=CONFIRMED
   │                       │                      │                       │ bookingId=xxx
   │                       │                      │                       │
   │                       │                      │ Mark COMPLETED        │
   │                       │                      ├──────────────────────►│ UPDATE Conversation
   │                       │                      │                       │ state=COMPLETED
   │                       │                      │                       │
   │                       │                      │ Render confirmation   │
   │                       │                      │ message               │
   │                       │                      │                       │
   │◄──────────────────────┤ "Booking Confirmed!" │                       │
   │                       │ [📅 Book Again]      │                       │
   │                       │                      │                       │
```

---

## What Happens on the Merchant Side

After the WhatsApp booking is created, the merchant sees it in their app:

```
SalonMerchantApp                    API Server              Database
     │                                  │                       │
     │ (App opens / pull-to-refresh)    │                       │
     │                                  │                       │
     │ GET /api/v1/bookings             │                       │
     │ ?businessId=xxx                  │                       │
     ├─────────────────────────────────►│                       │
     │                                  │ SELECT Booking        │
     │                                  │ WHERE businessId      │
     │                                  │ + customer, services  │
     │                                  ├──────────────────────►│
     │                                  │◄──────────────────────┤
     │◄─────────────────────────────────┤                       │
     │ { bookings: [...] }              │                       │
     │                                  │                       │
     │ (Merchant sees new booking       │                       │
     │  with status CONFIRMED)          │                       │
     │                                  │                       │
     │ (Merchant completes service,     │                       │
     │  taps "Complete" → selects       │                       │
     │  payment method)                 │                       │
     │                                  │                       │
     │ POST /api/v1/bookings/:id/       │                       │
     │ checkout                         │                       │
     │ { items: [...], paymentMode:     │                       │
     │   "CASH" }                       │                       │
     ├─────────────────────────────────►│                       │
     │                                  │ UPDATE Booking        │
     │                                  │ status=COMPLETED      │
     │                                  │ paymentMode=CASH      │
     │                                  │ totalPrice=100        │
     │                                  ├──────────────────────►│
     │                                  │◄──────────────────────┤
     │◄─────────────────────────────────┤                       │
     │ { booking: { status:COMPLETED }} │                       │
```

---

## Data Schema (Key Tables)

### Booking Lifecycle

```
┌───────────────┐     ┌──────────────────┐     ┌─────────────┐
│ BookingIntent │────►│    Booking       │────►│  Checkout   │
│               │     │                  │     │  (status    │
│ • PENDING     │     │ • PENDING        │     │   change)   │
│ • CONFIRMED   │     │ • CONFIRMED      │     │             │
│ • EXPIRED     │     │ • COMPLETED      │     │ paymentMode │
│ • CANCELLED   │     │ • CANCELLED_*    │     │ items[]     │
│               │     │ • REJECTED       │     └─────────────┘
│ holds the slot│     │                  │
│ for 10 min    │     │ has resource +   │
│               │     │ staff allocated  │
└───────────────┘     └──────────────────┘

BookingIntent is created during WhatsApp confirmation step.
Booking is created when user confirms (BookingIntent → Booking).
Checkout happens when merchant completes the service in the app.
```

### Core Entity Relationships

```
User (OWNER)
  └── Business
        ├── Service[]           (what the salon offers)
        ├── Resource[]          (chairs/rooms for parallel booking)
        ├── Staff[]             (team members)
        ├── Booking[]           (appointments)
        │     ├── Customer      (end user identity)
        │     ├── Resource      (assigned chair)
        │     └── Staff         (assigned staff member)
        ├── WhatsAppConversation[] (active chat sessions)
        ├── WhatsAppChannel?    (dedicated number, if any)
        ├── WhatsAppFlow[]      (custom flow definitions)
        └── Subscription        (plan: BASIC/PRO, status: TRIAL/ACTIVE/...)
```

### Customer Identity (Dual-Track)

```
Legacy:   Customer (phoneNumber) ← used by old booking code
                │
Foundation V2:  Person (phoneNumber)
                  └── BusinessCustomer (person + business pair)
                        └── displayName, lastInteractedAt
```

Both are created during WhatsApp booking (ensureCustomer + ensureBusinessCustomer).

---

## How Admin Controls Affect the System

| Admin Action | Effect on WhatsApp Bookings |
|-------------|----------------------------|
| Toggle business inactive | Customer gets "This business is temporarily unavailable" |
| Change plan to expired | Feature access check fails → "WhatsApp booking not enabled" |
| Provision merchant | Creates User + Business + Subscription (TRIAL) |
| Record payment | Extends subscription period |

---

## External Service Dependencies

| Service | What It Does | Failure Impact |
|---------|-------------|----------------|
| Meta Graph API | Send/receive WhatsApp messages | No messages in/out |
| Supabase PostgreSQL | All data persistence | Everything breaks |
| Ngrok (dev only) | Tunnel for webhook | No webhooks received locally |
| Supabase Auth (optional) | JWT token generation/validation | Auth failures |

---

## Request/Response Format Convention

All API responses follow:
```json
// Success
{ "success": true, "data": { ... }, "meta": { "page": 1, "total": 50 } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Business not found" } }
```

HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad request / validation error
- 401: Unauthorized (token missing/expired)
- 403: Forbidden (insufficient permissions)
- 404: Resource not found
- 409: Conflict (duplicate routing code, etc.)
- 500: Internal server error
