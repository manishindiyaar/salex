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
import { adminAuthRoutes } from './admin-auth.routes';
import { adminBusinessRoutes } from './admin-business.routes';
import { adminPaymentRoutes } from './admin-payment.routes';
import { adminTemplateRoutes } from './admin-template.routes';
import { adminModuleRoutes } from './admin-module.routes';
import { adminHealthRoutes } from './admin-health.routes';
import { adminExportRoutes } from './admin-export.routes';
import adminAuditRoutes from './admin-audit.routes';
import { templateRoutes } from './template.routes';

const router: Router = Router();

// Health check (no prefix)
router.use('/health', healthRoutes);

// API v1 routes
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/admin/auth', adminAuthRoutes);
router.use('/api/v1/admin/businesses', adminBusinessRoutes);
router.use('/api/v1/admin/payments', adminPaymentRoutes);
router.use('/api/v1/admin/templates', adminTemplateRoutes);
router.use('/api/v1/admin/modules', adminModuleRoutes);
router.use('/api/v1/admin/health', adminHealthRoutes);
router.use('/api/v1/admin/export', adminExportRoutes);
router.use('/api/v1/admin/audit-logs', adminAuditRoutes);
router.use('/api/v1/templates', templateRoutes);
router.use('/api/v1/businesses', businessRoutes);
router.use('/api/v1/businesses/:businessId/services', businessServiceRoutes);
router.use('/api/v1/businesses/:businessId/resources', resourceRoutes);
router.use('/api/v1/businesses/:businessId/staff', staffRoutes);
router.use('/api/v1/businesses/:businessId/availability', availabilityRoutes);
router.use('/api/v1/services', serviceRoutes);
router.use('/api/v1/bookings', bookingRoutes);

// WhatsApp Simulator routes (development)
router.use('/api/v1/whatsapp-simulator', simulatorRoutes);

// Legacy webhook endpoint for WhatsApp Mock UI compatibility
router.use('/simulate-webhooks', simulatorWebhookRouter);

// Future routes will be added here:
// router.use('/api/v1/webhooks', webhookRoutes);

export default router;
