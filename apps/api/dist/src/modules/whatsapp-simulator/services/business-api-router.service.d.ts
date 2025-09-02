import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma.service';
export declare class BusinessApiRouterService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private readonly httpClient;
    private readonly baseUrl;
    private serviceAccountToken;
    private tokenExpiry;
    constructor(prisma: PrismaService, configService: ConfigService);
    private getServiceAccountToken;
    private generateMockServiceToken;
    getBusinessByRoutingCode(routingCode: string): Promise<any>;
    getBusinessById(businessId: string): Promise<any>;
    getBusinessServices(businessId: string, userToken?: string): Promise<any[]>;
    getBusinessHours(businessId: string, userToken?: string): Promise<any>;
    getAvailableTimeSlots(businessId: string, userToken?: string, options?: {
        serviceId?: string;
        startDate?: string;
        endDate?: string;
        slotInterval?: number;
    }): Promise<any[]>;
    createBooking(businessId: string, userToken: string, bookingData: {
        serviceId: string;
        timeSlot: string;
        customerPhone: string;
        customerName?: string;
        notes?: string;
    }): Promise<any>;
    getBusinessOpenStatus(businessId: string, userToken?: string): Promise<any>;
    getBusinessAnalytics(businessId: string, userToken?: string, options?: {
        date?: string;
        timezone?: string;
    }): Promise<any>;
    checkApiHealth(): Promise<boolean>;
    getClientInfo(): {
        baseUrl: string;
        hasServiceAccount: boolean;
        tokenExpiry: Date | null;
    };
}
