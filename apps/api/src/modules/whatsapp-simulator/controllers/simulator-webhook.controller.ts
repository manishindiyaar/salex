import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ValidationPipe,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { WhatsAppWebhookPayloadDto } from '../../whatsapp/dto/whatsapp-webhook.dto';
import { MessageTypeRouterService } from '../services/message-type-router.service';
import { BusinessResponseTransformerService } from '../services/business-response-transformer.service';
import { CustomerSessionService } from '../../customer/customer-session.service';
import { SimulatorMessageStoreService } from '../services/simulator-message-store.service';
import { BookingFlowService } from '../services/booking-flow.service';
import { ApiResponse, WhatsAppIncomingMessage, CustomerSessionState } from 'shared-types';

@Controller('simulate-webhooks/whatsapp')
@SkipThrottle()
export class SimulatorWebhookController {
  private readonly logger = new Logger(SimulatorWebhookController.name);

  constructor(
    private readonly messageTypeRouter: MessageTypeRouterService,
    private readonly responseTransformer: BusinessResponseTransformerService,
    private readonly customerSessionService: CustomerSessionService,
    private readonly messageStore: SimulatorMessageStoreService,
    private readonly bookingFlowService: BookingFlowService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Simulator webhook verification (GET request)
   */
  @Get()
  async verifySimulatorWebhook(@Query() query: any): Promise<string> {
    this.logger.debug('Simulator webhook verification request received');

    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    // Check if this is a simulator health check (no webhook verification params)
    if (!mode && !token && !challenge) {
      this.logger.debug('Simulator health check detected');
      return 'Simulator webhook endpoint healthy';
    }

    // For simulator mode, use a dedicated verify token or skip verification
    const simulatorVerifyToken = this.configService.get<string>('SIMULATOR_WEBHOOK_VERIFY_TOKEN') || 'simulator-verify-token';
    
    this.logger.debug(`Simulator verify token check: "${token}" === "${simulatorVerifyToken}"`);

    if (mode === 'subscribe' && token === simulatorVerifyToken) {
      this.logger.log('Simulator webhook verified successfully');
      return challenge;
    } else {
      this.logger.warn(`Invalid simulator webhook verification: mode=${mode}, token=${token}`);
      throw new UnauthorizedException('Invalid simulator webhook verification');
    }
  }

  /**
   * Simulator webhook endpoint (POST request)
   */
  @Post()
  async handleSimulatorWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body(new ValidationPipe({ transform: true })) payload: WhatsAppWebhookPayloadDto,
    @Headers('x-simulator-mode') simulatorMode?: string,
  ): Promise<ApiResponse<{ status: string }>> {
    this.logger.debug(`Simulator webhook message received (Mode: ${simulatorMode || 'header-missing'})`);

    try {
      // No signature verification for simulator - this is for testing only
      this.logger.debug('Simulator mode - skipping signature verification');

      // Extract message from WhatsApp webhook payload
      const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!message) {
        this.logger.warn('No message found in webhook payload');
        return {
          success: true,
          data: { status: 'no_message' },
          message: 'No message found in payload',
        };
      }

      // Get customer phone number
      const customerPhone = message.from;
      this.logger.debug(`Processing message from customer: ${customerPhone}`);

      // Get or create customer session
      this.logger.debug(`Creating/finding session for customer: ${customerPhone}`);
      const authResponse = await this.customerSessionService.authenticateCustomer({
        phoneNumber: customerPhone
      });
      const session = await this.customerSessionService.getSession(authResponse.sessionId);

      // Create router context
      const context = {
        customerPhone: session.customerPhone,
        businessId: session.businessId || undefined,
        sessionId: session.id,
        currentState: session.currentState,
        sessionData: session.sessionData
      };

      // Convert webhook message to our internal format
      const incomingMessage: WhatsAppIncomingMessage = {
        from: message.from,
        id: message.id,
        timestamp: message.timestamp,
        type: message.type as any,
        text: message.text,
        interactive: message.interactive as any
      };

      // Store the incoming message
      this.messageStore.storeMessage(customerPhone, incomingMessage, 'received');

      // Use BookingFlowService directly for better multi-message support
      this.logger.debug(`Processing message through BookingFlowService`);
      this.logger.debug(`BookingFlowService is: ${this.bookingFlowService ? 'defined' : 'undefined'}`);
      const responseMessages = await this.bookingFlowService.processBookingMessage(
        customerPhone,
        message.text?.body || '',
        message.interactive,
        session.sessionData as any
      );
      
      // Store all response messages for polling
      this.logger.debug(`BookingFlowService returned ${responseMessages?.length || 0} messages`);
      if (responseMessages && responseMessages.length > 0) {
        responseMessages.forEach((responseMessage, index) => {
          this.messageStore.storeMessage(customerPhone, responseMessage, 'sent');
          this.logger.debug(`Stored response message ${index + 1}/${responseMessages.length} for customer: ${customerPhone}`);
        });
      } else {
        this.logger.warn(`No response messages to store for customer: ${customerPhone}`);
      }
      
      this.logger.debug(`Generated ${responseMessages.length} responses`);

      this.logger.debug('Simulator webhook processed successfully');
      return {
        success: true,
        data: { status: 'processed' },
        message: 'Simulator webhook processed successfully',
      };

    } catch (error) {
      this.logger.error(`Simulator webhook processing failed: ${error.message}`, error.stack);
      
      return {
        success: false,
        data: { status: 'error' },
        error: 'Simulator processing error: ' + error.message,
      };
    }
  }

  /**
   * Health check for simulator service
   */
  @Get('health')
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string; mode: string }>> {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        mode: 'simulator',
      },
      message: 'Simulator WhatsApp service is healthy',
    };
  }
}