import { TimeSlotsQuery } from 'shared-types';
export declare class TimeSlotsQueryDto implements TimeSlotsQuery {
    businessId: string;
    serviceId?: string;
    startDate: string;
    endDate: string;
    slotInterval?: number;
}
