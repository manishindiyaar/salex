/**
 * Flow Routes
 *
 * All routes are protected behind authMiddleware (JWT role: 'merchant').
 * Mounted at /api/v1/flows — no unauthenticated flow-management surface.
 *
 * Endpoints:
 * - GET    /api/v1/flows                      - List flows for the owner's business
 * - GET    /api/v1/flows/channel/verify-token  - Get configured webhook verify token
 * - GET    /api/v1/flows/:id                  - Get a single flow
 * - POST   /api/v1/flows                      - Create a new flow (version 1)
 * - PUT    /api/v1/flows/:id                  - Update flow (creates new version)
 * - POST   /api/v1/flows/:id/activate         - Activate a flow version
 * - POST   /api/v1/flows/:id/deactivate       - Deactivate a flow version
 * - DELETE  /api/v1/flows/:id                  - Delete a flow (refuses if active)
 */

import { Router } from 'express';
import { flowController } from '../controllers/flow.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import jwt from 'jsonwebtoken';
import { getConfig } from '../config';

const router: Router = Router();

/**
 * Legacy owner-scoped flow API.
 * Admin tokens are rejected so platform flow management cannot bypass the
 * business-scoped draft/simulate/publish lifecycle.
 */
function combinedAuthMiddleware(req: any, res: any, next: any) {
  // Peek at the token to determine type
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const config = getConfig();
      const decoded = jwt.verify(token, config.supabaseJwtSecret) as any;
      if (decoded.type === 'admin') {
        return res.status(410).json({
          success: false,
          error: {
            code: 'FLOW_API_DEPRECATED_FOR_ADMIN',
            message:
              'Admin flow management must use /api/v1/admin/businesses/:businessId/flows.',
          },
        });
      }
    } catch {
      // Token invalid — let the normal middleware handle the error
    }
  }
  // Default: merchant auth
  authMiddleware(req, res, next);
}

// All flow-management routes require authentication (Req 16.3, 16.4)
router.use(combinedAuthMiddleware);

// List flows for the authenticated owner's business
router.get('/', (req, res, next) => flowController.list(req, res, next));

// Get the configured webhook verify token (must be before /:id to avoid param conflict)
router.get('/channel/verify-token', (req, res, next) => flowController.getVerifyToken(req, res, next));

// Get a single flow by id
router.get('/:id', (req, res, next) => flowController.get(req, res, next));

// Create a new flow
router.post('/', (req, res, next) => flowController.create(req, res, next));

// Update a flow (creates a new version)
router.put('/:id', (req, res, next) => flowController.update(req, res, next));

// Activate a flow version
router.post('/:id/activate', (req, res, next) => flowController.activate(req, res, next));

// Deactivate a flow version
router.post('/:id/deactivate', (req, res, next) => flowController.deactivate(req, res, next));

// Delete a flow (refuses if active)
router.delete('/:id', (req, res, next) => flowController.delete(req, res, next));

export default router;
