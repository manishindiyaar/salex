import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
  HttpStatus,
  HttpException,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { CustomerSessionService } from '../customer/customer-session.service';
import { MessageRoutingService } from './message-routing.service';
import { MessageTypeRouterService } from './services/message-type-router.service';
import { BusinessResponseTransformerService } from './services/business-response-transformer.service';
import { SimulatorMessageStoreService } from './services/simulator-message-store.service';
import { BusinessService } from '../business/business.service';
import { 
  ApiResponse,
  CustomerAuthRequest,
  CustomerAuthResponse,
  SendMessageResponse,
  PollMessagesRequest,
  PollMessagesResponse,
  ParseRoutingCodeRequest,
  ParseRoutingCodeResponse,
  MessageType,
  MessageContent,
  CustomerSessionState,
  CustomerSession,
  SimulatorMessage,
  WhatsAppOutgoingMessage
} from 'shared-types';

@Controller('api/v1/whatsapp-simulator')
export class WhatsAppSimulatorController {
  private readonly logger = new Logger(WhatsAppSimulatorController.name);

  constructor(
    private readonly customerSessionService: CustomerSessionService,
    private readonly messageRoutingService: MessageRoutingService,
    private readonly messageTypeRouter: MessageTypeRouterService,
    private readonly responseTransformer: BusinessResponseTransformerService,
    private readonly messageStore: SimulatorMessageStoreService,
    private readonly businessService: BusinessService,
  ) {}

