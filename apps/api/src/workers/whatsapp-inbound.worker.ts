/**
 * WhatsApp Inbound Worker (BullMQ)
 *
 * Processes inbound customer messages:
 * 1. Acquire Redis lock per customer+business
 * 2. Call engineRouter.route() to generate response
 * 3. Write minimal inbound audit to Postgres
 * 4. Enqueue outbound job
 * 5. Release lock
 */

import { Worker, Job } from 'bullmq';
import { getRedisConnectionOptions, getRedisConnection } from '../queues/redis-connection';
import type { InboundJobPayload, OutboundJobPayload } from '../queues/whatsapp-queues';
import { whatsappQueueService } from '../services/whatsapp-queue.service';
import { engineRouter } from '../services/engine-router.service';
import { whatsappMessageAuditService } from '../services/whatsapp-message-audit.service';
import { prisma } from '@salex/shared-types';
import { getConfig } from '../config';
import { logger } from '../utils/logger';

/** Lock TTL in milliseconds (2 minutes) */
const LOCK_TTL_MS = 120_000;

/** Build the Redis lock key for per-customer serialization */
function buildLockKey(data: InboundJobPayload): string {
  const scope = data.businessId || data.phoneNumberId || 'shared';
  return `lock:whatsapp:${scope}:${data.customerPhone}`;
}

/** Generate a unique lock token for this job attempt */
function lockToken(jobId: string): string {
  return `${process.pid}:${jobId}:${Date.now()}`;
}

/**
 * Acquire a Redis lock. Returns the token if acquired, null if busy.
 * Uses SET NX EX pattern (atomic).
 */
async function acquireLock(key: string, token: string): Promise<boolean> {
  const redis = getRedisConnection();
  const result = await redis.set(key, token, 'PX', LOCK_TTL_MS, 'NX');
  return result === 'OK';
}

/**
 * Release lock only if we own it (compare token).
 * Uses Lua script for atomicity.
 */
async function releaseLock(key: string, token: string): Promise<void> {
  const redis = getRedisConnection();
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await redis.eval(script, 1, key, token);
}

/**
 * Process a single inbound job.
 */
async function processInbound(job: Job<InboundJobPayload>): Promise<void> {
  const data = job.data;
  const lockKey = buildLockKey(data);
  const token = lockToken(job.id || data.waMessageId);
  const processingStartedAt = Date.now();

  // 1. Acquire lock
  const locked = await acquireLock(lockKey, token);
  if (!locked) {
    // Another worker is processing this customer — delay and retry
    throw new Error(`Lock busy: ${lockKey}`);
  }

  try {
    // 2. Route message through engine
    const interactiveReply = data.interactiveReply || undefined;
    const routeStartedAt = Date.now();

    const response = await engineRouter.route({
      customerPhone: data.customerPhone,
      messageText: data.messageText || data.interactiveReply?.title || '',
      interactiveReply,
      businessId: data.businessId || undefined,
      phoneNumberId: data.phoneNumberId || undefined,
    });

    const responseGeneratedAt = Date.now();

    // 3. Write inbound audit to Postgres (minimal)
    await whatsappMessageAuditService.storeInbound({
      conversationId: response.conversationId,
      whatsappMessageId: data.waMessageId,
      messageType: data.messageType,
      content: {
        engine: response.engine,
        jobId: job.id,
      },
    });

    // 4. Read conversation version for stale-message guard
    const conv = await prisma.whatsAppConversation.findUnique({
      where: { id: response.conversationId },
      select: { version: true, businessId: true },
    });

    // 5. Enqueue outbound job
    const outboundPayload: OutboundJobPayload = {
      waMessageId: data.waMessageId,
      conversationId: response.conversationId,
      toPhone: data.customerPhone,
      phoneNumberId: data.phoneNumberId || undefined,
      businessId: conv?.businessId || data.businessId || undefined,
      messageType: response.message.type,
      payload: response.message as unknown as Record<string, unknown>,
      conversationVersion: conv?.version ?? null,
      engine: response.engine,
      createdAt: new Date().toISOString(),
    };

    await whatsappQueueService.enqueueOutbound(outboundPayload);

    // 6. Observability
    logger.info({
      jobId: job.id,
      engine: response.engine,
      queue_wait_ms: processingStartedAt - new Date(data.receivedAt).getTime(),
      response_generation_ms: responseGeneratedAt - routeStartedAt,
      total_processing_ms: Date.now() - processingStartedAt,
    }, 'Inbound job processed — outbound enqueued');

  } finally {
    // Always release lock
    await releaseLock(lockKey, token);
  }
}

/**
 * Create and return the BullMQ inbound worker.
 */
export function createInboundWorker(): Worker<InboundJobPayload> {
  const config = getConfig();
  const concurrency = config.whatsappInboundConcurrency || 10;

  const worker = new Worker<InboundJobPayload>(
    'whatsapp-inbound',
    processInbound,
    {
      connection: getRedisConnectionOptions(),
      concurrency,
      limiter: {
        max: concurrency,
        duration: 1000,
      },
    },
  );

  worker.on('failed', (job, err) => {
    logger.warn({
      jobId: job?.id,
      attempts: job?.attemptsMade,
      error: err.message,
    }, 'Inbound job failed');
  });

  worker.on('error', (err) => {
    logger.error({ err: err.message }, 'Inbound worker error');
  });

  return worker;
}
