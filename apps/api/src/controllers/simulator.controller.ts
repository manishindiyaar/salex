/**
 * Simulator Controller
 * 
 * Handles WhatsApp simulator endpoints for development testing.
 * These endpoints allow the WhatsApp Mock UI to:
 * - Send customer messages
 * - Poll for bot responses
 * - Search for businesses by routing code
 * - Debug conversation state
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { conversationService } from '../services/conversation.service';
import { simulatorMessageService } from '../services/simulator-message.service';
import { webhookEnhancerService, WhatsAppWebhookPayload } from '../services/webhook-enhancer.service';
import { businessService } from '../services/business.service';
import { logger } from '../utils/logger';

// Request schemas
const sendMessageSchema = z.object({
  customerPhone: z.string().min(1),
  businessPhone: z.string().min(1),
  message: z.string().min(1),
  messageType: z.enum(['text', 'interactive']).default('text'),
  customerName: z.string().optional(),
});

const sendInteractiveSchema = z.object({
  customerPhone: z.string().min(1),
  businessPhone: z.string().min(1),
  interactiveType: z.enum(['button_reply', 'list_reply']),
  replyId: z.string().min(1),
  replyTitle: z.string().min(1),
  replyDescription: z.string().optional(),
  customerName: z.string().optional(),
});

const pollMessagesSchema = z.object({
  customerPhone: z.string().min(1),
  since: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

class SimulatorController {
  /**
   * POST /api/v1/whatsapp-simulator/send
   * Send a customer message through the simulator
   */
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = sendMessageSchema.parse(req.body);

      logger.info({ 
        customerPhone: data.customerPhone,
        messageType: data.messageType 
      }, 'Simulator: Processing customer message');

      // Process through conversation service
      const response = await conversationService.processMessage(
        data.customerPhone,
        data.message
      );

      // Store the bot response for polling
      await simulatorMessageService.storeOutgoingMessage(
        data.customerPhone,
        data.businessPhone,
        response.message
      );

      res.json({
        success: true,
        data: {
          messageId: `sim_${Date.now()}`,
          conversationId: response.conversationId,
          state: response.state,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/whatsapp-simulator/send-interactive
   * Send an interactive reply (button/list selection)
   */
  async sendInteractive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = sendInteractiveSchema.parse(req.body);

      logger.info({ 
        customerPhone: data.customerPhone,
        interactiveType: data.interactiveType,
        replyId: data.replyId 
      }, 'Simulator: Processing interactive reply');

      // Process through conversation service with interactive reply
      const response = await conversationService.processMessage(
        data.customerPhone,
        data.replyTitle, // Use title as fallback text
        {
          type: data.interactiveType,
          id: data.replyId,
          title: data.replyTitle,
        }
      );

      // Store the bot response for polling
      await simulatorMessageService.storeOutgoingMessage(
        data.customerPhone,
        data.businessPhone,
        response.message
      );

      res.json({
        success: true,
        data: {
          messageId: `sim_${Date.now()}`,
          conversationId: response.conversationId,
          state: response.state,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/whatsapp-simulator/poll
   * Poll for bot responses
   */
  async pollMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerPhone, since, limit } = pollMessagesSchema.parse(req.query);

      // Default to 5 seconds ago if no since provided
      const sinceDate = since 
        ? new Date(since) 
        : new Date(Date.now() - 5000);

      const messages = await simulatorMessageService.getMessagesSince(
        customerPhone,
        sinceDate,
        limit
      );

      res.json({
        success: true,
        data: messages.map(m => ({
          id: m.messageId,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
          delivered: m.delivered,
        })),
        meta: {
          count: messages.length,
          since: sinceDate.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/whatsapp-simulator/businesses/search/:code
   * Search for a business by routing code
   */
  async searchBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;

      // Normalize code (remove S prefix if present)
      const routingCode = code.replace(/^[sS]/, '');

      const business = await businessService.getByRoutingCode(routingCode);

      if (!business) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Business with routing code ${routingCode} not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          businessId: business.id,
          name: business.name,
          routingCode: business.routingCode,
          phoneNumber: business.phoneNumber,
          isAcceptingOrders: business.isAcceptingOrders,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/whatsapp-simulator/conversations/:customerPhone
   * Get conversation state for debugging
   */
  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerPhone } = req.params;

      const conversation = await conversationService.getByCustomerPhone(customerPhone);

      if (!conversation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No conversation found for this phone number',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: conversation.id,
          customerPhone: conversation.customerPhone,
          businessId: conversation.businessId,
          businessName: conversation.business?.name,
          state: conversation.state,
          contextData: conversation.contextData,
          lastMessageAt: conversation.lastMessageAt,
          createdAt: conversation.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/whatsapp-simulator/conversations/:customerPhone/messages
   * Get all messages for a conversation (debugging)
   */
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerPhone } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const messages = await simulatorMessageService.getAllMessages(customerPhone, limit);

      res.json({
        success: true,
        data: messages.map(m => ({
          id: m.messageId,
          from: m.fromPhone,
          to: m.toPhone,
          type: m.messageType,
          content: m.content,
          isFromCustomer: m.isFromCustomer,
          timestamp: m.timestamp.toISOString(),
        })),
        meta: {
          count: messages.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/whatsapp-simulator/conversations/:customerPhone
   * Clear conversation and messages (reset)
   */
  async clearConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerPhone } = req.params;

      await simulatorMessageService.clearMessages(customerPhone);

      res.json({
        success: true,
        message: 'Conversation cleared',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/whatsapp-simulator/health
   * Simulator health check
   */
  async health(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        mode: 'simulator',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * POST /simulate-webhooks/whatsapp
   * Legacy endpoint for WhatsApp Mock UI compatibility
   * Accepts raw WhatsApp Cloud API format webhooks
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body as WhatsAppWebhookPayload;

      // Validate payload structure
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

      // Parse the webhook payload
      const parsed = webhookEnhancerService.parseWebhookPayload(payload);

      if (!parsed) {
        res.status(400).json({
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: 'Could not parse webhook payload',
          },
        });
        return;
      }

      logger.info({ 
        customerPhone: parsed.customerPhone,
        messageType: parsed.messageType,
        messageId: parsed.messageId 
      }, 'Simulator: Processing webhook');

      // Process through conversation service
      const response = await conversationService.processMessage(
        parsed.customerPhone,
        parsed.messageText || parsed.interactiveReply?.title || '',
        parsed.interactiveReply
      );

      // Store the bot response for polling
      await simulatorMessageService.storeOutgoingMessage(
        parsed.customerPhone,
        parsed.businessPhone,
        response.message
      );

      // Return 200 OK (WhatsApp expects this)
      res.status(200).json({
        success: true,
        messageId: parsed.messageId,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const simulatorController = new SimulatorController();
