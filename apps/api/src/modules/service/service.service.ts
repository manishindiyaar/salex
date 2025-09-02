import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { BusinessServicesResponseDto } from './dto/business-services-response.dto';
import { ServiceSummary } from 'shared-types';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  async createService(
    businessId: string,
    ownerId: string,
    createServiceDto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    // Validate business ownership
    await this.validateBusinessOwnership(businessId, ownerId);

    // Check for duplicate service names within business
    await this.checkDuplicateServiceName(businessId, createServiceDto.name);

    // Create service record
    const service = await this.prisma.service.create({
      data: {
        ...createServiceDto,
        businessId,
      },
    });

    return ServiceResponseDto.fromEntity(service);
  }

  async getBusinessServices(
    businessId: string,
    ownerId: string,
    pagination?: { page: number; limit: number },
  ): Promise<BusinessServicesResponseDto> {
    // Validate business ownership
    await this.validateBusinessOwnership(businessId, ownerId);

    // Calculate pagination parameters
    const skip = pagination ? (pagination.page - 1) * pagination.limit : 0;
    const take = pagination?.limit;

    // Get services with pagination
    const services = await this.prisma.service.findMany({
      where: { businessId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate service summary
    const summary = await this.calculateServiceSummary(businessId);

    // Calculate pagination info if needed
    let paginationInfo;
    if (pagination) {
      const total = await this.prisma.service.count({
        where: { businessId },
      });
      paginationInfo = {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      };
    }

    return BusinessServicesResponseDto.create(businessId, services, summary, paginationInfo);
  }

  async getServiceById(
    businessId: string,
    serviceId: string,
    ownerId: string,
  ): Promise<ServiceResponseDto> {
    // Validate business ownership and service existence
    const service = await this.validateServiceOwnership(businessId, serviceId, ownerId);
    
    return ServiceResponseDto.fromEntity(service);
  }

  async getBusinessServicesPublic(
    businessId: string,
    pagination?: { page: number; limit: number },
  ): Promise<BusinessServicesResponseDto> {
    // Verify business exists
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Calculate pagination parameters
    const skip = pagination ? (pagination.page - 1) * pagination.limit : 0;
    const take = pagination?.limit;

    // Get services with pagination
    const services = await this.prisma.service.findMany({
      where: { businessId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate service summary
    const summary = await this.calculateServiceSummary(businessId);

    // Calculate pagination info if needed
    let paginationInfo;
    if (pagination) {
      const total = await this.prisma.service.count({
        where: { businessId },
      });
      paginationInfo = {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      };
    }

    return BusinessServicesResponseDto.create(businessId, services, summary, paginationInfo);
  }

  async getServiceByIdPublic(
    businessId: string,
    serviceId: string,
  ): Promise<ServiceResponseDto> {
    // Verify business exists
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }
    
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, businessId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }
    
    return ServiceResponseDto.fromEntity(service);
  }

  async updateService(
    businessId: string,
    serviceId: string,
    ownerId: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    // Validate business ownership and service existence
    await this.validateServiceOwnership(businessId, serviceId, ownerId);

    // Check for duplicate names if name is being updated
    if (updateServiceDto.name) {
      await this.checkDuplicateServiceName(businessId, updateServiceDto.name, serviceId);
    }

    // Update service record
    const service = await this.prisma.service.update({
      where: { id: serviceId },
      data: updateServiceDto,
    });

    return ServiceResponseDto.fromEntity(service);
  }

  async deleteService(
    businessId: string,
    serviceId: string,
    ownerId: string,
  ): Promise<void> {
    // Validate business ownership and service existence
    await this.validateServiceOwnership(businessId, serviceId, ownerId);

    // Check for existing bookings (future implementation)
    const hasBookings = await this.checkServiceBookings(serviceId);
    if (hasBookings) {
      throw new ConflictException('Cannot delete service with existing bookings');
    }

    // Delete service record
    await this.prisma.service.delete({
      where: { id: serviceId },
    });
  }

  private async validateBusinessOwnership(businessId: string, ownerId: string): Promise<void> {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId },
    });

    if (!business) {
      throw new ForbiddenException('Access denied: Business not found or not owned by user');
    }
  }

  private async validateServiceOwnership(
    businessId: string,
    serviceId: string,
    ownerId: string,
  ): Promise<any> {
    await this.validateBusinessOwnership(businessId, ownerId);

    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, businessId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  private async checkDuplicateServiceName(
    businessId: string,
    name: string,
    excludeServiceId?: string,
  ): Promise<void> {
    const whereCondition: any = {
      businessId,
      name: {
        equals: name,
        mode: 'insensitive', // Case-insensitive comparison
      },
    };

    if (excludeServiceId) {
      whereCondition.id = { not: excludeServiceId };
    }

    const existingService = await this.prisma.service.findFirst({
      where: whereCondition,
    });

    if (existingService) {
      throw new ConflictException('A service with this name already exists for this business');
    }
  }

  private async checkServiceBookings(serviceId: string): Promise<boolean> {
    const bookingCount = await this.prisma.booking.count({
      where: { 
        serviceId,
        status: {
          in: ['PENDING', 'CONFIRMED'], // Only check for active bookings
        },
      },
    });

    return bookingCount > 0;
  }

  private async calculateServiceSummary(businessId: string): Promise<ServiceSummary> {
    const services = await this.prisma.service.findMany({
      where: { businessId },
      select: {
        price: true,
        durationMinutes: true,
      },
    });

    if (services.length === 0) {
      return {
        totalServices: 0,
        averagePrice: 0,
        totalPotentialRevenue: 0,
        shortestService: 0,
        longestService: 0,
      };
    }

    const prices = services.map(s => parseFloat(s.price.toString()));
    const durations = services.map(s => s.durationMinutes);

    return {
      totalServices: services.length,
      averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      totalPotentialRevenue: prices.reduce((sum, price) => sum + price, 0),
      shortestService: Math.min(...durations),
      longestService: Math.max(...durations),
    };
  }
}