import { ConfigService } from '@nestjs/config';
export interface WhatsAppSession {
    customerPhone: string;
    businessId?: string;
    currentState: string;
    sessionData: any;
    lastMessageAt: string;
    createdAt: string;
}
export declare class RedisService {
    private readonly configService;
    private readonly logger;
    private readonly redis;
    private readonly sessionTTL;
    private readonly sessionPrefix;
    constructor(configService: ConfigService);
    private getSessionKey;
    setSession(customerPhone: string, sessionData: Partial<WhatsAppSession>): Promise<void>;
    getSession(customerPhone: string): Promise<WhatsAppSession | null>;
    updateSessionState(customerPhone: string, newState: string, sessionData?: any): Promise<void>;
    setBusinessContext(customerPhone: string, businessId: string): Promise<void>;
    deleteSession(customerPhone: string): Promise<void>;
    getActiveSessionsCount(): Promise<number>;
    healthCheck(): Promise<{
        status: string;
        latency?: number;
    }>;
    extendSession(customerPhone: string): Promise<void>;
}
