# Booking API Tests

This directory contains comprehensive test scripts for the Salex booking system API endpoints.

## Prerequisites

1. **Test Business Setup**: Run the business onboarding test first to create test data:
   ```bash
   node comprehensive-business-onboarding.test.js
   ```

2. **Environment Variables**: Ensure your `.env` file contains:
   ```env
   API_BASE_URL=http://localhost:3000
   CLERK_JWT_TOKEN=your_jwt_token_here
   ```

3. **API Server**: Make sure your NestJS API server is running:
   ```bash
   cd apps/api && pnpm dev
   ```

## Test Scripts

### 1. Quick Validation (`booking-quick-test.js`)
- **Purpose**: Rapid validation of core booking functionality
- **Duration**: ~10 seconds
- **Tests**: Create → Retrieve → Update → Confirm
- **Usage**: `node booking-quick-test.js`

### 2. Individual Endpoints (`booking-endpoints.test.js`)
- **Purpose**: Detailed testing of each booking endpoint
- **Duration**: ~1-2 minutes
- **Tests**: All 10 booking endpoints with validation
- **Usage**: `node booking-endpoints.test.js`

### 3. Comprehensive Flow (`comprehensive-booking-flow.test.js`)
- **Purpose**: Complete booking lifecycle with multiple scenarios
- **Duration**: ~2-3 minutes
- **Tests**: Multi-customer workflows, cancellations, conflicts
- **Usage**: `node comprehensive-booking-flow.test.js`

### 4. Test Suite Runner (`run-booking-tests.js`)
- **Purpose**: Runs all booking tests in sequence
- **Duration**: ~3-5 minutes
- **Tests**: All of the above with comprehensive reporting
- **Usage**: `node run-booking-tests.js`

## Booking Endpoints Tested

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/businesses/{id}/bookings` | Create booking | Public |
| GET | `/api/v1/bookings/{id}` | Get booking details | Public |
| GET | `/api/v1/businesses/{id}/bookings` | Get business bookings | Protected |
| GET | `/api/v1/customers/{phone}/bookings` | Get customer bookings | Public |
| PUT | `/api/v1/bookings/{id}` | Update booking | Protected |
| PUT | `/api/v1/bookings/{id}/confirm` | Confirm booking | Protected |
| PUT | `/api/v1/bookings/{id}/complete` | Complete booking | Protected |
| PUT | `/api/v1/bookings/{id}/cancel` | Cancel by salon | Protected |
| PUT | `/api/v1/bookings/{id}/cancel-customer` | Cancel by customer | Public |
| DELETE | `/api/v1/bookings/{id}` | Delete booking | Protected |

## Test Scenarios Covered

### ✅ Booking Creation
- Multiple customers and services
- Proper validation of required fields
- Response structure verification
- Initial status validation (PENDING)

### ✅ Booking Retrieval
- Customer view (by phone number)
- Business owner view (all bookings)
- Individual booking details
- Service and business data inclusion

### ✅ Booking Updates
- Rescheduling appointments
- Updating notes and details
- Status preservation during updates
- Validation of changes

### ✅ Booking Workflows
- **Confirmation**: PENDING → CONFIRMED
- **Completion**: CONFIRMED → COMPLETED
- **Customer Cancellation**: ANY → CANCELLED_BY_CUSTOMER
- **Salon Cancellation**: ANY → CANCELLED_BY_SALON

### ✅ Conflict Detection
- Same time slot booking prevention
- Proper error responses (409 Conflict)
- Business logic validation

### ✅ Error Handling
- Invalid booking IDs (404)
- Unauthorized access (401)
- Invalid service IDs (400)
- Missing required fields (400)
- Phone number verification for cancellations

### ✅ Security Testing
- Public endpoints work without authentication
- Protected endpoints require valid JWT
- Customer data isolation
- Business data access control

## Expected Test Results

### Success Criteria
- All 10 endpoints return correct HTTP status codes
- Response data structures match API specifications
- Booking statuses transition correctly through workflows
- Error scenarios return appropriate error responses
- No data leakage between customers or businesses

### Performance Expectations
- Individual endpoint tests: < 2 seconds per request
- Comprehensive flow test: < 3 minutes total
- All tests combined: < 5 minutes

## Troubleshooting

### Common Issues

**1. "Test business not found"**
```bash
# Solution: Run the onboarding test first
node comprehensive-business-onboarding.test.js
```

**2. "CLERK_JWT_TOKEN required"**
```bash
# Solution: Add JWT token to .env file
echo "CLERK_JWT_TOKEN=your_token_here" >> .env
```

**3. "API connection failed"**
```bash
# Solution: Start the API server
cd apps/api && pnpm dev
```

**4. "Unauthorized (401)"**
```bash
# Solution: Check JWT token is valid and not expired
node decode-jwt.js  # Use this to check token expiry
```

**5. "Conflict (409) errors"**
```bash
# This may be expected behavior for time conflict tests
# Check test output to see if it's part of conflict detection validation
```

### Debug Mode
For detailed API request/response logging, set:
```env
DEBUG=true
```

## Test Data

The tests use:
- **Test Business**: "TestSalon Premium" with routing code "1234"
- **Test Services**: Haircut ($30, 60min), Hair Wash ($15, 30min), Hair Coloring ($80, 120min)
- **Test Customers**: Multiple phone numbers (+1234567001-004, +1234567890, +1234567891)
- **Test Times**: Tomorrow at various hours (14:30, 16:00, etc.)

## Integration with CI/CD

These tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Run Booking API Tests
  run: |
    cd curl-test
    npm install
    node run-booking-tests.js
```

## Contributing

When adding new booking endpoints or modifying existing ones:

1. Update the relevant test scripts
2. Add new test scenarios to comprehensive flow test
3. Update this README with new endpoints
4. Ensure all tests pass before submitting PR

## Support

For issues with these tests:
1. Check the troubleshooting section above
2. Review API server logs for detailed error information
3. Run tests individually to isolate problems
4. Verify your booking API implementation matches the expected behavior