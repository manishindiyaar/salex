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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * @deprecated LEGACY STATE MACHINE — SCHEDULED FOR REMOVAL (Req 11.3, 11.5)
 *
 * This service contains the legacy switch-case state machine that is being
 * replaced by the Flow_Engine (see flow-engine.service.ts). The Engine_Router
 * currently routes traffic here for businesses not yet migrated to the
 * Flow_Engine, and as a fallback when the Flow_Engine errors (Req 11.4).
 *
 * REMOVAL GATE: The legacy switch-case handlers (handleGreeting,
 * handleRoutingCode, handleServiceSelection, handleTimeSelection,
 * handleConfirmation, and the processMessage switch block) may be removed
 * ONLY AFTER the soak/verification window confirms parity via:
 *   1. Golden tests passing (tasks 15.1, 16.x)
 *   2. Engine-marker diffing showing equivalent outcomes (task 20.2)
 *   3. Platform admin enables global cutover (Req 11.3)
 *
 * SHARED HELPERS TO RETAIN after removal:
 *   - ensureCustomer() — used by Flow_Engine for customer identity (Req 15.4)
 *   - ensureBusinessCustomer() — Foundation V2 identity records
 *   - normalizePhoneNumber() — shared utility
 *   - getOrCreateConversation() — may be refactored but still needed
 *   - InteractiveMessage type exports — used across the codebase
 *
 * DO NOT REMOVE legacy code until the verification gate above is met.
 * See: tasks.md task 22.1, requirements 11.3, 11.5
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { prisma, WhatsAppConversation, Customer } from '@salex/shared-types';
import { 
  ConversationStateType, 
  ConversationContextType,
  conversationContextSchema 
} from '@salex/shared-types';
import { logger } from '../utils/logger';
import { NotFoundError, BusinessRuleError } from '../utils/errors';
import { bookingService } from './booking.service';
import { businessService } from './business.service';
import { featureAccessService } from './feature-access.service';
import { availabilityService } from './availability.service';
import { sharedBusinessResolver } from './shared-business-resolver.service';
import { isWhatsAppFlowEnabled, getConfig } from '../config';
import { generateFlowToken } from './whatsapp-flow-crypto.service';
import { parseNavAction, NAV, midFlowContextMessage } from './whatsapp-ui.service';

// 24 hours in milliseconds
const CONVERSATION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

// Conversation with relations
export type ConversationWithRelations = WhatsAppConversation & {
  customer?: Customer | null;
  business?: { id: string; name: string; routingCode: string | null } | null;
};

// Interactive message types
export interface InteractiveButton {
  type: 'reply';
  reply: { id: string; title: string };
}

export interface InteractiveListRow {
  id: string;
  title: string;
  description?: string;
}

export interface InteractiveListSection {
  title?: string;
  rows: InteractiveListRow[];
}

export interface InteractiveMessage {
  type: 'button' | 'list' | 'text';
  header?: { type: 'text'; text: string };
  body: { text: string };
  footer?: { text: string };
  action?: {
    button?: string;
    buttons?: InteractiveButton[];
    sections?: InteractiveListSection[];
  };
}

// Response from processing a message
export interface ConversationResponse {
  conversationId: string;
  state: ConversationStateType;
  message: InteractiveMessage;
  contextData: ConversationContextType;
}

