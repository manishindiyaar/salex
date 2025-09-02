import { Injectable, Logger } from '@nestjs/common';
import { 
  WhatsAppIncomingMessage, 
  WhatsAppInteractiveResponse,
  CustomerSessionState 
} from 'shared-types';
import { BusinessApiRouterService } from './business-api-router.service';
import { BusinessResponseTransformerService, WhatsAppMessage } from './business-response-transformer.service';
import { MessageRoutingService } from '../message-routing.service';
import { CustomerSessionService } from '../../customer/customer-session.service';

export interface MessageRouterContext {
  customerPhone: string;
  businessId?: string;
  sessionId: string;
  currentState: CustomerSessionState;
  sessionData?: any;
}

export interface ConversationFlow {
  currentState: CustomerSessionState;
  nextState?: CustomerSessionState;
  requiresBusinessContext: boolean;
  expectedInput?: 'routing_code' | 'service_selection' | 'time_selection' | 'confirmation';
}

@Injectable()
export class MessageTypeRouterService {
  private readonly logger = new Logger(MessageTypeRouterService.name);

  constructor(
    private readonly businessApiRouter: BusinessApiRouterService,
    private readonly responseTransformer: BusinessResponseTransformerService,
    private readonly messageRouting: MessageRoutingService,
    private readonly customerSession: CustomerSessionService
  ) {}

  /**
   * Route incoming WhatsApp message based on type and conversation state
   */
  async routeMessage(
    message: WhatsAppIncomingMessage, 
    context: MessageRouterContext
  ): Promise<WhatsAppMessage> {
    this.logger.debug(`Routing message type: ${message.type} for customer: ${context.customerPhone}`);

    // Get conversation flow based on current state
    const flow = this.getConversationFlow(context.currentState);

    try {
      switch (message.type) {
        case 'text':
          return await this.handleTextMessage(message, context, flow);
        
        case 'interactive':
          return await this.handleInteractiveMessage(message, context, flow);
        
        default:
          return this.responseTransformer.createErrorResponse(
            'Sorry, I can only process text messages and interactive selections at this time.'
          );
      }
    } catch (error) {
      this.logger.error(`Error routing message: ${error.message}`, error);
      return this.responseTransformer.createErrorResponse(
        'Sorry, something went wrong processing your message. Please try again.'
      );
    }
  }

  /**
   * Handle text messages (routing codes, free text)
   */
  private async handleTextMessage(
    message: WhatsAppIncomingMessage,
    context: MessageRouterContext,
    flow: ConversationFlow
  ): Promise<WhatsAppMessage> {
    const messageText = message.text?.body || '';

    this.logger.debug(`Handling text message: "${messageText}" in state: ${context.currentState}`);

    // Check for routing code in any state
    if (this.messageRouting.hasRoutingCode(messageText)) {
      return await this.handleRoutingCodeMessage(messageText, context);
    }

    // Handle based on conversation state
    switch (context.currentState) {
      case CustomerSessionState.INITIAL:
        return this.handleInitialStateText(messageText, context);
      
      case CustomerSessionState.BUSINESS_SELECTED:
        return this.handleBusinessSelectedText(messageText, context);
      
      case CustomerSessionState.SERVICE_SELECTION:
        return this.handleServiceSelectionText(messageText, context);
      
      case CustomerSessionState.TIME_SELECTION:
        return this.handleTimeSelectionText(messageText, context);
      
      case CustomerSessionState.BOOKING_CONFIRMATION:
        return this.handleBookingConfirmationText(messageText, context);
      
      default:
        return this.responseTransformer.createGenericHelpResponse();
    }
  }

