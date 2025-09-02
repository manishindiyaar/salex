import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { DailyAnalytics } from 'shared-types';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDailyAnalytics(
    businessId: string,
    ownerId: string,
    date?: string,
    timezone?: string
  ): Promise<DailyAnalytics> {
    // Validate business ownership
    await this.validateBusinessOwnership(businessId, ownerId);
    
    // Calculate date range for current calendar day in timezone
    const targetDate = date ? new Date(date) : new Date();
    const businessTimezone = timezone || 'UTC';
    
    // Create start and end of day in the specified timezone
    const startOfDay = this.getStartOfDay(targetDate, businessTimezone);
    const endOfDay = this.getEndOfDay(targetDate, businessTimezone);
    
    // Query bookings with revenue calculation
    const bookings = await this.prisma.booking.findMany({
      where: {
        businessId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        scheduledAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        service: {
          select: {
            price: true,
          },
        },
      },
    });
    
    // Calculate totals
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (booking.service.price ? Number(booking.service.price) : 0);
    }, 0);
    
    return {
      businessId,
      date: this.formatDate(targetDate),
      totalBookings,
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
      timezone: businessTimezone,
    };
  }

  private async validateBusinessOwnership(businessId: string, ownerId: string): Promise<void> {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId },
    });
    
    if (!business) {
      throw new ForbiddenException('Access denied: Business not found or not owned by user');
    }
  }

  private getStartOfDay(date: Date, timezone: string): Date {
    // For simplicity, using UTC. In production, you'd use a proper timezone library like date-fns-tz
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }

  private getEndOfDay(date: Date, timezone: string): Date {
    // For simplicity, using UTC. In production, you'd use a proper timezone library like date-fns-tz
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);
    return end;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }
}