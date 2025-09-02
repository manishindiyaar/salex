import { Injectable, Logger } from '@nestjs/common';

export interface WhatsAppInteractiveButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

export interface WhatsAppInteractiveList {
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: {
    button: string;
    sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };
}

export interface WhatsAppButtonAction {
  buttons: WhatsAppInteractiveButton[];
}

export interface WhatsAppListAction {
  button: string;
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
}

export interface WhatsAppQuickReplyAction {
  quick_replies: Array<{
    type: 'reply';
    reply: {
      id: string;
      title: string;
    };
  }>;
}

export interface WhatsAppMessage {
  type: 'text' | 'interactive';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button' | 'list' | 'quick_reply';
    body?: {
      text: string;
    };
    header?: {
      type: 'text';
      text: string;
    };
    footer?: {
      text: string;
    };
    action?: WhatsAppButtonAction | WhatsAppListAction | WhatsAppQuickReplyAction;
  };
  nextState?: string;
}

@Injectable()
export class BusinessResponseTransformerService {
  private readonly logger = new Logger(BusinessResponseTransformerService.name);

  /**
   * Create business connection response when routing code is recognized
   */
  createBusinessConnectionResponse(business: any): WhatsAppMessage {
    this.logger.debug(`Creating business connection response for: ${business.name}`);

    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: `Great! You've reached ${business.name} 💇‍♀️\n\nHow can I help you today?`
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'view_services',
                title: '📋 View Services'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'book_appointment',
                title: '📅 Book Now'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'view_hours',
                title: '🕒 Business Hours'
              }
            }
          ]
        }
      },
      nextState: 'business_connected'
    };
  }

  /**
   * Transform business services list into interactive list message
   */
  createServicesListResponse(services: any[]): WhatsAppMessage {
    this.logger.debug(`Creating services list response for ${services.length} services`);

    if (!services || services.length === 0) {
      return {
        type: 'text',
        text: {
          body: 'Sorry, no services are currently available. Please contact us directly or try again later.'
        }
      };
    }

    // Group services for better organization (optional)
    const serviceRows = services.map(service => ({
      id: `service_${service.id}`,
      title: `${service.name} - $${service.price}`,
      description: `${service.durationMinutes} min${service.description ? ` • ${service.description}` : ''}`
    }));

    return {
      type: 'interactive',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: 'Available Services'
        },
        body: {
          text: 'Please select a service you would like to book:'
        },
        footer: {
          text: 'Prices shown are in USD'
        },
        action: {
          button: 'Select Service',
          sections: [
            {
              title: 'Our Services',
              rows: serviceRows
            }
          ]
        }
      },
      nextState: 'service_selection'
    };
  }

  /**
   * Transform time slots into button selection message
   */
  createTimeSlotsResponse(timeSlots: any[]): WhatsAppMessage {
    this.logger.debug(`Creating time slots response for ${timeSlots.length} slots`);

    if (!timeSlots || timeSlots.length === 0) {
      return {
        type: 'text',
        text: {
          body: 'Sorry, no available time slots found for the selected service. Please try a different date or contact us directly.'
        }
      };
    }

    // Take up to 3 time slots for buttons (WhatsApp limit)
    const availableSlots = timeSlots.slice(0, 3);

    if (availableSlots.length <= 3) {
      // Use buttons for 3 or fewer slots
      const buttons = availableSlots.map(slot => ({
        type: 'reply' as const,
        reply: {
          id: `time_${slot.time.replace(':', '')}`,
          title: slot.time
        }
      }));

      return {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: `Available time slots for today:\n\nPlease select your preferred time:`
          },
          action: {
            buttons
          }
        },
        nextState: 'time_selection'
      };
    } else {
      // Use list for more than 3 slots
      const timeRows = timeSlots.map(slot => ({
        id: `time_${slot.time.replace(':', '')}`,
        title: slot.time,
        description: slot.available ? 'Available' : 'Limited availability'
      }));

      return {
        type: 'interactive',
        interactive: {
          type: 'list',
          header: {
            type: 'text',
            text: 'Available Times'
          },
          body: {
            text: 'Please select your preferred appointment time:'
          },
          action: {
            button: 'Select Time',
            sections: [
              {
                title: 'Today\'s Availability',
                rows: timeRows
              }
            ]
          }
        },
        nextState: 'time_selection'
      };
    }
  }

  /**
   * Create business hours response
   */
  createBusinessHoursResponse(hours: any): WhatsAppMessage {
    this.logger.debug('Creating business hours response');

    let hoursText = '🕒 *Business Hours*\n\n';
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    days.forEach((day, index) => {
      const dayHours = hours.hoursOfOperation?.[day];
      if (dayHours) {
        if (dayHours.closed) {
          hoursText += `${dayNames[index]}: Closed\n`;
        } else {
          hoursText += `${dayNames[index]}: ${dayHours.open} - ${dayHours.close}\n`;
        }
      }
    });

    hoursText += '\nIs there anything else I can help you with?';

    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: hoursText
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'view_services',
                title: '📋 View Services'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'book_appointment',
                title: '📅 Book Now'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'main_menu',
                title: '🏠 Main Menu'
              }
            }
          ]
        }
      }
    };
  }

  /**
   * Create booking confirmation response
   */
  createBookingConfirmationResponse(booking: any): WhatsAppMessage {
    this.logger.debug(`Creating booking confirmation response for booking: ${booking.id}`);

    const confirmationText = `✅ *Booking Confirmed!*\n\n` +
      `📋 Service: ${booking.service?.name || 'Selected Service'}\n` +
      `📅 Date: ${booking.date || 'Today'}\n` +
      `🕒 Time: ${booking.time || booking.timeSlot}\n` +
      `💰 Price: $${booking.price || booking.service?.price}\n\n` +
      `Your booking reference: *${booking.id}*\n\n` +
      `We look forward to seeing you! You'll receive a reminder closer to your appointment.`;

    return {
      type: 'text',
      text: {
        body: confirmationText
      },
      nextState: 'booking_completed'
    };
  }

  /**
   * Create business menu response with options
   */
  createBusinessMenuResponse(businessName: string): WhatsAppMessage {
    this.logger.debug(`Creating business menu response for: ${businessName}`);

    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: `Welcome to ${businessName}! 👋\n\nHow can I assist you today?`
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'view_services',
                title: '📋 View Services'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'view_hours',
                title: '🕒 Business Hours'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'help',
                title: '❓ Help'
              }
            }
          ]
        }
      }
    };
  }

  /**
   * Create error response message
   */
  createErrorResponse(errorMessage: string): WhatsAppMessage {
    this.logger.debug(`Creating error response: ${errorMessage}`);

    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: `❌ ${errorMessage}\n\nWhat would you like to do?`
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'try_again',
                title: '🔄 Try Again'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'main_menu',
                title: '🏠 Main Menu'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'help',
                title: '❓ Get Help'
              }
            }
          ]
        }
      }
    };
  }

  /**
   * Create generic help response
   */
  createGenericHelpResponse(): WhatsAppMessage {
    this.logger.debug('Creating generic help response');

    const helpText = `🤖 *How to use this service:*\n\n` +
      `1️⃣ Send your salon's code (like "S1234")\n` +
      `2️⃣ Browse available services\n` +
      `3️⃣ Select your preferred time\n` +
      `4️⃣ Confirm your booking\n\n` +
      `Need assistance? Just ask!`;

    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: helpText
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'start_booking',
                title: '📅 Start Booking'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'contact_support',
                title: '📞 Contact Support'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'main_menu',
                title: '🏠 Main Menu'
              }
            }
          ]
        }
      }
    };
  }

  /**
   * Create welcome message for new conversations
   */
  createWelcomeMessage(): WhatsAppMessage {
    this.logger.debug('Creating welcome message');

    const welcomeText = `Welcome to Salex! 👋\n\n` +
      `I'm here to help you book appointments at your favorite salons.\n\n` +
      `To get started, please send me your salon's booking code (like "S1234" or "BOOK_AT_S1234").`;

    return {
      type: 'text',
      text: {
        body: welcomeText
      },
      nextState: 'welcome'
    };
  }

  /**
   * Create quick reply message for fast interactions
   */
  createQuickReplyMessage(bodyText: string, quickReplies: Array<{ id: string; title: string }>): WhatsAppMessage {
    this.logger.debug(`Creating quick reply message with ${quickReplies.length} options`);

    // Limit to 3 quick replies as per WhatsApp API
    const limitedReplies = quickReplies.slice(0, 3);

    return {
      type: 'interactive',
      interactive: {
        type: 'quick_reply',
        body: {
          text: bodyText
        },
        action: {
          quick_replies: limitedReplies.map(reply => ({
            type: 'reply' as const,
            reply: {
              id: reply.id,
              title: reply.title
            }
          }))
        }
      }
    };
  }

  /**
   * Create booking flow quick actions
   */
  createBookingFlowQuickReplies(businessName: string): WhatsAppMessage {
    this.logger.debug(`Creating booking flow quick replies for: ${businessName}`);

    return this.createQuickReplyMessage(
      `Welcome to ${businessName}! 🏪\n\nHow would you like to proceed?`,
      [
        { id: 'quick_book', title: '⚡ Quick Book' },
        { id: 'view_services', title: '📋 Browse Services' },
        { id: 'view_hours', title: '🕒 Hours & Info' }
      ]
    );
  }

  /**
   * Create service category quick replies
   */
  createServiceCategoryQuickReplies(categories: string[]): WhatsAppMessage {
    this.logger.debug(`Creating service category quick replies for ${categories.length} categories`);

    const quickReplies = categories.slice(0, 3).map((category, index) => ({
      id: `category_${index}`,
      title: category
    }));

    return this.createQuickReplyMessage(
      'What type of service are you looking for?',
      quickReplies
    );
  }

  /**
   * Transform API response to WhatsApp message format
   */
  transformApiResponse(apiResponse: any, messageType: 'services' | 'timeslots' | 'hours' | 'booking'): WhatsAppMessage {
    this.logger.debug(`Transforming API response of type: ${messageType}`);

    switch (messageType) {
      case 'services':
        return this.createServicesListResponse(apiResponse.services || apiResponse);
      
      case 'timeslots':
        return this.createTimeSlotsResponse(apiResponse.timeSlots || apiResponse);
      
      case 'hours':
        return this.createBusinessHoursResponse(apiResponse);
      
      case 'booking':
        return this.createBookingConfirmationResponse(apiResponse);
      
      default:
        return this.createGenericHelpResponse();
    }
  }

  /**
   * Validate WhatsApp message structure
   */
  validateWhatsAppMessage(message: WhatsAppMessage): boolean {
    try {
      // Basic structure validation
      if (!message.type) return false;

      if (message.type === 'text' && !message.text?.body) return false;

      if (message.type === 'interactive') {
        if (!message.interactive?.type) return false;
        
        if (message.interactive.type === 'button') {
          const action = message.interactive.action as WhatsAppButtonAction;
          if (!action?.buttons || action.buttons.length > 3) {
            return false;
          }
        }
        
        if (message.interactive.type === 'list') {
          const action = message.interactive.action as WhatsAppListAction;
          if (!action?.sections) return false;
        }
        
        if (message.interactive.type === 'quick_reply') {
          const action = message.interactive.action as WhatsAppQuickReplyAction;
          if (!action?.quick_replies || action.quick_replies.length > 3) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Message validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get message content for storage
   */
  getMessageContentForStorage(message: WhatsAppMessage): any {
    return {
      type: message.type,
      content: message.type === 'text' ? message.text : message.interactive,
      nextState: message.nextState
    };
  }
}