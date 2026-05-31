/**
 * Business Flow Readiness Service
 *
 * Stateless validator that computes whether a business has completed
 * enough setup to publish a flow. Checks onboarding, active status,
 * services, capacity, hours, and channel mode.
 */

import { prisma } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ReadinessResult {
  ready: boolean;
  missing: ReadinessItem[];
  channelMode: 'SHARED' | 'DEDICATED' | 'NONE';
  canPublish: boolean;
}

export interface ReadinessItem {
  code: string;
  label: string;
  message: string;
  severity: 'blocker' | 'warning';
}

// ─── Service ─────────────────────────────────────────────────────────────────

class BusinessFlowReadinessService {
  /**
   * Check whether a business is ready to publish a flow.
   * Throws NotFoundError if the business does not exist.
   */
  async checkReadiness(businessId: string): Promise<ReadinessResult> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        services: { where: { isActive: true } },
        staff: { where: { isActive: true } },
        resources: { where: { isActive: true } },
        whatsAppChannel: true,
      },
    });

    if (!business) {
      throw new NotFoundError('Business', businessId);
    }

    const missing: ReadinessItem[] = [];

    // Check: onboardingCompleted
    if (!business.onboardingCompleted) {
      missing.push({
        code: 'ONBOARDING_INCOMPLETE',
        label: 'Onboarding incomplete',
        message: 'Business must complete onboarding before publishing a flow.',
        severity: 'blocker',
      });
    }

    // Check: isActive
    if (!business.isActive) {
      missing.push({
        code: 'BUSINESS_INACTIVE',
        label: 'Business inactive',
        message: 'Business must be active before publishing a flow.',
        severity: 'blocker',
      });
    }

    // Check: at least one active service with price > 0 and duration >= 1
    const qualifyingServices = business.services.filter(
      (s) => Number(s.price) > 0 && s.durationMinutes >= 1
    );
    if (qualifyingServices.length === 0) {
      missing.push({
        code: 'NO_ACTIVE_SERVICES',
        label: 'No active services',
        message:
          'Business must have at least one active service with a price greater than zero and a duration of at least 1 minute.',
        severity: 'blocker',
      });
    }

    // Check: capacity (at least one active staff OR at least one active resource)
    if (business.staff.length === 0 && business.resources.length === 0) {
      missing.push({
        code: 'NO_CAPACITY',
        label: 'No capacity',
        message:
          'Business must have at least one active staff member or at least one active resource.',
        severity: 'blocker',
      });
    }

    // Check: hoursOfOperation defined and non-empty
    const hasHours =
      business.hoursOfOperation != null &&
      typeof business.hoursOfOperation === 'object' &&
      Object.keys(business.hoursOfOperation as object).length > 0;
    if (!hasHours) {
      missing.push({
        code: 'NO_HOURS',
        label: 'No operating hours',
        message: 'Business must have operating hours defined.',
        severity: 'blocker',
      });
    }

    // Resolve channel mode
    const channelMode = this.resolveChannelMode(business);

    const ready = missing.length === 0;
    const canPublish = ready && channelMode !== 'NONE';

    logger.debug(
      { businessId, ready, channelMode, missingCount: missing.length },
      'Readiness check completed'
    );

    return { ready, missing, channelMode, canPublish };
  }

  /**
   * Determine the channel mode for a business:
   * - DEDICATED: WhatsAppChannel with mode=DEDICATED and status=CONNECTED
   * - SHARED: routingCode present OR WhatsAppChannel with mode=SHARED
   * - NONE: neither condition met
   */
  private resolveChannelMode(
    business: {
      routingCode: string | null;
      whatsAppChannel: { mode: string; status: string } | null;
    }
  ): 'SHARED' | 'DEDICATED' | 'NONE' {
    // Check DEDICATED first (more specific)
    if (
      business.whatsAppChannel &&
      business.whatsAppChannel.mode === 'DEDICATED' &&
      business.whatsAppChannel.status === 'CONNECTED'
    ) {
      return 'DEDICATED';
    }

    // Check SHARED: routingCode OR WhatsAppChannel with mode=SHARED
    if (business.routingCode) {
      return 'SHARED';
    }
    if (
      business.whatsAppChannel &&
      business.whatsAppChannel.mode === 'SHARED'
    ) {
      return 'SHARED';
    }

    return 'NONE';
  }
}

export const businessFlowReadinessService = new BusinessFlowReadinessService();
