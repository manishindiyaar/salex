import { CreateServiceRequest } from 'shared-types';
export declare class CreateServiceDto implements CreateServiceRequest {
    name: string;
    price: number;
    durationMinutes: number;
    description?: string;
}
