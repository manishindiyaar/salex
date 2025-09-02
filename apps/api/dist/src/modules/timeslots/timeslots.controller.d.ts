import { TimeSlotsService } from './timeslots.service';
import { ApiResponse, TimeSlotsResponse } from 'shared-types';
export declare class TimeSlotsController {
    private readonly timeSlotsService;
    private readonly logger;
    constructor(timeSlotsService: TimeSlotsService);
    getAvailableSlots(businessId: string, serviceId?: string, startDate?: string, endDate?: string, slotInterval?: number): Promise<ApiResponse<TimeSlotsResponse>>;
    getTodayAvailableSlots(businessId: string, serviceId?: string, slotInterval?: number): Promise<ApiResponse<TimeSlotsResponse>>;
    getWeekAvailableSlots(businessId: string, serviceId?: string, slotInterval?: number): Promise<ApiResponse<TimeSlotsResponse>>;
    private isValidDateFormat;
}
