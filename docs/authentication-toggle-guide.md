# Authentication Toggle Guide

## Overview

The Salex API includes a conditional authentication system that allows you to easily toggle authentication on/off for development and testing purposes while maintaining the ability to quickly re-enable it for production.

## How It Works

### Environment Variable Control

Authentication is controlled by the `ENABLE_AUTH` environment variable:

- `ENABLE_AUTH="false"` - **Development/Testing Mode**: All endpoints are accessible without authentication
- `ENABLE_AUTH="true"` - **Production Mode**: Full Firebase authentication is enforced

### Implementation Details

1. **ConditionalAuthGuard** - A smart guard that wraps FirebaseAuthGuard
2. **Mock User Object** - When auth is disabled, provides a mock user for testing
3. **Zero Code Changes** - Controllers remain unchanged, only guard imports updated

## Current Status (Development Mode)

```bash
ENABLE_AUTH="false"  # Set in .env
```

**Mock User Details:**
- User ID: `test-user-id`
- Phone: `+1234567890` 
- Firebase UID: `test-firebase-uid`

## Usage

### For Development/Testing (Current)

1. Ensure `.env` has `ENABLE_AUTH="false"`
2. All API endpoints work without auth headers
3. Mock user context is automatically provided

```bash
# These work without authentication:
curl GET /api/v1/auth/me
curl GET /api/v1/businesses/me
curl POST /api/v1/businesses
# etc.
```

### To Re-enable Authentication (Production)

1. **Set Environment Variable:**
   ```bash
   ENABLE_AUTH="true"
   ```

2. **Restart the API server** - Authentication will be fully enforced

3. **Client Apps** - Must include Firebase Auth tokens in requests:
   ```javascript
   Authorization: Bearer <firebase-id-token>
   ```

## Protected Endpoints (When Auth Enabled)

When `ENABLE_AUTH="true"`, these endpoints require Firebase authentication:

### Analytics
- `GET /api/v1/businesses/:businessId/analytics/daily`

### Auth 
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/health`

### Business Management
- `POST /api/v1/businesses`
- `GET /api/v1/businesses/me` 
- `PUT /api/v1/businesses/:businessId`
- `GET /api/v1/businesses/:businessId/bookings`
- `PUT /api/v1/businesses/:businessId/hours`
- `PUT /api/v1/businesses/:businessId/routing-code`
- `GET /api/v1/businesses/routing-codes/statistics`
- `GET /api/v1/businesses/:businessId/whatsapp-qr`
- `GET /api/v1/businesses/:businessId/whatsapp-qr/variations`
- `GET /api/v1/businesses/:businessId/marketing-materials`

### Booking Management
- `PUT /api/v1/bookings/:bookingId`
- `PUT /api/v1/bookings/:bookingId/cancel`
- `DELETE /api/v1/bookings/:bookingId` 
- `PUT /api/v1/bookings/:bookingId/confirm`
- `PUT /api/v1/bookings/:bookingId/complete`

### Service Management
- `POST /api/v1/businesses/:businessId/services`
- `PUT /api/v1/businesses/:businessId/services/:serviceId`
- `DELETE /api/v1/businesses/:businessId/services/:serviceId`

## Public Endpoints (Always Accessible)

These endpoints work regardless of the `ENABLE_AUTH` setting:

### Health Checks
- `GET /health`
- `GET /health/db`

### Customer Operations
- `GET /api/v1/businesses/:businessId` - Business info
- `GET /api/v1/businesses/:businessId/services` - Services list
- `GET /api/v1/businesses/:businessId/timeslots` - Available slots
- `POST /api/v1/businesses/:businessId/bookings` - Customer bookings
- `GET /api/v1/customers/:phone/bookings` - Customer booking lookup

### WhatsApp Integration
- `GET /webhooks/whatsapp` - Webhook verification
- `POST /webhooks/whatsapp` - Message processing
- All WhatsApp simulator endpoints

## Technical Implementation

### Files Modified

1. **New Guard**: `apps/api/src/modules/auth/conditional-auth.guard.ts`
2. **Environment**: `.env` and `.env.example`
3. **Controllers**: All protected controllers now use `ConditionalAuthGuard`

### Guard Logic Flow

```typescript
if (ENABLE_AUTH !== "true") {
  // Mock user object for development
  request.user = { id: 'test-user-id', ... }
  request.auth = { uid: 'test-firebase-uid', ... }
  return true // Allow access
} else {
  // Full Firebase authentication
  return firebaseAuthGuard.canActivate(context)
}
```

## Migration Back to Production Auth

When you're ready to enable authentication:

1. **Update Environment**:
   ```bash
   ENABLE_AUTH="true"
   ```

2. **Verify Firebase Config**:
   ```bash
   FIREBASE_PROJECT_ID=your-project
   FIREBASE_CLIENT_EMAIL=your-email
   FIREBASE_PRIVATE_KEY=your-key
   ```

3. **Client Integration**:
   - Ensure frontend apps obtain Firebase ID tokens
   - Include tokens in API requests
   - Handle authentication errors

4. **Test Authentication**:
   ```bash
   # Should fail without token
   curl GET /api/v1/auth/me
   
   # Should work with valid token
   curl GET /api/v1/auth/me -H "Authorization: Bearer <firebase-token>"
   ```

## Benefits

✅ **Fast Development** - No auth setup required for API testing  
✅ **Easy Testing** - All endpoints accessible for integration tests  
✅ **Production Ready** - One environment variable to enable full auth  
✅ **Zero Friction** - Controllers unchanged, seamless transition  
✅ **Mock Context** - Realistic user object for testing business logic