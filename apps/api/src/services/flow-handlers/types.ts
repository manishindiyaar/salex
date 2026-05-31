/**
 * Node handler contracts for the WhatsApp Flow Engine.
 *
 * Each node type in a FlowDefinition is executed by a NodeHandler that
 * implements a two-phase lifecycle:
 *   Phase 1 (render) — produce the outbound WhatsApp message (Req 3.1)
 *   Phase 2 (process) — interpret the customer's reply (Req 3.2)
 *
 * Auto-advance nodes (e.g. message) only render and skip the process phase (Req 4.3).
 */

import type { NodeType } from '@salex/shared-types';
import type { InteractiveMessage } from '../conversation.service';

/**
 * Context accumulated across the conversation run.
 * Keyed by node id for responses, plus engine bookkeeping fields.
 * Treated as an open record so nodes can write arbitrary keys (Req 5.5).
 */
export type FlowContext = Record<string, unknown>;

/**
 * Result returned by a handler's `process` phase.
 */
export interface NodeResult {
  /** Whether the node has completed processing (Req 3.2). */
  complete: boolean;
  /** Key-value pairs merged into FlowContext before transition evaluation (Req 3.5). */
  contextUpdates?: Record<string, unknown>;
  /** Error banner text shown to the customer on validation failure (Req 12.1). */
  errorMessage?: string;
  /**
   * Terminal signal — when true the engine marks the conversation run as
   * complete (e.g. after booking finalization, Req 14.2).
   */
  terminal?: boolean;
}

/**
 * Arguments passed to a handler's `render` phase (Phase 1).
 */
export interface NodeRenderArgs {
  /** Per-node configuration from the FlowDefinition (message text, prompts, etc.). */
  config: Record<string, unknown>;
  /** Accumulated conversation context. */
  context: FlowContext;
  /** Resolved business id for tenant-scoped data access. */
  businessId: string;
}

/**
 * Arguments passed to a handler's `process` phase (Phase 2).
 */
export interface NodeProcessArgs {
  /** Raw text content of the customer's inbound message. */
  incomingMessage: string;
  /** Structured interactive reply (button/list selection) if present. */
  interactiveReply?: { type: string; id: string; title: string };
  /** Per-node configuration from the FlowDefinition. */
  config: Record<string, unknown>;
  /** Accumulated conversation context. */
  context: FlowContext;
  /** Resolved business id for tenant-scoped data access. */
  businessId: string;
}

/**
 * Contract every node type handler must satisfy.
 */
export interface NodeHandler {
  /** The node type this handler is responsible for. */
  type: NodeType;

  /**
   * Phase 1 — Produce the outbound WhatsApp message for this node (Req 3.1).
   * Called when the conversation transitions to this node.
   */
  render(args: NodeRenderArgs): Promise<InteractiveMessage>;

  /**
   * Phase 2 — Interpret the customer's reply and determine completion (Req 3.2).
   * Omitted for pure auto-advance nodes (e.g. message) which only render.
   */
  process?(args: NodeProcessArgs): Promise<NodeResult>;

  /**
   * Whether the engine should auto-advance past this node without waiting
   * for customer input (Req 4.3). True for message nodes.
   */
  autoAdvance: boolean;
}

/**
 * Registry mapping each NodeType to its handler implementation.
 */
export type NodeHandlerMap = Record<NodeType, NodeHandler>;
