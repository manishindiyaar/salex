import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { 
  CustomerSession, 
  CustomerSessionState, 
  CustomerAuthRequest,
  CustomerAuthResponse,
  Customer
} from 'shared-types';

@Injectable()
export class CustomerSessionService {
  private readonly logger = new Logger(CustomerSessionService.name);
  private readonly SESSION_DURATION_MINUTES = 30; // 30 minutes session duration

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or resume customer session based on phone number
   */
  async authenticateCustomer(request: CustomerAuthRequest): Promise<CustomerAuthResponse> {
    const { phoneNumber } = request;

    this.logger.debug(`Authenticating customer with phone: ${phoneNumber}`);

    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new BadRequestException('Invalid phone number format');
    }

    // Find or create customer
    const customer = await this.findOrCreateCustomer(phoneNumber);

    // Check for existing active session
    const existingSession = await this.findActiveSession(phoneNumber);
    
    if (existingSession) {
      // Extend existing session
      const updatedSession = await this.extendSession(existingSession.id);
      
      return {
        success: true,
        sessionId: updatedSession.id,
        expiresAt: updatedSession.expiresAt,
        customer
      };
    }

    // Create new session
    const newSession = await this.createNewSession(phoneNumber);

    return {
      success: true,
      sessionId: newSession.id,
      expiresAt: newSession.expiresAt,
      customer
    };
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<CustomerSession> {
    const session = await this.prisma.customerSession.findUnique({
      where: { id: sessionId },
      include: {
        customer: true,
        business: true
      }
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.expireSession(sessionId);
      throw new NotFoundException('Session has expired');
    }

    return {
      id: session.id,
      customerPhone: session.customerPhone,
      businessId: session.businessId,
      currentState: session.currentState as CustomerSessionState,
      sessionData: session.sessionData,
      lastMessageAt: session.lastMessageAt,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };
  }

  /**
   * Update session state and data
   */
  async updateSessionState(
    sessionId: string, 
    state: CustomerSessionState, 
    sessionData?: any
  ): Promise<CustomerSession> {
    this.logger.debug(`Updating session ${sessionId} to state: ${state}`);

    const updatedSession = await this.prisma.customerSession.update({
      where: { id: sessionId },
      data: {
        currentState: state,
        sessionData: sessionData || undefined,
        lastMessageAt: new Date(),
        // Extend session on activity
        expiresAt: new Date(Date.now() + this.SESSION_DURATION_MINUTES * 60 * 1000)
      }
    });

    return {
      id: updatedSession.id,
      customerPhone: updatedSession.customerPhone,
      businessId: updatedSession.businessId,
      currentState: updatedSession.currentState as CustomerSessionState,
      sessionData: updatedSession.sessionData,
      lastMessageAt: updatedSession.lastMessageAt,
      expiresAt: updatedSession.expiresAt,
      createdAt: updatedSession.createdAt,
      updatedAt: updatedSession.updatedAt
    };
  }

  /**
   * Set business context for session (when customer selects S1234)
   */
  async setBusinessContext(sessionId: string, businessId: string): Promise<CustomerSession> {
    this.logger.debug(`Setting business context for session ${sessionId}: ${businessId}`);

    const updatedSession = await this.prisma.customerSession.update({
      where: { id: sessionId },
      data: {
        businessId,
        currentState: CustomerSessionState.BUSINESS_SELECTED,
        lastMessageAt: new Date(),
        expiresAt: new Date(Date.now() + this.SESSION_DURATION_MINUTES * 60 * 1000)
      }
    });

    return {
      id: updatedSession.id,
      customerPhone: updatedSession.customerPhone,
      businessId: updatedSession.businessId,
      currentState: updatedSession.currentState as CustomerSessionState,
      sessionData: updatedSession.sessionData,
      lastMessageAt: updatedSession.lastMessageAt,
      expiresAt: updatedSession.expiresAt,
      createdAt: updatedSession.createdAt,
      updatedAt: updatedSession.updatedAt
    };
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    this.logger.debug('Cleaning up expired sessions');

    const result = await this.prisma.customerSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    this.logger.debug(`Cleaned up ${result.count} expired sessions`);
    return result.count;
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    activeSessions: number;
    expiredSessions: number;
    totalSessions: number;
  }> {
    const now = new Date();

    const [activeSessions, totalSessions] = await Promise.all([
      this.prisma.customerSession.count({
        where: {
          expiresAt: { gte: now }
        }
      }),
      this.prisma.customerSession.count()
    ]);

    const expiredSessions = totalSessions - activeSessions;

    return {
      activeSessions,
      expiredSessions,
      totalSessions
    };
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

  private async findActiveSession(phoneNumber: string): Promise<any> {
    return await this.prisma.customerSession.findFirst({
      where: {
        customerPhone: phoneNumber,
        expiresAt: {
          gte: new Date()
        }
      }
    });
  }

  private async createNewSession(phoneNumber: string): Promise<any> {
    this.logger.debug(`Creating new session for phone: ${phoneNumber}`);

    return await this.prisma.customerSession.create({
      data: {
        customerPhone: phoneNumber,
        currentState: CustomerSessionState.INITIAL,
        expiresAt: new Date(Date.now() + this.SESSION_DURATION_MINUTES * 60 * 1000),
        sessionData: {}
      }
    });
  }

  private async extendSession(sessionId: string): Promise<any> {
    this.logger.debug(`Extending session: ${sessionId}`);

    return await this.prisma.customerSession.update({
      where: { id: sessionId },
      data: {
        expiresAt: new Date(Date.now() + this.SESSION_DURATION_MINUTES * 60 * 1000),
        lastMessageAt: new Date()
      }
    });
  }

  private async expireSession(sessionId: string): Promise<void> {
    await this.prisma.customerSession.update({
      where: { id: sessionId },
      data: {
        currentState: CustomerSessionState.EXPIRED
      }
    });
  }

  /**
   * Get session by phone number
   */
  async getSessionByPhone(phoneNumber: string): Promise<CustomerSession | null> {
    this.logger.debug(`Getting session for phone: ${phoneNumber}`);
    
    const session = await this.prisma.customerSession.findUnique({
      where: { customerPhone: phoneNumber }
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      customerPhone: session.customerPhone,
      businessId: session.businessId,
      currentState: session.currentState as CustomerSessionState,
      sessionData: session.sessionData,
      lastMessageAt: session.lastMessageAt,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation - starts with + followed by digits
    const phoneRegex = /^\+[1-9]\d{10,14}$/;
    return phoneRegex.test(phoneNumber);
  }
}