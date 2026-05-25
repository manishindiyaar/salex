/**
 * Admin Audit Log Routes
 */

import { Router } from 'express';
import { adminAuditController } from '../controllers/admin-audit.controller';
import { adminAuthMiddleware, requireAdminRole } from '../middlewares/admin-auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// All routes require admin authentication
router.use(adminAuthMiddleware);

// GET /v1/admin/audit-logs - List audit logs
router.get('/', requireAdminRole('ADMIN'), asyncHandler(adminAuditController.listAuditLogs.bind(adminAuditController)));

export default router;
