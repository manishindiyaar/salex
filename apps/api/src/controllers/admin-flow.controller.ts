/**
 * Admin Flow Controller
 *
 * Admin-scoped flow management controller. Every handler requires an explicit
 * `businessId` path parameter — no "first business" fallback or implicit resolution.
 *
 * Endpoints:
 * - GET    /                     - List flows for business
 * - GET    /:flowId              - Get a single flow
 * - POST   /                     - Create new flow (DRAFT)
 * - PUT    /:flowId              - Update flow (new DRAFT version)
 * - POST   /:flowId/publish      - Publish a flow version
 * - POST   /:flowId/archive      - Archive a flow version
 * - DELETE /:flowId              - Delete a flow
 * - GET    /readiness            - Get business flow readiness
 * - GET    /context              - Get business flow context
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { Request, Response, NextFunction } from 'express';
import { prisma, createFlowSchema } from '@salex/shared-types';
import { flowService } from '../services/flow.service';
import { businessFlowReadinessService } from '../services/business-flow-readiness.service';
import { businessContextService } from '../services/business-context.service';
import { logger } from '../utils/logger';

/**
 * Extracts and validates businessId from req.params.
 * Returns the businessId string or null if missing/empty.
 */
function extractBusinessId(req: Request): string | null {
  const businessId = req.params.businessId;
  if (!businessId || businessId.trim() === '') {
    return null;
  }
  return businessId;
}

/**
 * Validates that a business exists in the database.
 * Returns true if found, false otherwise.
 */
async function businessExists(businessId: string): Promise<boolean> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  return business !== null;
}

class AdminFlowController {
  /**
   * GET /api/v1/admin/businesses/:businessId/flows
   * List all flow versions for the specified business.
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = extractBusinessId(req);
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required' },
        });
      }

      if (!(await businessExists(businessId))) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUSINESS_NOT_FOUND', message: `Business '${businessId}' not found` },
        });
      }

      const flows = await flowService.list(businessId);

      res.json({ success: true, data: { flows } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/businesses/:businessId/flows/:flowId
   * Get a single flow by id, scoped to the business.
   */
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = extractBusinessId(req);
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required' },
        });
      }

      if (!(await businessExists(businessId))) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUSINESS_NOT_FOUND', message: `Business '${businessId}' not found` },
        });
      }

      const flow = await flowService.getById(req.params.flowId, businessId);

      res.json({ success: true, data: { flow } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/businesses/:businessId/flows
   * Create a new flow as DRAFT for the business.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = extractBusinessId(req);
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required' },
        });
      }

      if (!(await businessExists(businessId))) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUSINESS_NOT_FOUND', message: `Business '${businessId}' not found` },
        });
      }

      // Validate request body
      const parseResult = createFlowSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FLOW_DEFINITION',
            message: 'Invalid flow data',
            details: parseResult.error.issues.map((i) => i.message),
          },
        });
      }

      const adminId = (req as any).admin?.adminId;
      const flow = await flowService.saveDraft(businessId, parseResult.data, adminId);

      logger.info({ flowId: flow.id, businessId, adminId }, 'Flow draft created via admin API');

      res.status(201).json({ success: true, data: { flow } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/businesses/:businessId/flows/:flowId
   * Update a flow — creates a new DRAFT version.
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = extractBusinessId(req);
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required' },
        });
      }

      if (!(await businessExists(businessId))) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUSINESS_NOT_FOUND', message: `Business '${businessId}' not found` },
        });
      }

      // Validate request body
      const parseResult = createFlowSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FLOW_DEFINITION',
            message: 'Invalid flow data',
            details: parseResult.error.issues.map((i) => i.message),
          },
        });
      }

      const adminId = (req as any).admin?.adminId;
      const flow = await flowService.saveDraft(businessId, parseResult.data, adminId);

      logger.info({ flowId: flow.id, businessId, adminId }, 'Flow draft updated via admin API');

      res.json({ success: true, data: { flow } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/businesses/:businessId/flows/:flowId/publish
   * Publish a flow version for the business.
   */
  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = extractBusinessId(req);
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required' },
        });
      }

      if (!(await businessExists(businessId))) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUSINESS_NOT_FOUND', message: `Business '${businessId}' not found` },
        });
      }

      const flow = await flowService.publish(req.params.flowId, businessId);

      logger.info({ flowId: req.params.flowId, businessId }, 'Flow published via admin API');

      res.json({ success: true, data: { flow } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/businesses/:businessId/flows/:flowId/archive
   * Archive a flow version for the business.
   */
  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = extractBusinessId(req);
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required' },
        });
      }

      if (!(await businessExists(businessId))) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUSINESS_NOT_FOUND', message: `Business '${businessId}' not found` },
        });
      }

      const flow = await flowService.archive(req.params.flowId, businessId);

      logger.info({ flowId: req.params.flowId, businessId }, 'Flow archived via admin API');

      res.json({ success: true, data: { flow } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/businesses/:businessId/flows/:flowId
   * Delete a flow (refuses if active/published).
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = extractBusinessId(req);
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required' },
        });
      }

      if (!(await businessExists(businessId))) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUSINESS_NOT_FOUND', message: `Business '${businessId}' not found` },
        });
      }

      await flowService.delete(req.params.flowId, businessId);

      logger.info({ flowId: req.params.flowId, businessId }, 'Flow deleted via admin API');

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/businesses/:businessId/flow-readiness
   * Get business flow readiness status.
   */
  async getReadiness(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = extractBusinessId(req);
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required' },
        });
      }

      if (!(await businessExists(businessId))) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUSINESS_NOT_FOUND', message: `Business '${businessId}' not found` },
        });
      }

      const readiness = await businessFlowReadinessService.checkReadiness(businessId);

      res.json({ success: true, data: readiness });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/businesses/:businessId/flow-context
   * Get business context for the flow editor (services, staff, variables, etc.).
   */
  async getContext(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = extractBusinessId(req);
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_BUSINESS_ID', message: 'businessId is required' },
        });
      }

      if (!(await businessExists(businessId))) {
        return res.status(404).json({
          success: false,
          error: { code: 'BUSINESS_NOT_FOUND', message: `Business '${businessId}' not found` },
        });
      }

      const context = await businessContextService.getContext(businessId);

      res.json({ success: true, data: context });
    } catch (error) {
      next(error);
    }
  }
}

export const adminFlowController = new AdminFlowController();
