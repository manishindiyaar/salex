"use strict";
/**
 * Availability Routes
 *
 * Routes for availability and capacity:
 * - GET /v1/businesses/:businessId/availability - Check availability
 * - GET /v1/businesses/:businessId/availability/resources - Available resources
 * - GET /v1/businesses/:businessId/availability/staff - Available staff
 * - GET /v1/businesses/:businessId/capacity - Get capacity info
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const availability_controller_1 = require("../controllers/availability.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Availability endpoints
router.get('/', availability_controller_1.availabilityController.checkAvailability);
router.get('/resources', availability_controller_1.availabilityController.getAvailableResources);
router.get('/staff', availability_controller_1.availabilityController.getAvailableStaff);
exports.default = router;
//# sourceMappingURL=availability.routes.js.map