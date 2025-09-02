/*
 * ## Test Description: Verify test business data was created correctly for WhatsApp testing
 *
 * ### Input:
 * No input required - verifies the existence of test business with routing code 1234
 *
 * ### Expected Output:
 * Confirms business exists with correct routing code, services, and relationships
 *
 * ### Passes:
 * [ ] Test business found with routing code 1234
 * [ ] All expected services are present
 * [ ] Business relationships are properly set up
 */

// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyTestBusiness() {
  console.log('🔍 Verifying WhatsApp test business setup...');
  console.log('=========================================');

  try {
    // Find business by routing code
    const business = await prisma.business.findUnique({
      where: { routingCode: '1234' },
      include: {
        owner: true,
        salon: true,
        services: {
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!business) {
      console.log('❌ No business found with routing code "1234"');
      console.log('💡 Run the create-whatsapp-test-business.js script first');
      return false;
    }

    // Display business information
    console.log('✅ Test business found!');
    console.log('');
    console.log('📋 Business Details:');
    console.log(`   • ID: ${business.id}`);
    console.log(`   • Routing Code: ${business.routingCode}`);
    console.log(`   • Name: ${business.name}`);
    console.log(`   • Phone: ${business.phoneNumber}`);
    console.log(`   • Type: ${business.businessType}`);
    console.log(`   • Address: ${business.address}`);
    console.log(`   • Created: ${business.createdAt.toISOString()}`);
    console.log('');

    // Display owner information
    console.log('👤 Owner Details:');
    console.log(`   • User ID: ${business.owner.id}`);
    console.log(`   • Clerk ID: ${business.owner.clerkUserId}`);
    console.log(`   • Phone: ${business.owner.phoneNumber}`);
    console.log('');

    // Display salon information
    if (business.salon) {
      console.log('💇 Salon Entry:');
      console.log(`   • Salon ID: ${business.salon.id}`);
      console.log(`   • Linked to Business: ✅`);
      console.log('');
    } else {
      console.log('❌ No salon entry found for this business');
    }

    // Display services
    console.log('🛍️ Services:');
    if (business.services.length === 0) {
      console.log('   ❌ No services found for this business');
    } else {
      business.services.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name}`);
        console.log(`      • Price: $${service.price}`);
        console.log(`      • Duration: ${service.durationMinutes} minutes`);
        if (service.description) {
          console.log(`      • Description: ${service.description}`);
        }
        console.log('');
      });
    }

    // Display business hours
    console.log('🕒 Business Hours:');
    if (business.hoursOfOperation) {
      const hours = business.hoursOfOperation;
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      days.forEach(day => {
        const dayHours = hours[day];
        if (dayHours) {
          if (dayHours.closed) {
            console.log(`   • ${day.charAt(0).toUpperCase() + day.slice(1)}: Closed`);
          } else {
            console.log(`   • ${day.charAt(0).toUpperCase() + day.slice(1)}: ${dayHours.open} - ${dayHours.close}`);
          }
        }
      });
    } else {
      console.log('   ❌ No business hours set');
    }
    console.log('');

    // Summary and validation
    console.log('=========================================');
    console.log('📊 Validation Summary:');
    
    const checks = [
      { name: 'Business exists with routing code 1234', passed: !!business },
      { name: 'Business has owner', passed: !!business.owner },
      { name: 'Salon entry created', passed: !!business.salon },
      { name: 'Services available', passed: business.services.length > 0 },
      { name: 'Business hours configured', passed: !!business.hoursOfOperation },
      { name: 'Phone number matches', passed: business.phoneNumber === '+19801441675' },
      { name: 'Business type is SALON', passed: business.businessType === 'SALON' }
    ];

    checks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
    });

    const passedChecks = checks.filter(check => check.passed).length;
    const totalChecks = checks.length;

    console.log('');
    console.log(`📈 Overall Score: ${passedChecks}/${totalChecks} checks passed`);
    
    if (passedChecks === totalChecks) {
      console.log('🎉 All validations passed! Business is ready for WhatsApp testing.');
    } else {
      console.log('⚠️  Some validations failed. Check the setup script.');
    }

    console.log('');
    console.log('🔗 WhatsApp Integration Ready:');
    console.log(`   • Send messages with routing code: "${business.routingCode}"`);
    console.log(`   • Business phone: ${business.phoneNumber}`);
    console.log(`   • Available services: ${business.services.length}`);

    return passedChecks === totalChecks;

  } catch (error) {
    console.error('❌ Error verifying test business:', error);
    console.error('   → Make sure the database is accessible and the business was created');
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('📡 Database connection closed.');
  }
}

// Handle script execution
async function main() {
  try {
    const isValid = await verifyTestBusiness();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Verification failed:', error.message);
    process.exit(1);
  }
}

// Only run if called directly (not imported)
if (require.main === module) {
  main();
}

module.exports = { verifyTestBusiness };