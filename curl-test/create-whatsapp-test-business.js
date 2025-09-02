/*
 * ## Test Description: Create test business data for WhatsApp simulator testing
 *
 * ### Input:
 * No input required - script creates predefined test data with routing code 1234
 *
 * ### Expected Output:
 * Creates a test business with routing code "1234", test user, salon, and services in the database
 *
 * ### Passes:
 * [ ] Test business created with routing code 1234
 * [ ] Test user created with clerk ID
 * [ ] Salon entry created and linked to business
 * [ ] Multiple test services created
 */

// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test data configuration
const TEST_DATA = {
  user: {
    clerkUserId: 'test-whatsapp-user-clerk-1234',
    phoneNumber: '+19801441675'
  },
  business: {
    id: 'test-whatsapp-business-1234',
    routingCode: '1234',
    name: 'Test Hair Salon',
    phoneNumber: '+19801441675',
    businessType: 'SALON',
    address: '123 Test Street, Test City',
    hoursOfOperation: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '', close: '', closed: true }
    }
  },
  services: [
    {
      id: 'test-service-haircut-1234',
      name: 'Haircut & Style',
      price: 45.99,
      durationMinutes: 60,
      description: 'Professional haircut with basic styling and wash'
    },
    {
      id: 'test-service-coloring-1234',
      name: 'Hair Coloring',
      price: 120.00,
      durationMinutes: 120,
      description: 'Full hair coloring service with professional products'
    },
    {
      id: 'test-service-shampoo-1234',
      name: 'Shampoo & Blow Dry',
      price: 25.00,
      durationMinutes: 30,
      description: 'Hair washing with premium shampoo and blow dry styling'
    },
    {
      id: 'test-service-treatment-1234',
      name: 'Deep Conditioning Treatment',
      price: 85.00,
      durationMinutes: 45,
      description: 'Intensive hair treatment for damaged or dry hair'
    }
  ]
};

async function checkIfBusinessExists() {
  const existingBusiness = await prisma.business.findUnique({
    where: { routingCode: TEST_DATA.business.routingCode }
  });
  return existingBusiness;
}

async function createTestUser() {
  console.log('Creating test user...');
  
  const testUser = await prisma.user.upsert({
    where: { clerkUserId: TEST_DATA.user.clerkUserId },
    update: {
      phoneNumber: TEST_DATA.user.phoneNumber,
    },
    create: {
      clerkUserId: TEST_DATA.user.clerkUserId,
      phoneNumber: TEST_DATA.user.phoneNumber,
    },
  });

  console.log(`✓ Test user created/updated: ${testUser.id}`);
  console.log(`  - Clerk ID: ${testUser.clerkUserId}`);
  console.log(`  - Phone: ${testUser.phoneNumber}`);
  
  return testUser;
}

async function createTestBusiness(userId) {
  console.log('Creating test business...');
  
  const testBusiness = await prisma.business.upsert({
    where: { id: TEST_DATA.business.id },
    update: {
      routingCode: TEST_DATA.business.routingCode,
      name: TEST_DATA.business.name,
      phoneNumber: TEST_DATA.business.phoneNumber,
      businessType: TEST_DATA.business.businessType,
      address: TEST_DATA.business.address,
      hoursOfOperation: TEST_DATA.business.hoursOfOperation,
    },
    create: {
      id: TEST_DATA.business.id,
      ownerId: userId,
      routingCode: TEST_DATA.business.routingCode,
      name: TEST_DATA.business.name,
      phoneNumber: TEST_DATA.business.phoneNumber,
      businessType: TEST_DATA.business.businessType,
      address: TEST_DATA.business.address,
      hoursOfOperation: TEST_DATA.business.hoursOfOperation,
    },
  });

  console.log(`✓ Test business created/updated: ${testBusiness.id}`);
  console.log(`  - Routing Code: ${testBusiness.routingCode}`);
  console.log(`  - Name: ${testBusiness.name}`);
  console.log(`  - Phone: ${testBusiness.phoneNumber}`);
  console.log(`  - Type: ${testBusiness.businessType}`);
  console.log(`  - Address: ${testBusiness.address}`);
  
  return testBusiness;
}

async function createSalonEntry(businessId) {
  console.log('Creating salon entry...');
  
  const salon = await prisma.salon.upsert({
    where: { businessId: businessId },
    update: {},
    create: {
      businessId: businessId,
    },
  });

  console.log(`✓ Salon entry created: ${salon.id}`);
  return salon;
}

async function createTestServices(businessId) {
  console.log('Creating test services...');
  
  const services = await Promise.all(
    TEST_DATA.services.map(async (serviceData) => {
      const service = await prisma.service.upsert({
        where: { id: serviceData.id },
        update: {
          name: serviceData.name,
          price: serviceData.price,
          durationMinutes: serviceData.durationMinutes,
          description: serviceData.description,
        },
        create: {
          id: serviceData.id,
          businessId: businessId,
          name: serviceData.name,
          price: serviceData.price,
          durationMinutes: serviceData.durationMinutes,
          description: serviceData.description,
        },
      });
      
      console.log(`  ✓ Service: ${service.name} ($${service.price}, ${service.durationMinutes}min)`);
      return service;
    })
  );

  console.log(`✓ Created ${services.length} test services`);
  return services;
}

async function createTestBusinessData() {
  console.log('🚀 Starting WhatsApp test business creation...');
  console.log('=====================================');

  try {
    // Check if business already exists
    const existingBusiness = await checkIfBusinessExists();
    if (existingBusiness) {
      console.log(`⚠️  Business with routing code "${TEST_DATA.business.routingCode}" already exists!`);
      console.log(`   Business ID: ${existingBusiness.id}`);
      console.log(`   Business Name: ${existingBusiness.name}`);
      console.log('   Proceeding to update existing business and services...');
      console.log('');
    }

    // Create test user
    const testUser = await createTestUser();
    console.log('');

    // Create test business
    const testBusiness = await createTestBusiness(testUser.id);
    console.log('');

    // Create salon entry
    const salon = await createSalonEntry(testBusiness.id);
    console.log('');

    // Create test services
    const services = await createTestServices(testBusiness.id);
    console.log('');

    console.log('=====================================');
    console.log('🎉 Test business setup completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   • Business ID: ${testBusiness.id}`);
    console.log(`   • Routing Code: ${testBusiness.routingCode}`);
    console.log(`   • Business Name: ${testBusiness.name}`);
    console.log(`   • Phone Number: ${testBusiness.phoneNumber}`);
    console.log(`   • Services Created: ${services.length}`);
    console.log('');
    console.log('🔗 WhatsApp Integration:');
    console.log(`   • Messages to routing code "${testBusiness.routingCode}" will be handled by this business`);
    console.log(`   • Business phone: ${testBusiness.phoneNumber}`);
    console.log('');
    console.log('✅ The business is now ready for WhatsApp simulator testing!');

    return {
      user: testUser,
      business: testBusiness,
      salon: salon,
      services: services
    };

  } catch (error) {
    console.error('❌ Error creating test business:', error);
    
    if (error.code === 'P2002') {
      console.error('   → Unique constraint violation. This might be a duplicate routing code or business ID.');
    } else if (error.code === 'P2003') {
      console.error('   → Foreign key constraint failed. Check if referenced records exist.');
    } else {
      console.error('   → Unexpected database error:', error.message);
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('📡 Database connection closed.');
  }
}

// Handle script execution
async function main() {
  try {
    await createTestBusinessData();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Only run if called directly (not imported)
if (require.main === module) {
  main();
}

module.exports = {
  createTestBusinessData,
  TEST_DATA
};