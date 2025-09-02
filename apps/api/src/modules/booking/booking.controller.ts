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
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ConditionalAuthGuard } from '../auth/conditional-auth.guard';
import { AuthenticatedRequest } from '../auth/firebase-auth.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { ApiResponse, BookingStatus } from 'shared-types';

@Controller('api/v1')
export class BookingController {
  private readonly logger = new Logger(BookingController.name);

  constructor(private readonly bookingService: BookingService) {}

  /**
   * Create a new booking (Public - customers can book)
   */
  @Post('businesses/:businessId/bookings')
  @HttpCode(HttpStatus.CREATED)
  async createBooking(
    @Param('businessId') businessId: string,
    @Body(new ValidationPipe()) createBookingDto: CreateBookingDto,
  ): Promise<ApiResponse<BookingResponseDto>> {
    this.logger.debug(`Creating booking for business: ${businessId}`);

    try {
      const booking = await this.bookingService.createBooking(businessId, createBookingDto);
      
      return {
        success: true,
        data: booking,
        message: 'Booking created successfully. Please arrive 15 minutes before your scheduled time.',
      };
    } catch (error) {
      this.logger.error(`Failed to create booking: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get business bookings (Protected - business owners only)
   */
  @Get('businesses/:businessId/bookings')
  @UseGuards(ConditionalAuthGuard)
  async getBusinessBookings(
    @Request() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
    @Query('status') status?: BookingStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<BookingResponseDto[]>> {
    this.logger.debug(`Getting bookings for business: ${businessId}`);

    try {
      const bookings = await this.bookingService.getBusinessBookings(
        businessId,
        req.user.id,
        status,
        startDate,
        endDate
      );
      
      return {
        success: true,
        data: bookings,
        message: 'Bookings retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get business bookings: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get customer bookings (Public - by phone number)
   */
  @Get('customers/:customerPhone/bookings')
  async getCustomerBookings(
    @Param('customerPhone') customerPhone: string,
  ): Promise<ApiResponse<BookingResponseDto[]>> {
    this.logger.debug(`Getting bookings for customer: ${customerPhone} (public access)`);

    try {
      const bookings = await this.bookingService.getCustomerBookings(customerPhone);
      
      return {
        success: true,
        data: bookings,
        message: 'Customer bookings retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get customer bookings: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get specific booking details (Public)
   */
  @Get('bookings/:bookingId')
  async getBookingById(
    @Param('bookingId') bookingId: string,
    @Query('include') include?: string,
  ): Promise<ApiResponse<BookingResponseDto>> {
    this.logger.debug(`Getting booking: ${bookingId} (public access)`);

    try {
      const includeRelations = include !== 'false';
      const booking = await this.bookingService.getBookingById(bookingId, includeRelations);
      
      return {
        success: true,
        data: booking,
        message: 'Booking retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get booking: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update booking (Protected - business owners or can be extended for customers)
   */
  @Put('bookings/:bookingId')
  @UseGuards(ConditionalAuthGuard)
  async updateBooking(
    @Request() req: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
    @Body(new ValidationPipe()) updateBookingDto: UpdateBookingDto,
  ): Promise<ApiResponse<BookingResponseDto>> {
    this.logger.debug(`Updating booking: ${bookingId} by user: ${req.user.id}`);

    try {
      const booking = await this.bookingService.updateBooking(
        bookingId,
        updateBookingDto,
        req.user.id
      );
      
      return {
        success: true,
        data: booking,
        message: 'Booking updated successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to update booking: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cancel booking by business owner (Protected)
   */
  @Put('bookings/:bookingId/cancel')
  @UseGuards(ConditionalAuthGuard)
  async cancelBookingBySalon(
    @Request() req: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
  ): Promise<ApiResponse<BookingResponseDto>> {
    this.logger.debug(`Cancelling booking: ${bookingId} by salon owner: ${req.user.id}`);

    try {
      const booking = await this.bookingService.cancelBooking(bookingId, 'SALON', req.user.id);
      
      return {
        success: true,
        data: booking,
        message: 'Booking cancelled successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to cancel booking: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cancel booking by customer (Public - requires customer phone verification)
   */
  @Put('bookings/:bookingId/cancel-customer')
  async cancelBookingByCustomer(
    @Param('bookingId') bookingId: string,
    @Query('customerPhone') customerPhone?: string,
  ): Promise<ApiResponse<BookingResponseDto>> {
    this.logger.debug(`Customer cancelling booking: ${bookingId}`);

    try {
      if (!customerPhone) {
        throw new BadRequestException('Customer phone number is required for cancellation');
      }

      // Verify the booking belongs to this customer
      const booking = await this.bookingService.getBookingById(bookingId, true);
      if (booking.customer?.phoneNumber !== customerPhone) {
        throw new BadRequestException('Invalid customer phone number for this booking');
      }

      const cancelledBooking = await this.bookingService.cancelBooking(bookingId, 'USER');
      
      return {
        success: true,
        data: cancelledBooking,
        message: 'Booking cancelled successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to cancel booking by customer: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete booking (Protected - business owners only)
   */
  @Delete('bookings/:bookingId')
  @UseGuards(ConditionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteBooking(
    @Request() req: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
  ): Promise<ApiResponse<null>> {
    this.logger.debug(`Deleting booking: ${bookingId} by user: ${req.user.id}`);

    try {
      await this.bookingService.deleteBooking(bookingId, req.user.id);
      
      return {
        success: true,
        data: null,
        message: 'Booking deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete booking: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Confirm booking (Protected - business owners only)
   */
  @Put('bookings/:bookingId/confirm')
  @UseGuards(ConditionalAuthGuard)
  async confirmBooking(
    @Request() req: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
  ): Promise<ApiResponse<BookingResponseDto>> {
    this.logger.debug(`Confirming booking: ${bookingId} by user: ${req.user.id}`);

    try {
      const booking = await this.bookingService.updateBooking(
        bookingId,
        { status: BookingStatus.CONFIRMED },
        req.user.id
      );
      
      return {
        success: true,
        data: booking,
        message: 'Booking confirmed successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to confirm booking: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark booking as completed (Protected - business owners only)
   */
  @Put('bookings/:bookingId/complete')
  @UseGuards(ConditionalAuthGuard)
  async completeBooking(
    @Request() req: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
  ): Promise<ApiResponse<BookingResponseDto>> {
    this.logger.debug(`Completing booking: ${bookingId} by user: ${req.user.id}`);

    try {
      const booking = await this.bookingService.updateBooking(
        bookingId,
        { status: BookingStatus.COMPLETED },
        req.user.id
      );
      
      return {
        success: true,
        data: booking,
        message: 'Booking marked as completed',
      };
    } catch (error) {
      this.logger.error(`Failed to complete booking: ${error.message}`, error.stack);
      throw error;
    }
  }
}
