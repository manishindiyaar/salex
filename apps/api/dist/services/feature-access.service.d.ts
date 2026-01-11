/**
 * Feature Access Service
 *
 * Handles plan-based feature access control and module enablement.
 *
 * Key flows:
 * 1. Check business isActive status
 * 2. Check subscription status (TRIAL or ACTIVE)
 * 3. Check feature is included in plan
 * 4. Check module is enabled for business
 * 5. Return clear denial reason if access denied
 */
import { SubscriptionPlan } from '@salex/shared-types';
interface FeatureAccessResult {
    allowed: boolean;
    reason?: string;
    suggestedPlan?: SubscriptionPlan;
}
declare class FeatureAccessService {
    /**
     * Check if a business can access a specific feature
     * Returns detailed result with reason for denial
     *
     * Checks in order:
     * 1. Business exists and is active
     * 2. Subscription exists and is active (TRIAL or ACTIVE)
     * 3. Feature is included in subscription plan
     * 4. Module is enabled for business (if feature requires module)
     */
    canAccessFeature(businessId: string, featureCode: string): Promise<FeatureAccessResult>;
    /**
     * Get all features available to a business
     * Based on subscription plan and module configurations
     */
    getAvailableFeatures(businessId: string): Promise<string[]>;
    /**
     * Check if a business has an active subscription
     * Returns true for TRIAL or ACTIVE status
     */
    hasActiveSubscription(businessId: string): Promise<boolean>;
    /**
     * Get plan features matrix (for admin dashboard)
     */
    getPlanFeatures(): Record<SubscriptionPlan, string[]>;
    /**
     * Get feature plan requirements (for upgrade suggestions)
     */
    getFeaturePlanRequirements(): Record<string, SubscriptionPlan>;
    /**
     * Map feature codes to module codes
     * Returns null if feature doesn't require a specific module
     */
    private getModuleForFeature;
}
export declare const featureAccessService: FeatureAccessService;
export {};
//# sourceMappingURL=feature-access.service.d.ts.map