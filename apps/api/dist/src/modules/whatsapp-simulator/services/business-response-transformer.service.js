"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BusinessResponseTransformerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessResponseTransformerService = void 0;
const common_1 = require("@nestjs/common");
let BusinessResponseTransformerService = BusinessResponseTransformerService_1 = class BusinessResponseTransformerService {
    constructor() {
        this.logger = new common_1.Logger(BusinessResponseTransformerService_1.name);
    }
    createBusinessConnectionResponse(business) {
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
    createServicesListResponse(services) {
        this.logger.debug(`Creating services list response for ${services.length} services`);
        if (!services || services.length === 0) {
            return {
                type: 'text',
                text: {
                    body: 'Sorry, no services are currently available. Please contact us directly or try again later.'
                }
            };
        }
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
    createTimeSlotsResponse(timeSlots) {
        this.logger.debug(`Creating time slots response for ${timeSlots.length} slots`);
        if (!timeSlots || timeSlots.length === 0) {
            return {
                type: 'text',
                text: {
                    body: 'Sorry, no available time slots found for the selected service. Please try a different date or contact us directly.'
                }
            };
        }
        const availableSlots = timeSlots.slice(0, 3);
        if (availableSlots.length <= 3) {
            const buttons = availableSlots.map(slot => ({
                type: 'reply',
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
        }
        else {
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
    createBusinessHoursResponse(hours) {
        this.logger.debug('Creating business hours response');
        let hoursText = '🕒 *Business Hours*\n\n';
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.forEach((day, index) => {
            const dayHours = hours.hoursOfOperation?.[day];
            if (dayHours) {
                if (dayHours.closed) {
                    hoursText += `${dayNames[index]}: Closed\n`;
                }
                else {
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
    createBookingConfirmationResponse(booking) {
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
    createBusinessMenuResponse(businessName) {
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
    createErrorResponse(errorMessage) {
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
    createGenericHelpResponse() {
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
    createWelcomeMessage() {
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
    createQuickReplyMessage(bodyText, quickReplies) {
        this.logger.debug(`Creating quick reply message with ${quickReplies.length} options`);
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
                        type: 'reply',
                        reply: {
                            id: reply.id,
                            title: reply.title
                        }
                    }))
                }
            }
        };
    }
    createBookingFlowQuickReplies(businessName) {
        this.logger.debug(`Creating booking flow quick replies for: ${businessName}`);
        return this.createQuickReplyMessage(`Welcome to ${businessName}! 🏪\n\nHow would you like to proceed?`, [
            { id: 'quick_book', title: '⚡ Quick Book' },
            { id: 'view_services', title: '📋 Browse Services' },
            { id: 'view_hours', title: '🕒 Hours & Info' }
        ]);
    }
    createServiceCategoryQuickReplies(categories) {
        this.logger.debug(`Creating service category quick replies for ${categories.length} categories`);
        const quickReplies = categories.slice(0, 3).map((category, index) => ({
            id: `category_${index}`,
            title: category
        }));
        return this.createQuickReplyMessage('What type of service are you looking for?', quickReplies);
    }
    transformApiResponse(apiResponse, messageType) {
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
    validateWhatsAppMessage(message) {
        try {
            if (!message.type)
                return false;
            if (message.type === 'text' && !message.text?.body)
                return false;
            if (message.type === 'interactive') {
                if (!message.interactive?.type)
                    return false;
                if (message.interactive.type === 'button') {
                    const action = message.interactive.action;
                    if (!action?.buttons || action.buttons.length > 3) {
                        return false;
                    }
                }
                if (message.interactive.type === 'list') {
                    const action = message.interactive.action;
                    if (!action?.sections)
                        return false;
                }
                if (message.interactive.type === 'quick_reply') {
                    const action = message.interactive.action;
                    if (!action?.quick_replies || action.quick_replies.length > 3) {
                        return false;
                    }
                }
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Message validation failed: ${error.message}`);
            return false;
        }
    }
    getMessageContentForStorage(message) {
        return {
            type: message.type,
            content: message.type === 'text' ? message.text : message.interactive,
            nextState: message.nextState
        };
    }
};
exports.BusinessResponseTransformerService = BusinessResponseTransformerService;
exports.BusinessResponseTransformerService = BusinessResponseTransformerService = BusinessResponseTransformerService_1 = __decorate([
    (0, common_1.Injectable)()
], BusinessResponseTransformerService);
//# sourceMappingURL=business-response-transformer.service.js.map