# Resource & Staff API Testing Guide

## Quick Start

### 1. Set Environment Variables

```bash
export API_BASE="http://localhost:3000"
export TOKEN="your-jwt-token-here"
export BUSINESS_ID="your-business-id-here"
```

### 2. Run Complete Test Suite

```bash
cd curl-test
./resource-staff-api-tests.sh
```

## Individual Test Commands

### Resource Management

#### Create Single Resource
```bash
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/resources" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Chair 1", "description": "Window seat"}'
```

#### Bulk Create Resources
```bash
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/resources/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"count": 5, "prefix": "Chair"}'
```

#### List Resources
```bash
curl -X GET "$API_BASE/v1/businesses/$BUSINESS_ID/resources" \
  -H "Authorization: Bearer $TOKEN"
```

#### Update Resource
```bash
curl -X PATCH "$API_BASE/v1/businesses/$BUSINESS_ID/resources/$RESOURCE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "VIP Chair 1"}'
```

#### Deactivate Resource
```bash
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/resources/$RESOURCE_ID/deactivate" \
  -H "Authorization: Bearer $TOKEN"
```

### Staff Management

#### Create Staff
```bash
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Priya Sharma", "phone": "+919876543210"}'
```

#### List Staff
```bash
curl -X GET "$API_BASE/v1/businesses/$BUSINESS_ID/staff" \
  -H "Authorization: Bearer $TOKEN"
```

#### Link Staff to Resource
```bash
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/staff/$STAFF_ID/link-resource" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"resourceId": "'$RESOURCE_ID'", "isPrimary": true}'
```

### Availability Checking

#### Check Availability
```bash
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/availability/check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "scheduledAt": "2026-01-10T14:00:00.000Z",
    "durationMinutes": 60
  }'
```

#### Get Capacity Info
```bash
curl -X GET "$API_BASE/v1/businesses/$BUSINESS_ID/availability/capacity" \
  -H "Authorization: Bearer $TOKEN"
```

## Expected Responses

### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "clx123abc...",
    "businessId": "clx456def...",
    "name": "Chair 1",
    "isActive": true,
    "createdAt": "2026-01-09T10:30:00.000Z"
  }
}
```

### Error Response (409 Conflict)
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Resource with name 'Chair 1' already exists"
  }
}
```

### Availability Response
```json
{
  "success": true,
  "data": {
    "available": true,
    "availableResources": [...],
    "availableStaff": [...],
    "suggestedAssignment": {
      "resourceId": "clx123...",
      "resourceName": "Chair 1",
      "staffId": "clx789...",
      "staffName": "Priya Sharma",
      "reason": "linked_pair_available"
    },
    "effectiveCapacity": 5,
    "currentUtilization": 60
  }
}
```

## Testing Workflow

### 1. Initial Setup
```bash
# Create resources
./resource-staff-api-tests.sh | grep "Bulk Create"

# Create staff
./resource-staff-api-tests.sh | grep "Create Staff"

# Link them
./resource-staff-api-tests.sh | grep "Link Staff"
```

### 2. Test Availability
```bash
# Check if slot is available
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/availability/check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"scheduledAt": "2026-01-10T14:00:00.000Z", "durationMinutes": 60}'
```

### 3. Create Booking
```bash
# Create booking with auto-assignment
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerId": "clxcust123...",
    "serviceIds": ["clxserv123..."],
    "scheduledAt": "2026-01-10T14:00:00.000Z",
    "durationMinutes": 60,
    "source": "manual"
  }'
```

### 4. Verify Assignment
```bash
# Check booking details
curl -X GET "$API_BASE/v1/businesses/$BUSINESS_ID/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Issue: 401 Unauthorized
**Solution**: Check your JWT token is valid and not expired

### Issue: 404 Not Found
**Solution**: Verify the business ID and resource/staff IDs are correct

### Issue: 409 Conflict
**Solution**: This is expected for duplicate names or deactivating resources with active bookings

### Issue: Connection Refused
**Solution**: Make sure the API server is running (`pnpm dev` in apps/api)

## Tips

1. **Use jq for Pretty Output**: Pipe responses through `jq` for formatted JSON
   ```bash
   curl ... | jq
   ```

2. **Save IDs**: Export resource and staff IDs for reuse
   ```bash
   export RESOURCE_ID=$(curl ... | jq -r '.data.id')
   ```

3. **Test Error Cases**: Try creating duplicates, deactivating with bookings, etc.

4. **Check Logs**: Monitor server logs while testing
   ```bash
   # In another terminal
   cd apps/api
   pnpm dev
   ```

## Next Steps

After testing the API:
1. Test the frontend components
2. Verify end-to-end booking flow
3. Test WhatsApp integration
4. Load test with multiple concurrent requests
