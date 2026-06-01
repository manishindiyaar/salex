import { Request, Response, NextFunction } from 'express';
import { getConfig, isProduction } from '../config';
import { webhookEnhancerService, WhatsAppWebhookPayload } from '../services/webhook-enhancer.service';
import { prisma } from '@salex/shared-types';
import { whatsappSignatureService } from '../services/whatsapp-signature.service';
import { whatsappInboundEventService } from '../services/whatsapp-inbound-event.service';
import { whatsappChannelService } from '../services/whatsapp-channel.service';
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

      // Determine if this is a dedicated channel to use per-business appSecret
      let appSecretForVerification = config.whatsappAppSecret;
      let businessId: string | undefined;

      if (parsed?.phoneNumberId) {
        const channel = await prisma.whatsAppChannel.findUnique({
          where: { phoneNumberId: parsed.phoneNumberId },
        });

        if (channel?.businessId && channel.mode === 'DEDICATED' && channel.status === 'CONNECTED') {
          businessId = channel.businessId;

          // Try to get per-business appSecret for signature verification
          try {
            const creds = await whatsappChannelService.getCredentials(channel.businessId);
            if (creds?.appSecret) {
              appSecretForVerification = creds.appSecret;
            }
          } catch (err) {
            logger.warn(
              { businessId: channel.businessId, error: err },
              'Failed to get per-business appSecret for signature verification; using platform secret'
            );
          }
        }
      }

      // Signature verification
      if (isProduction() || appSecretForVerification) {
        const signature = req.headers['x-hub-signature-256'];
        const signatureHeader = Array.isArray(signature) ? signature[0] : signature;
        const isValidSignature = whatsappSignatureService.verify(
          req.rawBody,
          signatureHeader,
          appSecretForVerification
        );

        if (!isValidSignature) {
          logger.warn({ hasSignature: Boolean(signatureHeader) }, 'Rejected WhatsApp webhook with invalid signature');
          res.sendStatus(401);
          return;
        }
      }

      if (!parsed) {
        logger.info('Ignoring WhatsApp status-only webhook');
        res.sendStatus(200);
        return;
      }

      logger.info({
        customerPhone: parsed.customerPhone,
        messageType: parsed.messageType,
        messageId: parsed.messageId,
      }, 'Storing WhatsApp webhook message');

      // If we haven't resolved businessId yet (non-dedicated or no phoneNumberId match)
      if (!businessId && parsed.phoneNumberId) {
        const channel = await prisma.whatsAppChannel.findUnique({
          where: { phoneNumberId: parsed.phoneNumberId },
        });
        if (channel?.businessId && channel.mode === 'DEDICATED') {
          businessId = channel.businessId;
          await prisma.whatsAppChannel.update({
            where: { id: channel.id },
            data: { lastInboundAt: new Date() },
          });
        } else {
          logger.warn(
            { phoneNumberId: parsed.phoneNumberId },
            'Inbound phone_number_id did not match any registered DEDICATED WhatsAppChannel; routing to shared-number path'
          );
        }
      } else if (businessId) {
        // Update lastInboundAt for the dedicated channel
        await prisma.whatsAppChannel.updateMany({
          where: { businessId, mode: 'DEDICATED' },
          data: { lastInboundAt: new Date() },
        });
      }

      await whatsappInboundEventService.store({
        parsed,
        payload,
        businessId,
      });

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }
}

export const whatsappWebhookController = new WhatsAppWebhookController();
