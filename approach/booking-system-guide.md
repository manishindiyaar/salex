# Booking System with Availability Engine Guide

A complete guide for understanding and testing the Booking System API. This module handles appointment bookings with multi-service support, price snapshots, availability checking, status transitions, and checkout flow.

---

## Quick Reference

**Base URL:** `http://localhost:3001`

**Test Bearer Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw
```

---

## User Story: "Booking an Appointment"

### Scenario 1: Merchant creates a walk-in booking

Raj (salon owner) has a customer who just walked in wanting a haircut and beard trim.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Merchant   │     │   Express   │     │  Database   │
│    App      │     │    API      │     │  (Supabase) │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ POST /bookings    │                   │
      │ {serviceIds,      │                   │
      │  scheduledAt}     │                   │
      │──────────────────>│                   │
      │                   │ 1. Fetch services │
      │                   │──────────────────>│
      │                   │ 2. Calculate      │
      │                   │    duration & end │
      │                   │ 3. Check          │
      │                   │    availability   │
      │                   │──────────────────>│
      │                   │ 4. Create booking │
      │                   │    + snapshots    │
      │                   │──────────────────>│
      │                   │                   │
      │   {booking}       │                   │
      │<──────────────────│                   │
```

**Result:** Booking created with:
- `totalPrice` = ₹200 (Haircut) + ₹100 (Beard) = ₹300
- `endAt` = scheduledAt + 30min + 15min = 45 minutes later
- Price snapshots frozen at booking time

### Scenario 2: Customer books via WhatsApp (future)

```
Customer → WhatsApp Bot → API → Database
   "I want a haircut at 3pm tomorrow"
```

---

## File Structure

```
apps/api/src/
├── services/
│   ├── availability.service.ts  # Overlap detection engine
│   └── booking.service.ts       # Booking CRUD operations
├── controllers/
│   └── booking.controller.ts    # HTTP request handlers
└── routes/
    └── booking.routes.ts        # Route definitions
```

---

## How It Works

### Step 1: Availability Service (`availability.service.ts`)

The heart of the booking system - prevents double-bookings using time overlap detection.

**The Overlap Formula:**
```
(existing.scheduledAt < requested.endAt) AND (existing.endAt > requested.scheduledAt)
```

This formula detects ANY overlap between time ranges:
- Existing booking starts during requested slot
- Existing booking ends during requested slot  
- Existing booking completely contains requested slot
- Requested slot completely contains existing booking

```typescript
// Key functions:
checkAvailability(businessId, requestedStart, requestedEnd)
  → { available: boolean, currentCount: number, maxCapacity: number }

getOverlappingBookings(businessId, requestedStart, requestedEnd)
  → Booking[] // For debugging conflicts

calculateEndTime(scheduledAt, totalDurationMinutes)
  → Date // Helper to calculate end time
```

**Visual Example:**
```
Business: maxConcurrentBookings = 2 (2 chairs)

Timeline:
  2:00 PM ─────────────────────────────────────── 4:00 PM
           │ Booking A │
           2:00 ────── 3:00
                    │ Booking B │
                    2:30 ────── 3:30

Request: 2:45 PM - 3:15 PM
  → Overlaps with BOTH A and B
  → currentCount = 2, maxCapacity = 2
  → available = FALSE (slot full!)

Request: 3:30 PM - 4:00 PM
  → No overlaps (B ends exactly at 3:30)
  → currentCount = 0, maxCapacity = 2
  → available = TRUE
```

### Step 2: Booking Service (`booking.service.ts`)

Handles all booking operations with ownership validation.

```typescript
// Key functions:
create(ownerId, data)           // Create booking with price snapshots
getById(id, ownerId)            // Get single booking
listByBusinessId(...)           // List with filters & pagination
updateStatus(id, ownerId, data) // Status transitions
checkout(id, ownerId, data)     // Complete with item modification
```

**Key Features:**
- Multi-service support (combos like "Haircut + Beard Trim")
- Price snapshots frozen at booking time
- Walk-in support (null customerId)
- Status transition validation
- Checkout flow with item modification

