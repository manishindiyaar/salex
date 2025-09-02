import { PrismaService } from '../../core/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { BusinessServicesResponseDto } from './dto/business-services-response.dto';
export declare class ServiceService {
    private prisma;
    constructor(prisma: PrismaService);
    createService(businessId: string, ownerId: string, createServiceDto: CreateServiceDto): Promise<ServiceResponseDto>;
    getBusinessServices(businessId: string, ownerId: string, pagination?: {
        page: number;
        limit: number;
    }): Promise<BusinessServicesResponseDto>;
    getServiceById(businessId: string, serviceId: string, ownerId: string): Promise<ServiceResponseDto>;
    getBusinessServicesPublic(businessId: string, pagination?: {
        page: number;
        limit: number;
    }): Promise<BusinessServicesResponseDto>;
    getServiceByIdPublic(businessId: string, serviceId: string): Promise<ServiceResponseDto>;
    updateService(businessId: string, serviceId: string, ownerId: string, updateServiceDto: UpdateServiceDto): Promise<ServiceResponseDto>;
    deleteService(businessId: string, serviceId: string, ownerId: string): Promise<void>;
    private validateBusinessOwnership;
    private validateServiceOwnership;
    private checkDuplicateServiceName;
    private checkServiceBookings;
    private calculateServiceSummary;
}
