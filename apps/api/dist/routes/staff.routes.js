"use strict";
/**
 * Staff Routes
 *
 * Routes for staff management:
 * - POST /v1/businesses/:businessId/staff - Create staff
 * - GET /v1/businesses/:businessId/staff - List staff
 * - GET /v1/businesses/:businessId/staff/:id - Get staff
 * - PATCH /v1/businesses/:businessId/staff/:id - Update staff
 * - POST /v1/businesses/:businessId/staff/:id/deactivate - Deactivate
 * - POST /v1/businesses/:businessId/staff/:id/reactivate - Reactivate
 * - POST /v1/businesses/:businessId/staff/:id/link-resource - Link to resource
 * - DELETE /v1/businesses/:businessId/staff/:id/link-resource/:resourceId - Unlink
 * - GET /v1/businesses/:businessId/staff/:id/linked-resources - Get linked resources
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staff_controller_1 = require("../controllers/staff.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Staff CRUD
router.post('/', staff_controller_1.staffController.create);
router.get('/', staff_controller_1.staffController.list);
router.get('/:id', staff_controller_1.staffController.getById);
router.patch('/:id', staff_controller_1.staffController.update);
// Activation management
router.post('/:id/deactivate', staff_controller_1.staffController.deactivate);
router.post('/:id/reactivate', staff_controller_1.staffController.reactivate);
// Resource linking
router.post('/:id/link-resource', staff_controller_1.staffController.linkResource);
router.delete('/:id/link-resource/:resourceId', staff_controller_1.staffController.unlinkResource);
router.get('/:id/linked-resources', staff_controller_1.staffController.getLinkedResources);
exports.default = router;
//# sourceMappingURL=staff.routes.js.map