### Step 3: Booking Controller (`booking.controller.ts`)

HTTP handlers that:
1. Parse and validate request body using Zod schemas
2. Extract user ID from JWT (via `req.auth.userId`)
3. Call appropriate service method
4. Return JSON response

```typescript
// Key handlers:
create(req, res, next)           // POST /bookings
getById(req, res, next)          // GET /bookings/:id
list(req, res, next)             // GET /bookings
updateStatus(req, res, next)     // PATCH /bookings/:id/status
checkout(req, res, next)         // POST /bookings/:id/checkout
checkAvailability(req, res, next) // POST /bookings/check-availability
```

### Step 4: Booking Routes (`booking.routes.ts`)

Route definitions with auth middleware:

```typescript
router.use(authMiddleware);  // All routes protected

router.post('/', bookingController.create);
router.post('/check-availability', bookingController.checkAvailability);
router.get('/', bookingController.list);
router.get('/:id', bookingController.getById);
router.patch('/:id/status', bookingController.updateStatus);
router.post('/:id/checkout', bookingController.checkout);
```

---

## Price Snapshots Explained

When a booking is created, we capture the service prices at that moment:

```
Day 1: Service "Haircut" price = ₹200
Day 1: Customer books → BookingItem.priceSnapshot = ₹200

Day 2: Merchant raises price to ₹250

Day 3: Customer arrives → Still pays ₹200 (snapshot preserved!)
```

**Why?** Financial integrity - the price agreed upon is the price charged.

**How it works in code:**
```typescript
// In booking.service.ts create()
const bookingItems = await Promise.all(
  services.map(service =>
    tx.bookingItem.create({
      data: {
        bookingId: newBooking.id,
        serviceId: service.id,
        nameSnapshot: service.name,      // Frozen name
        priceSnapshot: service.price,    // Frozen price
      },
    })
  )
);
```

---

## Database Schema

```prisma
model Booking {
  id          String        @id @default(cuid())
  businessId  String
  customerId  String?       // Nullable for walk-ins
  status      BookingStatus @default(PENDING)
  scheduledAt DateTime      // Start time
  endAt       DateTime      // Calculated: start + total duration
  totalPrice  Decimal       // Sum of all service prices
  paymentMode PaymentMode?  // Set at checkout (CASH/UPI/OTHER)
  notes       String?
  source      String?       // "whatsapp" | "manual" | "walk-in"
  createdAt   DateTime
  updatedAt   DateTime

  items    BookingItem[]    // Services in this booking
  
  @@index([businessId, scheduledAt])  // Fast queries by date
}

model BookingItem {
  id            String  @id @default(cuid())
  bookingId     String
  serviceId     String
  nameSnapshot  String  // Service name at booking time
  priceSnapshot Decimal // Price at booking time (IMMUTABLE)
}
```

---

## Status Transitions

```
┌─────────┐
│ PENDING │ ← Initial state (booking just created)
└────┬────┘
     │
     ├──────────────────┬──────────────────┬──────────────────┐
     ▼                  ▼                  ▼                  ▼
┌───────────┐    ┌──────────┐    ┌─────────────────┐    ┌─────────────────┐
│ CONFIRMED │    │ REJECTED │    │ CANCELLED_BY_   │    │ CANCELLED_BY_   │
└─────┬─────┘    └──────────┘    │     USER        │    │     SALON       │
      │          (terminal)      └─────────────────┘    └─────────────────┘
      │                                (terminal)              (terminal)
      ├──────────────────┬──────────────────┐
      ▼                  ▼                  ▼
┌───────────┐    ┌─────────────────┐    ┌─────────────────┐
│ COMPLETED │    │ CANCELLED_BY_   │    │ CANCELLED_BY_   │
└───────────┘    │     USER        │    │     SALON       │
  (terminal)     └─────────────────┘    └─────────────────┘
```

