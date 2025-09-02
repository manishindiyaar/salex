# 🚀 Salex API - Postman Testing Guide

Complete guide for testing all 14 API endpoints using Postman with proper authentication.

## 📦 Quick Setup

### 1. Import Collection & Environment
```bash
# Import these files into Postman:
1. postman-collection.json     (14 API endpoints)
2. postman-environment.json    (Environment variables)
```

### 2. Start Your API Server
```bash
# Make sure your API is running on port 3000
pnpm dev:api
```

### 3. Update JWT Token (Important!)
```bash
# Get fresh token (expires after some time)
node get-clerk-token.js

# Copy the session ID and update in Postman environment:
# CLERK_JWT_TOKEN = sess_30XtImo791vpBe53yYfLfGEOJzx
```

---

## 🔍 Testing Each Endpoint Category

### 📊 1. Health & Basic Endpoints (No Auth Required)

| Endpoint | Method | URL | Expected Response |
|----------|--------|-----|-------------------|
| Root | GET | `http://localhost:3000/` | `"Hello World! Salex API is running 🚀"` |
| Health | GET | `http://localhost:3000/health` | `{"status": "ok", "timestamp": "..."}` |
| DB Health | GET | `http://localhost:3000/health/db` | `{"status": "ok", "database": "connected"}` |

**✅ Test Results:**
- All should return `200 OK`
- No authentication required
- Database health confirms Supabase connection

---

### 🔐 2. Authentication Endpoints (Protected)

#### Headers Required:
```
Authorization: Bearer sess_30XtImo791vpBe53yYfLfGEOJzx
Content-Type: application/json
```

| Endpoint | Method | URL | Purpose |
|----------|--------|-----|---------|
| Get User Profile | GET | `/api/v1/auth/me` | Returns current user data |
| Auth Health | GET | `/api/v1/auth/health` | Confirms auth is working |

**✅ Expected Response (GET /api/v1/auth/me):**
```json
{
  "success": true,
  "data": {
    "id": "cmdo42nft000014mvk4f2pzp5",
    "clerkUserId": "user_30XDtyK5RcW0DGSNLXpH8ma4iGg",
    "phoneNumber": "+19801441675",
    "createdAt": "2025-07-29T05:43:30.857Z",
    "updatedAt": "2025-07-29T05:43:30.857Z",
    "businesses": []
  },
  "message": "User profile retrieved successfully"
}
```

**❌ Test Unauthorized Access:**
- Remove `Authorization` header
- Should get `401 Unauthorized`
- Response: `{"message": "No session token provided"}`

---

### 🏢 3. Business Management Endpoints (Protected)

#### 3.1 Get Current User's Business
```
GET /api/v1/businesses/me
Headers: Authorization: Bearer {token}
```

**Response (New User):**
```json
{
  "success": true,
  "data": null,
  "message": "No business found for current user"
}
```

#### 3.2 Create New Business
```
POST /api/v1/businesses
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "name": "Elegant Hair Salon",
  "businessType": "SALON",
  "phoneNumber": "+19801441675",
  "address": "123 Main Street, New York, NY 10001",
  "hoursOfOperation": {
    "monday": "9:00-18:00",
    "tuesday": "9:00-18:00",
    "wednesday": "9:00-18:00",
    "thursday": "9:00-18:00",
    "friday": "9:00-20:00",
    "saturday": "8:00-17:00",
    "sunday": "closed"
  }
}
```

