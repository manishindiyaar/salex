import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { CodeAvailabilityResponse } from 'shared-types';

@Injectable()
export class BusinessRoutingService {
  private readonly logger = new Logger(BusinessRoutingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a routing code is available
   */
  async isCodeAvailable(code: string): Promise<boolean> {
    this.logger.debug(`Checking availability for code: ${code}`);

    if (!this.isValidCode(code)) {
      return false;
    }

    const existing = await this.prisma.business.findUnique({
      where: { routingCode: code },
      select: { id: true }
    });

    return !existing;
  }

  /**
   * Check code availability and get suggestions if taken
   */
  async checkCodeAvailability(code: string): Promise<CodeAvailabilityResponse> {
    this.logger.debug(`Checking code availability: ${code}`);

    if (!this.isValidCode(code)) {
      throw new BadRequestException('Routing code must be exactly 4 digits between 1000-9999');
    }

    const available = await this.isCodeAvailable(code);

    if (available) {
      return { available: true };
    } else {
      const suggestions = await this.suggestSimilarCodes(code, 5);
      return { 
        available: false, 
        suggestions 
      };
    }
  }

  /**
   * Generate smart suggestions when preferred code is taken
   */
  async suggestSimilarCodes(preferredCode: string, limit: number = 5): Promise<string[]> {
    this.logger.debug(`Generating suggestions for taken code: ${preferredCode}`);
    
    const suggestions: string[] = [];
    const base = parseInt(preferredCode);
    
    // Strategy 1: Increment/decrement by 1-10
    for (let i = 1; i <= 10 && suggestions.length < limit; i++) {
      const candidates = [
        this.formatCode(base + i),   // 1234 -> 1235, 1236...
        this.formatCode(base - i),   // 1234 -> 1233, 1232...
      ];
      
      for (const candidate of candidates) {
        if (this.isValidCode(candidate) && await this.isCodeAvailable(candidate) && suggestions.length < limit) {
          suggestions.push(candidate);
        }
      }
    }
    
    // Strategy 2: Same first 2 digits, different last 2
    if (suggestions.length < limit) {
      const prefix = preferredCode.substring(0, 2);
      for (let i = 0; i < 100 && suggestions.length < limit; i++) {
        const candidate = prefix + i.toString().padStart(2, '0');
        if (candidate !== preferredCode && this.isValidCode(candidate) && await this.isCodeAvailable(candidate)) {
          suggestions.push(candidate);
        }
      }
    }
    
    // Strategy 3: Random available codes in similar range
    if (suggestions.length < limit) {
      const rangeStart = Math.max(1000, base - 100);
      const rangeEnd = Math.min(9999, base + 100);
      
      for (let i = 0; i < 50 && suggestions.length < limit; i++) {
        const randomCode = this.formatCode(
          Math.floor(Math.random() * (rangeEnd - rangeStart)) + rangeStart
        );
        if (this.isValidCode(randomCode) && await this.isCodeAvailable(randomCode)) {
          suggestions.push(randomCode);
        }
      }
    }
    
    this.logger.debug(`Generated ${suggestions.length} suggestions: ${suggestions.join(', ')}`);
    return suggestions;
  }

  /**
   * Assign routing code to a business (one-time only)
   */
  async setBusinessRoutingCode(businessId: string, routingCode: string, userId: string): Promise<void> {
    this.logger.debug(`Setting routing code ${routingCode} for business: ${businessId}`);

    // Validate code format
    if (!this.isValidCode(routingCode)) {
      throw new BadRequestException('Routing code must be exactly 4 digits between 1000-9999');
    }

    // Check if business exists and belongs to user
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, routingCode: true }
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerId !== userId) {
      throw new BadRequestException('You do not have permission to modify this business');
    }

    // Check if business already has a routing code
    if (business.routingCode) {
      throw new ConflictException('Business already has a routing code. Routing codes cannot be changed once set.');
    }

    // Check if code is available
    if (!await this.isCodeAvailable(routingCode)) {
      throw new ConflictException(`Routing code ${routingCode} is already taken`);
    }

    // Assign the code
    try {
      await this.prisma.business.update({
        where: { id: businessId },
        data: { routingCode }
      });

      this.logger.log(`Successfully assigned routing code ${routingCode} to business ${businessId}`);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Routing code ${routingCode} is already taken`);
      }
      throw error;
    }
  }

  /**
   * Find business by routing code for customer lookup
   */
  async findBusinessByRoutingCode(code: string) {
    this.logger.debug(`Looking up business by routing code: ${code}`);

    if (!this.isValidCode(code)) {
      throw new BadRequestException('Invalid routing code format');
    }

    const business = await this.prisma.business.findUnique({
      where: { routingCode: code },
      select: {
        id: true,
        name: true,
        address: true,
        phoneNumber: true,
        routingCode: true,
        hoursOfOperation: true
      }
    });

    if (!business) {
      throw new NotFoundException(`No business found with routing code S${code}`);
    }

    return business;
  }

  /**
   * Generate the next available routing code for auto-assignment
   */
  async generateAvailableCode(): Promise<string> {
    this.logger.debug('Generating next available routing code');

    // Start from 1000 and find first available
    for (let code = 1000; code <= 9999; code++) {
      const codeStr = this.formatCode(code);
      if (await this.isCodeAvailable(codeStr)) {
        return codeStr;
      }
    }

    throw new ConflictException('No routing codes available. All codes from 1000-9999 are taken.');
  }

  /**
   * Get routing code statistics
   */
  async getCodeStatistics(): Promise<{
    totalAssigned: number;
    totalAvailable: number;
    utilizationPercentage: number;
  }> {
    const totalAssigned = await this.prisma.business.count({
      where: {
        routingCode: {
          not: null
        }
      }
    });

    const totalPossible = 9000; // 1000-9999
    const totalAvailable = totalPossible - totalAssigned;
    const utilizationPercentage = (totalAssigned / totalPossible) * 100;

    return {
      totalAssigned,
      totalAvailable,
      utilizationPercentage: Math.round(utilizationPercentage * 100) / 100
    };
  }

  /**
   * Validate routing code format
   */
  private isValidCode(code: string): boolean {
    // Must be exactly 4 digits between 1000-9999
    const codeNum = parseInt(code);
    return /^\d{4}$/.test(code) && codeNum >= 1000 && codeNum <= 9999;
  }

  /**
   * Format number to 4-digit string
   */
  private formatCode(num: number): string {
    return num.toString().padStart(4, '0');
  }
}