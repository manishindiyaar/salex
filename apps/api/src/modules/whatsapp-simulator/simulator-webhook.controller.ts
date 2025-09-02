import {
  Controller,
  Post,
  Body,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { BookingFlowService } from './services/booking-flow.service';
import { CustomerSessionService } from '../customer/customer-session.service';
import { SimulatorMessageStoreService } from './services/simulator-message-store.service';
import { 
  WhatsAppWebhookPayload,
  WhatsAppIncomingMessage,
  WhatsAppOutgoingMessage
} from 'shared-types';

@Controller('simulate-webhooks')
export class SimulatorWebhookController {
  private readonly logger = new Logger(SimulatorWebhookController.name);

  constructor(
    private readonly bookingFlowService: BookingFlowService,
    private readonly customerSessionService: CustomerSessionService,
    private readonly messageStore: SimulatorMessageStoreService,
  ) {}

  /**
   * WhatsApp Webhook Simulator - Processes incoming messages and generates responses
   */
  @Post('whatsapp')
  async processWhatsAppWebhook(
    @Body() payload: WhatsAppWebhookPayload,
  ): Promise<{ success: boolean; responses?: WhatsAppOutgoingMessage[] }> {
    this.logger.debug('Processing WhatsApp webhook payload', payload);

    try {
      const responses: WhatsAppOutgoingMessage[] = [];

      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value.messages) {
            for (const message of change.value.messages) {
              const customerPhone = message.from;
              
              // Process each message and get responses
              const messageResponses = await this.processIncomingMessage(message, customerPhone);
              
              // Store the responses for polling
              for (const response of messageResponses) {
                await this.storeResponseMessage(customerPhone, response);
              }
              
              responses.push(...messageResponses);
            }
          }
        }
      }

      this.logger.debug(`Generated ${responses.length} responses`);
      
      return {
        success: true,
        responses: responses
      };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`, error.stack);
      throw new HttpException(
        `Webhook processing failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async processIncomingMessage(
    message: WhatsAppIncomingMessage,
    customerPhone: string
  ): Promise<WhatsAppOutgoingMessage[]> {
    this.logger.debug(`Processing message from ${customerPhone}:`, message);

    try {
      // Get current session state
      const session = await this.getOrCreateCustomerSession(customerPhone);
      const currentState = session.sessionData as any;

      let responses: WhatsAppOutgoingMessage[] = [];

      if (message.type === 'text' && message.text?.body) {
        // Handle text messages
        responses = await this.bookingFlowService.processBookingMessage(
          customerPhone,
          message.text.body,
          undefined,
          currentState
        );
      } else if (message.type === 'interactive' && message.interactive) {
        // Handle interactive responses (button clicks, list selections)
        responses = await this.bookingFlowService.processBookingMessage(
          customerPhone,
          '',
          message.interactive,
          currentState
        );
      }

      // Set the recipient phone number for all responses
      responses.forEach(response => {
        response.to = customerPhone;
      });

      return responses;
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`, error.stack);
      
      // Return error message to user
      return [{
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: customerPhone,
        type: "text",
        text: {
          body: "❌ Something went wrong. Please try again later."
        }
      }];
    }
  }

  private async getOrCreateCustomerSession(customerPhone: string) {
    try {
      // Authenticate customer (creates session if doesn't exist)
      const authResponse = await this.customerSessionService.authenticateCustomer({
        phoneNumber: customerPhone
      });
      
      // Get the full session details
      const session = await this.customerSessionService.getSession(authResponse.sessionId);
      
      // If sessionData is null, initialize with GREETING state
      if (!session.sessionData) {
        await this.customerSessionService.updateSessionState(
          session.id,
          'GREETING' as any,
          { step: 'GREETING' }
        );
        session.sessionData = { step: 'GREETING' };
      }

      return session;
    } catch (error) {
      this.logger.error(`Error getting/creating session: ${error.message}`);
      throw error;
    }
  }

  private async storeResponseMessage(
    customerPhone: string,
    response: WhatsAppOutgoingMessage
  ): Promise<void> {
    try {
      // Convert WhatsApp response to mock response format
      const mockResponse = {
        id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId: `conv_${customerPhone}`,
        messageType: response.type,
        content: response,
        timestamp: new Date(),
        delivered: false
      };

      // Store using the same method that polling expects
      this.messageStore.storeMessage(customerPhone, response, 'sent');
    } catch (error) {
      this.logger.error(`Error storing response message: ${error.message}`);
      // Don't throw here as it's not critical for the main flow
    }
  }
}