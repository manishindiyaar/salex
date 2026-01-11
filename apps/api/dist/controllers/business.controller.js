"use strict";
/**
 * Business Controller
 *
 * HTTP handlers for business management endpoints.
 *
 * Endpoints:
 * - POST /v1/businesses - Create business (protected)
 * - GET /v1/businesses/me - Get current user's business (protected)
 * - PATCH /v1/businesses/:id - Update business (protected)
 * - GET /v1/businesses/routing/:code - Get by routing code (public)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessController = void 0;
const business_service_1 = require("../services/business.service");
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
class BusinessController {
    /**
     * Create a new business
     * POST /v1/businesses
     */
    async create(req, res, next) {
        try {
            const userId = req.auth.userId;
            logger_1.logger.info({ userId }, 'Business creation request');
            // Validate input
            const data = shared_types_1.createBusinessSchema.parse(req.body);
            // Create business
            const business = await business_service_1.businessService.create(userId, data);
            res.status(201).json({
                success: true,
                data: {
                    business: {
                        id: business.id,
                        name: business.name,
                        phoneNumber: business.phoneNumber,
                        routingCode: business.routingCode,
                        hoursOfOperation: business.hoursOfOperation,
                        maxConcurrentBookings: business.maxConcurrentBookings,
                        isAcceptingOrders: business.isAcceptingOrders,
                        services: business.services,
                        createdAt: business.createdAt,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get current user's business
     * GET /v1/businesses/me
     */
    async getMyBusiness(req, res, next) {
        try {
            const userId = req.auth.userId;
            const business = await business_service_1.businessService.getByOwnerId(userId);
            res.json({
                success: true,
                data: {
                    business: {
                        id: business.id,
                        name: business.name,
                        phoneNumber: business.phoneNumber,
                        routingCode: business.routingCode,
                        hoursOfOperation: business.hoursOfOperation,
                        maxConcurrentBookings: business.maxConcurrentBookings,
                        isAcceptingOrders: business.isAcceptingOrders,
                        services: business.services,
                        createdAt: business.createdAt,
                        updatedAt: business.updatedAt,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update business
     * PATCH /v1/businesses/:id
     */
    async update(req, res, next) {
        try {
            const userId = req.auth.userId;
            const { id } = req.params;
            logger_1.logger.info({ userId, businessId: id }, 'Business update request');
            // Validate input
            const data = shared_types_1.updateBusinessSchema.parse(req.body);
            // Update business
            const business = await business_service_1.businessService.update(id, userId, data);
            res.json({
                success: true,
                data: {
                    business: {
                        id: business.id,
                        name: business.name,
                        phoneNumber: business.phoneNumber,
                        routingCode: business.routingCode,
                        hoursOfOperation: business.hoursOfOperation,
                        maxConcurrentBookings: business.maxConcurrentBookings,
                        isAcceptingOrders: business.isAcceptingOrders,
                        services: business.services,
                        updatedAt: business.updatedAt,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get business by routing code (public - for WhatsApp bot)
     * GET /v1/businesses/routing/:code
     */
    async getByRoutingCode(req, res, next) {
        try {
            const { code } = req.params;
            logger_1.logger.info({ routingCode: code }, 'Business lookup by routing code');
            // Validate routing code format
            shared_types_1.businessRoutingCodeSchema.parse({ code });
            const business = await business_service_1.businessService.getByRoutingCode(code);
            res.json({
                success: true,
                data: {
                    business: {
                        id: business.id,
                        name: business.name,
                        phoneNumber: business.phoneNumber,
                        routingCode: business.routingCode,
                        isAcceptingOrders: business.isAcceptingOrders,
                        hoursOfOperation: business.hoursOfOperation,
                        services: business.services,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.businessController = new BusinessController();
//# sourceMappingURL=business.controller.js.map