class ConversationService {
  /**
   * Ensure customer exists (upsert by phone number)
   */
  async ensureCustomer(phoneNumber: string, name?: string): Promise<Customer> {
    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const customer = await prisma.customer.upsert({
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

    logger.debug({ phoneNumber: normalizedPhone, customerId: customer.id }, 'Customer ensured');
    return customer;
  }

  /**
   * Ensure Foundation V2 identity records exist for this business/customer pair.
   */
  async ensureBusinessCustomer(
    businessId: string,
    phoneNumber: string,
    name?: string
  ) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const person = await prisma.person.upsert({
      where: { phoneNumber: normalizedPhone },
      update: { updatedAt: new Date() },
      create: { phoneNumber: normalizedPhone },
    });

    const businessCustomer = await prisma.businessCustomer.upsert({
      where: {
        businessId_personId: {
          businessId,
          personId: person.id,
        },
      },
      update: {
        displayName: name || undefined,
        lastInteractedAt: new Date(),
      },
      create: {
        businessId,
        personId: person.id,
        displayName: name || null,
        lastInteractedAt: new Date(),
      },
    });

    logger.debug({
      businessId,
      personId: person.id,
      businessCustomerId: businessCustomer.id,
    }, 'Business customer ensured');

    return businessCustomer;
  }

  /**
   * Get or create conversation for a customer
   * Resets state if conversation is older than 24 hours
   */
  async getOrCreateConversation(
    customerPhone: string,
    businessId?: string | null
  ): Promise<ConversationWithRelations> {
    const normalizedPhone = this.normalizePhoneNumber(customerPhone);

    // Try to find existing conversation
    // If businessId is provided, look for exact match
    // If not provided, find the most recent conversation for this customer
    let conversation: ConversationWithRelations | null = null;
    
    if (businessId) {
      conversation = await prisma.whatsAppConversation.findFirst({
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
      }) as ConversationWithRelations | null;
    } else {
      // Find most recent conversation for this customer
      conversation = await prisma.whatsAppConversation.findFirst({
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
      }) as ConversationWithRelations | null;
    }

    if (conversation) {
      // Check for 24-hour timeout
      const timeSinceLastMessage = Date.now() - conversation.lastMessageAt.getTime();
      if (timeSinceLastMessage > CONVERSATION_TIMEOUT_MS) {
        logger.info({ 
          conversationId: conversation.id, 
          hoursSinceLastMessage: timeSinceLastMessage / (60 * 60 * 1000) 
        }, 'Conversation timed out, resetting state');

        conversation = await prisma.whatsAppConversation.update({
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
      return conversation as ConversationWithRelations;
    }

    // Create new conversation
    conversation = await prisma.whatsAppConversation.create({
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

    logger.info({ conversationId: conversation.id, customerPhone: normalizedPhone }, 'New conversation created');
    return conversation as ConversationWithRelations;
  }

  /**
   * Update conversation state and context
   */
  async updateState(
    conversationId: string,
    state: ConversationStateType,
    contextData?: Partial<ConversationContextType>
  ): Promise<ConversationWithRelations> {
    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Merge context data
    const existingContext = conversationContextSchema.parse(conversation.contextData || {});
    const newContext = contextData
      ? this.compactContext({ ...existingContext, ...contextData })
      : existingContext;

    const updated = await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        state,
        contextData: newContext,
        version: { increment: 1 },
        lastMessageAt: new Date(),
      },
      include: {
        customer: true,
        business: {
          select: { id: true, name: true, routingCode: true },
        },
      },
    });

    logger.debug({ conversationId, state, contextData: newContext }, 'Conversation state updated');
    return updated as ConversationWithRelations;
  }

  /**
   * Associate conversation with a business via routing code
   * If a conversation already exists for this customer+business, use that one instead
   */
  async associateWithBusiness(
    conversationId: string,
    routingCode: string
  ): Promise<ConversationWithRelations> {
    // Find business by routing code
    const business = await businessService.getByRoutingCode(routingCode);

    if (!business) {
      throw new NotFoundError(`Business with routing code ${routingCode} not found`);
    }

    if (!business.isAcceptingOrders) {
      throw new BusinessRuleError('This business is not accepting bookings at this time');
    }

    // Get current conversation to get customer phone
    const currentConversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
    });

    if (!currentConversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Check if there's already a conversation for this customer+business
    const existingConversation = await prisma.whatsAppConversation.findFirst({
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
      const updated = await prisma.whatsAppConversation.update({
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
        await prisma.whatsAppConversation.delete({
          where: { id: currentConversation.id },
        }).catch(() => {}); // Ignore if already deleted
      }

      logger.info({ 
        conversationId: updated.id, 
        businessId: business.id, 
        routingCode,
        reusedExisting: true 
      }, 'Reusing existing conversation with business');

      return updated as ConversationWithRelations;
    }

    // No existing conversation, update current one
    const updated = await prisma.whatsAppConversation.update({
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

    logger.info({ 
      conversationId, 
      businessId: business.id, 
      routingCode 
    }, 'Conversation associated with business');

    return updated as ConversationWithRelations;
  }

  /**
   * Process incoming message and return response
   * This is the main state machine handler
   *
   * @deprecated LEGACY SWITCH-CASE HANDLER — Remove after parity verification gate.
   * The Flow_Engine (flow-engine.service.ts) replaces this method for migrated
   * businesses. This method is retained as the Engine_Router fallback (Req 11.4)
   * and for businesses not yet on the Flow_Engine (Req 11.2).
   * See file-level deprecation notice for removal criteria.
   */
  async processMessage(
    customerPhone: string,
    messageText: string,
    interactiveReply?: { type: string; id: string; title: string },
    businessId?: string
  ): Promise<ConversationResponse> {
    // Ensure customer exists
    await this.ensureCustomer(customerPhone);

    // Get or create conversation (with business if provided)
    let conversation = await this.getOrCreateConversation(customerPhone, businessId);

    // Handle based on current state
    const state = conversation.state as ConversationStateType;

    logger.debug({ 
      conversationId: conversation.id, 
      state, 
      messageText,
      interactiveReply 
    }, 'Processing message');

    // ─── NAVIGATION INTERCEPTOR ────────────────────────────────────────
    // Catches nav actions (back, start over, change salon, edit) before
    // state-specific handlers. Allows escape from any state without 24h wait.
    // ─────────────────────────────────────────────────────────────────────
    const navAction = parseNavAction(interactiveReply?.id, messageText);
    if (navAction && state !== 'GREETING' && state !== 'AWAITING_ROUTING_CODE') {
      const navResult = await this.handleNavAction(conversation, navAction, state);
      if (navResult) return navResult;
    }

    // If user types "hi"/"hello" mid-flow, show contextual menu instead of wiping session
    if (state !== 'GREETING' && state !== 'AWAITING_ROUTING_CODE') {
      const lower = messageText.trim().toLowerCase();
      if (lower === 'hi' || lower === 'hello' || lower === 'hey') {
        return {
          conversationId: conversation.id,
          state,
          message: midFlowContextMessage({
            currentStep: state,
            businessName: conversation.business?.name || undefined,
          }),
          contextData: conversationContextSchema.parse(conversation.contextData || {}),
        };
      }
    }

    // ─── LEGACY SWITCH-CASE STATE MACHINE ───────────────────────────────
    // TODO(post-parity): Remove this switch block and the private handle*
    // methods below once the soak window confirms parity (golden tests +
    // engine-marker diffing). The Flow_Engine graph runner replaces all of
    // these state transitions. Retain shared helpers (see file header).
    // ─────────────────────────────────────────────────────────────────────
    switch (state) {
      case 'GREETING':
        return this.handleGreeting(conversation);

      case 'AWAITING_ROUTING_CODE':
        return this.handleRoutingCode(conversation, messageText, interactiveReply);

      case 'SERVICE_SELECTION':
        return this.handleServiceSelection(conversation, messageText, interactiveReply);

      case 'TIME_SELECTION':
        return this.handleTimeSelection(conversation, messageText, interactiveReply);

      case 'CONFIRMATION':
        return this.handleConfirmation(conversation, messageText, interactiveReply);

      case 'COMPLETED':
        // Booking is already done. If user taps old confirm button, show "already booked" message.
        if (interactiveReply?.id === 'btn_confirm_booking') {
          const context = conversationContextSchema.parse(conversation.contextData || {});
          if (context.bookingIntentId) {
            const bookingIntent = await prisma.bookingIntent.findUnique({
              where: { id: context.bookingIntentId },
            });
            if (bookingIntent?.bookingId) {
              return this.showAlreadyConfirmed(conversation, bookingIntent.bookingId);
            }
          }
        }
        // If user taps "Book Again" / start over, reset and restart
        if (interactiveReply?.id === NAV.START_OVER || navAction === NAV.START_OVER) {
          if (conversation.businessId) {
            const updated = await this.updateState(conversation.id, 'SERVICE_SELECTION', {
              selectedServiceIds: undefined,
              totalDuration: undefined,
              totalPrice: undefined,
              requestedTime: undefined,
              bookingIntentId: undefined,
            });
            return this.showServiceSelection(updated);
          }
          conversation = await this.updateState(conversation.id, 'GREETING', {});
          return this.handleGreeting(conversation);
        }
        // Default: show "booking done" card with Book Again button
        return {
          conversationId: conversation.id,
          state: 'COMPLETED',
          message: {
            type: 'button',
            header: { type: 'text', text: '✅ Booking Done' },
            body: { text: 'Your appointment is confirmed.\n\nWant to book another appointment?' },
            action: {
              buttons: [
                { type: 'reply', reply: { id: NAV.START_OVER, title: '📅 Book Again' } },
              ],
            },
          },
          contextData: conversationContextSchema.parse(conversation.contextData || {}),
        };

      default:
        return this.handleGreeting(conversation);
    }
  }

  /**
   * Handle GREETING state - welcome message with template customization
   * @deprecated Legacy handler — remove after parity verification gate.
   */
  private async handleGreeting(
    conversation: ConversationWithRelations
  ): Promise<ConversationResponse> {
    // If we already have a business associated (e.g. from dedicated number), skip routing
    if (conversation.businessId) {
      try {
        const withState = await this.updateState(conversation.id, 'SERVICE_SELECTION');
        return this.showServiceSelection(withState);
      } catch (error) {
        logger.error({ error, businessId: conversation.businessId }, 'Failed to load services for dedicated number');
        // If it fails, fallback to standard greeting
      }
    }

    // Move to awaiting routing code / business search
    const updated = await this.updateState(conversation.id, 'AWAITING_ROUTING_CODE');

    // If WhatsApp Flow is enabled, send a Flow CTA message instead of plain text.
    // The Flow handles salon search in a native UI. If not enabled, fall back to chat.
    if (isWhatsAppFlowEnabled()) {
      const config = getConfig();
      const flowToken = generateFlowToken(conversation.customerPhone);

      // Return a special message type that the outbound worker will send as a Flow CTA.
      // We encode the Flow info into the message body; the worker detects and handles it.
      return {
        conversationId: updated.id,
        state: 'AWAITING_ROUTING_CODE',
        message: {
          type: 'text',
          body: {
            text: '👋 Find your salon\n\nTap the button below to search, or type a salon name/code directly.',
          },
          // Flow metadata stored in action for the outbound worker to detect
          action: {
            button: '__FLOW_CTA__',
            sections: [{
              title: 'flow_meta',
              rows: [{
                id: config.whatsappFlowId || '',
                title: flowToken,
                description: config.whatsappFlowMode,
              }],
            }],
          },
        } as InteractiveMessage,
        contextData: {},
      };
    }

    return {
      conversationId: updated.id,
      state: 'AWAITING_ROUTING_CODE',
      message: {
        type: 'text',
        body: {
          text: '👋 Find your salon\n\nSearch by salon name, area, address, or enter your salon code.',
        },
      },
      contextData: {},
    };
  }

  /**
   * Handle AWAITING_ROUTING_CODE state
   * @deprecated Legacy handler — remove after parity verification gate.
   */
  private async handleRoutingCode(
    conversation: ConversationWithRelations,
    messageText: string,
    interactiveReply?: { type: string; id: string; title: string; description?: string }
  ): Promise<ConversationResponse> {
    // Handle interactive list selection (user tapped a salon from the list)
    if (interactiveReply?.id?.startsWith('biz_')) {
      const businessId = interactiveReply.id.replace('biz_', '');
      return this.handleBusinessSelection(conversation, businessId);
    }

    // Handle WhatsApp Flow completion (nfm_reply with business_id)
    if (interactiveReply?.type === 'nfm_reply' && interactiveReply.description) {
      try {
        const flowData = JSON.parse(interactiveReply.description);
        if (flowData.business_id) {
          logger.info({ businessId: flowData.business_id }, 'Flow completion: business selected');
          return this.handleBusinessSelection(conversation, flowData.business_id);
        }
      } catch {
        // Fall through to text handling
      }
    }

    // Handle Flow completion marker in messageText (fallback detection)
    if (messageText.startsWith('__FLOW_COMPLETE__:')) {
      try {
        const flowData = JSON.parse(messageText.replace('__FLOW_COMPLETE__:', ''));
        if (flowData.business_id) {
          logger.info({ businessId: flowData.business_id }, 'Flow completion via messageText marker');
          return this.handleBusinessSelection(conversation, flowData.business_id);
        }
      } catch {
        // Fall through to text handling
      }
    }

    const query = messageText.trim();

    if (!query) {
      return {
        conversationId: conversation.id,
        state: 'AWAITING_ROUTING_CODE',
        message: {
          type: 'text',
          body: {
            text: '👋 Find your salon\n\nSearch by salon name, area, address, or enter your salon code.',
          },
        },
        contextData: {},
      };
    }

    // Use SharedBusinessResolver for both code and search queries
    const result = await sharedBusinessResolver.resolve({
      query,
      customerPhone: conversation.customerPhone,
      limit: 7,
    });

    // ─── No match ─────────────────────────────────────────────────────────
    if (result.noMatch) {
      return {
        conversationId: conversation.id,
        state: 'AWAITING_ROUTING_CODE',
        message: {
          type: 'text',
          body: {
            text: `❌ No salon found for "${query}".\n\nTry searching by name, area, or enter a salon code (e.g. 1234).`,
          },
        },
        contextData: {},
      };
    }

    // ─── Exact match (routing code or single name match) ──────────────────
    if (result.exactMatch) {
      return this.initializeBusinessSession(conversation, result.exactMatch);
    }

    // ─── Multiple matches — show interactive list ─────────────────────────
    const rows = result.matches.slice(0, 10).map(biz => ({
      id: `biz_${biz.id}`,
      title: biz.name.slice(0, 24),
      description: [biz.category, biz.slug].filter(Boolean).join(' · ').slice(0, 72) || undefined,
    }));

    // Store pending matches in context for selection handling
    const matchIds = result.matches.map(b => ({ id: b.id, name: b.name }));
    await this.updateState(conversation.id, 'AWAITING_ROUTING_CODE', {
      businessSearchQuery: query,
      pendingBusinessMatches: matchIds,
    } as any);

    return {
      conversationId: conversation.id,
      state: 'AWAITING_ROUTING_CODE',
      message: {
        type: 'list',
        header: { type: 'text', text: '🔍 Choose your salon' },
        body: { text: `Found ${result.matches.length} salons matching "${query}"` },
        footer: { text: 'Tap to select' },
        action: {
          button: 'View Salons',
          sections: [{ title: 'Salons', rows }],
        },
      },
      contextData: {},
    };
  }

  /**
   * Handle when user selects a business from the interactive list.
   */
  private async handleBusinessSelection(
    conversation: ConversationWithRelations,
    businessId: string
  ): Promise<ConversationResponse> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        routingCode: true,
        isActive: true,
        isAcceptingOrders: true,
      },
    });

    if (!business || !business.isActive) {
      return {
        conversationId: conversation.id,
        state: 'AWAITING_ROUTING_CODE',
        message: {
          type: 'text',
          body: { text: '❌ This salon is no longer available.\n\nTry searching again.' },
        },
        contextData: {},
      };
    }

    return this.initializeBusinessSession(conversation, business);
  }

  /**
   * Handle navigation actions (back, start over, change salon, edit).
   * Returns a ConversationResponse if handled, null if not applicable.
   */
  private async handleNavAction(
    conversation: ConversationWithRelations,
    action: string,
    currentState: ConversationStateType,
  ): Promise<ConversationResponse | null> {
    const context = conversationContextSchema.parse(conversation.contextData || {});

    switch (action) {
      case NAV.START_OVER: {
        // Clear booking context, restart with this business's service selection
        if (conversation.businessId) {
          const updated = await this.updateState(conversation.id, 'SERVICE_SELECTION', {
            selectedServiceIds: undefined,
            totalDuration: undefined,
            totalPrice: undefined,
            requestedTime: undefined,
            bookingIntentId: undefined,
          });
          return this.showServiceSelection(updated);
        }
        // No business — go to greeting
        const updated = await this.updateState(conversation.id, 'GREETING', {});
        return this.handleGreeting(updated);
      }

      case NAV.CHANGE_SALON: {
        // Clear everything and go back to business search
        await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: { businessId: null },
        });
        const updated = await this.updateState(conversation.id, 'AWAITING_ROUTING_CODE', {
          selectedServiceIds: undefined,
          totalDuration: undefined,
          totalPrice: undefined,
          requestedTime: undefined,
          bookingIntentId: undefined,
        });
        return {
          conversationId: updated.id,
          state: 'AWAITING_ROUTING_CODE',
          message: {
            type: 'text',
            body: { text: '👋 Find your salon\n\nSearch by salon name, area, address, or enter your salon code.' },
          },
          contextData: {},
        };
      }

      case NAV.EDIT_SERVICES: {
        // Clear time and booking intent, go to service selection
        const updated = await this.updateState(conversation.id, 'SERVICE_SELECTION', {
          requestedTime: undefined,
          bookingIntentId: undefined,
        });
        return this.showServiceSelection(updated);
      }

      case NAV.EDIT_STAFF: {
        // Clear time and booking intent, go back to staff (if supported)
        // For now, treat like edit services since legacy doesn't have staff step
        const updated = await this.updateState(conversation.id, 'SERVICE_SELECTION', {
          requestedTime: undefined,
          bookingIntentId: undefined,
        });
        return this.showServiceSelection(updated);
      }

      case NAV.EDIT_TIME: {
        // Clear booking intent, go to time selection
        if (context.selectedServiceIds?.length) {
          const services = await prisma.service.findMany({
            where: { id: { in: context.selectedServiceIds } },
            select: { name: true },
          });
          const serviceName = services.map(s => s.name).join(', ') || 'your service';
          const updated = await this.updateState(conversation.id, 'TIME_SELECTION', {
            requestedTime: undefined,
            bookingIntentId: undefined,
          });
          return this.showTimeSelection(updated, serviceName);
        }
        // No services selected — go to service selection
        const updated = await this.updateState(conversation.id, 'SERVICE_SELECTION', {
          requestedTime: undefined,
          bookingIntentId: undefined,
        });
        return this.showServiceSelection(updated);
      }

      case NAV.BACK: {
        // Go to previous step based on current state
        if (currentState === 'CONFIRMATION') {
          // Back from confirmation → time selection
          if (context.selectedServiceIds?.length) {
            const services = await prisma.service.findMany({
              where: { id: { in: context.selectedServiceIds } },
              select: { name: true },
            });
            const serviceName = services.map(s => s.name).join(', ') || 'your service';
            const updated = await this.updateState(conversation.id, 'TIME_SELECTION', {
              requestedTime: undefined,
              bookingIntentId: undefined,
            });
            return this.showTimeSelection(updated, serviceName);
          }
          const updated = await this.updateState(conversation.id, 'SERVICE_SELECTION', {});
          return this.showServiceSelection(updated);
        }
        if (currentState === 'TIME_SELECTION') {
          // Back from time → service selection
          const updated = await this.updateState(conversation.id, 'SERVICE_SELECTION', {
            requestedTime: undefined,
            bookingIntentId: undefined,
          });
          return this.showServiceSelection(updated);
        }
        if (currentState === 'SERVICE_SELECTION') {
          // Back from service selection → business search (shared number)
          if (!conversation.businessId) {
            const updated = await this.updateState(conversation.id, 'AWAITING_ROUTING_CODE', {});
            return {
              conversationId: updated.id,
              state: 'AWAITING_ROUTING_CODE',
              message: {
                type: 'text',
                body: { text: '👋 Find your salon\n\nSearch by salon name, area, address, or enter your salon code.' },
              },
              contextData: {},
            };
          }
          // Dedicated number — can't go back further, show service selection
          return this.showServiceSelection(conversation);
        }
        return null;
      }

      default:
        return null;
    }
  }

