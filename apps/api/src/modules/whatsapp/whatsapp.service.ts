import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma.service';
import { 
  WhatsAppWebhookPayloadDto
} from './dto/whatsapp-webhook.dto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async processMessage(
    payload: WhatsAppWebhookPayloadDto,
    business: { id: string; name: string; identifier?: string }
  ): Promise<void> {
    
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          for (const message of change.value.messages || []) {
            await this.processIndividualMessage(
              message,
              business
            );
          }
        }
      }
    }
  }

  private async processIndividualMessage(
    message: any,
    business: { id: string; name: string; identifier?: string }
  ): Promise<void> {
    const from = message.from;
    const messageText = message.text?.body || message.interactive?.title || '';
    const messageType = message.type || 'text';

    this.logMessage(
      'processing',
      { from, messageText, type: messageType },
      { businessId: business.id }
    );

    // Ensure customer exists first (for foreign key constraint)
    await this.ensureCustomerExists(from);

    // Find or create conversation
    let conversation = await this.prisma.whatsAppConversation.findFirst({
      where: {
        customerPhone: from,
        businessId: business.id
      }
    });

    if (!conversation) {
      conversation = await this.prisma.whatsAppConversation.create({
        data: {
          customerPhone: from,
          businessId: business.id,
          state: 'GREETING',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          context: {}
        }
      });
    }

    // Store incoming message
    await this.prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        whatsappMessageId: message.id || `sim_${Date.now()}`,
        direction: 'INCOMING',
        messageType,
        content: { raw: message },
        isSimulator: false,
        status: 'delivered'
      }
    });

    // Generate response based on conversation state and message
    const response = await this.generateResponse(
      messageText,
      conversation.state,
      business
    );

    // Store outgoing/response message
    if (response) {
      await this.prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          whatsappMessageId: `resp_${Date.now()}_${from}`,
          direction: 'OUTGOING',
          messageType: response.type,
          content: response.content,
          isSimulator: false,
          status: 'sent'
        }
      });


      // Update conversation state if response indicates state change
      if (response.nextState) {
        await this.prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            state: response.nextState,
            updatedAt: new Date()
          }
        });

      }
    }

    this.logMessage(
      'completed',
      { response: response?.type || 'none', nextState: response?.nextState },
      { businessId: business.id }
    );
  }

  private async generateResponse(
    messageText: string,
    currentState: string,
    business: { id: string; name: string; identifier?: string }
  ): Promise<{
    type: string;
    content: any;
    nextState?: string;
  } | null> {

    // Handle routing codes
    const routingCode = this.extractRoutingCode(messageText);
    if (routingCode) {
      const targetBusiness = await this.prisma.business.findFirst({
        where: { routingCode: routingCode, businessType: 'SALON' }
      });

      if (targetBusiness) {
        return {
          type: 'text',
          content: { text: { body: `Connected to ${targetBusiness.name} (${targetBusiness.routingCode})` } },
          nextState: 'BUSINESS_CONNECTED'
        };
      } else {
        return {
          type: 'text',
          content: { text: { body: `Business code ${routingCode} not found. Please check the code and try again.` } }
        };
      }
    }

    // State-based responses
    switch (currentState) {
      case 'GREETING':
        return {
          type: 'text',
          content: { 
            text: { 
              body: `Hello! Welcome to ${business.name} (${business.identifier || business.id}).
    
How can I help you today?

You can:
• Send a business code like "BOOK_AT_S1234" to connect
• Ask about our services
• Check business hours
• Inquire about availability` 
            } 
          },
          nextState: 'AWAITING_RESPONSE'
        };

      case 'BUSINESS_CONNECTED':
        // Get available services
        const services = await this.prisma.service.findMany({
          where: { businessId: business.id },
          orderBy: { name: 'asc' }
        });

        if (services.length > 0) {
          const servicesText = services.map(s => `• ${s.name}: $${s.price} (${s.durationMinutes}min)`).join('\n');
          return {
            type: 'text',
            content: { 
              text: { 
                body: `Here are our available services:\n\n${servicesText}\n\nWhich service would you like to book?` 
              } 
            },
            nextState: 'SERVICE_SELECTION'
          };
        } else {
          return {
            type: 'text',
            content: { text: { body: `We currently don't have services listed. Please contact us directly for inquiries.` } }
          };
        }

      case 'SERVICE_SELECTION':
        return {
          type: 'text',
          content: { text: { body: 'Great choice! Appointment booking is coming soon. For now, please contact us directly to book your appointment.' } }
        };

      default:
        return {
          type: 'text',
          content: { text: { body: `Thanks for your message! I'm here to help you with:\n\n📅 Booking appointments\n💇‍♂️ Services and pricing\n🏢 Business hours\n📱 Contact information\n\nWhat can I help you with today?` } }
        };
    }
  }

  async extractBusinessFromMessage(payload: WhatsAppWebhookPayloadDto): Promise<{ id: string; name: string; identifier?: string } | null> {
    // Extract business from routing codes or existing conversations
    
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          const messages = change.value.messages || [];
          
          // Look for routing codes in messages
          for (const message of messages) {
            const messageText = message.text?.body || '';
            const routingCode = this.extractRoutingCode(messageText);
            
            if (routingCode) {
              const business = await this.prisma.business.findFirst({
                where: { routingCode: routingCode, businessType: 'SALON' }
              });
              
              if (business) {
                return { id: business.id, name: business.name, identifier: business.routingCode };
              }
            }

            // If no routing code found in message, check for existing conversation
            const customerPhone = message.from;
            if (customerPhone) {
              const existingConversation = await this.prisma.whatsAppConversation.findFirst({
                where: {
                  customerPhone,
                  expiresAt: { gt: new Date() }
                },
                include: { business: true },
                orderBy: { lastMessageAt: 'desc' }
              });
              
              if (existingConversation?.business) {
                return { 
                  id: existingConversation.business.id, 
                  name: existingConversation.business.name, 
                  identifier: existingConversation.business.routingCode 
                };
              }
            }
            
          }
        }
      }
    }

    return null;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const appSecret = this.configService.get<string>('WHATSAPP_APP_SECRET');
    if (!appSecret) {
      return true; // Skip verification if no app secret configured
    }

    try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', appSecret);
      hmac.update(rawBody);
      const expectedSignature = 'sha256=' + hmac.digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      this.logger.error('Signature verification failed', error.message);
      return false;
    }
  }

  extractRoutingCode(message: string): string | null {
    if (!message) return null;
    
    // Format: S1234 or BOOK_AT_S1234 or just 1234
    const sMatch = message.match(/[sS](\d{4})/);
    if (sMatch) return sMatch[1]; // Return just the digits: "1234"
    
    const numberMatch = message.match(/\b(\d{4})\b/);
    if (numberMatch) return numberMatch[1]; // Return just the digits: "1234"
    
    return null;
  }

  private async ensureCustomerExists(phoneNumber: string): Promise<void> {
    try {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { phoneNumber }
      });

      if (!existingCustomer) {
        await this.prisma.customer.create({
          data: {
            phoneNumber,
            name: null // Will be populated later when customer provides name
          }
        });
        this.logger.debug(`Created customer record for phone: ${phoneNumber}`);
      }
    } catch (error) {
      // If customer creation fails due to unique constraint (race condition), ignore
      if (error.code === 'P2002') {
        this.logger.debug(`Customer already exists for phone: ${phoneNumber}`);
        return;
      }
      throw error;
    }
  }

  private logMessage(
    action: string,
    data: any,
    context: { businessId?: string }
  ) {
    console.log(`[PRODUCTION] WhatsApp ${action}:`, data, context);
  }

  async getConversationHistory(
    businessId: string,
    customerPhone: string
  ) {
    const conversation = await this.prisma.whatsAppConversation.findFirst({
      where: {
        businessId,
        customerPhone
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50
        },
        business: {
          select: { name: true, routingCode: true, phoneNumber: true }
        }
      }
    });

    return conversation;
  }
}