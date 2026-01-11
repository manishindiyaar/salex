/**
 * Routing Code Service
 * 
 * Generates unique 4-digit routing codes for businesses.
 * Used by WhatsApp customers to identify which salon to book with.
 * 
 * Example: Customer texts "8821" → Bot looks up business with that code
 */

import { prisma } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { BusinessRuleError, NotFoundError } from '../utils/errors';

const MAX_RETRIES = 10;
const CODE_LENGTH = 4;

export interface BusinessLookupResult {
  id: string;
  name: string;
  routingCode: string | null;
  isActive: boolean;
  isAcceptingOrders: boolean;
  category: string | null;
}

class RoutingService {
  /**
   * Generate a random 4-digit code (0000-9999)
   */
  private generateRandomCode(): string {
    const code = Math.floor(Math.random() * 10000);
    return code.toString().padStart(CODE_LENGTH, '0');
  }

  /**
   * Check if a routing code is already taken
   */
  async isCodeTaken(code: string): Promise<boolean> {
    const existing = await prisma.business.findUnique({
      where: { routingCode: code },
      select: { id: true },
    });
    return existing !== null;
  }

  /**
   * Generate a unique routing code with collision resolution
   * Retries up to MAX_RETRIES times if code is taken
   */
  async generateUniqueCode(): Promise<string> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const code = this.generateRandomCode();
      
      const isTaken = await this.isCodeTaken(code);
      
      if (!isTaken) {
        logger.info({ code, attempt }, 'Generated unique routing code');
        return code;
      }
      
      logger.debug({ code, attempt }, 'Routing code collision, retrying...');
    }

    // Extremely unlikely with 10,000 possible codes and few businesses
    logger.error({ maxRetries: MAX_RETRIES }, 'Failed to generate unique routing code');
    throw new BusinessRuleError(
      'Unable to generate unique routing code. Please try again.'
    );
  }

  /**
   * Validate a routing code format (4 digits)
   */
  isValidFormat(code: string): boolean {
    return /^\d{4}$/.test(code);
  }

  /**
   * Look up a business by routing code and check if it's active
   * Returns business info with active status for WhatsApp routing
   * 
   * @throws NotFoundError if business not found
   */
  async lookupBusinessByCode(routingCode: string): Promise<BusinessLookupResult> {
    const business = await prisma.business.findUnique({
      where: { routingCode },
      select: {
        id: true,
        name: true,
        routingCode: true,
        isActive: true,
        isAcceptingOrders: true,
        category: true,
      },
    });

    if (!business) {
      logger.warn({ routingCode }, 'Business not found for routing code');
      throw new NotFoundError(`Business with routing code ${routingCode} not found`);
    }

    logger.debug({ 
      routingCode, 
      businessId: business.id, 
      isActive: business.isActive 
    }, 'Business lookup completed');

    return business;
  }

  /**
   * Check if a business is available for WhatsApp booking
   * Returns { available: true } or { available: false, reason: string }
   */
  async checkBusinessAvailability(routingCode: string): Promise<{ 
    available: boolean; 
    reason?: string;
    business?: BusinessLookupResult;
  }> {
    try {
      const business = await this.lookupBusinessByCode(routingCode);

      // Check if business is active (admin can deactivate)
      if (!business.isActive) {
        logger.info({ routingCode, businessId: business.id }, 'Business is inactive');
        return {
          available: false,
          reason: 'This business is temporarily unavailable. Please contact them directly.',
          business,
        };
      }

      // Check if business is accepting orders
      if (!business.isAcceptingOrders) {
        logger.info({ routingCode, businessId: business.id }, 'Business not accepting orders');
        return {
          available: false,
          reason: 'This business is not accepting bookings at this time.',
          business,
        };
      }

      return { available: true, business };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return {
          available: false,
          reason: `Business code "${routingCode}" not found. Please check and try again.`,
        };
      }
      throw error;
    }
  }
}

export const routingService = new RoutingService();
