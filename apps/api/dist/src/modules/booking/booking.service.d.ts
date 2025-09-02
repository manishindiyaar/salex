import { PrismaService } from '../../core/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { BookingStatus } from 'shared-types';
export declare class BookingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createBooking(businessId: string, createBookingDto: CreateBookingDto): Promise<BookingResponseDto>;
    getBookingById(bookingId: string, includeRelations?: boolean): Promise<BookingResponseDto>;
    getBusinessBookings(businessId: string, ownerId: string, status?: BookingStatus, startDate?: string, endDate?: string): Promise<BookingResponseDto[]>;
    getCustomerBookings(customerPhone: string): Promise<BookingResponseDto[]>;
    updateBooking(bookingId: string, updateBookingDto: UpdateBookingDto, requestingUserId?: string): Promise<BookingResponseDto>;
    cancelBooking(bookingId: string, cancelledBy: 'USER' | 'SALON', requestingUserId?: string): Promise<BookingResponseDto>;
    deleteBooking(bookingId: string, requestingUserId: string): Promise<void>;
    private mapToBookingResponse;
}
