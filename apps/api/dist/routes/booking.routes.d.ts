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
declare const router: Router;
export default router;
//# sourceMappingURL=booking.routes.d.ts.map