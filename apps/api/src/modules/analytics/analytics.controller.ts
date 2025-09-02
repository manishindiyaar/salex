import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ConditionalAuthGuard } from '../auth/conditional-auth.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { DailyAnalyticsDto } from './dto/daily-analytics.dto';
import { ApiResponse } from 'shared-types';

@Controller('api/v1/businesses')
@UseGuards(ConditionalAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':businessId/analytics/daily')
  async getDailyAnalytics(
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsQueryDto,
    @Request() req: any
  ): Promise<ApiResponse<DailyAnalyticsDto>> {
    try {
      const userId = req.auth?.userId || req.user?.id;
      
      if (!userId) {
        return {
          success: false,
          error: 'User authentication required',
        };
      }

      const analytics = await this.analyticsService.getDailyAnalytics(
        businessId,
        userId,
        query.date,
        query.timezone
      );

      return {
        success: true,
        data: new DailyAnalyticsDto(analytics),
        message: 'Daily analytics retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve daily analytics',
      };
    }
  }
}
