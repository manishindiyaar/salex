/**
 * Admin Flow Management Routes
 *
 * Routes for admin-scoped flow management, readiness checks, and business context.
 * All routes require admin authentication and an explicit businessId path parameter.
 *
 * Mounted at:
 *   /api/v1/admin/businesses/:businessId/flows         → CRUD + publish/archive
 *   /api/v1/admin/businesses/:businessId/flow-readiness → Readiness check
 *   /api/v1/admin/businesses/:businessId/flow-context   → Business context for editor
 *
 * Requirements: 1.1, 2.4, 4.1
 */

import { Router } from 'express';
import { adminFlowController } from '../controllers/admin-flow.controller';
import { adminAuthMiddleware } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

// --- Flow CRUD routes (mounted at /api/v1/admin/businesses/:businessId/flows) ---
const flowRouter = Router({ mergeParams: true });

// All flow routes require admin authentication
flowRouter.use(adminAuthMiddleware);

// GET /api/v1/admin/businesses/:businessId/flows — List flows for business
flowRouter.get('/', asyncHandler(adminFlowController.list.bind(adminFlowController)));

// GET /api/v1/admin/businesses/:businessId/flows/:flowId — Get a single flow
flowRouter.get('/:flowId', asyncHandler(adminFlowController.get.bind(adminFlowController)));

// POST /api/v1/admin/businesses/:businessId/flows — Create new flow (DRAFT)
flowRouter.post('/', asyncHandler(adminFlowController.create.bind(adminFlowController)));

// PUT /api/v1/admin/businesses/:businessId/flows/:flowId — Update flow (new DRAFT version)
flowRouter.put('/:flowId', asyncHandler(adminFlowController.update.bind(adminFlowController)));

// POST /api/v1/admin/businesses/:businessId/flows/:flowId/publish — Publish a flow version
flowRouter.post('/:flowId/publish', asyncHandler(adminFlowController.publish.bind(adminFlowController)));

// POST /api/v1/admin/businesses/:businessId/flows/:flowId/archive — Archive a flow version
flowRouter.post('/:flowId/archive', asyncHandler(adminFlowController.archive.bind(adminFlowController)));

// DELETE /api/v1/admin/businesses/:businessId/flows/:flowId — Delete a flow
flowRouter.delete('/:flowId', asyncHandler(adminFlowController.delete.bind(adminFlowController)));

// --- Readiness endpoint (mounted at /api/v1/admin/businesses/:businessId/flow-readiness) ---
const readinessRouter = Router({ mergeParams: true });

readinessRouter.use(adminAuthMiddleware);

// GET /api/v1/admin/businesses/:businessId/flow-readiness
readinessRouter.get('/', asyncHandler(adminFlowController.getReadiness.bind(adminFlowController)));

// --- Context endpoint (mounted at /api/v1/admin/businesses/:businessId/flow-context) ---
const contextRouter = Router({ mergeParams: true });

contextRouter.use(adminAuthMiddleware);

// GET /api/v1/admin/businesses/:businessId/flow-context
contextRouter.get('/', asyncHandler(adminFlowController.getContext.bind(adminFlowController)));

export { flowRouter as adminFlowRoutes, readinessRouter as adminFlowReadinessRoutes, contextRouter as adminFlowContextRoutes };
