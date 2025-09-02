import { AuthenticatedRequest } from '../auth/firebase-auth.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { ApiResponse, BookingStatus } from 'shared-types';
export declare class BookingController {
    private readonly bookingService;
    private readonly logger;
    constructor(bookingService: BookingService);
    createBooking(businessId: string, createBookingDto: CreateBookingDto): Promise<ApiResponse<BookingResponseDto>>;
    getBusinessBookings(req: AuthenticatedRequest, businessId: string, status?: BookingStatus, startDate?: string, endDate?: string): Promise<ApiResponse<BookingResponseDto[]>>;
    getCustomerBookings(customerPhone: string): Promise<ApiResponse<BookingResponseDto[]>>;
    getBookingById(bookingId: string, include?: string): Promise<ApiResponse<BookingResponseDto>>;
    updateBooking(req: AuthenticatedRequest, bookingId: string, updateBookingDto: UpdateBookingDto): Promise<ApiResponse<BookingResponseDto>>;
    cancelBookingBySalon(req: AuthenticatedRequest, bookingId: string): Promise<ApiResponse<BookingResponseDto>>;
    cancelBookingByCustomer(bookingId: string, customerPhone?: string): Promise<ApiResponse<BookingResponseDto>>;
    deleteBooking(req: AuthenticatedRequest, bookingId: string): Promise<ApiResponse<null>>;
    confirmBooking(req: AuthenticatedRequest, bookingId: string): Promise<ApiResponse<BookingResponseDto>>;
    completeBooking(req: AuthenticatedRequest, bookingId: string): Promise<ApiResponse<BookingResponseDto>>;
}
