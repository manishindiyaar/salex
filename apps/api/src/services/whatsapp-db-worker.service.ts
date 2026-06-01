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
};

type OutboundMessageRow = {
  id: string;
  conversationId: string;
  toPhone: string;
  phoneNumberId: string | null;
  payload: unknown;
  attempts: number;
};

const MAX_ATTEMPTS = 5;
const LOCK_STALE_MS = 2 * 60 * 1000;

class WhatsAppDbWorkerService {
  private inboundTimer?: NodeJS.Timeout;
  private outboundTimer?: NodeJS.Timeout;
  private processingInbound = false;
  private processingOutbound = false;
  private readonly workerId = `${process.pid}-${Math.random().toString(36).slice(2)}`;

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

      const response = await engineRouter.route({
        customerPhone: event.customerPhone,
        messageText: event.messageText || event.interactiveText || '',
        interactiveReply,
        businessId: event.businessId || undefined,
        phoneNumberId: event.phoneNumberId || undefined,
      });

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
        },
      });

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

    try {
      const sendResult = await whatsappService.sendMessage(message.toPhone, payload, {
        phoneNumberId: message.phoneNumberId || undefined,
      });

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
      return error.message;
    }
    return String(error);
  }
}

export const whatsappDbWorkerService = new WhatsAppDbWorkerService();
