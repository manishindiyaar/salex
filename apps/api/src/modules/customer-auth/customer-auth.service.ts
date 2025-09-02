import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { Customer, CustomerSession } from 'shared-types';

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Authenticate customer using phone number - implements 2-hour JWT sessions
   */
  async authenticateCustomer(phoneNumber: string): Promise<{ token: string; customer: Customer }> {
    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new ForbiddenException('Invalid phone number format');
    }

    // Find or create customer
    const customer = await this.findOrCreateCustomer(phoneNumber);
    
    // Generate 2-hour JWT token
    const token = await this.generateCustomerJWT(customer.id);

    return { token, customer };
  }

  /**
   * Find or create customer record
   */
  async findOrCreateCustomer(phoneNumber: string): Promise<Customer> {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { phoneNumber }
    });

    if (existingCustomer) {
      return existingCustomer as Customer;
    }

    const customer = await this.prisma.customer.create({
      data: {
        phoneNumber,
        name: `Customer ${phoneNumber.slice(-4)}`
      }
    });

    return customer as Customer;
  }

  /**
   * Generate customer JWT token with 2-hour expiry
   */
  async generateCustomerJWT(customerId: string): Promise<string> {
    const payload = {
      sub: customerId,
      type: 'customer',
      sessionId: uuidv4(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 hours
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('CUSTOMER_JWT_SECRET'),
      algorithm: 'HS256'
    });
  }

  /**
   * Validate customer JWT token
   */
  async validateCustomerToken(token: string): Promise<Customer | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('CUSTOMER_JWT_SECRET')
      });

      if (payload.type !== 'customer') {
        throw new UnauthorizedException('Invalid token type');
      }

      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub }
      });

      return customer as Customer;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create customer session for business context
   */
  async createCustomerSession(
    customerPhone: string, 
    businessId: string
  ): Promise<CustomerSession> {
    const session = await this.prisma.customerSession.upsert({
      where: {
        customerPhone: customerPhone
      },
      update: {
        businessId,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      },
      create: {
        customerPhone,
        businessId,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      }
    });

    return session as CustomerSession;
  }

  /**
   * Refresh customer session token
   */
  async refreshCustomerSession(customerPhone: string): Promise<string> {
    const session = await this.prisma.customerSession.findFirst({
      where: {
        customerPhone,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    await this.prisma.customerSession.update({
      where: { id: session.id },
      data: {
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      }
    });

    return customerPhone;
  }

  /**
   * Clean expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.customerSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    return result.count;
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format validation
    const e164Regex = /^\+?[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Rate limiting for phone number authentication
   */
  async canAuthenticate(phoneNumber: string, ipAddress: string): Promise<boolean> {
    const recentAttempts = await this.prisma.customerSession.count({
      where: {
        customerPhone: phoneNumber,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    return recentAttempts < 10; // Max 10 attempts per hour per phone
  }
}

export const CUSTOMER_JWT_STRATEGY = 'customer-jwt-strategy';