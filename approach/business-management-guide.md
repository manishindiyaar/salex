# Business Management Module Guide

A complete guide for understanding and testing the Business Management API. This module allows merchants to create and manage their salon/shop profiles, and enables WhatsApp customers to discover businesses via routing codes.

---

## Quick Reference

**Base URL:** `http://localhost:3001`

**Test Bearer Token (valid for 7 days from Jan 2, 2026):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw
```

---

## User Story: "Setting Up Shop"

### Story 1: Merchant Creates Business

**Scenario:** Raj (logged in) wants to create his profile for "Classic Cuts"

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Raj's     │     │   Express   │     │  Database   │
│   App       │     │    API      │     │  (Supabase) │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ POST /businesses  │                   │
      │ {name, phone}     │                   │
      │──────────────────>│                   │
      │                   │ Generate code     │
      │                   │ (e.g., 8821)      │
      │                   │                   │
      │                   │ Create Business   │
      │                   │──────────────────>│
      │                   │                   │
      │   {business,      │                   │
      │    routingCode}   │                   │
      │<──────────────────│                   │
```

**Result:** Raj sees his dashboard with WhatsApp Code: `8821`

### Story 2: Customer Discovers Business

**Scenario:** Priya (customer) types `8821` in WhatsApp

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │     │   Express   │     │  Database   │
│    Bot      │     │    API      │     │  (Supabase) │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ GET /routing/8821 │                   │
      │──────────────────>│                   │
      │                   │ Lookup code       │
      │                   │──────────────────>│
      │                   │                   │
      │   {name, id,      │                   │
      │    services}      │                   │
      │<──────────────────│                   │
```

**Result:** Bot knows to route messages to "Classic Cuts"

---

## File Structure

```
apps/api/src/
├── services/
│   ├── routing.service.ts    # Generates unique 4-digit codes
│   ├── business.service.ts   # Business CRUD operations
│   └── index.ts              # Barrel export
├── controllers/
│   ├── business.controller.ts # HTTP request handlers
│   └── index.ts
├── routes/
│   ├── business.routes.ts    # Route definitions
│   └── index.ts
└── middlewares/
    └── auth.middleware.ts    # JWT validation
```

---

## How It Works

### 1. Routing Service (`routing.service.ts`)

Generates unique 4-digit codes (0000-9999) for businesses.

```typescript
// Key functions:
generateUniqueCode()  // Returns "8821" (random, unique)
isCodeTaken(code)     // Checks if code exists in DB
isValidFormat(code)   // Validates 4-digit format
```

**Collision Resolution:**
- Generates random 4-digit code
- Checks database for existing code
- If taken, retries (up to 10 times)
- Returns unique code

### 2. Business Service (`business.service.ts`)

Handles all business operations.

```typescript
// Key functions:
create(ownerId, data)        // Create new business
getByOwnerId(ownerId)        // Get merchant's business
getByRoutingCode(code)       // Public lookup for WhatsApp
update(id, ownerId, data)    // Update business details
```

### 3. Business Controller (`business.controller.ts`)

Handles HTTP requests and responses.

```typescript
// Endpoints:
POST   /businesses           // Create business
GET    /businesses/me        // Get my business
PATCH  /businesses/:id       // Update business
GET    /businesses/routing/:code  // Public lookup
```

### 4. Business Routes (`business.routes.ts`)

Defines which endpoints need authentication.

```typescript
// Public (no auth)
router.get('/routing/:code', ...)

