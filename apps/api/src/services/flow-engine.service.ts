/**
 * Flow Engine Service
 *
 * The core orchestration loop for the WhatsApp Flow Engine. Replaces the
 * hardcoded switch-case state machine with a dynamic, database-driven graph
 * runner that executes per-business FlowDefinitions.
 *
 * Public surface:
 *   - processMessage(customerPhone, messageText, interactiveReply, businessId)
 *   - resolveNextNode (re-exported pure function)
 *
 * Two-phase execution loop:
 *   1. Fresh-start detection via entry sentinel ("GREETING" + no flowId)
 *   2. Load pinned flow (invalid → reset per Req 14.4 / Property 16)
 *   3. handler.process(input) → merge contextUpdates → resolveNextNode
 *   4. Auto-advance through message nodes with visited-set cycle guard
 *   5. Atomic persist-transition-and-render (Req 3.3, 3.4)
 *   6. Validation failure re-renders same node with error banner (Req 12.1, 12.2)
 *   7. Dead-end returns cannot-continue message (Req 4.5)
 *   8. 24h timeout resets to entry (Req 14.1)
 *   9. Mark complete on booking finalize (Req 14.2)
 *
 * Observability:
 *   - Transition logs: conversationId, source node, destination node (Req 17.1)
 *   - Error logs: conversationId, nodeId (Req 17.2)
 *   - No secrets or message-body content in logs (Req 17.4)
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5,
 *              5.1, 5.5, 12.1, 12.2, 14.1, 14.2, 14.3, 14.4, 17.1, 17.2, 17.4
 */

import { prisma } from '@salex/shared-types';
import type { FlowDefinition } from '@salex/shared-types';
import { resolveNextNode } from './flow-engine/resolve-next-node';
import type { FlowContext } from './flow-engine/resolve-next-node';
import { flowService } from './flow.service';
import type { InteractiveMessage } from './conversation.service';
import type { NodeHandlerMap, NodeRenderArgs, NodeProcessArgs } from './flow-handlers/types';
import { messageHandler } from './flow-handlers/message';
import { questionHandler } from './flow-handlers/question';
import { servicePickerHandler } from './flow-handlers/service-picker';
import { staffPickerHandler } from './flow-handlers/staff-picker';
import { timePickerHandler } from './flow-handlers/time-picker';
import { confirmationHandler } from './flow-handlers/confirmation';
import { bookingHandler } from './flow-handlers/booking';
import { flowContextBuilder } from './flow-context-builder.service';
import { logger } from '../utils/logger';
import { parseNavAction, NAV, midFlowContextMessage } from './whatsapp-ui.service';

// ─── Constants ───────────────────────────────────────────────────────────────

/** 24 hours in milliseconds — timeout threshold for conversation reset (Req 14.1). */
const CONVERSATION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/** Entry sentinel state — a conversation in this state with no flowId is "fresh" (Req 5.1). */
const ENTRY_SENTINEL = 'GREETING';

/** Maximum auto-advance steps to prevent infinite loops on cyclic message nodes (Req 4.4). */
const MAX_AUTO_ADVANCE_STEPS = 50;

/** Dead-end message returned when no transition is possible (Req 4.5). */
const DEAD_END_MESSAGE: InteractiveMessage = {
  type: 'text',
  body: {
    text: 'Sorry, this conversation cannot continue. Please start a new conversation or contact the business directly.',
  },
};

/** Message shown when the conversation is restarting due to an invalid pinned flow (Req 14.4). */
const RESTART_MESSAGE_PREFIX =
  '🔄 Your previous conversation could not be continued. Starting fresh.\n\n';

// ─── Handler Registry ────────────────────────────────────────────────────────

const handlerMap: NodeHandlerMap = {
  message: messageHandler,
  question: questionHandler,
  service_picker: servicePickerHandler,
  staff_picker: staffPickerHandler,
  time_picker: timePickerHandler,
  confirmation: confirmationHandler,
  booking: bookingHandler,
};

// ─── Result Type ─────────────────────────────────────────────────────────────

export interface FlowEngineResult {
  conversationId: string;
  currentNodeId: string;
  message: InteractiveMessage;
  context: FlowContext;
  engine: 'flow';
  complete: boolean;
}

// ─── Flow Engine ─────────────────────────────────────────────────────────────

