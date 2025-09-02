import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { BusinessService } from '../business/business.service';
import { 
  ParseRoutingCodeRequest,
  ParseRoutingCodeResponse,
  BusinessPublicInfo,
  BusinessRoutingMessage
} from 'shared-types';

@Injectable()
export class MessageRoutingService {
  private readonly logger = new Logger(MessageRoutingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessService: BusinessService
  ) {}

  /**
   * Parse customer message to extract business routing codes (S1234)
   */
  async parseRoutingMessage(request: ParseRoutingCodeRequest): Promise<ParseRoutingCodeResponse> {
    const { message } = request;

    this.logger.debug(`Parsing message for routing codes: "${message}"`);

    // Extract routing codes from message using multiple patterns
    const routingCodes = this.extractRoutingCodes(message);

    if (routingCodes.length === 0) {
      return {
        success: false,
        suggestedMessage: 'Please include a business code like "BOOK_AT_S1234" to get started!'
      };
    }

    // Use the first found routing code
    const routingCode = routingCodes[0];

    try {
      // Find business by routing code
      const business = await this.businessService.findBusinessByRoutingCode(routingCode);
      
      const businessInfo: BusinessPublicInfo = {
        id: business.id,
        name: business.name,
        address: business.address,
        phoneNumber: business.phoneNumber,
        routingCode: business.routingCode!,
        hoursOfOperation: business.hoursOfOperation
      };

      return {
        success: true,
        routingCode,
        business: businessInfo,
        suggestedMessage: `Great! I found ${business.name}. How can I help you today?`
      };

    } catch (error) {
      this.logger.warn(`Business not found for routing code: ${routingCode}`);
      
      return {
        success: false,
        routingCode,
        suggestedMessage: `Sorry, I couldn't find a business with code S${routingCode}. Please check the code and try again.`
      };
    }
  }

  /**
   * Check if message contains routing codes
   */
  hasRoutingCode(message: string): boolean {
    const codes = this.extractRoutingCodes(message);
    return codes.length > 0;
  }

  /**
   * Generate suggested routing message for business
   */
  generateRoutingMessage(routingCode: string): string {
    return `BOOK_AT_S${routingCode}`;
  }

  /**
   * Get all available routing patterns that customers can use
   */
  getRoutingPatterns(): string[] {
    return [
      'BOOK_AT_S{code}',
      'BOOK_S{code}',
      'APPOINTMENT_S{code}',
      'APPT_S{code}',
      'S{code}',
      'SALON_S{code}',
      'VISIT_S{code}'
    ];
  }

  /**
   * Validate routing code format
   */
  isValidRoutingCode(code: string): boolean {
    // Must be 4-digit numeric string between 1000-9999
    const codeRegex = /^[1-9][0-9]{3}$/;
    const numericCode = parseInt(code);
    return codeRegex.test(code) && numericCode >= 1000 && numericCode <= 9999;
  }

  /**
   * Extract all routing codes from message text
   */
  private extractRoutingCodes(message: string): string[] {
    const codes: string[] = [];
    const normalizedMessage = message.toUpperCase().replace(/\s+/g, ' ');

    // Pattern 1: BOOK_AT_S1234, BOOK_S1234, APPOINTMENT_S1234, etc.
    const primaryPatterns = [
      /BOOK[_\s]*AT[_\s]*S(\d{4})/g,
      /BOOK[_\s]*S(\d{4})/g,
      /APPOINTMENT[_\s]*S(\d{4})/g,
      /APPT[_\s]*S(\d{4})/g,
      /SALON[_\s]*S(\d{4})/g,
      /VISIT[_\s]*S(\d{4})/g
    ];

    // Apply primary patterns
    for (const pattern of primaryPatterns) {
      let match;
      while ((match = pattern.exec(normalizedMessage)) !== null) {
        const code = match[1];
        if (this.isValidRoutingCode(code) && !codes.includes(code)) {
          codes.push(code);
        }
      }
    }

    // Pattern 2: Standalone S1234 (only if not already found)
    if (codes.length === 0) {
      const standalonePattern = /\bS(\d{4})\b/g;
      let match;
      while ((match = standalonePattern.exec(normalizedMessage)) !== null) {
        const code = match[1];
        if (this.isValidRoutingCode(code) && !codes.includes(code)) {
          codes.push(code);
        }
      }
    }

    // Pattern 3: Just 4-digit numbers (as last resort, only if no S prefix found)
    if (codes.length === 0) {
      const numberPattern = /\b(\d{4})\b/g;
      let match;
      while ((match = numberPattern.exec(normalizedMessage)) !== null) {
        const code = match[1];
        if (this.isValidRoutingCode(code) && !codes.includes(code)) {
          codes.push(code);
        }
      }
    }

    this.logger.debug(`Extracted routing codes from "${message}": [${codes.join(', ')}]`);
    return codes;
  }

  /**
   * Create a business routing message object
   */
  async createBusinessRoutingMessage(routingCode: string): Promise<BusinessRoutingMessage> {
    try {
      const business = await this.businessService.findBusinessByRoutingCode(routingCode);
      
      const businessInfo: BusinessPublicInfo = {
        id: business.id,
        name: business.name,
        address: business.address,
        phoneNumber: business.phoneNumber,
        routingCode: business.routingCode!,
        hoursOfOperation: business.hoursOfOperation
      };

      return {
        routingCode,
        business: businessInfo,
        isValid: true
      };

    } catch (error) {
      // Create invalid routing message for non-existent codes
      return {
        routingCode,
        business: {} as BusinessPublicInfo,
        isValid: false
      };
    }
  }
}