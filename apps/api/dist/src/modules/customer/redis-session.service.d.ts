import { RedisService, WhatsAppSession } from '../../core/redis.service';
import { PrismaService } from '../../core/prisma.service';
import { CustomerAuthRequest, CustomerAuthResponse, CustomerSessionState } from 'shared-types';
export declare class RedisSessionService {
    private readonly redisService;
    private readonly prisma;
    private readonly logger;
    constructor(redisService: RedisService, prisma: PrismaService);
    authenticateCustomer(request: CustomerAuthRequest): Promise<CustomerAuthResponse>;
    getSession(sessionId: string): Promise<WhatsAppSession>;
    updateSessionState(sessionId: string, state: CustomerSessionState, sessionData?: any): Promise<WhatsAppSession>;
    setBusinessContext(sessionId: string, businessId: string): Promise<WhatsAppSession>;
    getSessionStats(): Promise<{
        activeSessions: number;
        redisHealth: any;
    }>;
    cleanupSession(sessionId: string): Promise<void>;
    extendSession(sessionId: string): Promise<void>;
    private findOrCreateCustomer;
    private isValidPhoneNumber;
    healthCheck(): Promise<{
        redis: any;
        sessions: number;
        status: string;
    }>;
}
