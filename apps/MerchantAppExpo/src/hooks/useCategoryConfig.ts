/**
 * useCategoryConfig Hook
 * 
 * Provides category-specific terminology and configuration.
 * Task 21: Dynamic Terminology
 */

import { useMemo } from 'react';
import { useBusinessStore } from '../store/businessStore';

export interface TerminologyConfig {
  resource: string;
  resourcePlural: string;
  staff: string;
  staffPlural: string;
  booking: string;
  bookingPlural: string;
  customer: string;
  customerPlural: string;
}

export interface CategoryConfig {
  code: string;
  displayName: string;
  icon: string;
  terminology: TerminologyConfig;
}

// Default terminology configurations by category
const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  SALON: {
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
  },
  BEAUTY_PARLOR: {
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
  },
  SPA: {
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
  },
  CLINIC: {
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
  },
  FITNESS: {
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
  },
  OTHER: {
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
  },
};

// Default config for unknown categories
const DEFAULT_CONFIG: CategoryConfig = CATEGORY_CONFIGS.OTHER;

/**
 * Hook to get category-specific configuration and terminology
 */
export function useCategoryConfig(): CategoryConfig {
  const { business } = useBusinessStore();

  const config = useMemo(() => {
    const category = business?.category || 'OTHER';
    return CATEGORY_CONFIGS[category] || DEFAULT_CONFIG;
  }, [business?.category]);

  return config;
}

/**
 * Get terminology for a specific category (without hook)
 */
export function getCategoryConfig(category: string): CategoryConfig {
  return CATEGORY_CONFIGS[category] || DEFAULT_CONFIG;
}

/**
 * Get all available category configs
 */
export function getAllCategoryConfigs(): CategoryConfig[] {
  return Object.values(CATEGORY_CONFIGS);
}

/**
 * Hook to get just the terminology
 */
export function useTerminology(): TerminologyConfig {
  const config = useCategoryConfig();
  return config.terminology;
}

export default useCategoryConfig;