  /**
   * Customer authentication - Create or resume session
   */
  @Post('auth')
  async authenticateCustomer(
    @Body(new ValidationPipe()) request: CustomerAuthRequest,
  ): Promise<ApiResponse<CustomerAuthResponse>> {
    this.logger.debug(`Customer authentication request: ${request.phoneNumber}`);

    try {
      const authResponse = await this.customerSessionService.authenticateCustomer(request);

      // Send welcome message for new sessions handled by the message type router
      // This will be handled through webhook processing

      return {
        success: true,
        data: authResponse,
        message: 'Authentication successful',
      };
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Send message from customer
   */
  @Post('sessions/:sessionId/send')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body(new ValidationPipe()) request: { message: string },
  ): Promise<ApiResponse<SendMessageResponse>> {
    this.logger.debug(`Send message request for session: ${sessionId}`);

    try {
      // Get current session
      const session = await this.customerSessionService.getSession(sessionId);
      
      // Create WhatsApp incoming message format
      const incomingMessage = {
        from: session.customerPhone,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Math.floor(Date.now() / 1000).toString(),
        type: 'text' as const,
        text: { body: request.message }
      };
      
      // Create router context
      const context = {
        customerPhone: session.customerPhone,
        businessId: session.businessId || undefined,
        sessionId: session.id,
        currentState: session.currentState,
        sessionData: session.sessionData
      };
      
      // Route the message and get response
      const responseMessage = await this.messageTypeRouter.routeMessage(incomingMessage, context);

      return {
        success: true,
        data: {
          success: true,
          messageId: `msg_${Date.now()}`,
          timestamp: new Date()
        },
        message: 'Message sent successfully',
      };
    } catch (error) {
      this.logger.error(`Send message failed: ${error.message}`, error.stack);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Poll for new messages
   */
  @Get('sessions/:sessionId/messages')
  async pollMessages(
    @Param('sessionId') sessionId: string,
    @Query('since') since?: string,
  ): Promise<ApiResponse<PollMessagesResponse>> {
    this.logger.debug(`Poll messages for session: ${sessionId}`);

    try {
      // Get session to find customer phone
      const session = await this.customerSessionService.getSession(sessionId);
      
      // Get messages from store
      const sinceDate = since ? new Date(since) : undefined;
      const storedMessages = this.messageStore.getMessagesSince(session.customerPhone, sinceDate);
      
      // Convert stored messages to simulator message format
      const messages: SimulatorMessage[] = storedMessages.map(stored => ({
        id: stored.id,
        sessionId: sessionId,
        messageId: stored.id,
        fromPhone: stored.type === 'received' ? session.customerPhone : 'business',
        toPhone: stored.type === 'received' ? 'business' : session.customerPhone,
        messageType: this.determineMessageType(stored.content),
        content: this.convertToMessageContent(stored.content),
        timestamp: stored.timestamp,
        isFromCustomer: stored.type === 'received',
        delivered: true,
        read: true
      }));

      const response: PollMessagesResponse = {
        success: true,
        messages,
        hasMore: false
      };

      return {
        success: true,
        data: response,
        message: 'Messages retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Poll messages failed: ${error.message}`, error.stack);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get session information
   */
  @Get('sessions/:sessionId')
  async getSession(
    @Param('sessionId') sessionId: string,
  ): Promise<ApiResponse<CustomerSession>> {
    this.logger.debug(`Get session: ${sessionId}`);

    try {
      const session = await this.customerSessionService.getSession(sessionId);

      return {
        success: true,
        data: session,
        message: 'Session retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Get session failed: ${error.message}`, error.stack);
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Parse routing code from message
   */
  @Post('parse-routing')
  async parseRoutingCode(
    @Body(new ValidationPipe()) request: ParseRoutingCodeRequest,
  ): Promise<ApiResponse<ParseRoutingCodeResponse>> {
    this.logger.debug(`Parse routing code from: "${request.message}"`);

    try {
      const response = await this.messageRoutingService.parseRoutingMessage(request);

      return {
        success: true,
        data: response,
        message: 'Message parsed successfully',
      };
    } catch (error) {
      this.logger.error(`Parse routing failed: ${error.message}`, error.stack);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Handle button/list interactions
   */
  @Post('sessions/:sessionId/interact')
  async handleInteraction(
    @Param('sessionId') sessionId: string,
    @Body() request: { type: string; payload: string },
  ): Promise<ApiResponse<SendMessageResponse>> {
    this.logger.debug(`Handle interaction for session: ${sessionId}, type: ${request.type}`);

    try {
      const session = await this.customerSessionService.getSession(sessionId);
      
      // Process interaction based on type and current session state
      const response = await this.processInteraction(session, request.type, request.payload);

      return {
        success: true,
        data: response,
        message: 'Interaction processed successfully',
      };
    } catch (error) {
      this.logger.error(`Handle interaction failed: ${error.message}`, error.stack);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get simulator statistics
   */
  @Get('stats')
  async getSimulatorStats(): Promise<ApiResponse<any>> {
    this.logger.debug('Get simulator statistics');

    try {
      const sessionStats = await this.customerSessionService.getSessionStats();

      return {
        success: true,
        data: {
          sessions: sessionStats,
        },
        message: 'Statistics retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Get stats failed: ${error.message}`, error.stack);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Health check for simulator
   */
  @Get('health')
  async healthCheck(): Promise<ApiResponse<any>> {
    try {
      const stats = await this.customerSessionService.getSessionStats();
      
      return {
        success: true,
        data: {
          status: 'healthy',
          activeSessions: stats.activeSessions,
          timestamp: new Date(),
        },
        message: 'WhatsApp Simulator is healthy',
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      throw new HttpException('Simulator unhealthy', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // Private helper methods

  private async processCustomerMessage(session: CustomerSession, message: string): Promise<void> {
    this.logger.debug(`Processing customer message in state: ${session.currentState}`);

    // Check for routing codes in the message
    if (this.messageRoutingService.hasRoutingCode(message)) {
      const parseResponse = await this.messageRoutingService.parseRoutingMessage({ message });
      
      if (parseResponse.success && parseResponse.business) {
        // Set business context and send welcome message
        await this.customerSessionService.setBusinessContext(session.id, parseResponse.business.id);
        // Business welcome message will be handled by message router
        return;
      } else {
        // Send error message for invalid routing code
        const errorContent: MessageContent = { 
          text: parseResponse.suggestedMessage || 'Sorry, I could not find that business code.' 
        };
        // Error messages will be handled by message router
        return;
      }
    }

    // Process based on current session state
    switch (session.currentState) {
      case CustomerSessionState.INITIAL:
        await this.handleInitialState(session.id, message);
        break;
      
      case CustomerSessionState.BUSINESS_SELECTED:
        await this.handleBusinessSelectedState(session.id, message);
        break;
      
      case CustomerSessionState.SERVICE_SELECTION:
        await this.handleServiceSelectionState(session.id, message);
        break;
      
      default:
        await this.handleDefaultResponse(session.id, message);
    }
  }

  private async handleInitialState(sessionId: string, message: string): Promise<void> {
    const responseContent: MessageContent = {
      text: `I'd be happy to help you! To get started, please send me a business code like "BOOK_AT_S1234".\n\nIf you don't have a code, you can ask the salon for their Salex booking code.`
    };

    // Response messages will be handled by message router
  }

  private async handleBusinessSelectedState(sessionId: string, message: string): Promise<void> {
    const session = await this.customerSessionService.getSession(sessionId);
    
    if (session.businessId) {
      // Get business services for menu
      const services = await this.businessService.getBusinessServices(session.businessId, '');
      
      if (services.length > 0) {
        // Service selection messages will be handled by message router
        await this.customerSessionService.updateSessionState(sessionId, CustomerSessionState.SERVICE_SELECTION);
      } else {
        const responseContent: MessageContent = {
          text: 'This business hasn\'t set up their services yet. Please contact them directly or try again later.'
        };
        // Response messages will be handled by message router
      }
    }
  }

  private async handleServiceSelectionState(sessionId: string, message: string): Promise<void> {
    const responseContent: MessageContent = {
      text: 'Great choice! Appointment booking is coming soon. For now, please contact the business directly to complete your booking. 📞'
    };

    // Response messages will be handled by message router
  }

  private async handleDefaultResponse(sessionId: string, message: string): Promise<void> {
    const responseContent: MessageContent = {
      text: `Thanks for your message! I'm still learning how to help with that. Try sending "BOOK_AT_S1234" with your salon's code to get started.`
    };

    // Response messages will be handled by message router
  }

  private async processInteraction(
    session: CustomerSession, 
    type: string, 
    payload: string
  ): Promise<SendMessageResponse> {
    this.logger.debug(`Processing interaction: ${type} with payload: ${payload}`);

    switch (payload) {
      case 'view_services':
        if (session.businessId) {
          // Service selection messages will be handled by message router
          await this.customerSessionService.updateSessionState(session.id, CustomerSessionState.SERVICE_SELECTION);
        }
        break;

      case 'book_appointment':
        // Booking content will be handled by message router
        return {
          success: true,
          messageId: `msg_${Date.now()}`,
          timestamp: new Date()
        };

      case 'business_hours':
        if (session.businessId) {
          // Hours content will be handled by message router
          return {
            success: true,
            messageId: `msg_${Date.now()}`,
            timestamp: new Date()
          };
        }
        break;

      default:
        if (payload.startsWith('service_')) {
          // Service content will be handled by message router
          return {
            success: true,
            messageId: `msg_${Date.now()}`,
            timestamp: new Date()
          };
        }
    }

    // Default content will be handled by message router
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date()
    };
  }

  // Helper methods for message conversion

  private determineMessageType(content: any): MessageType {
    if (content?.interactive?.type === 'button') {
      return MessageType.INTERACTIVE_BUTTON;
    }
    if (content?.interactive?.type === 'list') {
      return MessageType.INTERACTIVE_LIST;
    }
    if (content?.text) {
      return MessageType.TEXT;
    }
    return MessageType.TEXT;
  }

  private convertToMessageContent(content: any): MessageContent {
    // If it's a WhatsApp outgoing message format
    if (content?.text?.body) {
      return { text: content.text.body };
    }
    
    // If it's an interactive message
    if (content?.interactive) {
      const interactive = content.interactive;
      if (interactive.type === 'button' && interactive.action?.buttons) {
        return {
          text: interactive.body?.text || '',
          buttons: interactive.action.buttons.map((btn: any) => ({
            id: btn.reply.id,
            title: btn.reply.title,
            payload: btn.reply.id
          }))
        };
      }
      
      if (interactive.type === 'list' && interactive.action?.sections) {
        return {
          text: interactive.body?.text || '',
          list: {
            header: interactive.header?.text,
            body: interactive.body?.text || '',
            footer: interactive.footer?.text,
            buttonText: interactive.action.button || 'Select',
            sections: interactive.action.sections.map((section: any) => ({
              title: section.title,
              rows: section.rows.map((row: any) => ({
                id: row.id,
                title: row.title,
                description: row.description
              }))
            }))
          }
        };
      }
    }
    
    // If it's already in MessageContent format
    if (content?.text || content?.buttons || content?.list) {
      return content;
    }
    
    // If it's a simple text message from webhook
    if (typeof content === 'string') {
      return { text: content };
    }
    
    // If it's a WhatsApp incoming text message
    if (content?.text?.body) {
      return { text: content.text.body };
    }
    
    // Default fallback
    return { text: JSON.stringify(content) };
  }

}