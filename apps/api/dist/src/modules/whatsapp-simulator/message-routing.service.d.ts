import { PrismaService } from '../../core/prisma.service';
import { BusinessService } from '../business/business.service';
import { ParseRoutingCodeRequest, ParseRoutingCodeResponse, BusinessRoutingMessage } from 'shared-types';
export declare class MessageRoutingService {
    private readonly prisma;
    private readonly businessService;
    private readonly logger;
    constructor(prisma: PrismaService, businessService: BusinessService);
    parseRoutingMessage(request: ParseRoutingCodeRequest): Promise<ParseRoutingCodeResponse>;
    hasRoutingCode(message: string): boolean;
    generateRoutingMessage(routingCode: string): string;
    getRoutingPatterns(): string[];
    isValidRoutingCode(code: string): boolean;
    private extractRoutingCodes;
    createBusinessRoutingMessage(routingCode: string): Promise<BusinessRoutingMessage>;
}
