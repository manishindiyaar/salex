import { BusinessServicesResponse, ServiceSummary } from 'shared-types';
import { ServiceResponseDto } from './service-response.dto';
export declare class BusinessServicesResponseDto implements BusinessServicesResponse {
    businessId: string;
    services: ServiceResponseDto[];
    summary: ServiceSummary;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    static create(businessId: string, services: any[], summary: ServiceSummary, pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }): BusinessServicesResponseDto;
}
