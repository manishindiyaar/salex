import { PrismaService } from '../../core/prisma.service';
import { CustomerSession, CustomerSessionState, CustomerAuthRequest, CustomerAuthResponse } from 'shared-types';
export declare class CustomerSessionService {
    private readonly prisma;
    private readonly logger;
    private readonly SESSION_DURATION_MINUTES;
    constructor(prisma: PrismaService);
    authenticateCustomer(request: CustomerAuthRequest): Promise<CustomerAuthResponse>;
    getSession(sessionId: string): Promise<CustomerSession>;
    updateSessionState(sessionId: string, state: CustomerSessionState, sessionData?: any): Promise<CustomerSession>;
    setBusinessContext(sessionId: string, businessId: string): Promise<CustomerSession>;
    cleanupExpiredSessions(): Promise<number>;
    getSessionStats(): Promise<{
        activeSessions: number;
        expiredSessions: number;
        totalSessions: number;
    }>;
    private findOrCreateCustomer;
    private findActiveSession;
    private createNewSession;
    private extendSession;
    private expireSession;
    getSessionByPhone(phoneNumber: string): Promise<CustomerSession | null>;
    private isValidPhoneNumber;
}
