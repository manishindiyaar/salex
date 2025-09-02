# Comprehensive Business Onboarding Test

This script performs a complete end-to-end test of the business onboarding flow using the Salex API endpoints.

## What This Script Does

The script creates a fully configured test business through the following steps:

1. **Business Creation** - Creates "TestSalon Premium" with proper details
2. **Business Hours Setup** - Configures operational hours (M-F 9AM-6PM, Sat 10AM-4PM, Sun closed)
3. **Services Creation** - Adds three services:
   - Haircut: $30, 60 minutes
   - Hair Wash: $15, 30 minutes  
   - Hair Coloring: $80, 120 minutes
4. **Routing Code Assignment** - Sets the 4-digit code "1234" for customer access
5. **End-to-End Validation** - Verifies all components work together

## Prerequisites

1. **API Server Running** - Start the Salex API server:
   ```bash
   cd apps/api && pnpm dev
   # or from project root:
   pnpm dev:api
   ```

2. **Environment Variables** - Ensure your `.env` file contains:
   ```env
   API_BASE_URL=http://localhost:3000
   CLERK_JWT_TOKEN=your_jwt_token_here
   ```

3. **Dependencies** - Install required packages:
   ```bash
   pnpm install
   ```

## How to Run

### Option 1: Direct Node Execution
```bash
node comprehensive-business-onboarding.test.js
```

### Option 2: NPM Script
```bash
npm run test:comprehensive-onboarding
```

### Option 3: From Project Root
```bash
cd curl-test && node comprehensive-business-onboarding.test.js
```

## Expected Output

On successful completion, you'll see:

```
🎉 COMPREHENSIVE ONBOARDING COMPLETED SUCCESSFULLY!
======================================================================

📋 Business Summary:
   • Business Name: TestSalon Premium
   • Business ID: [generated-uuid]
   • Business Type: SALON
   • Phone Number: +1234567890
   • Address: 123 Test Street, Test City, TC 12345
   • Routing Code: S1234

⚙️  Configuration Details:
   • Services Created: 3
   • Business Hours: Configured
   • Salon Profile: Auto-created

💰 Services Overview:
   • Haircut: $30 (60 minutes)
   • Hair Wash: $15 (30 minutes)
   • Hair Coloring: $80 (120 minutes)

🔗 Customer Access:
   • Customers can find this business using code: S1234
   • Public lookup URL: http://localhost:3000/api/v1/public/businesses/by-code/1234
```

## Troubleshooting

### Common Issues

1. **API Server Not Running**
   ```
   ❌ API Server connection failed: connect ECONNREFUSED
   ```
   **Solution:** Start the API server with `pnpm dev:api`

2. **JWT Token Missing**
   ```
   ❌ CLERK_JWT_TOKEN environment variable is required!
   ```
   **Solution:** Add your JWT token to the `.env` file

3. **Routing Code Already Taken**
   ```
   🔄 Conflict: Routing code may already be assigned
   ```
   **Solution:** The script will show suggested alternatives

4. **Database Connection Issues**
   ```
   ❌ Step 1 FAILED: Database connection error
   ```
   **Solution:** Ensure your database is running and properly configured

### Debug Mode

For additional debugging information, you can modify the script to log full request/response details by uncommenting the debug lines in the `makeApiRequest` function.

## Test Data Used

- **Business Name:** TestSalon Premium
- **Business Type:** SALON (automatically creates salon profile)
- **Phone:** +1234567890
- **Address:** 123 Test Street, Test City, TC 12345
- **Routing Code:** 1234 (customers use S1234)
- **Hours:** Monday-Friday 9AM-6PM, Saturday 10AM-4PM, Sunday closed

## Integration with Other Tests

After running this script successfully:

1. The business ID is stored in `TEST_BUSINESS_ID` environment variable
2. You can use the routing code "1234" for WhatsApp simulator tests
3. The created services can be used for booking/timeslot tests
4. The business can be accessed via the public API using code "1234"

## API Endpoints Tested

This comprehensive test validates the following endpoints:

- `POST /api/v1/businesses` - Business creation
- `PUT /api/v1/businesses/{id}/hours` - Business hours update
- `POST /api/v1/businesses/{id}/services` - Service creation
- `GET /api/v1/businesses/{id}/services` - Service retrieval
- `PUT /api/v1/businesses/{id}/routing-code` - Routing code assignment
- `GET /api/v1/public/businesses/by-code/{code}` - Public business lookup
- `GET /api/v1/businesses/{id}` - Business detail retrieval

## Security Notes

- The script uses JWT authentication for all protected endpoints
- No sensitive data is hardcoded (uses environment variables)
- Routing codes are validated server-side for format and availability
- All API calls include proper error handling and validation