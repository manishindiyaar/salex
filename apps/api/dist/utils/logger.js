"use strict";
/**
 * Application Logger
 *
 * Pino-based structured logging with correlation ID support.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createRequestLogger = createRequestLogger;
const pino_1 = __importDefault(require("pino"));
const config_1 = require("../config");
exports.logger = (0, pino_1.default)({
    level: (0, config_1.isDevelopment)() ? 'debug' : 'info',
    transport: (0, config_1.isDevelopment)()
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    base: {
        service: 'salex-api',
    },
});
exports.default = exports.logger;
/**
 * Create a child logger with correlation ID
 */
function createRequestLogger(correlationId) {
    return exports.logger.child({ correlationId });
}
//# sourceMappingURL=logger.js.map