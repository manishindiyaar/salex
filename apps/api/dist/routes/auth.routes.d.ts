/**
 * Auth Routes
 *
 * POST /v1/auth/otp/request  - Request OTP
 * POST /v1/auth/otp/verify   - Verify OTP and get token
 * GET  /v1/auth/me           - Get current user (protected)
 * POST /v1/auth/refresh      - Refresh token (protected)
 */
import { type Router as RouterType } from 'express';
declare const router: RouterType;
export default router;
//# sourceMappingURL=auth.routes.d.ts.map