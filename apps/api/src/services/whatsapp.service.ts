import type { InteractiveMessage } from './conversation.service';
import { getConfig } from '../config';
import { BusinessRuleError } from '../utils/errors';
import { logger } from '../utils/logger';
import { tokenCacheService } from './token-cache.service';
import { whatsappChannelService } from './whatsapp-channel.service';

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
    options?: { phoneNumberId?: string; businessId?: string }
  ): Promise<MetaSendMessageResponse> {
    const config = getConfig();
    let accessToken = config.whatsappAccessToken;
    let phoneNumberId = options?.phoneNumberId || config.whatsappPhoneNumberId;

    // Per-business dedicated channel credentials
    if (options?.businessId) {
      try {
        // Check token cache first
        const cached = tokenCacheService.get(options.businessId);
        if (cached) {
          accessToken = cached.accessToken;
          phoneNumberId = cached.phoneNumberId;
        } else {
          // Cache miss — decrypt from DB
          const creds = await whatsappChannelService.getCredentials(options.businessId);
          if (creds) {
            accessToken = creds.accessToken;
            phoneNumberId = creds.phoneNumberId;
            tokenCacheService.set(options.businessId, {
              accessToken: creds.accessToken,
              phoneNumberId: creds.phoneNumberId,
            });
          } else {
            logger.warn(
              { businessId: options.businessId },
              'No dedicated channel credentials found; falling back to shared platform credentials'
            );
          }
        }
      } catch (err) {
        logger.warn(
          { businessId: options.businessId, error: err },
          'Failed to resolve per-business credentials; falling back to shared platform credentials'
        );
      }
    }

    if (!accessToken || !phoneNumberId) {
      throw new BusinessRuleError('WhatsApp API is not configured');
    }

    const payload = this.toMetaPayload(to, message);
    const url = `https://graph.facebook.com/${config.whatsappGraphApiVersion}/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
