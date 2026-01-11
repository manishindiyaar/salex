/**
 * Migrate Existing Businesses
 * 
 * Creates Subscription records for existing businesses that don't have one.
 * Sets default category to SALON for businesses without a category.
 * Run with: npx ts-node scripts/migrate-existing-businesses.ts
 */

import { prisma, SubscriptionPlan, SubscriptionStatus } from '@salex/shared-types';

async function migrateExistingBusinesses() {
  console.log('🔄 Migrating existing businesses...\n');

  // Get all businesses
  const businesses = await prisma.business.findMany({
    include: {
      subscription: true,
    },
  });

  console.log(`Found ${businesses.length} businesses to check.\n`);

  let subscriptionsCreated = 0;
  let categoriesUpdated = 0;
  let modulesCreated = 0;

  for (const business of businesses) {
    try {
      // 1. Create subscription if missing
      if (!business.subscription) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30); // 30-day period

        await prisma.subscription.create({
          data: {
            businessId: business.id,
            plan: 'BASIC' as SubscriptionPlan,
            status: 'ACTIVE' as SubscriptionStatus,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
        subscriptionsCreated++;
        console.log(`  ✅ Created subscription for: ${business.name}`);
      }

      // 2. Set category to SALON if missing
      if (!business.category) {
        await prisma.business.update({
          where: { id: business.id },
          data: { category: 'SALON' },
        });
        categoriesUpdated++;
        console.log(`  ✅ Set category to SALON for: ${business.name}`);
      }

      // 3. Create default module configs if missing
      const existingModules = await prisma.businessModuleConfig.findMany({
        where: { businessId: business.id },
      });

      if (existingModules.length === 0) {
        // Create default modules for BASIC plan
        const defaultModules = [
          'walk_in_queue',
          'resource_management',
          'staff_management',
        ];

        for (const moduleCode of defaultModules) {
          await prisma.businessModuleConfig.create({
            data: {
              businessId: business.id,
              moduleCode,
              isEnabled: true,
            },
          });
          modulesCreated++;
        }
        console.log(`  ✅ Created ${defaultModules.length} module configs for: ${business.name}`);
      }

    } catch (error) {
      console.error(`  ❌ Failed to migrate: ${business.name}`, error);
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`  - Subscriptions created: ${subscriptionsCreated}`);
  console.log(`  - Categories updated: ${categoriesUpdated}`);
  console.log(`  - Module configs created: ${modulesCreated}`);
  console.log('\n✨ Migration complete!');
}

// Run if executed directly
migrateExistingBusinesses()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { migrateExistingBusinesses };
