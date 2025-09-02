# Story 1.5 Testing Guide - Business Hours and Time Slots

This guide covers the comprehensive test suite for Story 1.5 functionality, including business hours management and time slots calculation.

## Overview

Story 1.5 implements business hours management and time slots calculation with the following features:
- **Business Hours Management**: CRUD operations for business operating hours
- **Business Open Status**: Real-time checking if business is currently open
- **Time Slots Calculation**: Generate available appointment slots based on business hours
- **Multiple Time Slot Endpoints**: Today, week, and custom date range queries
- **Service Integration**: Service-specific time slot calculations
- **Comprehensive Validation**: Input validation and error handling

## Test Files

### 1. `business-hours.test.js`
Tests business hours management functionality:
- ✅ Update business hours with valid data
- ✅ Get business hours 
- ✅ Check business open status
- ✅ Invalid time format validation
- ✅ Logical time errors (open > close)
- ✅ Authentication and authorization
- ✅ Error handling (404, 403, 401)

### 2. `timeslots.test.js`
Tests time slots calculation functionality:
- ✅ Get available slots for date range
- ✅ Get today's available slots
- ✅ Get week's available slots  
- ✅ Custom slot intervals (15, 30, 60 minutes)
- ✅ Service-specific time slots
- ✅ Date format validation
- ✅ Date range validation
- ✅ Parameter validation
- ✅ Authentication and authorization
- ✅ Error handling scenarios

### 3. `story-1.5-error-validation.test.js`
Comprehensive error and edge case testing:
- ✅ Invalid time format edge cases
- ✅ Boundary time values
- ✅ Missing required fields
- ✅ Invalid date format variations
- ✅ Extreme date ranges
- ✅ Invalid slot interval values
- ✅ Malformed request bodies
- ✅ Resource not found scenarios
- ✅ Authentication edge cases
- ✅ Concurrent operation handling

### 4. `story-1.5-comprehensive.test.js`
End-to-end integration testing:
- ✅ Complete workflow testing
- ✅ Business hours and time slots integration
- ✅ Cross-endpoint consistency
- ✅ Response format validation
- ✅ Real-world usage scenarios

### 5. `run-story-1.5-tests.js`
Test runner that executes all Story 1.5 tests in sequence and provides consolidated results.

## Setup and Prerequisites

### Environment Variables
Create a `.env` file in the `curl-test` directory with:

```bash
# API Configuration
API_BASE_URL=http://localhost:3000
CLERK_JWT_TOKEN=your_valid_jwt_token_here

# Test Data
TEST_BUSINESS_ID=your_test_business_id
TEST_SERVICE_ID=your_test_service_id
```

### Required Dependencies
The test files use Node.js with axios for HTTP requests:

```bash
cd curl-test
npm install axios
```

## Running the Tests

### Run All Story 1.5 Tests
```bash
node run-story-1.5-tests.js
```

### Run Individual Test Files
```bash
# Business hours tests
node business-hours.test.js

# Time slots tests  
node timeslots.test.js

# Error validation tests
node story-1.5-error-validation.test.js

# Comprehensive integration tests
node story-1.5-comprehensive.test.js
```

## API Endpoints Tested

### Business Hours Endpoints
- `PUT /api/v1/businesses/{id}/hours` - Update business hours
- `GET /api/v1/businesses/{id}/hours` - Get business hours
- `GET /api/v1/businesses/{id}/open-status` - Check if business is open

### Time Slots Endpoints
- `GET /api/v1/businesses/{id}/timeslots` - Get slots for date range
- `GET /api/v1/businesses/{id}/timeslots/today` - Get today's slots
- `GET /api/v1/businesses/{id}/timeslots/week` - Get week's slots

## Test Data Structures

### Business Hours Format
```javascript
{
  "hoursOfOperation": {
    "monday": {
      "open": "09:00",
      "close": "17:00", 
      "closed": false
    },
    "sunday": {
      "open": "10:00",
      "close": "16:00",
      "closed": true  // Closed on Sunday
    }
    // ... other days
  }
}
```

### Time Slots Query Parameters
```javascript
{
  "startDate": "2024-01-01",  // YYYY-MM-DD format
  "endDate": "2024-01-07",    // YYYY-MM-DD format
  "serviceId": "optional-service-id",
  "slotInterval": 30          // Minutes (15, 30, 60)
}
```

## Expected Response Formats

### Business Hours Response
```javascript
{
  "success": true,
  "data": {
    "id": "business-id",
    "hoursOfOperation": { /* BusinessHours object */ },
    // ... other business fields
  },
  "message": "Business hours updated successfully"
}
```

### Open Status Response
```javascript
{
  "success": true,
  "data": {
    "isOpen": true,
    "currentTime": "2024-01-01T10:30:00.000Z"
  },
  "message": "Business is currently open"
}
```

### Time Slots Response
```javascript
{
  "success": true,
  "data": {
    "businessId": "business-id",
    "serviceId": "service-id", // Optional
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-07"
    },
    "slots": [
      {
        "startTime": "09:00",
        "endTime": "09:30",
        "available": true,
        "date": "2024-01-01",
        "duration": 30
      }
    ],
    "slotInterval": 30,
    "businessHours": { /* BusinessHours object */ }
  },
  "message": "Available time slots retrieved successfully"
}
```

## Error Scenarios Tested

### HTTP Status Codes
- **400 Bad Request**: Invalid data, validation errors
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Access denied to resource
- **404 Not Found**: Business or service not found
- **500 Internal Server Error**: Server-side errors

### Validation Errors
- Invalid time formats (25:00, 09:60, abc:00)
- Logical time errors (open time > close time)
- Invalid date formats (2024/12/01, 2024-13-01)
- Missing required parameters
- Invalid slot intervals (negative, zero, non-numeric)
- Date ranges exceeding limits (> 30 days)

## Test Results Interpretation

### Success Indicators
- ✅ All HTTP status codes match expectations
- ✅ Response structures follow shared-types interfaces  
- ✅ Business hours validation works correctly
- ✅ Time slots respect business hours constraints
- ✅ Error messages are informative and appropriate
- ✅ Authentication and authorization work properly

### Common Issues
- 🔧 JWT token expired or invalid
- 🔧 Test business ID doesn't exist or user lacks access
- 🔧 API server not running on expected port
- 🔧 Database connection issues
- 🔧 Validation logic too strict/lenient

## Integration with Shared Types

All tests validate against the shared-types package interfaces:
- `BusinessHours`, `DaySchedule` 
- `TimeSlot`, `TimeSlotsQuery`, `TimeSlotsResponse`
- `ApiResponse<T>` wrapper format
- Proper TypeScript type safety

## Best Practices

1. **Run tests in clean environment** - Use fresh test data
2. **Check authentication** - Ensure valid JWT tokens  
3. **Validate business access** - User must own test business
4. **Monitor API logs** - Check server logs for detailed errors
5. **Test incrementally** - Run individual tests for debugging
6. **Update test data** - Keep business/service IDs current

## Troubleshooting

### Common Solutions
```bash
# Check API server status
curl http://localhost:3000/health

# Validate JWT token
node decode-jwt.js

# Test business access
node business-get-me.test.js

# Check environment variables
echo $CLERK_JWT_TOKEN
echo $TEST_BUSINESS_ID
```

This comprehensive test suite ensures Story 1.5 functionality is robust, well-validated, and production-ready.