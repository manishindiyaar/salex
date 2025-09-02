import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma.service';
import { BookingService } from '../../booking/booking.service';
import { BusinessService } from '../../business/business.service';
import { ServiceService } from '../../service/service.service';
import { TimeSlotsService } from '../../timeslots/timeslots.service';
import { 
  WhatsAppOutgoingMessage, 
  WhatsAppInteractiveMessage,
  CustomerSessionState,
  BookingStatus
} from 'shared-types';





export interface BookingFlowState {
  step: 'GREETING' | 'CONNECTING' | 'SERVICES' | 'TIMESLOTS' | 'CONFIRMATION' | 'BOOKING_COMPLETE' | 'MY_BOOKINGS' | 'CANCEL_BOOKING';
  businessId?: string;
  selectedServiceId?: string;
  selectedTimeSlot?: string;
  selectedDate?: string;
  bookingId?: string;
  customerName?: string;
  previousStep?: string;
}

@Injectable()
export class BookingFlowService {
  private readonly logger = new Logger(BookingFlowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingService: BookingService,
    private readonly businessService: BusinessService,
    private readonly serviceService: ServiceService,
    private readonly timeSlotsService: TimeSlotsService,
  ) {}

  async processBookingMessage(
    customerPhone: string,
    messageText: string,
    interactiveData?: any,
    currentState?: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    this.logger.debug(`Processing booking message for ${customerPhone}: "${messageText}"`);

    try {
      const state = currentState || { step: 'GREETING' };
      
      // Handle interactive responses
      if (interactiveData) {
        return await this.handleInteractiveResponse(customerPhone, interactiveData, state);
      }

      // Handle text messages
      return await this.handleTextMessage(customerPhone, messageText, state);
    } catch (error) {
      this.logger.error(`Error processing booking message: ${error.message}`, error.stack);
      return [this.createErrorMessage()];
    }
  }

