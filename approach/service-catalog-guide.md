# Service Catalog Module Guide

A complete guide for understanding and testing the Service Catalog API. This module allows merchants to manage the services they offer (haircuts, facials, etc.) with pricing and duration.

---

## Quick Reference

**Base URL:** `http://localhost:3001`

**Test Bearer Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw
```

---

## User Story: "Setting Up Services"

### Scenario: Raj adds services to his salon

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Raj's     │     │   Express   │     │  Database   │
│   App       │     │    API      │     │  (Supabase) │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ POST /services    │                   │
      │ {name, price,     │                   │
      │  duration}        │                   │
      │──────────────────>│                   │
      │                   │ Validate owner    │
      │                   │──────────────────>│
      │                   │ Create service    │
      │                   │──────────────────>│
      │                   │                   │
      │   {service}       │                   │
      │<──────────────────│                   │
```

**Result:** Raj's salon now offers "Haircut" at ₹200 for 30 minutes.

---

## File Structure

```
apps/api/src/
├── services/
│   └── service.service.ts    # Service CRUD operations
├── controllers/
│   └── service.controller.ts # HTTP request handlers
└── routes/
    └── service.routes.ts     # Route definitions
```

---

## How It Works

### Service Service (`service.service.ts`)

Handles all service operations with ownership validation.

```typescript
// Key functions:
create(businessId, ownerId, data)     // Create new service
listByBusinessId(businessId, includeInactive)  // List services
getById(id)                           // Get single service
update(id, ownerId, data)             // Update service
softDelete(id, ownerId)               // Soft delete (isActive = false)
```

**Key Features:**
- Validates business ownership before any operation
- Prevents duplicate service names per business
- Soft delete protects booking history
- Deletion protection for services with active bookings

---

## Database Schema

```prisma
model Service {
  id              String   @id @default(cuid())
  businessId      String
  name            String   @db.VarChar(100)   // "Haircut"
  description     String?  @db.VarChar(500)   // "Standard men's haircut"
  price           Decimal  @db.Decimal(10, 2) // 200.00
  durationMinutes Int      @default(30)       // 30 minutes
  isActive        Boolean  @default(true)     // Soft delete flag
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  business     Business      @relation(...)
  bookingItems BookingItem[]

  @@unique([businessId, name])  // No duplicate names per business
}
```

---

## API Endpoints

### 1. Create Service

Creates a new service for a business.

**Endpoint:** `POST /api/v1/businesses/:businessId/services`  
**Auth:** Required (Bearer Token)

**Request Body:**
```json
{
  "name": "Haircut",
  "description": "Standard men's haircut with styling",
  "price": 200.00,
  "durationMinutes": 30,
  "isActive": true
}
```

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| name | string | Service name (1-100 chars) |
| price | number | Price in INR (positive, 2 decimals) |

**Optional Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| description | string | null | Service description (max 500 chars) |
| durationMinutes | number | 30 | Duration in minutes (5-480) |
| isActive | boolean | true | Whether service is available |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "service": {
      "id": "srv123abc",
      "businessId": "biz456def",
      "name": "Haircut",
      "description": "Standard men's haircut with styling",
      "price": "200.00",
      "durationMinutes": 30,
      "isActive": true,
      "createdAt": "2026-01-02T16:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `404` - Business not found
- `409` - Service name already exists in this business
- `422` - You can only add services to your own business

---

### 2. List Services

Returns all services for a business.

**Endpoint:** `GET /api/v1/businesses/:businessId/services`  
**Auth:** Required (Bearer Token)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| includeInactive | boolean | false | Include soft-deleted services |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "srv123abc",
        "businessId": "biz456def",
        "name": "Haircut",
        "description": "Standard men's haircut",
        "price": "200.00",
        "durationMinutes": 30,
        "isActive": true,
        "createdAt": "2026-01-02T16:00:00.000Z",
        "updatedAt": "2026-01-02T16:00:00.000Z"
      },
      {
        "id": "srv789ghi",
        "businessId": "biz456def",
        "name": "Beard Trim",
        "description": "Beard shaping and trim",
        "price": "100.00",
        "durationMinutes": 15,
        "isActive": true,
        "createdAt": "2026-01-02T16:00:00.000Z",
        "updatedAt": "2026-01-02T16:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get Single Service

Returns a single service by ID.

**Endpoint:** `GET /api/v1/services/:id`  
**Auth:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "service": {
      "id": "srv123abc",
      "businessId": "biz456def",
      "name": "Haircut",
      "description": "Standard men's haircut",
      "price": "200.00",
      "durationMinutes": 30,
      "isActive": true,
      "createdAt": "2026-01-02T16:00:00.000Z",
      "updatedAt": "2026-01-02T16:00:00.000Z"
    }
  }
}
```

---

### 4. Update Service

Updates service details.

**Endpoint:** `PATCH /api/v1/services/:id`  
**Auth:** Required (Bearer Token)

**Request Body (all fields optional):**
```json
{
  "name": "Premium Haircut",
  "price": 300.00,
  "durationMinutes": 45
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "service": {
      "id": "srv123abc",
      "name": "Premium Haircut",
      "price": "300.00",
      "durationMinutes": 45,
      ...
    }
  }
}
```

---

### 5. Delete Service (Soft Delete)

Soft deletes a service by setting `isActive = false`.

**Endpoint:** `DELETE /api/v1/services/:id`  
**Auth:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Service deleted successfully"
  }
}
```

