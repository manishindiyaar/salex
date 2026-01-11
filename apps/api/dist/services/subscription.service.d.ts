/**
 * Subscription Service
 *
 * Handles subscription management, state transitions, and billing logic.
 *
 * Key flows:
 * 1. New business → create trial subscription (7 days)
 * 2. Payment recorded → transition to ACTIVE
 * 3. Trial/billing period expires → transition to GRACE/EXPIRED
 * 4. State machine enforcement for all transitions
 */
import { Subscription, SubscriptionPlan, SubscriptionStatus, PaymentRecord } from '@salex/shared-types';
interface CreateTrialInput {
    businessId: string;
    plan?: SubscriptionPlan;
}
interface TransitionStatusInput {
    subscriptionId: string;
    newStatus: SubscriptionStatus;
    reason?: string;
}
interface RecordPaymentInput {
    subscriptionId: string;
    amount: number;
    paymentMethod: string;
    transactionRef?: string;
    notes?: string;
    recordedBy?: string;
}
declare class SubscriptionService {
    /**
     * Create trial subscription for new business
     * Default: 7-day trial with BASIC plan
     */
    createTrialSubscription(input: CreateTrialInput): Promise<Subscription>;
    /**
     * Get subscription by business ID
     */
    getByBusinessId(businessId: string): Promise<Subscription>;
    /**
     * Get subscription by ID
     */
    getById(subscriptionId: string): Promise<Subscription>;
    /**
     * Transition subscription to new status with state machine validation
     */
    transitionStatus(input: TransitionStatusInput): Promise<Subscription>;
    /**
     * Check if subscription is active (TRIAL or ACTIVE status)
     */
    isActive(businessId: string): Promise<boolean>;
    /**
     * Get all subscriptions with optional status filter
     */
    getAll(status?: SubscriptionStatus): Promise<Subscription[]>;
    /**
     * Process expired subscriptions (for cron job)
     * Transitions TRIAL → EXPIRED and GRACE → EXPIRED
     */
    processExpiredSubscriptions(): Promise<void>;
    /**
     * Update subscription plan
     */
    updatePlan(subscriptionId: string, newPlan: SubscriptionPlan): Promise<Subscription>;
    /**
     * Record payment and activate subscription
     * Creates PaymentRecord and transitions subscription to ACTIVE
     */
    recordPayment(input: RecordPaymentInput): Promise<{
        subscription: Subscription;
        payment: PaymentRecord;
    }>;
}
export declare const subscriptionService: SubscriptionService;
export {};
//# sourceMappingURL=subscription.service.d.ts.map