/**
 * Booking Controller
 *
 * HTTP handlers for booking operations.
 */
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
declare class BookingController {
    /**
     * POST /api/v1/bookings
     * Create a new booking
     */
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/bookings/:id
     * Get a single booking
     */
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/bookings
     * List bookings for a business
     */
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/bookings/:id/status
     * Update booking status
     */
    updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/bookings/:id/checkout
     * Complete booking with item modification
     */
    checkout(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/bookings/check-availability
     * Check if a time slot is available
     */
    checkAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/bookings/:id/allocation
     * Update booking resource/staff allocation
     */
    updateAllocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const bookingController: BookingController;
export {};
//# sourceMappingURL=booking.controller.d.ts.map