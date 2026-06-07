/**
 * WhatsApp Outbound Worker (BullMQ)
 *
 * Sends response messages to customers via Meta Graph API.
 * Includes stale-message guard and age-based expiry.
 */

import { Worker, Job } from 'bullmq';
import { getRedisConnectionOptions } from '../queues/redis-connection';
import type { OutboundJobPayload } from '../queues/whatsapp-queues';
import type { InteractiveMessage } from '../services/conversation.service';
import { whatsappService } from '../services/whatsapp.service';
import { whatsappMessageAuditService } from '../services/whatsapp-message-audit.service';
import { prisma } from '@salex/shared-types';
import { getConfig } from '../config';
import { logger } from '../utils/logger';

/** Max age for outbound messages before they're considered stale (90s) */
const OUTBOUND_MAX_AGE_MS = 90_000;

/**
 * Process a single outbound job.
 */
async function processOutbound(job: Job<OutboundJobPayload>): Promise<void> {
  const data = job.data;
  const payload = data.payload as unknown as InteractiveMessage;
  const sendStartedAt = Date.now();

  // ─── STALE MESSAGE GUARD ───────────────────────────────────────────────
  if (data.conversationVersion != null) {
    const conv = await prisma.whatsAppConversation.findUnique({
      where: { id: data.conversationId },
      select: { version: true },
    });

    if (conv && conv.version > data.conversationVersion) {
      logger.info({
        jobId: job.id,
        conversationId: data.conversationId,
        generatedForVersion: data.conversationVersion,
        currentVersion: conv.version,
      }, 'Dropped stale outbound job');

      // Write skip audit
      await whatsappMessageAuditService.storeOutbound({
        conversationId: data.conversationId,
        message: payload,
        status: 'failed',
        error: `stale: v${data.conversationVersion} < current v${conv.version}`,
        engine: data.engine as 'flow' | 'legacy' | undefined,
      });
      return;
    }
  }

  // ─── AGE-BASED EXPIRY ──────────────────────────────────────────────────
  const ageMs = Date.now() - new Date(data.createdAt).getTime();
  if (ageMs > OUTBOUND_MAX_AGE_MS) {
    logger.info({
      jobId: job.id,
      conversationId: data.conversationId,
      ageSeconds: Math.round(ageMs / 1000),
    }, 'Dropped expired outbound job');

    await whatsappMessageAuditService.storeOutbound({
      conversationId: data.conversationId,
      message: payload,
      status: 'failed',
      error: `expired: ${Math.round(ageMs / 1000)}s old`,
      engine: data.engine as 'flow' | 'legacy' | undefined,
    });
    return;
  }

  // ─── DETECT FLOW CTA ────────────────────────────────────────────────────
  const isFlowCta = payload.action?.button === '__FLOW_CTA__'
    && payload.action?.sections?.[0]?.title === 'flow_meta';

  let sendResult;

  try {
    if (isFlowCta) {
      const flowMeta = payload.action!.sections![0].rows[0];
      const flowPayload = whatsappService.buildFlowCtaPayload(data.toPhone, {
        flowId: flowMeta.id,
        flowToken: flowMeta.title,
        flowMode: (flowMeta.description as 'draft' | 'published') || 'draft',
        bodyText: payload.body.text,
        ctaText: 'Find Salon',
        footerText: 'Search by name, area, or code',
      });

      sendResult = await whatsappService.sendRawPayload(flowPayload, {
        phoneNumberId: data.phoneNumberId || undefined,
        businessId: data.businessId || undefined,
      });
    } else {
      sendResult = await whatsappService.sendMessage(data.toPhone, payload, {
        phoneNumberId: data.phoneNumberId || undefined,
        businessId: data.businessId || undefined,
      });
    }
  } catch (sendError: any) {
    // Write failed audit
    await whatsappMessageAuditService.storeOutbound({
      conversationId: data.conversationId,
      message: payload,
      status: 'failed',
      error: sendError.message || String(sendError),
      engine: data.engine as 'flow' | 'legacy' | undefined,
    });
    throw sendError; // BullMQ will retry
  }

  const sendCompletedAt = Date.now();
  const providerMessageId = sendResult.messages?.[0]?.id;

  // Write success audit
  await whatsappMessageAuditService.storeOutbound({
    conversationId: data.conversationId,
    whatsappMessageId: providerMessageId,
    message: payload,
    status: 'sent',
    engine: data.engine as 'flow' | 'legacy' | undefined,
  });

  // Update dedicated channel lastOutboundAt
  if (data.businessId) {
    await prisma.whatsAppChannel.updateMany({
      where: { businessId: data.businessId },
      data: { lastOutboundAt: new Date() },
    }).catch(() => {}); // Non-critical
  }

  logger.info({
    jobId: job.id,
    toPhone: data.toPhone,
    meta_send_ms: sendCompletedAt - sendStartedAt,
    providerMessageId,
  }, 'Outbound job sent');
}

/**
 * Create and return the BullMQ outbound worker.
 */
export function createOutboundWorker(): Worker<OutboundJobPayload> {
  const config = getConfig();
  const concurrency = config.whatsappOutboundConcurrency || 10;

  const worker = new Worker<OutboundJobPayload>(
    'whatsapp-outbound',
    processOutbound,
    {
      connection: getRedisConnectionOptions(),
      concurrency,
    },
  );

  worker.on('failed', (job, err) => {
    logger.warn({
      jobId: job?.id,
      attempts: job?.attemptsMade,
      error: err.message,
    }, 'Outbound job failed');
  });

  worker.on('error', (err) => {
    logger.error({ err: err.message }, 'Outbound worker error');
  });

  return worker;
}
