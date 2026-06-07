/**
 * Route Aggregator
 * 
 * All API routes are registered here with /api/v1 prefix.
 */

import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import businessRoutes from './business.routes';
import serviceRoutes, { businessServiceRoutes } from './service.routes';
import bookingRoutes from './booking.routes';
import simulatorRoutes, { simulatorWebhookRouter } from './simulator.routes';
import resourceRoutes from './resource.routes';
import staffRoutes from './staff.routes';
import availabilityRoutes from './availability.routes';
import webhookRoutes from './webhook.routes';
import { adminAuthRoutes } from './admin-auth.routes';
import { adminBusinessRoutes } from './admin-business.routes';
import { adminMerchantRoutes } from './admin-merchant.routes';
import { adminPaymentRoutes } from './admin-payment.routes';
import { adminHealthRoutes } from './admin-health.routes';
import { adminExportRoutes } from './admin-export.routes';
import adminAuditRoutes from './admin-audit.routes';
import { adminFlowRoutes, adminFlowReadinessRoutes, adminFlowContextRoutes } from './admin-flow.routes';
import { adminSimulatorRoutes } from './admin-simulator.routes';
import { adminWhatsAppChannelRoutes } from './admin-whatsapp-channel.routes';
import flowRoutes from './flow.routes';
import { whatsappFlowRoutes } from './whatsapp-flow.routes';
import { areSimulatorRoutesEnabled } from '../config';

const router: Router = Router();

// Health check (no prefix)
router.use('/health', healthRoutes);

// API v1 routes
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/admin/auth', adminAuthRoutes);
router.use('/api/v1/admin/businesses', adminBusinessRoutes);
router.use('/api/v1/admin/merchant-accounts', adminMerchantRoutes);
router.use('/api/v1/admin/payments', adminPaymentRoutes);
router.use('/api/v1/admin/health', adminHealthRoutes);
router.use('/api/v1/admin/export', adminExportRoutes);
router.use('/api/v1/admin/audit-logs', adminAuditRoutes);
router.use('/api/v1/admin/businesses/:businessId/flows', adminFlowRoutes);
router.use('/api/v1/admin/businesses/:businessId/flow-readiness', adminFlowReadinessRoutes);
router.use('/api/v1/admin/businesses/:businessId/flow-context', adminFlowContextRoutes);
router.use('/api/v1/admin/businesses/:businessId/simulator', adminSimulatorRoutes);
router.use('/api/v1/admin/businesses/:businessId/whatsapp-channel', adminWhatsAppChannelRoutes);
router.use('/api/v1/businesses', businessRoutes);
router.use('/api/v1/businesses/:businessId/services', businessServiceRoutes);
router.use('/api/v1/businesses/:businessId/resources', resourceRoutes);
router.use('/api/v1/businesses/:businessId/staff', staffRoutes);
router.use('/api/v1/businesses/:businessId/availability', availabilityRoutes);
router.use('/api/v1/services', serviceRoutes);
router.use('/api/v1/bookings', bookingRoutes);
router.use('/api/v1/flows', flowRoutes);
router.use('/api/v1/whatsapp/flows', whatsappFlowRoutes);
router.use('/api/v1/webhooks', webhookRoutes);
// Meta dashboard callback URLs are easy to enter without the /api prefix.
// Keep this alias so /v1/webhooks/whatsapp verifies too.
router.use('/v1/webhooks', webhookRoutes);

if (areSimulatorRoutesEnabled()) {
  // WhatsApp Simulator routes (development or explicit opt-in)
  router.use('/api/v1/whatsapp-simulator', simulatorRoutes);

  // Legacy webhook endpoint for WhatsApp Mock UI compatibility
  router.use('/simulate-webhooks', simulatorWebhookRouter);
}

export default router;
