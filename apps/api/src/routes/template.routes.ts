/**
 * Template Routes
 * 
 * Public routes for niche template access by merchant app.
 * Task 22.1: Update onboarding flow to load niche template
 */

import { Router } from 'express';
import { templateController } from '../controllers/template.controller';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

/**
 * GET /v1/templates
 * List all active niche templates
 */
router.get('/', 
  asyncHandler(templateController.listTemplates.bind(templateController))
);

/**
 * GET /v1/templates/:code
 * Get template by code
 */
router.get('/:code', 
  asyncHandler(templateController.getTemplate.bind(templateController))
);

/**
 * GET /v1/templates/:code/terminology
 * Get terminology for a specific template
 */
router.get('/:code/terminology', 
  asyncHandler(templateController.getTerminology.bind(templateController))
);

export { router as templateRoutes };