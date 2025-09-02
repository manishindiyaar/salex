import { PrismaClient, BusinessType } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestBusiness() {
  console.log('Creating test business for WhatsApp POC...');

  try {
    // First, create or find a test user
    // Use findFirst/create to avoid type drift if UserWhereUniqueInput hasn't refreshed in editor
    let testUser = await prisma.user.findFirst({
      where: { firebaseUid: 'test-whatsapp-user-firebase-uid' },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          firebaseUid: 'test-whatsapp-user-firebase-uid',
          phoneNumber: '919801441675',
        },
      });
    }

    console.log(`Test user created/found: ${testUser.id}`);

    // Create test business mapped to the POC phone number
    const testBusiness = await prisma.business.upsert({
      where: { id: 'test-whatsapp-business-id' },
      update: {
        phoneNumber: '919801441675',
        name: 'WhatsApp POC Test Business',
        businessType: BusinessType.SALON,
        address: 'Test Address, India',
        hoursOfOperation: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '10:00', close: '16:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: true },
        },
      },
      create: {
        id: 'test-whatsapp-business-id',
        ownerId: testUser.id,
        phoneNumber: '919801441675',
        name: 'WhatsApp POC Test Business',
        businessType: BusinessType.SALON,
        address: 'Test Address, India',
        hoursOfOperation: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '10:00', close: '16:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: true },
        },
      },
    });

    console.log(`Test business created/updated: ${testBusiness.id}`);
    console.log(`Business name: ${testBusiness.name}`);
    console.log(`Business phone: ${testBusiness.phoneNumber}`);

    // Create a salon entry for the business
    const salon = await prisma.salon.upsert({
      where: { businessId: testBusiness.id },
      update: {},
      create: {
        businessId: testBusiness.id,
      },
    });

    console.log(`Salon entry created: ${salon.id}`);

    // Create some test services
    const services = await Promise.all([
      prisma.service.upsert({
        where: { id: 'test-service-haircut' },
        update: {},
        create: {
          id: 'test-service-haircut',
          businessId: testBusiness.id,
          name: 'Hair Cut',
          price: 500,
          durationMinutes: 30,
        },
      }),
      prisma.service.upsert({
        where: { id: 'test-service-shampoo' },
        update: {},
        create: {
          id: 'test-service-shampoo',
          businessId: testBusiness.id,
          name: 'Hair Wash & Shampoo',
          price: 200,
          durationMinutes: 15,
        },
      }),
      prisma.service.upsert({
        where: { id: 'test-service-styling' },
        update: {},
        create: {
          id: 'test-service-styling',
          businessId: testBusiness.id,
          name: 'Hair Styling',
          price: 800,
          durationMinutes: 45,
        },
      }),
    ]);

    console.log(`Created ${services.length} test services`);

    console.log('Test business setup completed successfully!');
    console.log('WhatsApp messages to 919801441675 will now be handled by this business.');

  } catch (error) {
    console.error('Error creating test business:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestBusiness()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
