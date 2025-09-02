import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { BookingStatus } from 'shared-types';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createBooking(businessId: string, createBookingDto: CreateBookingDto): Promise<BookingResponseDto> {
    this.logger.debug(`Creating booking for business: ${businessId}`);

    // Verify business exists
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Verify service exists and belongs to business
    const service = await this.prisma.service.findFirst({
      where: {
        id: createBookingDto.serviceId,
        businessId: businessId,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Create or get customer
    let customer = await this.prisma.customer.findUnique({
      where: { phoneNumber: createBookingDto.customerPhone },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          phoneNumber: createBookingDto.customerPhone,
          name: createBookingDto.customerName || null,
        },
      });
    } else if (createBookingDto.customerName && !customer.name) {
      // Update customer name if provided and not already set
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: { name: createBookingDto.customerName },
      });
    }

    // Validate scheduled time is in the future
    const scheduledAt = new Date(createBookingDto.scheduledAt);
    const now = new Date();
    
    if (scheduledAt <= now) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    // Check for time slot conflicts (basic check - same service, same time)
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        businessId: businessId,
        serviceId: createBookingDto.serviceId,
        scheduledAt: scheduledAt,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
      },
    });

    if (conflictingBooking) {
      throw new BadRequestException('Time slot is already booked');
    }

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        businessId: businessId,
        customerId: customer.id,
        serviceId: createBookingDto.serviceId,
        scheduledAt: scheduledAt,
        notes: createBookingDto.notes || null,
        status: BookingStatus.PENDING,
      },
      include: {
        customer: true,
        service: true,
        business: true,
      },
    });

    return this.mapToBookingResponse(booking);
  }

  async getBookingById(bookingId: string, includeRelations: boolean = true): Promise<BookingResponseDto> {
    this.logger.debug(`Getting booking: ${bookingId}`);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: includeRelations ? {
        customer: true,
        service: true,
        business: true,
      } : undefined,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.mapToBookingResponse(booking);
  }

  async getBusinessBookings(
    businessId: string, 
    ownerId: string,
    status?: BookingStatus,
    startDate?: string,
    endDate?: string
  ): Promise<BookingResponseDto[]> {
    this.logger.debug(`Getting bookings for business: ${businessId}`);

    // Verify user owns the business
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: ownerId,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found or access denied');
    }

    const whereClause: any = {
      businessId: businessId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.scheduledAt = {};
      if (startDate) {
        whereClause.scheduledAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.scheduledAt.lte = new Date(endDate);
      }
    }

    const bookings = await this.prisma.booking.findMany({
      where: whereClause,
      include: {
        customer: true,
        service: true,
        business: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return bookings.map(booking => this.mapToBookingResponse(booking));
  }

  async getCustomerBookings(customerPhone: string): Promise<BookingResponseDto[]> {
    this.logger.debug(`Getting bookings for customer: ${customerPhone}`);

    const customer = await this.prisma.customer.findUnique({
      where: { phoneNumber: customerPhone },
    });

    if (!customer) {
      return []; // No bookings if customer doesn't exist
    }

    const bookings = await this.prisma.booking.findMany({
      where: { customerId: customer.id },
      include: {
        customer: true,
        service: true,
        business: true,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    return bookings.map(booking => this.mapToBookingResponse(booking));
  }

  async updateBooking(
    bookingId: string, 
    updateBookingDto: UpdateBookingDto,
    requestingUserId?: string
  ): Promise<BookingResponseDto> {
    this.logger.debug(`Updating booking: ${bookingId}`);

    const existingBooking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
        service: true,
      },
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    // If requesting user is provided, verify they own the business
    if (requestingUserId && existingBooking.business.ownerId !== requestingUserId) {
      throw new ForbiddenException('You do not have permission to update this booking');
    }

    // Validate new scheduled time if provided
    if (updateBookingDto.scheduledAt) {
      const newScheduledAt = new Date(updateBookingDto.scheduledAt);
      const now = new Date();
      
      if (newScheduledAt <= now) {
        throw new BadRequestException('Scheduled time must be in the future');
      }

      // Check for conflicts if changing time
      if (newScheduledAt.getTime() !== existingBooking.scheduledAt.getTime()) {
        const conflictingBooking = await this.prisma.booking.findFirst({
          where: {
            businessId: existingBooking.businessId,
            serviceId: existingBooking.serviceId,
            scheduledAt: newScheduledAt,
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
            },
            id: { not: bookingId }, // Exclude current booking
          },
        });

        if (conflictingBooking) {
          throw new BadRequestException('Time slot is already booked');
        }
      }
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(updateBookingDto.status && { status: updateBookingDto.status }),
        ...(updateBookingDto.scheduledAt && { scheduledAt: new Date(updateBookingDto.scheduledAt) }),
        ...(updateBookingDto.notes !== undefined && { notes: updateBookingDto.notes }),
      },
      include: {
        customer: true,
        service: true,
        business: true,
      },
    });

    return this.mapToBookingResponse(updatedBooking);
  }

  async cancelBooking(bookingId: string, cancelledBy: 'USER' | 'SALON', requestingUserId?: string): Promise<BookingResponseDto> {
    this.logger.debug(`Cancelling booking: ${bookingId} by ${cancelledBy}`);

    const existingBooking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
      },
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    // If requesting user is provided and cancelling by salon, verify they own the business
    if (cancelledBy === 'SALON' && requestingUserId && existingBooking.business.ownerId !== requestingUserId) {
      throw new ForbiddenException('You do not have permission to cancel this booking');
    }

    // Check if booking can be cancelled
    if (existingBooking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    if (existingBooking.status === BookingStatus.CANCELLED_BY_USER || existingBooking.status === BookingStatus.CANCELLED_BY_SALON) {
      throw new BadRequestException('Booking is already cancelled');
    }

    const newStatus = cancelledBy === 'USER' ? BookingStatus.CANCELLED_BY_USER : BookingStatus.CANCELLED_BY_SALON;

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
      include: {
        customer: true,
        service: true,
        business: true,
      },
    });

    return this.mapToBookingResponse(updatedBooking);
  }

  async deleteBooking(bookingId: string, requestingUserId: string): Promise<void> {
    this.logger.debug(`Deleting booking: ${bookingId}`);

    const existingBooking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
      },
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify user owns the business
    if (existingBooking.business.ownerId !== requestingUserId) {
      throw new ForbiddenException('You do not have permission to delete this booking');
    }

    await this.prisma.booking.delete({
      where: { id: bookingId },
    });
  }

  private mapToBookingResponse(booking: any): BookingResponseDto {
    return {
      id: booking.id,
      businessId: booking.businessId,
      customerId: booking.customerId,
      serviceId: booking.serviceId,
      status: booking.status,
      scheduledAt: booking.scheduledAt.toISOString(),
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      ...(booking.customer && {
        customer: {
          id: booking.customer.id,
          phoneNumber: booking.customer.phoneNumber,
          name: booking.customer.name,
        },
      }),
      ...(booking.service && {
        service: {
          id: booking.service.id,
          name: booking.service.name,
          price: Number(booking.service.price),
          durationMinutes: booking.service.durationMinutes,
          description: booking.service.description,
        },
      }),
      ...(booking.business && {
        business: {
          id: booking.business.id,
          name: booking.business.name,
          phoneNumber: booking.business.phoneNumber,
          address: booking.business.address,
        },
      }),
    };
  }
}