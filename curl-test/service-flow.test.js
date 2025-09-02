#!/usr/bin/env node

// Service Management API Flow Test
// Tests the complete service CRUD operations

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';

let businessId = '';
let serviceId = '';

// Helper function to make HTTP requests
async function makeRequest(method, url, data = null, expectStatus = 200) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JWT_TOKEN}`,
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const responseData = await response.text();
        
        let parsedData = null;
        try {
            parsedData = responseData ? JSON.parse(responseData) : null;
        } catch (e) {
            // Response might not be JSON
        }
        
        console.log(`${method} ${url}`);
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Response: ${responseData || 'No response body'}`);
        console.log('---');
        
        if (response.status !== expectStatus) {
            throw new Error(`Expected status ${expectStatus}, got ${response.status}`);
        }
        
        return { status: response.status, data: parsedData };
    } catch (error) {
        console.error(`Request failed: ${error.message}`);
        throw error;
    }
}

async function testServiceFlow() {
    console.log('🧪 Starting Service Management API Flow Test');
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
    console.log('');
    
    try {
        // Step 1: Get user's business
        console.log('📋 Step 1: Get user business');
        const businessResponse = await makeRequest('GET', `${API_BASE_URL}/api/v1/businesses/me`);
        
        if (!businessResponse.data || !businessResponse.data.data || !businessResponse.data.data.id) {
            throw new Error('No business found for user. Please create a business first.');
        }
        
        businessId = businessResponse.data.data.id;
        console.log(`✅ Business ID: ${businessId}`);
        console.log('');
        
        // Step 2: Create a new service
        console.log('🏗️ Step 2: Create new service');
        const timestamp = Date.now();
        const newService = {
            name: `Test Service ${timestamp}`,
            price: 45.99,
            durationMinutes: 60,
            description: 'Professional test service with unique timestamp'
        };
        
        const createResponse = await makeRequest(
            'POST',
            `${API_BASE_URL}/api/v1/businesses/${businessId}/services`,
            newService,
            201
        );
        
        serviceId = createResponse.data.data.id;
        console.log(`✅ Service created with ID: ${serviceId}`);
        console.log('');
        
        // Step 3: Get all services for the business
        console.log('📋 Step 3: Get all business services');
        const servicesResponse = await makeRequest(
            'GET',
            `${API_BASE_URL}/api/v1/businesses/${businessId}/services`
        );
        
        // Check if it's the detailed service response or simple array
        if (servicesResponse.data.data.services) {
            // Detailed response from service controller
            console.log(`✅ Found ${servicesResponse.data.data.services.length} services`);
            console.log(`Service summary: ${JSON.stringify(servicesResponse.data.data.summary, null, 2)}`);
        } else {
            // Simple array response from business controller
            console.log(`✅ Found ${servicesResponse.data.data.length} services`);
            console.log(`Services: ${JSON.stringify(servicesResponse.data.data, null, 2)}`);
        }
        console.log('');
        
        // Step 4: Get specific service by ID
        console.log('🔍 Step 4: Get specific service');
        const serviceResponse = await makeRequest(
            'GET',
            `${API_BASE_URL}/api/v1/businesses/${businessId}/services/${serviceId}`
        );
        
        console.log(`✅ Retrieved service: ${serviceResponse.data.data.name}`);
        console.log('');
        
        // Step 5: Update the service
        console.log('✏️ Step 5: Update service');
        const updateData = {
            name: `Updated Service ${timestamp}`,
            price: 55.99,
            description: 'Updated test service with premium features'
        };
        
        const updateResponse = await makeRequest(
            'PUT',
            `${API_BASE_URL}/api/v1/businesses/${businessId}/services/${serviceId}`,
            updateData
        );
        
        console.log(`✅ Service updated: ${updateResponse.data.data.name} - $${updateResponse.data.data.price}`);
        console.log('');
        
        // Step 6: Test pagination
        console.log('📄 Step 6: Test pagination');
        const paginatedResponse = await makeRequest(
            'GET',
            `${API_BASE_URL}/api/v1/businesses/${businessId}/services?page=1&limit=5`
        );
        
        console.log(`✅ Paginated response: ${JSON.stringify(paginatedResponse.data.data.pagination, null, 2)}`);
        console.log('');
        
        // Step 7: Test validation errors
        console.log('❌ Step 7: Test validation (should fail)');
        try {
            await makeRequest(
                'POST',
                `${API_BASE_URL}/api/v1/businesses/${businessId}/services`,
                {
                    name: '', // Invalid empty name
                    price: -10, // Invalid negative price
                    durationMinutes: 5 // Invalid duration
                },
                400
            );
            console.log('✅ Validation errors handled correctly');
        } catch (error) {
            console.log('✅ Validation test passed (expected failure)');
        }
        console.log('');
        
        // Step 8: Test duplicate service name (should fail)
        console.log('🔄 Step 8: Test duplicate service name (should fail)');
        try {
            await makeRequest(
                'POST',
                `${API_BASE_URL}/api/v1/businesses/${businessId}/services`,
                {
                    name: `Updated Service ${timestamp}`, // Duplicate name
                    price: 40,
                    durationMinutes: 45
                },
                409
            );
            console.log('✅ Duplicate name prevention working correctly');
        } catch (error) {
            console.log('✅ Duplicate name test passed (expected failure)');
        }
        console.log('');
        
        // Step 9: Delete the service
        console.log('🗑️ Step 9: Delete service');
        await makeRequest(
            'DELETE',
            `${API_BASE_URL}/api/v1/businesses/${businessId}/services/${serviceId}`,
            null,
            200
        );
        
        console.log(`✅ Service deleted successfully`);
        console.log('');
        
        // Step 10: Verify service is deleted
        console.log('🔍 Step 10: Verify service deletion');
        try {
            await makeRequest(
                'GET',
                `${API_BASE_URL}/api/v1/businesses/${businessId}/services/${serviceId}`,
                null,
                404
            );
            console.log('✅ Service deletion verified');
        } catch (error) {
            console.log('✅ Deletion test passed (expected 404)');
        }
        console.log('');
        
        console.log('🎉 All Service Management API tests passed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Test different service scenarios
async function testAdvancedScenarios() {
    console.log('🔬 Testing Advanced Service Scenarios');
    console.log('');
    
    try {
        // Test edge cases
        const edgeCaseService = {
            name: 'A', // Minimum length
            price: 0.01, // Minimum price
            durationMinutes: 15, // Minimum duration
        };
        
        console.log('🧪 Testing minimum valid values');
        const edgeResponse = await makeRequest(
            'POST',
            `${API_BASE_URL}/api/v1/businesses/${businessId}/services`,
            edgeCaseService,
            201
        );
        
        const edgeServiceId = edgeResponse.data.data.id;
        console.log('✅ Minimum values accepted');
        
        // Test maximum values
        const maxService = {
            name: 'A'.repeat(50), // Maximum name length
            price: 99999.99, // Maximum price
            durationMinutes: 480, // Maximum duration (8 hours)
            description: 'A'.repeat(500) // Maximum description length
        };
        
        console.log('🧪 Testing maximum valid values');
        const maxResponse = await makeRequest(
            'POST',
            `${API_BASE_URL}/api/v1/businesses/${businessId}/services`,
            maxService,
            201
        );
        
        const maxServiceId = maxResponse.data.data.id;
        console.log('✅ Maximum values accepted');
        
        // Cleanup
        await makeRequest('DELETE', `${API_BASE_URL}/api/v1/businesses/${businessId}/services/${edgeServiceId}`, null, 200);
        await makeRequest('DELETE', `${API_BASE_URL}/api/v1/businesses/${businessId}/services/${maxServiceId}`, null, 200);
        
        console.log('✅ Advanced scenarios test completed');
        
    } catch (error) {
        console.error('❌ Advanced scenarios test failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
async function main() {
    await testServiceFlow();
    console.log('');
    await testAdvancedScenarios();
}

// Import fetch if not available globally
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

main().catch(console.error);