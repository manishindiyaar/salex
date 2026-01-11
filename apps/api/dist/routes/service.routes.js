"use strict";
/**
 * Service Routes
 *
 * Routes for service catalog management:
 * - POST /v1/businesses/:businessId/services - Create service (protected)
 * - GET /v1/businesses/:businessId/services - List services (protected)
 * - GET /v1/services/:id - Get single service (protected)
 * - PATCH /v1/services/:id - Update service (protected)
 * - DELETE /v1/services/:id - Soft delete service (protected)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRoutes = exports.businessServiceRoutes = void 0;
const express_1 = require("express");
const service_controller_1 = require("../controllers/service.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// Routes under /v1/businesses/:businessId/services
exports.businessServiceRoutes = (0, express_1.Router)({ mergeParams: true });
exports.businessServiceRoutes.post('/', auth_middleware_1.authMiddleware, service_controller_1.serviceController.create);
exports.businessServiceRoutes.get('/', auth_middleware_1.authMiddleware, service_controller_1.serviceController.list);
// Routes under /v1/services
exports.serviceRoutes = (0, express_1.Router)();
exports.serviceRoutes.get('/:id', auth_middleware_1.authMiddleware, service_controller_1.serviceController.getById);
exports.serviceRoutes.patch('/:id', auth_middleware_1.authMiddleware, service_controller_1.serviceController.update);
exports.serviceRoutes.delete('/:id', auth_middleware_1.authMiddleware, service_controller_1.serviceController.delete);
exports.default = exports.serviceRoutes;
//# sourceMappingURL=service.routes.js.map