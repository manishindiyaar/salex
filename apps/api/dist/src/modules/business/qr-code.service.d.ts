import { ConfigService } from '@nestjs/config';
import { BusinessService } from './business.service';
import { BusinessRoutingService } from './business-routing.service';
export interface WhatsAppQRCodeData {
    qrCodeUrl: string;
    whatsappUrl: string;
    routingCode: string;
    businessName: string;
    message: string;
}
export declare class QRCodeService {
    private readonly configService;
    private readonly businessService;
    private readonly businessRoutingService;
    private readonly logger;
    private readonly whatsappNumber;
    private readonly businessPrefix;
    constructor(configService: ConfigService, businessService: BusinessService, businessRoutingService: BusinessRoutingService);
    generateBusinessQR(businessId: string, userId: string, customMessage?: string): Promise<WhatsAppQRCodeData>;
    generateBusinessQRVariations(businessId: string, userId: string): Promise<WhatsAppQRCodeData[]>;
    private generateWhatsAppURL;
    private generateQRCodeURL;
    getBusinessQRStats(businessId: string, userId: string): Promise<{
        routingCode: string;
        businessName: string;
        qrGenerated: boolean;
        suggestedMessages: string[];
    }>;
    validateAndSuggestCode(preferredCode: string): Promise<{
        isAvailable: boolean;
        suggestions: string[];
    }>;
    generateMarketingMaterials(businessId: string, userId: string): Promise<{
        qrCodes: WhatsAppQRCodeData[];
        printableText: string[];
        socialMediaText: string[];
    }>;
}