**Valid Transitions Table:**
| From | Allowed To |
|------|------------|
| PENDING | CONFIRMED, REJECTED, CANCELLED_BY_USER, CANCELLED_BY_SALON |
| CONFIRMED | COMPLETED, CANCELLED_BY_USER, CANCELLED_BY_SALON |
| REJECTED | (none - terminal state) |
| CANCELLED_BY_USER | (none - terminal state) |
| CANCELLED_BY_SALON | (none - terminal state) |
| COMPLETED | (none - terminal state) |

**Code Implementation:**
```typescript
// In @salex/shared-types/src/schemas/booking.schema.ts
export const bookingStatusTransitions: Record<BookingStatusType, BookingStatusType[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
  CONFIRMED: ['COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
  REJECTED: [],
  CANCELLED_BY_USER: [],
  CANCELLED_BY_SALON: [],
  COMPLETED: [],
};
```

---

## API Endpoints

### 1. Create Booking

Creates a new booking with multi-service support.

**Endpoint:** `POST /api/v1/bookings`  
**Auth:** Required (Bearer Token)

**Request Body:**
```json
{
  "businessId": "clxyz123...",
  "serviceIds": ["srv_haircut_id", "srv_beard_id"],
  "scheduledAt": "2026-01-03T15:00:00.000Z",
  "customerId": "cust_123...",
  "notes": "First time customer",
  "source": "manual"
}
```

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| businessId | string (cuid) | Your business ID |
| serviceIds | string[] | Array of service IDs (1-10 services) |
| scheduledAt | string (ISO datetime) | Appointment start time |

**Optional Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| customerId | string (cuid) | null | Customer ID (null for walk-ins) |
| notes | string | null | Booking notes (max 500 chars) |
| source | enum | "manual" | "whatsapp", "manual", or "walk-in" |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "clxyz789...",
      "businessId": "clxyz123...",
      "customerId": null,
      "status": "PENDING",
      "scheduledAt": "2026-01-03T15:00:00.000Z",
      "endAt": "2026-01-03T15:45:00.000Z",
      "totalPrice": "300.00",
      "paymentMode": null,
      "notes": "First time customer",
      "source": "manual",
      "createdAt": "2026-01-02T10:00:00.000Z",
      "items": [
        {
          "id": "item_1",
          "serviceId": "srv_haircut_id",
          "nameSnapshot": "Haircut",
          "priceSnapshot": "200.00"
        },
        {
          "id": "item_2",
          "serviceId": "srv_beard_id",
          "nameSnapshot": "Beard Trim",
          "priceSnapshot": "100.00"
        }
      ]
    }
  }
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `404` - Business/Service/Customer not found
- `409` - Time slot not available (capacity full)
- `422` - Business not accepting orders / Customer blocked

---

### 2. Check Availability

Check if a time slot is available before booking.

**Endpoint:** `POST /api/v1/bookings/check-availability`  
**Auth:** Required (Bearer Token)

**Request Body:**
```json
{
  "businessId": "clxyz123...",
  "scheduledAt": "2026-01-03T15:00:00.000Z",
  "durationMinutes": 45
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true,
    "currentCount": 1,
    "maxCapacity": 2,
    "requestedSlot": {
      "start": "2026-01-03T15:00:00.000Z",
      "end": "2026-01-03T15:45:00.000Z",
      "durationMinutes": 45
    }
  }
}
```

---

### 3. List Bookings

Get bookings for a business with filters.

**Endpoint:** `GET /api/v1/bookings`  
**Auth:** Required (Bearer Token)

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| businessId | string | **Yes** | Your business ID |
| status | enum | No | Filter by status (PENDING, CONFIRMED, etc.) |
| from | ISO datetime | No | Start of date range |
| to | ISO datetime | No | End of date range |
| page | number | No | Page number (default: 1) |
| pageSize | number | No | Items per page (default: 20, max: 100) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_1",
        "status": "PENDING",
        "scheduledAt": "2026-01-03T15:00:00.000Z",
        "totalPrice": "300.00",
        "items": [...],
        "customer": { "name": "Priya", "phoneNumber": "+919876543210" }
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 45
  }
}
```

---

### 4. Get Single Booking

**Endpoint:** `GET /api/v1/bookings/:id`  
**Auth:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "clxyz789...",
      "businessId": "clxyz123...",
      "status": "PENDING",
      "scheduledAt": "2026-01-03T15:00:00.000Z",
      "endAt": "2026-01-03T15:45:00.000Z",
      "totalPrice": "300.00",
      "items": [...]
    }
  }
}
```

