/**
 * WhatsApp Queue Service
 *
 * Provides enqueue methods for inbound and outbound WhatsApp messages.
 * Handles idempotent job creation using waMessageId-based job IDs.
 * Optionally stores raw payload in Redis with TTL for debugging.
 */

import { getInboundQueue, getOutboundQueue, InboundJobPayload, OutboundJobPayload } from '../queues/whatsapp-queues';
import { getRedisConnection } from '../queues/redis-connection';
import { logger } from '../utils/logger';

/** TTL for raw payload cache in Redis (24 hours) */
const RAW_PAYLOAD_TTL_SECONDS = 86400;

class WhatsAppQueueService {
  /**
   * Enqueue an inbound message for processing.
   * Job ID is `inbound:${waMessageId}` for idempotency (Meta may retry webhooks).
   */
  async enqueueInbound(data: InboundJobPayload): Promise<{ enqueued: boolean }> {
    const jobId = `inbound:${data.waMessageId}`;

    try {
      const queue = getInboundQueue();
      await queue.add('process', data, { jobId });

      logger.info({
        jobId,
        customerPhone: data.customerPhone,
        messageType: data.messageType,
      }, 'Inbound job enqueued');

      return { enqueued: true };
    } catch (error: any) {
      // BullMQ throws if job with same ID already exists (idempotency)
      if (error.message?.includes('already exists')) {
        logger.debug({ jobId }, 'Duplicate inbound job ignored (idempotent)');
        return { enqueued: false };
      }
      throw error;
    }
  }

  /**
   * Enqueue an outbound message for sending.
   * Job ID is `outbound:${waMessageId}:response` for idempotency.
   */
  async enqueueOutbound(data: OutboundJobPayload): Promise<void> {
    const jobId = `outbound:${data.waMessageId}:response`;

    try {
      const queue = getOutboundQueue();
      await queue.add('send', data, { jobId });

      logger.debug({ jobId, toPhone: data.toPhone }, 'Outbound job enqueued');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        logger.debug({ jobId }, 'Duplicate outbound job ignored (idempotent)');
        return;
      }
      throw error;
    }
  }

  /**
   * Optionally cache the raw webhook payload in Redis for debugging.
   * Not required for normal operation — call only if needed.
   */
  async cacheRawPayload(waMessageId: string, payload: unknown): Promise<void> {
    try {
      const redis = getRedisConnection();
      const key = `whatsapp:payload:${waMessageId}`;
      await redis.set(key, JSON.stringify(payload), 'EX', RAW_PAYLOAD_TTL_SECONDS);
    } catch (error) {
      // Non-critical — log and continue
      logger.warn({ waMessageId }, 'Failed to cache raw payload in Redis');
    }
  }
}

export const whatsappQueueService = new WhatsAppQueueService();