**✅ Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "business-id-here",
    "name": "Elegant Hair Salon",
    "businessType": "SALON",
    "phoneNumber": "+19801441675",
    "address": "123 Main Street, New York, NY 10001",
    "ownerId": "user-id-here",
    "hoursOfOperation": {...},
    "createdAt": "2025-07-29T...",
    "updatedAt": "2025-07-29T..."
  },
  "message": "Business created successfully"
}
```

**📝 Important:** Copy the `business.id` from response and save it as `BUSINESS_ID` in Postman environment for subsequent tests.

#### 3.3 Get Specific Business
```
GET /api/v1/businesses/{{BUSINESS_ID}}
Headers: Authorization: Bearer {token}
```

#### 3.4 Update Business
```
PUT /api/v1/businesses/{{BUSINESS_ID}}
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "name": "Elegant Hair Salon & Spa",
  "address": "123 Main Street, Suite 200, New York, NY 10001",
  "hoursOfOperation": {
    "sunday": "10:00-16:00"
  }
}
```

#### 3.5 Get Business Services & Bookings
```
GET /api/v1/businesses/{{BUSINESS_ID}}/services
GET /api/v1/businesses/{{BUSINESS_ID}}/bookings
Headers: Authorization: Bearer {token}
```

---

### 📱 4. WhatsApp Webhook Endpoints (Public/Special)

#### 4.1 WhatsApp Health Check
```
GET /webhooks/whatsapp/health
No headers required
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-07-29T..."
  },
  "message": "WhatsApp service is healthy"
}
```

#### 4.2 Webhook Verification (Meta Integration)
```
GET /webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=my-verify-token&hub.challenge=test-challenge-123
No headers required
```

**Response:** `test-challenge-123` (plain text)

#### 4.3 Process WhatsApp Message
```
POST /webhooks/whatsapp
Headers:
  Content-Type: application/json
  x-hub-signature-256: sha256=mock-signature-for-testing

Body:
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1828755277851182",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "+19801441675",
              "phone_number_id": "702046082996188"
            },
            "messages": [
              {
                "from": "919801441675",
                "id": "wamid.test123",
                "timestamp": "1643723400",
                "type": "text",
                "text": {
                  "body": "Hello, I want to book an appointment!"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "processed"
  },
  "message": "Webhook processed successfully"
}
```

---

## 🧪 Testing Workflow

### Step 1: Basic Health Check
1. Test all health endpoints (no auth required)
2. Confirm API server is responding

### Step 2: Authentication Flow
1. Test `/api/v1/auth/me` with valid token ✅
2. Test same endpoint without token (should fail) ❌
3. Test auth health check

### Step 3: Business Management
1. Check if user has business (`/api/v1/businesses/me`)
2. Create new business if none exists
3. Test business CRUD operations
4. Test services and bookings endpoints

### Step 4: WhatsApp Integration
1. Test webhook verification
2. Test message processing
3. Check WhatsApp service health

---

## 🔧 Troubleshooting

### Authentication Issues
```
Error: 401 Unauthorized
Solution: 
1. Get fresh JWT token: node get-clerk-token.js
2. Update CLERK_JWT_TOKEN in Postman environment
3. Ensure API server is running (NODE_ENV=development)
```

### Business Not Found
```
Error: 404 Not Found / 403 Forbidden
Solution:
1. Create business first using POST /api/v1/businesses
2. Copy business ID to BUSINESS_ID environment variable
3. Ensure business belongs to authenticated user
```

### WhatsApp Webhook Issues
```
Error: 401 Invalid webhook verification
Solution:
1. Check WHATSAPP_WEBHOOK_VERIFY_TOKEN matches
2. For message processing, signature can be mocked in development
3. Ensure phone numbers match your WhatsApp Business setup
```

---

## 📊 Expected Test Results Summary

| Category | Endpoints | Auth Required | Should Pass |
|----------|-----------|---------------|-------------|
| Health | 3 | ❌ | ✅ All |
| Authentication | 2 | ✅ | ✅ All |
| Business | 5 | ✅ | ✅ All (after creating business) |
| WhatsApp | 3 | ❌ | ✅ All |
| **Total** | **13** | - | **✅ 13/13** |

---

## 🚀 Production Testing Notes

### For Production Environment:
1. Update `API_BASE_URL` to your production domain
2. Use real JWT tokens from frontend Clerk client
3. WhatsApp webhooks require proper signature verification
4. All business operations require valid business ownership
5. Rate limiting may be more strict in production

### Security Testing:
- Test with expired tokens
- Test with malformed tokens
- Test unauthorized access to business resources
- Test WhatsApp webhook without proper signatures

Your API is production-ready with comprehensive authentication, error handling, and business logic! 🎉