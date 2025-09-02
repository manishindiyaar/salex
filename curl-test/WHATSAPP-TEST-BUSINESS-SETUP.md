# WhatsApp Test Business Setup

This script creates test business data specifically for WhatsApp simulator testing with routing code "1234".

## Quick Start

### Option 1: TypeScript Version (Recommended)

```bash
# From the apps/api directory
cd apps/api

# Create test business with routing code 1234
npm run create-test-business

# Verify the setup
npm run verify-test-business
```

Or run directly:
```bash
npx ts-node src/scripts/create-whatsapp-test-business-1234.ts
npx ts-node src/scripts/verify-whatsapp-test-business.ts
```

### Option 2: JavaScript Version (Standalone)

```bash
# From the curl-test directory
cd curl-test
npm install  # Install dependencies first
node create-whatsapp-test-business.js

# Verify the setup (if Prisma client works)
node verify-test-business.js
```

**Note**: The TypeScript version is recommended as it uses the properly configured Prisma client from the main API project.

## What the Script Creates

### Test User
- **Clerk User ID**: `test-whatsapp-user-clerk-1234`
- **Phone Number**: `+19801441675`

### Test Business
- **Business ID**: `test-whatsapp-business-1234`
- **Routing Code**: `1234` ⭐
- **Name**: `Test Hair Salon`
- **Phone Number**: `+19801441675`
- **Business Type**: `SALON`
- **Address**: `123 Test Street, Test City`
- **Business Hours**: 9 AM - 6 PM (Mon-Fri), 10 AM - 4 PM (Sat), Closed Sunday

### Test Services
1. **Haircut & Style** - $45.99 (60 min)
2. **Hair Coloring** - $120.00 (120 min)
3. **Shampoo & Blow Dry** - $25.00 (30 min)
4. **Deep Conditioning Treatment** - $85.00 (45 min)

## Prerequisites

1. **Database Connection**: Ensure your `.env` file has the correct `DATABASE_URL`
2. **Supabase**: Make sure your Supabase instance is running if using local development
3. **Dependencies**: Run `npm install` in the curl-test directory if needed

## Environment Setup

The script uses the same database connection as the main API. Ensure your environment variables are set:

```bash
# In apps/api/.env or your environment
DATABASE_URL="your-database-connection-string"
```

## Script Features

### Idempotent Operation
- ✅ Safe to run multiple times
- ✅ Updates existing records instead of creating duplicates
- ✅ Checks for existing business with routing code "1234"

### Error Handling
- ✅ Comprehensive error messages
- ✅ Database constraint violation detection
- ✅ Proper connection cleanup
- ✅ Exit codes for script automation

### Logging
- ✅ Clear step-by-step progress
- ✅ Summary of created/updated records
- ✅ Business details for verification
- ✅ WhatsApp integration instructions

## Usage in WhatsApp Testing

After running this script:

1. **Routing Code**: Use `1234` to route messages to this test business
2. **Phone Number**: Messages to `+19801441675` will be handled by this business
3. **Services**: The business will have 4 test services available for booking
4. **Business Hours**: Test booking flows within 9 AM - 6 PM timeframe

## Troubleshooting

### Database Connection Issues
```bash
# Check if Supabase is running (if using local development)
supabase status

# Or check your DATABASE_URL environment variable
echo $DATABASE_URL
```

### Duplicate Routing Code
If you see a unique constraint error for routing code, another business might already be using "1234". The script will update the existing business instead of failing.

### Missing Dependencies
```bash
# Install missing packages
npm install @prisma/client
```

## Integration with Other Tests

This script creates the foundation data needed for:
- WhatsApp webhook testing
- Business routing tests
- Service booking flows
- Analytics testing

The created business ID `test-whatsapp-business-1234` can be used in other test scripts that require a valid business reference.