/**
 * Service Controller
 * 
 * HTTP handlers for service catalog endpoints.
 * 
 * Endpoints:
 * - POST /v1/businesses/:businessId/services - Create service
 * - GET /v1/businesses/:businessId/services - List services
 * - PATCH /v1/services/:id - Update service
 * - DELETE /v1/services/:id - Soft delete service
 */

import { Request, Response, NextFunction } from 'express';
import { serviceService } from '../services/service.service';
import { createServiceSchema, updateServiceSchema } from '@salex/shared-types';
import { logger } from '../utils/logger';

class ServiceController {
  /**
   * Create a new service
   * POST /v1/businesses/:businessId/services
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId } = req.params;

      logger.info({ userId, businessId }, 'Service creation request');

      // Validate input
      const data = createServiceSchema.parse(req.body);

      // Create service
      const service = await serviceService.create(businessId, userId, data);

      res.status(201).json({
        success: true,
        data: {
          service: {
            id: service.id,
            businessId: service.businessId,
            name: service.name,
            description: service.description,
            price: service.price,
            durationMinutes: service.durationMinutes,
            isActive: service.isActive,
            createdAt: service.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List services for a business
   * GET /v1/businesses/:businessId/services
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      const services = await serviceService.listByBusinessId(businessId, includeInactive);

      res.json({
        success: true,
        data: {
          services: services.map(service => ({
            id: service.id,
            businessId: service.businessId,
            name: service.name,
            description: service.description,
            price: service.price,
            durationMinutes: service.durationMinutes,
            isActive: service.isActive,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single service
   * GET /v1/services/:id
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const service = await serviceService.getById(id);

      res.json({
        success: true,
        data: {
          service: {
            id: service.id,
            businessId: service.businessId,
            name: service.name,
            description: service.description,
            price: service.price,
            durationMinutes: service.durationMinutes,
            isActive: service.isActive,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a service
   * PATCH /v1/services/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { id } = req.params;

      logger.info({ userId, serviceId: id }, 'Service update request');

      // Validate input
      const data = updateServiceSchema.parse(req.body);

      // Update service
      const service = await serviceService.update(id, userId, data);

      res.json({
        success: true,
        data: {
          service: {
            id: service.id,
            businessId: service.businessId,
            name: service.name,
            description: service.description,
            price: service.price,
            durationMinutes: service.durationMinutes,
            isActive: service.isActive,
            updatedAt: service.updatedAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft delete a service (set isActive = false)
   * DELETE /v1/services/:id
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { id } = req.params;

      logger.info({ userId, serviceId: id }, 'Service delete request');

      await serviceService.softDelete(id, userId);

      res.json({
        success: true,
        data: {
          message: 'Service deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const serviceController = new ServiceController();