  /**
   * Initialize a business session after successful salon selection.
   * Checks availability, feature access, and associates the conversation.
   */
  private async initializeBusinessSession(
    conversation: ConversationWithRelations,
    business: { id: string; name: string; routingCode: string | null; isAcceptingOrders: boolean }
  ): Promise<ConversationResponse> {
    // Check if business is accepting orders
    if (!business.isAcceptingOrders) {
      return {
        conversationId: conversation.id,
        state: 'AWAITING_ROUTING_CODE',
        message: {
          type: 'text',
          body: {
            text: `🚫 ${business.name} is not accepting bookings right now.\n\nTry another salon or check back later.`,
          },
        },
        contextData: {},
      };
    }

    // Check feature access
    const featureAccess = await featureAccessService.canAccessFeature(business.id, 'whatsapp_booking');
    if (!featureAccess.allowed) {
      return {
        conversationId: conversation.id,
        state: 'AWAITING_ROUTING_CODE',
        message: {
          type: 'text',
          body: {
            text: `📞 ${business.name} doesn't have WhatsApp booking enabled.\n\nPlease call them directly to book.`,
          },
        },
        contextData: {},
      };
    }

    // Associate conversation with business
    const routingCode = business.routingCode || '';
    try {
      const updated = await this.associateWithBusiness(conversation.id, routingCode);
      const withState = await this.updateState(updated.id, 'SERVICE_SELECTION', { routingCode });
      return this.showServiceSelection(withState);
    } catch (error) {
      // If associateWithBusiness fails (routing code not found), try direct update
      logger.warn({ businessId: business.id, error }, 'associateWithBusiness failed, trying direct link');

      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { businessId: business.id, lastMessageAt: new Date() },
      });

