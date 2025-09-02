# WhatsApp Test Business Data Creation

This directory contains scripts to create and verify test business data for WhatsApp simulator testing.

## Files Created

### Primary Scripts (TypeScript - Recommended)
- `/apps/api/src/scripts/create-whatsapp-test-business-1234.ts` - Creates test business with routing code 1234
- `/apps/api/src/scripts/verify-whatsapp-test-business.ts` - Verifies test business was created correctly

### Standalone Scripts (JavaScript)
- `/curl-test/create-whatsapp-test-business.js` - Standalone JavaScript version
- `/curl-test/verify-test-business.js` - Standalone verification script

### Documentation
- `/curl-test/WHATSAPP-TEST-BUSINESS-SETUP.md` - Detailed setup and usage guide

## Quick Usage

```bash
# From the apps/api directory (recommended)
cd apps/api
npm run create-test-business
npm run verify-test-business
```

## Test Business Details

- **Routing Code**: `1234`
- **Business Name**: `Test Hair Salon`
- **Phone Number**: `+19801441675`
- **Business Type**: `SALON`
- **Owner**: Test user with Clerk ID `test-whatsapp-user-clerk-1234`

## Services Created

1. **Haircut & Style** - $45.99 (60 min)
2. **Hair Coloring** - $120.00 (120 min)
3. **Shampoo & Blow Dry** - $25.00 (30 min)
4. **Deep Conditioning Treatment** - $85.00 (45 min)

## Features

✅ **Idempotent**: Safe to run multiple times  
✅ **Error Handling**: Comprehensive error reporting  
✅ **Validation**: Full verification of created data  
✅ **Logging**: Clear progress and status messages  
✅ **Database Safety**: Proper connection management  

## Integration Ready

The created business is immediately ready for:
- WhatsApp webhook testing
- Business routing with code "1234"
- Service booking workflows
- Analytics and reporting tests

For detailed instructions, see `WHATSAPP-TEST-BUSINESS-SETUP.md`.