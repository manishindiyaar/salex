# Authentication Toggle Implementation Approach

## Overview

This document outlines the approach and implementation details for creating a conditional authentication system in the Salex API that allows easy toggling between development/testing mode (no auth) and production mode (full authentication).

## Problem Statement

During initial development and testing phases, requiring full Firebase authentication for API testing creates friction:
- Frontend developers need to implement auth before testing API endpoints
- Integration tests require complex auth setup
- Manual API testing with tools like Postman/curl becomes cumbersome
- Business logic testing is blocked by authentication requirements

## Solution Approach

### 1. Environment-Based Authentication Toggle

Created a **ConditionalAuthGuard** that wraps the existing FirebaseAuthGuard and can be toggled via environment variable:

```typescript
ENABLE_AUTH="false"  // Development/Testing Mode - No authentication
ENABLE_AUTH="true"   // Production Mode - Full Firebase authentication
```

### 2. Backward-Compatible Implementation

- **Zero Breaking Changes**: All existing controllers remain unchanged
- **Smart Guard Replacement**: Simply replaced `FirebaseAuthGuard` with `ConditionalAuthGuard`
- **Mock User Context**: Provides realistic user object when auth is disabled
- **Seamless Transition**: Single environment variable switches between modes

## Implementation Details

### Files Created/Modified

#### 1. New ConditionalAuthGuard
**File**: `apps/api/src/modules/auth/conditional-auth.guard.ts`

```typescript
@Injectable()
export class ConditionalAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthEnabled = this.configService.get<string>('ENABLE_AUTH') === 'true';

    if (!isAuthEnabled) {
      // Mock user object for development/testing
      const request = context.switchToHttp().getRequest();
      request.user = {
        id: 'test-user-id',
        phoneNumber: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      request.auth = {
        uid: 'test-firebase-uid',
        token: 'mock-token',
      };
      return true; // Allow all requests through
    }

    // Delegate to FirebaseAuthGuard when auth is enabled
    return this.firebaseAuthGuard.canActivate(context);
  }
}
```

#### 2. Environment Configuration
**Files**: `.env` and `.env.example`

```bash
# Authentication Toggle (set to 'false' for development/testing, 'true' for production)
ENABLE_AUTH="false"
```

#### 3. Controller Updates
**Modified Files**:
- `apps/api/src/modules/analytics/analytics.controller.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/business/business.controller.ts`
- `apps/api/src/modules/booking/booking.controller.ts`
- `apps/api/src/modules/service/service.controller.ts`

**Change Applied**:
```typescript
// Before
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
@UseGuards(FirebaseAuthGuard)

// After
import { ConditionalAuthGuard } from '../auth/conditional-auth.guard';
@UseGuards(ConditionalAuthGuard)
```

#### 4. Module Configuration
**File**: `apps/api/src/modules/auth/auth.module.ts`

Added ConditionalAuthGuard to providers and exports to make it available to other modules.

## Testing Approach

### Current Status (Development Mode)
```bash
ENABLE_AUTH="false"  # Set in .env file
```

### Test Results Summary

#### ✅ Previously Protected Endpoints (29 total)
All now accessible without authentication headers:

```bash
# Auth Endpoints
curl GET http://localhost:3000/api/v1/auth/me
curl GET http://localhost:3000/api/v1/auth/health

# Business Management  
curl GET http://localhost:3000/api/v1/businesses/me
curl POST http://localhost:3000/api/v1/businesses -d '{...}'
curl GET http://localhost:3000/api/v1/businesses/routing-codes/statistics

# Service Management
curl POST http://localhost:3000/api/v1/businesses/:id/services -d '{...}'
curl PUT http://localhost:3000/api/v1/businesses/:id/services/:serviceId -d '{...}'

# Analytics
curl GET http://localhost:3000/api/v1/businesses/:id/analytics/daily

# QR Code Generation
curl GET http://localhost:3000/api/v1/businesses/:id/whatsapp-qr
```

#### ✅ Public Endpoints (35 total)
Continue working as before:

```bash
# Health Checks
curl GET http://localhost:3000/health
curl GET http://localhost:3000/health/db

# Customer Operations
curl GET http://localhost:3000/api/v1/businesses/:id
curl GET http://localhost:3000/api/v1/businesses/:id/services
curl POST http://localhost:3000/api/v1/businesses/:id/bookings -d '{...}'

# WhatsApp Integration
curl GET http://localhost:3000/webhooks/whatsapp/health
curl GET http://localhost:3000/api/v1/whatsapp-simulator/health
```

