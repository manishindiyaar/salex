/**
 * Admin Simulator Controller
 *
 * Handles admin simulator endpoints for testing flows in isolation.
 * All routes require admin authentication and an explicit businessId path parameter.
 *
 * Endpoints:
 * - POST   /sessions                          - Create a new simulation session
 * - POST   /sessions/:sessionId/message       - Send a text message
 * - POST   /sessions/:sessionId/interactive   - Send an interactive reply
 * - POST   /sessions/:sessionId/reset         - Reset (delete) a session
 * - GET    /sessions/:sessionId               - Get session data
 *
 * Error handling:
 * - AppError with code 'SESSION_EXPIRED' → 410
 * - AppError with code 'FLOW_NOT_ACCESSIBLE' → 403
 * - NotFoundError → 404
 * - Other errors → pass to next(error)
 *
 * Requirements: 7.1, 7.4, 7.7, 7.8
 */

import { Request, Response, NextFunction } from 'express';
import { simulatorService } from '../services/simulator.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

async function assertSessionAccess(
  sessionId: string,
  businessId: string,
  adminId: string | undefined,
): Promise<{ ok: true } | { ok: false; status: number; code: string; message: string }> {
  const session = await simulatorService.getSession(sessionId);

  if (!session) {
    return {
      ok: false,
      status: 404,
      code: 'NOT_FOUND',
      message: `Session '${sessionId}' not found`,
    };
  }

  if (session.businessId !== businessId || (adminId && session.adminId !== adminId)) {
    return {
      ok: false,
      status: 403,
      code: 'SESSION_NOT_ACCESSIBLE',
      message: 'Simulation session is not accessible for this business/admin.',
    };
  }

  return { ok: true };
}

class AdminSimulatorController {
  /**
   * POST /api/v1/admin/businesses/:businessId/simulator/sessions
   * Create a new simulation session for the specified business and flow.
   * Body: { flowId: string }
   */
  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const adminId = (req as any).admin?.adminId;
      const { flowId } = req.body;

      if (!flowId) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'flowId is required' },
        });
      }

      const result = await simulatorService.createSession({
        businessId,
        flowId,
        adminId,
      });

      logger.info(
        { sessionId: result.session.id, flowId, businessId, adminId },
        'Simulator session created via admin API',
      );

      res.status(201).json({
        success: true,
        data: { session: result.session, initialResponse: result.initialResponse },
      });
    } catch (error) {
      if (error instanceof AppError) {
        if (error.code === 'FLOW_NOT_ACCESSIBLE') {
          return res.status(403).json({
            success: false,
            error: { code: 'FLOW_NOT_ACCESSIBLE', message: error.message },
          });
        }
        if (error.code === 'SESSION_EXPIRED') {
          return res.status(410).json({
            success: false,
            error: { code: 'SESSION_EXPIRED', message: error.message },
          });
        }
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/businesses/:businessId/simulator/sessions/:sessionId/message
   * Send a text message to the simulation session.
   * Body: { text: string }
   */
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const businessId = req.params.businessId;
      const adminId = (req as any).admin?.adminId;
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'text is required' },
        });
      }

      const access = await assertSessionAccess(sessionId, businessId, adminId);
      if (!access.ok) {
        return res.status(access.status).json({
          success: false,
          error: { code: access.code, message: access.message },
        });
      }

      const response = await simulatorService.sendMessage(sessionId, text);

      res.json({ success: true, data: response });
    } catch (error) {
      if (error instanceof AppError) {
        if (error.code === 'SESSION_EXPIRED') {
          return res.status(410).json({
            success: false,
            error: { code: 'SESSION_EXPIRED', message: error.message },
          });
        }
        if (error.code === 'FLOW_NOT_ACCESSIBLE') {
          return res.status(403).json({
            success: false,
            error: { code: 'FLOW_NOT_ACCESSIBLE', message: error.message },
          });
        }
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/businesses/:businessId/simulator/sessions/:sessionId/interactive
   * Send an interactive reply to the simulation session.
   * Body: { type: string, id: string, title: string }
   */
  async sendInteractive(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const businessId = req.params.businessId;
      const adminId = (req as any).admin?.adminId;
      const { type, id, title } = req.body;

      if (!type || !id || !title) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'type, id, and title are required' },
        });
      }

      const access = await assertSessionAccess(sessionId, businessId, adminId);
      if (!access.ok) {
        return res.status(access.status).json({
          success: false,
          error: { code: access.code, message: access.message },
        });
      }

      const response = await simulatorService.sendInteractive(sessionId, { type, id, title });

      res.json({ success: true, data: response });
    } catch (error) {
      if (error instanceof AppError) {
        if (error.code === 'SESSION_EXPIRED') {
          return res.status(410).json({
            success: false,
            error: { code: 'SESSION_EXPIRED', message: error.message },
          });
        }
        if (error.code === 'FLOW_NOT_ACCESSIBLE') {
          return res.status(403).json({
            success: false,
            error: { code: 'FLOW_NOT_ACCESSIBLE', message: error.message },
          });
        }
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/businesses/:businessId/simulator/sessions/:sessionId/reset
   * Reset (delete) a simulation session and all associated messages.
   */
  async resetSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const businessId = req.params.businessId;
      const adminId = (req as any).admin?.adminId;

      const access = await assertSessionAccess(sessionId, businessId, adminId);
      if (!access.ok) {
        return res.status(access.status).json({
          success: false,
          error: { code: access.code, message: access.message },
        });
      }

      await simulatorService.resetSession(sessionId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/businesses/:businessId/simulator/sessions/:sessionId
   * Get session data or 404 if not found.
   */
  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const businessId = req.params.businessId;
      const adminId = (req as any).admin?.adminId;

      const session = await simulatorService.getSession(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Session '${sessionId}' not found` },
        });
      }

      if (session.businessId !== businessId || (adminId && session.adminId !== adminId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'SESSION_NOT_ACCESSIBLE',
            message: 'Simulation session is not accessible for this business/admin.',
          },
        });
      }

      res.json({ success: true, data: { session } });
    } catch (error) {
      next(error);
    }
  }
}

export const adminSimulatorController = new AdminSimulatorController();
