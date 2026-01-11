"use strict";
/**
 * Resource Routes
 *
 * Routes for resource management:
 * - POST /v1/businesses/:businessId/resources - Create resource
 * - POST /v1/businesses/:businessId/resources/bulk - Bulk create resources
 * - GET /v1/businesses/:businessId/resources - List resources
 * - GET /v1/businesses/:businessId/resources/:id - Get resource
 * - PATCH /v1/businesses/:businessId/resources/:id - Update resource
 * - POST /v1/businesses/:businessId/resources/:id/deactivate - Deactivate
 * - POST /v1/businesses/:businessId/resources/:id/reactivate - Reactivate
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resource_controller_1 = require("../controllers/resource.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Resource CRUD
router.post('/', resource_controller_1.resourceController.create);
router.post('/bulk', resource_controller_1.resourceController.createBulk);
router.get('/', resource_controller_1.resourceController.list);
router.get('/:id', resource_controller_1.resourceController.getById);
router.patch('/:id', resource_controller_1.resourceController.update);
// Activation management
router.post('/:id/deactivate', resource_controller_1.resourceController.deactivate);
router.post('/:id/reactivate', resource_controller_1.resourceController.reactivate);
exports.default = router;
//# sourceMappingURL=resource.routes.js.map