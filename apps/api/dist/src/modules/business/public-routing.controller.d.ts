import { BusinessRoutingService } from './business-routing.service';
import { ApiResponse, CodeAvailabilityResponse, BusinessPublicInfo } from 'shared-types';
export declare class PublicRoutingController {
    private readonly businessRoutingService;
    private readonly logger;
    constructor(businessRoutingService: BusinessRoutingService);
    checkCodeAvailability(code: string): Promise<ApiResponse<CodeAvailabilityResponse>>;
    getBusinessByCode(code: string): Promise<ApiResponse<BusinessPublicInfo>>;
}
