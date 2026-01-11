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

import { Request, Response, NextFunction } from 'express';
import { businessService } from '../services/business.service';
import { createBusinessSchema, updateBusinessSchema, businessRoutingCodeSchema } from '@salex/shared-types';
import { logger } from '../utils/logger';

class BusinessController {
  /**
   * Create a new business
   * POST /v1/businesses
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      
      logger.info({ userId }, 'Business creation request');

      // Validate input
      const data = createBusinessSchema.parse(req.body);

      // Create business
      const business = await businessService.create(userId, data);

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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's business
   * GET /v1/businesses/me
   */
  async getMyBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;

      const business = await businessService.getByOwnerId(userId);

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
            isActive: business.isActive, // Include isActive field for deactivation enforcement
            services: business.services,
            createdAt: business.createdAt,
            updatedAt: business.updatedAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update business
   * PATCH /v1/businesses/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { id } = req.params;

      logger.info({ userId, businessId: id }, 'Business update request');

      // Validate input
      const data = updateBusinessSchema.parse(req.body);

      // Update business
      const business = await businessService.update(id, userId, data);

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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get business by routing code (public - for WhatsApp bot)
   * GET /v1/businesses/routing/:code
   */
  async getByRoutingCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      logger.info({ routingCode: code }, 'Business lookup by routing code');

      // Validate routing code format
      businessRoutingCodeSchema.parse({ code });

      const business = await businessService.getByRoutingCode(code);

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
    } catch (error) {
      next(error);
    }
  }
}

export const businessController = new BusinessController();
