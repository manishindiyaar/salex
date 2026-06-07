/**
 * @deprecated LEGACY DB POLLING WORKER
 *
 * This service implements the PostgreSQL-based polling queue for WhatsApp
 * message processing. It is ONLY started when WHATSAPP_QUEUE_BACKEND=db.
 *
 * With Redis/BullMQ (WHATSAPP_QUEUE_BACKEND=redis), this service is NOT used.
 * The BullMQ workers in src/workers/ replace this entirely.
 *
 * REMOVAL: Safe to delete once Redis has been stable in production for 2+ weeks
 * and no traffic uses the DB backend. The tables it depends on
 * (WhatsAppInboundEvent, WhatsAppOutboundMessage, WhatsAppProcessingLock)
 * can also be dropped at that point.
 */

import { Prisma, prisma } from '@salex/shared-types';
import type { InteractiveMessage } from './conversation.service';
import { engineRouter } from './engine-router.service';
import { whatsappMessageAuditService } from './whatsapp-message-audit.service';
import { whatsappService } from './whatsapp.service';
import { logger } from '../utils/logger';

type InboundEventRow = {
  id: string;
  waMessageId: string;
  phoneNumberId: string | null;
  customerPhone: string;
  businessId: string | null;
  messageType: string;
  messageText: string | null;
  interactiveId: string | null;
  interactiveText: string | null;
  payload: unknown;
  attempts: number;
  createdAt: Date;
};

type OutboundMessageRow = {
  id: string;
  conversationId: string;
  toPhone: string;
  phoneNumberId: string | null;
  payload: unknown;
  attempts: number;
  createdAt: Date;
  conversationVersion: number | null;
};

const MAX_ATTEMPTS = 5;
const LOCK_STALE_MS = 2 * 60 * 1000;

/**
 * Max age for an outbound message before it's considered too stale to send.
 * Interactive booking replies that wait longer than this are almost certainly
 * obsolete (the user has moved on or a long outage occurred). 90s gives the
 * normal retry backoff schedule [10,30,...] room to succeed while preventing
 * minutes-late deliveries.
 */
const OUTBOUND_MAX_AGE_MS = 90 * 1000;

class WhatsAppDbWorkerService {
  private inboundTimer?: NodeJS.Timeout;
  private outboundTimer?: NodeJS.Timeout;
  private processingInbound = false;
  private processingOutbound = false;
  private readonly workerId = `${process.pid}-${Math.random().toString(36).slice(2)}`;

  // Kick flags — set to true to trigger immediate processing on next check
  private inboundKickPending = false;
  private outboundKickPending = false;

  start(): void {
    if (this.inboundTimer || this.outboundTimer) {
      return;
    }

    this.inboundTimer = setInterval(() => {
      void this.processInboundTick();
    }, 1000);

    this.outboundTimer = setInterval(() => {
      void this.processOutboundTick();
    }, 1000);

    void this.processInboundTick();
    void this.processOutboundTick();

    logger.info({ workerId: this.workerId }, 'WhatsApp DB workers started');
  }

  stop(): void {
    if (this.inboundTimer) {
      clearInterval(this.inboundTimer);
      this.inboundTimer = undefined;
    }

    if (this.outboundTimer) {
      clearInterval(this.outboundTimer);
      this.outboundTimer = undefined;
    }

    logger.info({ workerId: this.workerId }, 'WhatsApp DB workers stopped');
  }

  /**
   * Kick the inbound worker to process immediately instead of waiting
   * up to 1000ms for the next interval tick. Safe to call multiple times;
   * concurrent processing is prevented by the processingInbound flag.
   *
   * Future: Replace with Redis pub/sub or BullMQ event for multi-instance.
   */
  kickInbound(): void {
    if (this.processingInbound) {
      // Already running — the current tick will pick up new events
      return;
    }
    this.inboundKickPending = true;
    // Use setImmediate to avoid blocking the caller and allow the
    // current event loop turn to complete (preserves idempotency checks)
    setImmediate(() => {
      if (this.inboundKickPending) {
        this.inboundKickPending = false;
        void this.processInboundTick();
      }
    });
  }

  /**
   * Kick the outbound worker to send immediately.
   * Same safety guarantees as kickInbound.
   */
  kickOutbound(): void {
    if (this.processingOutbound) {
      return;
    }
    this.outboundKickPending = true;
    setImmediate(() => {
      if (this.outboundKickPending) {
        this.outboundKickPending = false;
        void this.processOutboundTick();
      }
    });
  }

  private async processInboundTick(): Promise<void> {
    if (this.processingInbound) {
      return;
    }

    this.processingInbound = true;
    try {
      for (let i = 0; i < 10; i++) {
        const event = await this.claimInboundEvent();
        if (!event) {
          break;
        }
        await this.processInboundEvent(event);
      }
    } catch (error) {
      logger.error({ error }, 'WhatsApp inbound worker tick failed');
    } finally {
      this.processingInbound = false;
    }
  }

