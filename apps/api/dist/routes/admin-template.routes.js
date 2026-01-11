"use strict";
/**
 * Admin Template Management Routes
 *
 * Routes for admin niche template operations including CRUD operations and statistics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminTemplateRoutes = void 0;
const express_1 = require("express");
const admin_template_controller_1 = require("../controllers/admin-template.controller");
const admin_auth_middleware_1 = require("../middlewares/admin-auth.middleware");
const async_handler_1 = require("../utils/async-handler");
const router = (0, express_1.Router)();
exports.adminTemplateRoutes = router;
// All admin template routes require authentication
router.use(admin_auth_middleware_1.adminAuthMiddleware);
/**
 * GET /v1/admin/templates/stats
 * Get template usage statistics
 * Requires: SUPPORT role or higher
 * Note: This route must come before /:code to avoid conflicts
 */
router.get('/stats', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_template_controller_1.adminTemplateController.getTemplateStats.bind(admin_template_controller_1.adminTemplateController)));
/**
 * GET /v1/admin/templates
 * List all niche templates
 * Requires: SUPPORT role or higher
 */
router.get('/', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_template_controller_1.adminTemplateController.listTemplates.bind(admin_template_controller_1.adminTemplateController)));
/**
 * POST /v1/admin/templates
 * Create new template
 * Requires: SUPER_ADMIN role
 */
router.post('/', (0, admin_auth_middleware_1.requireAdminRole)('SUPER_ADMIN'), (0, async_handler_1.asyncHandler)(admin_template_controller_1.adminTemplateController.createTemplate.bind(admin_template_controller_1.adminTemplateController)));
/**
 * GET /v1/admin/templates/:code
 * Get template by code
 * Requires: SUPPORT role or higher
 */
router.get('/:code', (0, admin_auth_middleware_1.requireAdminRole)('SUPPORT'), (0, async_handler_1.asyncHandler)(admin_template_controller_1.adminTemplateController.getTemplate.bind(admin_template_controller_1.adminTemplateController)));
/**
 * PATCH /v1/admin/templates/:code
 * Update template
 * Requires: ADMIN role or higher
 */
router.patch('/:code', (0, admin_auth_middleware_1.requireAdminRole)('ADMIN'), (0, async_handler_1.asyncHandler)(admin_template_controller_1.adminTemplateController.updateTemplate.bind(admin_template_controller_1.adminTemplateController)));
/**
 * DELETE /v1/admin/templates/:code
 * Delete template (soft delete)
 * Requires: SUPER_ADMIN role
 */
router.delete('/:code', (0, admin_auth_middleware_1.requireAdminRole)('SUPER_ADMIN'), (0, async_handler_1.asyncHandler)(admin_template_controller_1.adminTemplateController.deleteTemplate.bind(admin_template_controller_1.adminTemplateController)));
//# sourceMappingURL=admin-template.routes.js.map