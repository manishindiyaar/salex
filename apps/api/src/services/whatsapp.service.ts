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
      const errorDetail = responseBody?.error?.message || responseBody?.error?.error_user_msg || JSON.stringify(responseBody);
      logger.error({
        status: response.status,
        responseBody,
        to: this.normalizeRecipient(to),
        phoneNumberId,
      }, 'WhatsApp send failed');
      throw new BusinessRuleError(
        `WhatsApp send failed [${response.status}]: ${errorDetail}`,
        { meta: [JSON.stringify(responseBody)] },
      );
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

  /**
   * Build a Meta WhatsApp Flow CTA message payload.
   * Sends an interactive message with a Flow button that opens
   * the specified Meta WhatsApp Flow.
   *
   * Used for the shared-number business selection Flow.
   * Falls back gracefully if Flow config is not set.
   */
  buildFlowCtaPayload(
    to: string,
    options: {
      flowId: string;
      flowToken: string;
      flowMode?: 'draft' | 'published';
      headerText?: string;
      bodyText: string;
      footerText?: string;
      ctaText: string;
    }
  ): Record<string, unknown> {
    const recipient = this.normalizeRecipient(to);
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'interactive',
      interactive: {
        type: 'flow',
        header: options.headerText ? { type: 'text', text: options.headerText } : undefined,
        body: { text: options.bodyText },
        footer: options.footerText ? { text: options.footerText } : undefined,
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_id: options.flowId,
            flow_cta: options.ctaText,
            mode: options.flowMode || 'draft',
            flow_action: 'data_exchange',
            flow_token: options.flowToken,
          },
        },
      },
    };
  }

  /**
   * Send a raw payload (for Flow messages which don't fit InteractiveMessage type).
   */
  async sendRawPayload(
    payload: Record<string, unknown>,
    options?: { phoneNumberId?: string; businessId?: string }
  ): Promise<MetaSendMessageResponse> {
    const config = getConfig();
    let accessToken = config.whatsappAccessToken;
    let phoneNumberId = options?.phoneNumberId || config.whatsappPhoneNumberId;

    if (options?.businessId) {
      try {
        const cached = tokenCacheService.get(options.businessId);
        if (cached) {
          accessToken = cached.accessToken;
          phoneNumberId = cached.phoneNumberId;
        } else {
          const creds = await whatsappChannelService.getCredentials(options.businessId);
          if (creds) {
            accessToken = creds.accessToken;
            phoneNumberId = creds.phoneNumberId;
            tokenCacheService.set(options.businessId, {
              accessToken: creds.accessToken,
              phoneNumberId: creds.phoneNumberId,
            });
          }
        }
      } catch (err) {
        logger.warn({ businessId: options.businessId, error: err },
          'Failed to resolve per-business credentials for Flow; using platform credentials');
      }
    }

    if (!accessToken || !phoneNumberId) {
      throw new BusinessRuleError('WhatsApp API is not configured');
    }

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
      const errorDetail = responseBody?.error?.message || JSON.stringify(responseBody);
      logger.error({ status: response.status, responseBody, phoneNumberId },
        'WhatsApp Flow CTA send failed');
      throw new BusinessRuleError(`WhatsApp Flow send failed [${response.status}]: ${errorDetail}`);
    }

    logger.info({ to: payload.to, phoneNumberId, messageId: responseBody.messages?.[0]?.id },
      'WhatsApp Flow CTA sent');
    return responseBody as MetaSendMessageResponse;
  }
}

export const whatsappService = new WhatsAppService();
