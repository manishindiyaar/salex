import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockResponseService } from './mock-response.service';
import {
  WhatsAppWebhookPayload,
  WhatsAppOutgoingMessage,
  WhatsAppConversation,
} from 'shared-types';

@Injectable()
export class WebhookEnhancerService {
  private readonly logger = new Logger(WebhookEnhancerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mockResponseService: MockResponseService,
  ) {}

  /**
   * Check if we're running in simulator mode
   */
  isSimulatorMode(): boolean {
    const mode = this.configService.get<string>('WHATSAPP_MODE');
    return mode === 'simulator';
  }

  /**
   * Detect simulator request from headers
   */
  detectSimulatorRequest(headers: Record<string, string>): boolean {
    return headers['x-simulator-mode'] === 'true';
  }

  /**
   * Process incoming webhook payload and store for simulator if needed
   * This is called by the existing webhook before processing
   */
  async processIncomingMessage(payload: WhatsAppWebhookPayload): Promise<void> {
    if (!this.isSimulatorMode()) {
      this.logger.debug('Not in simulator mode, skipping message storage');
      return;
    }

    try {
      // Extract message details from webhook payload
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];

      if (!message) {
        this.logger.debug('No message found in payload');
        return;
      }

      const customerPhone = message.from;
      const metadata = change.value.metadata;
      const businessPhone = metadata.display_phone_number;

      this.logger.debug(`Processing simulator message from ${customerPhone} to ${businessPhone}`);

      // Find business by phone number or use default for simulator
      const businessId = await this.findBusinessByPhone(businessPhone);
      
      if (!businessId) {
        this.logger.warn(`No business found for phone: ${businessPhone}`);
        return;
      }

      // Get or create conversation
      const conversation = await this.mockResponseService.getOrCreateConversation(
        customerPhone,
        businessId,
      );

      // Store the incoming message
      await this.mockResponseService.storeIncomingMessage(
        conversation.id,
        payload, // Store the full webhook payload
        message.type,
      );

      this.logger.debug(`Stored incoming message for conversation: ${conversation.id}`);
    } catch (error) {
      this.logger.error(`Failed to process incoming message: ${error.message}`, error.stack);
    }
  }

  /**
   * Store outgoing response for simulator polling
   * This is called after the webhook processes a message and generates a response
   */
  async storeOutgoingResponse(
    customerPhone: string,
    businessId: string,
    responseMessage: WhatsAppOutgoingMessage,
  ): Promise<void> {
    if (!this.isSimulatorMode()) {
      this.logger.debug('Not in simulator mode, skipping response storage');
      return;
    }

    try {
      // Get or create conversation
      const conversation = await this.mockResponseService.getOrCreateConversation(
        customerPhone,
        businessId,
      );

      // Store the response for polling
      await this.mockResponseService.storeResponse(conversation.id, responseMessage);

      this.logger.debug(`Stored outgoing response for conversation: ${conversation.id}`);
    } catch (error) {
      this.logger.error(`Failed to store outgoing response: ${error.message}`, error.stack);
    }
  }

  /**
   * Update conversation state
   * Called when the business logic progresses the conversation
   */
  async updateConversationState(
    customerPhone: string,
    businessId: string,
    state: string,
    context?: any,
  ): Promise<void> {
    if (!this.isSimulatorMode()) {
      return;
    }

    try {
      const conversation = await this.mockResponseService.getOrCreateConversation(
        customerPhone,
        businessId,
      );

      await this.mockResponseService.updateConversationState(
        conversation.id,
        state,
        context,
      );

      this.logger.debug(`Updated conversation state: ${conversation.id} -> ${state}`);
    } catch (error) {
      this.logger.error(`Failed to update conversation state: ${error.message}`, error.stack);
    }
  }

  /**
   * Get business routing code from message text
   */
  getBusinessRoutingCode(messageText: string): string | null {
    if (!messageText) return null;
    const match = messageText.match(/[sS](\d{4})/);
    return match ? match[0].toUpperCase() : null;
  }

  /**
   * Extract business routing code from message text
   * Integrates with Story 1.8 routing system
   */
  extractRoutingCode(messageText: string): string | null {
    // Look for 4-digit routing codes (S1234, s1234, 1234)
    const routingCodePattern = /[sS]?(\d{4})/;
    const match = messageText.match(routingCodePattern);
    
    if (match && match[1]) {
      return match[1];
    }

    return null;
  }

  /**
   * Format simulator response for WhatsApp Cloud API compatibility
   */
  formatSimulatorResponse(content: string, options: {
    businessName: string;
    businessCode: string;
    timestamp?: Date;
  }): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: '', // Will be set by caller
      type: "text",
      text: {
        body: content
      }
    };
  }

  /**
   * Create interactive response with buttons
   */
  createInteractiveResponse(previewText: string, businessCode: string): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: '', // Will be set by caller
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: previewText
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: `business_${businessCode}`,
                title: `Connect to ${businessCode}`
              }
            }
          ]
        }
      }
    };
  }

  /**
   * Create a WhatsApp Cloud API compatible webhook payload for simulation
   * Used by the UI to send messages to the webhook
   */
  createSimulatorWebhookPayload(
    customerPhone: string,
    businessPhone: string,
    messageText: string,
    messageType: string = 'text',
  ): WhatsAppWebhookPayload {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const messageId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'simulator_entry',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: businessPhone,
                  phone_number_id: 'simulator_phone_id',
                },
                messages: [
                  {
                    from: customerPhone,
                    id: messageId,
                    timestamp,
                    type: messageType as any,
                    text: messageType === 'text' ? { body: messageText } : undefined,
                    interactive: messageType === 'interactive' ? this.parseInteractiveMessage(messageText) : undefined,
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };
  }

  /**
   * Parse interactive message for button/list replies
   * Simplified implementation for simulator
   */
  private parseInteractiveMessage(messageText: string): any {
    // Simple parsing for button replies in format: "BUTTON:button_id:button_title"
    if (messageText.startsWith('BUTTON:')) {
      const parts = messageText.split(':');
      if (parts.length >= 3) {
        return {
          type: 'button_reply',
          button_reply: {
            id: parts[1],
            title: parts[2],
          },
        };
      }
    }

    // Simple parsing for list replies in format: "LIST:row_id:row_title"
    if (messageText.startsWith('LIST:')) {
      const parts = messageText.split(':');
      if (parts.length >= 3) {
        return {
          type: 'list_reply',
          list_reply: {
            id: parts[1],
            title: parts[2],
          },
        };
      }
    }

    return undefined;
  }

  /**
   * Find business by phone number
   * This is a simplified implementation - in production you'd need proper phone mapping
   */
  private async findBusinessByPhone(phoneNumber: string): Promise<string | null> {
    // For simulator, we'll use a simple mapping or default business
    // In production, this would query the database properly
    
    // For now, return a default business ID for testing
    // This should be replaced with actual database lookup
    const defaultBusinessId = this.configService.get<string>('SIMULATOR_DEFAULT_BUSINESS_ID');
    
    if (defaultBusinessId) {
      return defaultBusinessId;
    }

    this.logger.warn(`No default business ID configured for simulator mode`);
    return null;
  }

  /**
   * Validate environment configuration for simulator mode
   */
  validateSimulatorConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.isSimulatorMode()) {
      const defaultBusinessId = this.configService.get<string>('SIMULATOR_DEFAULT_BUSINESS_ID');
      if (!defaultBusinessId) {
        errors.push('SIMULATOR_DEFAULT_BUSINESS_ID is required in simulator mode');
      }

      const webhookUrl = this.configService.get<string>('WEBHOOK_BASE_URL');
      if (!webhookUrl) {
        errors.push('WEBHOOK_BASE_URL is required for simulator polling');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}