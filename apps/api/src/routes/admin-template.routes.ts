/**
 * Admin Template Management Routes
 * 
 * Routes for admin niche template operations including CRUD operations and statistics.
 */

import { Router } from 'express';
import { adminTemplateController } from '../controllers/admin-template.controller';
import { adminAuthMiddleware, requireAdminRole } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// All admin template routes require authentication
router.use(adminAuthMiddleware);

/**
 * GET /v1/admin/templates/stats
 * Get template usage statistics
 * Requires: SUPPORT role or higher
 * Note: This route must come before /:code to avoid conflicts
 */
router.get('/stats', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminTemplateController.getTemplateStats.bind(adminTemplateController))
);

/**
 * GET /v1/admin/templates
 * List all niche templates
 * Requires: SUPPORT role or higher
 */
router.get('/', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminTemplateController.listTemplates.bind(adminTemplateController))
);

/**
 * POST /v1/admin/templates
 * Create new template
 * Requires: SUPER_ADMIN role
 */
router.post('/', 
  requireAdminRole('SUPER_ADMIN'),
  asyncHandler(adminTemplateController.createTemplate.bind(adminTemplateController))
);

/**
 * GET /v1/admin/templates/:code
 * Get template by code
 * Requires: SUPPORT role or higher
 */
router.get('/:code', 
  requireAdminRole('SUPPORT'),
  asyncHandler(adminTemplateController.getTemplate.bind(adminTemplateController))
);

/**
 * PATCH /v1/admin/templates/:code
 * Update template
 * Requires: ADMIN role or higher
 */
router.patch('/:code', 
  requireAdminRole('ADMIN'),
  asyncHandler(adminTemplateController.updateTemplate.bind(adminTemplateController))
);

/**
 * DELETE /v1/admin/templates/:code
 * Delete template (soft delete)
 * Requires: SUPER_ADMIN role
 */
router.delete('/:code', 
  requireAdminRole('SUPER_ADMIN'),
  asyncHandler(adminTemplateController.deleteTemplate.bind(adminTemplateController))
);

export { router as adminTemplateRoutes };