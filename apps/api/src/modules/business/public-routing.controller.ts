import {
  Controller,
  Get,
  Param,
  Logger,
  HttpStatus,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { BusinessRoutingService } from './business-routing.service';
import { ApiResponse, CodeAvailabilityResponse, BusinessPublicInfo } from 'shared-types';

@Controller('api/v1/public/businesses')
export class PublicRoutingController {
  private readonly logger = new Logger(PublicRoutingController.name);

  constructor(private readonly businessRoutingService: BusinessRoutingService) {}

  /**
   * Check routing code availability (public endpoint)
   */
  @Get('routing-codes/:code/availability')
  async checkCodeAvailability(
    @Param('code') code: string,
  ): Promise<ApiResponse<CodeAvailabilityResponse>> {
    this.logger.debug(`Public: Checking availability for routing code: ${code}`);

    try {
      const availability = await this.businessRoutingService.checkCodeAvailability(code);
      
      return {
        success: true,
        data: availability,
        message: availability.available 
          ? 'Code is available' 
          : 'Code is taken, here are alternatives',
      };
    } catch (error) {
      this.logger.error(`Failed to check code availability: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      
      throw new HttpException('Failed to check code availability', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get business by routing code (public endpoint for customer discovery)
   */
  @Get('by-code/:code')
  async getBusinessByCode(
    @Param('code') code: string,
  ): Promise<ApiResponse<BusinessPublicInfo>> {
    this.logger.debug(`Public: Looking up business by routing code: ${code}`);

    try {
      const business = await this.businessRoutingService.findBusinessByRoutingCode(code);
      
      // Return only public business information
      const publicInfo: BusinessPublicInfo = {
        id: business.id,
        name: business.name,
        address: business.address,
        phoneNumber: business.phoneNumber,
        routingCode: business.routingCode!,
        hoursOfOperation: business.hoursOfOperation
      };
      
      return {
        success: true,
        data: publicInfo,
        message: 'Business found successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to find business by code: ${error.message}`, error.stack);
      
      if (error.message === 'Invalid routing code format') {
        throw new HttpException('Invalid routing code format', HttpStatus.BAD_REQUEST);
      }
      
      if (error.message.includes('No business found')) {
        throw new HttpException(`No business found with code S${code}`, HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException('Failed to find business', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}