// Protected (requires JWT)
router.post('/', authMiddleware, ...)
router.get('/me', authMiddleware, ...)
router.patch('/:id', authMiddleware, ...)
```

---

## Database Schema

```prisma
model Business {
  id                    String   @id @default(cuid())
  ownerId               String   // Links to User
  name                  String   // "Classic Cuts"
  phoneNumber           String   // "+919801441675"
  routingCode           String?  @unique @db.VarChar(4)  // "8821"
  hoursOfOperation      Json?    // {"monday": {open: "09:00", close: "18:00"}}
  maxConcurrentBookings Int      @default(1)
  isAcceptingOrders     Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  owner    User      @relation(...)
  services Service[]
}
```

---

## API Endpoints

### 1. Create Business

Creates a new business for the authenticated user. Auto-generates a unique 4-digit routing code.

**Endpoint:** `POST /api/v1/businesses`  
**Auth:** Required (Bearer Token)

**Request Body:**
```json
{
  "name": "Classic Cuts",
  "phoneNumber": "+919801441675",
  "maxConcurrentBookings": 2,
  "isAcceptingOrders": true,
  "hoursOfOperation": {
    "monday": { "open": "09:00", "close": "18:00" },
    "tuesday": { "open": "09:00", "close": "18:00" },
    "wednesday": { "open": "09:00", "close": "18:00" },
    "thursday": { "open": "09:00", "close": "18:00" },
    "friday": { "open": "09:00", "close": "18:00" },
    "saturday": { "open": "10:00", "close": "16:00" },
    "sunday": { "closed": true }
  }
}
```

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| name | string | Business name (1-100 chars) |
| phoneNumber | string | E.164 format (+919801441675) |

**Optional Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| routingCode | string | auto-generated | Custom 4-digit code |
| maxConcurrentBookings | number | 1 | Max parallel bookings |
| isAcceptingOrders | boolean | true | Accepting new bookings |
| hoursOfOperation | object | null | Business hours |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "business": {
      "id": "cmjx1abc123",
      "name": "Classic Cuts",
      "phoneNumber": "+919801441675",
      "routingCode": "8821",
      "hoursOfOperation": {...},
      "maxConcurrentBookings": 2,
      "isAcceptingOrders": true,
      "services": [],
      "createdAt": "2026-01-02T16:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `409` - User already has a business
- `409` - Routing code already in use

---

### 2. Get My Business

Returns the authenticated user's business with active services.

**Endpoint:** `GET /api/v1/businesses/me`  
**Auth:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "business": {
      "id": "cmjx1abc123",
      "name": "Classic Cuts",
      "phoneNumber": "+919801441675",
      "routingCode": "8821",
      "hoursOfOperation": {...},
      "maxConcurrentBookings": 2,
      "isAcceptingOrders": true,
      "services": [
        {
          "id": "srv123",
          "name": "Haircut",
          "price": "200.00",
          "durationMinutes": 30
        }
      ],
      "createdAt": "2026-01-02T16:00:00.000Z",
      "updatedAt": "2026-01-02T16:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `404` - Business not found for this user

---

### 3. Update Business

Updates business details. Only the owner can update.

**Endpoint:** `PATCH /api/v1/businesses/:id`  
**Auth:** Required (Bearer Token)

**Request Body (all fields optional):**
```json
{
  "name": "Classic Cuts Premium",
  "phoneNumber": "+919801441675",
  "maxConcurrentBookings": 3,
  "isAcceptingOrders": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "business": {
      "id": "cmjx1abc123",
      "name": "Classic Cuts Premium",
      ...
    }
  }
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `404` - Business not found
- `422` - You can only update your own business
- `409` - Routing code already in use

---

### 4. Get Business by Routing Code (Public)

Public endpoint for WhatsApp bot to discover businesses.

**Endpoint:** `GET /api/v1/businesses/routing/:code`  
**Auth:** Not required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "business": {
      "id": "cmjx1abc123",
      "name": "Classic Cuts",
      "phoneNumber": "+919801441675",
      "routingCode": "8821",
      "isAcceptingOrders": true,
      "hoursOfOperation": {...},
      "services": [
        {
          "id": "srv123",
          "name": "Haircut",
          "description": "Standard haircut",
          "price": "200.00",
          "durationMinutes": 30
        }
      ]
    }
  }
}
```

**Error Responses:**
- `404` - No business found with routing code
- `422` - Invalid routing code format

---

## Testing Guide

### Prerequisites

1. Start the API server:
```bash
pnpm dev:api
```

2. Use this Bearer Token for all protected requests:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw
```