  private async handleTextMessage(
    customerPhone: string,
    messageText: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    const text = messageText.toLowerCase().trim();

    switch (state.step) {
      case 'GREETING':
        if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
          return [this.createGreetingMessage()];
        }
        // Check if message contains routing code
        const routingCode = this.extractRoutingCode(messageText);
        if (routingCode) {
          return await this.connectToBusiness(customerPhone, routingCode);
        }
        return [this.createRoutingCodePrompt()];

      case 'CONNECTING':
        const code = this.extractRoutingCode(messageText);
        if (code) {
          return await this.connectToBusiness(customerPhone, code);
        }
        return [this.createInvalidCodeMessage()];

      default:
        // For other states, routing code should work as a reset
        const resetCode = this.extractRoutingCode(messageText);
        if (resetCode) {
          return await this.connectToBusiness(customerPhone, resetCode);
        }
        return [this.createUnknownCommandMessage(state)];
    }
  }

  private async handleInteractiveResponse(
    customerPhone: string,
    interactiveData: any,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    const { type, button_reply, list_reply } = interactiveData;
    
    if (button_reply) {
      return await this.handleButtonClick(customerPhone, button_reply.id, state);
    }
    
    if (list_reply) {
      return await this.handleListSelection(customerPhone, list_reply.id, state);
    }

    return [this.createErrorMessage()];
  }

  private async handleButtonClick(
    customerPhone: string,
    buttonId: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    this.logger.debug(`Button clicked: ${buttonId}, current step: ${state.step}`);

    switch (buttonId) {
      case 'btn_home':
        if (state.businessId) {
          return await this.showServicesMenu(customerPhone, state.businessId);
        }
        return [this.createGreetingMessage()];

      case 'btn_back':
        return await this.goToPreviousStep(customerPhone, state);

      case 'btn_book_service':
        return await this.showServicesMenu(customerPhone, state.businessId!);

      case 'btn_my_bookings':
        return await this.showMyBookings(customerPhone, state);

      case 'btn_confirm_booking':
        return await this.confirmBooking(customerPhone, state);

      case 'btn_cancel_booking':
        return await this.showCancelConfirmation(customerPhone, state);

      case 'btn_confirm_cancel':
        return await this.cancelBooking(customerPhone, state);

      default:
        return [this.createUnknownCommandMessage(state)];
    }
  }

  private async handleListSelection(
    customerPhone: string,
    selectionId: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    this.logger.debug(`List selection: ${selectionId}, current step: ${state.step}`);

    const [type, id] = selectionId.split('_');

    switch (type) {
      case 'service':
        return await this.selectService(customerPhone, id, state);

      case 'timeslot':
        return await this.selectTimeSlot(customerPhone, selectionId, state);

      case 'booking':
        return await this.showBookingDetails(customerPhone, id, state);

      default:
        return [this.createUnknownCommandMessage(state)];
    }
  }

  private async connectToBusiness(
    customerPhone: string,
    routingCode: string
  ): Promise<WhatsAppOutgoingMessage[]> {
    try {
      // Find business by routing code
      const business = await this.prisma.business.findUnique({
        where: { routingCode: routingCode },
        include: { services: true }
      });

      if (!business) {
        return [this.createBusinessNotFoundMessage(routingCode)];
      }

      // Update session state
      const newState: BookingFlowState = {
        step: 'SERVICES',
        businessId: business.id,
        previousStep: 'CONNECTING'
      };
      await this.saveSessionState(customerPhone, newState);

      return [
        this.createConnectionSuccessMessage(business.name),
        await this.createServicesListMessage(business.id)
      ];
    } catch (error) {
      this.logger.error(`Error connecting to business: ${error.message}`);
      return [this.createErrorMessage()];
    }
  }

  private async showServicesMenu(
    customerPhone: string,
    businessId: string
  ): Promise<WhatsAppOutgoingMessage[]> {
    const newState: BookingFlowState = {
      step: 'SERVICES',
      businessId: businessId,
      previousStep: 'GREETING'
    };
    await this.saveSessionState(customerPhone, newState);

    return [await this.createServicesListMessage(businessId)];
  }

  private async selectService(
    customerPhone: string,
    serviceId: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    const newState: BookingFlowState = {
      ...state,
      step: 'TIMESLOTS',
      selectedServiceId: serviceId,
      previousStep: 'SERVICES'
    };
    await this.saveSessionState(customerPhone, newState);

    return [await this.createTimeSlotsMessage(state.businessId!, serviceId)];
  }

  private async selectTimeSlot(
    customerPhone: string,
    timeSlotId: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    // Parse timeSlotId: "timeslot_2024-08-05_09:00"
    const [_, date, time] = timeSlotId.split('_');
    
    const newState: BookingFlowState = {
      ...state,
      step: 'CONFIRMATION',
      selectedTimeSlot: time,
      selectedDate: date,
      previousStep: 'TIMESLOTS'
    };
    await this.saveSessionState(customerPhone, newState);

    return [await this.createBookingConfirmationMessage(customerPhone, newState)];
  }

  private async confirmBooking(
    customerPhone: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    try {
      // Create booking using the booking service
      const scheduledAt = `${state.selectedDate}T${state.selectedTimeSlot}:00.000Z`;
      
      const booking = await this.bookingService.createBooking(state.businessId!, {
        serviceId: state.selectedServiceId!,
        customerPhone: customerPhone,
        scheduledAt: scheduledAt,
        notes: 'Booked via WhatsApp',
        customerName: state.customerName
      });

      const newState: BookingFlowState = {
        ...state,
        step: 'BOOKING_COMPLETE',
        bookingId: booking.id,
        previousStep: 'CONFIRMATION'
      };
      await this.saveSessionState(customerPhone, newState);

      return [this.createBookingSuccessMessage(booking)];
    } catch (error) {
      this.logger.error(`Error creating booking: ${error.message}`);
      return [this.createBookingErrorMessage(error.message)];
    }
  }

  private async showMyBookings(
    customerPhone: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    try {
      const bookings = await this.bookingService.getCustomerBookings(customerPhone);
      
      const newState: BookingFlowState = {
        ...state,
        step: 'MY_BOOKINGS',
        previousStep: state.step
      };
      await this.saveSessionState(customerPhone, newState);

      if (bookings.length === 0) {
        return [this.createNoBookingsMessage()];
      }

      return [this.createMyBookingsMessage(bookings)];
    } catch (error) {
      this.logger.error(`Error fetching bookings: ${error.message}`);
      return [this.createErrorMessage()];
    }
  }

  private async cancelBooking(
    customerPhone: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    try {
      if (!state.bookingId) {
        return [this.createErrorMessage()];
      }

      await this.bookingService.cancelBooking(state.bookingId, 'USER');
      
      return [this.createBookingCancelledMessage()];
    } catch (error) {
      this.logger.error(`Error cancelling booking: ${error.message}`);
      return [this.createBookingErrorMessage(error.message)];
    }
  }

  private async goToPreviousStep(
    customerPhone: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    switch (state.previousStep) {
      case 'SERVICES':
        return await this.showServicesMenu(customerPhone, state.businessId!);
      case 'TIMESLOTS':
        return await this.selectService(customerPhone, state.selectedServiceId!, state);
      case 'CONFIRMATION':
        return [await this.createTimeSlotsMessage(state.businessId!, state.selectedServiceId!)];
      default:
        return [this.createGreetingMessage()];
    }
  }

  // Message Creation Methods

  private createGreetingMessage(): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "text",
      text: {
        body: "👋 Hello! Welcome to SaleX booking system.\n\nTo book an appointment, please share your business routing code (e.g., S1234 or 1234)."
      }
    };
  }

  private createRoutingCodePrompt(): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "text",
      text: {
        body: "Please share your business routing code to get started (e.g., S1234 or 1234)."
      }
    };
  }

  private createConnectionSuccessMessage(businessName: string): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "text",
      text: {
        body: `✅ Connected to ${businessName}!\n\nChoose an option below to continue.`
      }
    };
  }

  private async createServicesListMessage(businessId: string): Promise<WhatsAppOutgoingMessage> {
    try {
      const servicesResponse = await this.serviceService.getBusinessServicesPublic(businessId);
      const services = servicesResponse.services;

      if (services.length === 0) {
        return {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: "",
          type: "text",
          text: {
            body: "No services available at this time. Please contact the business directly."
          }
        };
      }

      const interactive: WhatsAppInteractiveMessage = {
        type: "list",
        header: {
          type: "text",
          text: "📋 Available Services"
        },
        body: {
          text: "Choose a service you'd like to book:"
        },
        footer: {
          text: "SaleX Booking System"
        },
        action: {
          button: "Select Service",
          sections: [{
            title: "Services",
            rows: services.slice(0, 10).map(service => ({
              id: `service_${service.id}`,
              title: service.name,
              description: `₹${service.price} • ${service.durationMinutes}min`
            }))
          }]
        }
      };

      return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "",
        type: "interactive",
        interactive: interactive
      };
    } catch (error) {
      this.logger.error(`Error creating services list: ${error.message}`);
      return this.createErrorMessage();
    }
  }

  private async createTimeSlotsMessage(businessId: string, serviceId: string): Promise<WhatsAppOutgoingMessage> {
    try {
      // Get available time slots for the next 7 days
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 6);

      const timeSlotsResponse = await this.timeSlotsService.getAvailableSlots({
        businessId,
        serviceId,
        startDate: today.toISOString().split('T')[0],
        endDate: nextWeek.toISOString().split('T')[0],
        slotInterval: 60
      });

      const availableSlots = timeSlotsResponse.slots.filter(slot => slot.available).slice(0, 20);

      if (availableSlots.length === 0) {
        return {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: "",
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text: "❌ No available time slots found for the next 7 days.\n\nPlease try again later or contact the business directly."
            },
            action: {
              buttons: [
                {
                  type: "reply",
                  reply: { id: "btn_back", title: "◀️ Back to Services" }
                },
                {
                  type: "reply",
                  reply: { id: "btn_home", title: "🏠 Home" }
                }
              ]
            }
          }
        };
      }

      const interactive: WhatsAppInteractiveMessage = {
        type: "list",
        header: {
          type: "text",
          text: "🕐 Available Time Slots"
        },
        body: {
          text: "Choose your preferred date and time:"
        },
        footer: {
          text: "Please arrive 15 minutes early"
        },
        action: {
          button: "Select Time",
          sections: [{
            title: "Available Slots",
            rows: availableSlots.map(slot => ({
              id: `timeslot_${slot.date}_${slot.startTime}`,
              title: `${this.formatDate(slot.date)} at ${this.formatTime(slot.startTime)}`,
              description: `${slot.duration} minutes`
            }))
          }]
        }
      };

      return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "",
        type: "interactive",
        interactive: interactive
      };
    } catch (error) {
      this.logger.error(`Error creating time slots message: ${error.message}`);
      return this.createErrorMessage();
    }
  }

  private async createBookingConfirmationMessage(
    customerPhone: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage> {
    try {
      // Get service details
      const service = await this.serviceService.getServiceByIdPublic(state.businessId!, state.selectedServiceId!);
      const business = await this.businessService.getBusinessByIdPublic(state.businessId!);

      const interactive: WhatsAppInteractiveMessage = {
        type: "button",
        header: {
          type: "text",
          text: "📋 Booking Confirmation"
        },
        body: {
          text: `Please confirm your booking details:\n\n` +
                `🏢 Business: ${business.name}\n` +
                `📋 Service: ${service.name}\n` +
                `💰 Price: ₹${service.price}\n` +
                `⏱️ Duration: ${service.durationMinutes} minutes\n` +
                `📅 Date: ${this.formatDate(state.selectedDate!)}\n` +
                `🕐 Time: ${this.formatTime(state.selectedTimeSlot!)}\n\n` +
                `⚠️ Please arrive 15 minutes before your appointment time.`
        },
        footer: {
          text: "Tap Confirm to book your appointment"
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: { id: "btn_confirm_booking", title: "✅ Confirm Booking" }
            },
            {
              type: "reply",
              reply: { id: "btn_back", title: "◀️ Back" }
            },
            {
              type: "reply",
              reply: { id: "btn_home", title: "🏠 Home" }
            }
          ]
        }
      };

      return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "",
        type: "interactive",
        interactive: interactive
      };
    } catch (error) {
      this.logger.error(`Error creating confirmation message: ${error.message}`);
      return this.createErrorMessage();
    }
  }

  private createBookingSuccessMessage(booking: any): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "interactive",
      interactive: {
        type: "button",
        header: {
          type: "text",
          text: "✅ Booking Confirmed!"
        },
        body: {
          text: `Your appointment has been successfully booked!\n\n` +
                `📋 Booking ID: ${booking.id.slice(-8)}\n` +
                `📅 Date: ${this.formatDate(booking.scheduledAt.split('T')[0])}\n` +
                `🕐 Time: ${this.formatTime(booking.scheduledAt.split('T')[1].slice(0, 5))}\n\n` +
                `Please arrive 15 minutes before your scheduled time.\n\n` +
                `Save this message for your records.`
        },
        footer: {
          text: "Thank you for choosing our service!"
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: { id: "btn_book_service", title: "📅 Book Another" }
            },
            {
              type: "reply",
              reply: { id: "btn_my_bookings", title: "📋 My Bookings" }
            },
            {
              type: "reply",
              reply: { id: "btn_home", title: "🏠 Home" }
            }
          ]
        }
      }
    };
  }

  private createMyBookingsMessage(bookings: any[]): WhatsAppOutgoingMessage {
    const activeBookings = bookings.filter(b => 
      b.status === BookingStatus.PENDING || b.status === BookingStatus.CONFIRMED
    );

    if (activeBookings.length === 0) {
      return this.createNoBookingsMessage();
    }

    const interactive: WhatsAppInteractiveMessage = {
      type: "list",
      header: {
        type: "text",
        text: "📋 My Bookings"
      },
      body: {
        text: "Here are your upcoming appointments:"
      },
      footer: {
        text: "Tap to view details"
      },
      action: {
        button: "View Booking",
        sections: [{
          title: "Upcoming Appointments",
          rows: activeBookings.slice(0, 10).map(booking => ({
            id: `booking_${booking.id}`,
            title: `${booking.service?.name || 'Service'}`,
            description: `${this.formatDate(booking.scheduledAt.split('T')[0])} at ${this.formatTime(booking.scheduledAt.split('T')[1].slice(0, 5))}`
          }))
        }]
      }
    };

    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "interactive",
      interactive: interactive
    };
  }

  private createNoBookingsMessage(): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "📋 You don't have any upcoming bookings.\n\nWould you like to book an appointment?"
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: { id: "btn_book_service", title: "📅 Book Now" }
            },
            {
              type: "reply",
              reply: { id: "btn_home", title: "🏠 Home" }
            }
          ]
        }
      }
    };
  }

  // Utility Methods

  private extractRoutingCode(message: string): string | null {
    const patterns = [
      /[sS](\d{4})/,           // S1234, s1234
      /(\d{4})/,               // 1234
      /BOOK_AT_[sS]?(\d{4})/   // BOOK_AT_S1234, BOOK_AT_1234
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  private formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  private async saveSessionState(customerPhone: string, state: BookingFlowState): Promise<void> {
    try {
      // Save state to customer session
      await this.prisma.customerSession.upsert({
        where: { customerPhone },
        update: {
          sessionData: state as any,
          currentState: state.step,
          lastMessageAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        create: {
          customerPhone,
          currentState: state.step,
          sessionData: state as any,
          lastMessageAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          businessId: state.businessId,
        }
      });
    } catch (error) {
      this.logger.error(`Error saving session state: ${error.message}`);
    }
  }

  private async getSessionState(customerPhone: string): Promise<BookingFlowState | null> {
    try {
      const session = await this.prisma.customerSession.findUnique({
        where: { customerPhone }
      });

      if (!session || !session.sessionData) {
        return null;
      }

      return session.sessionData as any as BookingFlowState;
    } catch (error) {
      this.logger.error(`Error getting session state: ${error.message}`);
      return null;
    }
  }

  // Error Messages

  private createBusinessNotFoundMessage(routingCode: string): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "text",
      text: {
        body: `❌ Business with code "${routingCode}" not found.\n\nPlease check the code and try again.`
      }
    };
  }

  private createInvalidCodeMessage(): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "text",
      text: {
        body: "❌ Invalid routing code format.\n\nPlease enter a 4-digit code (e.g., S1234 or 1234)."
      }
    };
  }

  private createErrorMessage(): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "text",
      text: {
        body: "❌ Something went wrong. Please try again or contact support."
      }
    };
  }

  private createUnknownCommandMessage(state: BookingFlowState): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "❓ I didn't understand that command.\n\nUse the buttons below to navigate:"
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: { id: "btn_home", title: "🏠 Home" }
            },
            {
              type: "reply",
              reply: { id: "btn_back", title: "◀️ Back" }
            }
          ]
        }
      }
    };
  }

  private createBookingErrorMessage(errorMessage: string): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: `❌ Booking failed: ${errorMessage}\n\nPlease try again or choose a different time slot.`
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: { id: "btn_back", title: "◀️ Try Again" }
            },
            {
              type: "reply",
              reply: { id: "btn_home", title: "🏠 Home" }
            }
          ]
        }
      }
    };
  }

  private createBookingCancelledMessage(): WhatsAppOutgoingMessage {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "interactive",
      interactive: {
        type: "button",
        header: {
          type: "text",
          text: "✅ Booking Cancelled"
        },
        body: {
          text: "Your appointment has been successfully cancelled.\n\nIf you need to book again, you can do so anytime."
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: { id: "btn_book_service", title: "📅 Book New" }
            },
            {
              type: "reply",
              reply: { id: "btn_home", title: "🏠 Home" }
            }
          ]
        }
      }
    };
  }

  private async showBookingDetails(
    customerPhone: string,
    bookingId: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    try {
      const booking = await this.bookingService.getBookingById(bookingId, true);
      
      const newState: BookingFlowState = {
        ...state,
        bookingId: bookingId,
        previousStep: 'MY_BOOKINGS'
      };
      await this.saveSessionState(customerPhone, newState);

      const interactive: WhatsAppInteractiveMessage = {
        type: "button",
        header: {
          type: "text",
          text: "📋 Booking Details"
        },
        body: {
          text: `📋 Booking ID: ${booking.id.slice(-8)}\n` +
                `🏢 Business: ${booking.business?.name}\n` +
                `📋 Service: ${booking.service?.name}\n` +
                `💰 Price: ₹${booking.service?.price}\n` +
                `📅 Date: ${this.formatDate(booking.scheduledAt.split('T')[0])}\n` +
                `🕐 Time: ${this.formatTime(booking.scheduledAt.split('T')[1].slice(0, 5))}\n` +
                `📊 Status: ${booking.status}\n\n` +
                `Please arrive 15 minutes early.`
        },
        action: {
          buttons: booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED
            ? [
                {
                  type: "reply",
                  reply: { id: "btn_cancel_booking", title: "❌ Cancel Booking" }
                },
                {
                  type: "reply",
                  reply: { id: "btn_back", title: "◀️ Back" }
                },
                {
                  type: "reply",
                  reply: { id: "btn_home", title: "🏠 Home" }
                }
              ]
            : [
                {
                  type: "reply",
                  reply: { id: "btn_back", title: "◀️ Back" }
                },
                {
                  type: "reply",
                  reply: { id: "btn_home", title: "🏠 Home" }
                }
              ]
        }
      };

      return [{
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "",
        type: "interactive",
        interactive: interactive
      }];
    } catch (error) {
      this.logger.error(`Error showing booking details: ${error.message}`);
      return [this.createErrorMessage()];
    }
  }

  private async showCancelConfirmation(
    customerPhone: string,
    state: BookingFlowState
  ): Promise<WhatsAppOutgoingMessage[]> {
    const interactive: WhatsAppInteractiveMessage = {
      type: "button",
      header: {
        type: "text",
        text: "⚠️ Cancel Booking"
      },
      body: {
        text: "Are you sure you want to cancel this booking?\n\nThis action cannot be undone."
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: { id: "btn_confirm_cancel", title: "✅ Yes, Cancel" }
          },
          {
            type: "reply",
            reply: { id: "btn_back", title: "◀️ Keep Booking" }
          }
        ]
      }
    };

    return [{
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "",
      type: "interactive",
      interactive: interactive
    }];
  }
}