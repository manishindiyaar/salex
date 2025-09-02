import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma.service';
import { WhatsAppWebhookPayloadDto } from '../../whatsapp/dto/whatsapp-webhook.dto';
import { BusinessApiRouterService } from './business-api-router.service';
import { BusinessResponseTransformerService } from './business-response-transformer.service';
import { CustomerSessionService } from '../../customer/customer-session.service';
import { CustomerSessionState } from 'shared-types';

@Injectable()
export class SimulatorWebhookProcessorService {
  private readonly logger = new Logger(SimulatorWebhookProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessApiRouter: BusinessApiRouterService,
    private readonly responseTransformer: BusinessResponseTransformerService,
    private readonly customerSession: CustomerSessionService,
  ) {}

  /**
   * Extract business from WhatsApp webhook payload
   */
  async extractBusinessFromMessage(
    payload: WhatsAppWebhookPayloadDto
  ): Promise<{ id: string; name: string; identifier?: string } | null> {
    this.logger.debug('Extracting business from simulator message');

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          const messages = change.value.messages || [];
          
          // Look for routing codes in messages
          for (const message of messages) {
            const messageText = message.text?.body || '';
            const routingCode = this.extractRoutingCode(messageText);
            
            if (routingCode) {
              // Use BusinessApiRouterService to find business
              try {
                const business = await this.businessApiRouter.getBusinessByRoutingCode(routingCode);
                if (business) {
                  return { 
                    id: business.id, 
                    name: business.name, 
                    identifier: business.routingCode 
                  };
                }
              } catch (error) {
                this.logger.warn(`Business lookup failed for code ${routingCode}: ${error.message}`);
              }
            }

            // If no routing code found, check for existing conversation
            const customerPhone = message.from;
            if (customerPhone) {
              try {
                // Try to find active session with business context
                const activeSession = await this.prisma.customerSession.findFirst({
                  where: {
                    customerPhone,
                    businessId: { not: null },
                    expiresAt: { gte: new Date() }
                  }
                });
                
                if (activeSession && activeSession.businessId) {
                  const business = await this.businessApiRouter.getBusinessById(activeSession.businessId);
                  if (business) {
                    return { 
                      id: business.id, 
                      name: business.name, 
                      identifier: business.routingCode 
                    };
                  }
                }
              } catch (error) {
                this.logger.warn(`Session lookup failed for phone ${customerPhone}: ${error.message}`);
              }
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Process simulator message through business API routing
   */
  async processSimulatorMessage(
    payload: WhatsAppWebhookPayloadDto,
    business: { id: string; name: string; identifier?: string }
  ): Promise<void> {
    this.logger.debug(`Processing simulator message for business: ${business.name}`);

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          for (const message of change.value.messages || []) {
            await this.processIndividualMessage(message, business);
          }
        }
      }
    }
  }