  /**
   * Handle interactive messages (button_reply, list_reply)
   */
  private async handleInteractiveMessage(
    message: WhatsAppIncomingMessage,
    context: MessageRouterContext,
    flow: ConversationFlow
  ): Promise<WhatsAppMessage> {
    const interactive = message.interactive;
    
    if (!interactive) {
      return this.responseTransformer.createErrorResponse('Invalid interactive message format.');
    }

    this.logger.debug(`Handling interactive message type: ${interactive.type} in state: ${context.currentState}`);

    switch (interactive.type) {
      case 'button_reply':
        return await this.handleButtonReply(interactive.button_reply!, context);
      
      case 'list_reply':
        return await this.handleListReply(interactive.list_reply!, context);
      
      case 'quick_reply':
        return await this.handleQuickReply(interactive.quick_reply!, context);
      
      default:
        return this.responseTransformer.createErrorResponse('Unsupported interactive message type.');
    }
  }

  /**
   * Handle button reply interactions
   */
  private async handleButtonReply(
    buttonReply: { id: string; title: string },
    context: MessageRouterContext
  ): Promise<WhatsAppMessage> {
    const { id, title } = buttonReply;
    
    this.logger.debug(`Processing button reply: ${id} (${title}) in state: ${context.currentState}`);

    // Common button actions
    switch (id) {
      case 'view_services':
        return await this.handleViewServices(context);
      
      case 'book_appointment':
      case 'book_now':
        return await this.handleBookAppointment(context);
      
      case 'view_hours':
        return await this.handleViewHours(context);
      
      case 'main_menu':
        return await this.handleMainMenu(context);
      
      case 'help':
        return this.responseTransformer.createGenericHelpResponse();
      
      case 'try_again':
        return await this.handleTryAgain(context);
      
      // Time selection buttons (time_HHMM format)
      default:
        if (id.startsWith('time_')) {
          return await this.handleTimeSelection(id, context);
        }
        
        return this.responseTransformer.createErrorResponse(`Unknown button action: ${id}`);
    }
  }

  /**
   * Handle list reply interactions
   */
  private async handleListReply(
    listReply: { id: string; title: string; description?: string },
    context: MessageRouterContext
  ): Promise<WhatsAppMessage> {
    const { id, title } = listReply;
    
    this.logger.debug(`Processing list reply: ${id} (${title}) in state: ${context.currentState}`);

    // Service selection (service_ID format)
    if (id.startsWith('service_')) {
      return await this.handleServiceSelection(id, context);
    }

    // Time selection (time_HHMM format) 
    if (id.startsWith('time_')) {
      return await this.handleTimeSelection(id, context);
    }

    return this.responseTransformer.createErrorResponse(`Unknown list selection: ${id}`);
  }

  /**
   * Handle quick reply interactions
   */
  private async handleQuickReply(
    quickReply: { id: string; title: string },
    context: MessageRouterContext
  ): Promise<WhatsAppMessage> {
    const { id, title } = quickReply;
    
    this.logger.debug(`Processing quick reply: ${id} (${title}) in state: ${context.currentState}`);

    // Quick booking actions
    switch (id) {
      case 'quick_book':
        return await this.handleQuickBook(context);
      
      case 'view_services':
        return await this.handleViewServices(context);
      
      case 'view_hours':
        return await this.handleViewHours(context);
      
      case 'main_menu':
        return await this.handleMainMenu(context);
      
      case 'help':
        return this.responseTransformer.createGenericHelpResponse();
      
      // Service category selection
      default:
        if (id.startsWith('category_')) {
          return await this.handleServiceCategorySelection(id, context);
        }
        
        // Time selection for quick replies
        if (id.startsWith('time_')) {
          return await this.handleTimeSelection(id, context);
        }
        
        return this.responseTransformer.createErrorResponse(`Unknown quick reply action: ${id}`);
    }
  }

