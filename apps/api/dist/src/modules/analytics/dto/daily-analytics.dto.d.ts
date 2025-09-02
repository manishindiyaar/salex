import { DailyAnalyticsResponse } from 'shared-types';
export declare class DailyAnalyticsDto implements DailyAnalyticsResponse {
    businessId: string;
    date: string;
    totalBookings: number;
    totalRevenue: number;
    timezone: string;
    constructor(data: DailyAnalyticsResponse);
}
