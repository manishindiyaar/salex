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

import { prisma, Booking, BookingItem } from '@salex/shared-types';
import { 
  CreateBookingInput, 
  UpdateBookingStatusInput,
  CheckoutInput,
  UpdateAllocationInput,
  BookingStatusType,
  bookingStatusTransitions 
} from '@salex/shared-types';
import { logger } from '../utils/logger';
import { NotFoundError, ConflictError, BusinessRuleError } from '../utils/errors';
import { availabilityService } from './availability.service';
import { autoAssignmentService } from './auto-assignment.service';

// Booking with items and allocation type
export type BookingWithItems = Booking & {
  items: BookingItem[];
  customer?: { name: string | null; phoneNumber: string } | null;
  resource?: { id: string; name: string } | null;
  staff?: { id: string; name: string } | null;
};

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
  async create(
    ownerId: string,
    data: CreateBookingInput
  ): Promise<BookingWithItems> {
    const { 
      businessId, 
      customerId, 
      serviceIds, 
      scheduledAt, 
      notes, 
      source,
      resourceId,
      staffId,
      preferredStaffId,
    } = data;

    // Verify business ownership
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    if (business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only create bookings for your own business');
    }

    // Check if business is accepting orders
    if (!business.isAcceptingOrders) {
      throw new BusinessRuleError('Business is not accepting bookings at this time');
    }

    // Check if business is active (not suspended by admin)
    if (!business.isActive) {
      throw new BusinessRuleError('Business account is suspended. Please contact support.');
    }

    // Check capacity
    const capacity = await availabilityService.getEffectiveCapacity(businessId);
    if (capacity.effectiveCapacity === 0) {
      throw new BusinessRuleError(
        capacity.warningMessage || 'Business has no capacity. Add resources and staff first.'
      );
    }

    // Fetch all services
    const services = await prisma.service.findMany({
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
      throw new NotFoundError(`Services not found or inactive: ${missingIds.join(', ')}`);
    }

    // Calculate total duration (sum of all service durations)
    const totalDurationMinutes = services.reduce(
      (sum, service) => sum + service.durationMinutes,
      0
    );

    // Calculate end time
    const scheduledAtDate = new Date(scheduledAt);
    const endAt = availabilityService.calculateEndTime(scheduledAtDate, totalDurationMinutes);

    // Calculate total price (sum of all service prices)
    const totalPrice = services.reduce(
      (sum, service) => sum + Number(service.price),
      0
    );

    // Find best assignment (validates availability)
    const assignment = await autoAssignmentService.findBestAssignment(
      businessId,
      scheduledAtDate,
      endAt,
      {
        preferredResourceId: resourceId,
        preferredStaffId: staffId,
        customerPreferredStaffId: preferredStaffId,
      }
    );

    if (!assignment.success) {
      throw new ConflictError(
        assignment.reason || 'No availability for this time slot'
      );
    }

    // Validate customer exists if provided
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }
      if (customer.isBlocked) {
        throw new BusinessRuleError('Customer is blocked');
      }
    }

    // Create booking with items and allocation in a transaction
    const booking = await prisma.$transaction(async (tx) => {
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
      const bookingItems = await Promise.all(
        services.map(service =>
          tx.bookingItem.create({
            data: {
              bookingId: newBooking.id,
              serviceId: service.id,
              nameSnapshot: service.name,
              priceSnapshot: service.price,
            },
          })
        )
      );

      return {
        ...newBooking,
        items: bookingItems,
      };
    });

    // Allocate with lock to prevent race conditions
    await autoAssignmentService.allocateWithLock(
      businessId,
      booking.id,
      scheduledAtDate,
      endAt,
      {
        preferredResourceId: resourceId || assignment.resourceId,
        preferredStaffId: staffId || assignment.staffId,
        customerPreferredStaffId: preferredStaffId,
      }
    );

    logger.info({
      bookingId: booking.id,
      businessId,
      serviceCount: services.length,
      totalPrice,
      scheduledAt: scheduledAtDate,
      endAt,
      resourceId: assignment.resourceId,
      staffId: assignment.staffId,
    }, 'Booking created with allocation');

    return booking as BookingWithItems;
  }

  /**
   * Quick book - create booking with auto-assignment in one step
   */
  async quickBook(
    ownerId: string,
    data: {
      businessId: string;
      serviceIds: string[];
      scheduledAt: string;
      customerId?: string;
      notes?: string;
    }
  ): Promise<BookingWithItems> {
    return this.create(ownerId, {
      ...data,
      source: 'walk-in',
    });
  }

  /**
   * Get a booking by ID with allocation info
   */
  async getById(id: string, ownerId: string): Promise<BookingWithItems> {
    const booking = await prisma.booking.findUnique({
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
      throw new NotFoundError('Booking not found');
    }

    if (booking.business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only view bookings for your own business');
    }

    return booking as BookingWithItems;
  }

  /**
   * List bookings for a business with filters and allocation info
   */
  async listByBusinessId(
    businessId: string,
    ownerId: string,
    options: {
      status?: BookingStatusType;
      from?: string;
      to?: string;
      resourceId?: string;
      staffId?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ bookings: BookingWithItems[]; total: number }> {
    const { status, from, to, resourceId, staffId, page = 1, pageSize = 20 } = options;

    // Verify business ownership
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    if (business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only view bookings for your own business');
    }

    // Build where clause
    const where: any = { businessId };

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
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    // Get total count
    const total = await prisma.booking.count({ where });

    // Get bookings with pagination
    const bookings = await prisma.booking.findMany({
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

    return { bookings: bookings as BookingWithItems[], total };
  }

  /**
   * Update booking allocation (change resource/staff)
   */
  async updateAllocation(
    id: string,
    ownerId: string,
    data: UpdateAllocationInput
  ): Promise<BookingWithItems> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        business: { select: { ownerId: true, id: true, isActive: true } },
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only update bookings for your own business');
    }

    // Check if business is active (not suspended by admin)
    if (!booking.business.isActive) {
      throw new BusinessRuleError('Business account is suspended. Please contact support.');
    }

    // Only active bookings can have allocation changed
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BusinessRuleError(
        `Cannot change allocation for booking with status ${booking.status}`
      );
    }

    // Reassign using auto-assignment service
    const result = await autoAssignmentService.reassign(
      id,
      booking.business.id,
      data.resourceId,
      data.staffId
    );

    if (!result.success) {
      throw new ConflictError(result.reason || 'Failed to update allocation');
    }

    // Fetch updated booking
    return this.getById(id, ownerId);
  }

  /**
   * Update booking status with transition validation
   */
  async updateStatus(
    id: string,
    ownerId: string,
    data: UpdateBookingStatusInput
  ): Promise<BookingWithItems> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        business: { select: { ownerId: true, isActive: true } },
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only update bookings for your own business');
    }

    // Check if business is active (not suspended by admin)
    if (!booking.business.isActive) {
      throw new BusinessRuleError('Business account is suspended. Please contact support.');
    }

    // Validate status transition
    const currentStatus = booking.status as BookingStatusType;
    const newStatus = data.status;
    const allowedTransitions = bookingStatusTransitions[currentStatus];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BusinessRuleError(
        `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
        `Allowed: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none (terminal state)'}`
      );
    }

    const updated = await prisma.booking.update({
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

    logger.info({
      bookingId: id,
      previousStatus: currentStatus,
      newStatus,
    }, 'Booking status updated');

    return updated as BookingWithItems;
  }

  /**
   * Checkout flow - complete a booking with item modification
   */
  async checkout(
    id: string,
    ownerId: string,
    data: CheckoutInput
  ): Promise<BookingWithItems> {
    const { items, paymentMode } = data;

    // Get booking with business
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        business: { select: { ownerId: true, id: true, isActive: true } },
        items: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.business.ownerId !== ownerId) {
      throw new BusinessRuleError('You can only checkout bookings for your own business');
    }

    // Check if business is active (not suspended by admin)
    if (!booking.business.isActive) {
      throw new BusinessRuleError('Business account is suspended. Please contact support.');
    }

    // Only PENDING or CONFIRMED bookings can be checked out
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BusinessRuleError(
        `Cannot checkout booking with status ${booking.status}. ` +
        'Only PENDING or CONFIRMED bookings can be checked out.'
      );
    }

    // Get all service IDs from checkout items
    const serviceIds = items.map(item => item.serviceId);

    // Fetch services
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        businessId: booking.business.id,
      },
    });

    // Validate all services exist
    if (services.length !== serviceIds.length) {
      const foundIds = services.map(s => s.id);
      const missingIds = serviceIds.filter(id => !foundIds.includes(id));
      throw new NotFoundError(`Services not found: ${missingIds.join(', ')}`);
    }

    // Build service map for quick lookup
    const serviceMap = new Map(services.map(s => [s.id, s]));

    // Calculate new total price (considering quantities)
    let newTotalPrice = 0;
    const newItems: { serviceId: string; nameSnapshot: string; priceSnapshot: number }[] = [];

    for (const item of items) {
      const service = serviceMap.get(item.serviceId)!;
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
    const updated = await prisma.$transaction(async (tx) => {
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

    logger.info({
      bookingId: id,
      previousTotal: Number(booking.totalPrice),
      newTotal: newTotalPrice,
      paymentMode,
      itemCount: newItems.length,
    }, 'Booking checkout completed');

    return updated as BookingWithItems;
  }

  /**
   * Cancel a booking
   */
  async cancel(
    id: string,
    ownerId: string,
    cancelledBy: 'user' | 'salon'
  ): Promise<BookingWithItems> {
    const status = cancelledBy === 'user' ? 'CANCELLED_BY_USER' : 'CANCELLED_BY_SALON';
    return this.updateStatus(id, ownerId, { status });
  }

  /**
   * Get booking confirmation message for WhatsApp
   */
  getConfirmationMessage(booking: BookingWithItems): string {
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

export const bookingService = new BookingService();
