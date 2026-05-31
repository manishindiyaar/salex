/**
 * Engine Router Service
 *
 * Decides per-conversation whether the Flow_Engine or the Legacy_Router
 * handles a message, and falls back to the other engine on failure.
 *
 * Implements the Strangler Fig routing pattern (Req 11):
 * - `selectEngine` — pure decision function (unit/property testable)
 * - `route` — async orchestrator that resolves flags, selects, invokes,
 *   and falls back on error
 *
 * Default configuration routes everyone to legacy (no business flagged,
 * global cutover off).
 *
 * Requirements: 7.2, 7.3, 7.4, 11.1, 11.2, 11.3, 11.4, 11.5, 17.3, 17.4
 * Requirements (drain): 5.4, 14.1, 15.6
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO(post-parity): SIMPLIFY FALLBACK AFTER LEGACY REMOVAL
 *
 * Once the soak/verification window confirms parity (golden tests + engine-
 * marker diffing) and the legacy switch-case handlers are removed from
 * conversation.service.ts:
 *
 *   1. Remove the `catch` fallback to Legacy_Router in `route()` — the
 *      Flow_Engine becomes the sole engine; errors should surface directly
 *      or use a dedicated error-recovery strategy (not a legacy fallback).
 *   2. Remove `LEGACY_MID_FLIGHT_STATES` and `isLegacyMidFlight()` — no
 *      more legacy conversations to drain.
 *   3. Simplify `selectEngine()` — with global cutover permanently on and
 *      legacy gone, the function can be reduced or inlined.
 *   4. Remove the `conversationService` import (only needed for fallback).
 *
 * DO NOT simplify until the verification gate is met.
 * See: tasks.md task 22.1, requirements 11.3, 11.5
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { prisma } from '@salex/shared-types';
import { getConfig } from '../config';
import { logger } from '../utils/logger';
import { conversationService, type InteractiveMessage } from './conversation.service';
import { flowEngine } from './flow-engine.service';
import { flowService } from './flow.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EngineKind = 'flow' | 'legacy';

export interface RouteOutcome {
  conversationId: string;
  message: InteractiveMessage;
  /** Which engine actually produced the response (Req 11.5). */
  engine: EngineKind;
}

export interface SelectEngineInput {
  businessId?: string;
  globalCutover: boolean;
  businessFlagged: boolean;
  hasActiveCustomFlow: boolean;
}

