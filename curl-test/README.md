# Salex API Test Scripts

This directory contains comprehensive Node.js test scripts for validating the Salex authentication system and API endpoints using Axios.

## 🚀 Master Test Runners

### `run-all-auth-tests.js` - Complete Authentication Test Suite
Executes all authentication tests in sequence with comprehensive reporting and environment validation.

**Usage:**
```bash
# Ensure your API server is running first
pnpm dev

# Run all authentication tests
node curl-test/run-all-auth-tests.js
```

### `run-all-business-tests.js` - Complete Business API Test Suite
Executes all business management endpoint tests with comprehensive validation and error handling.

**Usage:**
```bash
# Ensure your API server is running first
pnpm dev

# Run all business API tests
node curl-test/run-all-business-tests.js
```

## 🔐 Authentication System Test Scripts

### 1. `auth-flow.test.js` - Authentication Flow Tests
Tests FirebaseAuthGuard with valid/invalid Firebase ID tokens.

**Features:**
- Valid JWT token authentication validation
- Invalid JWT token rejection testing
- Missing JWT token rejection testing
- Error response structure verification

### 2. `user-sync.test.js` - User Synchronization Tests
Tests user creation and retrieval from database.

**Features:**
- User synchronization from JWT claims verification
- Database user record creation/update validation
- User data consistency checks across requests
- Database health verification

### 3. `protected-endpoints.test.js` - Protected Endpoints Tests
Tests all authentication-protected endpoints.

**Features:**
- `/api/v1/auth/me` endpoint validation
- `/api/v1/businesses/me` endpoint validation
- `/api/v1/auth/health` endpoint validation
- Endpoint performance monitoring

### 4. `whatsapp-webhook.test.js` - WhatsApp Integration Tests
Tests WhatsApp webhook signature verification and business context extraction.

**Features:**
- Webhook verification (GET) with valid/invalid tokens
- Webhook message processing (POST) validation
- Signature verification with HMAC-SHA256
- Business context extraction testing
- Webhook health check validation

### 5. `whatsapp-real-message-test.js` - Comprehensive WhatsApp Real Message Testing
Complete end-to-end WhatsApp integration testing with real message simulation and interactive features.

**Features:**
- Real webhook verification with ngrok integration
- Text message webhook simulation
- Interactive button message testing
- Interactive list message testing
- Message status webhook testing
- Real WhatsApp message sending via Business API
- Interactive button/list message sending
- Real-time terminal logging with colored output
- Comprehensive error handling and troubleshooting

**Usage:**
```bash
# Setup guide and environment check
node curl-test/whatsapp-test-guide.js

# Run comprehensive WhatsApp tests
node curl-test/whatsapp-real-message-test.js
```

### 6. `error-handling.test.js` - Error Handling Tests
Tests comprehensive error scenarios and edge cases.

**Features:**
- Unauthorized access error handling
- Invalid token format rejection
- WebHook error scenarios
- Rate limiting and throttling validation
- Network error handling
- Response structure consistency

## 🏢 Business Management API Test Scripts

### 1. `business-get-me.test.js` - Current User Business Tests
Tests the endpoint to retrieve the current user's business profile.

**Features:**
- Authenticated request validation with proper JWT token
- Unauthorized request rejection (401 responses)
- ApiResponse<Business | null> structure validation
- Business and Salon data verification
- Invalid token handling

### 2. `business-create.test.js` - Business Creation Tests
Tests business creation with automatic Salon record creation.

**Features:**
- Valid business creation with complete data validation
- Automatic Salon record creation verification
- Business type forced to SALON validation
- Input validation testing with invalid data
- Unauthorized creation attempt blocking
- Duplicate business creation support

### 3. `business-get-by-id.test.js` - Business Retrieval Tests
Tests retrieving specific business by ID with ownership validation.