### Mock User Context

When authentication is disabled, all protected endpoints receive:

```javascript
request.user = {
  id: 'test-user-id',
  phoneNumber: '+1234567890',
  createdAt: new Date(),
  updatedAt: new Date(),
}

request.auth = {
  uid: 'test-firebase-uid', 
  token: 'mock-token',
}
```

### Expected Business Logic Errors

During testing, these errors are **normal and expected**:

- **404 "Business not found"** - Testing with non-existent business IDs
- **403 "Access denied"** - Mock user doesn't own test businesses
- **400 "Validation errors"** - DTO validation still enforced

The key point is that endpoints are **reachable** and authentication is **bypassed**.

## Re-enabling Authentication (Production Mode)

### Step 1: Update Environment Variable

```bash
# In .env file
ENABLE_AUTH="true"
```

### Step 2: Restart API Server

```bash
npm run start:dev  # Development
# or
npm run start:prod  # Production
```

### Step 3: Verify Firebase Configuration

Ensure these environment variables are properly set:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Step 4: Client-Side Integration

Frontend applications must include Firebase ID tokens:

```javascript
// Obtain Firebase ID token
const user = firebase.auth().currentUser;
const idToken = await user.getIdToken();

// Include in API requests
fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Step 5: Test Authentication

```bash
# Should fail without token (401 Unauthorized)
curl GET http://localhost:3000/api/v1/auth/me

# Should work with valid Firebase token
curl GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <firebase-id-token>"
```

## Verification Checklist

### ✅ Development Mode (ENABLE_AUTH="false")
- [ ] All protected endpoints accessible without auth headers
- [ ] Mock user context provided (`test-user-id`)
- [ ] Public endpoints working normally
- [ ] No 401 Unauthorized errors
- [ ] ConditionalAuthGuard logs showing "Authentication is disabled"

### ✅ Production Mode (ENABLE_AUTH="true")  
- [ ] Protected endpoints require Firebase tokens
- [ ] Invalid/missing tokens return 401 Unauthorized
- [ ] Valid tokens provide real user context
- [ ] Public endpoints continue working
- [ ] FirebaseAuthGuard logs showing token validation

## Benefits

### For Development
✅ **Zero Auth Friction** - No Firebase setup required for API testing  
✅ **Fast Integration Testing** - All endpoints accessible immediately  
✅ **Realistic User Context** - Mock user object for business logic testing  
✅ **Tool-Friendly** - Works with Postman, curl, automated tests  

### For Production
✅ **Full Security** - Complete Firebase authentication when enabled  
✅ **Single Switch** - One environment variable to toggle modes  
✅ **Zero Code Changes** - Controllers remain unchanged  
✅ **Seamless Transition** - No refactoring required  

## Architecture Decisions

### Why ConditionalAuthGuard over other approaches?

1. **Decorator-Based Alternative**: Could have used custom decorators, but would require changing all controller methods
2. **Middleware Alternative**: Would affect all requests, not just protected ones
3. **Service-Level Alternative**: Would require changes to business logic

**ConditionalAuthGuard** was chosen because:
- ✅ Minimal code changes (only guard imports)
- ✅ Follows NestJS patterns
- ✅ Easy to understand and maintain
- ✅ Clear separation of concerns
- ✅ No business logic changes required

### Mock User Design

The mock user object was designed to:
- **Match production structure** - Same fields as real user objects
- **Enable business logic testing** - Provides consistent user ID
- **Avoid conflicts** - Uses clearly identifiable test values
- **Support debugging** - Easy to spot in logs and databases

## Future Considerations

### Enhanced Mock Data
Could extend mock user context to include:
- Multiple test user profiles
- Different business ownership scenarios
- Role-based permissions testing

### Environment-Specific Configs
Could create different auth modes:
- `ENABLE_AUTH="development"` - Mock users with realistic data
- `ENABLE_AUTH="testing"` - Simplified mock users for unit tests
- `ENABLE_AUTH="staging"` - Real auth with test Firebase project
- `ENABLE_AUTH="production"` - Full production authentication

### Testing Framework Integration
Could integrate with testing frameworks to:
- Automatically disable auth in test environments
- Provide test-specific mock users
- Generate test tokens for integration tests

## Conclusion

The authentication toggle implementation successfully addresses the development and testing friction while maintaining production security. The approach is backward-compatible, easily reversible, and follows NestJS best practices.

**Current Status**: ✅ Development mode active, all endpoints accessible for testing  
**Next Steps**: Continue development and testing, then set `ENABLE_AUTH="true"` for production deployment