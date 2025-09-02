import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { BusinessServicesResponseDto } from './dto/business-services-response.dto';
import { ApiResponse } from 'shared-types';
export declare class ServiceController {
    private readonly serviceService;
    private readonly logger;
    constructor(serviceService: ServiceService);
    createService(businessId: string, createServiceDto: CreateServiceDto, req: any): Promise<ApiResponse<ServiceResponseDto>>;
    getBusinessServices(businessId: string, page?: string, limit?: string): Promise<ApiResponse<BusinessServicesResponseDto>>;
    getServiceById(businessId: string, serviceId: string): Promise<ApiResponse<ServiceResponseDto>>;
    updateService(businessId: string, serviceId: string, updateServiceDto: UpdateServiceDto, req: any): Promise<ApiResponse<ServiceResponseDto>>;
    deleteService(businessId: string, serviceId: string, req: any): Promise<ApiResponse<null>>;
}
