import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConditionalAuthGuard } from '../auth/conditional-auth.guard';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { BusinessServicesResponseDto } from './dto/business-services-response.dto';
import { ApiResponse } from 'shared-types';

@Controller('api/v1/businesses/:businessId/services')
export class ServiceController {
  private readonly logger = new Logger(ServiceController.name);
  
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @UseGuards(ConditionalAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createService(
    @Param('businessId') businessId: string,
    @Body() createServiceDto: CreateServiceDto,
    @Request() req: any,
  ): Promise<ApiResponse<ServiceResponseDto>> {
    const ownerId = req.user.id;
    this.logger.debug(`Creating service for business: ${businessId}, user: ${ownerId}`);
    
    try {
      const service = await this.serviceService.createService(businessId, ownerId, createServiceDto);
      
      return {
        success: true,
        data: service,
        message: 'Service created successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to create service: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  async getBusinessServices(
    @Param('businessId') businessId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<BusinessServicesResponseDto>> {
    this.logger.debug(`Getting services for business: ${businessId} (public access)`);
    
    try {
      let pagination;
      if (page && limit) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        
        if (pageNum > 0 && limitNum > 0 && limitNum <= 100) {
          pagination = { page: pageNum, limit: limitNum };
        }
      }

      const services = await this.serviceService.getBusinessServicesPublic(businessId, pagination);
      
      return {
        success: true,
        data: services,
        message: 'Services retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get services: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':serviceId')
  async getServiceById(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
  ): Promise<ApiResponse<ServiceResponseDto>> {
    this.logger.debug(`Getting service ${serviceId} for business: ${businessId} (public access)`);
    
    try {
      const service = await this.serviceService.getServiceByIdPublic(businessId, serviceId);
      
      return {
        success: true,
        data: service,
        message: 'Service retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get service: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':serviceId')
  @UseGuards(ConditionalAuthGuard)
  async updateService(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Request() req: any,
  ): Promise<ApiResponse<ServiceResponseDto>> {
    const ownerId = req.user.id;
    this.logger.debug(`Updating service ${serviceId} for business: ${businessId}, user: ${ownerId}`);
    
    try {
      const service = await this.serviceService.updateService(businessId, serviceId, ownerId, updateServiceDto);
      
      return {
        success: true,
        data: service,
        message: 'Service updated successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to update service: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':serviceId')
  @UseGuards(ConditionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteService(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @Request() req: any,
  ): Promise<ApiResponse<null>> {
    const ownerId = req.user.id;
    this.logger.debug(`Deleting service ${serviceId} for business: ${businessId}, user: ${ownerId}`);
    
    try {
      await this.serviceService.deleteService(businessId, serviceId, ownerId);
      
      return {
        success: true,
        data: null,
        message: 'Service deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete service: ${error.message}`, error.stack);
      throw error;
    }
  }
}