export interface RouteInput {
  customerPhone: string;
  messageText: string;
  interactiveReply?: { type: string; id: string; title: string };
  businessId?: string;
  phoneNumberId?: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Legacy conversation states that indicate a mid-flight conversation on the
 * Legacy_Router. "GREETING" is the entry sentinel (fresh start for either
 * engine) and "COMPLETED" means the interaction is done — neither is mid-flight.
 * "SHOP_CLOSED" is a terminal state, not mid-flight.
 *
 * A conversation whose `state` is one of these values AND has no `flowId`
 * (meaning it was started on legacy) should continue draining on the
 * Legacy_Router until it completes or hits the 24h timeout (Req 5.4, 14.1, 15.6).
 */
export const LEGACY_MID_FLIGHT_STATES: ReadonlySet<string> = new Set([
  'AWAITING_ROUTING_CODE',
  'SERVICE_SELECTION',
  'TIME_SELECTION',
  'CONFIRMATION',
]);

/**
 * Determine whether an existing conversation is mid-flight on the Legacy_Router.
 *
 * A conversation is considered mid-flight on legacy when:
 * 1. Its `state` is one of the legacy mid-flight enum values (not GREETING/COMPLETED)
 * 2. It has no `flowId` (was never pinned to the Flow_Engine)
 *
 * Such conversations should drain on the Legacy_Router to avoid mid-conversation
 * engine swaps (Req 5.4, 14.1, 15.6).
 */
export function isLegacyMidFlight(conversation: {
  state: string;
  flowId: string | null;
} | null): boolean {
  if (!conversation) return false;
  return LEGACY_MID_FLIGHT_STATES.has(conversation.state) && !conversation.flowId;
}

/**
 * Read the global cutover flag from the centralized config module.
 * Defaults to `false` (everyone stays on legacy until explicitly enabled).
 */
function getGlobalCutover(): boolean {
  return getConfig().flowEngineGlobalCutover;
}

// ---------------------------------------------------------------------------
// Pure selection logic
// ---------------------------------------------------------------------------

/**
 * Pure decision function implementing the engine selection table.
 *
 * Rules (Req 11.1, 11.2, 11.3, 7.3):
 * - If `businessId` is undefined (unmatched phone_number_id, no routing yet) → legacy
 * - If `globalCutover` is true → flow (uses Default_Flow where no custom flow)
 * - Else if `businessFlagged` OR `hasActiveCustomFlow` → flow
 * - Else → legacy
 */
export function selectEngine(input: SelectEngineInput): EngineKind {
  // No resolved business → shared-number path, must go through Legacy_Router (Req 7.3)
  if (!input.businessId) {
    return 'legacy';
  }

  // Global cutover overrides everything (Req 11.3)
  if (input.globalCutover) {
    return 'flow';
  }

  // Per-business segmentation (Req 11.1)
  if (input.businessFlagged || input.hasActiveCustomFlow) {
    return 'flow';
  }

  // Default: legacy (Req 11.2)
  return 'legacy';
}

// ---------------------------------------------------------------------------
// Async route orchestrator
// ---------------------------------------------------------------------------

/**
 * Resolve business-level flags needed for engine selection.
 *
 * Sources:
 * - `businessFlagged`: Business.whatsappSettings.flowEngineEnabled (Req 11.1)
 * - `hasActiveCustomFlow`: flowService.hasActiveCustomFlow (Req 11.1)
 */
async function resolveBusinessFlags(businessId: string): Promise<{
  businessFlagged: boolean;
  hasActiveCustomFlow: boolean;
}> {
  // Fetch business whatsappSettings and check for an active custom flow in parallel
  const [business, hasActiveFlow] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { whatsappSettings: true },
    }),
    flowService.hasActiveCustomFlow(businessId),
  ]);

  // Extract the flowEngineEnabled flag from whatsappSettings JSON
  let businessFlagged = false;
  if (business?.whatsappSettings && typeof business.whatsappSettings === 'object') {
    const settings = business.whatsappSettings as Record<string, unknown>;
    businessFlagged = settings.flowEngineEnabled === true;
  }

  return {
    businessFlagged,
    hasActiveCustomFlow: hasActiveFlow,
  };
}

