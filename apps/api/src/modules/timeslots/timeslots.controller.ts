import {
  Controller,
  Get,
  Query,
  Param,
  Logger,
  HttpStatus,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { TimeSlotsService } from './timeslots.service';
import { ApiResponse, TimeSlotsResponse, TimeSlotsQuery } from 'shared-types';

@Controller('api/v1/businesses')
export class TimeSlotsController {
  private readonly logger = new Logger(TimeSlotsController.name);

  constructor(private readonly timeSlotsService: TimeSlotsService) {}

  /**
   * Get available time slots for a business (Public access for customers)
   */
  @Get(':businessId/timeslots')
  async getAvailableSlots(
    @Param('businessId') businessId: string,
    @Query('serviceId') serviceId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('slotInterval') slotInterval?: number,
  ): Promise<ApiResponse<TimeSlotsResponse>> {
    this.logger.debug(`Getting available slots for business: ${businessId} (public access)`);

    try {
      // Validate required parameters
      if (!startDate || !endDate) {
        throw new BadRequestException('startDate and endDate are required parameters');
      }

      // Validate date format
      if (!this.isValidDateFormat(startDate) || !this.isValidDateFormat(endDate)) {
        throw new BadRequestException('Date format must be YYYY-MM-DD');
      }

      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        throw new BadRequestException('startDate must be before or equal to endDate');
      }

      // Limit date range to prevent performance issues (max 30 days)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 30) {
        throw new BadRequestException('Date range cannot exceed 30 days');
      }

      const query: TimeSlotsQuery = {
        businessId,
        serviceId,
        startDate,
        endDate,
        slotInterval: slotInterval ? Number(slotInterval) : undefined,
      };

      const slotsResponse = await this.timeSlotsService.getAvailableSlots(query);
      
      return {
        success: true,
        data: slotsResponse,
        message: 'Available time slots retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get available slots: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      
      if (error.message === 'Business not found') {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }
      
      if (error.message === 'Service not found') {
        throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException('Failed to get available slots', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get available slots for today (Public access for customers)
   */
  @Get(':businessId/timeslots/today')
  async getTodayAvailableSlots(
    @Param('businessId') businessId: string,
    @Query('serviceId') serviceId?: string,
    @Query('slotInterval') slotInterval?: number,
  ): Promise<ApiResponse<TimeSlotsResponse>> {
    this.logger.debug(`Getting today's available slots for business: ${businessId} (public access)`);

    const today = new Date().toISOString().split('T')[0];
    
    return this.getAvailableSlots(
      businessId,
      serviceId,
      today,
      today,
      slotInterval
    );
  }

  /**
   * Get available slots for the next 7 days (Public access for customers)
   */
  @Get(':businessId/timeslots/week')
  async getWeekAvailableSlots(
    @Param('businessId') businessId: string,
    @Query('serviceId') serviceId?: string,
    @Query('slotInterval') slotInterval?: number,
  ): Promise<ApiResponse<TimeSlotsResponse>> {
    this.logger.debug(`Getting week's available slots for business: ${businessId} (public access)`);

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 6);

    const startDate = today.toISOString().split('T')[0];
    const endDate = nextWeek.toISOString().split('T')[0];
    
    return this.getAvailableSlots(
      businessId,
      serviceId,
      startDate,
      endDate,
      slotInterval
    );
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDateFormat(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
  }
}