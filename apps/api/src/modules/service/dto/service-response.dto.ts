import { ServiceResponse } from 'shared-types';

export class ServiceResponseDto implements ServiceResponse {
  id: string;
  businessId: string;
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
  createdAt: string;
  updatedAt: string;

  static fromEntity(service: any): ServiceResponseDto {
    return {
      id: service.id,
      businessId: service.businessId,
      name: service.name,
      price: parseFloat(service.price.toString()),
      durationMinutes: service.durationMinutes,
      description: service.description,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }
}