---

### 5. Update Booking Status

**Endpoint:** `PATCH /api/v1/bookings/:id/status`  
**Auth:** Required (Bearer Token)

**Request Body:**
```json
{
  "status": "CONFIRMED"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "clxyz789...",
      "status": "CONFIRMED",
      ...
    }
  }
}
```

**Error Response (422) - Invalid Transition:**
```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_ERROR",
    "message": "Invalid status transition: COMPLETED → PENDING. Allowed: none (terminal state)"
  }
}
```

---

### 6. Checkout (Complete Booking)

Complete a booking with optional item modification. This is the "cash register" moment.

**Endpoint:** `POST /api/v1/bookings/:id/checkout`  
**Auth:** Required (Bearer Token)

**Request Body:**
```json
{
  "items": [
    { "serviceId": "srv_haircut_id", "quantity": 1 },
    { "serviceId": "srv_shampoo_id", "quantity": 1 }
  ],
  "paymentMode": "UPI"
}
```

**What happens:**
1. Old BookingItems are deleted
2. New BookingItems created with fresh price snapshots
3. totalPrice recalculated
4. paymentMode set
5. status → COMPLETED

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "clxyz789...",
      "status": "COMPLETED",
      "totalPrice": "250.00",
      "paymentMode": "UPI",
      "items": [
        { "nameSnapshot": "Haircut", "priceSnapshot": "200.00" },
        { "nameSnapshot": "Shampoo", "priceSnapshot": "50.00" }
      ]
    }
  }
}
```

**Payment Modes:** `CASH`, `UPI`, `OTHER`

---

## Testing Guide

### Prerequisites

1. Start the API server:
```bash
pnpm dev:api
```

2. **IMPORTANT:** You need:
   - A business (from Business API)
   - At least one service (from Service API)

3. Use this Bearer Token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw
```

---

### Step 0: Get Your Business and Service IDs

**Get your business:**
```bash
curl 'http://localhost:3001/api/v1/businesses/me' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw'
```

**Postman/Insomnia:**
- Method: `GET`
- URL: `http://localhost:3001/api/v1/businesses/me`
- Headers:
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw`

**📝 Save the `businessId` from response!**

---

**Get your services:**
```bash
curl 'http://localhost:3001/api/v1/businesses/<BUSINESS_ID>/services' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw'
```

**Postman/Insomnia:**
- Method: `GET`
- URL: `http://localhost:3001/api/v1/businesses/<BUSINESS_ID>/services`
- Headers:
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw`

**📝 Save the `serviceId`(s) from response!**

---

### Test 1: Check Availability

Before creating a booking, check if the slot is available.

**curl:**
```bash
curl -X POST 'http://localhost:3001/api/v1/bookings/check-availability' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"businessId":"<BUSINESS_ID>","scheduledAt":"2026-01-03T15:00:00.000Z","durationMinutes":30}'
```

**Postman/Insomnia:**
- Method: `POST`
- URL: `http://localhost:3001/api/v1/bookings/check-availability`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw`
- Body (JSON):
```json
{
  "businessId": "<BUSINESS_ID>",
  "scheduledAt": "2026-01-03T15:00:00.000Z",
  "durationMinutes": 30
}
```

> **Note:** Replace `<BUSINESS_ID>` with your actual business ID.

---

### Test 2: Create a Booking (Single Service)