  /**
   * Handle quick booking flow
   */
  private async handleQuickBook(context: MessageRouterContext): Promise<WhatsAppMessage> {
    if (!context.businessId) {
      return this.responseTransformer.createErrorResponse('Please select a business first by sending a routing code like "S1234".');
    }

    // Skip service selection and go directly to popular services or time slots
    try {
      const services = await this.businessApiRouter.getBusinessServices(context.businessId);
      
      if (services.length === 0) {
        return this.responseTransformer.createErrorResponse('No services available for quick booking.');
      }

      // For quick booking, show most popular or first service
      const popularService = services[0]; // Could be enhanced with popularity logic
      
      // Update session with selected service for quick booking
      const updatedSessionData = {
        ...context.sessionData,
        selectedServiceId: popularService.id,
        isQuickBooking: true
      };

      await this.customerSession.updateSessionState(
        context.sessionId,
        CustomerSessionState.TIME_SELECTION,
        updatedSessionData
      );

      // Get available time slots for today
      const timeSlots = await this.businessApiRouter.getAvailableTimeSlots(
        context.businessId,
        undefined,
        { serviceId: popularService.id }
      );
      
      return this.responseTransformer.createTimeSlotsResponse(timeSlots);
    } catch (error) {
      this.logger.error(`Failed quick booking:`, error);
      return this.responseTransformer.createErrorResponse('Unable to start quick booking. Please try browsing services instead.');
    }
  }

  /**
   * Handle service category selection
   */
  private async handleServiceCategorySelection(
    categoryId: string,
    context: MessageRouterContext
  ): Promise<WhatsAppMessage> {
    // Extract category index from format "category_N"
    const categoryIndex = parseInt(categoryId.replace('category_', ''));
    
    // This would be enhanced with actual category filtering
    return await this.handleViewServices(context);
  }

  /**
   * Handle routing code messages (S1234, BOOK_AT_S1234, etc.)
   */
  private async handleRoutingCodeMessage(
    messageText: string,
    context: MessageRouterContext
  ): Promise<WhatsAppMessage> {
    const routingResult = await this.messageRouting.parseRoutingMessage({ message: messageText });

    if (!routingResult.success || !routingResult.business) {
      return this.responseTransformer.createErrorResponse(
        routingResult.suggestedMessage || 'Invalid business code. Please check and try again.'
      );
    }

    // Update session with business context
    await this.customerSession.setBusinessContext(context.sessionId, routingResult.business.id);

    // Create business connection response
    return this.responseTransformer.createBusinessConnectionResponse(routingResult.business);
  }

  /**
   * Handle "view services" action
   */
  private async handleViewServices(context: MessageRouterContext): Promise<WhatsAppMessage> {
    if (!context.businessId) {
      return this.responseTransformer.createErrorResponse('Please select a business first by sending a routing code like "S1234".');
    }

    try {
      const services = await this.businessApiRouter.getBusinessServices(context.businessId);
      return this.responseTransformer.createServicesListResponse(services);
    } catch (error) {
      this.logger.error(`Failed to get services for business ${context.businessId}:`, error);
      return this.responseTransformer.createErrorResponse('Unable to load services. Please try again later.');
    }
  }

  /**
   * Handle "book appointment" action
   */
  private async handleBookAppointment(context: MessageRouterContext): Promise<WhatsAppMessage> {
    if (!context.businessId) {
      return this.responseTransformer.createErrorResponse('Please select a business first by sending a routing code like "S1234".');
    }

    // Transition to service selection
    await this.customerSession.updateSessionState(
      context.sessionId, 
      CustomerSessionState.SERVICE_SELECTION
    );

    return await this.handleViewServices(context);
  }

  /**
   * Handle "view hours" action
   */
  private async handleViewHours(context: MessageRouterContext): Promise<WhatsAppMessage> {
    if (!context.businessId) {
      return this.responseTransformer.createErrorResponse('Please select a business first by sending a routing code like "S1234".');
    }

    try {
      const business = await this.businessApiRouter.getBusinessById(context.businessId);
      return this.responseTransformer.createBusinessHoursResponse(business);
    } catch (error) {
      this.logger.error(`Failed to get business hours for ${context.businessId}:`, error);
      return this.responseTransformer.createErrorResponse('Unable to load business hours. Please try again later.');
    }
  }

