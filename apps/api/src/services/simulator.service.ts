/**
 * Simulator Service
 *
 * Runs flow definitions in isolation for admin testing. Processes messages
 * through the same node handler logic as the production Flow Engine, but:
 *   - State is stored in SimulationSession (not WhatsAppConversation)
 *   - No BookingIntent or Booking records are created
 *   - No WhatsAppOutboundMessage (outbox) writes
 *   - Booking nodes return a simulated confirmation instead of finalizing
 *   - Supports both DRAFT and PUBLISHED flows (loaded by flowId directly)
 *
 * Public surface:
 *   - createSession(params) — creates a SimulationSession, loads flow definition
 *   - sendMessage(sessionId, text) — processes text through the flow
 *   - sendInteractive(sessionId, reply) — processes interactive reply
 *   - resetSession(sessionId) — deletes session and messages
 *   - getSession(sessionId) — returns session or null
 *
 * Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7, 7.8, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { prisma } from '@salex/shared-types';
import type { FlowDefinition, FlowNode } from '@salex/shared-types';
import { resolveNextNode } from './flow-engine/resolve-next-node';
import type { FlowContext } from './flow-engine/resolve-next-node';
import type { InteractiveMessage } from './conversation.service';
import type { NodeHandler, NodeHandlerMap, NodeRenderArgs, NodeProcessArgs, NodeResult } from './flow-handlers/types';
import { messageHandler } from './flow-handlers/message';
import { questionHandler } from './flow-handlers/question';
import { servicePickerHandler } from './flow-handlers/service-picker';
import { staffPickerHandler } from './flow-handlers/staff-picker';
import { timePickerHandler } from './flow-handlers/time-picker';
import { confirmationHandler } from './flow-handlers/confirmation';
import { bookingHandler } from './flow-handlers/booking';
import { flowContextBuilder } from './flow-context-builder.service';
import { logger } from '../utils/logger';
import { NotFoundError, AppError } from '../utils/errors';

// ─── Constants ───────────────────────────────────────────────────────────────

/** 60 minutes in milliseconds — session expiry timeout (Req 7.8). */
const SESSION_EXPIRY_MS = 60 * 60 * 1000;

/** Maximum auto-advance steps to prevent infinite loops. */
const MAX_AUTO_ADVANCE_STEPS = 50;

/** Dead-end message when no transition is possible. */
const DEAD_END_MESSAGE: InteractiveMessage = {
  type: 'text',
  body: {
    text: 'Sorry, this conversation cannot continue. Please reset the simulator and try again.',
  },
};

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface CreateSessionParams {
  businessId: string;
  flowId: string;
  adminId: string;
}

export interface SimulatorResponse {
  sessionId: string;
  message: InteractiveMessage;
  messages: InteractiveMessage[];
  currentNodeId: string;
  contextData: Record<string, unknown>;
  complete: boolean;
}

export interface InteractiveReply {
  type: string;
  id: string;
  title: string;
}

// ─── Handler Registry (same as production, minus booking isolation) ──────────

const handlerMap: NodeHandlerMap = {
  message: messageHandler,
  question: questionHandler,
  service_picker: servicePickerHandler,
  staff_picker: staffPickerHandler,
  time_picker: timePickerHandler,
  confirmation: confirmationHandler,
  booking: bookingHandler,
};

// ─── Simulator Service ───────────────────────────────────────────────────────

