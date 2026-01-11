# Authentication System Guide: OTP + JWT for Supabase

A beginner-friendly guide explaining how we built phone-based OTP authentication with JWT tokens compatible with Supabase RLS.

---

## Quick Start

### Development Mode (NODE_ENV=development)
```bash
# 1. Request OTP - uses magic code "123456"
curl -X POST http://localhost:3001/api/v1/auth/otp/request \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919876543210"}'

# 2. Verify with magic code
curl -X POST http://localhost:3001/api/v1/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919876543210","otp":"123456"}'
```

### Production Mode (NODE_ENV=production)
```bash
# 1. Request OTP - sends real SMS via Twilio
curl -X POST http://localhost:3001/api/v1/auth/otp/request \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919801441675"}'

# 2. Verify with code received via SMS
curl -X POST http://localhost:3001/api/v1/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919801441675","otp":"805075"}'
```

---

## How It Works: Two Different Flows

### Development Mode Flow (NODE_ENV=development)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   Express   │     │  Database   │
│  (curl/app) │     │    API      │     │  (Supabase) │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ 1. Request OTP    │                   │
      │──────────────────>│                   │
      │                   │ 2. Store "123456" │
      │                   │──────────────────>│
      │                   │                   │
      │   "OTP sent"      │ (logs to console) │
      │<──────────────────│                   │
      │                   │                   │
      │ 3. Verify "123456"│                   │
      │──────────────────>│                   │
      │                   │ 4. Check DB       │
      │                   │──────────────────>│
      │                   │ 5. Find/Create    │
      │                   │    User           │
      │                   │──────────────────>│
      │                   │ 6. Mint JWT       │
      │<──────────────────│                   │
      │   {token, user}   │                   │
```

**Key Points:**
- OTP is always "123456" (configurable via `DEV_MAGIC_OTP`)
- OTP is stored in our database
- Verification checks against our database
- No SMS is sent - OTP is logged to console
- Fast iteration for development

### Production Mode Flow (NODE_ENV=production)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   Express   │     │   Twilio    │     │  Database   │
│  (curl/app) │     │    API      │     │ Verify API  │     │  (Supabase) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      │ 1. Request OTP    │                   │                   │
      │──────────────────>│                   │                   │
      │                   │ 2. Send OTP       │                   │
      │                   │──────────────────>│                   │
      │                   │                   │ (Twilio sends SMS)│
      │   "OTP sent"      │                   │                   │
      │<──────────────────│                   │                   │
      │                   │                   │                   │
      │ 3. Verify OTP     │                   │                   │
      │──────────────────>│                   │                   │
      │                   │ 4. Verify with    │                   │
      │                   │    Twilio         │                   │
      │                   │──────────────────>│                   │
      │                   │   {valid: true}   │                   │
      │                   │<──────────────────│                   │
      │                   │ 5. Find/Create    │                   │
      │                   │    User           │                   │
      │                   │──────────────────────────────────────>│
      │                   │ 6. Mint JWT       │                   │
      │<──────────────────│                   │                   │
      │   {token, user}   │                   │                   │
```

**Key Points:**
- Twilio Verify API generates and manages the OTP
- We do NOT store the OTP in our database
- Verification is done via Twilio's API (not our DB)
- Real SMS is sent to user's phone
- Twilio handles rate limiting, expiry, and security

---

## Overview

Our auth system works like this:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │     │   Express   │     │  Database   │     │   Twilio    │
│    App      │     │    API      │     │  (Supabase) │     │  (SMS OTP)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      │ 1. Request OTP    │                   │                   │
      │──────────────────>│                   │                   │
      │                   │ 2. Store OTP      │                   │
      │                   │──────────────────>│                   │
      │                   │ 3. Send SMS       │                   │
      │                   │──────────────────────────────────────>│
      │                   │                   │                   │
      │ 4. Enter OTP      │                   │                   │
      │──────────────────>│                   │                   │
      │                   │ 5. Verify OTP     │                   │
      │                   │──────────────────>│                   │
      │                   │ 6. Create User    │                   │
      │                   │──────────────────>│                   │
      │                   │ 7. Mint JWT       │                   │
      │<──────────────────│                   │                   │
      │   Return Token    │                   │                   │