  /**
   * Handle service selection from list
   */
  private async handleServiceSelection(
    serviceId: string,
    context: MessageRouterContext
  ): Promise<WhatsAppMessage> {
    // Extract service ID from format "service_ID"
    const actualServiceId = serviceId.replace('service_', '');
    
    // Update session with selected service
    const updatedSessionData = {
      ...context.sessionData,
      selectedServiceId: actualServiceId
    };

    await this.customerSession.updateSessionState(
      context.sessionId,
      CustomerSessionState.TIME_SELECTION,
      updatedSessionData
    );

    // Get available time slots
    try {
      const timeSlots = await this.businessApiRouter.getAvailableTimeSlots(
        context.businessId!,
        undefined,
        { serviceId: actualServiceId }
      );
      
      return this.responseTransformer.createTimeSlotsResponse(timeSlots);
    } catch (error) {
      this.logger.error(`Failed to get time slots:`, error);
      return this.responseTransformer.createErrorResponse('Unable to load available times. Please try again.');
    }
  }

  /**
   * Handle time selection
   */
  private async handleTimeSelection(
    timeId: string,
    context: MessageRouterContext
  ): Promise<WhatsAppMessage> {
    // Extract time from format "time_HHMM"
    const timeSlot = timeId.replace('time_', '').replace(/(\d{2})(\d{2})/, '$1:$2');
    
    // Update session with selected time
    const updatedSessionData = {
      ...context.sessionData,
      selectedTimeSlot: timeSlot
    };

    await this.customerSession.updateSessionState(
      context.sessionId,
      CustomerSessionState.BOOKING_CONFIRMATION,
      updatedSessionData
    );

    // Create booking confirmation message
    const bookingDetails = {
      id: `booking_${Date.now()}`,
      service: { name: 'Selected Service' }, // Would get from session data
      time: timeSlot,
      date: 'Today',
      price: 'See service details'
    };

    return this.responseTransformer.createBookingConfirmationResponse(bookingDetails);
  }

  /**
   * Handle main menu navigation
   */
  private async handleMainMenu(context: MessageRouterContext): Promise<WhatsAppMessage> {
    if (!context.businessId) {
      return this.responseTransformer.createWelcomeMessage();
    }

    // Reset to business selected state
    await this.customerSession.updateSessionState(
      context.sessionId,
      CustomerSessionState.BUSINESS_SELECTED
    );

    try {
      const business = await this.businessApiRouter.getBusinessById(context.businessId);
      return this.responseTransformer.createBusinessMenuResponse(business.name);
    } catch (error) {
      return this.responseTransformer.createWelcomeMessage();
    }
  }

  /**
   * Handle try again action
   */
  private async handleTryAgain(context: MessageRouterContext): Promise<WhatsAppMessage> {
    // Restart the current flow based on state
    switch (context.currentState) {
      case CustomerSessionState.SERVICE_SELECTION:
        return await this.handleViewServices(context);
      
      case CustomerSessionState.TIME_SELECTION:
        return await this.handleBookAppointment(context);
      
      default:
        return await this.handleMainMenu(context);
    }
  }

  /**
   * Handle text in initial state (expecting routing code)
   */
  private handleInitialStateText(messageText: string, context: MessageRouterContext): WhatsAppMessage {
    return this.responseTransformer.createWelcomeMessage();
  }

  /**
   * Handle text when business is selected
   */
  private handleBusinessSelectedText(messageText: string, context: MessageRouterContext): WhatsAppMessage {
    // Parse common intents
    const lowerText = messageText.toLowerCase();
    
    if (lowerText.includes('service') || lowerText.includes('book') || lowerText.includes('appointment')) {
      return this.responseTransformer.createBusinessMenuResponse('Business');
    }
    
    if (lowerText.includes('hour') || lowerText.includes('time') || lowerText.includes('open')) {
      return this.responseTransformer.createBusinessMenuResponse('Business');
    }
    
    return this.responseTransformer.createBusinessMenuResponse('Business');
  }

  /**
   * Handle text during service selection
   */
  private handleServiceSelectionText(messageText: string, context: MessageRouterContext): WhatsAppMessage {
    return this.responseTransformer.createErrorResponse(
      'Please select a service from the list above, or use the main menu.'
    );
  }