class SimulatorService {
  /**
   * Create a new simulation session.
   * Loads the flow definition by flowId (supports DRAFT and PUBLISHED).
   * Req 7.1, 10.4, 10.5
   */
  async createSession(params: CreateSessionParams): Promise<{
    session: {
      id: string;
      businessId: string;
      flowId: string;
      flowVersion: number;
      adminId: string;
      currentNodeId: string;
      contextData: Record<string, unknown>;
      lastMessageAt: Date;
      createdAt: Date;
    };
    initialResponse: SimulatorResponse;
  }> {
    const { businessId, flowId, adminId } = params;

    // Load the flow definition directly (not through resolveActiveFlow)
    const flow = await prisma.whatsAppFlow.findUnique({
      where: { id: flowId },
    });

    if (!flow) {
      throw new NotFoundError('Flow', flowId);
    }

    // Verify the flow belongs to the specified business (Req 7.7, 10.5)
    if (flow.businessId !== businessId) {
      throw new AppError(
        'FLOW_NOT_ACCESSIBLE',
        'Flow belongs to a different business and is not accessible for simulation',
        403,
      );
    }

    const definition = flow.definition as unknown as FlowDefinition;

    // Validate the flow has an entry node
    const entryNode = definition.nodes.find((n) => n.id === definition.entryNodeId);
    if (!entryNode) {
      throw new AppError(
        'INVALID_FLOW_DEFINITION',
        'Flow definition has no valid entry node',
        400,
      );
    }

    // Render the entry node (or auto-advance through message nodes)
    const context = await flowContextBuilder.hydrate(businessId, {});
    const { finalNodeId, finalMessage, finalContext, intermediateMessages } = await this.autoAdvance(
      definition,
      definition.entryNodeId,
      context,
      businessId,
    );

    if (!finalNodeId || !finalMessage) {
      throw new AppError(
        'INVALID_FLOW_DEFINITION',
        'Flow definition leads to a dead-end from the entry node',
        400,
      );
    }

    // Create the SimulationSession record
    const session = await prisma.simulationSession.create({
      data: {
        businessId,
        flowId: flow.id,
        flowVersion: flow.version,
        adminId,
        currentNodeId: finalNodeId,
        contextData: finalContext as object,
        lastMessageAt: new Date(),
      },
    });

    // Store intermediate messages (e.g. greeting) rendered during auto-advance
    for (const { message: intermediateMsg, nodeId } of intermediateMessages) {
      await this.storeMessage(session.id, 'outbound', intermediateMsg, nodeId);
    }

    // Store the final outbound message
    await this.storeMessage(session.id, 'outbound', finalMessage, finalNodeId);

    // Collect all messages for the response
    const allMessages: InteractiveMessage[] = [
      ...intermediateMessages.map((m) => m.message),
      finalMessage,
    ];

    const response: SimulatorResponse = {
      sessionId: session.id,
      message: finalMessage,
      messages: allMessages,
      currentNodeId: finalNodeId,
      contextData: finalContext,
      complete: false,
    };

    logger.info(
      { sessionId: session.id, flowId, businessId, adminId },
      'Simulator: session created',
    );

    return {
      session: {
        id: session.id,
        businessId: session.businessId,
        flowId: session.flowId,
        flowVersion: session.flowVersion,
        adminId: session.adminId,
        currentNodeId: session.currentNodeId,
        contextData: session.contextData as Record<string, unknown>,
        lastMessageAt: session.lastMessageAt,
        createdAt: session.createdAt,
      },
      initialResponse: response,
    };
  }

  /**
   * Send a text message to the simulator session.
   * Req 7.4, 10.1, 10.2
   */
  async sendMessage(sessionId: string, text: string): Promise<SimulatorResponse> {
    return this.processInput(sessionId, text, undefined);
  }

  /**
   * Send an interactive reply to the simulator session.
   * Req 7.4, 10.1, 10.2
   */
  async sendInteractive(sessionId: string, reply: InteractiveReply): Promise<SimulatorResponse> {
    return this.processInput(sessionId, reply.title, reply);
  }

  /**
   * Reset (delete) a simulation session and all associated messages.
   * Req 10.3
   */
  async resetSession(sessionId: string): Promise<void> {
    // Cascade delete handles SimulationMessage records
    const deleted = await prisma.simulationSession.deleteMany({
      where: { id: sessionId },
    });

    if (deleted.count === 0) {
      throw new NotFoundError('SimulationSession', sessionId);
    }

    logger.info({ sessionId }, 'Simulator: session reset');
  }