  private async processOutboundTick(): Promise<void> {
    if (this.processingOutbound) {
      return;
    }

    this.processingOutbound = true;
    try {
      for (let i = 0; i < 10; i++) {
        const message = await this.claimOutboundMessage();
        if (!message) {
          break;
        }
        await this.processOutboundMessage(message);
      }
    } catch (error) {
      logger.error({ error }, 'WhatsApp outbound worker tick failed');
    } finally {
      this.processingOutbound = false;
    }
  }

  private async claimInboundEvent(): Promise<InboundEventRow | null> {
    const rows = await prisma.$queryRaw<InboundEventRow[]>`
      UPDATE "WhatsAppInboundEvent"
      SET "status" = 'PROCESSING',
          "lockedAt" = NOW(),
          "lockedBy" = ${this.workerId},
          "attempts" = "attempts" + 1
      WHERE "id" = (
        SELECT "id"
        FROM "WhatsAppInboundEvent"
        WHERE (
          "status" = 'PENDING'
          OR ("status" = 'PROCESSING' AND "lockedAt" < NOW() - INTERVAL '2 minutes')
        )
        AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= NOW())
        ORDER BY "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING *
    `;

    return rows[0] || null;
  }

  private async claimOutboundMessage(): Promise<OutboundMessageRow | null> {
    const rows = await prisma.$queryRaw<OutboundMessageRow[]>`
      UPDATE "WhatsAppOutboundMessage"
      SET "status" = 'PROCESSING',
          "lockedAt" = NOW(),
          "lockedBy" = ${this.workerId},
          "attempts" = "attempts" + 1
      WHERE "id" = (
        SELECT "id"
        FROM "WhatsAppOutboundMessage"
        WHERE (
          "status" = 'PENDING'
          OR ("status" = 'PROCESSING' AND "lockedAt" < NOW() - INTERVAL '2 minutes')
        )
        AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= NOW())
        ORDER BY "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING *
    `;

    return rows[0] || null;
  }

  private async processInboundEvent(event: InboundEventRow): Promise<void> {
    const processingStartedAt = Date.now();
    const lockKey = `whatsapp:${event.customerPhone}`;
    const locked = await this.acquireProcessingLock(lockKey);

    if (!locked) {
      await prisma.whatsAppInboundEvent.update({
        where: { id: event.id },
        data: {
          status: 'PENDING',
          lockedAt: null,
          lockedBy: null,
          nextAttemptAt: new Date(Date.now() + 2000),
        },
      });
      return;
    }

    try {
      const interactiveReply = event.interactiveId
        ? {
            type: 'interactive',
            id: event.interactiveId,
            title: event.interactiveText || '',
          }
        : undefined;

      const routeStartedAt = Date.now();
      const response = await engineRouter.route({
        customerPhone: event.customerPhone,
        messageText: event.messageText || event.interactiveText || '',
        interactiveReply,
        businessId: event.businessId || undefined,
        phoneNumberId: event.phoneNumberId || undefined,
      });
      const responseGeneratedAt = Date.now();

      await whatsappMessageAuditService.storeInbound({
        conversationId: response.conversationId,
        whatsappMessageId: event.waMessageId,
        messageType: event.messageType,
        content: {
          eventId: event.id,
          payload: event.payload as Record<string, unknown>,
          engine: response.engine,
        },
      });

      // Persist the handling engine into contextData.__engine for parity verification (Req 11.5).
      // Uses jsonb concatenation to avoid overwriting other contextData fields.
      await prisma.$executeRaw`
        UPDATE "WhatsAppConversation"
        SET "contextData" = COALESCE("contextData", '{}'::jsonb) || ${JSON.stringify({ __engine: response.engine })}::jsonb
        WHERE "id" = ${response.conversationId}
      `;

      // Read the conversation's current version to stamp on the outbound message.
      // If the conversation advances past this version before the message is sent,
      // the outbound worker will drop it as stale (prevents late/duplicate screens).
      const convForVersion = await prisma.whatsAppConversation.findUnique({
        where: { id: response.conversationId },
        select: { version: true },
      });
      const conversationVersion = convForVersion?.version ?? null;

      await prisma.whatsAppOutboundMessage.upsert({
        where: { idempotencyKey: `inbound:${event.waMessageId}:response` },
        update: {},
        create: {
          idempotencyKey: `inbound:${event.waMessageId}:response`,
          conversationId: response.conversationId,
          toPhone: event.customerPhone,
          phoneNumberId: event.phoneNumberId,
          messageType: response.message.type,
          payload: response.message as unknown as Prisma.InputJsonValue,
          conversationVersion,
        },
      });

      // Kick outbound worker immediately to reduce reply latency
      this.kickOutbound();

      // ─── Observability: timing log (no PII, no message body) ──────────
      const outboundQueuedAt = Date.now();
      const eventCreatedAt = new Date(event.createdAt).getTime();
      logger.info({
        eventId: event.id,
        engine: response.engine,
        queue_wait_ms: processingStartedAt - eventCreatedAt,
        response_generation_ms: responseGeneratedAt - routeStartedAt,
        total_processing_ms: outboundQueuedAt - processingStartedAt,
      }, 'Inbound event processed — outbound queued');

      await prisma.whatsAppInboundEvent.update({
        where: { id: event.id },
        data: {
          status: 'DONE',
          processedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          error: null,
        },
      });
    } catch (error) {
      await this.retryInboundEvent(event, error);
    } finally {
      await this.releaseProcessingLock(lockKey);
    }
  }

