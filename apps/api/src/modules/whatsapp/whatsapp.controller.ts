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
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWebhookPayloadDto, WhatsAppVerificationDto } from './dto/whatsapp-webhook.dto';
import { ApiResponse } from 'shared-types';

@Controller('webhooks/whatsapp')
@SkipThrottle()
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * WhatsApp webhook verification (GET request)
   */
  @Get()
  async verifyWebhook(@Query() query: any): Promise<string> {
    this.logger.debug('WhatsApp webhook verification request received');

    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];


    const verifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    this.logger.debug(`Loaded verify token: "${verifyToken}"`);
    this.logger.debug(`Received token: "${token}"`);
    this.logger.debug(`Mode: "${mode}"`);
    this.logger.debug(`Token match: ${token === verifyToken}`);
    this.logger.debug(`Mode match: ${mode === 'subscribe'}`);

    if (!verifyToken) {
      this.logger.error('WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured');
      throw new BadRequestException('Webhook verify token not configured');
    }

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified successfully');
      return challenge;
    } else {
      this.logger.warn(`Invalid webhook verification: mode=${mode}, token=${token}, verifyToken=${verifyToken}`);
      throw new UnauthorizedException('Invalid webhook verification');
    }
  }

  /**
   * WhatsApp webhook endpoint (POST request)
   */
  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body(new ValidationPipe({ transform: true })) payload: WhatsAppWebhookPayloadDto,
    @Headers('x-hub-signature-256') signature?: string,
  ): Promise<ApiResponse<{ status: string }>> {
    this.logger.debug('WhatsApp webhook message received');

    try {
      if (signature) {
        const rawBody = req.rawBody?.toString('utf8');
        if (!rawBody) {
          this.logger.error('Raw body not available for signature verification');
          throw new UnauthorizedException('Cannot verify webhook signature');
        }

        const isValidSignature = this.whatsappService.verifyWebhookSignature(rawBody, signature);
        if (!isValidSignature) {
          throw new UnauthorizedException('Invalid webhook signature');
        }
      } else {
        this.logger.warn('No signature provided for webhook verification');
        // In development, you might want to skip signature verification
        // In production, this should be required
        if (this.configService.get<string>('NODE_ENV') === 'production') {
          throw new UnauthorizedException('Webhook signature required');
        }
      }

      // Extract business context from message
      const business = await this.whatsappService.extractBusinessFromMessage(payload);
      
      if (!business) {
        this.logger.warn('Could not identify business from WhatsApp message');
        // Still return success to avoid webhook retries
        return {
          success: true,
          data: { status: 'processed_without_business_context' },
          message: 'Message processed but no business context found',
        };
      }

      // Process the message with business context
      await this.whatsappService.processMessage(payload, business);

      this.logger.debug('WhatsApp webhook processed successfully');
      return {
        success: true,
        data: { status: 'processed' },
        message: 'Webhook processed successfully',
      };

    } catch (error) {
      this.logger.error(`WhatsApp webhook processing failed: ${error.message}`, error.stack);
      
      // Return success to avoid webhook retries for non-retryable errors
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }

      return {
        success: false,
        data: { status: 'error' },
        error: 'Internal processing error',
      };
    }
  }

  /**
   * Health check for WhatsApp service
   */
  @Get('health')
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      message: 'WhatsApp service is healthy',
    };
  }
}