  /**
   * Process individual message and generate response
   */
  private async processIndividualMessage(
    message: any,
    business: { id: string; name: string; identifier?: string }
  ): Promise<void> {
    const from = message.from;
    const messageText = message.text?.body || message.interactive?.title || '';
    const messageType = message.type || 'text';

    this.logger.debug(`Processing message from ${from}: "${messageText}"`);

    // Ensure customer session exists
    let session;
    try {
      // Try to get existing active session
      const existingSession = await this.prisma.customerSession.findFirst({
        where: {
          customerPhone: from,
          expiresAt: { gte: new Date() }
        }
      });
      
      if (existingSession) {
        session = existingSession;
        // Update business context if needed
        if (!session.businessId && business.id) {
          session = await this.customerSession.setBusinessContext(session.id, business.id);
        }
      } else {
        // Create new session
        const authResponse = await this.customerSession.authenticateCustomer({ phoneNumber: from });
        session = await this.customerSession.getSession(authResponse.sessionId);
        if (business.id) {
          session = await this.customerSession.setBusinessContext(session.id, business.id);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to manage customer session: ${error.message}`);
      return;
    }

    // Store incoming message for conversation history
    await this.storeIncomingMessage(session.id, message, business.id);

    // Generate response based on message content and session state
    const response = await this.generateBusinessResponse(
      messageText,
      messageType,
      session,
      business
    );

    // Store and send response
    if (response) {
      await this.storeOutgoingMessage(session.id, response, business.id);
      
      // Update session state if needed
      if (response.nextState) {
        let newState: CustomerSessionState;
        switch (response.nextState) {
          case 'business_connected':
            newState = CustomerSessionState.BUSINESS_SELECTED;
            break;
          case 'service_selection':
            newState = CustomerSessionState.SERVICE_SELECTION;
            break;
          case 'time_selection':
            newState = CustomerSessionState.TIME_SELECTION;
            break;
          case 'booking_completed':
            newState = CustomerSessionState.BOOKING_COMPLETE;
            break;
          default:
            newState = CustomerSessionState.INITIAL;
        }
        await this.customerSession.updateSessionState(session.id, newState);
      }
    }
  }

  /**
   * Generate business response using API routing
   */
  private async generateBusinessResponse(
    messageText: string,
    messageType: string,
    session: any,
    business: { id: string; name: string; identifier?: string }
  ): Promise<any> {
    this.logger.debug(`Generating response for message: "${messageText}" in state: ${session.currentStep}`);

    // Handle routing codes for business connection
    const routingCode = this.extractRoutingCode(messageText);
    if (routingCode) {
      return this.responseTransformer.createBusinessConnectionResponse(business);
    }

    // Handle interactive button responses
    if (messageType === 'interactive') {
      // For interactive messages, we need to find the original message
      // Since we're in the context of processing, we'll create a mock message structure
      const interactiveMessage = {
        interactive: {
          type: 'button_reply', // or 'list_reply' based on the message
          button_reply: { id: messageText },
          list_reply: { id: messageText }
        }
      };
      return await this.handleInteractiveMessage(interactiveMessage, session, business);
    }

    // State-based responses using Business API Router
    switch (session.currentState) {
      case CustomerSessionState.INITIAL:
        return await this.handleWelcomeState(session, business);
      
      case CustomerSessionState.BUSINESS_SELECTED:
        return await this.handleBusinessConnectedState(messageText, session, business);
      
      case CustomerSessionState.SERVICE_SELECTION:
        return await this.handleServiceSelectionState(messageText, session, business);
      
      case CustomerSessionState.TIME_SELECTION:
        return await this.handleTimeSelectionState(messageText, session, business);
      
      default:
        return this.responseTransformer.createGenericHelpResponse();
    }
  }

  /**
   * Handle welcome state - show business services
   */
  private async handleWelcomeState(session: any, business: any): Promise<any> {
    try {
      const services = await this.businessApiRouter.getBusinessServices(business.id);
      return this.responseTransformer.createServicesListResponse(services);
    } catch (error) {
      this.logger.error(`Failed to get services for business ${business.id}: ${error.message}`);
      return this.responseTransformer.createErrorResponse('Unable to load services at this time.');
    }
  }

  /**
   * Handle business connected state - process service selection
   */
  private async handleBusinessConnectedState(messageText: string, session: any, business: any): Promise<any> {
    // If user asks for services, hours, etc.
    const lowerText = messageText.toLowerCase();
    
    if (lowerText.includes('service') || lowerText.includes('price')) {
      try {
        const services = await this.businessApiRouter.getBusinessServices(business.id);
        return this.responseTransformer.createServicesListResponse(services);
      } catch (error) {
        return this.responseTransformer.createErrorResponse('Unable to load services.');
      }
    }
    
    if (lowerText.includes('hour') || lowerText.includes('time') || lowerText.includes('open')) {
      try {
        const hours = await this.businessApiRouter.getBusinessHours(business.id);
        return this.responseTransformer.createBusinessHoursResponse(hours);
      } catch (error) {
        return this.responseTransformer.createErrorResponse('Unable to load business hours.');
      }
    }

    // Default response with options
    return this.responseTransformer.createBusinessMenuResponse(business.name);
  }

  /**
   * Handle service selection state - show time slots
   */
  private async handleServiceSelectionState(messageText: string, session: any, business: any): Promise<any> {
    // Extract service selection from message
    const serviceId = this.extractServiceId(messageText);
    
    if (serviceId) {
      try {
        const timeSlots = await this.businessApiRouter.getAvailableTimeSlots(
          business.id,
          undefined,
          { serviceId, startDate: new Date().toISOString().split('T')[0] }
        );
        return this.responseTransformer.createTimeSlotsResponse(timeSlots);
      } catch (error) {
        return this.responseTransformer.createErrorResponse('Unable to load available time slots.');
      }
    }

    return this.responseTransformer.createErrorResponse('Please select a valid service.');
  }

  /**
   * Handle time selection state - create booking
   */
  private async handleTimeSelectionState(messageText: string, session: any, business: any): Promise<any> {
    // Extract time slot selection
    const timeSlot = this.extractTimeSlot(messageText);
    
    if (timeSlot) {
      try {
        const sessionData = session.sessionData || {};
        const booking = await this.businessApiRouter.createBooking(
          business.id,
          '', // No user token for simulator
          {
            serviceId: sessionData.selectedServiceId,
            timeSlot: timeSlot,
            customerPhone: session.customerPhone,
          }
        );
        return this.responseTransformer.createBookingConfirmationResponse(booking);
      } catch (error) {
        return this.responseTransformer.createErrorResponse('Unable to create booking. Please try again.');
      }
    }

    return this.responseTransformer.createErrorResponse('Please select a valid time slot.');
  }

  /**
   * Handle interactive message responses (buttons, lists)
   */
  private async handleInteractiveMessage(message: any, session: any, business: any): Promise<any> {
    if (message.interactive?.type === 'button_reply') {
      const buttonId = message.interactive.button_reply.id;
      
      switch (buttonId) {
        case 'view_services':
          return await this.handleWelcomeState(session, business);
        case 'view_hours':
          try {
            const hours = await this.businessApiRouter.getBusinessHours(business.id);
            return this.responseTransformer.createBusinessHoursResponse(hours);
          } catch (error) {
            return this.responseTransformer.createErrorResponse('Unable to load business hours.');
          }
        default:
          return this.responseTransformer.createGenericHelpResponse();
      }
    }
    
    if (message.interactive?.type === 'list_reply') {
      const listId = message.interactive.list_reply.id;
      
      if (listId.startsWith('service_')) {
        const serviceId = listId.replace('service_', '');
        const currentData = session.sessionData || {};
        await this.customerSession.updateSessionState(session.id, CustomerSessionState.SERVICE_SELECTION, {
          ...currentData,
          selectedServiceId: serviceId
        });
        return await this.handleServiceSelectionState(`service_${serviceId}`, session, business);
      }
    }

    return this.responseTransformer.createGenericHelpResponse();
  }

  /**
   * Store incoming message in database
   */
  private async storeIncomingMessage(sessionId: string, message: any, businessId: string): Promise<void> {
    try {
      await this.prisma.whatsAppMessage.create({
        data: {
          conversationId: sessionId,
          whatsappMessageId: message.id || `sim_${Date.now()}`,
          direction: 'INCOMING',
          messageType: message.type || 'text',
          content: { raw: message },
          isSimulator: true,
          status: 'delivered'
        }
      });
    } catch (error) {
      this.logger.error(`Failed to store incoming message: ${error.message}`);
    }
  }

  /**
   * Store outgoing message in database
   */
  private async storeOutgoingMessage(sessionId: string, response: any, businessId: string): Promise<void> {
    try {
      await this.prisma.whatsAppMessage.create({
        data: {
          conversationId: sessionId,
          whatsappMessageId: `resp_${Date.now()}_${businessId}`,
          direction: 'OUTGOING',
          messageType: response.type,
          content: response.content,
          isSimulator: true,
          status: 'sent'
        }
      });
    } catch (error) {
      this.logger.error(`Failed to store outgoing message: ${error.message}`);
    }
  }

  /**
   * Extract routing code from message
   */
  private extractRoutingCode(message: string): string | null {
    if (!message) return null;
    
    // Format: S1234 or BOOK_AT_S1234 or just 1234
    const sMatch = message.match(/[sS](\d{4})/);
    if (sMatch) return sMatch[1]; // Return just the digits: "1234"
    
    const numberMatch = message.match(/\b(\d{4})\b/);
    if (numberMatch) return numberMatch[1]; // Return just the digits: "1234"
    
    return null;
  }

  /**
   * Extract service ID from message
   */
  private extractServiceId(message: string): string | null {
    const match = message.match(/service_([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract time slot from message
   */
  private extractTimeSlot(message: string): string | null {
    // Look for time patterns like "10:00 AM", "14:30", etc.
    const timeMatch = message.match(/(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i);
    return timeMatch ? timeMatch[1] : null;
  }
}