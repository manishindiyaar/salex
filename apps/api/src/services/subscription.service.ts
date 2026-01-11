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

import { prisma, Subscription, SubscriptionPlan, SubscriptionStatus, PaymentRecord } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

// Valid state transitions for subscription state machine
const VALID_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  TRIAL: ['ACTIVE', 'EXPIRED'],
  ACTIVE: ['GRACE', 'CANCELLED'],
  GRACE: ['ACTIVE', 'EXPIRED'],
  EXPIRED: ['ACTIVE'],
  CANCELLED: ['ACTIVE'],
};

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
  recordedBy?: string; // Admin user ID
}

class SubscriptionService {
  /**
   * Create trial subscription for new business
   * Default: 7-day trial with BASIC plan
   */
  async createTrialSubscription(input: CreateTrialInput): Promise<Subscription> {
    const { businessId, plan = 'BASIC' } = input;

    // Check if business already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { businessId },
    });

    if (existingSubscription) {
      throw new BusinessRuleError('Business already has a subscription');
    }

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    // Create trial subscription (7 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const subscription = await prisma.subscription.create({
      data: {
        businessId,
        plan,
        status: 'TRIAL',
        trialEndsAt,
      },
    });

    logger.info(
      { businessId, subscriptionId: subscription.id, plan, trialEndsAt },
      'Trial subscription created'
    );

    return subscription;
  }

  /**
   * Get subscription by business ID
   */
  async getByBusinessId(businessId: string): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found for this business');
    }

    return subscription;
  }

  /**
   * Get subscription by ID
   */
  async getById(subscriptionId: string): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    return subscription;
  }

  /**
   * Transition subscription to new status with state machine validation
   */
  async transitionStatus(input: TransitionStatusInput): Promise<Subscription> {
    const { subscriptionId, newStatus, reason } = input;

    const subscription = await this.getById(subscriptionId);
    const currentStatus = subscription.status;

    // Validate transition is allowed
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BusinessRuleError(
        `Invalid transition from ${currentStatus} to ${newStatus}. ` +
        `Allowed transitions: ${allowedTransitions.join(', ')}`
      );
    }

    // Prepare update data based on new status
    const updateData: Partial<Subscription> = {
      status: newStatus,
    };

    // Set timestamps based on status
    if (newStatus === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
    });

    logger.info(
      { 
        subscriptionId, 
        businessId: subscription.businessId,
        transition: `${currentStatus} → ${newStatus}`,
        reason 
      },
      'Subscription status transitioned'
    );

    return updated;
  }

  /**
   * Check if subscription is active (TRIAL or ACTIVE status)
   */
  async isActive(businessId: string): Promise<boolean> {
    try {
      const subscription = await this.getByBusinessId(businessId);
      return subscription.status === 'TRIAL' || subscription.status === 'ACTIVE';
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get all subscriptions with optional status filter
   */
  async getAll(status?: SubscriptionStatus): Promise<Subscription[]> {
    const where = status ? { status } : {};
    
    return prisma.subscription.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            routingCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Process expired subscriptions (for cron job)
   * Transitions TRIAL → EXPIRED and GRACE → EXPIRED
   */
  async processExpiredSubscriptions(): Promise<void> {
    const now = new Date();

    // Find expired trials
    const expiredTrials = await prisma.subscription.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: {
          lte: now,
        },
      },
    });

    // Find expired grace periods
    const expiredGrace = await prisma.subscription.findMany({
      where: {
        status: 'GRACE',
        currentPeriodEnd: {
          lte: now,
        },
      },
    });

    // Transition expired trials
    for (const subscription of expiredTrials) {
      await this.transitionStatus({
        subscriptionId: subscription.id,
        newStatus: 'EXPIRED',
        reason: 'Trial period expired',
      });
    }

    // Transition expired grace periods
    for (const subscription of expiredGrace) {
      await this.transitionStatus({
        subscriptionId: subscription.id,
        newStatus: 'EXPIRED',
        reason: 'Grace period expired',
      });
    }

    const totalExpired = expiredTrials.length + expiredGrace.length;
    if (totalExpired > 0) {
      logger.info(
        { expiredTrials: expiredTrials.length, expiredGrace: expiredGrace.length },
        `Processed ${totalExpired} expired subscriptions`
      );
    }
  }

  /**
   * Update subscription plan
   */
  async updatePlan(subscriptionId: string, newPlan: SubscriptionPlan): Promise<Subscription> {
    const subscription = await this.getById(subscriptionId);

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { plan: newPlan },
    });

    logger.info(
      { 
        subscriptionId, 
        businessId: subscription.businessId,
        planChange: `${subscription.plan} → ${newPlan}`
      },
      'Subscription plan updated'
    );

    return updated;
  }

  /**
   * Record payment and activate subscription
   * Creates PaymentRecord and transitions subscription to ACTIVE
   */
  async recordPayment(input: RecordPaymentInput): Promise<{ subscription: Subscription; payment: PaymentRecord }> {
    const { subscriptionId, amount, paymentMethod, transactionRef, notes, recordedBy } = input;

    const subscription = await this.getById(subscriptionId);

    // Calculate billing period (30 days from now)
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Create payment record and update subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.paymentRecord.create({
        data: {
          subscriptionId,
          amount,
          paymentMethod,
          transactionRef,
          periodStart,
          periodEnd,
          notes,
          recordedBy,
        },
      });

      // Update subscription to ACTIVE with billing period
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });

      return { subscription: updatedSubscription, payment };
    });

    logger.info(
      {
        subscriptionId,
        businessId: subscription.businessId,
        amount,
        paymentMethod,
        transactionRef,
        periodStart,
        periodEnd,
        recordedBy,
      },
      'Payment recorded and subscription activated'
    );

    return result;
  }
}

export const subscriptionService = new SubscriptionService();