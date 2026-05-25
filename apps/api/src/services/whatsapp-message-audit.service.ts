import { prisma } from '@salex/shared-types';
import type { InteractiveMessage } from './conversation.service';
import { logger } from '../utils/logger';

class WhatsAppMessageAuditService {
  async hasMessage(whatsappMessageId: string | undefined): Promise<boolean> {
    if (!whatsappMessageId) {
      return false;
    }

    const existing = await prisma.whatsAppMessage.findUnique({
      where: { whatsappMessageId },
      select: { id: true },
    });

    return Boolean(existing);
  }

  async storeInbound(input: {
    conversationId: string;
    whatsappMessageId?: string;
    messageType: string;
    content: Record<string, unknown>;
  }): Promise<void> {
    await this.safeCreate({
      conversationId: input.conversationId,
      whatsappMessageId: input.whatsappMessageId,
      direction: 'inbound',
      messageType: this.normalizeMessageType(input.messageType),
      content: input.content,
      status: 'delivered',
    });
  }

  async storeOutbound(input: {
    conversationId: string;
    whatsappMessageId?: string;
    message: InteractiveMessage;
    status?: 'sent' | 'failed';
    error?: unknown;
  }): Promise<void> {
    await this.safeCreate({
      conversationId: input.conversationId,
      whatsappMessageId: input.whatsappMessageId,
      direction: 'outbound',
      messageType: input.message.type === 'button' ? 'interactive' : input.message.type,
      content: {
        message: input.message,
        ...(input.error ? { error: this.serializeError(input.error) } : {}),
      },
      status: input.status || 'sent',
    });
  }

  private async safeCreate(data: {
    conversationId: string;
    whatsappMessageId?: string;
    direction: string;
    messageType: string;
    content: Record<string, unknown>;
    status: string;
  }): Promise<void> {
    try {
      await prisma.whatsAppMessage.create({
        data: {
          conversationId: data.conversationId,
          whatsappMessageId: data.whatsappMessageId || null,
          direction: data.direction,
          messageType: data.messageType,
          content: data.content as any,
          status: data.status,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        logger.info({ whatsappMessageId: data.whatsappMessageId }, 'WhatsApp message already audited');
        return;
      }

      logger.warn({ error, conversationId: data.conversationId }, 'Failed to audit WhatsApp message');
    }
  }

  private normalizeMessageType(type: string): string {
    if (type === 'button') {
      return 'button';
    }
    if (type === 'interactive') {
      return 'interactive';
    }
    if (type === 'template') {
      return 'template';
    }
    return 'text';
  }

  private serializeError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
      };
    }

    return { message: String(error) };
  }
}

export const whatsappMessageAuditService = new WhatsAppMessageAuditService();
