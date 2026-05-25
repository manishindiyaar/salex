/**
 * Clinic Configuration — Salex Clinic Build
 *
 * Single source of truth for all Clinic-specific terminology,
 * default services, and operating hours.
 *
 * This mirrors salonConfig.ts in structure, but with
 * clinical terminology and defaults.
 */

export const CLINIC_CONFIG = {
  category: 'CLINIC' as const,

  terminology: {
    resource: 'Room',
    resourcePlural: 'Rooms',
    staff: 'Doctor',
    staffPlural: 'Doctors',
    booking: 'Appointment',
    bookingPlural: 'Appointments',
    customer: 'Patient',
    customerPlural: 'Patients',
    service: 'Treatment',
    servicePlural: 'Treatments',
  },

  defaultServices: [
    { name: 'General Consultation', duration: 20, price: 500, description: 'Initial patient visit and diagnosis' },
    { name: 'Follow-up Visit', duration: 15, price: 300, description: 'Returning patient check-up' },
    { name: 'Procedure', duration: 45, price: 1500, description: 'In-clinic medical procedure' },
    { name: 'Lab Test Review', duration: 10, price: 200, description: 'Review and discuss lab results' },
    { name: 'Vaccination', duration: 15, price: 400, description: 'Immunization administration' },
  ],

  defaultHours: {
    monday:    { open: '08:00', close: '20:00', closed: false },
    tuesday:   { open: '08:00', close: '20:00', closed: false },
    wednesday: { open: '08:00', close: '20:00', closed: false },
    thursday:  { open: '08:00', close: '20:00', closed: false },
    friday:    { open: '08:00', close: '20:00', closed: false },
    saturday:  { open: '09:00', close: '17:00', closed: false },
    sunday:    { open: '', close: '', closed: true },
  },

  resourceExamples: [
    { title: 'Consultation Room', text: 'Room 1, Room 2, Room 3...' },
    { title: 'Procedure Room', text: 'OT Room, Dressing Room...' },
  ],

  staffExamples: [
    { title: 'General Physician', text: 'Dr. Sharma, +919876543210' },
    { title: 'Specialist', text: 'Dr. Mehta, +919876543211' },
  ],
} as const;

export type ClinicTerminology = typeof CLINIC_CONFIG.terminology;