  /**
   * Get a simulation session by id.
   * Returns null if not found.
   */
  async getSession(sessionId: string): Promise<{
    id: string;
    businessId: string;
    flowId: string;
    flowVersion: number;
    adminId: string;
    currentNodeId: string;
    contextData: Record<string, unknown>;
    lastMessageAt: Date;
    createdAt: Date;
  } | null> {
    const session = await prisma.simulationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      businessId: session.businessId,
      flowId: session.flowId,
      flowVersion: session.flowVersion,
      adminId: session.adminId,
      currentNodeId: session.currentNodeId,
      contextData: session.contextData as Record<string, unknown>,
      lastMessageAt: session.lastMessageAt,
      createdAt: session.createdAt,
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * Core processing logic shared by sendMessage and sendInteractive.
   * Implements the isolation adapter pattern.
   */
  private async processInput(
    sessionId: string,
    text: string,
    interactiveReply: InteractiveReply | undefined,
  ): Promise<SimulatorResponse> {
    // 1. Load the session
    const session = await prisma.simulationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundError('SimulationSession', sessionId);
    }

    // 2. Check 60-minute expiry (Req 7.8)
    const timeSinceLastMessage = Date.now() - session.lastMessageAt.getTime();
    if (timeSinceLastMessage > SESSION_EXPIRY_MS) {
      throw new AppError(
        'SESSION_EXPIRED',
        'Simulation session has expired (inactive for 60+ minutes). Please create a new session.',
        410,
      );
    }

    // 3. Load the flow definition
    const flow = await prisma.whatsAppFlow.findFirst({
      where: { id: session.flowId, version: session.flowVersion },
    });

    if (!flow) {
      throw new AppError(
        'FLOW_NOT_FOUND',
        'The flow associated with this session no longer exists',
        404,
      );
    }

    const definition = flow.definition as unknown as FlowDefinition;
    const currentNodeId = session.currentNodeId;
    const context = await flowContextBuilder.hydrate(
      flow.businessId,
      (session.contextData as FlowContext) || {},
    );

    // Store the inbound message
    await this.storeMessage(session.id, 'inbound', {
      type: 'text',
      body: { text },
    }, currentNodeId);

    // 4. Get the current node from the definition
    const currentNode = definition.nodes.find((n) => n.id === currentNodeId);
    if (!currentNode) {
      return this.returnDeadEnd(session.id, currentNodeId, context);
    }

    // 5. Check if this is a booking node with confirm action — simulate instead of real booking
    if (currentNode.type === 'booking') {
      return this.handleSimulatedBooking(
        session.id,
        currentNode,
        definition,
        text,
        interactiveReply,
        context,
        flow.businessId,
      );
    }

    // 6. Check if this is a confirmation node — use isolated confirmation handler
    if (currentNode.type === 'confirmation') {
      return this.handleSimulatedConfirmation(
        session.id,
        currentNode,
        definition,
        text,
        interactiveReply,
        context,
        flow.businessId,
      );
    }

    // 7. Get handler for current node
    const handler = handlerMap[currentNode.type];
    if (!handler || !handler.process) {
      return this.returnDeadEnd(session.id, currentNodeId, context);
    }

    // 8. Process the input
    const processArgs: NodeProcessArgs = {
      incomingMessage: text,
      interactiveReply,
      config: currentNode.config,
      context: { ...context, __currentNodeId: currentNodeId },
      businessId: flow.businessId,
    };

    const result = await handler.process(processArgs);

    // 9. If !complete: re-render same node with error banner
    if (!result.complete) {
      const updatedContext = result.contextUpdates
        ? await flowContextBuilder.hydrate(flow.businessId, { ...context, ...result.contextUpdates })
        : context;

      const renderArgs: NodeRenderArgs = {
        config: currentNode.config,
        context: { ...updatedContext, __currentNodeId: currentNodeId },
        businessId: flow.businessId,
      };
      const renderedMessage = await handler.render(renderArgs);

      const message: InteractiveMessage = result.errorMessage
        ? {
            ...renderedMessage,
            body: { text: `⚠️ ${result.errorMessage}\n\n${renderedMessage.body.text}` },
          }
        : renderedMessage;

      // Update session (same node, updated context)
      await prisma.simulationSession.update({
        where: { id: session.id },
        data: {
          contextData: updatedContext as object,
          lastMessageAt: new Date(),
        },
      });

      // Store outbound message
      await this.storeMessage(session.id, 'outbound', message, currentNodeId);

      return {
        sessionId: session.id,
        message,
        messages: [message],
        currentNodeId,
        contextData: updatedContext,
        complete: false,
      };
    }

    // 10. Complete: merge contextUpdates
    let mergedContext: FlowContext = result.contextUpdates
      ? await flowContextBuilder.hydrate(flow.businessId, { ...context, ...result.contextUpdates })
      : context;

    // Check for terminal signal
    if (result.terminal) {
      const renderArgs: NodeRenderArgs = {
        config: currentNode.config,
        context: { ...mergedContext, __currentNodeId: currentNodeId },
        businessId: flow.businessId,
      };
      const completionMessage = await handler.render(renderArgs);

      await prisma.simulationSession.update({
        where: { id: session.id },
        data: {
          currentNodeId,
          contextData: mergedContext as object,
          lastMessageAt: new Date(),
        },
      });

      await this.storeMessage(session.id, 'outbound', completionMessage, currentNodeId);

      return {
        sessionId: session.id,
        message: completionMessage,
        messages: [completionMessage],
        currentNodeId,
        contextData: mergedContext,
        complete: true,
      };
    }

    // 11. Resolve next node
    const nextNodeId = resolveNextNode(definition.edges, currentNodeId, mergedContext);

    if (!nextNodeId) {
      return this.returnDeadEnd(session.id, currentNodeId, mergedContext);
    }

    // 12. Auto-advance through message nodes
    const { finalNodeId, finalMessage, finalContext, intermediateMessages } = await this.autoAdvance(
      definition,
      nextNodeId,
      mergedContext,
      flow.businessId,
    );

    if (!finalNodeId || !finalMessage) {
      return this.returnDeadEnd(session.id, nextNodeId, finalContext);
    }

    // 13. Persist the transition to SimulationSession
    await prisma.simulationSession.update({
      where: { id: session.id },
      data: {
        currentNodeId: finalNodeId,
        contextData: finalContext as object,
        lastMessageAt: new Date(),
      },
    });

    // Store intermediate messages from auto-advance
    for (const { message: intermediateMsg, nodeId } of intermediateMessages) {
      await this.storeMessage(session.id, 'outbound', intermediateMsg, nodeId);
    }

    // Store final outbound message
    await this.storeMessage(session.id, 'outbound', finalMessage, finalNodeId);

    // Collect all messages for the response
    const allMessages: InteractiveMessage[] = [
      ...intermediateMessages.map((m) => m.message),
      finalMessage,
    ];

    logger.info(
      { sessionId: session.id, fromNode: currentNodeId, toNode: finalNodeId },
      'Simulator: node transition',
    );

    return {
      sessionId: session.id,
      message: finalMessage,
      messages: allMessages,
      currentNodeId: finalNodeId,
      contextData: finalContext,
      complete: false,
    };
  }