**Features:**
- Valid business ID retrieval with Salon data
- Non-existent business ID handling (404)
- Unauthorized access blocking (401)
- Ownership validation (403 for other users' businesses)
- Invalid ID format handling (400)

### 4. `business-update.test.js` - Business Update Tests
Tests business information updates with ownership validation.

**Features:**
- Valid business update with data verification
- Partial update support (only specified fields)
- Input validation with invalid data rejection
- Unauthorized update blocking (401)
- Non-existent business handling (404)
- Ownership validation for updates

### 5. `business-services.test.js` - Business Services Tests
Tests retrieving services associated with a business.

**Features:**
- Services array retrieval (may be empty)
- Service object structure validation
- BusinessId relationship verification
- Price and duration validation
- Access control and ownership validation

### 6. `business-bookings.test.js` - Business Bookings Tests
Tests retrieving bookings associated with a business.

**Features:**
- Bookings array retrieval (may be empty)
- Query parameter support testing
- Access control and ownership validation
- Response structure consistency

### 7. `business-validation.test.js` - API Response Validation
Tests API responses against shared-types definitions for type safety.

**Features:**
- ApiResponse<T> structure validation
- Business interface compliance testing
- Salon interface compliance testing
- Service interface compliance testing
- BusinessType enum validation
- Type safety across all endpoints

## 🔧 Legacy Test Scripts

### `api-endpoints.test.js` - Full Integration Test
This script manages the complete lifecycle: starts the API server, runs tests, and shuts down the server.

### `api-endpoints-simple.test.js` - Simple Endpoint Test
Basic endpoint testing assuming the API server is already running.

## 🛠️ Setup and Configuration

### Prerequisites
- Node.js and pnpm installed
- Supabase running locally (`supabase start`)
- API server running (`pnpm dev`)
- Environment variables configured (copy `.env.example` to `.env`)

### Required Environment Variables
```bash
# Authentication (Required for most tests)
FIREBASE_ID_TOKEN="your-firebase-id-token-here"
# Note: Firebase Admin credentials are configured in apps/api/.env for server-side verification

# API Configuration
API_BASE_URL="http://localhost:3001"  # Default if not specified

# WhatsApp Configuration (Required for webhook tests)
WHATSAPP_WEBHOOK_VERIFY_TOKEN="your-verify-token"
WHATSAPP_API_TOKEN="your-whatsapp-api-token"

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
```

### Individual Test Usage

#### Authentication Tests
```bash
# Run individual authentication test scripts
node curl-test/auth-flow.test.js
node curl-test/user-sync.test.js
node curl-test/protected-endpoints.test.js
node curl-test/whatsapp-webhook.test.js
node curl-test/error-handling.test.js
```

#### Business API Tests
```bash
# Run individual business test scripts
node curl-test/business-get-me.test.js
node curl-test/business-create.test.js
node curl-test/business-get-by-id.test.js
node curl-test/business-update.test.js
node curl-test/business-services.test.js
node curl-test/business-bookings.test.js
node curl-test/business-validation.test.js

# Run with custom API URL
API_BASE_URL=http://localhost:3000 node curl-test/business-get-me.test.js
```

## 📊 Test Results and Coverage

### Authentication System Coverage
- ✅ JWT token validation with Clerk integration
- ✅ User synchronization and database operations
- ✅ Protected endpoint access control
- ✅ WhatsApp webhook signature verification
- ✅ Business context extraction from messages
- ✅ Comprehensive error handling and edge cases
- ✅ Response structure consistency
- ✅ Performance and availability monitoring

### Business Management API Coverage
- ✅ Business profile creation and retrieval
- ✅ Automatic Salon record creation
- ✅ Business ownership validation
- ✅ Business information updates
- ✅ Business services retrieval
- ✅ Business bookings retrieval
- ✅ Input validation and error handling
- ✅ Authorization and access control
- ✅ Type safety validation against shared-types
- ✅ ApiResponse<T> structure consistency

## 🔍 Troubleshooting

### Common Issues

#### API Server Not Available
```bash
# Check if server is running
curl http://localhost:3001/webhooks/whatsapp/health

# Start the server
pnpm dev
```

#### Authentication Tests Failing
- Ensure `FIREBASE_ID_TOKEN` is set with a valid Firebase ID token
- Verify Firebase configuration in your API server
- Check that the ID token hasn't expired

#### Database Connection Issues
- Verify Supabase is running: `supabase status`
- Check database migrations: `pnpm db:push`
- Validate DATABASE_URL configuration

#### WhatsApp Webhook Tests Failing
- Set `WHATSAPP_WEBHOOK_VERIFY_TOKEN` environment variable
- For signature tests, set `WHATSAPP_API_TOKEN`
- For production testing, use ngrok to expose local server

### Getting a Firebase ID Token
Option A: From the React Native app (recommended)
1. Sign in with phone OTP using the RN app
2. After confirmation, retrieve the Firebase ID token via: await auth().currentUser?.getIdToken()
3. Copy the token and set as `FIREBASE_ID_TOKEN` in curl-test/.env

Option B: Using Firebase Auth REST API
1. Use the Firebase REST endpoint to exchange a phone credential for an ID token
2. Copy the idToken from the response and set as `FIREBASE_ID_TOKEN`

## Adding New Tests

When creating new test scripts in this directory, follow these conventions:

1. **File Header:** Include the required comment header with test description, input, and expected output
2. **Security:** Never hardcode secrets or API keys - use environment variables
3. **Error Handling:** Include comprehensive error handling and clear logging
4. **Exit Codes:** Return appropriate exit codes (0 for success, 1 for failure)

Example header format:
```javascript
/*
 * ## Test Description: [Brief description]
 *
 * ### Input:
 * [Describe the input for the test]
 *
 * ### Expected Output:
 * [Describe the expected outcome]
 *
 * ### Passes:
 * [ ] Test case 1 passed.
 */
```
