/**
 * Server Entry Point
 */

// Load environment variables FIRST before any other imports
import 'dotenv/config';

import { createApp } from './app';
import { getConfig } from './config';
import { whatsappDbWorkerService } from './services/whatsapp-db-worker.service';
import { startWhatsAppWorkers, stopWhatsAppWorkers } from './workers/whatsapp-workers';
import logger from './utils/logger';

async function main() {
  try {
    // Load and validate configuration
    const config = getConfig();
    
    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📍 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 Health check: http://localhost:${config.port}/health`);
    });

    // Start WhatsApp workers based on configured backend
    if (config.whatsappWorkersEnabled) {
      if (config.whatsappQueueBackend === 'redis' && config.redisUrl) {
        startWhatsAppWorkers();
        logger.info('📨 Queue backend: Redis (BullMQ)');
      } else if (config.whatsappDbWorkersEnabled) {
        whatsappDbWorkerService.start();
        logger.info('📨 Queue backend: PostgreSQL (DB polling)');
      }
    }

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      if (config.whatsappQueueBackend === 'redis') {
        await stopWhatsAppWorkers();
      } else {
        whatsappDbWorkerService.stop();
      }
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

main();
