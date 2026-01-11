#!/bin/bash

# Resource & Staff API Test Suite
# Complete cURL commands for testing all endpoints

# ==============================================
# SETUP
# ==============================================

# Set your environment variables
export API_BASE="http://localhost:3000"
export TOKEN="your-jwt-token-here"
export BUSINESS_ID="your-business-id-here"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================
Resource & Staff API Test Suite
==============================================${NC}\n"

# ==============================================
# RESOURCE ENDPOINTS
# ==============================================

echo -e "${GREEN}1. Create Single Resource${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/resources" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Chair 1",
    "description": "Window seat with good lighting"
  }' | jq

echo -e "\n${GREEN}2. Bulk Create Resources${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/resources/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "count": 5,
    "prefix": "Chair"
  }' | jq

echo -e "\n${GREEN}3. List All Resources${NC}"
curl -X GET "$API_BASE/v1/businesses/$BUSINESS_ID/resources" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n${GREEN}4. Get Single Resource${NC}"
export RESOURCE_ID="clx123abc..."
curl -X GET "$API_BASE/v1/businesses/$BUSINESS_ID/resources/$RESOURCE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n${GREEN}5. Update Resource${NC}"
curl -X PATCH "$API_BASE/v1/businesses/$BUSINESS_ID/resources/$RESOURCE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "VIP Chair 1",
    "description": "Premium station with massage chair"
  }' | jq

echo -e "\n${GREEN}6. Deactivate Resource${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/resources/$RESOURCE_ID/deactivate" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n${GREEN}7. Reactivate Resource${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/resources/$RESOURCE_ID/reactivate" \
  -H "Authorization: Bearer $TOKEN" | jq

# ==============================================
# STAFF ENDPOINTS
# ==============================================

echo -e "\n${BLUE}==============================================
STAFF ENDPOINTS
==============================================${NC}\n"

echo -e "${GREEN}8. Create Staff Member${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Priya Sharma",
    "phone": "+919876543210"
  }' | jq

echo -e "\n${GREEN}9. Create Staff with Linked Resources${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Rahul Kumar",
    "phone": "+919876543211",
    "linkedResourceIds": ["'$RESOURCE_ID'"]
  }' | jq

echo -e "\n${GREEN}10. List All Staff${NC}"
curl -X GET "$API_BASE/v1/businesses/$BUSINESS_ID/staff" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n${GREEN}11. Get Single Staff Member${NC}"
export STAFF_ID="clx789ghi..."
curl -X GET "$API_BASE/v1/businesses/$BUSINESS_ID/staff/$STAFF_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n${GREEN}12. Update Staff Member${NC}"
curl -X PATCH "$API_BASE/v1/businesses/$BUSINESS_ID/staff/$STAFF_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Priya Sharma (Senior Stylist)",
    "phone": "+919876543210"
  }' | jq

echo -e "\n${GREEN}13. Deactivate Staff${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/staff/$STAFF_ID/deactivate" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n${GREEN}14. Reactivate Staff${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/staff/$STAFF_ID/reactivate" \
  -H "Authorization: Bearer $TOKEN" | jq

# ==============================================
# RESOURCE-STAFF LINKING
# ==============================================

echo -e "\n${BLUE}==============================================
RESOURCE-STAFF LINKING
==============================================${NC}\n"

echo -e "${GREEN}15. Link Staff to Resource${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/staff/$STAFF_ID/link-resource" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "resourceId": "'$RESOURCE_ID'",
    "isPrimary": true
  }' | jq

echo -e "\n${GREEN}16. Get Linked Resources for Staff${NC}"
curl -X GET "$API_BASE/v1/businesses/$BUSINESS_ID/staff/$STAFF_ID/linked-resources" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n${GREEN}17. Unlink Staff from Resource${NC}"
curl -X DELETE "$API_BASE/v1/businesses/$BUSINESS_ID/staff/$STAFF_ID/link-resource/$RESOURCE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# ==============================================
# AVAILABILITY ENDPOINTS
# ==============================================

echo -e "\n${BLUE}==============================================
AVAILABILITY ENDPOINTS
==============================================${NC}\n"

echo -e "${GREEN}18. Check Availability${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/availability/check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "scheduledAt": "2026-01-10T14:00:00.000Z",
    "durationMinutes": 60
  }' | jq

echo -e "\n${GREEN}19. Check Availability with Preferences${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/availability/check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "scheduledAt": "2026-01-10T14:00:00.000Z",
    "durationMinutes": 60,
    "resourceId": "'$RESOURCE_ID'",
    "staffId": "'$STAFF_ID'"
  }' | jq

echo -e "\n${GREEN}20. Check Multi-Slot Availability${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/availability/check-multi" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "slots": [
      {
        "scheduledAt": "2026-01-10T14:00:00.000Z",
        "durationMinutes": 60
      },
      {
        "scheduledAt": "2026-01-10T15:00:00.000Z",
        "durationMinutes": 60
      },
      {
        "scheduledAt": "2026-01-10T16:00:00.000Z",
        "durationMinutes": 60
      }
    ]
  }' | jq

echo -e "\n${GREEN}21. Get Capacity Info${NC}"
curl -X GET "$API_BASE/v1/businesses/$BUSINESS_ID/availability/capacity" \
  -H "Authorization: Bearer $TOKEN" | jq

# ==============================================
# BOOKING WITH AUTO-ASSIGNMENT
# ==============================================

echo -e "\n${BLUE}==============================================
BOOKING WITH AUTO-ASSIGNMENT
==============================================${NC}\n"

echo -e "${GREEN}22. Create Booking with Auto-Assignment${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerId": "clxcust123...",
    "serviceIds": ["clxserv123..."],
    "scheduledAt": "2026-01-10T14:00:00.000Z",
    "durationMinutes": 60,
    "source": "manual"
  }' | jq

echo -e "\n${GREEN}23. Create Booking with Manual Selection${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerId": "clxcust123...",
    "serviceIds": ["clxserv123..."],
    "scheduledAt": "2026-01-10T15:00:00.000Z",
    "durationMinutes": 60,
    "resourceId": "'$RESOURCE_ID'",
    "staffId": "'$STAFF_ID'",
    "source": "manual"
  }' | jq

echo -e "\n${GREEN}24. Reassign Booking${NC}"
export BOOKING_ID="clxbook123..."
curl -X PATCH "$API_BASE/v1/businesses/$BUSINESS_ID/bookings/$BOOKING_ID/reassign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "resourceId": "'$RESOURCE_ID'",
    "staffId": "'$STAFF_ID'"
  }' | jq

# ==============================================
# ERROR SCENARIOS
# ==============================================

echo -e "\n${BLUE}==============================================
ERROR SCENARIOS (Expected to Fail)
==============================================${NC}\n"

echo -e "${RED}25. Try to Create Duplicate Resource${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/resources" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Chair 1"
  }' | jq

echo -e "\n${RED}26. Try to Deactivate Resource with Active Bookings${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/resources/$RESOURCE_ID/deactivate" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n${RED}27. Try to Book Unavailable Slot${NC}"
curl -X POST "$API_BASE/v1/businesses/$BUSINESS_ID/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customerId": "clxcust123...",
    "serviceIds": ["clxserv123..."],
    "scheduledAt": "2026-01-10T14:00:00.000Z",
    "durationMinutes": 60,
    "resourceId": "already-booked-resource-id",
    "source": "manual"
  }' | jq

echo -e "\n${BLUE}==============================================
Test Suite Complete
==============================================${NC}\n"
