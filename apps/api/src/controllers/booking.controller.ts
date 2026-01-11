/**
 * Booking Controller
 * 
 * HTTP handlers for booking operations.
 */

import { Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { availabilityService } from '../services/availability.service';
import { prisma } from '@salex/shared-types';
import { 
  createBookingSchema, 
  updateBookingStatusSchema,
  checkoutSchema,
  bookingListQuerySchema,
  availabilityCheckSchema,
  updateAllocationSchema
} from '@salex/shared-types';
import { AuthRequest } from '../middlewares/auth.middleware';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

class BookingController {
  /**
   * POST /api/v1/bookings
   * Create a new booking
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createBookingSchema.parse(req.body);
      const booking = await bookingService.create(req.auth.userId, data);

      res.status(201).json({
        success: true,
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/bookings/:id
   * Get a single booking
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const booking = await bookingService.getById(id, req.auth.userId);

      res.json({
        success: true,
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/bookings
   * List bookings for a business
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Parse query params
      const query = bookingListQuerySchema.parse({
        businessId: req.query.businessId,
        status: req.query.status,
        from: req.query.from,
        to: req.query.to,
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      });

      const { bookings, total } = await bookingService.listByBusinessId(
        query.businessId,
        req.auth.userId,
        {
          status: query.status,
          from: query.from,
          to: query.to,
          page: query.page,
          pageSize: query.pageSize,
        }
      );

      res.json({
        success: true,
        data: { bookings },
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/bookings/:id/status
   * Update booking status
   */
  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateBookingStatusSchema.parse(req.body);
      const booking = await bookingService.updateStatus(id, req.auth.userId, data);

      res.json({
        success: true,
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/bookings/:id/checkout
   * Complete booking with item modification
   */
  async checkout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = checkoutSchema.parse(req.body);
      const booking = await bookingService.checkout(id, req.auth.userId, data);

      res.json({
        success: true,
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/bookings/check-availability
   * Check if a time slot is available
   */
  async checkAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = availabilityCheckSchema.parse(req.body);
      
      // Verify business ownership and status
      const business = await prisma.business.findUnique({
        where: { id: data.businessId },
        select: { ownerId: true, isActive: true },
      });

      if (!business) {
        throw new NotFoundError('Business not found');
      }

      if (business.ownerId !== req.auth.userId) {
        throw new BusinessRuleError('You can only check availability for your own business');
      }

      // Check if business is active (not suspended by admin)
      if (!business.isActive) {
        throw new BusinessRuleError('Business account is suspended. Please contact support.');
      }
      
      const scheduledAt = new Date(data.scheduledAt);
      const endAt = availabilityService.calculateEndTime(scheduledAt, data.durationMinutes);
      
      const result = await availabilityService.checkAvailability(
        data.businessId,
        scheduledAt,
        endAt
      );

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
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/bookings/:id/allocation
   * Update booking resource/staff allocation
   */
  async updateAllocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateAllocationSchema.parse(req.body);
      const booking = await bookingService.updateAllocation(id, req.auth.userId, data);

      res.json({
        success: true,
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
