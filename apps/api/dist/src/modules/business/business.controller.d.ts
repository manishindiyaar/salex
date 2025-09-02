import { ConfigService } from '@nestjs/config';
import { AuthenticatedRequest } from '../auth/firebase-auth.guard';
import { UserService } from '../auth/user.service';
import { BusinessService } from './business.service';
import { BusinessRoutingService } from './business-routing.service';
import { QRCodeService, WhatsAppQRCodeData } from './qr-code.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
import { UpdateBusinessHoursRequestDto } from './dto/update-business-hours.dto';
import { ApiResponse, Business, BusinessHours, SetRoutingCodeRequest } from 'shared-types';
export declare class BusinessController {
    private readonly configService;
    private readonly userService;
    private readonly businessService;
    private readonly businessRoutingService;
    private readonly qrCodeService;
    private readonly logger;
    constructor(configService: ConfigService, userService: UserService, businessService: BusinessService, businessRoutingService: BusinessRoutingService, qrCodeService: QRCodeService);
    private ensureMockUserExists;
    createBusiness(req: AuthenticatedRequest, createData: CreateBusinessDto): Promise<ApiResponse<Business>>;
    getCurrentUserBusiness(req: AuthenticatedRequest): Promise<ApiResponse<Business | null>>;
    getBusiness(businessId: string): Promise<ApiResponse<Business>>;
    updateBusiness(req: AuthenticatedRequest, businessId: string, updateData: UpdateBusinessDto): Promise<ApiResponse<Business>>;
    getBusinessBookings(req: AuthenticatedRequest, businessId: string): Promise<ApiResponse<any[]>>;
    updateBusinessHours(req: AuthenticatedRequest, businessId: string, hoursData: UpdateBusinessHoursRequestDto): Promise<ApiResponse<Business>>;
    getBusinessHours(businessId: string): Promise<ApiResponse<BusinessHours>>;
    getBusinessOpenStatus(businessId: string): Promise<ApiResponse<{
        isOpen: boolean;
        currentTime: string;
    }>>;
    setBusinessRoutingCode(req: AuthenticatedRequest, businessId: string, { routingCode }: SetRoutingCodeRequest): Promise<ApiResponse<{
        routingCode: string;
        suggestions?: string[];
    }>>;
    getCodeStatistics(req: AuthenticatedRequest): Promise<ApiResponse<{
        totalAssigned: number;
        totalAvailable: number;
        utilizationPercentage: number;
    }>>;
    generateWhatsAppQR(req: AuthenticatedRequest, businessId: string, customMessage?: string): Promise<ApiResponse<WhatsAppQRCodeData>>;
    getQRVariations(req: AuthenticatedRequest, businessId: string): Promise<ApiResponse<WhatsAppQRCodeData[]>>;
    getMarketingMaterials(req: AuthenticatedRequest, businessId: string): Promise<ApiResponse<any>>;
}
