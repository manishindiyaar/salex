#!/bin/bash

# Salex API Testing Script
# Comprehensive curl tests for all API endpoints
# Usage: ./test-api.sh [base_url] [auth_token]
# Defaults: base_url=http://localhost:3000, auth_token=optional

# Configuration
BASE_URL=${1:-http://localhost:3000}
AUTH_TOKEN="${2:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Headers
COMMON_HEADERS="Content-Type: application/json"
if [ -n "$AUTH_TOKEN" ]; then
    AUTH_HEADER="Authorization: Bearer $AUTH_TOKEN"
fi

# Test counter
TEST_COUNT=0
PASSED=0
FAILED=0

# Helper function for making requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expect_status=${4:-200}
    
    local headers="$COMMON_HEADERS"
    if [ -n "$AUTH_HEADER" ]; then
        headers="$headers\n$AUTH_HEADER"
    fi
    
    echo -e "${YELLOW}Testing $method $endpoint${NC}"
    
    local curl_cmd="curl -s -w \"HTTPSTATUS:%{http_code}\" -X $method \"$BASE_URL$endpoint\""
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    while IFS= read -r header; do
        if [ -n "$header" ]; then
            curl_cmd="$curl_cmd -H '$header'"
        fi
    done <<< "$headers"
    
    local response=$(eval $curl_cmd)
    local status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    local body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$status" == "$expect_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expect_status, Got: $status)"
        echo "Response: $body"
        ((FAILED++))
    fi
    
    ((TEST_COUNT++))
    echo ""
}

# Helper function to test endpoints without auth
test_public_endpoints() {
    echo "=== Testing Public Endpoints ==="
    echo
    
    # Health check
    make_request "GET" "/health" "" 200
    
    # Public business lookup
    make_request "GET" "/business/verify/123" "" 200
    
    # Test invalid route
    make_request "GET" "/nonexistent" "" 404
    
    echo -e "${GREEN}✓ Public endpoints tested${NC}"
    echo
}

# Helper function to test authentication endpoints
test_auth_endpoints() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${YELLOW}Skipping auth endpoints (no auth token provided)${NC}"
        return
    fi
    
    echo "=== Testing Authentication Endpoints ==="
    echo
    
    # Get current user
    make_request "GET" "/auth/me" "" 200
    
    # Update user profile
    local update_data='{"name":"Test User","email":"test@example.com"}'
    make_request "PUT" "/auth/me" "$update_data" 200
    
    echo -e "${GREEN}✓ Auth endpoints tested${NC}"
    echo
}

# Helper function to test business endpoints
test_business_endpoints() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${YELLOW}Skipping business endpoints (no auth token provided)${NC}"
        return
    fi
    
    echo "=== Testing Business Endpoints ==="
    echo
    
    # List businesses
    make_request "GET" "/business" "" 200
    
    # Create new business
    local business_data='{"name":"Test Business","type":"SALON","description":"A test business"}'
    make_request "POST" "/business" "$business_data" 201
    
    # Get business details (assuming business ID 1 exists)
    make_request "GET" "/business/1" "" 200
    
    # Update business
    local update_data='{"name":"Updated Test Business","description":"Updated description"}'
    make_request "PUT" "/business/1" "$update_data" 200
    
    echo -e "${GREEN}✓ Business endpoints tested${NC}"
    echo
}

# Helper function to test service endpoints
test_service_endpoints() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${YELLOW}Skipping service endpoints (no auth token provided)${NC}"
        return
    fi
    
    echo "=== Testing Service Endpoints ==="
    echo
    
    # List services for business 1
    make_request "GET" "/business/1/services" "" 200
    
    # Create new service
    local service_data='{"name":"Haircut","description":"Professional haircut","duration":30,"price":25.99}'
    make_request "POST" "/business/1/services" "$service_data" 201
    
    # Get service details (assuming service ID 1 exists)
    make_request "GET" "/business/1/services/1" "" 200
    
    # Update service
    local update_data='{"price":29.99,"duration":45}'
    make_request "PUT" "/business/1/services/1" "$update_data" 200
    
    echo -e "${GREEN}✓ Service endpoints tested${NC}"
    echo
}

# Helper function to test booking endpoints
test_booking_endpoints() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${YELLOW}Skipping booking endpoints (no auth token provided)${NC}"
        return
    fi
    
    echo "=== Testing Booking Endpoints ==="
    echo
    
    # List bookings
    make_request "GET" "/bookings" "" 200
    
    # Create new booking
    local booking_data='{"serviceId":1,"customerName":"John Doe","customerPhone":"+1234567890","date":"2024-01-15","time":"14:00","notes":"Test booking"}'
    make_request "POST" "/bookings" "$booking_data" 201
    
    # Get booking details
    make_request "GET" "/bookings/1" "" 200
    
    # Update booking status
    local update_data='{"status":"CONFIRMED"}'
    make_request "PUT" "/bookings/1" "$update_data" 200
    
    echo -e "${GREEN}✓ Booking endpoints tested${NC}"
    echo
}

# Helper function to test timeslot endpoints
test_timeslot_endpoints() {
    echo "=== Testing Timeslot Endpoints ==="
    echo
    
    # Get available timeslots
    local params="?businessId=1&serviceId=1&date=2024-01-15"
    make_request "GET" "/timeslots$params" "" 200
    
    echo -e "${GREEN}✓ Timeslot endpoints tested${NC}"
    echo
}

# Helper function to test analytics endpoints
test_analytics_endpoints() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${YELLOW}Skipping analytics endpoints (no auth token provided)${NC}"
        return
    fi
    
    echo "=== Testing Analytics Endpoints ==="
    echo
    
    # Get analytics for business 1
    local params="?startDate=2024-01-01&endDate=2024-01-31"
    make_request "GET" "/analytics/1$params" "" 200
    
    # Get daily analytics
    make_request "GET" "/analytics/1/daily/2024-01-15" "" 200
    
    echo -e "${GREEN}✓ Analytics endpoints tested${NC}"
    echo
}

# Main execution
main() {
    echo "=== Salex API Testing Started ==="
    echo "Base URL: $BASE_URL"
    echo "Authentication: $([ -n "$AUTH_TOKEN" ] && echo "Included" || echo "Not required for public endpoints")"
    echo
    
    # Run tests
    test_public_endpoints
    test_timeslot_endpoints
    
    if [ -n "$AUTH_TOKEN" ]; then
        test_auth_endpoints
        test_business_endpoints
        test_service_endpoints
        test_booking_endpoints
        test_analytics_endpoints
    fi
    
    # Print summary
    echo "=== Test Summary ==="
    echo "Total Tests: $TEST_COUNT"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed. See above for details.${NC}"
        exit 1
    fi
}

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed.${NC}"
    exit 1
fi

# Run main function
main "$@"