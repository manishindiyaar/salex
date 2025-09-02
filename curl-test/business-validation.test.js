/*
 * ## Test Description: Business API response validation against shared types
 *
 * ### Input:
 * Test requests to business endpoints to validate response structures match shared-types definitions.
 *
 * ### Expected Output:
 * All responses conform to ApiResponse<T> format and Business/Service type definitions.
 *
 * ### Passes:
 * [ ] Test case 1 passed: Business objects match Business interface.
 * [ ] Test case 2 passed: ApiResponse structure is consistent.
 * [ ] Test case 3 passed: Service objects match Service interface.
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.CLERK_JWT_TOKEN || 'sess_30XtImo791vpBe53yYfLfGEOJzx';

console.log('=== Business API Validation Test ===');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Using JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
console.log('');

// Type validation functions based on shared-types
function validateApiResponse(response, expectedDataType) {
  const errors = [];
  
  // Check required ApiResponse fields
  if (typeof response.success !== 'boolean') {
    errors.push('ApiResponse.success must be boolean');
  }
  
  if (response.success && response.data === undefined) {
    errors.push('ApiResponse.data is required when success is true');
  }
  
  if (!response.success && !response.error) {
    errors.push('ApiResponse.error is required when success is false');
  }
  
  if (response.message && typeof response.message !== 'string') {
    errors.push('ApiResponse.message must be string if provided');
  }
  
  // Validate data type if provided
  if (response.success && response.data !== null && response.data !== undefined) {
    if (expectedDataType === 'Business') {
      const businessErrors = validateBusiness(response.data);
      errors.push(...businessErrors);
    } else if (expectedDataType === 'Business[]') {
      if (!Array.isArray(response.data)) {
        errors.push('Expected Business array but got non-array');
      } else {
        response.data.forEach((business, index) => {
          const businessErrors = validateBusiness(business, `[${index}]`);
          errors.push(...businessErrors);
        });
      }
    } else if (expectedDataType === 'Service[]') {
      if (!Array.isArray(response.data)) {
        errors.push('Expected Service array but got non-array');
      } else {
        response.data.forEach((service, index) => {
          const serviceErrors = validateService(service, `[${index}]`);
          errors.push(...serviceErrors);
        });
      }
    }
  }
  
  return errors;
}

function validateBusiness(business, prefix = '') {
  const errors = [];
  const p = prefix ? `${prefix}.` : '';
  
  if (!business || typeof business !== 'object') {
    errors.push(`${p}Business must be an object`);
    return errors;
  }
  
  // Required fields from Business interface
  const requiredFields = [
    { name: 'id', type: 'string' },
    { name: 'ownerId', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'businessType', type: 'string' },
    { name: 'phoneNumber', type: 'string' },
    { name: 'address', type: 'string' },
    { name: 'createdAt', type: 'string' }, // ISO date string
    { name: 'updatedAt', type: 'string' }  // ISO date string
  ];
  
  requiredFields.forEach(field => {
    if (business[field.name] === undefined || business[field.name] === null) {
      errors.push(`${p}Business.${field.name} is required`);
    } else if (typeof business[field.name] !== field.type) {
      errors.push(`${p}Business.${field.name} must be ${field.type}, got ${typeof business[field.name]}`);
    }
  });
  
  // Validate businessType enum
  if (business.businessType && business.businessType !== 'SALON') {
    errors.push(`${p}Business.businessType must be 'SALON', got '${business.businessType}'`);
  }
  
  // Validate optional salon field
  if (business.salon !== undefined) {
    const salonErrors = validateSalon(business.salon, `${p}salon`);
    errors.push(...salonErrors);
  }
  
  // Validate optional hoursOfOperation
  if (business.hoursOfOperation !== undefined) {
    if (typeof business.hoursOfOperation !== 'object') {
      errors.push(`${p}Business.hoursOfOperation must be object if provided`);
    }
  }
  
  return errors;
}

function validateSalon(salon, prefix = '') {
  const errors = [];
  const p = prefix ? `${prefix}.` : '';
  
  if (!salon || typeof salon !== 'object') {
    errors.push(`${p}Salon must be an object`);
    return errors;
  }
  
  // Required fields from Salon interface
  const requiredFields = [
    { name: 'id', type: 'string' },
    { name: 'businessId', type: 'string' }
  ];
  
  requiredFields.forEach(field => {
    if (salon[field.name] === undefined || salon[field.name] === null) {
      errors.push(`${p}Salon.${field.name} is required`);
    } else if (typeof salon[field.name] !== field.type) {
      errors.push(`${p}Salon.${field.name} must be ${field.type}, got ${typeof salon[field.name]}`);
    }
  });
  
  return errors;
}

function validateService(service, prefix = '') {
  const errors = [];
  const p = prefix ? `${prefix}.` : '';
  
  if (!service || typeof service !== 'object') {
    errors.push(`${p}Service must be an object`);
    return errors;
  }
  
  // Required fields from Service interface
  const requiredFields = [
    { name: 'id', type: 'string' },
    { name: 'businessId', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'price', type: 'number' },
    { name: 'durationMinutes', type: 'number' },
    { name: 'createdAt', type: 'string' },
    { name: 'updatedAt', type: 'string' }
  ];
  
  requiredFields.forEach(field => {
    if (service[field.name] === undefined || service[field.name] === null) {
      errors.push(`${p}Service.${field.name} is required`);
    } else if (typeof service[field.name] !== field.type) {
      errors.push(`${p}Service.${field.name} must be ${field.type}, got ${typeof service[field.name]}`);
    }
  });
  
  // Validate number constraints
  if (typeof service.price === 'number' && service.price < 0) {
    errors.push(`${p}Service.price must be non-negative`);
  }
  
  if (typeof service.durationMinutes === 'number' && service.durationMinutes <= 0) {
    errors.push(`${p}Service.durationMinutes must be positive`);
  }
  
  return errors;
}

async function setupTestBusiness() {
  console.log('🔧 Setting up test business for validation...');
  
  try {
    // Get or create business
    const meResponse = await axios.get(`${API_BASE_URL}/api/v1/businesses/me`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (meResponse.data.success && meResponse.data.data) {
      return meResponse.data.data.id;
    }
    
    // Create business if none exists
    const createResponse = await axios.post(`${API_BASE_URL}/api/v1/businesses`, {
      name: "Validation Test Business",
      businessType: "SALON",
      phoneNumber: "+19801441675",
      address: "123 Validation Street, New York, NY 10001",
      hoursOfOperation: {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "20:00", closed: false },
        saturday: { open: "08:00", close: "17:00", closed: false },
        sunday: { open: "", close: "", closed: true }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (createResponse.data.success && createResponse.data.data) {
      return createResponse.data.data.id;
    }
    
    throw new Error('Could not create test business');
  } catch (error) {
    console.log(`❌ Setup failed: ${error.message}`);
    throw error;
  }
}

async function testBusinessMeValidation() {
  console.log('\n🧪 Test 1: Validate GET /api/v1/businesses/me response');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/me`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const errors = validateApiResponse(response.data, 'Business');
    
    if (errors.length === 0) {
      console.log('✅ All validations passed');
      console.log('✅ Test 1 PASSED: Business /me response structure is valid');
      return true;
    } else {
      console.log('❌ Validation errors found:');
      errors.forEach(error => console.log(`   - ${error}`));
      console.log('❌ Test 1 FAILED: Business /me response structure is invalid');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 1 FAILED: ${error.message}`);
    return false;
  }
}

async function testBusinessCreateValidation() {
  console.log('\n🧪 Test 2: Validate POST /api/v1/businesses response');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/businesses`, {
      name: "Validation Test Create Business",
      businessType: "SALON",
      phoneNumber: "+19801441677",
      address: "456 Create Test Street, New York, NY 10001",
      hoursOfOperation: {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "20:00", closed: false },
        saturday: { open: "08:00", close: "17:00", closed: false },
        sunday: { open: "", close: "", closed: true }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const errors = validateApiResponse(response.data, 'Business');
    
    if (errors.length === 0) {
      console.log('✅ All validations passed');
      console.log('✅ Test 2 PASSED: Business create response structure is valid');
      return true;
    } else {
      console.log('❌ Validation errors found:');
      errors.forEach(error => console.log(`   - ${error}`));
      console.log('❌ Test 2 FAILED: Business create response structure is invalid');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 2 FAILED: ${error.message}`);
    if (error.response) {
      console.log(`❌ Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testBusinessGetByIdValidation(businessId) {
  console.log('\n🧪 Test 3: Validate GET /api/v1/businesses/{id} response');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${businessId}`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const errors = validateApiResponse(response.data, 'Business');
    
    if (errors.length === 0) {
      console.log('✅ All validations passed');
      console.log('✅ Test 3 PASSED: Business get by ID response structure is valid');
      return true;
    } else {
      console.log('❌ Validation errors found:');
      errors.forEach(error => console.log(`   - ${error}`));
      console.log('❌ Test 3 FAILED: Business get by ID response structure is invalid');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 3 FAILED: ${error.message}`);
    return false;
  }
}

async function testBusinessServicesValidation(businessId) {
  console.log('\n🧪 Test 4: Validate GET /api/v1/businesses/{id}/services response');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${businessId}/services`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const errors = validateApiResponse(response.data, 'Service[]');
    
    if (errors.length === 0) {
      console.log('✅ All validations passed');
      console.log('✅ Test 4 PASSED: Business services response structure is valid');
      return true;
    } else {
      console.log('❌ Validation errors found:');
      errors.forEach(error => console.log(`   - ${error}`));
      console.log('❌ Test 4 FAILED: Business services response structure is invalid');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 4 FAILED: ${error.message}`);
    return false;
  }
}

async function testBusinessBookingsValidation(businessId) {
  console.log('\n🧪 Test 5: Validate GET /api/v1/businesses/{id}/bookings response');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/businesses/${businessId}/bookings`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // For bookings, we just validate the ApiResponse structure since booking types may not be fully defined
    const errors = [];
    
    if (typeof response.data.success !== 'boolean') {
      errors.push('ApiResponse.success must be boolean');
    }
    
    if (response.data.success && !Array.isArray(response.data.data)) {
      errors.push('Bookings data must be an array');
    }
    
    if (errors.length === 0) {
      console.log('✅ All validations passed');
      console.log('✅ Test 5 PASSED: Business bookings response structure is valid');
      return true;
    } else {
      console.log('❌ Validation errors found:');
      errors.forEach(error => console.log(`   - ${error}`));
      console.log('❌ Test 5 FAILED: Business bookings response structure is invalid');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test 5 FAILED: ${error.message}`);
    return false;
  }
}

// Run all validation tests
async function runTests() {
  const results = [];
  let businessId;
  
  console.log('🚀 Starting Business API Validation Tests...\n');
  
  try {
    businessId = await setupTestBusiness();
    
    results.push(await testBusinessMeValidation());
    results.push(await testBusinessCreateValidation());
    results.push(await testBusinessGetByIdValidation(businessId));
    results.push(await testBusinessServicesValidation(businessId));
    results.push(await testBusinessBookingsValidation(businessId));
    
  } catch (error) {
    console.log(`❌ Test setup failed: ${error.message}`);
    process.exit(1);
  }
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Validation Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (businessId) {
    console.log(`💡 Test Business ID used: ${businessId}`);
  }
  
  console.log('\n🔍 Type Safety Validation:');
  console.log('✅ ApiResponse<T> structure validation');
  console.log('✅ Business interface compliance');
  console.log('✅ Salon interface compliance');
  console.log('✅ Service interface compliance');
  console.log('✅ BusinessType enum validation');
  
  if (passed === total) {
    console.log('\n🎉 All validation tests passed!');
    console.log('The business API responses conform to shared-types definitions.');
    process.exit(0);
  } else {
    console.log('\n💥 Some validation tests failed!');
    console.log('The API responses may not match the expected shared-types definitions.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});