  /**
   * Handle text during time selection
   */
  private handleTimeSelectionText(messageText: string, context: MessageRouterContext): WhatsAppMessage {
    return this.responseTransformer.createErrorResponse(
      'Please select an available time slot from the options above.'
    );
  }

  /**
   * Handle text during booking confirmation
   */
  private handleBookingConfirmationText(messageText: string, context: MessageRouterContext): WhatsAppMessage {
    const lowerText = messageText.toLowerCase();
    
    if (lowerText.includes('yes') || lowerText.includes('confirm') || lowerText.includes('book')) {
      // TODO: Create actual booking
      return this.responseTransformer.createBookingConfirmationResponse({
        id: `booking_${Date.now()}`,
        service: { name: 'Selected Service' },
        time: context.sessionData?.selectedTimeSlot || 'Selected Time',
        date: 'Today',
        price: 'Service Price'
      });
    }
    
    if (lowerText.includes('no') || lowerText.includes('cancel')) {
      return this.responseTransformer.createBusinessMenuResponse('Business');
    }
    
    return this.responseTransformer.createErrorResponse(
      'Please confirm your booking by typing "yes" or "confirm", or "no" to cancel.'
    );
  }

  /**
   * Get conversation flow definition for state
   */
  private getConversationFlow(state: CustomerSessionState): ConversationFlow {
    const flows: Record<CustomerSessionState, ConversationFlow> = {
      [CustomerSessionState.INITIAL]: {
        currentState: state,
        nextState: CustomerSessionState.BUSINESS_SELECTED,
        requiresBusinessContext: false,
        expectedInput: 'routing_code'
      },
      [CustomerSessionState.BUSINESS_SELECTED]: {
        currentState: state,
        nextState: CustomerSessionState.SERVICE_SELECTION,
        requiresBusinessContext: true
      },
      [CustomerSessionState.SERVICE_SELECTION]: {
        currentState: state,
        nextState: CustomerSessionState.TIME_SELECTION,
        requiresBusinessContext: true,
        expectedInput: 'service_selection'
      },
      [CustomerSessionState.TIME_SELECTION]: {
        currentState: state,
        nextState: CustomerSessionState.BOOKING_CONFIRMATION,
        requiresBusinessContext: true,
        expectedInput: 'time_selection'
      },
      [CustomerSessionState.BOOKING_CONFIRMATION]: {
        currentState: state,
        nextState: CustomerSessionState.BOOKING_COMPLETE,
        requiresBusinessContext: true,
        expectedInput: 'confirmation'
      },
      [CustomerSessionState.BOOKING_COMPLETE]: {
        currentState: state,
        requiresBusinessContext: true
      },
      [CustomerSessionState.EXPIRED]: {
        currentState: state,
        nextState: CustomerSessionState.INITIAL,
        requiresBusinessContext: false
      }
    };

    return flows[state] || flows[CustomerSessionState.INITIAL];
  }

  /**
   * Validate message context for current state
   */
  validateMessageContext(context: MessageRouterContext): boolean {
    const flow = this.getConversationFlow(context.currentState);
    
    if (flow.requiresBusinessContext && !context.businessId) {
      return false;
    }
    
    return true;
  }

  /**
   * Get expected message types for current state
   */
  getExpectedMessageTypes(state: CustomerSessionState): string[] {
    switch (state) {
      case CustomerSessionState.INITIAL:
        return ['text']; // Routing codes
      
      case CustomerSessionState.BUSINESS_SELECTED:
        return ['interactive', 'text']; // Menu selections
      
      case CustomerSessionState.SERVICE_SELECTION:
        return ['interactive']; // List selections
      
      case CustomerSessionState.TIME_SELECTION:
        return ['interactive']; // Button or list selections
      
      case CustomerSessionState.BOOKING_CONFIRMATION:
        return ['text', 'interactive']; // Confirmation text or buttons
      
      default:
        return ['text', 'interactive'];
    }
  }
}