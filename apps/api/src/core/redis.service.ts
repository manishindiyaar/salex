import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

export interface WhatsAppSession {
  customerPhone: string;
  businessId?: string;
  currentState: string;
  sessionData: any;
  lastMessageAt: string;
  createdAt: string;
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;
  private readonly sessionTTL: number;
  private readonly sessionPrefix: string;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('UPSTASH_REDIS_REST_URL');
    const redisToken = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN');
    
    if (!redisUrl || !redisToken) {
      throw new Error('Redis configuration missing. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
    }

    this.redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    this.sessionTTL = this.configService.get<number>('WHATSAPP_SESSION_TTL', 600); // 10 minutes default
    this.sessionPrefix = this.configService.get<string>('WHATSAPP_SESSION_PREFIX', 'wa_session');
    
    this.logger.log('Redis service initialized with Upstash');
  }

  /**
   * Generate session key in format: wa_session:{phone}
   */
  private getSessionKey(customerPhone: string): string {
    return `${this.sessionPrefix}:${customerPhone}`;
  }

  /**
   * Create or update WhatsApp session
   */
  async setSession(customerPhone: string, sessionData: Partial<WhatsAppSession>): Promise<void> {
    const key = this.getSessionKey(customerPhone);
    
    const session: WhatsAppSession = {
      customerPhone,
      currentState: 'INITIAL',
      sessionData: {},
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...sessionData,
    };

    try {
      // Set session with TTL
      await this.redis.setex(key, this.sessionTTL, JSON.stringify(session));
      this.logger.debug(`Session set for ${customerPhone} with TTL ${this.sessionTTL}s`);
    } catch (error) {
      this.logger.error(`Failed to set session for ${customerPhone}:`, error);
      throw error;
    }
  }

  /**
   * Get WhatsApp session by phone number
   */
  async getSession(customerPhone: string): Promise<WhatsAppSession | null> {
    const key = this.getSessionKey(customerPhone);
    
    try {
      const sessionData = await this.redis.get(key);
      
      if (!sessionData) {
        this.logger.debug(`No session found for ${customerPhone}`);
        return null;
      }

      return JSON.parse(sessionData as string);
    } catch (error) {
      this.logger.error(`Failed to get session for ${customerPhone}:`, error);
      return null;
    }
  }

  /**
   * Update session state and extend TTL
   */
  async updateSessionState(
    customerPhone: string, 
    newState: string, 
    sessionData?: any
  ): Promise<void> {
    const currentSession = await this.getSession(customerPhone);
    
    if (!currentSession) {
      this.logger.warn(`Trying to update non-existent session for ${customerPhone}`);
      return;
    }

    const updatedSession: WhatsAppSession = {
      ...currentSession,
      currentState: newState,
      sessionData: sessionData || currentSession.sessionData,
      lastMessageAt: new Date().toISOString(),
    };

    await this.setSession(customerPhone, updatedSession);
  }

  /**
   * Set business context for session
   */
  async setBusinessContext(customerPhone: string, businessId: string): Promise<void> {
    const currentSession = await this.getSession(customerPhone);
    
    const updatedSession: WhatsAppSession = {
      customerPhone,
      currentState: 'BUSINESS_SELECTED',
      sessionData: currentSession?.sessionData || {},
      lastMessageAt: new Date().toISOString(),
      createdAt: currentSession?.createdAt || new Date().toISOString(),
      businessId,
    };

    await this.setSession(customerPhone, updatedSession);
    this.logger.debug(`Business context set for ${customerPhone}: ${businessId}`);
  }

  /**
   * Delete session (manual cleanup)
   */
  async deleteSession(customerPhone: string): Promise<void> {
    const key = this.getSessionKey(customerPhone);
    
    try {
      await this.redis.del(key);
      this.logger.debug(`Session deleted for ${customerPhone}`);
    } catch (error) {
      this.logger.error(`Failed to delete session for ${customerPhone}:`, error);
    }
  }

  /**
   * Get all active sessions (for monitoring)
   */
  async getActiveSessionsCount(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.sessionPrefix}:*`);
      return Array.isArray(keys) ? keys.length : 0;
    } catch (error) {
      this.logger.error('Failed to get active sessions count:', error);
      return 0;
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return { status: 'unhealthy' };
    }
  }

  /**
   * Extend session TTL (on activity)
   */
  async extendSession(customerPhone: string): Promise<void> {
    const key = this.getSessionKey(customerPhone);
    
    try {
      await this.redis.expire(key, this.sessionTTL);
      this.logger.debug(`Session TTL extended for ${customerPhone}`);
    } catch (error) {
      this.logger.error(`Failed to extend session for ${customerPhone}:`, error);
    }
  }
}