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
var BookingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma.service");
const shared_types_1 = require("shared-types");
let BookingService = BookingService_1 = class BookingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(BookingService_1.name);
    }
    async createBooking(businessId, createBookingDto) {
        this.logger.debug(`Creating booking for business: ${businessId}`);
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        const service = await this.prisma.service.findFirst({
            where: {
                id: createBookingDto.serviceId,
                businessId: businessId,
            },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
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
        }
        else if (createBookingDto.customerName && !customer.name) {
            customer = await this.prisma.customer.update({
                where: { id: customer.id },
                data: { name: createBookingDto.customerName },
            });
        }
        const scheduledAt = new Date(createBookingDto.scheduledAt);
        const now = new Date();
        if (scheduledAt <= now) {
            throw new common_1.BadRequestException('Scheduled time must be in the future');
        }
        const conflictingBooking = await this.prisma.booking.findFirst({
            where: {
                businessId: businessId,
                serviceId: createBookingDto.serviceId,
                scheduledAt: scheduledAt,
                status: {
                    in: [shared_types_1.BookingStatus.PENDING, shared_types_1.BookingStatus.CONFIRMED],
                },
            },
        });
        if (conflictingBooking) {
            throw new common_1.BadRequestException('Time slot is already booked');
        }
        const booking = await this.prisma.booking.create({
            data: {
                businessId: businessId,
                customerId: customer.id,
                serviceId: createBookingDto.serviceId,
                scheduledAt: scheduledAt,
                notes: createBookingDto.notes || null,
                status: shared_types_1.BookingStatus.PENDING,
            },
            include: {
                customer: true,
                service: true,
                business: true,
            },
        });
        return this.mapToBookingResponse(booking);
    }
    async getBookingById(bookingId, includeRelations = true) {
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
            throw new common_1.NotFoundException('Booking not found');
        }
        return this.mapToBookingResponse(booking);
    }
    async getBusinessBookings(businessId, ownerId, status, startDate, endDate) {
        this.logger.debug(`Getting bookings for business: ${businessId}`);
        const business = await this.prisma.business.findFirst({
            where: {
                id: businessId,
                ownerId: ownerId,
            },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found or access denied');
        }
        const whereClause = {
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
    async getCustomerBookings(customerPhone) {
        this.logger.debug(`Getting bookings for customer: ${customerPhone}`);
        const customer = await this.prisma.customer.findUnique({
            where: { phoneNumber: customerPhone },
        });
        if (!customer) {
            return [];
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
    async updateBooking(bookingId, updateBookingDto, requestingUserId) {
        this.logger.debug(`Updating booking: ${bookingId}`);
        const existingBooking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                business: true,
                service: true,
            },
        });
        if (!existingBooking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (requestingUserId && existingBooking.business.ownerId !== requestingUserId) {
            throw new common_1.ForbiddenException('You do not have permission to update this booking');
        }
        if (updateBookingDto.scheduledAt) {
            const newScheduledAt = new Date(updateBookingDto.scheduledAt);
            const now = new Date();
            if (newScheduledAt <= now) {
                throw new common_1.BadRequestException('Scheduled time must be in the future');
            }
            if (newScheduledAt.getTime() !== existingBooking.scheduledAt.getTime()) {
                const conflictingBooking = await this.prisma.booking.findFirst({
                    where: {
                        businessId: existingBooking.businessId,
                        serviceId: existingBooking.serviceId,
                        scheduledAt: newScheduledAt,
                        status: {
                            in: [shared_types_1.BookingStatus.PENDING, shared_types_1.BookingStatus.CONFIRMED],
                        },
                        id: { not: bookingId },
                    },
                });
                if (conflictingBooking) {
                    throw new common_1.BadRequestException('Time slot is already booked');
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
    async cancelBooking(bookingId, cancelledBy, requestingUserId) {
        this.logger.debug(`Cancelling booking: ${bookingId} by ${cancelledBy}`);
        const existingBooking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                business: true,
            },
        });
        if (!existingBooking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (cancelledBy === 'SALON' && requestingUserId && existingBooking.business.ownerId !== requestingUserId) {
            throw new common_1.ForbiddenException('You do not have permission to cancel this booking');
        }
        if (existingBooking.status === shared_types_1.BookingStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot cancel a completed booking');
        }
        if (existingBooking.status === shared_types_1.BookingStatus.CANCELLED_BY_USER || existingBooking.status === shared_types_1.BookingStatus.CANCELLED_BY_SALON) {
            throw new common_1.BadRequestException('Booking is already cancelled');
        }
        const newStatus = cancelledBy === 'USER' ? shared_types_1.BookingStatus.CANCELLED_BY_USER : shared_types_1.BookingStatus.CANCELLED_BY_SALON;
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
    async deleteBooking(bookingId, requestingUserId) {
        this.logger.debug(`Deleting booking: ${bookingId}`);
        const existingBooking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                business: true,
            },
        });
        if (!existingBooking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (existingBooking.business.ownerId !== requestingUserId) {
            throw new common_1.ForbiddenException('You do not have permission to delete this booking');
        }
        await this.prisma.booking.delete({
            where: { id: bookingId },
        });
    }
    mapToBookingResponse(booking) {
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
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = BookingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingService);
//# sourceMappingURL=booking.service.js.map