"use strict";
/**
 * Booking Controller
 *
 * HTTP handlers for booking operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingController = void 0;
const booking_service_1 = require("../services/booking.service");
const availability_service_1 = require("../services/availability.service");
const shared_types_1 = require("@salex/shared-types");
class BookingController {
    /**
     * POST /api/v1/bookings
     * Create a new booking
     */
    async create(req, res, next) {
        try {
            const data = shared_types_1.createBookingSchema.parse(req.body);
            const booking = await booking_service_1.bookingService.create(req.auth.userId, data);
            res.status(201).json({
                success: true,
                data: { booking },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/bookings/:id
     * Get a single booking
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const booking = await booking_service_1.bookingService.getById(id, req.auth.userId);
            res.json({
                success: true,
                data: { booking },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/bookings
     * List bookings for a business
     */
    async list(req, res, next) {
        try {
            // Parse query params
            const query = shared_types_1.bookingListQuerySchema.parse({
                businessId: req.query.businessId,
                status: req.query.status,
                from: req.query.from,
                to: req.query.to,
                page: req.query.page ? Number(req.query.page) : undefined,
                pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
            });
            const { bookings, total } = await booking_service_1.bookingService.listByBusinessId(query.businessId, req.auth.userId, {
                status: query.status,
                from: query.from,
                to: query.to,
                page: query.page,
                pageSize: query.pageSize,
            });
            res.json({
                success: true,
                data: { bookings },
                meta: {
                    page: query.page,
                    pageSize: query.pageSize,
                    total,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/v1/bookings/:id/status
     * Update booking status
     */
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const data = shared_types_1.updateBookingStatusSchema.parse(req.body);
            const booking = await booking_service_1.bookingService.updateStatus(id, req.auth.userId, data);
            res.json({
                success: true,
                data: { booking },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/bookings/:id/checkout
     * Complete booking with item modification
     */
    async checkout(req, res, next) {
        try {
            const { id } = req.params;
            const data = shared_types_1.checkoutSchema.parse(req.body);
            const booking = await booking_service_1.bookingService.checkout(id, req.auth.userId, data);
            res.json({
                success: true,
                data: { booking },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/bookings/check-availability
     * Check if a time slot is available
     */
    async checkAvailability(req, res, next) {
        try {
            const data = shared_types_1.availabilityCheckSchema.parse(req.body);
            const scheduledAt = new Date(data.scheduledAt);
            const endAt = availability_service_1.availabilityService.calculateEndTime(scheduledAt, data.durationMinutes);
            const result = await availability_service_1.availabilityService.checkAvailability(data.businessId, scheduledAt, endAt);
            res.json({
                success: true,
                data: {
                    available: result.available,
                    currentCount: result.currentCount,
                    maxCapacity: result.maxCapacity,
                    requestedSlot: {
                        start: scheduledAt.toISOString(),
                        end: endAt.toISOString(),
                        durationMinutes: data.durationMinutes,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/v1/bookings/:id/allocation
     * Update booking resource/staff allocation
     */
    async updateAllocation(req, res, next) {
        try {
            const { id } = req.params;
            const data = shared_types_1.updateAllocationSchema.parse(req.body);
            const booking = await booking_service_1.bookingService.updateAllocation(id, req.auth.userId, data);
            res.json({
                success: true,
                data: { booking },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.bookingController = new BookingController();
//# sourceMappingURL=booking.controller.js.map