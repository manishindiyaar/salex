/**
 * Seed Niche Templates
 * 
 * Seeds the NicheTemplate table with default templates for each business category.
 * Run with: npx ts-node scripts/seed-niche-templates.ts
 */

import { prisma } from '@salex/shared-types';

interface TerminologyConfig {
  resource: string;
  resourcePlural: string;
  staff: string;
  staffPlural: string;
  booking: string;
  bookingPlural: string;
  customer: string;
  customerPlural: string;
  [key: string]: string; // Index signature for Prisma Json compatibility
}

interface NicheTemplateData {
  code: string;
  displayName: string;
  icon: string;
  terminology: TerminologyConfig;
  enabledModules: string[];
  defaultServices: Array<{ name: string; duration: number; price: number }>;
  defaultHours: Record<string, { open: string; close: string; closed: boolean }>;
  messageTemplates: Record<string, string>;
}

const NICHE_TEMPLATES: NicheTemplateData[] = [
  {
    code: 'SALON',
    displayName: 'Hair Salon',
    icon: 'scissors',
    terminology: {
      resource: 'Chair',
      resourcePlural: 'Chairs',
      staff: 'Stylist',
      staffPlural: 'Stylists',
      booking: 'Appointment',
      bookingPlural: 'Appointments',
      customer: 'Client',
      customerPlural: 'Clients',
    },
    enabledModules: ['appointment_booking', 'walk_in_queue', 'resource_management', 'staff_management'],
    defaultServices: [
      { name: 'Haircut', duration: 30, price: 300 },
      { name: 'Hair Wash & Blow Dry', duration: 20, price: 150 },
      { name: 'Hair Color', duration: 90, price: 1500 },
      { name: 'Hair Spa', duration: 45, price: 800 },
      { name: 'Beard Trim', duration: 15, price: 100 },
    ],
    defaultHours: {
      monday: { open: '10:00', close: '20:00', closed: false },
      tuesday: { open: '10:00', close: '20:00', closed: false },
      wednesday: { open: '10:00', close: '20:00', closed: false },
      thursday: { open: '10:00', close: '20:00', closed: false },
      friday: { open: '10:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '21:00', closed: false },
      sunday: { open: '10:00', close: '18:00', closed: false },
    },
    messageTemplates: {
      welcome: 'Welcome to {businessName}! 💇 Ready to book your next haircut?',
      bookingConfirmation: '✅ Your appointment at {businessName} is confirmed!\n\n📅 {date}\n⏰ {time}\n💇 {service}\n👤 {staff}',
      bookingReminder: '⏰ Reminder: Your appointment at {businessName} is tomorrow at {time}.',
    },
  },
  {
    code: 'BEAUTY_PARLOR',
    displayName: 'Beauty Parlor',
    icon: 'heart',
    terminology: {
      resource: 'Station',
      resourcePlural: 'Stations',
      staff: 'Beautician',
      staffPlural: 'Beauticians',
      booking: 'Appointment',
      bookingPlural: 'Appointments',
      customer: 'Client',
      customerPlural: 'Clients',
    },
    enabledModules: ['appointment_booking', 'walk_in_queue', 'resource_management', 'staff_management'],
    defaultServices: [
      { name: 'Facial', duration: 45, price: 500 },
      { name: 'Threading', duration: 15, price: 50 },
      { name: 'Waxing - Full Arms', duration: 30, price: 300 },
      { name: 'Manicure', duration: 30, price: 250 },
      { name: 'Pedicure', duration: 45, price: 350 },
      { name: 'Bridal Makeup', duration: 120, price: 5000 },
    ],
    defaultHours: {
      monday: { open: '10:00', close: '19:00', closed: false },
      tuesday: { open: '10:00', close: '19:00', closed: false },
      wednesday: { open: '10:00', close: '19:00', closed: false },
      thursday: { open: '10:00', close: '19:00', closed: false },
      friday: { open: '10:00', close: '19:00', closed: false },
      saturday: { open: '09:00', close: '20:00', closed: false },
      sunday: { open: '10:00', close: '17:00', closed: false },
    },
    messageTemplates: {
      welcome: 'Welcome to {businessName}! 💄 Ready to look your best?',
      bookingConfirmation: '✅ Your beauty appointment is confirmed!\n\n📅 {date}\n⏰ {time}\n💅 {service}\n👩 {staff}',
      bookingReminder: '⏰ Reminder: Your appointment at {businessName} is tomorrow at {time}.',
    },
  },
  {
    code: 'SPA',
    displayName: 'Spa & Wellness',
    icon: 'droplet',
    terminology: {
      resource: 'Room',
      resourcePlural: 'Rooms',
      staff: 'Therapist',
      staffPlural: 'Therapists',
      booking: 'Session',
      bookingPlural: 'Sessions',
      customer: 'Guest',
      customerPlural: 'Guests',
    },
    enabledModules: ['appointment_booking', 'resource_management', 'staff_management', 'package_deals'],
    defaultServices: [
      { name: 'Swedish Massage', duration: 60, price: 1500 },
      { name: 'Deep Tissue Massage', duration: 60, price: 1800 },
      { name: 'Aromatherapy', duration: 75, price: 2000 },
      { name: 'Body Scrub', duration: 45, price: 1200 },
      { name: 'Hot Stone Therapy', duration: 90, price: 2500 },
    ],
    defaultHours: {
      monday: { open: '09:00', close: '21:00', closed: false },
      tuesday: { open: '09:00', close: '21:00', closed: false },
      wednesday: { open: '09:00', close: '21:00', closed: false },
      thursday: { open: '09:00', close: '21:00', closed: false },
      friday: { open: '09:00', close: '21:00', closed: false },
      saturday: { open: '09:00', close: '21:00', closed: false },
      sunday: { open: '10:00', close: '20:00', closed: false },
    },
    messageTemplates: {
      welcome: 'Welcome to {businessName}! 🧘 Ready for some relaxation?',
      bookingConfirmation: '✅ Your spa session is confirmed!\n\n📅 {date}\n⏰ {time}\n🧖 {service}\n👤 {staff}\n\nPlease arrive 15 minutes early.',
      bookingReminder: '⏰ Reminder: Your spa session at {businessName} is tomorrow at {time}. Please arrive 15 minutes early.',
    },
  },
  {
    code: 'CLINIC',
    displayName: 'Clinic',
    icon: 'activity',
    terminology: {
      resource: 'Room',
      resourcePlural: 'Rooms',
      staff: 'Doctor',
      staffPlural: 'Doctors',
      booking: 'Appointment',
      bookingPlural: 'Appointments',
      customer: 'Patient',
      customerPlural: 'Patients',
    },
    enabledModules: ['appointment_booking', 'resource_management', 'staff_management', 'prescription_management'],
    defaultServices: [
      { name: 'Consultation', duration: 30, price: 500 },
      { name: 'Follow-up', duration: 15, price: 300 },
      { name: 'Health Checkup', duration: 60, price: 1500 },
      { name: 'Vaccination', duration: 15, price: 200 },
    ],
    defaultHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    },
    messageTemplates: {
      welcome: 'Welcome to {businessName}! 🏥 How can we help you today?',
      bookingConfirmation: '✅ Your appointment is confirmed!\n\n📅 {date}\n⏰ {time}\n🩺 {service}\n👨‍⚕️ {staff}\n\nPlease bring your ID and any previous reports.',
      bookingReminder: '⏰ Reminder: Your appointment at {businessName} is tomorrow at {time}. Please bring your ID.',
    },
  },
  {
    code: 'FITNESS',
    displayName: 'Fitness Center',
    icon: 'zap',
    terminology: {
      resource: 'Station',
      resourcePlural: 'Stations',
      staff: 'Trainer',
      staffPlural: 'Trainers',
      booking: 'Session',
      bookingPlural: 'Sessions',
      customer: 'Member',
      customerPlural: 'Members',
    },
    enabledModules: ['appointment_booking', 'resource_management', 'staff_management', 'class_scheduling', 'membership_system'],
    defaultServices: [
      { name: 'Personal Training', duration: 60, price: 800 },
      { name: 'Group Fitness Class', duration: 45, price: 200 },
      { name: 'Yoga Session', duration: 60, price: 300 },
      { name: 'CrossFit', duration: 60, price: 400 },
      { name: 'Fitness Assessment', duration: 30, price: 500 },
    ],
    defaultHours: {
      monday: { open: '06:00', close: '22:00', closed: false },
      tuesday: { open: '06:00', close: '22:00', closed: false },
      wednesday: { open: '06:00', close: '22:00', closed: false },
      thursday: { open: '06:00', close: '22:00', closed: false },
      friday: { open: '06:00', close: '22:00', closed: false },
      saturday: { open: '07:00', close: '20:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: false },
    },
    messageTemplates: {
      welcome: 'Welcome to {businessName}! 💪 Ready to crush your fitness goals?',
      bookingConfirmation: '✅ Your training session is confirmed!\n\n📅 {date}\n⏰ {time}\n🏋️ {service}\n👤 {staff}\n\nDon\'t forget your workout gear!',
      bookingReminder: '⏰ Reminder: Your session at {businessName} is tomorrow at {time}. Stay hydrated!',
    },
  },
  {
    code: 'OTHER',
    displayName: 'Other Business',
    icon: 'briefcase',
    terminology: {
      resource: 'Resource',
      resourcePlural: 'Resources',
      staff: 'Staff',
      staffPlural: 'Staff Members',
      booking: 'Booking',
      bookingPlural: 'Bookings',
      customer: 'Customer',
      customerPlural: 'Customers',
    },
    enabledModules: ['appointment_booking', 'walk_in_queue', 'resource_management', 'staff_management'],
    defaultServices: [
      { name: 'Standard Service', duration: 30, price: 500 },
      { name: 'Premium Service', duration: 60, price: 1000 },
    ],
    defaultHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    },
    messageTemplates: {
      welcome: 'Welcome to {businessName}! How can we help you today?',
      bookingConfirmation: '✅ Your booking is confirmed!\n\n📅 {date}\n⏰ {time}\n📋 {service}',
      bookingReminder: '⏰ Reminder: Your booking at {businessName} is tomorrow at {time}.',
    },
  },
];

