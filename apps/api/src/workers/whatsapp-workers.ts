/**
 * WhatsApp Workers Orchestrator
 *
 * Creates and manages BullMQ inbound + outbound workers.
 * Started from server.ts when WHATSAPP_QUEUE_BACKEND=redis.
 */

import { Worker } from 'bullmq';
import { createInboundWorker } from './whatsapp-inbound.worker';
import { createOutboundWorker } from './whatsapp-outbound.worker';
import { closeQueues } from '../queues/whatsapp-queues';
import { closeRedisConnection } from '../queues/redis-connection';
import { logger } from '../utils/logger';

let inboundWorker: Worker | null = null;
let outboundWorker: Worker | null = null;

/**
 * Start all WhatsApp BullMQ workers.
 */
export function startWhatsAppWorkers(): void {
  if (inboundWorker || outboundWorker) {
    logger.warn('WhatsApp workers already running');
    return;
  }

  inboundWorker = createInboundWorker();
  outboundWorker = createOutboundWorker();

  logger.info('WhatsApp BullMQ workers started (inbound + outbound)');
}

/**
 * Gracefully stop all workers and close connections.
 */
export async function stopWhatsAppWorkers(): Promise<void> {
  const shutdowns: Promise<void>[] = [];

  if (inboundWorker) {
    shutdowns.push(inboundWorker.close());
    inboundWorker = null;
  }

  if (outboundWorker) {
    shutdowns.push(outboundWorker.close());
    outboundWorker = null;
  }

  await Promise.allSettled(shutdowns);
  await closeQueues();
  await closeRedisConnection();

  logger.info('WhatsApp BullMQ workers stopped');
}
