import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Logger, 
  HttpStatus, 
  HttpException, 
  Param,
  Headers,
  Inject
} from '@nestjs/common';
import { MockResponseService } from './mock-response.service';
import { WebhookEnhancerService } from './webhook-enhancer.service';
import { SimulatorMessageStoreService } from './services/simulator-message-store.service';
import { PrismaService } from '../../core/prisma.service';
import { 
  WhatsAppOutgoingMessage, 
  MockResponseQuery, 
  MockResponsesResponse,
  WhatsAppWebhookPayload,
  ApiResponse 
} from 'shared-types';

@Controller('api/v1/whatsapp-simulator')
export class SimulatorController {
  private readonly logger = new Logger(SimulatorController.name);

  constructor(
    private readonly mockResponseService: MockResponseService,
    private readonly webhookEnhancerService: WebhookEnhancerService,
    private readonly messageStore: SimulatorMessageStoreService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Poll for new messages - Main endpoint for UI message retrieval
   */
  @Get('poll')
  async pollMessages(
    @Query('customerPhone') customerPhone: string,
    @Query('since') since?: string,
    @Query('limit') limit?: string
  ): Promise<MockResponsesResponse> {
    if (!customerPhone) {
      throw new HttpException('customerPhone is required', HttpStatus.BAD_REQUEST);
    }

    try {
      // Get messages from the message store
      const sinceDate = since ? new Date(parseInt(since)) : undefined;
      const storedMessages = this.messageStore.getMessagesSince(customerPhone, sinceDate);
      
      // Convert to the expected format
      const mockData = storedMessages
        .filter(msg => msg.type === 'sent') // Only return business responses
        .slice(0, limit ? parseInt(limit) : 20)
        .map(msg => ({
          id: msg.id,
          conversationId: 'sim_' + customerPhone,
          messageType: this.determineMessageType(msg.content),
          content: msg.content,
          timestamp: msg.timestamp,
          delivered: true
        }));

      this.logger.debug(`Polled ${mockData.length} messages for ${customerPhone}`);
      
      return {
        success: true,
        data: mockData,
        hasMore: false
      };
    } catch (error) {
      this.logger.error(`Error polling messages for ${customerPhone}:`, error.message);
      throw new HttpException('Failed to poll messages', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Send message to webhook - Primary message sending endpoint
   */
  @Post('send')
  async sendMessage(
    @Body() body: { 
      customerPhone: string; 
      businessPhone: string;
      message: string; 
      messageType?: string;
    },
    @Headers() headers: Record<string, string>
  ) {
    try {
      // Add simulator headers
      headers['x-simulator-mode'] = 'true';

      // Create webhook payload
      const webhookPayload = this.webhookEnhancerService.createSimulatorWebhookPayload(
        body.customerPhone,
        body.businessPhone,
        body.message,
        body.messageType || 'text'
      );

      // Process the incoming message for storage
      await this.webhookEnhancerService.processIncomingMessage(webhookPayload);

      this.logger.debug(`Sent message from ${body.customerPhone} to ${body.businessPhone}: "${body.message}"`);

      return {
        success: true,
        messageId: webhookPayload.entry[0].changes[0].value.messages?.[0].id,
        message: 'Message sent to webhook successfully'
      };
    } catch (error) {
      this.logger.error('Error sending message:', error.message);
      throw new HttpException('Failed to send message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create webhook payload - Helper for UI to format messages correctly
   */
  @Post('create-webhook-payload')
  async createWebhookPayload(@Body() body: {
    customerPhone: string;
    businessPhone: string;
    message: string;
    messageType?: string;
  }): Promise<ApiResponse<WhatsAppWebhookPayload>> {
    try {
      const payload = this.webhookEnhancerService.createSimulatorWebhookPayload(
        body.customerPhone,
        body.businessPhone,
        body.message,
        body.messageType || 'text'
      );

      return {
        success: true,
        data: payload,
        message: 'Webhook payload created successfully'
      };
    } catch (error) {
      this.logger.error('Error creating webhook payload:', error.message);
      throw new HttpException('Failed to create webhook payload', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Find business by routing code - Integrates with Story 1.8
   */
  @Get('businesses/search/:code')
  async findBusinessByCode(@Param('code') code: string) {
    try {
      // Clean the routing code (remove S prefix if present)
      const cleanCode = code.replace(/^[sS]/, '');
      
      const business = await this.prisma.business.findFirst({
        where: {
          routingCode: cleanCode,
          businessType: 'SALON'
        },
        select: {
          id: true,
          name: true,
          routingCode: true,
          phoneNumber: true,
          address: true,
          hoursOfOperation: true
        }
      });

      if (!business) {
        throw new HttpException(`Business with code ${code} not found`, HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: {
          businessId: business.id,
          name: business.name,
          routingCode: business.routingCode,
          phoneNumber: business.phoneNumber,
          address: business.address,
          hoursOfOperation: business.hoursOfOperation
        }
      };
    } catch (error) {
      this.logger.error(`Error finding business ${code}:`, error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to search business', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get conversation details for debugging
   */
  @Get('conversations/:customerPhone')
  async getConversation(
    @Param('customerPhone') customerPhone: string,
    @Query('businessId') businessId?: string
  ) {
    try {
      const conversation = await this.prisma.whatsAppConversation.findFirst({
        where: {
          customerPhone,
          ...(businessId && { businessId }),
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              routingCode: true,
            }
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50
          }
        }
      });

      if (!conversation) {
        return {
          success: true,
          data: null,
          message: 'No conversation found'
        };
      }

      return {
        success: true,
        data: {
          id: conversation.id,
          customerPhone: conversation.customerPhone,
          business: conversation.business,
          state: conversation.state,
          context: conversation.context,
          lastMessageAt: conversation.lastMessageAt,
          expiresAt: conversation.expiresAt,
          messageCount: conversation.messages.length,
          messages: conversation.messages.map(msg => ({
            id: msg.id,
            direction: msg.direction,
            messageType: msg.messageType,
            content: msg.content,
            status: msg.status,
            createdAt: msg.createdAt
          }))
        }
      };
    } catch (error) {
      this.logger.error(`Error getting conversation for ${customerPhone}:`, error.message);
      throw new HttpException('Failed to get conversation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Store response from webhook - Called by webhook when sending responses
   */
  @Post('store-response')
  async storeResponse(@Body() body: {
    customerPhone: string;
    businessId: string;
    responseMessage: WhatsAppOutgoingMessage;
  }) {
    try {
      await this.webhookEnhancerService.storeOutgoingResponse(
        body.customerPhone,
        body.businessId,
        body.responseMessage
      );

      return {
        success: true,
        message: 'Response stored successfully'
      };
    } catch (error) {
      this.logger.error('Error storing response:', error.message);
      throw new HttpException('Failed to store response', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Test webhook format - Debug endpoint
   */
  @Post('test-webhook')
  async testWebhook(@Body() webhook: WhatsAppWebhookPayload) {
    try {
      this.logger.debug('Testing webhook format:', JSON.stringify(webhook, null, 2));
      
      const entry = webhook.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];

      return {
        success: true,
        message: 'Webhook payload format is valid',
        data: {
          entryCount: webhook.entry?.length || 0,
          hasMessages: !!message,
          messageFrom: message?.from,
          messageText: message?.text?.body,
          messageType: message?.type,
          businessPhone: change?.value?.metadata?.display_phone_number
        }
      };
    } catch (error) {
      this.logger.error('Error testing webhook:', error.message);
      throw new HttpException('Invalid webhook format', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Health check for simulator
   */
  @Get('health')
  async healthCheck() {
    try {
      const configValidation = this.webhookEnhancerService.validateSimulatorConfig();
      
      // Get some basic stats
      const activeConversations = await this.prisma.whatsAppConversation.count({
        where: {
          expiresAt: {
            gt: new Date()
          }
        }
      });

      return {
        success: true,
        data: {
          status: 'healthy',
          mode: this.webhookEnhancerService.isSimulatorMode() ? 'simulator' : 'production',
          activeConversations,
          configValid: configValidation.valid,
          configErrors: configValidation.errors,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Health check failed:', error.message);
      throw new HttpException('Simulator unhealthy', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * Cleanup expired conversations
   */
  @Post('cleanup')
  async cleanup() {
    try {
      const cleanedCount = await this.mockResponseService.cleanupExpiredConversations();
      
      return {
        success: true,
        data: {
          cleanedConversations: cleanedCount
        },
        message: `Cleaned up ${cleanedCount} expired conversations`
      };
    } catch (error) {
      this.logger.error('Cleanup failed:', error.message);
      throw new HttpException('Cleanup failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Helper method for message type determination
  private determineMessageType(content: any): string {
    if (content?.interactive?.type === 'button') {
      return 'interactive_button';
    }
    if (content?.interactive?.type === 'list') {
      return 'interactive_list';
    }
    if (content?.text) {
      return 'text';
    }
    return 'text';
  }
}