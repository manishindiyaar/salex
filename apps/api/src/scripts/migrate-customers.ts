import { prisma } from '@salex/shared-types';


async function main() {
  console.log('Starting migration...');
  const customers = await prisma.customer.findMany({
    include: { bookings: true }
  });
  console.log(`Found ${customers.length} customers to migrate.`);

  for (const customer of customers) {
    // Upsert person
    const person = await prisma.person.upsert({
      where: { phoneNumber: customer.phoneNumber },
      update: {},
      create: {
        phoneNumber: customer.phoneNumber,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      }
    });

    // Create BusinessCustomer for each business they have bookings with
    const businessIds = [...new Set(customer.bookings.map(b => b.businessId))];
    
    for (const businessId of businessIds) {
      const bc = await prisma.businessCustomer.upsert({
        where: { businessId_personId: { businessId, personId: person.id } },
        update: {},
        create: {
          businessId,
          personId: person.id,
          displayName: customer.name,
          isBlocked: customer.isBlocked,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        }
      });
      
      // Update bookings
      await prisma.booking.updateMany({
        where: { customerId: customer.id, businessId },
        data: { businessCustomerId: bc.id }
      });
    }
  }
  
  console.log('Migration completed successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
