"use strict";
/**
 * Booking Service
 *
 * Handles booking CRUD operations with:
 * - Multi-service support (combos)
 * - Price snapshots (frozen at booking time)
 * - Resource and staff allocation (auto or manual)
 * - Availability engine integration
 * - Status transitions validation
 * - Checkout flow with item modification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingService = void 0;
const shared_types_1 = require("@salex/shared-types");
const shared_types_2 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const availability_service_1 = require("./availability.service");
const auto_assignment_service_1 = require("./auto-assignment.service");
class BookingService {
    /**
     * Create a new booking with multi-service support and resource/staff allocation
     *
     * Flow:
     * 1. Fetch all services and validate they exist
     * 2. Calculate total duration and end time
     * 3. Calculate total price
     * 4. Check capacity (zero capacity prevention)
     * 5. Create booking with price snapshots in a transaction
     * 6. Auto-assign or validate manual resource/staff selection
     */
    async create(ownerId, data) {
        const { businessId, customerId, serviceIds, scheduledAt, notes, source, resourceId, staffId, preferredStaffId, } = data;
        // Verify business ownership
        const business = await shared_types_1.prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            throw new errors_1.NotFoundError('Business not found');
        }
        if (business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only create bookings for your own business');
        }
        // Check if business is accepting orders
        if (!business.isAcceptingOrders) {
            throw new errors_1.BusinessRuleError('Business is not accepting bookings at this time');
        }
        // Check capacity
        const capacity = await availability_service_1.availabilityService.getEffectiveCapacity(businessId);
        if (capacity.effectiveCapacity === 0) {
            throw new errors_1.BusinessRuleError(capacity.warningMessage || 'Business has no capacity. Add resources and staff first.');
        }
        // Fetch all services
        const services = await shared_types_1.prisma.service.findMany({
            where: {
                id: { in: serviceIds },
                businessId,
                isActive: true,
            },
        });
        // Validate all services exist and are active
        if (services.length !== serviceIds.length) {
            const foundIds = services.map(s => s.id);
            const missingIds = serviceIds.filter(id => !foundIds.includes(id));
            throw new errors_1.NotFoundError(`Services not found or inactive: ${missingIds.join(', ')}`);
        }
        // Calculate total duration (sum of all service durations)
        const totalDurationMinutes = services.reduce((sum, service) => sum + service.durationMinutes, 0);
        // Calculate end time
        const scheduledAtDate = new Date(scheduledAt);
        const endAt = availability_service_1.availabilityService.calculateEndTime(scheduledAtDate, totalDurationMinutes);
        // Calculate total price (sum of all service prices)
        const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0);
        // Find best assignment (validates availability)
        const assignment = await auto_assignment_service_1.autoAssignmentService.findBestAssignment(businessId, scheduledAtDate, endAt, {
            preferredResourceId: resourceId,
            preferredStaffId: staffId,
            customerPreferredStaffId: preferredStaffId,
        });
        if (!assignment.success) {
            throw new errors_1.ConflictError(assignment.reason || 'No availability for this time slot');
        }
        // Validate customer exists if provided
        if (customerId) {
            const customer = await shared_types_1.prisma.customer.findUnique({
                where: { id: customerId },
            });
            if (!customer) {
                throw new errors_1.NotFoundError('Customer not found');
            }
            if (customer.isBlocked) {
                throw new errors_1.BusinessRuleError('Customer is blocked');
            }
        }
        // Create booking with items and allocation in a transaction
        const booking = await shared_types_1.prisma.$transaction(async (tx) => {
            // Create the booking with allocation
            const newBooking = await tx.booking.create({
                data: {
                    businessId,
                    customerId: customerId || null,
                    resourceId: assignment.resourceId,
                    staffId: assignment.staffId,
                    status: 'PENDING',
                    scheduledAt: scheduledAtDate,
                    endAt,
                    totalPrice,
                    notes: notes || null,
                    source: source || 'manual',
                },
                include: {
                    resource: { select: { id: true, name: true } },
                    staff: { select: { id: true, name: true } },
                },
            });
            // Create booking items with price snapshots
            const bookingItems = await Promise.all(services.map(service => tx.bookingItem.create({
                data: {
                    bookingId: newBooking.id,
                    serviceId: service.id,
                    nameSnapshot: service.name,
                    priceSnapshot: service.price,
                },
            })));
            return {
                ...newBooking,
                items: bookingItems,
            };
        });
        // Allocate with lock to prevent race conditions
        await auto_assignment_service_1.autoAssignmentService.allocateWithLock(businessId, booking.id, scheduledAtDate, endAt, {
            preferredResourceId: resourceId || assignment.resourceId,
            preferredStaffId: staffId || assignment.staffId,
            customerPreferredStaffId: preferredStaffId,
        });
        logger_1.logger.info({
            bookingId: booking.id,
            businessId,
            serviceCount: services.length,
            totalPrice,
            scheduledAt: scheduledAtDate,
            endAt,
            resourceId: assignment.resourceId,
            staffId: assignment.staffId,
        }, 'Booking created with allocation');
        return booking;
    }
    /**
     * Quick book - create booking with auto-assignment in one step
     */
    async quickBook(ownerId, data) {
        return this.create(ownerId, {
            ...data,
            source: 'walk-in',
        });
    }
    /**
     * Get a booking by ID with allocation info
     */
    async getById(id, ownerId) {
        const booking = await shared_types_1.prisma.booking.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        service: {
                            select: { id: true, name: true, price: true, durationMinutes: true },
                        },
                    },
                },
                customer: {
                    select: { name: true, phoneNumber: true },
                },
                resource: {
                    select: { id: true, name: true },
                },
                staff: {
                    select: { id: true, name: true },
                },
                business: {
                    select: { ownerId: true },
                },
            },
        });
        if (!booking) {
            throw new errors_1.NotFoundError('Booking not found');
        }
        if (booking.business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only view bookings for your own business');
        }
        return booking;
    }
    /**
     * List bookings for a business with filters and allocation info
     */
    async listByBusinessId(businessId, ownerId, options = {}) {
        const { status, from, to, resourceId, staffId, page = 1, pageSize = 20 } = options;
        // Verify business ownership
        const business = await shared_types_1.prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            throw new errors_1.NotFoundError('Business not found');
        }
        if (business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only view bookings for your own business');
        }
        // Build where clause
        const where = { businessId };
        if (status) {
            where.status = status;
        }
        if (resourceId) {
            where.resourceId = resourceId;
        }
        if (staffId) {
            where.staffId = staffId;
        }
        if (from || to) {
            where.scheduledAt = {};
            if (from)
                where.scheduledAt.gte = new Date(from);
            if (to)
                where.scheduledAt.lte = new Date(to);
        }
        // Get total count
        const total = await shared_types_1.prisma.booking.count({ where });
        // Get bookings with pagination
        const bookings = await shared_types_1.prisma.booking.findMany({
            where,
            include: {
                items: true,
                customer: {
                    select: { name: true, phoneNumber: true },
                },
                resource: {
                    select: { id: true, name: true },
                },
                staff: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { scheduledAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return { bookings: bookings, total };
    }
    /**
     * Update booking allocation (change resource/staff)
     */
    async updateAllocation(id, ownerId, data) {
        const booking = await shared_types_1.prisma.booking.findUnique({
            where: { id },
            include: {
                business: { select: { ownerId: true, id: true } },
            },
        });
        if (!booking) {
            throw new errors_1.NotFoundError('Booking not found');
        }
        if (booking.business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only update bookings for your own business');
        }
        // Only active bookings can have allocation changed
        if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
            throw new errors_1.BusinessRuleError(`Cannot change allocation for booking with status ${booking.status}`);
        }
        // Reassign using auto-assignment service
        const result = await auto_assignment_service_1.autoAssignmentService.reassign(id, booking.business.id, data.resourceId, data.staffId);
        if (!result.success) {
            throw new errors_1.ConflictError(result.reason || 'Failed to update allocation');
        }
        // Fetch updated booking
        return this.getById(id, ownerId);
    }
    /**
     * Update booking status with transition validation
     */
    async updateStatus(id, ownerId, data) {
        const booking = await shared_types_1.prisma.booking.findUnique({
            where: { id },
            include: {
                business: { select: { ownerId: true } },
            },
        });
        if (!booking) {
            throw new errors_1.NotFoundError('Booking not found');
        }
        if (booking.business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only update bookings for your own business');
        }
        // Validate status transition
        const currentStatus = booking.status;
        const newStatus = data.status;
        const allowedTransitions = shared_types_2.bookingStatusTransitions[currentStatus];
        if (!allowedTransitions.includes(newStatus)) {
            throw new errors_1.BusinessRuleError(`Invalid status transition: ${currentStatus} → ${newStatus}. ` +
                `Allowed: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none (terminal state)'}`);
        }
        const updated = await shared_types_1.prisma.booking.update({
            where: { id },
            data: { status: newStatus },
            include: {
                items: true,
                customer: {
                    select: { name: true, phoneNumber: true },
                },
                resource: {
                    select: { id: true, name: true },
                },
                staff: {
                    select: { id: true, name: true },
                },
            },
        });
        logger_1.logger.info({
            bookingId: id,
            previousStatus: currentStatus,
            newStatus,
        }, 'Booking status updated');
        return updated;
    }
    /**
     * Checkout flow - complete a booking with item modification
     */
    async checkout(id, ownerId, data) {
        const { items, paymentMode } = data;
        // Get booking with business
        const booking = await shared_types_1.prisma.booking.findUnique({
            where: { id },
            include: {
                business: { select: { ownerId: true, id: true } },
                items: true,
            },
        });
        if (!booking) {
            throw new errors_1.NotFoundError('Booking not found');
        }
        if (booking.business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only checkout bookings for your own business');
        }
        // Only PENDING or CONFIRMED bookings can be checked out
        if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
            throw new errors_1.BusinessRuleError(`Cannot checkout booking with status ${booking.status}. ` +
                'Only PENDING or CONFIRMED bookings can be checked out.');
        }
        // Get all service IDs from checkout items
        const serviceIds = items.map(item => item.serviceId);
        // Fetch services
        const services = await shared_types_1.prisma.service.findMany({
            where: {
                id: { in: serviceIds },
                businessId: booking.business.id,
            },
        });
        // Validate all services exist
        if (services.length !== serviceIds.length) {
            const foundIds = services.map(s => s.id);
            const missingIds = serviceIds.filter(id => !foundIds.includes(id));
            throw new errors_1.NotFoundError(`Services not found: ${missingIds.join(', ')}`);
        }
        // Build service map for quick lookup
        const serviceMap = new Map(services.map(s => [s.id, s]));
        // Calculate new total price (considering quantities)
        let newTotalPrice = 0;
        const newItems = [];
        for (const item of items) {
            const service = serviceMap.get(item.serviceId);
            const quantity = item.quantity || 1;
            // Add item for each quantity
            for (let i = 0; i < quantity; i++) {
                newItems.push({
                    serviceId: service.id,
                    nameSnapshot: service.name,
                    priceSnapshot: Number(service.price),
                });
                newTotalPrice += Number(service.price);
            }
        }
        // Perform checkout in a transaction
        const updated = await shared_types_1.prisma.$transaction(async (tx) => {
            // Delete old booking items
            await tx.bookingItem.deleteMany({
                where: { bookingId: id },
            });
            // Create new booking items with fresh snapshots
            await tx.bookingItem.createMany({
                data: newItems.map(item => ({
                    bookingId: id,
                    ...item,
                })),
            });
            // Update booking
            const updatedBooking = await tx.booking.update({
                where: { id },
                data: {
                    totalPrice: newTotalPrice,
                    paymentMode,
                    status: 'COMPLETED',
                },
                include: {
                    items: true,
                    customer: {
                        select: { name: true, phoneNumber: true },
                    },
                    resource: {
                        select: { id: true, name: true },
                    },
                    staff: {
                        select: { id: true, name: true },
                    },
                },
            });
            return updatedBooking;
        });
        logger_1.logger.info({
            bookingId: id,
            previousTotal: Number(booking.totalPrice),
            newTotal: newTotalPrice,
            paymentMode,
            itemCount: newItems.length,
        }, 'Booking checkout completed');
        return updated;
    }
    /**
     * Cancel a booking
     */
    async cancel(id, ownerId, cancelledBy) {
        const status = cancelledBy === 'user' ? 'CANCELLED_BY_USER' : 'CANCELLED_BY_SALON';
        return this.updateStatus(id, ownerId, { status });
    }
    /**
     * Get booking confirmation message for WhatsApp
     */
    getConfirmationMessage(booking) {
        const resourceName = booking.resource?.name || 'TBD';
        const staffName = booking.staff?.name || 'TBD';
        const scheduledAt = new Date(booking.scheduledAt);
        const dateStr = scheduledAt.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
        const timeStr = scheduledAt.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
        const services = booking.items.map(item => item.nameSnapshot).join(', ');
        return `✅ Booking Confirmed!\n\n` +
            `📅 ${dateStr} at ${timeStr}\n` +
            `💇 ${services}\n` +
            `💺 ${resourceName}\n` +
            `👤 ${staffName}\n` +
            `💰 ₹${Number(booking.totalPrice).toFixed(0)}\n\n` +
            `See you soon!`;
    }
}
exports.bookingService = new BookingService();
//# sourceMappingURL=booking.service.js.map