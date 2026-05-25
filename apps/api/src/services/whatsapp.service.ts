import type { InteractiveMessage } from './conversation.service';
import { getConfig } from '../config';
import { BusinessRuleError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface MetaSendMessageResponse {
  messaging_product: 'whatsapp';
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string; message_status?: string }>;
}

export type MetaWhatsAppPayload = {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text' | 'interactive';
  text?: {
    preview_url?: boolean;
    body: string;
  };
  interactive?: {
    type: 'button' | 'list';
    header?: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: { id: string; title: string };
      }>;
      button?: string;
      sections?: Array<{
        title?: string;
        rows: Array<{ id: string; title: string; description?: string }>;
      }>;
    };
  };
};

class WhatsAppService {
  toMetaPayload(to: string, message: InteractiveMessage): MetaWhatsAppPayload {
    const recipient = this.normalizeRecipient(to);

    if (message.type === 'text') {
      return {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          preview_url: false,
          body: message.body.text,
        },
      };
    }

    if (message.type === 'button') {
      const buttons = (message.action?.buttons || []).slice(0, 3);

      return {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'interactive',
        interactive: {
          type: 'button',
          ...(message.header ? { header: message.header } : {}),
          body: message.body,
          ...(message.footer ? { footer: message.footer } : {}),
          action: {
            buttons,
          },
        },
      };
    }

    const rows = (message.action?.sections || [])
      .flatMap(section =>
        section.rows.map(row => ({
          sectionTitle: section.title,
          row,
        }))
      )
      .slice(0, 10);

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'interactive',
      interactive: {
        type: 'list',
        ...(message.header ? { header: message.header } : {}),
        body: message.body,
        ...(message.footer ? { footer: message.footer } : {}),
        action: {
          button: message.action?.button || 'Choose',
          sections: [
            {
              title: rows[0]?.sectionTitle,
              rows: rows.map(({ row }) => row),
            },
          ],
        },
      },
    };
  }

  async sendMessage(
    to: string,
    message: InteractiveMessage,
    options?: { phoneNumberId?: string }
  ): Promise<MetaSendMessageResponse> {
    const config = getConfig();
    const phoneNumberId = options?.phoneNumberId || config.whatsappPhoneNumberId;

    if (!config.whatsappAccessToken || !phoneNumberId) {
      throw new BusinessRuleError('WhatsApp API is not configured');
    }

    const payload = this.toMetaPayload(to, message);
    const url = `https://graph.facebook.com/${config.whatsappGraphApiVersion}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseBody: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      logger.error({ status: response.status, responseBody }, 'WhatsApp send failed');
      throw new BusinessRuleError('Failed to send WhatsApp message', {
        meta: [JSON.stringify(responseBody)],
      });
    }

    logger.info({
      to: payload.to,
      type: payload.type,
      phoneNumberId,
      messageId: responseBody.messages?.[0]?.id,
    }, 'WhatsApp message sent');

    return responseBody as MetaSendMessageResponse;
  }

  private normalizeRecipient(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }
}

export const whatsappService = new WhatsAppService();
