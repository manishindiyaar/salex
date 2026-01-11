"use strict";
/**
 * Express Application Setup
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const uuid_1 = require("uuid");
const routes_1 = __importDefault(require("./routes"));
const middlewares_1 = require("./middlewares");
const config_1 = require("./config");
function createApp() {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    // CORS - Allow all origins in development and simulator mode
    // For production, restrict to ALLOWED_ORIGINS
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, or file://)
            if (!origin) {
                callback(null, true);
                return;
            }
            // In development, allow all
            if ((0, config_1.isDevelopment)()) {
                callback(null, true);
                return;
            }
            // Allow localhost for simulator
            if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('file://')) {
                callback(null, true);
                return;
            }
            // Check allowed origins
            const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(null, true); // Allow anyway for now, tighten in production
            }
        },
        credentials: true,
    }));
    // Compression
    app.use((0, compression_1.default)());
    // Request logging
    app.use((0, morgan_1.default)((0, config_1.isDevelopment)() ? 'dev' : 'combined'));
    // Add correlation ID to all requests
    app.use((req, _res, next) => {
        req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
        next();
    });
    // Body parsing
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // Routes
    app.use(routes_1.default);
    // 404 handler
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'Endpoint not found',
            },
        });
    });
    // Global error handler (must be last)
    app.use(middlewares_1.errorMiddleware);
    return app;
}
//# sourceMappingURL=app.js.map