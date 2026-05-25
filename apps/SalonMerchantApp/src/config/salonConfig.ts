/**
 * Salon Configuration — Salex Hair Salon Build
 *
 * This is the single source of truth for all Salon-specific terminology,
 * default services, and operating hours. No API calls needed at onboarding.
 *
 * For future builds (Spa, Clinic), create a separate spaConfig.ts /
 * clinicConfig.ts file and swap this import at the Expo build profile level.
 */

export const SALON_CONFIG = {
  category: 'SALON' as const,

  terminology: {
    resource: 'Chair',
    resourcePlural: 'Chairs',
    staff: 'Stylist',
    staffPlural: 'Stylists',
    booking: 'Appointment',
    bookingPlural: 'Appointments',
    customer: 'Client',
    customerPlural: 'Clients',
    service: 'Service',
    servicePlural: 'Services',
  },

  defaultServices: [
    { name: 'Haircut & Style', duration: 30, price: 300 },
    { name: 'Hair Wash & Blow Dry', duration: 20, price: 150 },
    { name: 'Hair Color', duration: 90, price: 1500 },
    { name: 'Hair Spa', duration: 45, price: 800 },
    { name: 'Beard Trim', duration: 15, price: 100 },
    { name: 'Highlights', duration: 120, price: 1200 },
    { name: 'Deep Conditioning', duration: 30, price: 400 },
  ],

  defaultHours: {
    monday:    { open: '10:00', close: '20:00', closed: false },
    tuesday:   { open: '10:00', close: '20:00', closed: false },
    wednesday: { open: '10:00', close: '20:00', closed: false },
    thursday:  { open: '10:00', close: '20:00', closed: false },
    friday:    { open: '10:00', close: '20:00', closed: false },
    saturday:  { open: '09:00', close: '21:00', closed: false },
    sunday:    { open: '10:00', close: '18:00', closed: false },
  },

  resourceExamples: [
    { title: 'Hair Station', text: 'Chair 1, Chair 2, Chair 3...' },
    { title: 'Wash Station', text: 'Wash 1, Wash 2...' },
  ],

  staffExamples: [
    { title: 'Hair Stylist', text: 'Priya Sharma, +919876543210' },
    { title: 'Color Specialist', text: 'Rajesh Kumar, +919876543211' },
  ],
} as const;

export type SalonTerminology = typeof SALON_CONFIG.terminology;
