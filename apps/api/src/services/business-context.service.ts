/**
 * Business Context Service
 *
 * Returns business data and available template variables for the flow editor.
 * Used by the admin dashboard to display business metadata, active services,
 * staff, resources, operating hours, and the template variable registry.
 *
 * Requirements: 4.1, 4.2, 4.7
 */

import { prisma } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';

// ============================================
// INTERFACES
// ============================================

export interface BusinessFlowContext {
  business: {
    id: string;
    name: string;
    category: string;
    routingCode: string | null;
    channelMode: 'SHARED' | 'DEDICATED' | 'NONE';
  };
  services: Array<{ id: string; name: string; price: number; duration: number }>;
  staff: Array<{ id: string; name: string }>;
  resources: Array<{ id: string; name: string }>;
  operatingHours: Record<string, { start: string; end: string }> | null;
  templateVariables: TemplateVariableGroup[];
}

export interface TemplateVariableGroup {
  category: string;
  variables: Array<{ key: string; description: string; example: string }>;
}

// ============================================
// TEMPLATE VARIABLE REGISTRY
// ============================================

const TEMPLATE_VARIABLE_REGISTRY: TemplateVariableGroup[] = [
  {
    category: 'business',
    variables: [
      {
        key: '{{business.name}}',
        description: 'The name of the business',
        example: 'Glamour Salon',
      },
      {
        key: '{{business.category}}',
        description: 'The business category',
        example: 'SALON',
      },
      {
        key: '{{business.routingCode}}',
        description: 'The routing code customers use to reach this business',
        example: 'S123',
      },
    ],
  },
  {
    category: 'service',
    variables: [
      {
        key: '{{selectedService.name}}',
        description: 'Name of the selected service',
        example: 'Haircut',
      },
      {
        key: '{{selectedService.price}}',
        description: 'Price of the selected service',
        example: '500',
      },
      {
        key: '{{selectedService.duration}}',
        description: 'Duration of the selected service in minutes',
        example: '30',
      },
    ],
  },
  {
    category: 'staff',
    variables: [
      {
        key: '{{selectedStaff.name}}',
        description: 'Name of the selected staff member',
        example: 'John',
      },
    ],
  },
  {
    category: 'booking',
    variables: [
      {
        key: '{{selectedTime}}',
        description: 'The selected booking time',
        example: '2024-03-15T10:00:00Z',
      },
      {
        key: '{{booking.id}}',
        description: 'The unique booking identifier',
        example: 'clx1abc2def',
      },
    ],
  },
];

// ============================================
// SERVICE
// ============================================

class BusinessContextService {
  /**
   * Get the full business context for the flow editor.
   *
   * @throws NotFoundError if businessId does not exist
   */
  async getContext(businessId: string): Promise<BusinessFlowContext> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        services: {
          where: { isActive: true },
          select: { id: true, name: true, price: true, durationMinutes: true },
          orderBy: { name: 'asc' },
        },
        staff: {
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        },
        resources: {
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        },
        whatsAppChannel: {
          select: { mode: true, status: true },
        },
      },
    });

    if (!business) {
      throw new NotFoundError('Business', businessId);
    }

    // Resolve channel mode
    const channelMode = resolveChannelMode(
      business.routingCode,
      business.whatsAppChannel
    );

    // Map services to the expected format
    const services = business.services.map((s) => ({
      id: s.id,
      name: s.name,
      price: Number(s.price),
      duration: s.durationMinutes,
    }));

    // Map staff
    const staff = business.staff.map((s) => ({
      id: s.id,
      name: s.name,
    }));

    // Map resources
    const resources = business.resources.map((r) => ({
      id: r.id,
      name: r.name,
    }));

    // Parse operating hours
    const operatingHours = parseOperatingHours(business.hoursOfOperation);

    logger.debug(
      {
        businessId,
        channelMode,
        serviceCount: services.length,
        staffCount: staff.length,
        resourceCount: resources.length,
      },
      'Business context retrieved'
    );

    return {
      business: {
        id: business.id,
        name: business.name,
        category: business.category,
        routingCode: business.routingCode,
        channelMode,
      },
      services,
      staff,
      resources,
      operatingHours,
      templateVariables: TEMPLATE_VARIABLE_REGISTRY,
    };
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Resolve the channel mode for a business.
 *
 * - DEDICATED: WhatsAppChannel with mode=DEDICATED and status=CONNECTED
 * - SHARED: Business has a routingCode OR WhatsAppChannel with mode=SHARED
 * - NONE: Neither condition met
 */
function resolveChannelMode(
  routingCode: string | null,
  whatsAppChannel: { mode: string; status: string } | null
): 'SHARED' | 'DEDICATED' | 'NONE' {
  // Check DEDICATED first (more specific)
  if (
    whatsAppChannel &&
    whatsAppChannel.mode === 'DEDICATED' &&
    whatsAppChannel.status === 'CONNECTED'
  ) {
    return 'DEDICATED';
  }

  // Check SHARED: routing code OR shared channel
  if (routingCode) {
    return 'SHARED';
  }

  if (whatsAppChannel && whatsAppChannel.mode === 'SHARED') {
    return 'SHARED';
  }

  return 'NONE';
}

/**
 * Parse hoursOfOperation JSON into a structured record.
 * Returns null if hours are not defined or empty.
 *
 * Expected input format: { "monday": { "start": "09:00", "end": "17:00" }, ... }
 * or similar day-keyed structure.
 */
function parseOperatingHours(
  hoursOfOperation: unknown
): Record<string, { start: string; end: string }> | null {
  if (hoursOfOperation === null || hoursOfOperation === undefined) {
    return null;
  }

  if (typeof hoursOfOperation !== 'object' || Array.isArray(hoursOfOperation)) {
    return null;
  }

  const hours = hoursOfOperation as Record<string, unknown>;
  const keys = Object.keys(hours);

  if (keys.length === 0) {
    return null;
  }

  const result: Record<string, { start: string; end: string }> = {};

  for (const day of keys) {
    const value = hours[day];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'start' in value &&
      'end' in value
    ) {
      const dayHours = value as { start: unknown; end: unknown };
      result[day] = {
        start: String(dayHours.start),
        end: String(dayHours.end),
      };
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const businessContextService = new BusinessContextService();
