/**
 * Resource Controller
 * 
 * HTTP handlers for resource management endpoints.
 * 
 * Endpoints:
 * - POST /v1/businesses/:businessId/resources - Create resource
 * - POST /v1/businesses/:businessId/resources/bulk - Bulk create resources
 * - GET /v1/businesses/:businessId/resources - List resources
 * - GET /v1/businesses/:businessId/resources/:id - Get resource
 * - PATCH /v1/businesses/:businessId/resources/:id - Update resource
 * - POST /v1/businesses/:businessId/resources/:id/deactivate - Deactivate resource
 * - POST /v1/businesses/:businessId/resources/:id/reactivate - Reactivate resource
 */

import { Request, Response, NextFunction } from 'express';
import { resourceService } from '../services/resource.service';
import { 
  createResourceSchema, 
  updateResourceSchema, 
  bulkCreateResourceSchema 
} from '@salex/shared-types';
import { logger } from '../utils/logger';

class ResourceController {
  /**
   * Create a new resource
   * POST /v1/businesses/:businessId/resources
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId } = req.params;

      logger.info({ userId, businessId }, 'Resource creation request');

      const data = createResourceSchema.parse(req.body);
      const resource = await resourceService.create(businessId, userId, data);

      res.status(201).json({
        success: true,
        data: { resource },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk create resources
   * POST /v1/businesses/:businessId/resources/bulk
   */
  async createBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId } = req.params;

      logger.info({ userId, businessId }, 'Bulk resource creation request');

      const data = bulkCreateResourceSchema.parse(req.body);
      const resources = await resourceService.createBulk(businessId, userId, data);

      res.status(201).json({
        success: true,
        data: { resources },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List resources for a business
   * GET /v1/businesses/:businessId/resources
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      const resources = await resourceService.list(businessId, userId, includeInactive);

      res.json({
        success: true,
        data: { resources },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single resource
   * GET /v1/businesses/:businessId/resources/:id
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId, id } = req.params;

      const resource = await resourceService.getById(id, businessId, userId);

      res.json({
        success: true,
        data: { resource },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a resource
   * PATCH /v1/businesses/:businessId/resources/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId, id } = req.params;

      logger.info({ userId, businessId, resourceId: id }, 'Resource update request');

      const data = updateResourceSchema.parse(req.body);
      const resource = await resourceService.update(id, businessId, userId, data);

      res.json({
        success: true,
        data: { resource },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate a resource
   * POST /v1/businesses/:businessId/resources/:id/deactivate
   */
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId, id } = req.params;

      logger.info({ userId, businessId, resourceId: id }, 'Resource deactivation request');

      const resource = await resourceService.deactivate(id, businessId, userId);

      res.json({
        success: true,
        data: { resource },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reactivate a resource
   * POST /v1/businesses/:businessId/resources/:id/reactivate
   */
  async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId, id } = req.params;

      logger.info({ userId, businessId, resourceId: id }, 'Resource reactivation request');

      const resource = await resourceService.reactivate(id, businessId, userId);

      res.json({
        success: true,
        data: { resource },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const resourceController = new ResourceController();