  private async processOutboundMessage(message: OutboundMessageRow): Promise<void> {
    const payload = message.payload as InteractiveMessage;
    const sendStartedAt = Date.now();

    // ─── STALE MESSAGE GUARD ───────────────────────────────────────────
    // Drop outbound messages whose conversation has already advanced past
    // the version this response was generated for. This prevents a delayed
    // message (e.g. after a retry following a transient send failure) from
    // overwriting the conversation's current screen with an outdated one.
    if (message.conversationVersion != null) {
      const conv = await prisma.whatsAppConversation.findUnique({
        where: { id: message.conversationId },
        select: { version: true },
      });

      // If the conversation's current version is higher than the version this
      // message was generated for, the message is stale — drop it.
      if (conv && conv.version > message.conversationVersion) {
        await prisma.whatsAppOutboundMessage.update({
          where: { id: message.id },
          data: {
            status: 'SKIPPED',
            error: `stale: generated for v${message.conversationVersion}, conversation now at v${conv.version}`,
            lockedAt: null,
            lockedBy: null,
          },
        });
        logger.info({
          outboundMessageId: message.id,
          conversationId: message.conversationId,
          generatedForVersion: message.conversationVersion,
          currentVersion: conv.version,
        }, 'Dropped stale outbound message');
        return;
      }
    }

    // ─── AGE-BASED EXPIRY SAFETY NET ────────────────────────────────────
    // Even without a version mismatch, a message that has been waiting far
    // longer than any reasonable reply window is almost certainly stale
    // (e.g. queued during a long outage). Drop it rather than surprise the user.
    const ageMs = Date.now() - new Date(message.createdAt).getTime();
    if (ageMs > OUTBOUND_MAX_AGE_MS) {
      await prisma.whatsAppOutboundMessage.update({
        where: { id: message.id },
        data: {
          status: 'SKIPPED',
          error: `expired: ${Math.round(ageMs / 1000)}s old (max ${OUTBOUND_MAX_AGE_MS / 1000}s)`,
          lockedAt: null,
          lockedBy: null,
        },
      });
      logger.info({
        outboundMessageId: message.id,
        conversationId: message.conversationId,
        ageSeconds: Math.round(ageMs / 1000),
      }, 'Dropped expired outbound message');
      return;
    }

    try {
      let sendResult;

      // Detect Flow CTA messages (marked with __FLOW_CTA__ button sentinel)
      const isFlowCta = payload.action?.button === '__FLOW_CTA__'
        && payload.action?.sections?.[0]?.title === 'flow_meta';

      if (isFlowCta) {
        // Extract Flow metadata from the encoded message
        const flowMeta = payload.action!.sections![0].rows[0];
        const flowId = flowMeta.id;
        const flowToken = flowMeta.title;
        const flowMode = (flowMeta.description as 'draft' | 'published') || 'draft';

        const flowPayload = whatsappService.buildFlowCtaPayload(message.toPhone, {
          flowId,
          flowToken,
          flowMode,
          bodyText: payload.body.text,
          ctaText: 'Find Salon',
          footerText: 'Search by name, area, or code',
        });

        sendResult = await whatsappService.sendRawPayload(flowPayload, {
          phoneNumberId: message.phoneNumberId || undefined,
        });
      } else {
        // Normal interactive/text message
        sendResult = await whatsappService.sendMessage(message.toPhone, payload, {
          phoneNumberId: message.phoneNumberId || undefined,
        });
      }

      const sendCompletedAt = Date.now();

      const providerMessageId = sendResult.messages?.[0]?.id;

      await prisma.whatsAppOutboundMessage.update({
        where: { id: message.id },
        data: {
          status: 'SENT',
          providerMessageId: providerMessageId || null,
          sentAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          error: null,
        },
      });

      // ─── Observability: send timing ────────────────────────────────────
      const messageCreatedAt = new Date(message.createdAt).getTime();
      logger.info({
        outboundMessageId: message.id,
        outbound_queue_wait_ms: sendStartedAt - messageCreatedAt,
        meta_send_ms: sendCompletedAt - sendStartedAt,
      }, 'Outbound message sent');

      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { id: message.conversationId },
        select: { businessId: true, contextData: true },
      });