  /**
   * Handle booking node in simulation — skip actual booking, return simulated confirmation.
   * Req 10.6
   */
  private async handleSimulatedBooking(
    sessionId: string,
    currentNode: FlowNode,
    definition: FlowDefinition,
    text: string,
    interactiveReply: InteractiveReply | undefined,
    context: FlowContext,
    businessId: string,
  ): Promise<SimulatorResponse> {
    const currentNodeId = currentNode.id;

    // Determine if this is a confirm or cancel action
    const isConfirm =
      interactiveReply?.id === 'btn_confirm_booking' ||
      text.toLowerCase().includes('confirm') ||
      text.toLowerCase().includes('yes');

    const isCancel =
      interactiveReply?.id === 'btn_cancel_booking' ||
      text.toLowerCase().includes('cancel') ||
      text.toLowerCase().includes('no');

    if (isCancel) {
      // Cancel: complete the node with cancel context
      const mergedContext = await flowContextBuilder.hydrate(businessId, {
        ...context,
        bookingCancelled: true,
        requestedTime: undefined,
        bookingIntentId: undefined,
      });

      // Resolve next node (if any edge handles cancel)
      const nextNodeId = resolveNextNode(definition.edges, currentNodeId, mergedContext);

      if (nextNodeId) {
        const { finalNodeId, finalMessage, finalContext } = await this.autoAdvance(
          definition,
          nextNodeId,
          mergedContext,
          businessId,
        );

        if (finalNodeId && finalMessage) {
          await prisma.simulationSession.update({
            where: { id: sessionId },
            data: {
              currentNodeId: finalNodeId,
              contextData: finalContext as object,
              lastMessageAt: new Date(),
            },
          });

          await this.storeMessage(sessionId, 'outbound', finalMessage, finalNodeId);

          return {
            sessionId,
            message: finalMessage,
            messages: [finalMessage],
            currentNodeId: finalNodeId,
            contextData: finalContext,
            complete: false,
          };
        }
      }

      // No next node or dead-end after cancel
      const cancelMessage: InteractiveMessage = {
        type: 'text',
        body: { text: '❌ Booking cancelled (simulated).' },
      };

      await prisma.simulationSession.update({
        where: { id: sessionId },
        data: {
          currentNodeId,
          contextData: mergedContext as object,
          lastMessageAt: new Date(),
        },
      });

      await this.storeMessage(sessionId, 'outbound', cancelMessage, currentNodeId);

      return {
        sessionId,
        message: cancelMessage,
        messages: [cancelMessage],
        currentNodeId,
        contextData: mergedContext,
        complete: true,
      };
    }

    if (isConfirm) {
      // Simulate booking confirmation without creating real records (Req 10.6)
      const simulatedBookingId = `sim_booking_${Date.now()}`;
      const mergedContext = await flowContextBuilder.hydrate(businessId, {
        ...context,
        bookingIntentId: `sim_intent_${Date.now()}`,
        bookingId: simulatedBookingId,
        bookingConfirmed: true,
      });

      const serviceName = (context.serviceNames as string) || 'Selected service';
      const requestedTime = context.requestedTime as string | undefined;
      const timeDisplay = requestedTime
        ? new Date(requestedTime).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'Selected time';

      const confirmationMessage: InteractiveMessage = {
        type: 'text',
        body: {
          text:
            `✅ Booking Confirmed (Simulated)\n\n` +
            `📋 Booking ID: ${simulatedBookingId}\n` +
            `💇 ${serviceName}\n` +
            `📅 ${timeDisplay}\n\n` +
            `⚠️ This is a simulated booking — no real booking was created.`,
        },
      };

      await prisma.simulationSession.update({
        where: { id: sessionId },
        data: {
          currentNodeId,
          contextData: mergedContext as object,
          lastMessageAt: new Date(),
        },
      });

      await this.storeMessage(sessionId, 'outbound', confirmationMessage, currentNodeId);

      return {
        sessionId,
        message: confirmationMessage,
        messages: [confirmationMessage],
        currentNodeId,
        contextData: mergedContext,
        complete: true,
      };
    }

    // Neither confirm nor cancel — re-render the booking node
    const renderArgs: NodeRenderArgs = {
      config: currentNode.config,
      context: { ...context, __currentNodeId: currentNodeId },
      businessId,
    };
    const renderedMessage = await bookingHandler.render(renderArgs);
    const message: InteractiveMessage = {
      ...renderedMessage,
      body: { text: `⚠️ Please tap "Confirm" or "Cancel" to proceed.\n\n${renderedMessage.body.text}` },
    };

    await prisma.simulationSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() },
    });

    await this.storeMessage(sessionId, 'outbound', message, currentNodeId);

    return {
      sessionId,
      message,
      messages: [message],
      currentNodeId,
      contextData: context,
      complete: false,
    };
  }

  /**
   * Handle confirmation node in simulation — skip actual BookingIntent creation.
   * Uses the same logic as the confirmation handler but without persisting BookingIntent.
   * Req 10.6
   */
  private async handleSimulatedConfirmation(
    sessionId: string,
    currentNode: FlowNode,
    definition: FlowDefinition,
    text: string,
    interactiveReply: InteractiveReply | undefined,
    context: FlowContext,
    businessId: string,
  ): Promise<SimulatorResponse> {
    const currentNodeId = currentNode.id;
    const config = currentNode.config;

    const confirmButtonId = 'btn_confirm_booking';
    const cancelButtonId = 'btn_cancel_booking';

    const isConfirm =
      interactiveReply?.id === confirmButtonId ||
      text.toLowerCase().includes('confirm') ||
      text.toLowerCase().includes('yes');

    const isCancel =
      interactiveReply?.id === cancelButtonId ||
      text.toLowerCase().includes('cancel') ||
      text.toLowerCase().includes('no');

    const existingResponses = (context.responses as Record<string, unknown>) || {};

    if (isCancel) {
      const mergedContext = await flowContextBuilder.hydrate(businessId, {
        ...context,
        responses: { ...existingResponses, confirmation: 'cancel' },
        selectedServiceIds: undefined,
        requestedTime: undefined,
        bookingIntentId: undefined,
      });

      // Resolve next node
      const nextNodeId = resolveNextNode(definition.edges, currentNodeId, mergedContext);

      if (nextNodeId) {
        const { finalNodeId, finalMessage, finalContext } = await this.autoAdvance(
          definition,
          nextNodeId,
          mergedContext,
          businessId,
        );

        if (finalNodeId && finalMessage) {
          await prisma.simulationSession.update({
            where: { id: sessionId },
            data: {
              currentNodeId: finalNodeId,
              contextData: finalContext as object,
              lastMessageAt: new Date(),
            },
          });

          await this.storeMessage(sessionId, 'outbound', finalMessage, finalNodeId);

          return {
            sessionId,
            message: finalMessage,
            messages: [finalMessage],
            currentNodeId: finalNodeId,
            contextData: finalContext,
            complete: false,
          };
        }
      }

      return this.returnDeadEnd(sessionId, currentNodeId, mergedContext);
    }

    if (isConfirm) {
      // Simulate the hold creation without persisting BookingIntent
      const simulatedIntentId = `sim_intent_${Date.now()}`;
      const mergedContext = await flowContextBuilder.hydrate(businessId, {
        ...context,
        responses: { ...existingResponses, confirmation: 'confirm' },
        bookingIntentId: simulatedIntentId,
      });

      // Resolve next node
      const nextNodeId = resolveNextNode(definition.edges, currentNodeId, mergedContext);

      if (nextNodeId) {
        const { finalNodeId, finalMessage, finalContext } = await this.autoAdvance(
          definition,
          nextNodeId,
          mergedContext,
          businessId,
        );

        if (finalNodeId && finalMessage) {
          await prisma.simulationSession.update({
            where: { id: sessionId },
            data: {
              currentNodeId: finalNodeId,
              contextData: finalContext as object,
              lastMessageAt: new Date(),
            },
          });

          await this.storeMessage(sessionId, 'outbound', finalMessage, finalNodeId);

          return {
            sessionId,
            message: finalMessage,
            messages: [finalMessage],
            currentNodeId: finalNodeId,
            contextData: finalContext,
            complete: false,
          };
        }
      }

      return this.returnDeadEnd(sessionId, currentNodeId, mergedContext);
    }

    // Neither confirm nor cancel — re-render
    const handler = handlerMap[currentNode.type];
    const renderArgs: NodeRenderArgs = {
      config: currentNode.config,
      context: { ...context, __currentNodeId: currentNodeId },
      businessId,
    };
    const renderedMessage = await handler.render(renderArgs);
    const message: InteractiveMessage = {
      ...renderedMessage,
      body: { text: `⚠️ Please tap ✅ Confirm or ❌ Cancel to proceed.\n\n${renderedMessage.body.text}` },
    };

    await prisma.simulationSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() },
    });

    await this.storeMessage(sessionId, 'outbound', message, currentNodeId);

    return {
      sessionId,
      message,
      messages: [message],
      currentNodeId,
      contextData: context,
      complete: false,
    };
  }

  /**
   * Auto-advance through message nodes with a visited-set cycle guard.
   * Same logic as the production Flow Engine but without persistence side effects.
   * Returns intermediate messages rendered by auto-advance nodes before the final input node.
   */
  private async autoAdvance(
    definition: FlowDefinition,
    startNodeId: string,
    context: FlowContext,
    businessId: string,
  ): Promise<{
    finalNodeId: string | null;
    finalMessage: InteractiveMessage | null;
    finalContext: FlowContext;
    intermediateMessages: { message: InteractiveMessage; nodeId: string }[];
  }> {
    const visited = new Set<string>();
    let currentId = startNodeId;
    let currentContext = { ...context };
    let lastRenderedMessage: InteractiveMessage | null = null;
    const intermediateMessages: { message: InteractiveMessage; nodeId: string }[] = [];

    for (let step = 0; step < MAX_AUTO_ADVANCE_STEPS; step++) {
      if (visited.has(currentId)) {
        // Cycle detected
        return { finalNodeId: null, finalMessage: null, finalContext: currentContext, intermediateMessages };
      }
      visited.add(currentId);

      const node = definition.nodes.find((n) => n.id === currentId);
      if (!node) {
        return { finalNodeId: null, finalMessage: null, finalContext: currentContext, intermediateMessages };
      }

      const handler = handlerMap[node.type];
      if (!handler) {
        return { finalNodeId: null, finalMessage: null, finalContext: currentContext, intermediateMessages };
      }

      // Render the node
      const renderArgs: NodeRenderArgs = {
        config: node.config,
        context: { ...currentContext, __currentNodeId: currentId },
        businessId,
      };

      try {
        lastRenderedMessage = await handler.render(renderArgs);
      } catch {
        return { finalNodeId: null, finalMessage: null, finalContext: currentContext, intermediateMessages };
      }

      // If this node is NOT auto-advance, stop here
      if (!handler.autoAdvance) {
        return { finalNodeId: currentId, finalMessage: lastRenderedMessage, finalContext: currentContext, intermediateMessages };
      }

      // This is an auto-advance node — store its rendered message as intermediate
      intermediateMessages.push({ message: lastRenderedMessage, nodeId: currentId });

      // Auto-advance: resolve next node
      const nextId = resolveNextNode(definition.edges, currentId, currentContext);
      if (!nextId) {
        return { finalNodeId: null, finalMessage: null, finalContext: currentContext, intermediateMessages };
      }

      currentId = nextId;
    }

    // Exceeded max steps
    return { finalNodeId: null, finalMessage: null, finalContext: currentContext, intermediateMessages };
  }

  /**
   * Return a dead-end response and update the session.
   */
  private async returnDeadEnd(
    sessionId: string,
    currentNodeId: string,
    context: FlowContext,
  ): Promise<SimulatorResponse> {
    await prisma.simulationSession.update({
      where: { id: sessionId },
      data: {
        currentNodeId,
        contextData: context as object,
        lastMessageAt: new Date(),
      },
    });

    await this.storeMessage(sessionId, 'outbound', DEAD_END_MESSAGE, currentNodeId);

    return {
      sessionId,
      message: DEAD_END_MESSAGE,
      messages: [DEAD_END_MESSAGE],
      currentNodeId,
      contextData: context,
      complete: false,
    };
  }

  /**
   * Store a message in the SimulationMessage table.
   */
  private async storeMessage(
    sessionId: string,
    direction: 'inbound' | 'outbound',
    message: InteractiveMessage,
    nodeId: string | null,
  ): Promise<void> {
    await prisma.simulationMessage.create({
      data: {
        sessionId,
        direction,
        messageType: message.type === 'text' ? 'text' : 'interactive',
        content: message as unknown as object,
        nodeId,
      },
    });
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const simulatorService = new SimulatorService();
