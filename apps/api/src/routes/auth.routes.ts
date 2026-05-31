/**
 * Auth Routes
 * 
 * POST /v1/auth/otp/request       - Request OTP
 * POST /v1/auth/otp/verify        - Verify OTP and get token
 * POST /v1/auth/password/login    - Password login
 * POST /v1/auth/password/change   - Change password (protected)
 * GET  /v1/auth/me                - Get current user (protected)
 * POST /v1/auth/refresh           - Refresh token (protected)
 */

import { Router, type Router as RouterType } from 'express';
import { authController } from '../controllers';
import { passwordAuthController } from '../controllers/password-auth.controller';
import { authMiddleware } from '../middlewares';

const router: RouterType = Router();

// Public routes
router.post('/otp/request', (req, res, next) => authController.requestOtp(req, res, next));
router.post('/otp/verify', (req, res, next) => authController.verifyOtp(req, res, next));
router.post('/password/login', (req, res, next) => passwordAuthController.login(req, res, next));

// Protected routes
router.post('/password/change', authMiddleware, (req, res, next) => passwordAuthController.changePassword(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => authController.getCurrentUser(req, res, next));
router.post('/refresh', authMiddleware, (req, res, next) => authController.refreshToken(req, res, next));

export default router;
