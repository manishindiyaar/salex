/**
 * Booking Routes
 * 
 * All routes are protected and require authentication.
 * 
 * Endpoints:
 * - POST   /api/v1/bookings                    - Create booking
 * - GET    /api/v1/bookings                    - List bookings (requires businessId query)
 * - GET    /api/v1/bookings/:id                - Get single booking
 * - PATCH  /api/v1/bookings/:id/status         - Update booking status
 * - POST   /api/v1/bookings/:id/checkout       - Checkout (complete with modifications)
 * - POST   /api/v1/bookings/check-availability - Check slot availability
 * - PATCH  /api/v1/bookings/:id/allocation     - Update allocation
 */

import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create booking
router.post('/', (req, res, next) => bookingController.create(req as any, res, next));

// Check availability (before list to avoid :id conflict)
router.post('/check-availability', (req, res, next) => bookingController.checkAvailability(req as any, res, next));

// List bookings (requires businessId query param)
router.get('/', (req, res, next) => bookingController.list(req as any, res, next));

// Get single booking
router.get('/:id', (req, res, next) => bookingController.getById(req as any, res, next));

// Update booking status
router.patch('/:id/status', (req, res, next) => bookingController.updateStatus(req as any, res, next));

// Checkout (complete booking with item modification)
router.post('/:id/checkout', (req, res, next) => bookingController.checkout(req as any, res, next));

// Update allocation (change resource/staff)
router.patch('/:id/allocation', (req, res, next) => bookingController.updateAllocation(req as any, res, next));

export default router;
