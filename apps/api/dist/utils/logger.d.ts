/**
 * Application Logger
 *
 * Pino-based structured logging with correlation ID support.
 */
import pino from 'pino';
export declare const logger: pino.Logger<never, boolean>;
export default logger;
/**
 * Create a child logger with correlation ID
 */
export declare function createRequestLogger(correlationId: string): pino.Logger<never, boolean>;
//# sourceMappingURL=logger.d.ts.map