import { BusinessType } from 'shared-types';
export declare class CreateBusinessDto {
    name: string;
    businessType: BusinessType;
    phoneNumber: string;
    address: string;
    hoursOfOperation?: Record<string, {
        open: string;
        close: string;
        closed: boolean;
    }>;
}
export declare class UpdateBusinessDto {
    name?: string;
    businessType?: BusinessType;
    phoneNumber?: string;
    address?: string;
    hoursOfOperation?: Record<string, {
        open: string;
        close: string;
        closed: boolean;
    }>;
}
