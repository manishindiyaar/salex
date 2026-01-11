/**
 * Application Logger
 * 
 * Pino-based structured logging with correlation ID support.
 */

import pino from 'pino';
import { isDevelopment } from '../config';

export const logger = pino({
  level: isDevelopment() ? 'debug' : 'info',
  transport: isDevelopment()
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

export default logger;

/**
 * Create a child logger with correlation ID
 */
export function createRequestLogger(correlationId: string) {
  return logger.child({ correlationId });
}