**curl:**
```bash
curl -X POST 'http://localhost:3001/api/v1/bookings' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"businessId":"<BUSINESS_ID>","serviceIds":["<SERVICE_ID>"],"scheduledAt":"2026-01-03T15:00:00.000Z","source":"manual"}'
```

**Postman/Insomnia:**
- Method: `POST`
- URL: `http://localhost:3001/api/v1/bookings`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw`
- Body (JSON):
```json
{
  "businessId": "<BUSINESS_ID>",
  "serviceIds": ["<SERVICE_ID>"],
  "scheduledAt": "2026-01-03T15:00:00.000Z",
  "source": "manual"
}
```

**📝 Save the `bookingId` from response!**

---

### Test 3: Create a Booking (Multiple Services - Combo)

**curl:**
```bash
curl -X POST 'http://localhost:3001/api/v1/bookings' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"businessId":"<BUSINESS_ID>","serviceIds":["<SERVICE_ID_1>","<SERVICE_ID_2>"],"scheduledAt":"2026-01-03T16:00:00.000Z","notes":"Combo booking - Haircut + Beard","source":"manual"}'
```

**Postman/Insomnia:**
- Method: `POST`
- URL: `http://localhost:3001/api/v1/bookings`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw`
- Body (JSON):
```json
{
  "businessId": "<BUSINESS_ID>",
  "serviceIds": ["<SERVICE_ID_1>", "<SERVICE_ID_2>"],
  "scheduledAt": "2026-01-03T16:00:00.000Z",
  "notes": "Combo booking - Haircut + Beard",
  "source": "manual"
}
```

---

### Test 4: List Bookings

**curl (all bookings):**
```bash
curl 'http://localhost:3001/api/v1/bookings?businessId=<BUSINESS_ID>' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw'
```

**Postman/Insomnia:**
- Method: `GET`
- URL: `http://localhost:3001/api/v1/bookings?businessId=<BUSINESS_ID>`
- Headers:
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw`

---

**curl (filter by status):**
```bash
curl 'http://localhost:3001/api/v1/bookings?businessId=<BUSINESS_ID>&status=PENDING' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw'
```

**Postman/Insomnia:**
- Method: `GET`
- URL: `http://localhost:3001/api/v1/bookings?businessId=<BUSINESS_ID>&status=PENDING`

---

**curl (filter by date range):**
```bash
curl 'http://localhost:3001/api/v1/bookings?businessId=<BUSINESS_ID>&from=2026-01-03T00:00:00.000Z&to=2026-01-03T23:59:59.000Z' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw'
```

**Postman/Insomnia:**
- Method: `GET`
- URL: `http://localhost:3001/api/v1/bookings?businessId=<BUSINESS_ID>&from=2026-01-03T00:00:00.000Z&to=2026-01-03T23:59:59.000Z`

---

### Test 5: Get Single Booking

**curl:**
```bash
curl 'http://localhost:3001/api/v1/bookings/<BOOKING_ID>' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw'
```

**Postman/Insomnia:**
- Method: `GET`
- URL: `http://localhost:3001/api/v1/bookings/<BOOKING_ID>`
- Headers:
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw`

---

### Test 6: Update Booking Status (Confirm)

**curl:**
```bash
curl -X PATCH 'http://localhost:3001/api/v1/bookings/<BOOKING_ID>/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"status":"CONFIRMED"}'
```

**Postman/Insomnia:**
- Method: `PATCH`
- URL: `http://localhost:3001/api/v1/bookings/<BOOKING_ID>/status`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw`
- Body (JSON):
```json
{
  "status": "CONFIRMED"
}
```

---

### Test 7: Checkout (Complete Booking)

**curl:**
```bash
curl -X POST 'http://localhost:3001/api/v1/bookings/<BOOKING_ID>/checkout' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"items":[{"serviceId":"<SERVICE_ID>","quantity":1}],"paymentMode":"CASH"}'
```

