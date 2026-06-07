/**
 * @deprecated LEGACY — Only used when WHATSAPP_QUEUE_BACKEND=db.
 * With Redis/BullMQ, the webhook controller enqueues directly to BullMQ
 * instead of writing to WhatsAppInboundEvent table.
 */

import { Prisma, prisma } from '@salex/shared-types';
import type { WhatsAppWebhookPayload } from './webhook-enhancer.service';
import { logger } from '../utils/logger';

export interface ParsedWhatsAppMessage {
  customerPhone: string;
  businessPhone: string;
  messageId: string;
  messageType: string;
  messageText?: string;
  interactiveReply?: { type: string; id: string; title: string; description?: string };
  customerName?: string;
  phoneNumberId: string;
}

class WhatsAppInboundEventService {
  async store(input: {
    parsed: ParsedWhatsAppMessage;
    payload: WhatsAppWebhookPayload;
    businessId?: string;
  }): Promise<{ created: boolean; eventId?: string }> {
    try {
      const event = await prisma.whatsAppInboundEvent.create({
        data: {
          waMessageId: input.parsed.messageId,
          phoneNumberId: input.parsed.phoneNumberId,
          customerPhone: input.parsed.customerPhone,
          businessId: input.businessId || null,
          messageType: input.parsed.messageType,
          messageText: input.parsed.messageText || null,
          interactiveId: input.parsed.interactiveReply?.id || null,
          interactiveText: input.parsed.interactiveReply?.title || null,
          payload: input.payload as unknown as Prisma.InputJsonValue,
        },
        select: { id: true },
      });

      logger.info({
        eventId: event.id,
        waMessageId: input.parsed.messageId,
      }, 'WhatsApp inbound event stored');

      return { created: true, eventId: event.id };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        logger.info({ waMessageId: input.parsed.messageId }, 'Duplicate WhatsApp inbound event ignored');
        return { created: false };
      }

      throw error;
    }
  }
}

export const whatsappInboundEventService = new WhatsAppInboundEventService();
