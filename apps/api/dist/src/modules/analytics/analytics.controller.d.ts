import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { DailyAnalyticsDto } from './dto/daily-analytics.dto';
import { ApiResponse } from 'shared-types';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDailyAnalytics(businessId: string, query: AnalyticsQueryDto, req: any): Promise<ApiResponse<DailyAnalyticsDto>>;
}
