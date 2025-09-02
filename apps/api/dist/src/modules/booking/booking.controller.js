"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BookingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const common_1 = require("@nestjs/common");
const conditional_auth_guard_1 = require("../auth/conditional-auth.guard");
const booking_service_1 = require("./booking.service");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const update_booking_dto_1 = require("./dto/update-booking.dto");
const shared_types_1 = require("shared-types");
let BookingController = BookingController_1 = class BookingController {
    constructor(bookingService) {
        this.bookingService = bookingService;
        this.logger = new common_1.Logger(BookingController_1.name);
    }
    async createBooking(businessId, createBookingDto) {
        this.logger.debug(`Creating booking for business: ${businessId}`);
        try {
            const booking = await this.bookingService.createBooking(businessId, createBookingDto);
            return {
                success: true,
                data: booking,
                message: 'Booking created successfully. Please arrive 15 minutes before your scheduled time.',
            };
        }
        catch (error) {
            this.logger.error(`Failed to create booking: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getBusinessBookings(req, businessId, status, startDate, endDate) {
        this.logger.debug(`Getting bookings for business: ${businessId}`);
        try {
            const bookings = await this.bookingService.getBusinessBookings(businessId, req.user.id, status, startDate, endDate);
            return {
                success: true,
                data: bookings,
                message: 'Bookings retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get business bookings: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getCustomerBookings(customerPhone) {
        this.logger.debug(`Getting bookings for customer: ${customerPhone} (public access)`);
        try {
            const bookings = await this.bookingService.getCustomerBookings(customerPhone);
            return {
                success: true,
                data: bookings,
                message: 'Customer bookings retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get customer bookings: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getBookingById(bookingId, include) {
        this.logger.debug(`Getting booking: ${bookingId} (public access)`);
        try {
            const includeRelations = include !== 'false';
            const booking = await this.bookingService.getBookingById(bookingId, includeRelations);
            return {
                success: true,
                data: booking,
                message: 'Booking retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get booking: ${error.message}`, error.stack);
            throw error;
        }
    }
    async updateBooking(req, bookingId, updateBookingDto) {
        this.logger.debug(`Updating booking: ${bookingId} by user: ${req.user.id}`);
        try {
            const booking = await this.bookingService.updateBooking(bookingId, updateBookingDto, req.user.id);
            return {
                success: true,
                data: booking,
                message: 'Booking updated successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to update booking: ${error.message}`, error.stack);
            throw error;
        }
    }
    async cancelBookingBySalon(req, bookingId) {
        this.logger.debug(`Cancelling booking: ${bookingId} by salon owner: ${req.user.id}`);
        try {
            const booking = await this.bookingService.cancelBooking(bookingId, 'SALON', req.user.id);
            return {
                success: true,
                data: booking,
                message: 'Booking cancelled successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to cancel booking: ${error.message}`, error.stack);
            throw error;
        }
    }
    async cancelBookingByCustomer(bookingId, customerPhone) {
        this.logger.debug(`Customer cancelling booking: ${bookingId}`);
        try {
            if (!customerPhone) {
                throw new common_1.BadRequestException('Customer phone number is required for cancellation');
            }
            const booking = await this.bookingService.getBookingById(bookingId, true);
            if (booking.customer?.phoneNumber !== customerPhone) {
                throw new common_1.BadRequestException('Invalid customer phone number for this booking');
            }
            const cancelledBooking = await this.bookingService.cancelBooking(bookingId, 'USER');
            return {
                success: true,
                data: cancelledBooking,
                message: 'Booking cancelled successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to cancel booking by customer: ${error.message}`, error.stack);
            throw error;
        }
    }
    async deleteBooking(req, bookingId) {
        this.logger.debug(`Deleting booking: ${bookingId} by user: ${req.user.id}`);
        try {
            await this.bookingService.deleteBooking(bookingId, req.user.id);
            return {
                success: true,
                data: null,
                message: 'Booking deleted successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to delete booking: ${error.message}`, error.stack);
            throw error;
        }
    }
    async confirmBooking(req, bookingId) {
        this.logger.debug(`Confirming booking: ${bookingId} by user: ${req.user.id}`);
        try {
            const booking = await this.bookingService.updateBooking(bookingId, { status: shared_types_1.BookingStatus.CONFIRMED }, req.user.id);
            return {
                success: true,
                data: booking,
                message: 'Booking confirmed successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to confirm booking: ${error.message}`, error.stack);
            throw error;
        }
    }
    async completeBooking(req, bookingId) {
        this.logger.debug(`Completing booking: ${bookingId} by user: ${req.user.id}`);
        try {
            const booking = await this.bookingService.updateBooking(bookingId, { status: shared_types_1.BookingStatus.COMPLETED }, req.user.id);
            return {
                success: true,
                data: booking,
                message: 'Booking marked as completed',
            };
        }
        catch (error) {
            this.logger.error(`Failed to complete booking: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.BookingController = BookingController;
__decorate([
    (0, common_1.Post)('businesses/:businessId/bookings'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Get)('businesses/:businessId/bookings'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('businessId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getBusinessBookings", null);
__decorate([
    (0, common_1.Get)('customers/:customerPhone/bookings'),
    __param(0, (0, common_1.Param)('customerPhone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getCustomerBookings", null);
__decorate([
    (0, common_1.Get)('bookings/:bookingId'),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Query)('include')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getBookingById", null);
__decorate([
    (0, common_1.Put)('bookings/:bookingId'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __param(2, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_booking_dto_1.UpdateBookingDto]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "updateBooking", null);
__decorate([
    (0, common_1.Put)('bookings/:bookingId/cancel'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "cancelBookingBySalon", null);
__decorate([
    (0, common_1.Put)('bookings/:bookingId/cancel-customer'),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Query)('customerPhone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "cancelBookingByCustomer", null);
__decorate([
    (0, common_1.Delete)('bookings/:bookingId'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "deleteBooking", null);
__decorate([
    (0, common_1.Put)('bookings/:bookingId/confirm'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "confirmBooking", null);
__decorate([
    (0, common_1.Put)('bookings/:bookingId/complete'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "completeBooking", null);
exports.BookingController = BookingController = BookingController_1 = __decorate([
    (0, common_1.Controller)('api/v1'),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], BookingController);
//# sourceMappingURL=booking.controller.js.map