```

---

## File Structure

```
apps/api/src/
├── services/
│   ├── auth.service.ts      # Orchestrates the auth flow
│   ├── otp.service.ts       # OTP generation, storage, verification
│   ├── token.service.ts     # JWT minting and verification
│   ├── twilio.service.ts    # Twilio SMS integration
│   ├── user.service.ts      # User CRUD operations
│   └── index.ts             # Barrel export
├── controllers/
│   ├── auth.controller.ts   # HTTP handlers for auth endpoints
│   └── index.ts
├── routes/
│   ├── auth.routes.ts       # Route definitions
│   └── index.ts
├── middlewares/
│   └── auth.middleware.ts   # JWT validation middleware
└── config/
    └── index.ts             # Environment configuration
```

---

## Step 1: Database Schema

We store OTPs in the database with expiry and attempt tracking.

`packages/shared-types/prisma/schema.prisma`:

```prisma
model Otp {
  id        String   @id @default(cuid())
  phone     String   // E.164 format (+919876543210)
  code      String   // The 6-digit code
  attempts  Int      @default(0)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([phone])
}

model User {
  id        String   @id @default(cuid())
  phone     String   @unique
  role      UserRole @default(OWNER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  businesses Business[]
}
```

### Why store OTP in database?
- Track verification attempts (prevent brute force)
- Set expiry time (5 minutes)
- Works across multiple server instances
- Audit trail for debugging

---

## Step 2: OTP Service

`apps/api/src/services/otp.service.ts`

### Key Features:
- **Dev Mode**: Uses magic code "123456", stored in database, logs to console
- **Prod Mode**: Uses Twilio Verify API (Twilio manages the OTP, not us)
- **Expiry**: 5 minutes (dev mode only - Twilio handles this in prod)
- **Max Attempts**: 3 tries before OTP is invalidated (dev mode only)

### Mode Detection:

```typescript
// Determines which flow to use
private shouldUseDevMode(phone: string): boolean {
  return isDevelopment() || isPhoneWhitelisted(phone);
}
```

- `NODE_ENV=development` → Dev mode (database OTP)
- `NODE_ENV=production` → Production mode (Twilio Verify)
- Phone in `DEV_PHONE_WHITELIST` → Dev mode (even in production)

### Request OTP Flow:

**Development Mode:**
```typescript
async requestOtp(phone: string) {
  if (useDevMode) {
    // Store magic OTP in database
    await prisma.otp.deleteMany({ where: { phone } });
    await prisma.otp.create({
      data: {
        phone,
        code: "123456",  // Magic code
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    console.log(`🔐 DEV OTP for ${phone}: 123456`);
    return { success: true, message: 'OTP sent successfully (dev mode)' };
  }
}
```

**Production Mode:**
```typescript
async requestOtp(phone: string) {
  if (!useDevMode) {
    // Twilio generates and sends OTP - we don't store it
    await twilioService.sendOtp(phone);
    return { success: true, message: 'OTP sent successfully' };
  }
}
```

### Verify OTP Flow:

**Development Mode (verifies against database):**
```typescript
async verifyOtpFromDatabase(phone: string, code: string) {
  const otpRecord = await prisma.otp.findFirst({ where: { phone } });
  
  if (!otpRecord) return { valid: false, message: 'No OTP found' };
  if (new Date() > otpRecord.expiresAt) return { valid: false, message: 'OTP expired' };
  if (otpRecord.attempts >= 3) return { valid: false, message: 'Too many attempts' };
  if (otpRecord.code !== code) {
    await prisma.otp.update({ where: { id: otpRecord.id }, data: { attempts: otpRecord.attempts + 1 } });
    return { valid: false, message: 'Invalid OTP' };
  }
  
  await prisma.otp.delete({ where: { id: otpRecord.id } });
  return { valid: true };
}
```

**Production Mode (verifies via Twilio API):**
```typescript
async verifyOtpViaTwilio(phone: string, code: string) {
  const result = await twilioService.verifyOtp(phone, code);
  
  if (result.valid) {
    return { valid: true, message: 'OTP verified successfully' };
  }
  return { valid: false, message: 'Invalid OTP. Please try again.' };
}
```

---

## Step 3: Token Service (JWT)

`apps/api/src/services/token.service.ts`

### Why Custom JWT?
Supabase uses Row Level Security (RLS) policies that check JWT claims. Our JWT must match what Supabase expects.

### JWT Payload Structure:

```typescript
interface TokenPayload {
  sub: string;    // User ID (required by Supabase)
  aud: string;    // Audience: "authenticated"
  role: string;   // Role for RLS policies
  phone: string;  // User's phone number
  iat: number;    // Issued at timestamp
  exp: number;    // Expiry timestamp
}
```

### Minting a Token:

```typescript
import jwt from 'jsonwebtoken';

function mintToken(userId: string, phone: string): string {
  const payload = {
    sub: userId,           // User ID
    aud: 'authenticated',  // Required by Supabase
    role: 'authenticated', // For RLS policies
    phone: phone,
  };

  return jwt.sign(payload, process.env.SUPABASE_JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}
```

### Where to get SUPABASE_JWT_SECRET:
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "JWT Secret"

---

## Step 4: Auth Middleware

`apps/api/src/middlewares/auth.middleware.ts`

Protects routes by validating JWT tokens.

```typescript
import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
  // 1. Extract token from header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  
  const token = authHeader.slice(7); // Remove "Bearer "

  // 2. Verify token
  try {
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    
    // 3. Attach user info to request
    req.auth = {
      userId: decoded.sub,
      phone: decoded.phone,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Using in Routes:

```typescript
// Public route - no auth needed
router.post('/otp/request', authController.requestOtp);

// Protected route - requires valid JWT
router.get('/me', authMiddleware, authController.getCurrentUser);
```

---

## Step 5: Auth Controller

`apps/api/src/controllers/auth.controller.ts`

Handles HTTP requests and responses.

```typescript
class AuthController {
  async requestOtp(req, res) {
    // Validate input
    const { phone } = otpRequestSchema.parse(req.body);
    
    // Call service
    const result = await authService.requestOtp(phone);
    
    res.json({ success: true, message: result.message });
  }

  async verifyOtp(req, res) {
    const { phone, otp } = otpVerifySchema.parse(req.body);
    
    const result = await authService.verifyOtp(phone, otp);
    
    if (!result.success) {
      return res.status(401).json({ error: result.message });
    }
    
    res.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  }
}
```

---

## Step 6: Auth Routes

`apps/api/src/routes/auth.routes.ts`

```typescript
import { Router } from 'express';
import { authController } from '../controllers';
import { authMiddleware } from '../middlewares';

const router = Router();

// Public routes
router.post('/otp/request', authController.requestOtp);
router.post('/otp/verify', authController.verifyOtp);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/refresh', authMiddleware, authController.refreshToken);

export default router;
```

---

## API Endpoints

### 1. Request OTP

```bash
POST /api/v1/auth/otp/request
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully"
  }
}
```

### 2. Verify OTP

```bash
POST /api/v1/auth/otp/verify
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx123abc",
      "phone": "+919876543210",
      "role": "OWNER"
    }
  }
}
```

### 3. Get Current User (Protected)

```bash
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123abc",
      "phone": "+919876543210",
      "role": "OWNER"
    }
  }
}
```

---

## Environment Variables

### Development (minimum required):

```bash
NODE_ENV=development
SUPABASE_JWT_SECRET="your-supabase-jwt-secret"

# Optional - for dev bypass
DEV_PHONE_WHITELIST="+919876543210"
DEV_MAGIC_OTP="123456"
```

### Production (full setup):

```bash
NODE_ENV=production

# JWT signing
SUPABASE_JWT_SECRET="your-supabase-jwt-secret"

# Twilio for real SMS
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_VERIFY_SERVICE_SID="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## Testing the Auth Flow

### Development Mode Testing

**1. Set environment to development:**
```bash
# In apps/api/.env
NODE_ENV=development
```

**2. Start the API:**
```bash
pnpm dev:api
```

**3. Request OTP:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/otp/request \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919876543210"}'
```

**Response:**
```json
{"success":true,"data":{"message":"OTP sent successfully (dev mode)"}}
```

**Console Output:**
```
🔐 DEV OTP for +919876543210: 123456
```

**4. Verify OTP (use magic code "123456"):**
```bash
curl -X POST http://localhost:3001/api/v1/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919876543210","otp":"123456"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cmjx17uje0001wzwljm3jaofa",
      "phone": "+919876543210",
      "role": "OWNER"
    }
  }
}
```

---

### Production Mode Testing (Real SMS)

**1. Set environment to production:**
```bash
# In apps/api/.env
NODE_ENV=production
```

**2. Ensure Twilio credentials are set:**
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**3. Start the API:**
```bash
pnpm dev:api
```

**4. Request OTP (real SMS will be sent):**
```bash
curl -X POST http://localhost:3001/api/v1/auth/otp/request \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919801441675"}'
```

**Response:**
```json
{"success":true,"data":{"message":"OTP sent successfully"}}
```

**You will receive an SMS with a 6-digit code!**

**5. Verify OTP (use code from SMS):**
```bash
curl -X POST http://localhost:3001/api/v1/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919801441675","otp":"805075"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw",
    "user": {
      "id": "cmjx17uje0001wzwljm3jaofa",
      "phone": "+919801441675",
      "role": "OWNER"
    }
  }
}
```

---

### Using the JWT Token

**6. Access protected endpoint:**
```bash
curl http://localhost:3001/api/v1/auth/me \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWp4MTd1amUwMDAxd3p3bGptM2phb2ZhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwicGhvbmUiOiIrOTE5ODAxNDQxNjc1IiwiaWF0IjoxNzY3MzY5NTIxLCJleHAiOjE3Njc5NzQzMjF9.b3atRsaTEs7NJHYnpT_7llhZkCYa9QDQktdsxYf9Zpw'

```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmjx17uje0001wzwljm3jaofa",
      "phone": "+919801441675",
      "role": "OWNER"
    }
  }
}
```

---

### Curl Tips (Avoid JSON Parsing Errors)

When using curl, be careful with quotes. These formats work:

**Option 1: Single quotes outside, no spaces around colons:**
```bash
curl -X POST 'http://localhost:3001/api/v1/auth/otp/verify' \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919801441675","otp":"123456"}'
```

**Option 2: Escape double quotes:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"+919801441675\",\"otp\":\"123456\"}"
```

**Common Error:**
```
"Unexpected token '"', ...\" is not valid JSON"
```
This means your shell is mangling the quotes. Use one of the formats above.

---

## Security Considerations

1. **Rate Limiting**: Add rate limiting to prevent OTP spam
2. **Phone Validation**: Only accept E.164 format (+91...)
3. **OTP Expiry**: 5 minutes is standard
4. **Max Attempts**: 3 attempts before invalidation
5. **Token Expiry**: 7 days (adjust based on security needs)
6. **HTTPS Only**: Never send tokens over HTTP in production

---

## Common Issues

### "Invalid token" error
- Check SUPABASE_JWT_SECRET matches between minting and verification
- Token might be expired
- Token might be malformed

### "No OTP found" error
- OTP expired (5 min limit)
- OTP already used (deleted after successful verification)
- Wrong phone number format

### Prisma "otp" not found
- Run `pnpm db:generate` to regenerate Prisma client
- Restart TypeScript server in VS Code

---

## Summary

### Development vs Production Comparison

| Aspect | Development Mode | Production Mode |
|--------|------------------|-----------------|
| `NODE_ENV` | `development` | `production` |
| OTP Generation | Magic code "123456" | Twilio generates random code |
| OTP Storage | Our database | Twilio's system |
| OTP Delivery | Console log | Real SMS via Twilio |
| OTP Verification | Check our database | Call Twilio Verify API |
| Rate Limiting | Our code (3 attempts) | Twilio handles it |
| Expiry | Our code (5 min) | Twilio handles it |

### Service Responsibilities

1. **OTP Service** - Routes to dev/prod flow, manages database OTPs in dev mode
2. **Twilio Service** - Sends and verifies OTPs via Twilio Verify API
3. **Token Service** - Mints JWTs compatible with Supabase RLS
4. **Auth Middleware** - Protects routes by validating JWTs
5. **Auth Controller** - Handles HTTP requests/responses
6. **Auth Routes** - Defines API endpoints

### The Key Insight

In **development mode**, we control everything - OTP generation, storage, and verification happen in our system.

In **production mode**, Twilio Verify API handles OTP generation, delivery, and verification. We just call their API and trust their response. This is more secure because:
- Twilio handles rate limiting
- Twilio handles expiry
- Twilio handles delivery reliability
- We don't store sensitive OTP codes

The JWT we mint is signed with Supabase's secret, so it works seamlessly with Supabase's Row Level Security policies!
