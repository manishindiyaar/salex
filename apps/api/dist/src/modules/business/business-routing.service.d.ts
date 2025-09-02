import { PrismaService } from '../../core/prisma.service';
import { CodeAvailabilityResponse } from 'shared-types';
export declare class BusinessRoutingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    isCodeAvailable(code: string): Promise<boolean>;
    checkCodeAvailability(code: string): Promise<CodeAvailabilityResponse>;
    suggestSimilarCodes(preferredCode: string, limit?: number): Promise<string[]>;
    setBusinessRoutingCode(businessId: string, routingCode: string, userId: string): Promise<void>;
    findBusinessByRoutingCode(code: string): Promise<{
        id: string;
        phoneNumber: string;
        name: string;
        address: string;
        hoursOfOperation: import("@prisma/client/runtime/library").JsonValue;
        routingCode: string;
    }>;
    generateAvailableCode(): Promise<string>;
    getCodeStatistics(): Promise<{
        totalAssigned: number;
        totalAvailable: number;
        utilizationPercentage: number;
    }>;
    private isValidCode;
    private formatCode;
}