**Error Responses:**
- `422` - Cannot delete service with active bookings

---

## Testing Guide

### Prerequisites

1. Start the API server:
```bash
pnpm dev:api
```

2. **IMPORTANT:** You need a business first! Create one using the Business API.

3. Use this Bearer Token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw
```

---

### Step 0: Create a Business First (if not done)

```bash
curl -X POST 'http://localhost:3001/api/v1/businesses' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"name":"Classic Cuts","phoneNumber":"+919801441675"}'
```

**Save the `businessId` from the response!**

---

### Test 1: Create Service

**curl:**
```bash
curl -X POST 'http://localhost:3001/api/v1/businesses/<BUSINESS_ID>/services' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"name":"Haircut","description":"Standard men'\''s haircut","price":200,"durationMinutes":30}'
```

**Postman/Insomnia:**
- Method: `POST`
- URL: `http://localhost:3001/api/v1/businesses/<BUSINESS_ID>/services`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Body (JSON):
```json
{
  "name": "Haircut",
  "description": "Standard men's haircut",
  "price": 200,
  "durationMinutes": 30
}
```

> **Note:** Replace `<BUSINESS_ID>` with your actual business ID.

---

### Test 2: Create More Services

**Beard Trim:**
```bash
curl -X POST 'http://localhost:3001/api/v1/businesses/<BUSINESS_ID>/services' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"name":"Beard Trim","description":"Beard shaping and trim","price":100,"durationMinutes":15}'
```

**Hair Coloring:**
```bash
curl -X POST 'http://localhost:3001/api/v1/businesses/<BUSINESS_ID>/services' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"name":"Hair Coloring","description":"Full hair color treatment","price":500,"durationMinutes":60}'
```

---

### Test 3: List Services

**curl:**
```bash
curl 'http://localhost:3001/api/v1/businesses/<BUSINESS_ID>/services' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw'
```

**Include inactive services:**
```bash
curl 'http://localhost:3001/api/v1/businesses/<BUSINESS_ID>/services?includeInactive=true' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

---

### Test 4: Update Service

**curl:**
```bash
curl -X PATCH 'http://localhost:3001/api/v1/services/<SERVICE_ID>' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw' \
  -d '{"price":250,"durationMinutes":35}'
```

> **Note:** Replace `<SERVICE_ID>` with actual service ID from Test 1.

---

### Test 5: Delete Service

**curl:**
```bash
curl -X DELETE 'http://localhost:3001/api/v1/services/<SERVICE_ID>' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw'
```

---

## Validation Rules

### Service Name
- Required
- 1-100 characters
- Must be unique per business

### Price
- Required
- Must be positive number
- Max 2 decimal places (e.g., 200.00)

### Duration
- Optional (default: 30)
- Integer between 5-480 minutes (8 hours max)

### Description
- Optional
- Max 500 characters

---

## Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Missing authentication token | 401 | No Bearer token | Add Authorization header |
| Business not found | 404 | Invalid business ID | Check business ID |
| Service not found | 404 | Invalid service ID | Check service ID |
| Service already exists | 409 | Duplicate name | Use different name |
| Cannot delete with active bookings | 422 | Service has pending/confirmed bookings | Complete bookings first |
| You can only add/update services to your own business | 422 | Not the owner | Use correct account |

---

## Summary

The Service Catalog module provides:

1. **Service Service** - CRUD operations with ownership validation
2. **Service Controller** - HTTP handlers with Zod validation
3. **Service Routes** - All protected endpoints

**Key Features:**
- Unique service names per business
- Soft delete preserves booking history
- Deletion protection for active bookings
- Price and duration validation
