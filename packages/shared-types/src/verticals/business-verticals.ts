/**
 * Business Verticals Configuration
 *
 * Shared terminology, default services, resource/staff labels,
 * and default hours for each business category.
 */

export interface VerticalTerminology {
  resource: string;
  resourcePlural: string;
  staff: string;
  staffPlural: string;
  booking: string;
  bookingPlural: string;
  customer: string;
  customerPlural: string;
  service: string;
  servicePlural: string;
}

export interface DefaultService {
  name: string;
  duration: number;
  price: number;
  description?: string;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface VerticalConfig {
  category: string;
  terminology: VerticalTerminology;
  defaultServices: DefaultService[];
  defaultHours: Record<string, DayHours>;
}

type BusinessCategoryKey = 'SALON' | 'BEAUTY_PARLOR' | 'SPA' | 'CLINIC' | 'FITNESS' | 'OTHER';

const WEEKDAY_HOURS: DayHours = { open: '09:00', close: '20:00', closed: false };
const SATURDAY_HOURS: DayHours = { open: '09:00', close: '18:00', closed: false };
const SUNDAY_CLOSED: DayHours = { open: '', close: '', closed: true };

const standardHours: Record<string, DayHours> = {
  monday: WEEKDAY_HOURS,
  tuesday: WEEKDAY_HOURS,
  wednesday: WEEKDAY_HOURS,
  thursday: WEEKDAY_HOURS,
  friday: WEEKDAY_HOURS,
  saturday: SATURDAY_HOURS,
  sunday: SUNDAY_CLOSED,
};

export const BUSINESS_VERTICALS: Record<BusinessCategoryKey, VerticalConfig> = {
  SALON: {
    category: 'SALON',
    terminology: {
      resource: 'Chair', resourcePlural: 'Chairs',
      staff: 'Stylist', staffPlural: 'Stylists',
      booking: 'Appointment', bookingPlural: 'Appointments',
      customer: 'Client', customerPlural: 'Clients',
      service: 'Service', servicePlural: 'Services',
    },
    defaultServices: [
      { name: 'Haircut', duration: 30, price: 300 },
      { name: 'Hair Wash & Blow Dry', duration: 20, price: 200 },
      { name: 'Hair Coloring', duration: 90, price: 1500 },
      { name: 'Beard Trim', duration: 15, price: 100 },
      { name: 'Head Massage', duration: 20, price: 200 },
    ],
    defaultHours: standardHours,
  },
  BEAUTY_PARLOR: {
    category: 'BEAUTY_PARLOR',
    terminology: {
      resource: 'Station', resourcePlural: 'Stations',
      staff: 'Beautician', staffPlural: 'Beauticians',
      booking: 'Appointment', bookingPlural: 'Appointments',
      customer: 'Client', customerPlural: 'Clients',
      service: 'Service', servicePlural: 'Services',
    },
    defaultServices: [
      { name: 'Facial', duration: 45, price: 500 },
      { name: 'Threading', duration: 15, price: 50 },
      { name: 'Waxing', duration: 30, price: 300 },
      { name: 'Manicure', duration: 30, price: 250 },
      { name: 'Pedicure', duration: 40, price: 350 },
    ],
    defaultHours: standardHours,
  },
  SPA: {
    category: 'SPA',
    terminology: {
      resource: 'Room', resourcePlural: 'Rooms',
      staff: 'Therapist', staffPlural: 'Therapists',
      booking: 'Session', bookingPlural: 'Sessions',
      customer: 'Guest', customerPlural: 'Guests',
      service: 'Treatment', servicePlural: 'Treatments',
    },
    defaultServices: [
      { name: 'Swedish Massage', duration: 60, price: 2000 },
      { name: 'Deep Tissue Massage', duration: 60, price: 2500 },
      { name: 'Aromatherapy', duration: 75, price: 3000 },
      { name: 'Body Scrub', duration: 45, price: 1500 },
      { name: 'Hot Stone Therapy', duration: 90, price: 3500 },
    ],
    defaultHours: standardHours,
  },
  CLINIC: {
    category: 'CLINIC',
    terminology: {
      resource: 'Room', resourcePlural: 'Rooms',
      staff: 'Doctor', staffPlural: 'Doctors',
      booking: 'Appointment', bookingPlural: 'Appointments',
      customer: 'Patient', customerPlural: 'Patients',
      service: 'Treatment', servicePlural: 'Treatments',
    },
    defaultServices: [
      { name: 'General Consultation', duration: 20, price: 500 },
      { name: 'Follow-up Visit', duration: 15, price: 300 },
      { name: 'Procedure', duration: 45, price: 1500 },
      { name: 'Lab Test Review', duration: 10, price: 200 },
      { name: 'Vaccination', duration: 15, price: 400 },
    ],
    defaultHours: {
      ...standardHours,
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
    },
  },
  FITNESS: {
    category: 'FITNESS',
    terminology: {
      resource: 'Slot', resourcePlural: 'Slots',
      staff: 'Trainer', staffPlural: 'Trainers',
      booking: 'Session', bookingPlural: 'Sessions',
      customer: 'Member', customerPlural: 'Members',
      service: 'Class', servicePlural: 'Classes',
    },
    defaultServices: [
      { name: 'Personal Training', duration: 60, price: 800 },
      { name: 'Group Class', duration: 45, price: 300 },
      { name: 'Yoga Session', duration: 60, price: 400 },
      { name: 'CrossFit', duration: 45, price: 500 },
      { name: 'Assessment', duration: 30, price: 500 },
    ],
    defaultHours: {
      monday: { open: '06:00', close: '22:00', closed: false },
      tuesday: { open: '06:00', close: '22:00', closed: false },
      wednesday: { open: '06:00', close: '22:00', closed: false },
      thursday: { open: '06:00', close: '22:00', closed: false },
      friday: { open: '06:00', close: '22:00', closed: false },
      saturday: { open: '07:00', close: '20:00', closed: false },
      sunday: { open: '08:00', close: '14:00', closed: false },
    },
  },
  OTHER: {
    category: 'OTHER',
    terminology: {
      resource: 'Resource', resourcePlural: 'Resources',
      staff: 'Staff', staffPlural: 'Staff',
      booking: 'Booking', bookingPlural: 'Bookings',
      customer: 'Customer', customerPlural: 'Customers',
      service: 'Service', servicePlural: 'Services',
    },
    defaultServices: [],
    defaultHours: standardHours,
  },
};

export function getVerticalConfig(category: string): VerticalConfig {
  return BUSINESS_VERTICALS[category as BusinessCategoryKey] || BUSINESS_VERTICALS.OTHER;
}
