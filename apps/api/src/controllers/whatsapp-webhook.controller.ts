import { Request, Response, NextFunction } from 'express';
import { getConfig, isProduction } from '../config';
import { conversationService } from '../services/conversation.service';
import { webhookEnhancerService, WhatsAppWebhookPayload } from '../services/webhook-enhancer.service';
import { prisma } from '@salex/shared-types';
import { whatsappMessageAuditService } from '../services/whatsapp-message-audit.service';
import { whatsappService } from '../services/whatsapp.service';
import { whatsappSignatureService } from '../services/whatsapp-signature.service';
import { logger } from '../utils/logger';

class WhatsAppWebhookController {
  /**
   * Meta webhook ownership verification.
   */
  verify(req: Request, res: Response): void {
    const config = getConfig();
    const mode = req.query['hub.mode'];
    const verifyToken = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && verifyToken === config.whatsappVerifyToken && typeof challenge === 'string') {
      logger.info('WhatsApp webhook verified');
      res.status(200).send(challenge);
      return;
    }

    logger.warn({ mode, verifyTokenMatched: verifyToken === config.whatsappVerifyToken }, 'WhatsApp webhook verification failed');
    res.sendStatus(403);
  }

  /**
   * Production webhook endpoint for inbound customer messages and status receipts.
   */
  async receive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = getConfig();

      if (isProduction() || config.whatsappAppSecret) {
        const signature = req.headers['x-hub-signature-256'];
        const signatureHeader = Array.isArray(signature) ? signature[0] : signature;
        const isValidSignature = whatsappSignatureService.verify(
          req.rawBody,
          signatureHeader,
          config.whatsappAppSecret
        );

        if (!isValidSignature) {
          logger.warn({ hasSignature: Boolean(signatureHeader) }, 'Rejected WhatsApp webhook with invalid signature');
          res.sendStatus(403);
          return;
        }
      }

      const payload = req.body as WhatsAppWebhookPayload;

      if (!webhookEnhancerService.isValidWebhookPayload(payload)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'Invalid WhatsApp webhook payload format',
          },
        });
        return;
      }

      const parsed = webhookEnhancerService.parseWebhookPayload(payload);

      if (!parsed) {
        logger.info('Ignoring WhatsApp status-only webhook');
        res.sendStatus(200);
        return;
      }

      logger.info({
        customerPhone: parsed.customerPhone,
        messageType: parsed.messageType,
        messageId: parsed.messageId,
      }, 'Processing WhatsApp webhook message');

      if (await whatsappMessageAuditService.hasMessage(parsed.messageId)) {
        logger.info({ messageId: parsed.messageId }, 'Ignoring duplicate WhatsApp webhook message');
        res.sendStatus(200);
        return;
      }

      // Find associated business by WhatsApp channel
      let businessId: string | undefined;
      let outboundPhoneNumberId = parsed.phoneNumberId;
      if (parsed.phoneNumberId) {
        const channel = await prisma.whatsAppChannel.findUnique({
          where: { phoneNumberId: parsed.phoneNumberId },
        });
        if (channel?.businessId) {
          businessId = channel.businessId;
          outboundPhoneNumberId = channel.phoneNumberId;
          await prisma.whatsAppChannel.update({
            where: { id: channel.id },
            data: { lastInboundAt: new Date() },
          });
        }
      }

      const response = await conversationService.processMessage(
        parsed.customerPhone,
        parsed.messageText || parsed.interactiveReply?.title || '',
        parsed.interactiveReply,
        businessId
      );

      await whatsappMessageAuditService.storeInbound({
        conversationId: response.conversationId,
        whatsappMessageId: parsed.messageId,
        messageType: parsed.messageType,
        content: {
          parsed,
          payload,
        },
      });

      try {
        const sendResult = await whatsappService.sendMessage(parsed.customerPhone, response.message, {
          phoneNumberId: outboundPhoneNumberId,
        });

        await whatsappMessageAuditService.storeOutbound({
          conversationId: response.conversationId,
          whatsappMessageId: sendResult.messages?.[0]?.id,
          message: response.message,
          status: 'sent',
        });

        if (businessId) {
          await prisma.whatsAppChannel.updateMany({
            where: { businessId },
            data: { lastOutboundAt: new Date() },
          });
        }
      } catch (error) {
        await whatsappMessageAuditService.storeOutbound({
          conversationId: response.conversationId,
          message: response.message,
          status: 'failed',
          error,
        });
        logger.error({ error, conversationId: response.conversationId }, 'Failed to send WhatsApp response');
      }

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }
}

export const whatsappWebhookController = new WhatsAppWebhookController();
