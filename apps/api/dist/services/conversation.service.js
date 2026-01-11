"use strict";
/**
 * Conversation Service
 *
 * Manages WhatsApp conversation state machine for booking flow.
 *
 * State Machine:
 * GREETING → AWAITING_ROUTING_CODE → SERVICE_SELECTION → TIME_SELECTION → CONFIRMATION → COMPLETED
 *
 * Features:
 * - Customer upsert by phoneNumber
 * - Conversation upsert by customerPhone
 * - State persistence with contextData
 * - Routing code association
 * - 24-hour timeout reset
 * - Interactive message generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationService = void 0;
const shared_types_1 = require("@salex/shared-types");
const shared_types_2 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const booking_service_1 = require("./booking.service");
const business_service_1 = require("./business.service");
// 24 hours in milliseconds
const CONVERSATION_TIMEOUT_MS = 24 * 60 * 60 * 1000;
class ConversationService {
    /**
     * Ensure customer exists (upsert by phone number)
     */
    async ensureCustomer(phoneNumber, name) {
        // Normalize phone number
        const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
        const customer = await shared_types_1.prisma.customer.upsert({
            where: { phoneNumber: normalizedPhone },
            update: {
                name: name || undefined,
                updatedAt: new Date(),
            },
            create: {
                phoneNumber: normalizedPhone,
                name: name || null,
            },
        });
        logger_1.logger.debug({ phoneNumber: normalizedPhone, customerId: customer.id }, 'Customer ensured');
        return customer;
    }
    /**
     * Get or create conversation for a customer
     * Resets state if conversation is older than 24 hours
     */
    async getOrCreateConversation(customerPhone, businessId) {
        const normalizedPhone = this.normalizePhoneNumber(customerPhone);
        // Try to find existing conversation
        // If businessId is provided, look for exact match
        // If not provided, find the most recent conversation for this customer
        let conversation = null;
        if (businessId) {
            conversation = await shared_types_1.prisma.whatsAppConversation.findFirst({
                where: {
                    customerPhone: normalizedPhone,
                    businessId,
                },
                include: {
                    customer: true,
                    business: {
                        select: { id: true, name: true, routingCode: true },
                    },
                },
            });
        }
        else {
            // Find most recent conversation for this customer
            conversation = await shared_types_1.prisma.whatsAppConversation.findFirst({
                where: {
                    customerPhone: normalizedPhone,
                },
                orderBy: { lastMessageAt: 'desc' },
                include: {
                    customer: true,
                    business: {
                        select: { id: true, name: true, routingCode: true },
                    },
                },
            });
        }
        if (conversation) {
            // Check for 24-hour timeout
            const timeSinceLastMessage = Date.now() - conversation.lastMessageAt.getTime();
            if (timeSinceLastMessage > CONVERSATION_TIMEOUT_MS) {
                logger_1.logger.info({
                    conversationId: conversation.id,
                    hoursSinceLastMessage: timeSinceLastMessage / (60 * 60 * 1000)
                }, 'Conversation timed out, resetting state');
                conversation = await shared_types_1.prisma.whatsAppConversation.update({
                    where: { id: conversation.id },
                    data: {
                        state: 'GREETING',
                        contextData: {},
                        lastMessageAt: new Date(),
                    },
                    include: {
                        customer: true,
                        business: {
                            select: { id: true, name: true, routingCode: true },
                        },
                    },
                });
            }
            return conversation;
        }
        // Create new conversation
        conversation = await shared_types_1.prisma.whatsAppConversation.create({
            data: {
                customerPhone: normalizedPhone,
                businessId: businessId || null,
                state: 'GREETING',
                contextData: {},
                lastMessageAt: new Date(),
            },
            include: {
                customer: true,
                business: {
                    select: { id: true, name: true, routingCode: true },
                },
            },
        });
        logger_1.logger.info({ conversationId: conversation.id, customerPhone: normalizedPhone }, 'New conversation created');
        return conversation;
    }
    /**
     * Update conversation state and context
     */
    async updateState(conversationId, state, contextData) {
        const conversation = await shared_types_1.prisma.whatsAppConversation.findUnique({
            where: { id: conversationId },
        });
        if (!conversation) {
            throw new errors_1.NotFoundError('Conversation not found');
        }
        // Merge context data
        const existingContext = shared_types_2.conversationContextSchema.parse(conversation.contextData || {});
        const newContext = contextData
            ? { ...existingContext, ...contextData }
            : existingContext;
        const updated = await shared_types_1.prisma.whatsAppConversation.update({
            where: { id: conversationId },
            data: {
                state,
                contextData: newContext,
                lastMessageAt: new Date(),
            },
            include: {
                customer: true,
                business: {
                    select: { id: true, name: true, routingCode: true },
                },
            },
        });
        logger_1.logger.debug({ conversationId, state, contextData: newContext }, 'Conversation state updated');
        return updated;
    }
    /**
     * Associate conversation with a business via routing code
     * If a conversation already exists for this customer+business, use that one instead
     */
    async associateWithBusiness(conversationId, routingCode) {
        // Find business by routing code
        const business = await business_service_1.businessService.getByRoutingCode(routingCode);
        if (!business) {
            throw new errors_1.NotFoundError(`Business with routing code ${routingCode} not found`);
        }
        if (!business.isAcceptingOrders) {
            throw new errors_1.BusinessRuleError('This business is not accepting bookings at this time');
        }
        // Get current conversation to get customer phone
        const currentConversation = await shared_types_1.prisma.whatsAppConversation.findUnique({
            where: { id: conversationId },
        });
        if (!currentConversation) {
            throw new errors_1.NotFoundError('Conversation not found');
        }
        // Check if there's already a conversation for this customer+business
        const existingConversation = await shared_types_1.prisma.whatsAppConversation.findFirst({
            where: {
                customerPhone: currentConversation.customerPhone,
                businessId: business.id,
            },
            include: {
                customer: true,
                business: {
                    select: { id: true, name: true, routingCode: true },
                },
            },
        });
        if (existingConversation) {
            // Use existing conversation, update its state and timestamp
            const updated = await shared_types_1.prisma.whatsAppConversation.update({
                where: { id: existingConversation.id },
                data: {
                    state: 'SERVICE_SELECTION',
                    lastMessageAt: new Date(),
                },
                include: {
                    customer: true,
                    business: {
                        select: { id: true, name: true, routingCode: true },
                    },
                },
            });
            // Delete the orphan conversation if it's different
            if (currentConversation.id !== existingConversation.id) {
                await shared_types_1.prisma.whatsAppConversation.delete({
                    where: { id: currentConversation.id },
                }).catch(() => { }); // Ignore if already deleted
            }
            logger_1.logger.info({
                conversationId: updated.id,
                businessId: business.id,
                routingCode,
                reusedExisting: true
            }, 'Reusing existing conversation with business');
            return updated;
        }
        // No existing conversation, update current one
        const updated = await shared_types_1.prisma.whatsAppConversation.update({
            where: { id: conversationId },
            data: {
                businessId: business.id,
                lastMessageAt: new Date(),
            },
            include: {
                customer: true,
                business: {
                    select: { id: true, name: true, routingCode: true },
                },
            },
        });
        logger_1.logger.info({
            conversationId,
            businessId: business.id,
            routingCode
        }, 'Conversation associated with business');
        return updated;
    }
    /**
     * Process incoming message and return response
     * This is the main state machine handler
     */
    async processMessage(customerPhone, messageText, interactiveReply) {
        // Ensure customer exists
        await this.ensureCustomer(customerPhone);
        // Get or create conversation (without business initially)
        let conversation = await this.getOrCreateConversation(customerPhone);
        // Handle based on current state
        const state = conversation.state;
        logger_1.logger.debug({
            conversationId: conversation.id,
            state,
            messageText,
            interactiveReply
        }, 'Processing message');
        switch (state) {
            case 'GREETING':
                return this.handleGreeting(conversation);
            case 'AWAITING_ROUTING_CODE':
                return this.handleRoutingCode(conversation, messageText);
            case 'SERVICE_SELECTION':
                return this.handleServiceSelection(conversation, messageText, interactiveReply);
            case 'TIME_SELECTION':
                return this.handleTimeSelection(conversation, messageText, interactiveReply);
            case 'CONFIRMATION':
                return this.handleConfirmation(conversation, messageText, interactiveReply);
            case 'COMPLETED':
                // Reset and start over
                conversation = await this.updateState(conversation.id, 'GREETING', {});
                return this.handleGreeting(conversation);
            default:
                return this.handleGreeting(conversation);
        }
    }
    /**
     * Handle GREETING state - welcome message
     */
    async handleGreeting(conversation) {
        // Move to awaiting routing code
        const updated = await this.updateState(conversation.id, 'AWAITING_ROUTING_CODE');
        return {
            conversationId: updated.id,
            state: 'AWAITING_ROUTING_CODE',
            message: {
                type: 'text',
                body: {
                    text: '👋 Welcome to Salex Booking!\n\nPlease enter the business code (e.g., S1234) to start booking.',
                },
            },
            contextData: {},
        };
    }
    /**
     * Handle AWAITING_ROUTING_CODE state
     */
    async handleRoutingCode(conversation, messageText) {
        // Extract routing code from message
        const routingCode = this.extractRoutingCode(messageText);
        if (!routingCode) {
            return {
                conversationId: conversation.id,
                state: 'AWAITING_ROUTING_CODE',
                message: {
                    type: 'text',
                    body: {
                        text: '❌ Invalid business code format.\n\nPlease enter a valid code like S1234 or just 1234.',
                    },
                },
                contextData: {},
            };
        }
        try {
            // Associate with business
            const updated = await this.associateWithBusiness(conversation.id, routingCode);
            // Update state to service selection
            const withState = await this.updateState(updated.id, 'SERVICE_SELECTION', { routingCode });
            // Get services for the business
            return this.showServiceSelection(withState);
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                return {
                    conversationId: conversation.id,
                    state: 'AWAITING_ROUTING_CODE',
                    message: {
                        type: 'text',
                        body: {
                            text: `❌ Business code "${routingCode}" not found.\n\nPlease check the code and try again.`,
                        },
                    },
                    contextData: {},
                };
            }
            if (error instanceof errors_1.BusinessRuleError) {
                return {
                    conversationId: conversation.id,
                    state: 'AWAITING_ROUTING_CODE',
                    message: {
                        type: 'text',
                        body: {
                            text: '🚫 This business is not accepting bookings at this time.\n\nPlease try another business code.',
                        },
                    },
                    contextData: {},
                };
            }
            throw error;
        }
    }
    /**
     * Show service selection list
     */
    async showServiceSelection(conversation) {
        if (!conversation.businessId) {
            throw new errors_1.BusinessRuleError('No business associated with conversation');
        }
        // Get active services
        const services = await shared_types_1.prisma.service.findMany({
            where: {
                businessId: conversation.businessId,
                isActive: true,
            },
            orderBy: { name: 'asc' },
        });
        if (services.length === 0) {
            return {
                conversationId: conversation.id,
                state: 'SERVICE_SELECTION',
                message: {
                    type: 'text',
                    body: {
                        text: '😔 This business has no services available at the moment.\n\nPlease try again later.',
                    },
                },
                contextData: shared_types_2.conversationContextSchema.parse(conversation.contextData || {}),
            };
        }
        const businessName = conversation.business?.name || 'the business';
        // Create list message with services
        const rows = services.map(service => ({
            id: `service_${service.id}`,
            title: service.name,
            description: `₹${service.price} • ${service.durationMinutes} min`,
        }));
        return {
            conversationId: conversation.id,
            state: 'SERVICE_SELECTION',
            message: {
                type: 'list',
                header: { type: 'text', text: `📋 ${businessName}` },
                body: {
                    text: 'Select a service to book:',
                },
                footer: { text: 'Tap to select a service' },
                action: {
                    button: 'View Services',
                    sections: [{ title: 'Available Services', rows }],
                },
            },
            contextData: shared_types_2.conversationContextSchema.parse(conversation.contextData || {}),
        };
    }
    /**
     * Handle SERVICE_SELECTION state
     */
    async handleServiceSelection(conversation, messageText, interactiveReply) {
        let serviceId = null;
        // Check for interactive reply (list selection)
        if (interactiveReply?.id?.startsWith('service_')) {
            serviceId = interactiveReply.id.replace('service_', '');
        }
        else {
            // Try to parse service number from text (e.g., "1" or "haircut")
            serviceId = await this.findServiceByText(conversation.businessId, messageText);
        }
        if (!serviceId) {
            return this.showServiceSelection(conversation);
        }
        // Get service details
        const service = await shared_types_1.prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service || !service.isActive) {
            return {
                conversationId: conversation.id,
                state: 'SERVICE_SELECTION',
                message: {
                    type: 'text',
                    body: {
                        text: '❌ Service not found or unavailable.\n\nPlease select from the list.',
                    },
                },
                contextData: shared_types_2.conversationContextSchema.parse(conversation.contextData || {}),
            };
        }
        // Update context with selected service
        const updated = await this.updateState(conversation.id, 'TIME_SELECTION', {
            selectedServiceIds: [serviceId],
            totalDuration: service.durationMinutes,
            totalPrice: Number(service.price),
        });
        return this.showTimeSelection(updated, service.name);
    }
    /**
     * Show time selection options
     */
    async showTimeSelection(conversation, serviceName) {
        // Generate available time slots for today and tomorrow
        const slots = this.generateTimeSlots();
        const rows = slots.map(slot => ({
            id: `timeslot_${slot.value}`,
            title: slot.label,
            description: slot.date,
        }));
        return {
            conversationId: conversation.id,
            state: 'TIME_SELECTION',
            message: {
                type: 'list',
                header: { type: 'text', text: `⏰ Select Time` },
                body: {
                    text: `You selected: ${serviceName}\n\nChoose your preferred time slot:`,
                },
                footer: { text: 'Tap to select a time' },
                action: {
                    button: 'View Times',
                    sections: [{ title: 'Available Slots', rows }],
                },
            },
            contextData: shared_types_2.conversationContextSchema.parse(conversation.contextData || {}),
        };
    }
    /**
     * Handle TIME_SELECTION state
     */
    async handleTimeSelection(conversation, messageText, interactiveReply) {
        let selectedTime = null;
        // Check for interactive reply
        if (interactiveReply?.id?.startsWith('timeslot_')) {
            selectedTime = interactiveReply.id.replace('timeslot_', '');
        }
        else {
            // Try to parse time from text
            selectedTime = this.parseTimeFromText(messageText);
        }
        if (!selectedTime) {
            return this.showTimeSelection(conversation, 'your service');
        }
        // Update context with selected time
        const updated = await this.updateState(conversation.id, 'CONFIRMATION', {
            requestedTime: selectedTime,
        });
        return this.showConfirmation(updated);
    }
    /**
     * Show booking confirmation
     */
    async showConfirmation(conversation) {
        const context = shared_types_2.conversationContextSchema.parse(conversation.contextData || {});
        const businessName = conversation.business?.name || 'the business';
        // Get service names
        let serviceNames = 'Selected services';
        if (context.selectedServiceIds?.length) {
            const services = await shared_types_1.prisma.service.findMany({
                where: { id: { in: context.selectedServiceIds } },
                select: { name: true },
            });
            serviceNames = services.map(s => s.name).join(', ');
        }
        const formattedTime = context.requestedTime
            ? new Date(context.requestedTime).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
            })
            : 'Selected time';
        return {
            conversationId: conversation.id,
            state: 'CONFIRMATION',
            message: {
                type: 'button',
                header: { type: 'text', text: '✅ Confirm Booking' },
                body: {
                    text: `📍 ${businessName}\n🧴 ${serviceNames}\n⏰ ${formattedTime}\n💰 ₹${context.totalPrice || 0}\n\nConfirm your booking?`,
                },
                action: {
                    buttons: [
                        { type: 'reply', reply: { id: 'btn_confirm_booking', title: '✅ Confirm' } },
                        { type: 'reply', reply: { id: 'btn_cancel_booking', title: '❌ Cancel' } },
                    ],
                },
            },
            contextData: context,
        };
    }
    /**
     * Handle CONFIRMATION state
     */
    async handleConfirmation(conversation, messageText, interactiveReply) {
        const context = shared_types_2.conversationContextSchema.parse(conversation.contextData || {});
        // Check for confirm/cancel
        const isConfirm = interactiveReply?.id === 'btn_confirm_booking' ||
            messageText.toLowerCase().includes('confirm') ||
            messageText.toLowerCase().includes('yes');
        const isCancel = interactiveReply?.id === 'btn_cancel_booking' ||
            messageText.toLowerCase().includes('cancel') ||
            messageText.toLowerCase().includes('no');
        if (isCancel) {
            // Reset to service selection
            const updated = await this.updateState(conversation.id, 'SERVICE_SELECTION', {
                selectedServiceIds: undefined,
                totalDuration: undefined,
                totalPrice: undefined,
                requestedTime: undefined,
            });
            return this.showServiceSelection(updated);
        }
        if (isConfirm) {
            // Create the booking
            try {
                // Get business owner for booking creation
                const business = await shared_types_1.prisma.business.findUnique({
                    where: { id: conversation.businessId },
                    select: { ownerId: true, name: true },
                });
                if (!business) {
                    throw new errors_1.NotFoundError('Business not found');
                }
                // Ensure customer exists and get ID
                const customer = await this.ensureCustomer(conversation.customerPhone);
                // Create booking (auto-assigns resource and staff)
                const booking = await booking_service_1.bookingService.create(business.ownerId, {
                    businessId: conversation.businessId,
                    customerId: customer.id,
                    serviceIds: context.selectedServiceIds || [],
                    scheduledAt: context.requestedTime || new Date().toISOString(),
                    source: 'whatsapp',
                });
                // Update conversation to completed
                const updated = await this.updateState(conversation.id, 'COMPLETED');
                const formattedTime = context.requestedTime
                    ? new Date(context.requestedTime).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                    })
                    : 'your selected time';
                // Build confirmation message with resource/staff info
                const resourceInfo = booking.resource?.name ? `\n💺 ${booking.resource.name}` : '';
                const staffInfo = booking.staff?.name ? `\n👤 ${booking.staff.name}` : '';
                return {
                    conversationId: updated.id,
                    state: 'COMPLETED',
                    message: {
                        type: 'button',
                        header: { type: 'text', text: '🎉 Booking Confirmed!' },
                        body: {
                            text: `Your booking at ${business.name} is confirmed!\n\n📅 ${formattedTime}${resourceInfo}${staffInfo}\n🆔 Booking ID: ${booking.id.slice(-8).toUpperCase()}\n\nSee you soon! 👋`,
                        },
                        action: {
                            buttons: [
                                { type: 'reply', reply: { id: 'btn_new_booking', title: '📅 New Booking' } },
                            ],
                        },
                    },
                    contextData: {},
                };
            }
            catch (error) {
                logger_1.logger.error({ error, conversationId: conversation.id }, 'Failed to create booking');
                return {
                    conversationId: conversation.id,
                    state: 'CONFIRMATION',
                    message: {
                        type: 'text',
                        body: {
                            text: '❌ Sorry, we couldn\'t complete your booking. The time slot may no longer be available.\n\nPlease try selecting a different time.',
                        },
                    },
                    contextData: context,
                };
            }
        }
        // Neither confirm nor cancel - show confirmation again
        return this.showConfirmation(conversation);
    }
    // ============================================
    // HELPER METHODS
    // ============================================
    /**
     * Normalize phone number to E.164 format
     */
    normalizePhoneNumber(phone) {
        // Remove all non-digit characters except leading +
        let normalized = phone.replace(/[^\d+]/g, '');
        // Ensure it starts with +
        if (!normalized.startsWith('+')) {
            // Assume Indian number if 10 digits
            if (normalized.length === 10) {
                normalized = '+91' + normalized;
            }
            else {
                normalized = '+' + normalized;
            }
        }
        return normalized;
    }
    /**
     * Extract routing code from message text
     * Supports formats: S1234, s1234, 1234
     */
    extractRoutingCode(text) {
        const patterns = [
            /[sS](\d{4})/, // S1234, s1234
            /^(\d{4})$/, // Just 1234
        ];
        for (const pattern of patterns) {
            const match = text.trim().match(pattern);
            if (match && match[1]) {
                return match[1]; // Return just the digits
            }
        }
        return null;
    }
    /**
     * Find service by text (number or name)
     */
    async findServiceByText(businessId, text) {
        const services = await shared_types_1.prisma.service.findMany({
            where: { businessId, isActive: true },
            orderBy: { name: 'asc' },
        });
        // Try to match by number (1, 2, 3...)
        const num = parseInt(text.trim(), 10);
        if (!isNaN(num) && num > 0 && num <= services.length) {
            return services[num - 1].id;
        }
        // Try to match by name (case-insensitive)
        const lowerText = text.toLowerCase().trim();
        const match = services.find(s => s.name.toLowerCase().includes(lowerText) ||
            lowerText.includes(s.name.toLowerCase()));
        return match?.id || null;
    }
    /**
     * Generate available time slots
     */
    generateTimeSlots() {
        const slots = [];
        const now = new Date();
        // Generate slots for today and tomorrow
        for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
            const date = new Date(now);
            date.setDate(date.getDate() + dayOffset);
            const dateLabel = dayOffset === 0 ? 'Today' : 'Tomorrow';
            const dateStr = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            // Generate hourly slots from 9 AM to 7 PM
            for (let hour = 9; hour <= 19; hour++) {
                // Skip past times for today
                if (dayOffset === 0 && hour <= now.getHours())
                    continue;
                const slotDate = new Date(date);
                slotDate.setHours(hour, 0, 0, 0);
                const timeLabel = slotDate.toLocaleTimeString('en-IN', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                slots.push({
                    value: slotDate.toISOString(),
                    label: timeLabel,
                    date: `${dateLabel}, ${dateStr}`,
                });
            }
        }
        return slots.slice(0, 10); // Limit to 10 slots for WhatsApp list
    }
    /**
     * Parse time from text message
     */
    parseTimeFromText(text) {
        // Try to parse common time formats
        const timePatterns = [
            /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
            /(\d{1,2})\s*(am|pm)/i,
        ];
        for (const pattern of timePatterns) {
            const match = text.match(pattern);
            if (match) {
                let hour = parseInt(match[1], 10);
                const minute = match[2] ? parseInt(match[2], 10) : 0;
                const meridiem = match[3]?.toLowerCase();
                if (meridiem === 'pm' && hour < 12)
                    hour += 12;
                if (meridiem === 'am' && hour === 12)
                    hour = 0;
                const date = new Date();
                date.setHours(hour, minute, 0, 0);
                // If time is in the past, assume tomorrow
                if (date < new Date()) {
                    date.setDate(date.getDate() + 1);
                }
                return date.toISOString();
            }
        }
        return null;
    }
    /**
     * Get conversation by ID
     */
    async getById(id) {
        return shared_types_1.prisma.whatsAppConversation.findUnique({
            where: { id },
            include: {
                customer: true,
                business: {
                    select: { id: true, name: true, routingCode: true },
                },
            },
        });
    }
    /**
     * Get conversation by customer phone
     */
    async getByCustomerPhone(customerPhone) {
        const normalizedPhone = this.normalizePhoneNumber(customerPhone);
        return shared_types_1.prisma.whatsAppConversation.findFirst({
            where: { customerPhone: normalizedPhone },
            orderBy: { lastMessageAt: 'desc' },
            include: {
                customer: true,
                business: {
                    select: { id: true, name: true, routingCode: true },
                },
            },
        });
    }
}
exports.conversationService = new ConversationService();
//# sourceMappingURL=conversation.service.js.map