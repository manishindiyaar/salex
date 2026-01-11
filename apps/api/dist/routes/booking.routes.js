"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Create booking
router.post('/', (req, res, next) => booking_controller_1.bookingController.create(req, res, next));
// Check availability (before list to avoid :id conflict)
router.post('/check-availability', (req, res, next) => booking_controller_1.bookingController.checkAvailability(req, res, next));
// List bookings (requires businessId query param)
router.get('/', (req, res, next) => booking_controller_1.bookingController.list(req, res, next));
// Get single booking
router.get('/:id', (req, res, next) => booking_controller_1.bookingController.getById(req, res, next));
// Update booking status
router.patch('/:id/status', (req, res, next) => booking_controller_1.bookingController.updateStatus(req, res, next));
// Checkout (complete booking with item modification)
router.post('/:id/checkout', (req, res, next) => booking_controller_1.bookingController.checkout(req, res, next));
// Update allocation (change resource/staff)
router.patch('/:id/allocation', (req, res, next) => booking_controller_1.bookingController.updateAllocation(req, res, next));
exports.default = router;
//# sourceMappingURL=booking.routes.js.map