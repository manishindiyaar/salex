import { ServiceResponse } from 'shared-types';
export declare class ServiceResponseDto implements ServiceResponse {
    id: string;
    businessId: string;
    name: string;
    price: number;
    durationMinutes: number;
    description?: string;
    createdAt: string;
    updatedAt: string;
    static fromEntity(service: any): ServiceResponseDto;
}
