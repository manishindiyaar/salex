"use strict";
/**
 * Route Aggregator
 *
 * All API routes are registered here with /api/v1 prefix.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_routes_1 = __importDefault(require("./health.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const business_routes_1 = __importDefault(require("./business.routes"));
const service_routes_1 = __importStar(require("./service.routes"));
const booking_routes_1 = __importDefault(require("./booking.routes"));
const simulator_routes_1 = __importStar(require("./simulator.routes"));
const resource_routes_1 = __importDefault(require("./resource.routes"));
const staff_routes_1 = __importDefault(require("./staff.routes"));
const availability_routes_1 = __importDefault(require("./availability.routes"));
const admin_auth_routes_1 = require("./admin-auth.routes");
const admin_business_routes_1 = require("./admin-business.routes");
const admin_payment_routes_1 = require("./admin-payment.routes");
const admin_template_routes_1 = require("./admin-template.routes");
const admin_module_routes_1 = require("./admin-module.routes");
const admin_health_routes_1 = require("./admin-health.routes");
const admin_export_routes_1 = require("./admin-export.routes");
const router = (0, express_1.Router)();
// Health check (no prefix)
router.use('/health', health_routes_1.default);
// API v1 routes
router.use('/api/v1/auth', auth_routes_1.default);
router.use('/api/v1/admin/auth', admin_auth_routes_1.adminAuthRoutes);
router.use('/api/v1/admin/businesses', admin_business_routes_1.adminBusinessRoutes);
router.use('/api/v1/admin/payments', admin_payment_routes_1.adminPaymentRoutes);
router.use('/api/v1/admin/templates', admin_template_routes_1.adminTemplateRoutes);
router.use('/api/v1/admin/modules', admin_module_routes_1.adminModuleRoutes);
router.use('/api/v1/admin/health', admin_health_routes_1.adminHealthRoutes);
router.use('/api/v1/admin/export', admin_export_routes_1.adminExportRoutes);
router.use('/api/v1/businesses', business_routes_1.default);
router.use('/api/v1/businesses/:businessId/services', service_routes_1.businessServiceRoutes);
router.use('/api/v1/businesses/:businessId/resources', resource_routes_1.default);
router.use('/api/v1/businesses/:businessId/staff', staff_routes_1.default);
router.use('/api/v1/businesses/:businessId/availability', availability_routes_1.default);
router.use('/api/v1/services', service_routes_1.default);
router.use('/api/v1/bookings', booking_routes_1.default);
// WhatsApp Simulator routes (development)
router.use('/api/v1/whatsapp-simulator', simulator_routes_1.default);
// Legacy webhook endpoint for WhatsApp Mock UI compatibility
router.use('/simulate-webhooks', simulator_routes_1.simulatorWebhookRouter);
// Future routes will be added here:
// router.use('/api/v1/webhooks', webhookRoutes);
exports.default = router;
//# sourceMappingURL=index.js.map