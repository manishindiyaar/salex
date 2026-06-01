/**
 * Flow Controller
 *
 * Owner-scoped CRUD + versioning + activate/deactivate for WhatsApp flow definitions.
 * Resolves the caller's business from req.auth.userId (owner → Business.ownerId)
 * and ignores any client-supplied businessId.
 *
 * Endpoints:
 * - GET    /              - List flows for the owner's business
 * - GET    /channel/verify-token - Get configured webhook verify token
 * - GET    /:id           - Get a single flow
 * - POST   /              - Create a new flow (version 1)
 * - PUT    /:id           - Update flow (creates new version)
 * - POST   /:id/activate  - Activate a flow version
 * - POST   /:id/deactivate - Deactivate a flow version
 * - DELETE /:id           - Delete a flow (refuses if active)
 *
 * Requirements: 1.2, 8.4, 10.1, 10.3, 10.4, 10.6, 16.2, 16.3, 16.5
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma, createFlowSchema, updateFlowSchema } from '@salex/shared-types';
import { flowService } from '../services/flow.service';
import { getConfig } from '../config';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError, AppError } from '../utils/errors';

/**
 * Resolves the caller's business from req.auth.userId (owner → Business.ownerId).
 * For admin users (req.admin is set), allows an optional businessId query param.
 * Returns the businessId or throws NotFoundError if the user has no business.
 */
