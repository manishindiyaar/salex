"use strict";
/**
 * Health Check Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_types_1 = require("@salex/shared-types");
const router = (0, express_1.Router)();
/**
 * GET /health
 * Basic health check
 */
router.get('/', (_req, res) => {
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
router.get('/db', async (_req, res) => {
    try {
        await shared_types_1.prisma.$queryRaw `SELECT 1`;
        res.json({
            success: true,
            data: {
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Database connection failed',
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map