/**
 * Admin Merchant Account Routes
 * POST /v1/admin/merchant-accounts          - Provision new merchant
 * POST /v1/admin/merchant-accounts/:userId/password-reset
 * POST /v1/admin/merchant-accounts/:userId/disable
 * POST /v1/admin/merchant-accounts/:userId/enable
 */

import { Router } from 'express';
import { adminMerchantController } from '../controllers/admin-merchant.controller';
import { adminAuthMiddleware, requireAdminRole } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.use(adminAuthMiddleware);

router.post('/',
  requireAdminRole('ADMIN'),
  asyncHandler(adminMerchantController.provision.bind(adminMerchantController))
);

router.post('/:userId/password-reset',
  requireAdminRole('ADMIN'),
  asyncHandler(adminMerchantController.resetPassword.bind(adminMerchantController))
);

router.post('/:userId/disable',
  requireAdminRole('ADMIN'),
  asyncHandler(adminMerchantController.disable.bind(adminMerchantController))
);

router.post('/:userId/enable',
  requireAdminRole('ADMIN'),
  asyncHandler(adminMerchantController.enable.bind(adminMerchantController))
);

export { router as adminMerchantRoutes };
