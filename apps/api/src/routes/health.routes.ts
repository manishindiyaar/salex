/**
 * Health Check Routes
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@salex/shared-types';

const router: Router = Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'salex-api',
    },
  });
});

/**
 * GET /health/db
 * Database connectivity check
 */
router.get('/db', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database connection failed',
      },
    });
  }
});

export default router;