async function seedNicheTemplates() {
  console.log('🌱 Seeding niche templates...\n');

  for (const template of NICHE_TEMPLATES) {
    try {
      const existing = await prisma.nicheTemplate.findUnique({
        where: { code: template.code },
      });

      if (existing) {
        // Update existing template
        await prisma.nicheTemplate.update({
          where: { code: template.code },
          data: {
            displayName: template.displayName,
            icon: template.icon,
            terminology: template.terminology,
            enabledModules: template.enabledModules,
            defaultServices: template.defaultServices,
            defaultHours: template.defaultHours,
            messageTemplates: template.messageTemplates,
          },
        });
        console.log(`  ✅ Updated: ${template.displayName} (${template.code})`);
      } else {
        // Create new template
        await prisma.nicheTemplate.create({
          data: {
            code: template.code,
            displayName: template.displayName,
            icon: template.icon,
            terminology: template.terminology,
            enabledModules: template.enabledModules,
            defaultServices: template.defaultServices,
            defaultHours: template.defaultHours,
            messageTemplates: template.messageTemplates,
          },
        });
        console.log(`  ✅ Created: ${template.displayName} (${template.code})`);
      }
    } catch (error) {
      console.error(`  ❌ Failed: ${template.displayName} (${template.code})`, error);
    }
  }

  console.log('\n✨ Niche templates seeding complete!');
}

// Run if executed directly
seedNicheTemplates()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { seedNicheTemplates, NICHE_TEMPLATES };