**Postman/Insomnia:**
- Method: `POST`
- URL: `http://localhost:3001/api/v1/bookings/<BOOKING_ID>/checkout`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw`
- Body (JSON):
```json
{
  "items": [
    { "serviceId": "<SERVICE_ID>", "quantity": 1 }
  ],
  "paymentMode": "CASH"
}
```

**Payment Modes:** `CASH`, `UPI`, `OTHER`

---

### Test 8: Test Availability Rejection

Create multiple bookings at the same time to test capacity limits.

**First booking (should succeed):**
```bash
curl -X POST 'http://localhost:3001/api/v1/bookings' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"businessId":"<BUSINESS_ID>","serviceIds":["<SERVICE_ID>"],"scheduledAt":"2026-01-04T10:00:00.000Z"}'
```

**Second booking at same time (should fail if maxConcurrentBookings=1):**
```bash
curl -X POST 'http://localhost:3001/api/v1/bookings' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"businessId":"<BUSINESS_ID>","serviceIds":["<SERVICE_ID>"],"scheduledAt":"2026-01-04T10:00:00.000Z"}'
```

**Expected error (409):**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Slot unavailable. 1/1 concurrent bookings."
  }
}
```

---

### Test 9: Test Invalid Status Transition

Try to change a COMPLETED booking back to PENDING:

```bash
curl -X PATCH 'http://localhost:3001/api/v1/bookings/<COMPLETED_BOOKING_ID>/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"status":"PENDING"}'
```

**Expected error (422):**
```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_ERROR",
    "message": "Invalid status transition: COMPLETED → PENDING. Allowed: none (terminal state)"
  }
}
```

---

## Validation Rules

### businessId
- Required
- Must be a valid CUID
- Must belong to the authenticated user

### serviceIds
- Required
- Array of valid CUIDs
- Minimum 1, maximum 10 services
- All services must exist and be active

### scheduledAt
- Required
- Must be a valid ISO 8601 datetime string
- Should be in the future (not enforced, but recommended)

### customerId
- Optional (null for walk-ins)
- If provided, must be a valid CUID
- Customer must exist and not be blocked

### notes
- Optional
- Maximum 500 characters

### source
- Optional (default: "manual")
- Must be one of: "whatsapp", "manual", "walk-in"

### status (for updates)
- Must be a valid BookingStatus enum value
- Must follow valid transition rules

### paymentMode (for checkout)
- Required for checkout
- Must be one of: "CASH", "UPI", "OTHER"

---

## Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Missing authentication token | 401 | No Bearer token | Add Authorization header |
| Business not found | 404 | Invalid business ID | Check business ID |
| Services not found or inactive | 404 | Invalid service IDs | Check service IDs, ensure active |
| Customer not found | 404 | Invalid customer ID | Check customer ID |
| Booking not found | 404 | Invalid booking ID | Check booking ID |
| Time slot not available | 409 | Capacity full | Choose different time |
| Invalid status transition | 422 | Terminal state or invalid | Check allowed transitions |
| Business not accepting orders | 422 | isAcceptingOrders = false | Enable orders in business settings |
| Customer is blocked | 422 | Customer blocked | Unblock customer |
| You can only create/view bookings for your own business | 422 | Not the owner | Use correct account |

---

## Summary

The Booking System module provides:

1. **Availability Service** (`availability.service.ts`)
   - Overlap detection using time range formula
   - Concurrency limit checking against `maxConcurrentBookings`
   - Helper to calculate end time from duration

2. **Booking Service** (`booking.service.ts`)
   - Create bookings with multi-service support
   - Price snapshots frozen at booking time
   - Walk-in support (null customer)
   - Status transition validation
   - Checkout flow with item modification

3. **Booking Controller** (`booking.controller.ts`)
   - HTTP handlers with Zod validation
   - Extracts user ID from JWT

4. **Booking Routes** (`booking.routes.ts`)
   - All protected endpoints with auth middleware

**Key Features:**
- Multi-service bookings (combos)
- Price snapshots frozen at booking time
- Walk-in support (null customer)
- Availability engine prevents double-bookings
- Status transition validation (state machine)
- Checkout flow with item modification
- Pagination and filtering for list endpoint
