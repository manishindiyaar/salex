import { UpdateServiceRequest } from 'shared-types';
export declare class UpdateServiceDto implements UpdateServiceRequest {
    name?: string;
    price?: number;
    durationMinutes?: number;
    description?: string;
}
