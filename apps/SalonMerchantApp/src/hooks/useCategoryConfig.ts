/**
 * useCategoryConfig Hook (Salon Build)
 *
 * Provides Salon-specific terminology and configuration.
 * Reads from SALON_CONFIG — no runtime API calls, no dynamic category switching.
 *
 * For future builds (Spa, Clinic), this hook will import from the
 * corresponding config file at build time via Expo build profiles.
 */

import { SALON_CONFIG } from '../config/salonConfig';

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

const SALON_CATEGORY_CONFIG: CategoryConfig = {
  code: 'SALON',
  displayName: 'Hair Salon',
  icon: 'scissors',
  terminology: SALON_CONFIG.terminology,
};

/**
 * Hook to get category-specific configuration and terminology.
 * Always returns Salon config in this build.
 */
export function useCategoryConfig(): CategoryConfig {
  return SALON_CATEGORY_CONFIG;
}

/**
 * Get terminology for the active category (without hook)
 */
export function getCategoryConfig(): CategoryConfig {
  return SALON_CATEGORY_CONFIG;
}

/**
 * Hook to get just the terminology
 */
export function useTerminology(): TerminologyConfig {
  return SALON_CONFIG.terminology;
}

export default useCategoryConfig;