---

### Test 1: Create Business

**curl:**
```bash
curl -X POST 'http://localhost:3001/api/v1/businesses' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"name":"Classic Cuts","phoneNumber":"+919801441675"}'
```

**Postman/Insomnia:**
- Method: `POST`
- URL: `http://localhost:3001/api/v1/businesses`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw`
- Body (JSON):
```json
{
  "name": "Classic Cuts",
  "phoneNumber": "+919801441675"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "business": {
      "id": "cmjx...",
      "name": "Classic Cuts",
      "phoneNumber": "+919801441675",
      "routingCode": "8821",
      "services": [],
      ...
    }
  }
}
```

---

### Test 2: Get My Business

**curl:**
```bash
curl 'http://localhost:3001/api/v1/businesses/me' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw'
```

**Postman/Insomnia:**
- Method: `GET`
- URL: `http://localhost:3001/api/v1/businesses/me`
- Headers:
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw`

---

### Test 3: Update Business

**curl:**
```bash
curl -X PATCH 'http://localhost:3001/api/v1/businesses/<BUSINESS_ID>' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"name":"Classic Cuts Premium","maxConcurrentBookings":3}'
```

**Postman/Insomnia:**
- Method: `PATCH`
- URL: `http://localhost:3001/api/v1/businesses/<BUSINESS_ID>`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Body (JSON):
```json
{
  "name": "Classic Cuts Premium",
  "maxConcurrentBookings": 3
}
```

> **Note:** Replace `<BUSINESS_ID>` with the actual ID from Test 1 response.

---

### Test 4: Get Business by Routing Code (Public)

**curl:**
```bash
curl 'http://localhost:3001/api/v1/businesses/routing/8821'
```

**Postman/Insomnia:**
- Method: `GET`
- URL: `http://localhost:3001/api/v1/businesses/routing/8821`
- Headers: None required (public endpoint)

> **Note:** Replace `8821` with the actual routing code from Test 1 response.

---

### Test 5: Error Cases

**Missing Token:**
```bash
curl 'http://localhost:3001/api/v1/businesses/me'
# Returns 401 Unauthorized
```

**Invalid Routing Code:**
```bash
curl 'http://localhost:3001/api/v1/businesses/routing/9999'
# Returns 404 Not Found
```

**Duplicate Business:**
```bash
# Run Test 1 again - should return 409 Conflict
curl -X POST 'http://localhost:3001/api/v1/businesses' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -d '{"name":"Another Shop","phoneNumber":"+919801441675"}'
# Returns 409 - User already has a business
```

---

## Validation Rules

### Business Name
- Required
- 1-100 characters

### Phone Number
- Required
- E.164 format: `+` followed by 10-15 digits
- Example: `+919801441675`

### Routing Code
- Optional (auto-generated if not provided)
- Exactly 4 digits
- Must be unique

### Max Concurrent Bookings
- Optional (default: 1)
- Integer between 1-20

---

## Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Missing authentication token | 401 | No Bearer token | Add Authorization header |
| Invalid authentication token | 401 | Expired/malformed token | Get new token via OTP flow |
| User already has a business | 409 | Duplicate creation | Use GET /me instead |
| Routing code already in use | 409 | Custom code taken | Use different code or let system generate |
| Business not found | 404 | Invalid ID or code | Check ID/code is correct |
| Invalid routing code format | 422 | Not 4 digits | Use exactly 4 digits (0000-9999) |

---

## Summary

The Business Management module provides:

1. **Routing Service** - Generates unique 4-digit codes with collision handling
2. **Business Service** - CRUD operations with ownership validation
3. **Business Controller** - HTTP handlers with Zod validation
4. **Business Routes** - Protected (auth) and public endpoints

**Key Features:**
- Auto-generated routing codes for WhatsApp discovery
- One business per user (enforced)
- Public lookup for WhatsApp bot integration
- Ownership validation for updates
