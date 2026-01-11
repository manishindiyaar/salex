"use strict";
/**
 * Server Entry Point
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables FIRST before any other imports
require("dotenv/config");
const app_1 = require("./app");
const config_1 = require("./config");
const logger_1 = __importDefault(require("./utils/logger"));
async function main() {
    try {
        // Load and validate configuration
        const config = (0, config_1.getConfig)();
        // Create Express app
        const app = (0, app_1.createApp)();
        // Start server
        const server = app.listen(config.port, () => {
            logger_1.default.info(`🚀 Server running on port ${config.port}`);
            logger_1.default.info(`📍 Environment: ${config.nodeEnv}`);
            logger_1.default.info(`🔗 Health check: http://localhost:${config.port}/health`);
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            logger_1.default.info(`${signal} received, shutting down gracefully...`);
            server.close(() => {
                logger_1.default.info('HTTP server closed');
                process.exit(0);
            });
            // Force exit after 10 seconds
            setTimeout(() => {
                logger_1.default.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger_1.default.error({ err: error }, 'Failed to start server');
        process.exit(1);
    }
}
main();
//# sourceMappingURL=server.js.map