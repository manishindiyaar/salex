/**
 * Admin WhatsApp Channel Routes
 *
 * Routes for managing dedicated WhatsApp channel configuration per business.
 * Mounted at: /api/v1/admin/businesses/:businessId/whatsapp-channel
 */

import { Router } from 'express';
import { adminWhatsAppChannelController } from '../controllers/admin-whatsapp-channel.controller';
import { adminAuthMiddleware, requireAdminRole } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router({ mergeParams: true });

// All routes require admin authentication
router.use(adminAuthMiddleware);

/**
 * GET /
 * Get channel configuration (or shared indicator)
 */
router.get(
  '/',
  requireAdminRole('ADMIN'),
  asyncHandler(adminWhatsAppChannelController.getChannel.bind(adminWhatsAppChannelController))
);

/**
 * PUT /
 * Create or update dedicated channel credentials
 */
router.put(
  '/',
  requireAdminRole('ADMIN'),
  asyncHandler(adminWhatsAppChannelController.upsertChannel.bind(adminWhatsAppChannelController))
);

/**
 * POST /test
 * Test connection to Meta Graph API
 */
router.post(
  '/test',
  requireAdminRole('ADMIN'),
  asyncHandler(adminWhatsAppChannelController.testConnection.bind(adminWhatsAppChannelController))
);

/**
 * POST /connect
 * Activate the channel for production use
 */
router.post(
  '/connect',
  requireAdminRole('ADMIN'),
  asyncHandler(adminWhatsAppChannelController.connect.bind(adminWhatsAppChannelController))
);

/**
 * POST /disconnect
 * Disable the channel (retains credentials)
 */
router.post(
  '/disconnect',
  requireAdminRole('ADMIN'),
  asyncHandler(adminWhatsAppChannelController.disconnect.bind(adminWhatsAppChannelController))
);

export { router as adminWhatsAppChannelRoutes };
