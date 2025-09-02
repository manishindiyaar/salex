import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { TimeSlot, BusinessHours, DaySchedule, TimeSlotsQuery, TimeSlotsResponse } from 'shared-types';

@Injectable()
export class TimeSlotsService {
  private readonly logger = new Logger(TimeSlotsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get available time slots for a business
   */
  async getAvailableSlots(query: TimeSlotsQuery): Promise<TimeSlotsResponse> {
    this.logger.debug(`Getting available slots for business: ${query.businessId}`);

    // Get business with hours
    const business = await this.getBusinessWithHours(query.businessId);
    
    // Get service duration if serviceId provided
    let serviceDuration = query.slotInterval || 30; // Default 30 minutes
    if (query.serviceId) {
      const service = await this.getService(query.serviceId);
      serviceDuration = service.durationMinutes;
    }

    // Get existing bookings in the date range
    const bookings = await this.getBookingsInRange(query.businessId, query.startDate, query.endDate);

    // Calculate available slots
    const slots = await this.calculateAvailableSlots(
      business.hoursOfOperation as BusinessHours,
      query.startDate,
      query.endDate,
      serviceDuration,
      bookings
    );

    return {
      businessId: query.businessId,
      serviceId: query.serviceId,
      dateRange: {
        start: query.startDate,
        end: query.endDate,
      },
      slots,
      slotInterval: serviceDuration,
      businessHours: business.hoursOfOperation as BusinessHours,
    };
  }

  /**
   * Calculate available slots based on business hours and existing bookings
   */
  private async calculateAvailableSlots(
    businessHours: BusinessHours,
    startDate: string,
    endDate: string,
    serviceDuration: number,
    existingBookings: any[]
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Iterate through each date in the range
    for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
      const dateStr = this.formatDateToString(currentDate);
      const dayName = this.getDayName(currentDate.getDay());
      const daySchedule = businessHours[dayName as keyof BusinessHours];

      // Skip if business is closed on this day
      if (!daySchedule || daySchedule.closed) {
        continue;
      }

      // Generate slots for this day
      const dailySlots = this.generateDailySlots(dateStr, daySchedule, serviceDuration);
      
      // Filter out slots that conflict with existing bookings
      const availableSlots = this.filterAvailableSlots(dailySlots, existingBookings, dateStr);
      
      slots.push(...availableSlots);
    }

    return slots.sort((a, b) => {
      // Sort by date first, then by time
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }

  /**
   * Generate time slots for a single day
   */
  private generateDailySlots(date: string, daySchedule: DaySchedule, serviceDuration: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const openMinutes = this.parseTimeToMinutes(daySchedule.open);
    const closeMinutes = this.parseTimeToMinutes(daySchedule.close);

    // Generate slots from open to close time
    for (let currentMinutes = openMinutes; currentMinutes + serviceDuration <= closeMinutes; currentMinutes += serviceDuration) {
      const startTime = this.formatMinutesToTime(currentMinutes);
      const endTime = this.formatMinutesToTime(currentMinutes + serviceDuration);

      slots.push({
        startTime,
        endTime,
        available: true,
        date,
        duration: serviceDuration,
      });
    }

    return slots;
  }

  /**
   * Filter out slots that conflict with existing bookings
   */
  private filterAvailableSlots(slots: TimeSlot[], existingBookings: any[], date: string): TimeSlot[] {
    return slots.map(slot => {
      // Check if this slot conflicts with any existing booking
      const hasConflict = existingBookings.some(booking => {
        const bookingDate = this.formatDateToString(new Date(booking.scheduledAt));
        if (bookingDate !== date) {
          return false;
        }

        const bookingTime = this.formatTimeFromDate(new Date(booking.scheduledAt));
        const bookingStartMinutes = this.parseTimeToMinutes(bookingTime);
        const bookingEndMinutes = bookingStartMinutes + (booking.service?.durationMinutes || 30);

        const slotStartMinutes = this.parseTimeToMinutes(slot.startTime);
        const slotEndMinutes = this.parseTimeToMinutes(slot.endTime);

        // Check for time overlap
        return !(bookingEndMinutes <= slotStartMinutes || bookingStartMinutes >= slotEndMinutes);
      });

      return {
        ...slot,
        available: !hasConflict,
      };
    });
  }

  /**
   * Get business with hours of operation
   */
  private async getBusinessWithHours(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        hoursOfOperation: true,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  /**
   * Get service details
   */
  private async getService(serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        durationMinutes: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Get bookings in date range
   */
  private async getBookingsInRange(businessId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    return await this.prisma.booking.findMany({
      where: {
        businessId,
        scheduledAt: {
          gte: start,
          lte: end,
        },
        status: {
          notIn: ['CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
        },
      },
      include: {
        service: {
          select: {
            durationMinutes: true,
          },
        },
      },
    });
  }

  /**
   * Parse time string to minutes since midnight
   */
  private parseTimeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format minutes since midnight to time string
   */
  private formatMinutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get day name from day number
   */
  private getDayName(dayNumber: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNumber];
  }

  /**
   * Format Date object to YYYY-MM-DD string
   */
  private formatDateToString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format time from Date object to HH:MM string
   */
  private formatTimeFromDate(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }
}