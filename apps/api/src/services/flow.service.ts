/**
 * Runtime Flow Service
 *
 * Loads the active WhatsApp booking flow for message processing.
 *
 * The Admin Flow Editor UI/API has been removed. This service intentionally
 * keeps only runtime loading/version-pinning behavior so existing WhatsApp
 * processing can continue to fall back to the default booking flow or honor an
 * already-published custom flow row.
 */

import { prisma } from '@salex/shared-types';
import type { FlowDefinition } from '@salex/shared-types';
import { DEFAULT_FLOW, DEFAULT_FLOW_VERSION } from './flow-engine/default-flow';

const DEFAULT_FLOW_ID = '__DEFAULT__';

class FlowService {
  /**
   * Resolve the active flow for a business.
   * Returns the business's published custom flow if one exists, otherwise the
   * in-code default booking flow.
   */
  async resolveActiveFlow(businessId: string): Promise<{
    flowId: string;
    flowVersion: number;
    definition: FlowDefinition;
  }> {
    const published = await prisma.whatsAppFlow.findFirst({
      where: { businessId, status: 'PUBLISHED' },
    });

    if (published) {
      return {
        flowId: published.id,
        flowVersion: published.version,
        definition: published.definition as unknown as FlowDefinition,
      };
    }

    return {
      flowId: DEFAULT_FLOW_ID,
      flowVersion: DEFAULT_FLOW_VERSION,
      definition: DEFAULT_FLOW,
    };
  }

  /**
   * Load a pinned flow by (flowId, flowVersion).
   * In-progress conversations continue on the version they started with.
   */
  async loadPinned(
    flowId: string,
    flowVersion: number,
    businessId: string,
  ): Promise<{ definition: FlowDefinition } | null> {
    if (flowId === DEFAULT_FLOW_ID && flowVersion === DEFAULT_FLOW_VERSION) {
      return { definition: DEFAULT_FLOW };
    }

    const row = await prisma.whatsAppFlow.findFirst({
      where: { id: flowId, version: flowVersion, businessId },
    });

    if (!row) {
      return null;
    }

    return { definition: row.definition as unknown as FlowDefinition };
  }

  /**
   * Pin a fresh conversation run to the active flow at start time.
   */
  async pinFreshRun(businessId: string): Promise<{
    flowId: string;
    flowVersion: number;
    definition: FlowDefinition;
  }> {
    return this.resolveActiveFlow(businessId);
  }

  /**
   * Check whether a business has an active custom flow.
   * The router uses this to decide whether to enter the runtime flow engine.
   */
  async hasActiveCustomFlow(businessId: string): Promise<boolean> {
    const count = await prisma.whatsAppFlow.count({
      where: {
        businessId,
        status: 'PUBLISHED',
      },
    });

    return count > 0;
  }
}

export const flowService = new FlowService();