      const withState = await this.updateState(conversation.id, 'SERVICE_SELECTION', {
        routingCode: business.routingCode || undefined,
      });
      return this.showServiceSelection(withState);
    }
  }

  /**
   * Show service selection list with template-based terminology
   * @deprecated Legacy handler — remove after parity verification gate.
   */
  private async showServiceSelection(
    conversation: ConversationWithRelations
  ): Promise<ConversationResponse> {
    if (!conversation.businessId) {
      throw new BusinessRuleError('No business associated with conversation');
    }

    // Get business with category
    const business = await prisma.business.findUnique({
      where: { id: conversation.businessId },
      select: { name: true, category: true },
    });

    // Get active services
    const services = await prisma.service.findMany({
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
        contextData: conversationContextSchema.parse(conversation.contextData || {}),
      };
    }

    const businessName = business?.name || 'the business';
    
    const serviceTerm = this.getServiceTerm(business?.category);
    const servicePluralTerm = this.getServicePluralTerm(business?.category);

    // Create list message with services
    const rows: InteractiveListRow[] = services.map(service => ({
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
          text: `Select a ${serviceTerm} to book:`,
        },
        footer: { text: `Tap to select a ${serviceTerm}` },
        action: {
          button: `View ${servicePluralTerm}`,
          sections: [{ title: `Available ${servicePluralTerm}`, rows }],
        },
      },
      contextData: conversationContextSchema.parse(conversation.contextData || {}),
    };
  }

  /**
   * Handle SERVICE_SELECTION state
   * @deprecated Legacy handler — remove after parity verification gate.
   */
  private async handleServiceSelection(
    conversation: ConversationWithRelations,
    messageText: string,
    interactiveReply?: { type: string; id: string; title: string }
  ): Promise<ConversationResponse> {
    let serviceId: string | null = null;

    // Check for interactive reply (list selection)
    if (interactiveReply?.id?.startsWith('service_')) {
      serviceId = interactiveReply.id.replace('service_', '');
    } else {
      // Try to parse service number from text (e.g., "1" or "haircut")
      serviceId = await this.findServiceByText(conversation.businessId!, messageText);
    }

    if (!serviceId) {
      return this.showServiceSelection(conversation);
    }

    // Get service details
    const service = await prisma.service.findUnique({
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
        contextData: conversationContextSchema.parse(conversation.contextData || {}),
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
   * @deprecated Legacy handler — remove after parity verification gate.
   */
  private async showTimeSelection(
    conversation: ConversationWithRelations,
    serviceName: string
  ): Promise<ConversationResponse> {
    const context = conversationContextSchema.parse(conversation.contextData || {});
    const slots = await this.generateAvailableTimeSlots(
      conversation.businessId!,
      context.totalDuration || 60
    );

    if (slots.length === 0) {
      return {
        conversationId: conversation.id,
        state: 'TIME_SELECTION',
        message: {
          type: 'text',
          body: {
            text: 'No slots are available right now. Please try again later or contact the business directly.',
          },
        },
        contextData: context,
      };
    }

    const rows: InteractiveListRow[] = slots.map(slot => ({
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
      contextData: conversationContextSchema.parse(conversation.contextData || {}),
    };
  }

  /**
   * Handle TIME_SELECTION state
   * @deprecated Legacy handler — remove after parity verification gate.
   */
  private async handleTimeSelection(
    conversation: ConversationWithRelations,
    messageText: string,
    interactiveReply?: { type: string; id: string; title: string }
  ): Promise<ConversationResponse> {
    let selectedTime: string | null = null;

    // Check for interactive reply
    if (interactiveReply?.id?.startsWith('timeslot_')) {
      selectedTime = interactiveReply.id.replace('timeslot_', '');
    } else {
      // Try to parse time from text
      selectedTime = this.parseTimeFromText(messageText);
    }

    if (!selectedTime) {
      return this.showTimeSelection(conversation, 'your service');
    }

    const context = conversationContextSchema.parse(conversation.contextData || {});
    if (!conversation.businessId || !context.selectedServiceIds?.length || !context.totalDuration) {
      return this.showServiceSelection(conversation);
    }

    const selectedStart = new Date(selectedTime);
    if (Number.isNaN(selectedStart.getTime())) {
      return this.showTimeSelection(conversation, 'your service');
    }

    const selectedEnd = availabilityService.calculateEndTime(selectedStart, context.totalDuration);
    const availability = await availabilityService.getAvailabilityWithSuggestions(
      conversation.businessId,
      selectedStart,
      selectedEnd
    );

    if (!availability.available) {
      return {
        conversationId: conversation.id,
        state: 'TIME_SELECTION',
        message: {
          type: 'text',
          body: {
            text: 'That slot is no longer available. Please choose another time.',
          },
        },
        contextData: context,
      };
    }

    const bookingIntent = await this.createBookingIntent(conversation, selectedTime, context);

    // Update context with selected time
    const updated = await this.updateState(conversation.id, 'CONFIRMATION', {
      requestedTime: selectedTime,
      bookingIntentId: bookingIntent.id,
    });

    return this.showConfirmation(updated);
  }

  /**
   * Show booking confirmation
   * @deprecated Legacy handler — remove after parity verification gate.
   */
  private async showConfirmation(
    conversation: ConversationWithRelations
  ): Promise<ConversationResponse> {
    const context = conversationContextSchema.parse(conversation.contextData || {});
    const businessName = conversation.business?.name || 'the business';

    // Get service names
    let serviceNames = 'Selected services';
    if (context.selectedServiceIds?.length) {
      const services = await prisma.service.findMany({
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
   * @deprecated Legacy handler — remove after parity verification gate.
   */
  private async handleConfirmation(
    conversation: ConversationWithRelations,
    messageText: string,
    interactiveReply?: { type: string; id: string; title: string }
  ): Promise<ConversationResponse> {
    const context = conversationContextSchema.parse(conversation.contextData || {});

    // Check for confirm/cancel
    const isConfirm = interactiveReply?.id === 'btn_confirm_booking' || 
                      messageText.toLowerCase().includes('confirm') ||
                      messageText.toLowerCase().includes('yes');

    const isCancel = interactiveReply?.id === 'btn_cancel_booking' ||
                     messageText.toLowerCase().includes('cancel') ||
                     messageText.toLowerCase().includes('no');

    if (isCancel) {
      if (context.bookingIntentId) {
        await prisma.bookingIntent.updateMany({
          where: {
            id: context.bookingIntentId,
            status: 'PENDING',
          },
          data: { status: 'CANCELLED' },
        });
      }

      // Reset to service selection
      const updated = await this.updateState(conversation.id, 'SERVICE_SELECTION', {
        selectedServiceIds: undefined,
        totalDuration: undefined,
        totalPrice: undefined,
        requestedTime: undefined,
        bookingIntentId: undefined,
      });
      return this.showServiceSelection(updated);
    }

    if (isConfirm) {
      // Create the booking
      try {
        const bookingIntent = context.bookingIntentId
          ? await prisma.bookingIntent.findUnique({ where: { id: context.bookingIntentId } })
          : null;

        if (!bookingIntent) {
          return this.showTimeSelection(conversation, 'your service');
        }

        if (bookingIntent.status === 'CONFIRMED' && bookingIntent.bookingId) {
          return this.showAlreadyConfirmed(conversation, bookingIntent.bookingId);
        }

        if (bookingIntent.status !== 'PENDING' || bookingIntent.expiresAt <= new Date()) {
          await prisma.bookingIntent.updateMany({
            where: { id: bookingIntent.id, status: 'PENDING' },
            data: { status: 'EXPIRED' },
          });

          const updated = await this.updateState(conversation.id, 'TIME_SELECTION', {
            requestedTime: undefined,
            bookingIntentId: undefined,
          });

          return {
            conversationId: updated.id,
            state: 'TIME_SELECTION',
            message: {
              type: 'text',
              body: {
                text: 'This booking hold expired. Please choose a fresh time slot.',
              },
            },
            contextData: conversationContextSchema.parse(updated.contextData || {}),
          };
        }

        // Get business owner for booking creation
        const business = await prisma.business.findUnique({
          where: { id: conversation.businessId! },
          select: { ownerId: true, name: true },
        });

        if (!business) {
          throw new NotFoundError('Business not found');
        }

        // Keep legacy Customer populated while Foundation V2 BusinessCustomer becomes the durable identity.
        const [customer, businessCustomer] = await Promise.all([
          this.ensureCustomer(conversation.customerPhone),
          this.ensureBusinessCustomer(conversation.businessId!, conversation.customerPhone),
        ]);

        // Create booking (auto-assigns resource and staff)
        const booking = await bookingService.create(business.ownerId, {
          businessId: conversation.businessId!,
          customerId: customer.id,
          businessCustomerId: businessCustomer.id,
          serviceIds: context.selectedServiceIds || [],
          scheduledAt: bookingIntent.requestedTime.toISOString(),
          source: 'whatsapp',
        });

        await prisma.bookingIntent.update({
          where: { id: bookingIntent.id },
          data: {
            status: 'CONFIRMED',
            bookingId: booking.id,
          },
        });

        // Update conversation to completed
        const updated = await this.updateState(conversation.id, 'COMPLETED');

        const formattedTime = bookingIntent.requestedTime
          ? bookingIntent.requestedTime.toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : 'your selected time';

        const resourceInfo = booking.resource?.name ? `\n💺 ${booking.resource.name}` : '';
        const staffInfo = booking.staff?.name ? `\n👤 ${booking.staff.name}` : '';
        
        const confirmationMessage = `Your booking at ${business.name} is confirmed!\n\n📅 ${formattedTime}${resourceInfo}${staffInfo}\n🆔 Booking ID: ${booking.id.slice(-8).toUpperCase()}\n\nSee you soon! 👋`;

        return {
          conversationId: updated.id,
          state: 'COMPLETED',
          message: {
            type: 'button',
            header: { type: 'text', text: '🎉 Booking Confirmed!' },
            body: {
              text: confirmationMessage,
            },
            action: {
              buttons: [
                { type: 'reply', reply: { id: 'btn_new_booking', title: '📅 New Booking' } },
              ],
            },
          },
          contextData: {},
        };
      } catch (error) {
        logger.error({ error, conversationId: conversation.id }, 'Failed to create booking');
        
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

  private async createBookingIntent(
    conversation: ConversationWithRelations,
    selectedTime: string,
    context: ConversationContextType
  ) {
    const serviceIds = [...(context.selectedServiceIds || [])].sort();
    const requestedTime = new Date(selectedTime);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const idempotencyKey = [
      conversation.id,
      serviceIds.join(','),
      requestedTime.toISOString(),
    ].join(':');

    return prisma.bookingIntent.upsert({
      where: { idempotencyKey },
      update: {
        status: 'PENDING',
        requestedTime,
        totalDuration: context.totalDuration || 0,
        totalPrice: context.totalPrice || 0,
        expiresAt,
      },
      create: {
        conversationId: conversation.id,
        businessId: conversation.businessId!,
        customerPhone: conversation.customerPhone,
        serviceIds,
        requestedTime,
        totalDuration: context.totalDuration || 0,
        totalPrice: context.totalPrice || 0,
        idempotencyKey,
        expiresAt,
      },
    });
  }

  private async showAlreadyConfirmed(
    conversation: ConversationWithRelations,
    bookingId: string
  ): Promise<ConversationResponse> {
    const businessName = conversation.business?.name || 'the business';
    const updated = await this.updateState(conversation.id, 'COMPLETED');

    return {
      conversationId: updated.id,
      state: 'COMPLETED',
      message: {
        type: 'button',
        header: { type: 'text', text: 'Booking Already Confirmed' },
        body: {
          text: `Your booking at ${businessName} is already confirmed.\n\nBooking ID: ${bookingId.slice(-8).toUpperCase()}`,
        },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'btn_new_booking', title: 'New Booking' } },
          ],
        },
      },
      contextData: conversationContextSchema.parse(updated.contextData || {}),
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private compactContext(context: Record<string, unknown>): ConversationContextType {
    const compacted = Object.fromEntries(
      Object.entries(context).filter(([, value]) => value !== undefined)
    );

    return conversationContextSchema.parse(compacted);
  }

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters except leading +
    let normalized = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!normalized.startsWith('+')) {
      // Assume Indian number if 10 digits
      if (normalized.length === 10) {
        normalized = '+91' + normalized;
      } else {
        normalized = '+' + normalized;
      }
    }
    
    return normalized;
  }

  private getServiceTerm(category?: string): string {
    if (category === 'CLINIC') return 'appointment';
    return 'service';
  }

  private getServicePluralTerm(category?: string): string {
    if (category === 'CLINIC') return 'appointments';
    return 'services';
  }

  /**
   * Extract routing code from message text
   * Supports formats: S1234, s1234, 1234
   */
  private extractRoutingCode(text: string): string | null {
    const patterns = [
      /[sS](\d{4})/,     // S1234, s1234
      /^(\d{4})$/,       // Just 1234
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
  private async findServiceByText(businessId: string, text: string): Promise<string | null> {
    const services = await prisma.service.findMany({
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
    const match = services.find(s => 
      s.name.toLowerCase().includes(lowerText) ||
      lowerText.includes(s.name.toLowerCase())
    );

    return match?.id || null;
  }

  /**
   * Generate available time slots
   * @deprecated Legacy slot generation — remove after parity verification gate.
   * The Flow_Engine's time_picker node uses bulk availability (getBulkAvailabilityData)
   * instead of this per-slot query loop.
   */
  private async generateAvailableTimeSlots(
    businessId: string,
    durationMinutes: number
  ): Promise<Array<{ value: string; label: string; date: string }>> {
    const slots: Array<{ value: string; label: string; date: string }> = [];
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
        if (dayOffset === 0 && hour <= now.getHours()) continue;

        const slotDate = new Date(date);
        slotDate.setHours(hour, 0, 0, 0);
        const slotEnd = availabilityService.calculateEndTime(slotDate, durationMinutes);
        const availability = await availabilityService.getAvailabilityWithSuggestions(
          businessId,
          slotDate,
          slotEnd
        );

        if (!availability.available) {
          continue;
        }

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
  private parseTimeFromText(text: string): string | null {
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

        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;

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
  async getById(id: string): Promise<ConversationWithRelations | null> {
    return prisma.whatsAppConversation.findUnique({
      where: { id },
      include: {
        customer: true,
        business: {
          select: { id: true, name: true, routingCode: true },
        },
      },
    }) as Promise<ConversationWithRelations | null>;
  }

  /**
   * Get conversation by customer phone
   */
  async getByCustomerPhone(customerPhone: string): Promise<ConversationWithRelations | null> {
    const normalizedPhone = this.normalizePhoneNumber(customerPhone);
    
    return prisma.whatsAppConversation.findFirst({
      where: { customerPhone: normalizedPhone },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        customer: true,
        business: {
          select: { id: true, name: true, routingCode: true },
        },
      },
    }) as Promise<ConversationWithRelations | null>;
  }
}

export const conversationService = new ConversationService();
