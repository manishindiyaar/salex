/**
 * Admin Simulator Routes
 *
 * Routes for the admin flow simulator. All routes require admin authentication.
 *
 * Mounted at: /api/v1/admin/businesses/:businessId/simulator
 *
 * Endpoints:
 *   POST   /sessions                          - Create a new simulation session
 *   POST   /sessions/:sessionId/message       - Send a text message
 *   POST   /sessions/:sessionId/interactive   - Send an interactive reply
 *   POST   /sessions/:sessionId/reset         - Reset (delete) a session
 *   GET    /sessions/:sessionId               - Get session data
 *
 * Requirements: 7.1, 7.4, 7.7, 7.8
 */

import { Router } from 'express';
import { adminSimulatorController } from '../controllers/admin-simulator.controller';
import { adminAuthMiddleware } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const simulatorRouter = Router({ mergeParams: true });

// All simulator routes require admin authentication
simulatorRouter.use(adminAuthMiddleware);

// POST /sessions — Create a new simulation session
simulatorRouter.post(
  '/sessions',
  asyncHandler(adminSimulatorController.createSession.bind(adminSimulatorController)),
);

// POST /sessions/:sessionId/message — Send a text message
simulatorRouter.post(
  '/sessions/:sessionId/message',
  asyncHandler(adminSimulatorController.sendMessage.bind(adminSimulatorController)),
);

// POST /sessions/:sessionId/interactive — Send an interactive reply
simulatorRouter.post(
  '/sessions/:sessionId/interactive',
  asyncHandler(adminSimulatorController.sendInteractive.bind(adminSimulatorController)),
);

// POST /sessions/:sessionId/reset — Reset a session
simulatorRouter.post(
  '/sessions/:sessionId/reset',
  asyncHandler(adminSimulatorController.resetSession.bind(adminSimulatorController)),
);

// GET /sessions/:sessionId — Get session data
simulatorRouter.get(
  '/sessions/:sessionId',
  asyncHandler(adminSimulatorController.getSession.bind(adminSimulatorController)),
);

export { simulatorRouter as adminSimulatorRoutes };
