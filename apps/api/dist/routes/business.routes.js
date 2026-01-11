"use strict";
/**
 * Business Routes
 *
 * Routes for business management:
 * - POST /v1/businesses - Create business (protected)
 * - GET /v1/businesses/me - Get current user's business (protected)
 * - PATCH /v1/businesses/:id - Update business (protected)
 * - GET /v1/businesses/routing/:code - Get by routing code (public)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const business_controller_1 = require("../controllers/business.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public route - WhatsApp bot uses this to look up businesses
router.get('/routing/:code', business_controller_1.businessController.getByRoutingCode);
// Protected routes - require authentication
router.post('/', auth_middleware_1.authMiddleware, business_controller_1.businessController.create);
router.get('/me', auth_middleware_1.authMiddleware, business_controller_1.businessController.getMyBusiness);
router.patch('/:id', auth_middleware_1.authMiddleware, business_controller_1.businessController.update);
exports.default = router;
//# sourceMappingURL=business.routes.js.map