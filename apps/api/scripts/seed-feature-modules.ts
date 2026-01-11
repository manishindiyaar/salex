/**
 * Seed Feature Modules
 * 
 * Seeds the FeatureModule table with all available feature modules.
 * Run with: npx ts-node scripts/seed-feature-modules.ts
 */

import { prisma, SubscriptionPlan } from '@salex/shared-types';

interface FeatureModuleData {
  code: string;
  name: string;
  description: string;
  plans: SubscriptionPlan[];
}

const FEATURE_MODULES: FeatureModuleData[] = [
  {
    code: 'appointment_booking',
    name: 'Appointment Booking',
    description: 'Allow customers to book appointments via WhatsApp or app',
    plans: ['PRO', 'CUSTOM'],
  },
  {
    code: 'walk_in_queue',
    name: 'Walk-in Queue',
    description: 'Manage walk-in customers with a digital queue system',
    plans: ['BASIC', 'PRO', 'CUSTOM'],
  },
  {
    code: 'resource_management',
    name: 'Resource Management',
    description: 'Manage physical resources like chairs, rooms, or stations',
    plans: ['BASIC', 'PRO', 'CUSTOM'],
  },
  {
    code: 'staff_management',
    name: 'Staff Management',
    description: 'Manage staff members and their assignments',
    plans: ['BASIC', 'PRO', 'CUSTOM'],
  },
  {
    code: 'prescription_management',
    name: 'Prescription Management',
    description: 'Create and manage prescriptions for clinic patients',
    plans: ['PRO', 'CUSTOM'],
  },
  {
    code: 'class_scheduling',
    name: 'Class Scheduling',
    description: 'Schedule and manage group classes or sessions',
    plans: ['PRO', 'CUSTOM'],
  },
  {
    code: 'membership_system',
    name: 'Membership System',
    description: 'Manage customer memberships and subscriptions',
    plans: ['PRO', 'CUSTOM'],
  },
  {
    code: 'package_deals',
    name: 'Package Deals',
    description: 'Create and sell service packages and bundles',
    plans: ['PRO', 'CUSTOM'],
  },
  {
    code: 'customer_history',
    name: 'Customer History',
    description: 'Track customer visit history and preferences',
    plans: ['PRO', 'CUSTOM'],
  },
  {
    code: 'automated_reminders',
    name: 'Automated Reminders',
    description: 'Send automatic appointment reminders via WhatsApp',
    plans: ['PRO', 'CUSTOM'],
  },
  {
    code: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed business analytics and reporting',
    plans: ['PRO', 'CUSTOM'],
  },
  {
    code: 'own_whatsapp_number',
    name: 'Own WhatsApp Number',
    description: 'Use your own WhatsApp Business number',
    plans: ['CUSTOM'],
  },
  {
    code: 'website_widget',
    name: 'Website Widget',
    description: 'Embed booking widget on your website',
    plans: ['CUSTOM'],
  },
  {
    code: 'custom_branding',
    name: 'Custom Branding',
    description: 'Customize messages and UI with your brand',
    plans: ['CUSTOM'],
  },
  {
    code: 'api_access',
    name: 'API Access',
    description: 'Access to Salex API for custom integrations',
    plans: ['CUSTOM'],
  },
];

async function seedFeatureModules() {
  console.log('🌱 Seeding feature modules...\n');

  for (const module of FEATURE_MODULES) {
    try {
      const existing = await prisma.featureModule.findUnique({
        where: { code: module.code },
      });

      if (existing) {
        // Update existing module
        await prisma.featureModule.update({
          where: { code: module.code },
          data: {
            name: module.name,
            description: module.description,
            plans: module.plans,
          },
        });
        console.log(`  ✅ Updated: ${module.name} (${module.code})`);
      } else {
        // Create new module
        await prisma.featureModule.create({
          data: {
            code: module.code,
            name: module.name,
            description: module.description,
            plans: module.plans,
          },
        });
        console.log(`  ✅ Created: ${module.name} (${module.code})`);
      }
    } catch (error) {
      console.error(`  ❌ Failed: ${module.name} (${module.code})`, error);
    }
  }

  console.log('\n✨ Feature modules seeding complete!');
}

// Run if executed directly
seedFeatureModules()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { seedFeatureModules, FEATURE_MODULES };