async function resolveBusinessId(req: Request): Promise<string> {
  // If this is an admin request with a businessId query param, use that
  const adminReq = req as any;
  if (adminReq.admin && req.query.businessId) {
    const business = await prisma.business.findUnique({
      where: { id: req.query.businessId as string },
      select: { id: true },
    });
    if (!business) {
      throw new NotFoundError('Business', req.query.businessId as string);
    }
    return business.id;
  }

  const userId = req.auth?.userId || adminReq.admin?.adminId;
  if (!userId) {
    throw new NotFoundError('Business', 'unknown user');
  }

  // Try finding a business owned by this user
  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (business) {
    return business.id;
  }

  // For admin users without a directly owned business, return the first business
  // (platform admins can manage any business's flows)
  if (adminReq.admin) {
    const anyBusiness = await prisma.business.findFirst({
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    if (anyBusiness) {
      return anyBusiness.id;
    }
    // No businesses exist — return empty string to signal no-business state
    return '';
  }

  throw new NotFoundError('Business', `owner:${userId}`);
}

/**
 * Extracts offending reference ids from Zod validation issues.
 * Returns the ids that failed reference validation (entryNodeId, edge from/to).
 */
function extractReferenceIds(issues: z.ZodIssue[]): string[] {
  const ids: string[] = [];
  for (const issue of issues) {
    if (issue.code === 'custom' && issue.message) {
      // Extract quoted identifiers from messages like:
      // 'entryNodeId "xyz" does not reference an existing node'
      // 'edge "e1" references non-existent from-node "xyz"'
      const matches = issue.message.match(/"([^"]+)"/g);
      if (matches) {
        for (const match of matches) {
          ids.push(match.replace(/"/g, ''));
        }
      }
    }
  }
  return [...new Set(ids)];
}

/**
 * Checks if Zod issues contain reference validation errors (from the superRefine).
 */
function hasReferenceErrors(issues: z.ZodIssue[]): boolean {
  return issues.some(
    (issue) =>
      issue.code === 'custom' &&
      issue.message !== undefined &&
      (issue.message.includes('does not reference an existing node') ||
        issue.message.includes('references non-existent') ||
        issue.message.includes('fallback edges')),
  );
}

class FlowController {
  /**
   * GET /
   * List all flow versions for the authenticated owner's business.
   * Req 10.1, 10.5, 16.5
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await resolveBusinessId(req);

      // No business exists (admin with empty DB) — return empty list
      if (!businessId) {
        return res.json({ success: true, data: { flows: [] } });
      }

      const flows = await flowService.list(businessId);

      res.json({
        success: true,
        data: { flows },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /:id
   * Get a single flow by id (scoped to the owner's business).
   * Req 10.1, 16.2
   */
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await resolveBusinessId(req);
      const { id } = req.params;

      const flow = await flowService.getById(id, businessId);

      res.json({
        success: true,
        data: { flow },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /
   * Create a new flow (version 1) for the owner's business.
   * Validates body with createFlowSchema; returns 400 INVALID_FLOW_REFERENCE on bad references.
   * Req 10.1, 10.3, 10.6
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await resolveBusinessId(req);
      const userId = req.auth?.userId || (req as any).admin?.adminId || 'unknown';

      // Validate request body
      const parseResult = createFlowSchema.safeParse(req.body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues;

        // Check for reference validation errors (Req 10.6)
        if (hasReferenceErrors(issues)) {
          const offendingIds = extractReferenceIds(issues);
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_FLOW_REFERENCE',
              message: 'Flow definition contains invalid references',
              offendingIds,
            },
          });
        }

        throw new ValidationError('Invalid flow data', parseResult.error);
      }

      const data = parseResult.data;
      const flow = await flowService.create(businessId, data, userId);

      logger.info({ flowId: flow.id, businessId, userId }, 'Flow created via API');

      res.status(201).json({
        success: true,
        data: { flow },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /:id
   * Update a flow (creates a new version). Never mutates prior versions.
   * Validates body with updateFlowSchema; returns 400 INVALID_FLOW_REFERENCE on bad references.
   * Req 1.2, 10.3, 10.6
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await resolveBusinessId(req);
      const userId = req.auth?.userId || (req as any).admin?.adminId || 'unknown';
      const { id } = req.params;

      // Validate request body
      const parseResult = updateFlowSchema.safeParse(req.body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues;

        // Check for reference validation errors (Req 10.6)
        if (hasReferenceErrors(issues)) {
          const offendingIds = extractReferenceIds(issues);
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_FLOW_REFERENCE',
              message: 'Flow definition contains invalid references',
              offendingIds,
            },
          });
        }

        throw new ValidationError('Invalid flow data', parseResult.error);
      }

      const data = parseResult.data;
      const flow = await flowService.save(id, businessId, data, userId);

      logger.info({ flowId: flow.id, businessId, version: flow.version, userId }, 'Flow version saved via API');

      res.json({
        success: true,
        data: { flow },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /:id/activate
   * Activate a flow version for the owner's business.
   * Req 10.4, 1.3
   */
  async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await resolveBusinessId(req);
      const userId = req.auth?.userId || (req as any).admin?.adminId || 'unknown';
      const { id } = req.params;

      const flow = await flowService.activate(id, businessId);

      logger.info({ flowId: id, businessId, userId }, 'Flow activated via API');

      res.json({
        success: true,
        data: { flow },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /:id/deactivate
   * Deactivate a flow version for the owner's business.
   * Req 10.4
   */
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await resolveBusinessId(req);
      const userId = req.auth?.userId || (req as any).admin?.adminId || 'unknown';
      const { id } = req.params;

      const flow = await flowService.deactivate(id, businessId);

      logger.info({ flowId: id, businessId, userId }, 'Flow deactivated via API');

      res.json({
        success: true,
        data: { flow },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /:id
   * Delete a flow (refuses if active).
   * Req 10.1
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = await resolveBusinessId(req);
      const userId = req.auth?.userId || (req as any).admin?.adminId || 'unknown';
      const { id } = req.params;

      await flowService.delete(id, businessId);

      logger.info({ flowId: id, businessId, userId }, 'Flow deleted via API');

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /channel/verify-token
   * Returns the configured webhook verify token for the authenticated owner.
   * Req 8.4
   */
  async getVerifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Ensure the user is authenticated and has a business (Req 16.3)
      await resolveBusinessId(req);

      const config = getConfig();

      res.json({
        success: true,
        data: { verifyToken: config.whatsappVerifyToken },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const flowController = new FlowController();