      // Extract the handling engine from contextData for parity verification (Req 11.5)
      const contextEngine = (conversation?.contextData as Record<string, unknown>)?.__engine as
        | 'flow'
        | 'legacy'
        | undefined;

      await whatsappMessageAuditService.storeOutbound({
        conversationId: message.conversationId,
        whatsappMessageId: providerMessageId,
        message: payload,
        status: 'sent',
        engine: contextEngine,
      });

      if (conversation?.businessId) {
        await prisma.whatsAppChannel.updateMany({
          where: { businessId: conversation.businessId },
          data: { lastOutboundAt: new Date() },
        });
      }
    } catch (error) {
      await this.retryOutboundMessage(message, payload, error);
    }
  }

  private async retryInboundEvent(event: InboundEventRow, error: unknown): Promise<void> {
    const serialized = this.serializeError(error);
    const failed = event.attempts >= MAX_ATTEMPTS;

    await prisma.whatsAppInboundEvent.update({
      where: { id: event.id },
      data: {
        status: failed ? 'FAILED' : 'PENDING',
        lockedAt: null,
        lockedBy: null,
        nextAttemptAt: failed ? null : this.nextAttemptAt(event.attempts),
        error: serialized,
      },
    });

    logger.warn({
      eventId: event.id,
      attempts: event.attempts,
      failed,
      error: serialized,
    }, 'WhatsApp inbound event processing failed');
  }

  private async retryOutboundMessage(
    message: OutboundMessageRow,
    payload: InteractiveMessage,
    error: unknown
  ): Promise<void> {
    const serialized = this.serializeError(error);
    const failed = message.attempts >= MAX_ATTEMPTS;

    await prisma.whatsAppOutboundMessage.update({
      where: { id: message.id },
      data: {
        status: failed ? 'FAILED' : 'PENDING',
        lockedAt: null,
        lockedBy: null,
        nextAttemptAt: failed ? null : this.nextAttemptAt(message.attempts),
        error: serialized,
      },
    });

    if (failed) {
      // Fetch engine marker from conversation contextData for parity verification (Req 11.5)
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { id: message.conversationId },
        select: { contextData: true },
      });
      const contextEngine = (conversation?.contextData as Record<string, unknown>)?.__engine as
        | 'flow'
        | 'legacy'
        | undefined;

      await whatsappMessageAuditService.storeOutbound({
        conversationId: message.conversationId,
        message: payload,
        status: 'failed',
        error,
        engine: contextEngine,
      });
    }

    logger.warn({
      outboundMessageId: message.id,
      toPhone: message.toPhone,
      phoneNumberId: message.phoneNumberId,
      attempts: message.attempts,
      failed,
      error: serialized,
    }, 'WhatsApp outbound message send failed');
  }

  private async acquireProcessingLock(lockKey: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ lockKey: string }>>`
      INSERT INTO "WhatsAppProcessingLock" ("lockKey", "lockedAt", "lockedBy", "createdAt", "updatedAt")
      VALUES (${lockKey}, NOW(), ${this.workerId}, NOW(), NOW())
      ON CONFLICT ("lockKey") DO UPDATE
      SET "lockedAt" = EXCLUDED."lockedAt",
          "lockedBy" = EXCLUDED."lockedBy",
          "updatedAt" = NOW()
      WHERE "WhatsAppProcessingLock"."lockedAt" < ${new Date(Date.now() - LOCK_STALE_MS)}
      RETURNING "lockKey"
    `;

    return rows.length > 0;
  }

  private async releaseProcessingLock(lockKey: string): Promise<void> {
    await prisma.whatsAppProcessingLock.deleteMany({
      where: {
        lockKey,
        lockedBy: this.workerId,
      },
    });
  }

  private nextAttemptAt(attempts: number): Date {
    const backoffSeconds = [10, 30, 120, 600, 1800][Math.max(0, attempts - 1)] || 1800;
    return new Date(Date.now() + backoffSeconds * 1000);
  }

  private serializeError(error: unknown): string {
    if (error instanceof Error) {
      // Include meta/cause if available (e.g. BusinessRuleError with Meta API response)
      const base = error.message;
      const meta = (error as any).meta;
      if (meta && Array.isArray(meta) && meta.length > 0) {
        return `${base} | meta: ${meta[0]}`;
      }
      if (error.cause) {
        return `${base} | cause: ${String(error.cause)}`;
      }
      return base;
    }
    return String(error);
  }
}

export const whatsappDbWorkerService = new WhatsAppDbWorkerService();