function normalizePhoneNumber(phone: string): string {
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

async function resolveBusinessIdFromExistingConversation(
  customerPhone: string,
): Promise<string | undefined> {
  const normalizedPhone = normalizePhoneNumber(customerPhone);
  const conversation = await prisma.whatsAppConversation.findFirst({
    where: {
      customerPhone: { in: [customerPhone, normalizedPhone] },
      businessId: { not: null },
    },
    select: { businessId: true },
    orderBy: { lastMessageAt: 'desc' },
  });

  return conversation?.businessId ?? undefined;
}

async function shouldUseFlowEngineForBusiness(
  businessId: string,
  globalCutover: boolean,
): Promise<boolean> {
  const flags = await resolveBusinessFlags(businessId);
  return selectEngine({
    businessId,
    globalCutover,
    businessFlagged: flags.businessFlagged,
    hasActiveCustomFlow: flags.hasActiveCustomFlow,
  }) === 'flow';
}

/**
 * Route an inbound message to the appropriate engine.
 *
 * On Flow_Engine error, falls back to the Legacy_Router so every routable
 * conversation reaches an engine (Req 11.4). Logs the routing decision
 * with the resolved business id and chosen/actual engine (Req 17.3).
 * Never logs message-body content or secrets (Req 17.4).
 */
async function route(input: RouteInput): Promise<RouteOutcome> {
  const { customerPhone, messageText, interactiveReply } = input;
  let businessId = input.businessId;
  let resolvedFromExistingConversation = false;

  // Resolve flags for engine selection
  let businessFlagged = false;
  let hasActiveCustomFlow = false;
  const globalCutover = getGlobalCutover();

  if (!businessId) {
    businessId = await resolveBusinessIdFromExistingConversation(customerPhone);
    resolvedFromExistingConversation = Boolean(businessId);
  }

  if (businessId) {
    const flags = await resolveBusinessFlags(businessId);
    businessFlagged = flags.businessFlagged;
    hasActiveCustomFlow = flags.hasActiveCustomFlow;
  }

  let chosenEngine = selectEngine({
    businessId,
    globalCutover,
    businessFlagged,
    hasActiveCustomFlow,
  });

  // --- Drain logic (Req 5.4, 14.1, 15.6) ---
  // If the engine selection says 'flow', check whether there is an existing
  // mid-flight legacy conversation that should drain on the Legacy_Router.
  // Only conversations starting AFTER activation/cutover pin to the Flow_Engine;
  // in-flight legacy conversations continue on Legacy_Router until they complete
  // or hit the 24h timeout.
  if (chosenEngine === 'flow' && businessId) {
    const existingConversation = await prisma.whatsAppConversation.findFirst({
      where: {
        customerPhone,
        businessId,
      },
      select: { state: true, flowId: true },
    });

    if (isLegacyMidFlight(existingConversation)) {
      logger.info(
        { businessId, state: existingConversation!.state },
        'Draining mid-flight legacy conversation on Legacy_Router',
      );
      chosenEngine = 'legacy';
    }
  }

  let actualEngine: EngineKind = chosenEngine;
  let result: { conversationId: string; message: InteractiveMessage };

  if (chosenEngine === 'flow') {
    try {
      const flowResult = await flowEngine.processMessage(
        customerPhone,
        messageText,
        interactiveReply,
        businessId!,
      );
      result = {
        conversationId: flowResult.conversationId,
        message: flowResult.message,
      };
    } catch (error) {
      // Fallback to Legacy_Router on Flow_Engine error (Req 11.4)
      // TODO(post-parity): Remove this fallback once legacy handlers are removed.
      // After parity verification, Flow_Engine errors should be handled by a
      // dedicated error-recovery strategy rather than falling back to legacy.
      logger.error(
        { businessId, chosenEngine, err: error instanceof Error ? error.message : String(error) },
        'Flow_Engine error, falling back to Legacy_Router',
      );
      actualEngine = 'legacy';
      const legacyResult = await conversationService.processMessage(
        customerPhone,
        messageText,
        interactiveReply,
        businessId,
      );
      result = {
        conversationId: legacyResult.conversationId,
        message: legacyResult.message,
      };
    }
  } else {
    // Legacy path
    const legacyResult = await conversationService.processMessage(
      customerPhone,
      messageText,
      interactiveReply,
      businessId,
    );
    result = {
      conversationId: legacyResult.conversationId,
      message: legacyResult.message,
    };

    if (!input.businessId && !resolvedFromExistingConversation) {
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { id: legacyResult.conversationId },
        select: { businessId: true },
      });

      if (
        conversation?.businessId &&
        await shouldUseFlowEngineForBusiness(conversation.businessId, globalCutover)
      ) {
        logger.info(
          { businessId: conversation.businessId },
          'Shared-number routing code resolved; handing conversation to Flow_Engine',
        );

        const flowResult = await flowEngine.startFreshRun(
          customerPhone,
          conversation.businessId,
        );

        businessId = conversation.businessId;
        actualEngine = 'flow';
        result = {
          conversationId: flowResult.conversationId,
          message: flowResult.message,
        };
      }
    }
  }

  // Log routing decision (Req 17.3) — no message body or secrets (Req 17.4)
  logger.info(
    { businessId: businessId ?? null, chosenEngine, actualEngine },
    'Engine routing decision',
  );

  return {
    conversationId: result.conversationId,
    message: result.message,
    engine: actualEngine,
  };
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const engineRouter = {
  route,
  selectEngine,
};
