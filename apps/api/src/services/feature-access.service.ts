/**
 * Feature Access Service
 * 
 * Handles plan-based feature access control.
 * 
 * Key flows:
 * 1. Check business isActive status
 * 2. Check subscription status (TRIAL or ACTIVE)
 * 3. Check feature is included in plan
 * 4. Return clear denial reason if access denied
 */

import { prisma, SubscriptionPlan } from '@salex/shared-types';
import { logger } from '../utils/logger';

// Plan feature matrix - defines which features are available for each plan.
// For V1, plan-based gating is bypassed and all core salon features are mapped to all plans.
const ALL_V1_FEATURES = [
  'walk_in_booking',
  'service_management',
  'resource_management',
  'staff_management',
  'basic_analytics',
  'advanced_analytics',
  'whatsapp_booking',
  'customer_history',
  'automated_reminders',
  'own_whatsapp_number',
  'website_widget',
  'custom_branding',
  'api_access',
];

const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  BASIC: ALL_V1_FEATURES,
  PRO: ALL_V1_FEATURES,
  CUSTOM: ALL_V1_FEATURES,
};

// Plan upgrade suggestions for denied features (kept for type compatibility)
const FEATURE_PLAN_REQUIREMENTS: Record<string, SubscriptionPlan> = {
  'whatsapp_booking': 'PRO',
  'customer_history': 'PRO',
  'automated_reminders': 'PRO',
  'advanced_analytics': 'PRO',
  'own_whatsapp_number': 'CUSTOM',
  'website_widget': 'CUSTOM',
  'custom_branding': 'CUSTOM',
  'api_access': 'CUSTOM',
};

interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  suggestedPlan?: SubscriptionPlan;
}

class FeatureAccessService {
  /**
   * Check if a business can access a specific feature
   * Returns detailed result with reason for denial
   * 
   * Checks in order:
   * 1. Business exists and is active
   * 2. Subscription exists and is active (TRIAL or ACTIVE)
   * 3. For own_whatsapp_number, verify WhatsAppChannel configuration mode is DEDICATED
   */
  async canAccessFeature(businessId: string, featureCode: string): Promise<FeatureAccessResult> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          subscription: true,
          whatsAppChannel: true,
        },
      });

      if (!business) {
        return {
          allowed: false,
          reason: 'Business not found',
        };
      }

      // 1. Check if business is active
      if (!business.isActive) {
        return {
          allowed: false,
          reason: 'Business account is suspended',
        };
      }

      // 2. Check subscription exists and is active
      if (!business.subscription) {
        return {
          allowed: false,
          reason: 'No active subscription found',
          suggestedPlan: 'BASIC',
        };
      }

      const subscription = business.subscription;
      if (subscription.status !== 'TRIAL' && subscription.status !== 'ACTIVE') {
        return {
          allowed: false,
          reason: `Subscription is ${subscription.status.toLowerCase()}`,
          suggestedPlan: subscription.plan,
        };
      }

      // Special check: own_whatsapp_number is controlled by WhatsAppChannel configuration mode, not by CUSTOM plan
      if (featureCode === 'own_whatsapp_number') {
        const hasDedicated = business.whatsAppChannel?.mode === 'DEDICATED';
        if (!hasDedicated) {
          return {
            allowed: false,
            reason: 'Dedicated WhatsApp number configuration is required for this feature',
          };
        }
      }

      // 3. Verify feature is a recognized V1 feature
      const planFeatures = PLAN_FEATURES[subscription.plan];
      if (!planFeatures.includes(featureCode)) {
        return {
          allowed: false,
          reason: `Feature code ${featureCode} is not recognized`,
        };
      }

      logger.info({ businessId, featureCode, plan: subscription.plan }, 'Feature access granted');

      return {
        allowed: true,
      };

    } catch (error) {
      logger.error({ businessId, featureCode, error }, 'Error checking feature access');
      return {
        allowed: false,
        reason: 'Internal error checking feature access',
      };
    }
  }

  /**
   * Get all features available to a business based on subscription plan.
   */
  async getAvailableFeatures(businessId: string): Promise<string[]> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          subscription: true,
        },
      });

      if (!business || !business.isActive || !business.subscription) {
        return [];
      }

      const subscription = business.subscription;
      if (subscription.status !== 'TRIAL' && subscription.status !== 'ACTIVE') {
        return [];
      }

      return PLAN_FEATURES[subscription.plan];

    } catch (error) {
      logger.error({ businessId, error }, 'Error getting available features');
      return [];
    }
  }

  /**
   * Check if a business has an active subscription
   * Returns true for TRIAL or ACTIVE status
   */
  async hasActiveSubscription(businessId: string): Promise<boolean> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          subscription: true,
        },
      });

      if (!business || !business.subscription) {
        return false;
      }

      const subscription = business.subscription;
      return subscription.status === 'TRIAL' || subscription.status === 'ACTIVE';

    } catch (error) {
      logger.error({ businessId, error }, 'Error checking subscription status');
      return false;
    }
  }

  /**
   * Get plan features matrix (for admin dashboard)
   */
  getPlanFeatures(): Record<SubscriptionPlan, string[]> {
    return PLAN_FEATURES;
  }

  /**
   * Get feature plan requirements (for upgrade suggestions)
   */
  getFeaturePlanRequirements(): Record<string, SubscriptionPlan> {
    return FEATURE_PLAN_REQUIREMENTS;
  }

}

export const featureAccessService = new FeatureAccessService();