class FlowEngineService {
  /**
   * Process an inbound message through the flow engine.
   *
   * Drop-in peer of conversationService.processMessage — same positional
   * signature so the worker can call either through the EngineRouter.
   *
   * @param customerPhone - Customer's phone number
   * @param messageText - Raw text content of the inbound message
   * @param interactiveReply - Structured interactive reply (button/list) if present
   * @param businessId - Resolved business id (required for flow engine, Req 16.1)
   */
  async processMessage(
    customerPhone: string,
    messageText: string,
    interactiveReply: { type: string; id: string; title: string } | undefined,
    businessId: string,
  ): Promise<FlowEngineResult> {
    const normalizedCustomerPhone = this.normalizePhoneNumber(customerPhone);

    // 1. Find or create conversation (upsert by customerPhone + businessId, Req 14.3)
    const conversation = await this.findOrCreateConversation(normalizedCustomerPhone, businessId);

    // 2. Check 24h timeout: if lastMessageAt > 24h ago, reset to entry (Req 14.1)
    const timeSinceLastMessage = Date.now() - conversation.lastMessageAt.getTime();
    if (timeSinceLastMessage > CONVERSATION_TIMEOUT_MS) {
      logger.info(
        { conversationId: conversation.id },
        'Flow engine: conversation timed out (>24h), resetting to entry',
      );
      return this.resetToEntry(conversation.id, businessId, normalizedCustomerPhone);
    }

    // 2b. Navigation interceptor — handle start_over and change_salon before state-specific logic
    const navAction = parseNavAction(interactiveReply?.id, messageText);
    if (navAction === NAV.START_OVER) {
      logger.info({ conversationId: conversation.id }, 'Flow engine: start over requested');
      return this.resetToEntry(conversation.id, businessId, normalizedCustomerPhone);
    }
    if (navAction === NAV.CHANGE_SALON) {
      // Clear business association — conversation service will handle business search
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { businessId: null, state: 'GREETING', flowId: null, flowVersion: null, contextData: {} },
      });
      // Return a text message directing to salon search (engine router will pick this up next message)
      return {
        conversationId: conversation.id,
        currentNodeId: 'GREETING',
        message: { type: 'text', body: { text: '👋 Find your salon\n\nSearch by salon name, area, address, or enter your salon code.' } },
        context: {},
        engine: 'flow',
        complete: false,
      };
    }

    // 2c. "hi"/"hello" mid-flow → contextual menu instead of reset
    if (conversation.state !== ENTRY_SENTINEL && conversation.state !== 'COMPLETED') {
      const lower = messageText.trim().toLowerCase();
      if (lower === 'hi' || lower === 'hello' || lower === 'hey') {
        const contextMsg = midFlowContextMessage({
          currentStep: conversation.state,
          businessName: undefined, // flow engine doesn't have business name in memory
        });
        return {
          conversationId: conversation.id,
          currentNodeId: conversation.state,
          message: contextMsg,
          context: (conversation.contextData as FlowContext) || {},
          engine: 'flow',
          complete: false,
        };
      }
    }

    // 3. Fresh start detection: state === ENTRY_SENTINEL and no flowId → pin active flow, render entry
    if (conversation.state === ENTRY_SENTINEL && !conversation.flowId) {
      return this.handleFreshStart(conversation.id, businessId, normalizedCustomerPhone);
    }

    // 3b. COMPLETED state: previous booking finished
    if (conversation.state === 'COMPLETED') {
      // If user tapped "Book Again" (start over), reset and start fresh
      if (interactiveReply?.id === NAV.START_OVER || messageText.trim().toLowerCase() === 'book again') {
        logger.info(
          { conversationId: conversation.id },
          'Flow engine: user requested new booking after completion',
        );
        return this.resetToEntry(conversation.id, businessId, normalizedCustomerPhone);
      }

      // Otherwise show "Booking done, book again?" button
      return {
        conversationId: conversation.id,
        currentNodeId: 'COMPLETED',
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
        context: (conversation.contextData as FlowContext) || {},
        engine: 'flow',
        complete: true,
      };
    }

    // 4. Load pinned flow (flowId + flowVersion); if invalid → reset (Req 14.4 / Property 16)
    const pinned = await this.loadPinnedFlow(
      conversation.flowId!,
      conversation.flowVersion!,
      businessId,
    );

    if (!pinned) {
      logger.warn(
        { conversationId: conversation.id, flowId: conversation.flowId, flowVersion: conversation.flowVersion },
        'Flow engine: pinned flow invalid/unloadable, resetting to entry',
      );
      return this.resetToEntryWithNotice(conversation.id, businessId, normalizedCustomerPhone);
    }

    const { definition } = pinned;
    const currentNodeId = conversation.state;
    const context = await flowContextBuilder.hydrate(
      businessId,
      {
        ...((conversation.contextData as FlowContext) || {}),
        conversationId: conversation.id,
        customerPhone: normalizedCustomerPhone,
      },
    );

    // 5. Get handler for current node
    const currentNode = definition.nodes.find((n) => n.id === currentNodeId);
    if (!currentNode) {
      // Node missing from definition — treat as dead-end error
      logger.error(
        { conversationId: conversation.id, nodeId: currentNodeId },
        'Flow engine: current node not found in definition',
      );
      return this.returnDeadEnd(conversation.id, currentNodeId, context);
    }

    const handler = handlerMap[currentNode.type];
    if (!handler) {
      logger.error(
        { conversationId: conversation.id, nodeId: currentNodeId },
        'Flow engine: no handler for node type',
      );
      return this.returnDeadEnd(conversation.id, currentNodeId, context);
    }

    // 6. Process the customer's reply (Phase 2)
    if (!handler.process) {
      // Auto-advance node shouldn't receive process calls — treat as unexpected
      logger.error(
        { conversationId: conversation.id, nodeId: currentNodeId },
        'Flow engine: received message for auto-advance node',
      );
      return this.returnDeadEnd(conversation.id, currentNodeId, context);
    }

    const processArgs: NodeProcessArgs = {
      incomingMessage: messageText,
      interactiveReply,
      config: currentNode.config,
      context: { ...context, __currentNodeId: currentNodeId, conversationId: conversation.id, customerPhone: normalizedCustomerPhone },
      businessId,
    };

    const result = await handler.process(processArgs);

    // 7. If !complete: re-render same node with error banner (Req 12.1, 12.2)
    if (!result.complete) {
      // Merge any contextUpdates even on validation failure
      const updatedContext = result.contextUpdates
        ? await flowContextBuilder.hydrate(businessId, { ...context, ...result.contextUpdates })
        : context;

      // Re-render the same node
      const renderArgs: NodeRenderArgs = {
        config: currentNode.config,
        context: { ...updatedContext, __currentNodeId: currentNodeId },
        businessId,
      };
      const renderedMessage = await handler.render(renderArgs);

      // Prefix with error banner if present
      const message: InteractiveMessage = result.errorMessage
        ? {
            ...renderedMessage,
            body: { text: `⚠️ ${result.errorMessage}\n\n${renderedMessage.body.text}` },
          }
        : renderedMessage;

      // Persist same node (no advance), update context and lastMessageAt
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          state: currentNodeId,
          contextData: updatedContext as object,
          lastMessageAt: new Date(),
          version: { increment: 1 },
        },
      });

      return {
        conversationId: conversation.id,
        currentNodeId,
        message,
        context: updatedContext,
        engine: 'flow',
        complete: false,
      };
    }

    // 8. Complete: merge contextUpdates (Req 3.5)
    const mergedContext: FlowContext = result.contextUpdates
      ? await flowContextBuilder.hydrate(businessId, { ...context, ...result.contextUpdates })
      : context;

    // Check for terminal signal (booking finalize, Req 14.2)
    if (result.terminal) {
      // Mark complete — persist and return
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          state: 'COMPLETED',
          contextData: mergedContext as object,
          lastMessageAt: new Date(),
          version: { increment: 1 },
        },
      });

      // Render the current node one last time for the completion message
      const renderArgs: NodeRenderArgs = {
        config: currentNode.config,
        context: { ...mergedContext, __currentNodeId: currentNodeId },
        businessId,
      };
      const completionMessage = await handler.render(renderArgs);

      logger.info(
        { conversationId: conversation.id, nodeId: currentNodeId },
        'Flow engine: conversation completed (booking finalized)',
      );

      return {
        conversationId: conversation.id,
        currentNodeId,
        message: completionMessage,
        context: mergedContext,
        engine: 'flow',
        complete: true,
      };
    }

    // 9. Resolve next node (Req 4.1, 4.2)
    const nextNodeId = resolveNextNode(definition.edges, currentNodeId, mergedContext);

    if (!nextNodeId) {
      // Dead-end: no matching edge (Req 4.5)
      logger.error(
        { conversationId: conversation.id, nodeId: currentNodeId },
        'Flow engine: dead-end, no outgoing edge matched',
      );
      return this.returnDeadEnd(conversation.id, currentNodeId, mergedContext);
    }

    // 10. Auto-advance through message nodes with cycle guard (Req 4.3, 4.4)
    const { finalNodeId, finalMessage, finalContext } = await this.autoAdvance(
      definition,
      nextNodeId,
      mergedContext,
      businessId,
      conversation.id,
      currentNodeId,
    );

    if (!finalNodeId || !finalMessage) {
      // Cycle detected or dead-end during auto-advance
      logger.error(
        { conversationId: conversation.id, nodeId: nextNodeId },
        'Flow engine: dead-end or cycle during auto-advance',
      );
      return this.returnDeadEnd(conversation.id, nextNodeId, finalContext);
    }

    // 10b. If the completing node provided an errorMessage (e.g. hold expired),
    // prepend it to the next node's rendered message so the customer is informed (Req 9.2, 9.7)
    const outboundMessage: InteractiveMessage = result.errorMessage
      ? {
          ...finalMessage,
          body: { text: `⚠️ ${result.errorMessage}\n\n${finalMessage.body.text}` },
        }
      : finalMessage;

    // 11. Atomic persist-transition-and-render (Req 3.3, 3.4)
    // The rendered message was already produced during auto-advance.
    // Persist the transition — if this fails, no partial advance is observable.
    try {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          state: finalNodeId,
          contextData: finalContext as object,
          lastMessageAt: new Date(),
          version: { increment: 1 },
        },
      });
    } catch (persistError) {
      // Persist failed — log and re-throw so the worker can retry
      logger.error(
        { conversationId: conversation.id, nodeId: finalNodeId },
        'Flow engine: failed to persist transition',
      );
      throw persistError;
    }

    // Log transition (Req 17.1)
    logger.info(
      { conversationId: conversation.id, fromNode: currentNodeId, toNode: finalNodeId },
      'Flow engine: node transition',
    );

    return {
      conversationId: conversation.id,
      currentNodeId: finalNodeId,
      message: outboundMessage,
      context: finalContext,
      engine: 'flow',
      complete: false,
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * Find or create a conversation by customerPhone + businessId.
   * Upsert ensures one active conversation per (phone, business) pair (Req 14.3).
   */
  private async findOrCreateConversation(
    customerPhone: string,
    businessId: string,
  ) {
    const normalizedPhone = this.normalizePhoneNumber(customerPhone);

    // Try to find existing conversation for this phone + business
    let conversation = await prisma.whatsAppConversation.findUnique({
      where: {
        customerPhone_businessId: {
          customerPhone: normalizedPhone,
          businessId,
        },
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.whatsAppConversation.create({
        data: {
          customerPhone: normalizedPhone,
          businessId,
          state: ENTRY_SENTINEL,
          contextData: {},
          lastMessageAt: new Date(),
        },
      });

      logger.info(
        { conversationId: conversation.id },
        'Flow engine: new conversation created',
      );
    }

    return conversation;
  }

  /**
   * Handle a fresh start: pin the active flow and render the entry node.
   */
  private async handleFreshStart(
    conversationId: string,
    businessId: string,
    customerPhone?: string,
  ): Promise<FlowEngineResult> {
    // Pin the active flow for this business
    const { flowId, flowVersion, definition } = await flowService.pinFreshRun(businessId);

    const entryNode = definition.nodes.find((n) => n.id === definition.entryNodeId);
    if (!entryNode) {
      logger.error(
        { conversationId, nodeId: definition.entryNodeId },
        'Flow engine: entry node not found in definition',
      );
      return this.returnDeadEnd(conversationId, definition.entryNodeId, {});
    }

    const context = await flowContextBuilder.hydrate(businessId, {
      conversationId,
      ...(customerPhone ? { customerPhone } : {}),
    });

    // If entry node is auto-advance (message), render and advance
    if (entryNode.type === 'message') {
      const { finalNodeId, finalMessage, finalContext } = await this.autoAdvance(
        definition,
        definition.entryNodeId,
        context,
        businessId,
        conversationId,
        ENTRY_SENTINEL,
      );

      if (!finalNodeId || !finalMessage) {
        logger.error(
          { conversationId, nodeId: definition.entryNodeId },
          'Flow engine: dead-end or cycle during fresh-start auto-advance',
        );
        return this.returnDeadEnd(conversationId, definition.entryNodeId, finalContext);
      }

      // Persist: pin flow + set state to the final node after auto-advance
      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: {
          flowId,
          flowVersion,
          state: finalNodeId,
          contextData: finalContext as object,
          lastMessageAt: new Date(),
          version: { increment: 1 },
        },
      });

      logger.info(
        { conversationId, fromNode: ENTRY_SENTINEL, toNode: finalNodeId },
        'Flow engine: fresh start with auto-advance',
      );

      return {
        conversationId,
        currentNodeId: finalNodeId,
        message: finalMessage,
        context: finalContext,
        engine: 'flow',
        complete: false,
      };
    }

    // Entry node is not auto-advance — render it directly
    const handler = handlerMap[entryNode.type];
    const renderArgs: NodeRenderArgs = {
      config: entryNode.config,
      context: { ...context, __currentNodeId: entryNode.id },
      businessId,
    };
    const message = await handler.render(renderArgs);

    // Persist: pin flow + set state to entry node
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        flowId,
        flowVersion,
        state: definition.entryNodeId,
        contextData: context as object,
        lastMessageAt: new Date(),
        version: { increment: 1 },
      },
    });

    logger.info(
      { conversationId, fromNode: ENTRY_SENTINEL, toNode: definition.entryNodeId },
      'Flow engine: fresh start',
    );

    return {
      conversationId,
      currentNodeId: definition.entryNodeId,
      message,
      context,
      engine: 'flow',
      complete: false,
    };
  }

  /**
   * Auto-advance through message nodes with a visited-set cycle guard (Req 4.3, 4.4).
   *
   * Starting from `startNodeId`, renders each message node and advances to the next.
   * Stops when reaching a non-auto-advance node (renders it) or detects a cycle.
   *
   * Returns the final node id, the rendered message for that node, and the context.
   * If a cycle is detected or a dead-end is reached, returns null for finalNodeId/finalMessage.
   */
  private async autoAdvance(
    definition: FlowDefinition,
    startNodeId: string,
    context: FlowContext,
    businessId: string,
    conversationId: string,
    sourceNodeId: string,
  ): Promise<{
    finalNodeId: string | null;
    finalMessage: InteractiveMessage | null;
    finalContext: FlowContext;
  }> {
    const visited = new Set<string>();
    let currentId = startNodeId;
    const currentContext = { ...context };
    let lastRenderedMessage: InteractiveMessage | null = null;

    for (let step = 0; step < MAX_AUTO_ADVANCE_STEPS; step++) {
      // Check for cycle
      if (visited.has(currentId)) {
        // Cycle detected among message nodes (Req 4.4) — dead-end
        logger.error(
          { conversationId, nodeId: currentId },
          'Flow engine: cycle detected during auto-advance',
        );
        return { finalNodeId: null, finalMessage: null, finalContext: currentContext };
      }
      visited.add(currentId);

      const node = definition.nodes.find((n) => n.id === currentId);
      if (!node) {
        // Node missing — dead-end
        logger.error(
          { conversationId, nodeId: currentId },
          'Flow engine: node not found during auto-advance',
        );
        return { finalNodeId: null, finalMessage: null, finalContext: currentContext };
      }

      const handler = handlerMap[node.type];
      if (!handler) {
        logger.error(
          { conversationId, nodeId: currentId },
          'Flow engine: no handler for node type during auto-advance',
        );
        return { finalNodeId: null, finalMessage: null, finalContext: currentContext };
      }

      // Render the node
      const renderArgs: NodeRenderArgs = {
        config: node.config,
        context: { ...currentContext, __currentNodeId: currentId },
        businessId,
      };

      try {
        lastRenderedMessage = await handler.render(renderArgs);
      } catch (renderError) {
        // Render failed — Req 3.4: don't persist transition, roll back
        logger.error(
          { conversationId, nodeId: currentId },
          'Flow engine: render failed during auto-advance',
        );
        return { finalNodeId: null, finalMessage: null, finalContext: currentContext };
      }

      // If this node is NOT auto-advance, we stop here — this is the destination
      if (!handler.autoAdvance) {
        // Log transition from source to this node
        logger.info(
          { conversationId, fromNode: sourceNodeId, toNode: currentId },
          'Flow engine: auto-advance reached input node',
        );
        return { finalNodeId: currentId, finalMessage: lastRenderedMessage, finalContext: currentContext };
      }

      // Auto-advance: resolve next node from this message node
      const nextId = resolveNextNode(definition.edges, currentId, currentContext);
      if (!nextId) {
        // Dead-end after a message node
        logger.error(
          { conversationId, nodeId: currentId },
          'Flow engine: dead-end after message node during auto-advance',
        );
        return { finalNodeId: null, finalMessage: null, finalContext: currentContext };
      }

      // Log intermediate transition
      logger.info(
        { conversationId, fromNode: currentId, toNode: nextId },
        'Flow engine: auto-advancing through message node',
      );

      currentId = nextId;
    }

    // Exceeded max steps — treat as cycle/dead-end
    logger.error(
      { conversationId, nodeId: currentId },
      'Flow engine: exceeded max auto-advance steps',
    );
    return { finalNodeId: null, finalMessage: null, finalContext: currentContext };
  }

  /**
   * Reset conversation to entry node of the active flow (timeout or fresh restart).
   */
  private async resetToEntry(
    conversationId: string,
    businessId: string,
    customerPhone?: string,
  ): Promise<FlowEngineResult> {
    // Clear flow pinning so handleFreshStart will re-pin
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        state: ENTRY_SENTINEL,
        flowId: null,
        flowVersion: null,
        contextData: {},
        lastMessageAt: new Date(),
        version: { increment: 1 },
      },
    });

    // Now handle as fresh start
    return this.handleFreshStart(conversationId, businessId, customerPhone);
  }

  /**
   * Force a conversation onto the current published flow for a business.
   * Used when the shared-number legacy routing-code step has resolved a business
   * and the next response should come from the business's custom Flow_Engine.
   */
  async startFreshRun(
    customerPhone: string,
    businessId: string,
  ): Promise<FlowEngineResult> {
    const normalizedPhone = this.normalizePhoneNumber(customerPhone);
    const conversation = await this.findOrCreateConversation(normalizedPhone, businessId);

    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        state: ENTRY_SENTINEL,
        flowId: null,
        flowVersion: null,
        contextData: {},
        lastMessageAt: new Date(),
        version: { increment: 1 },
      },
    });

    return this.handleFreshStart(conversation.id, businessId, normalizedPhone);
  }

  private normalizePhoneNumber(phone: string): string {
    let normalized = phone.replace(/[^\d+]/g, '');

    if (!normalized.startsWith('+')) {
      if (normalized.length === 10) {
        normalized = '+91' + normalized;
      } else {
        normalized = '+' + normalized;
      }
    }

    return normalized;
  }

  /**
   * Reset to entry with a notice that the conversation is restarting (Req 14.4).
   * Used when the pinned flow is invalid/unloadable.
   */
  private async resetToEntryWithNotice(
    conversationId: string,
    businessId: string,
    customerPhone?: string,
  ): Promise<FlowEngineResult> {
    // Reset and get the fresh start result
    const result = await this.resetToEntry(conversationId, businessId, customerPhone);

    // Prefix the message with the restart notice
    const prefixedMessage: InteractiveMessage = {
      ...result.message,
      body: { text: `${RESTART_MESSAGE_PREFIX}${result.message.body.text}` },
    };

    return {
      ...result,
      message: prefixedMessage,
    };
  }

  /**
   * Load the pinned flow for an in-progress conversation.
   * Returns null if the flow is invalid/unloadable (caller handles reset).
   */
  private async loadPinnedFlow(
    flowId: string,
    flowVersion: number,
    businessId: string,
  ): Promise<{ definition: FlowDefinition } | null> {
    try {
      return await flowService.loadPinned(flowId, flowVersion, businessId);
    } catch {
      // Any error loading the pinned flow → treat as invalid
      return null;
    }
  }

  /**
   * Return a dead-end result (Req 4.5).
   */
  private returnDeadEnd(
    conversationId: string,
    currentNodeId: string,
    context: FlowContext,
  ): FlowEngineResult {
    return {
      conversationId,
      currentNodeId,
      message: DEAD_END_MESSAGE,
      context,
      engine: 'flow',
      complete: false,
    };
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const flowEngineService = new FlowEngineService();

/** Alias used by the EngineRouter. */
export const flowEngine = flowEngineService;

// Re-export the pure resolveNextNode for direct testing and use by the EngineRouter
export { resolveNextNode };
