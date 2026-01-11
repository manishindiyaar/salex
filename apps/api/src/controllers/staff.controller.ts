/**
 * Staff Controller
 * 
 * HTTP handlers for staff management endpoints.
 * 
 * Endpoints:
 * - POST /v1/businesses/:businessId/staff - Create staff
 * - GET /v1/businesses/:businessId/staff - List staff
 * - GET /v1/businesses/:businessId/staff/:id - Get staff
 * - PATCH /v1/businesses/:businessId/staff/:id - Update staff
 * - POST /v1/businesses/:businessId/staff/:id/deactivate - Deactivate staff
 * - POST /v1/businesses/:businessId/staff/:id/reactivate - Reactivate staff
 * - POST /v1/businesses/:businessId/staff/:id/link-resource - Link to resource
 * - DELETE /v1/businesses/:businessId/staff/:id/link-resource/:resourceId - Unlink
 */

import { Request, Response, NextFunction } from 'express';
import { staffService } from '../services/staff.service';
import { 
  createStaffSchema, 
  updateStaffSchema, 
  linkResourceSchema 
} from '@salex/shared-types';
import { logger } from '../utils/logger';

class StaffController {
  /**
   * Create a new staff member
   * POST /v1/businesses/:businessId/staff
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId } = req.params;

      logger.info({ userId, businessId }, 'Staff creation request');

      const data = createStaffSchema.parse(req.body);
      const staff = await staffService.create(businessId, userId, data);

      res.status(201).json({
        success: true,
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List staff for a business
   * GET /v1/businesses/:businessId/staff
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      const staff = await staffService.list(businessId, userId, includeInactive);

      res.json({
        success: true,
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single staff member
   * GET /v1/businesses/:businessId/staff/:id
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId, id } = req.params;

      const staff = await staffService.getById(id, businessId, userId);

      res.json({
        success: true,
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a staff member
   * PATCH /v1/businesses/:businessId/staff/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId, id } = req.params;

      logger.info({ userId, businessId, staffId: id }, 'Staff update request');

      const data = updateStaffSchema.parse(req.body);
      const staff = await staffService.update(id, businessId, userId, data);

      res.json({
        success: true,
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate a staff member
   * POST /v1/businesses/:businessId/staff/:id/deactivate
   */
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId, id } = req.params;

      logger.info({ userId, businessId, staffId: id }, 'Staff deactivation request');

      const staff = await staffService.deactivate(id, businessId, userId);

      res.json({
        success: true,
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reactivate a staff member
   * POST /v1/businesses/:businessId/staff/:id/reactivate
   */
  async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId, id } = req.params;

      logger.info({ userId, businessId, staffId: id }, 'Staff reactivation request');

      const staff = await staffService.reactivate(id, businessId, userId);

      res.json({
        success: true,
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Link staff to a resource
   * POST /v1/businesses/:businessId/staff/:id/link-resource
   */
  async linkResource(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId, id } = req.params;

      logger.info({ userId, businessId, staffId: id }, 'Staff link resource request');

      const data = linkResourceSchema.parse(req.body);
      const link = await staffService.linkToResource(id, businessId, userId, data);

      res.status(201).json({
        success: true,
        data: { link },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unlink staff from a resource
   * DELETE /v1/businesses/:businessId/staff/:id/link-resource/:resourceId
   */
  async unlinkResource(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId, id, resourceId } = req.params;

      logger.info({ userId, businessId, staffId: id, resourceId }, 'Staff unlink resource request');

      await staffService.unlinkFromResource(id, resourceId, businessId, userId);

      res.json({
        success: true,
        data: { message: 'Resource unlinked successfully' },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get linked resources for a staff member
   * GET /v1/businesses/:businessId/staff/:id/linked-resources
   */
  async getLinkedResources(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const { businessId, id } = req.params;

      const linkedResources = await staffService.getLinkedResources(id, businessId, userId);

      res.json({
        success: true,
        data: { linkedResources },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const staffController = new StaffController();
