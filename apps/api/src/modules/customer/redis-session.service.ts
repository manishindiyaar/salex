import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { RedisService, WhatsAppSession } from '../../core/redis.service';
import { PrismaService } from '../../core/prisma.service';
import { 
  CustomerAuthRequest,
  CustomerAuthResponse,
  Customer,
  CustomerSessionState
} from 'shared-types';

@Injectable()
export class RedisSessionService {
  private readonly logger = new Logger(RedisSessionService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create or resume customer session (Redis-based)
   */
  async authenticateCustomer(request: CustomerAuthRequest): Promise<CustomerAuthResponse> {
    const { phoneNumber } = request;

    this.logger.debug(`Authenticating customer with phone: ${phoneNumber}`);

    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new BadRequestException('Invalid phone number format');
    }

    // Find or create customer in PostgreSQL (for permanent data)
    const customer = await this.findOrCreateCustomer(phoneNumber);

    // Check for existing Redis session
    const existingSession = await this.redisService.getSession(phoneNumber);
    
    if (existingSession) {
      // Extend existing session TTL
      await this.redisService.extendSession(phoneNumber);
      
      return {
        success: true,
        sessionId: phoneNumber, // Use phone as session ID for Redis
        expiresAt: new Date(Date.now() + 600000), // 10 minutes from now
        customer
      };
    }

    // Create new Redis session
    await this.redisService.setSession(phoneNumber, {
      customerPhone: phoneNumber,
      currentState: CustomerSessionState.INITIAL,
      sessionData: {},
    });

    return {
      success: true,
      sessionId: phoneNumber,
      expiresAt: new Date(Date.now() + 600000), // 10 minutes
      customer
    };
  }

  /**
   * Get session by phone number (Redis session ID)
   */
  async getSession(sessionId: string): Promise<WhatsAppSession> {
    const session = await this.redisService.getSession(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found or expired');
    }

    return session;
  }

  /**
   * Update session state in Redis
   */
  async updateSessionState(
    sessionId: string, 
    state: CustomerSessionState, 
    sessionData?: any
  ): Promise<WhatsAppSession> {
    this.logger.debug(`Updating session ${sessionId} to state: ${state}`);

    await this.redisService.updateSessionState(sessionId, state, sessionData);
    
    // Return updated session
    const updatedSession = await this.redisService.getSession(sessionId);
    if (!updatedSession) {
      throw new NotFoundException('Session not found after update');
    }

    return updatedSession;
  }

  /**
   * Set business context for session (when customer uses S1234)
   */
  async setBusinessContext(sessionId: string, businessId: string): Promise<WhatsAppSession> {
    this.logger.debug(`Setting business context for session ${sessionId}: ${businessId}`);

    await this.redisService.setBusinessContext(sessionId, businessId);
    
    // Return updated session
    const updatedSession = await this.redisService.getSession(sessionId);
    if (!updatedSession) {
      throw new NotFoundException('Session not found after business context update');
    }

    return updatedSession;
  }

  /**
   * Get session statistics from Redis
   */
  async getSessionStats(): Promise<{
    activeSessions: number;
    redisHealth: any;
  }> {
    const [activeSessions, redisHealth] = await Promise.all([
      this.redisService.getActiveSessionsCount(),
      this.redisService.healthCheck(),
    ]);

    return {
      activeSessions,
      redisHealth,
    };
  }

  /**
   * Manual session cleanup (Redis handles automatic expiry)
   */
  async cleanupSession(sessionId: string): Promise<void> {
    await this.redisService.deleteSession(sessionId);
  }

  /**
   * Extend session TTL on activity
   */
  async extendSession(sessionId: string): Promise<void> {
    await this.redisService.extendSession(sessionId);
  }

  // Private helper methods

  private async findOrCreateCustomer(phoneNumber: string): Promise<Customer> {
    let customer = await this.prisma.customer.findUnique({
      where: { phoneNumber }
    });

    if (!customer) {
      this.logger.debug(`Creating new customer with phone: ${phoneNumber}`);
      customer = await this.prisma.customer.create({
        data: {
          phoneNumber,
          name: null // Will be set during conversation
        }
      });
    }

    return {
      id: customer.id,
      phoneNumber: customer.phoneNumber,
      name: customer.name,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation - starts with + followed by digits
    const phoneRegex = /^\+[1-9]\d{10,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Health check for Redis session system
   */
  async healthCheck(): Promise<{
    redis: any;
    sessions: number;
    status: string;
  }> {
    const [redisHealth, sessionCount] = await Promise.all([
      this.redisService.healthCheck(),
      this.redisService.getActiveSessionsCount(),
    ]);

    return {
      redis: redisHealth,
      sessions: sessionCount,
      status: redisHealth.status === 'healthy' ? 'healthy' : 'degraded',
    };
  }
}