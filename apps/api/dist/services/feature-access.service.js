"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureAccessService = void 0;
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
// Plan feature matrix - defines which features are available for each plan
const PLAN_FEATURES = {
    BASIC: [
        'walk_in_booking',
        'service_management',
        'resource_management',
        'staff_management',
        'basic_analytics',
    ],
    PRO: [
        'walk_in_booking',
        'service_management',
        'resource_management',
        'staff_management',
        'basic_analytics',
        'whatsapp_booking',
        'customer_history',
        'automated_reminders',
        'advanced_analytics',
    ],
    CUSTOM: [
        'walk_in_booking',
        'service_management',
        'resource_management',
        'staff_management',
        'basic_analytics',
        'whatsapp_booking',
        'customer_history',
        'automated_reminders',
        'advanced_analytics',
        'own_whatsapp_number',
        'website_widget',
        'custom_branding',
        'api_access',
    ],
};
// Plan upgrade suggestions for denied features
const FEATURE_PLAN_REQUIREMENTS = {
    'whatsapp_booking': 'PRO',
    'customer_history': 'PRO',
    'automated_reminders': 'PRO',
    'advanced_analytics': 'PRO',
    'own_whatsapp_number': 'CUSTOM',
    'website_widget': 'CUSTOM',
    'custom_branding': 'CUSTOM',
    'api_access': 'CUSTOM',
};
class FeatureAccessService {
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
    async canAccessFeature(businessId, featureCode) {
        try {
            // Get business with subscription and module configs
            const business = await shared_types_1.prisma.business.findUnique({
                where: { id: businessId },
                include: {
                    subscription: true,
                    moduleConfigs: true,
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
            // 3. Check if feature is included in plan
            const planFeatures = PLAN_FEATURES[subscription.plan];
            if (!planFeatures.includes(featureCode)) {
                const suggestedPlan = FEATURE_PLAN_REQUIREMENTS[featureCode];
                return {
                    allowed: false,
                    reason: `Feature not available in ${subscription.plan} plan`,
                    suggestedPlan,
                };
            }
            // 4. Check module enablement (if feature maps to a module)
            const moduleCode = this.getModuleForFeature(featureCode);
            if (moduleCode) {
                const moduleConfig = business.moduleConfigs.find(config => config.moduleCode === moduleCode);
                if (!moduleConfig || !moduleConfig.isEnabled) {
                    return {
                        allowed: false,
                        reason: `${moduleCode} module is not enabled for this business`,
                    };
                }
            }
            logger_1.logger.info({ businessId, featureCode, plan: subscription.plan }, 'Feature access granted');
            return {
                allowed: true,
            };
        }
        catch (error) {
            logger_1.logger.error({ businessId, featureCode, error }, 'Error checking feature access');
            return {
                allowed: false,
                reason: 'Internal error checking feature access',
            };
        }
    }
    /**
     * Get all features available to a business
     * Based on subscription plan and module configurations
     */
    async getAvailableFeatures(businessId) {
        try {
            const business = await shared_types_1.prisma.business.findUnique({
                where: { id: businessId },
                include: {
                    subscription: true,
                    moduleConfigs: true,
                },
            });
            if (!business || !business.isActive || !business.subscription) {
                return [];
            }
            const subscription = business.subscription;
            if (subscription.status !== 'TRIAL' && subscription.status !== 'ACTIVE') {
                return [];
            }
            // Get features for the subscription plan
            const planFeatures = PLAN_FEATURES[subscription.plan];
            // Filter features based on enabled modules
            const enabledModules = business.moduleConfigs
                .filter(config => config.isEnabled)
                .map(config => config.moduleCode);
            const availableFeatures = planFeatures.filter(feature => {
                const moduleCode = this.getModuleForFeature(feature);
                // If feature doesn't require a module, it's always available
                // If it requires a module, check if module is enabled
                return !moduleCode || enabledModules.includes(moduleCode);
            });
            return availableFeatures;
        }
        catch (error) {
            logger_1.logger.error({ businessId, error }, 'Error getting available features');
            return [];
        }
    }
    /**
     * Check if a business has an active subscription
     * Returns true for TRIAL or ACTIVE status
     */
    async hasActiveSubscription(businessId) {
        try {
            const business = await shared_types_1.prisma.business.findUnique({
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
        }
        catch (error) {
            logger_1.logger.error({ businessId, error }, 'Error checking subscription status');
            return false;
        }
    }
    /**
     * Get plan features matrix (for admin dashboard)
     */
    getPlanFeatures() {
        return PLAN_FEATURES;
    }
    /**
     * Get feature plan requirements (for upgrade suggestions)
     */
    getFeaturePlanRequirements() {
        return FEATURE_PLAN_REQUIREMENTS;
    }
    /**
     * Map feature codes to module codes
     * Returns null if feature doesn't require a specific module
     */
    getModuleForFeature(featureCode) {
        const featureModuleMap = {
            'walk_in_booking': 'walk_in_queue',
            'whatsapp_booking': 'appointment_booking',
            'resource_management': 'resource_management',
            'staff_management': 'staff_management',
            'customer_history': 'appointment_booking',
            'automated_reminders': 'appointment_booking',
            // Features that don't require specific modules
            'service_management': null,
            'basic_analytics': null,
            'advanced_analytics': null,
            'own_whatsapp_number': null,
            'website_widget': null,
            'custom_branding': null,
            'api_access': null,
        };
        return featureModuleMap[featureCode] || null;
    }
}
exports.featureAccessService = new FeatureAccessService();
//# sourceMappingURL=feature-access.service.js.map