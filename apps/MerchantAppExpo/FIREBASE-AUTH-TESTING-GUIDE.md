# Firebase Phone Authentication Testing Guide

## Overview

This guide covers comprehensive testing of Firebase phone authentication in the MerchantAppExpo React Native application. The test suite validates Firebase configuration, phone auth flow, error handling, and backend integration.

## Test Suite Components

### 1. Firebase Configuration Test (`firebase-config.test.js`)
- ✅ Verifies Firebase configuration files (google-services.json, GoogleService-Info.plist)
- ✅ Checks Expo plugin configuration in app.json
- ✅ Validates Firebase dependencies in package.json
- ✅ Tests backend connectivity

### 2. Phone Auth Flow Test (`firebase-phone-auth-flow.test.js`)
- ✅ Tests phone number validation logic
- ✅ Simulates OTP request flow
- ✅ Simulates OTP verification flow
- ✅ Tests Firebase ID token generation
- ✅ Validates complete authentication flow

### 3. Error Handling Test (`firebase-auth-error-handling.test.js`)
- ✅ Tests invalid phone number scenarios
- ✅ Tests invalid OTP code scenarios
- ✅ Tests Firebase-specific error codes
- ✅ Tests network timeout handling
- ✅ Tests backend authentication errors
- ✅ Tests edge cases and boundary conditions

### 4. Backend Integration Test (`firebase-backend-integration.test.js`)
- ✅ Tests backend health check
- ✅ Tests Firebase token validation with /auth/me endpoint
- ✅ Tests user synchronization process
- ✅ Tests protected API endpoints access
- ✅ Tests token refresh scenarios
- ✅ Tests end-to-end authentication flow

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd ../api
   npm run start:dev
   ```

2. **Environment Variables**
   ```bash
   export EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Test Dependencies**
   ```bash
   npm install axios
   ```

## Quick Start

### Install Test Dependencies
```bash
# Install axios for HTTP requests
npm install axios
```

### Run All Tests
```bash
# Run complete test suite
node run-firebase-auth-tests.js
```

### Run Individual Tests
```bash
# Configuration test
node firebase-config.test.js

# Phone auth flow test
node firebase-phone-auth-flow.test.js

# Error handling test
node firebase-auth-error-handling.test.js

# Backend integration test
node firebase-backend-integration.test.js
```

### Test Runner Options
```bash
# Show help
node run-firebase-auth-tests.js --help

# List available tests
node run-firebase-auth-tests.js --list

# Run specific test
node run-firebase-auth-tests.js --test firebase-config.test.js
```

## Test Scenarios Covered

### Phone Number Validation
- ✅ Valid E.164 format numbers
- ❌ Invalid format numbers
- ❌ Empty/null phone numbers
- ❌ Non-numeric characters
- ❌ Numbers too short/long

### OTP Code Validation
- ✅ Valid 6-digit codes
- ❌ Invalid length codes
- ❌ Non-numeric codes
- ❌ Empty/null codes

### Firebase Error Codes
- `auth/too-many-requests`
- `auth/invalid-phone-number`
- `auth/missing-phone-number`
- `auth/invalid-verification-code`
- `auth/code-expired`
- `auth/session-expired`
- `auth/quota-exceeded`

### Backend Integration
- Health check endpoints
- Protected API endpoints
- Token validation
- User synchronization
- Error response handling

## Expected Test Results

### ✅ Successful Test Output
```
🔥 Firebase Configuration Test Started
=====================================

📁 Testing Firebase configuration files...
✅ Android google-services.json found
✅ iOS GoogleService-Info.plist found

📊 TEST SUMMARY
================
Config Files: ✅ PASS
Project Config: ✅ PASS
Auth Enabled: ✅ PASS
Backend Connection: ✅ PASS

🎯 OVERALL: ✅ PASS
```

### ❌ Common Issues and Solutions

#### Issue: Backend Connection Failed
```
❌ Backend connection failed: connect ECONNREFUSED ::1:3000
```
**Solution:**
```bash
cd ../api
npm run start:dev
```

#### Issue: Configuration Files Missing
```
❌ Android google-services.json not found
❌ iOS GoogleService-Info.plist not found
```
**Solution:**
- Download configuration files from Firebase Console
- Place them in the MerchantAppExpo root directory

#### Issue: Firebase Plugins Not Configured
```
❌ Firebase Auth plugin configured: false
```
**Solution:**
- Check app.json plugins array includes `@react-native-firebase/auth`

## Troubleshooting

### Firebase Configuration Issues
1. **Missing Configuration Files**
   - Ensure `google-services.json` is in the project root
   - Ensure `GoogleService-Info.plist` is in the project root
   - Verify files contain correct project information

2. **Plugin Configuration**
   - Check `app.json` includes Firebase plugins
   - Verify plugin configuration in expo plugins array

3. **Dependencies**
   - Ensure `@react-native-firebase/app` is installed
   - Ensure `@react-native-firebase/auth` is installed

### Backend Integration Issues
1. **Server Not Running**
   ```bash
   cd ../api
   npm run start:dev
   ```

2. **Wrong API URL**
   ```bash
   export EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Firebase Admin SDK**
   - Verify Firebase Admin SDK is configured in backend
   - Check service account credentials

### Network Issues
1. **Timeout Errors**
   - Check network connectivity
   - Verify backend server is accessible
   - Check firewall settings

2. **CORS Issues**
   - Verify backend CORS configuration
   - Check allowed origins

## Test Environment Setup

### Development Environment
```bash
# 1. Start backend
cd ../api
npm run start:dev

# 2. Set environment variables
export EXPO_PUBLIC_API_URL=http://localhost:3000

# 3. Run tests
cd ../MerchantAppExpo
node run-firebase-auth-tests.js
```

### CI/CD Environment
```bash
# In your CI/CD pipeline
- name: Run Firebase Auth Tests
  run: |
    export EXPO_PUBLIC_API_URL=${{ secrets.API_URL }}
    cd apps/MerchantAppExpo
    npm install axios
    node run-firebase-auth-tests.js
```

## Test Data

### Valid Test Phone Numbers
- `+1234567890` (US format)
- `+919876543210` (India format)
- `+442012345678` (UK format)

### Invalid Test Phone Numbers
- `1234567890` (missing country code)
- `+12` (too short)
- `abc123` (non-numeric)
- `` (empty)

### Test OTP Codes
- `123456` (valid format)
- `000000` (valid format)
- `12` (too short)
- `abc123` (non-numeric)

## Security Considerations

⚠️ **Important Security Notes:**
- These tests use mock Firebase tokens for testing purposes
- Never use real user credentials in tests
- Mock tokens will be rejected by properly configured backends
- Real Firebase tokens should only be generated through proper authentication

## Contributing

When adding new tests:
1. Follow the established file naming pattern: `firebase-*.test.js`
2. Include the required comment header with test description
3. Add the test to the `TESTS` array in `run-firebase-auth-tests.js`
4. Update this documentation

## Support

For issues with the test suite:
1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Run individual tests to isolate issues
4. Check Firebase Console for configuration errors
5. Review backend logs for authentication issues