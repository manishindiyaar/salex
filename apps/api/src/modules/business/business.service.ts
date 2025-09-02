import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { Business, Service, BusinessHours, DaySchedule } from 'shared-types';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new business with associated Salon record
   */
  async createBusiness(ownerId: string, createData: CreateBusinessDto): Promise<Business> {
    this.logger.debug(`Creating business for owner: ${ownerId}`);

    try {
      // Use transaction to ensure Business and Salon are created atomically
      const result = await this.prisma.$transaction(async (tx) => {
        // Create Business record
        const business = await tx.business.create({
          data: {
            ...createData,
            ownerId,
            businessType: 'SALON', // Force SALON type as per Story 1.4
            hoursOfOperation: createData.hoursOfOperation || {},
          },
        });

        // Create associated Salon record
        await tx.salon.create({
          data: {
            businessId: business.id,
          },
        });

        // Return business with salon relationship
        return await tx.business.findUnique({
          where: { id: business.id },
          include: { salon: true },
        });
      });

      this.logger.log(`Business and Salon created successfully: ${result.id}`);
      return result as Business;
    } catch (error) {
      this.logger.error(`Failed to create business: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get business by ID with ownership verification
   */
  async getBusinessById(businessId: string, userId: string): Promise<Business> {
    this.logger.debug(`Getting business: ${businessId} for user: ${userId}`);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { salon: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this business');
    }

    return business as Business;
  }

  /**
   * Get business by ID - public access for customers (no ownership verification)
   */
  async getBusinessByIdPublic(businessId: string): Promise<Business> {
    this.logger.debug(`Getting business: ${businessId} (public access)`);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { salon: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business as Business;
  }

  /**
   * Update business details
   */
  async updateBusiness(businessId: string, userId: string, updateData: UpdateBusinessDto): Promise<Business> {
    this.logger.debug(`Updating business: ${businessId} for user: ${userId}`);

    // Verify ownership first
    await this.getBusinessById(businessId, userId);

    try {
      const business = await this.prisma.business.update({
        where: { id: businessId },
        data: updateData,
        include: { salon: true },
      });

      this.logger.log(`Business updated successfully: ${businessId}`);
      return business as Business;
    } catch (error) {
      this.logger.error(`Failed to update business: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get business services
   */
  async getBusinessServices(businessId: string, userId: string): Promise<Service[]> {
    this.logger.debug(`Getting services for business: ${businessId}`);

    // Verify ownership first
    await this.getBusinessById(businessId, userId);

    const services = await this.prisma.service.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    // Convert Prisma Decimal to number for price field
    return services.map(service => ({
      ...service,
      price: service.price.toNumber(),
    })) as Service[];
  }

  /**
   * Get business bookings
   */
  async getBusinessBookings(businessId: string, userId: string) {
    this.logger.debug(`Getting bookings for business: ${businessId}`);

    // Verify ownership first
    await this.getBusinessById(businessId, userId);

    const bookings = await this.prisma.booking.findMany({
      where: { businessId },
      include: {
        customer: true,
        service: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return bookings;
  }

  /**
   * Get user's primary business (first business)
   */
  async getUserPrimaryBusiness(userId: string): Promise<Business | null> {
    this.logger.debug(`Getting primary business for user: ${userId}`);

    const business = await this.prisma.business.findFirst({
      where: { ownerId: userId },
      include: { salon: true },
      orderBy: { createdAt: 'asc' },
    });

    return business as Business | null;
  }

  /**
   * Find business by phone number (for WhatsApp integration)
   */
  async findBusinessByPhoneNumber(phoneNumber: string): Promise<Business | null> {
    this.logger.debug(`Finding business by phone number: ${phoneNumber}`);

    const business = await this.prisma.business.findFirst({
      where: { phoneNumber },
    });

    return business as Business | null;
  }

  /**
   * Find business by routing code (for customer discovery)
   */
  async findBusinessByRoutingCode(routingCode: string): Promise<Business | null> {
    this.logger.debug(`Finding business by routing code: ${routingCode}`);

    const business = await this.prisma.business.findUnique({
      where: { routingCode },
      include: { salon: true },
    });

    return business as Business | null;
  }

  /**
   * Update business hours
   */
  async updateBusinessHours(businessId: string, userId: string, hoursOfOperation: BusinessHours): Promise<Business> {
    this.logger.debug(`Updating business hours for business: ${businessId} by user: ${userId}`);

    // Verify ownership first
    await this.getBusinessById(businessId, userId);

    // Validate hours format and logic
    this.validateBusinessHours(hoursOfOperation);

    try {
      const business = await this.prisma.business.update({
        where: { id: businessId },
        data: { hoursOfOperation: hoursOfOperation as any },
        include: { salon: true },
      });

      this.logger.log(`Business hours updated successfully: ${businessId}`);
      return business as Business;
    } catch (error) {
      this.logger.error(`Failed to update business hours: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get business hours
   */
  async getBusinessHours(businessId: string, userId: string): Promise<BusinessHours> {
    this.logger.debug(`Getting business hours for business: ${businessId}`);

    const business = await this.getBusinessById(businessId, userId);
    
    return (business.hoursOfOperation as BusinessHours) || this.getDefaultBusinessHours();
  }

  /**
   * Get business hours - public access for customers (no ownership verification)
   */
  async getBusinessHoursPublic(businessId: string): Promise<BusinessHours> {
    this.logger.debug(`Getting business hours for business: ${businessId} (public access)`);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { hoursOfOperation: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }
    
    return (business.hoursOfOperation as BusinessHours) || this.getDefaultBusinessHours();
  }

  /**
   * Validate business hours format and logic
   */
  private validateBusinessHours(hours: BusinessHours): void {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      const daySchedule = hours[day as keyof BusinessHours];
      if (daySchedule) {
        this.validateDaySchedule(daySchedule, day);
      }
    }
  }

  /**
   * Validate individual day schedule
   */
  private validateDaySchedule(schedule: DaySchedule, dayName: string): void {
    // If closed, no need to validate times
    if (schedule.closed) {
      return;
    }

    // Validate time format (HH:MM)
    const timeFormat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeFormat.test(schedule.open)) {
      throw new BadRequestException(`Invalid open time format for ${dayName}. Use HH:MM format.`);
    }
    
    if (!timeFormat.test(schedule.close)) {
      throw new BadRequestException(`Invalid close time format for ${dayName}. Use HH:MM format.`);
    }

    // Validate logical constraints (open time before close time)
    const openTime = this.parseTimeToMinutes(schedule.open);
    const closeTime = this.parseTimeToMinutes(schedule.close);

    if (openTime >= closeTime) {
      throw new BadRequestException(`Open time must be before close time for ${dayName}.`);
    }

    // Validate reasonable business hours (6 AM - 12 AM range)
    if (openTime < 6 * 60 || closeTime > 24 * 60) {
      throw new BadRequestException(`Business hours for ${dayName} must be between 06:00 and 24:00.`);
    }
  }

  /**
   * Parse time string to minutes since midnight
   */
  private parseTimeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get default business hours (9 AM - 6 PM, Monday to Saturday)
   */
  private getDefaultBusinessHours(): BusinessHours {
    const defaultHours: DaySchedule = { open: '09:00', close: '18:00', closed: false };
    const closedDay: DaySchedule = { open: '09:00', close: '18:00', closed: true };

    return {
      monday: defaultHours,
      tuesday: defaultHours,
      wednesday: defaultHours,
      thursday: defaultHours,
      friday: defaultHours,
      saturday: defaultHours,
      sunday: closedDay,
    };
  }

  /**
   * Check if business is open on a specific date and time
   */
  async isBusinessOpen(businessId: string, dateTime: Date): Promise<boolean> {
    this.logger.debug(`Checking if business ${businessId} is open at ${dateTime}`);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { hoursOfOperation: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const hours = (business.hoursOfOperation as BusinessHours) || this.getDefaultBusinessHours();
    const dayName = this.getDayName(dateTime.getDay());
    const daySchedule = hours[dayName as keyof BusinessHours];

    if (!daySchedule || daySchedule.closed) {
      return false;
    }

    const currentTime = this.formatTimeFromDate(dateTime);
    const currentMinutes = this.parseTimeToMinutes(currentTime);
    const openMinutes = this.parseTimeToMinutes(daySchedule.open);
    const closeMinutes = this.parseTimeToMinutes(daySchedule.close);

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  /**
   * Get day name from day number
   */
  private getDayName(dayNumber: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNumber];
  }

  /**
   * Format time from Date object to HH:MM string
   */
  private formatTimeFromDate(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }
}