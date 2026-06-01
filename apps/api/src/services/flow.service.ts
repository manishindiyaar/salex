/**
 * Flow Service
 *
 * Versioned CRUD, loader, and version-pinning for WhatsApp flow definitions.
 *
 * Key behaviors:
 * - Create: persists version 1 for a business
 * - Save (update): inserts a NEW row with version = max(business versions) + 1;
 *   never mutates a prior version's definition
 * - Activate/Deactivate: transactional single-active enforcement
 * - Resolve active flow: returns the business's active custom flow, or DEFAULT_FLOW
 * - Load pinned: loads a specific (flowId, flowVersion) for in-progress conversations
 * - Pin: records the then-active (flowId, flowVersion) on a fresh conversation run
 * - All reads/writes are scoped to a resolved businessId; cross-tenant access is rejected
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5, 5.2, 5.3, 5.4, 10.3, 16.1, 16.2
 */

import { prisma, Prisma, flowDefinitionSchema } from '@salex/shared-types';
import type { FlowDefinition, FlowRecord, FlowSummary } from '@salex/shared-types';
import { DEFAULT_FLOW, DEFAULT_FLOW_VERSION } from './flow-engine/default-flow';
import { logger } from '../utils/logger';
import { NotFoundError, ForbiddenError, BusinessRuleError, ValidationError } from '../utils/errors';
import { businessFlowReadinessService } from './business-flow-readiness.service';

// Internal constant used as a sentinel flowId when pinning to the default flow
const DEFAULT_FLOW_ID = '__DEFAULT__';

/**
 * Maps a Prisma WhatsAppFlow row to the shared FlowRecord type.
 */
function toFlowRecord(row: {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  version: number;
  status: string;
  isActive: boolean;
  entryNodeId: string;
  definition: Prisma.JsonValue;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): FlowRecord {
  return {
    id: row.id,
    businessId: row.businessId,
    name: row.name,
    description: row.description,
    version: row.version,
    isActive: row.isActive,
    entryNodeId: row.entryNodeId,
    definition: row.definition as unknown as FlowDefinition,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFlowSummary(row: {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  updatedAt: Date;
}): FlowSummary {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
  };
}

class FlowService {
  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------

  /**
   * Create a brand-new flow for a business (version 1).
   * Req 1.2, 10.3
   */
  async create(
    businessId: string,
    data: { name: string; description?: string; definition: FlowDefinition },
    createdBy?: string,
  ): Promise<FlowRecord> {
    const row = await prisma.whatsAppFlow.create({
      data: {
        businessId,
        name: data.name,
        description: data.description ?? null,
        version: 1,
        isActive: false,
        entryNodeId: data.definition.entryNodeId,
        definition: data.definition as unknown as Prisma.InputJsonValue,
        createdBy: createdBy ?? null,
      },
    });

    logger.info({ flowId: row.id, businessId, version: 1 }, 'Flow created');
    return toFlowRecord(row);
  }

  /**
   * Save a new version of an existing flow.
   * version = max(business versions for this logical flow name) + 1.
   * Never mutates a prior version's row (Req 1.2).
   */
  async save(
    flowId: string,
    businessId: string,
    data: { name?: string; description?: string; definition: FlowDefinition },
    createdBy?: string,
  ): Promise<FlowRecord> {
    // Verify the flow belongs to this business
    const existing = await prisma.whatsAppFlow.findUnique({ where: { id: flowId } });
    if (!existing) {
      throw new NotFoundError('Flow', flowId);
    }
    if (existing.businessId !== businessId) {
      throw new ForbiddenError('Access denied to flow owned by another business');
    }

    // Determine next version: max version for this business + 1
    const maxVersion = await prisma.whatsAppFlow.aggregate({
      where: { businessId },
      _max: { version: true },
    });
    const nextVersion = (maxVersion._max.version ?? 0) + 1;

    const row = await prisma.whatsAppFlow.create({
      data: {
        businessId,
        name: data.name ?? existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        version: nextVersion,
        isActive: false,
        entryNodeId: data.definition.entryNodeId,
        definition: data.definition as unknown as Prisma.InputJsonValue,
        createdBy: createdBy ?? null,
      },
    });

    logger.info({ flowId: row.id, businessId, version: nextVersion }, 'Flow version saved');
    return toFlowRecord(row);
  }

  /**
   * Get a flow by id, scoped to a business.
   * Req 16.1, 16.2
   */
  async getById(flowId: string, businessId: string): Promise<FlowRecord> {
    const row = await prisma.whatsAppFlow.findUnique({ where: { id: flowId } });
    if (!row) {
      throw new NotFoundError('Flow', flowId);
    }
    if (row.businessId !== businessId) {
      throw new ForbiddenError('Access denied to flow owned by another business');
    }
    return toFlowRecord(row);
  }

  /**
   * List all flow versions for a business.
   * Req 16.1, 16.2
   */
  async list(businessId: string): Promise<FlowSummary[]> {
    const rows = await prisma.whatsAppFlow.findMany({
      where: { businessId },
      orderBy: [{ version: 'desc' }],
      select: { id: true, name: true, version: true, isActive: true, updatedAt: true },
    });
    return rows.map(toFlowSummary);
  }

  // ------------------------------------------------------------------
  // Activation / Deactivation
  // ------------------------------------------------------------------

  /**
   * Activate a flow version for a business.
   * In a transaction: set target active, clear all other versions for the business.
   * Req 1.3, 5.4, 10.4
   */
  async activate(flowId: string, businessId: string): Promise<FlowRecord> {
    return this.publish(flowId, businessId);
  }

  /**
   * Deactivate a flow version for a business.
   * Req 10.4
   */
  async deactivate(flowId: string, businessId: string): Promise<FlowRecord> {
    return this.archive(flowId, businessId);
  }

  /**
   * Delete a flow version. Refuses if the flow is currently active.
   */
  async delete(flowId: string, businessId: string): Promise<void> {
    const target = await prisma.whatsAppFlow.findUnique({ where: { id: flowId } });
    if (!target) {
      throw new NotFoundError('Flow', flowId);
    }
    if (target.businessId !== businessId) {
      throw new ForbiddenError('Access denied to flow owned by another business');
    }
    if (target.isActive) {
      throw new BusinessRuleError('Cannot delete an active flow. Deactivate it first.');
    }

    await prisma.whatsAppFlow.delete({ where: { id: flowId } });
    logger.info({ flowId, businessId }, 'Flow deleted');
  }

  // ------------------------------------------------------------------
  // Draft / Publish / Archive lifecycle (Admin Flow Builder)
  // ------------------------------------------------------------------

  /**
   * Save a flow as DRAFT. Creates a new version row without readiness check.
   * Always sets status = DRAFT and isActive = false.
   * Req 2.6, 3.1
   */
  async saveDraft(
    businessId: string,
    data: { name: string; description?: string; definition: FlowDefinition },
    createdBy?: string,
  ): Promise<FlowRecord> {
    // Determine next version: max version for this business + 1
    const maxVersion = await prisma.whatsAppFlow.aggregate({
      where: { businessId },
      _max: { version: true },
    });
    const nextVersion = (maxVersion._max.version ?? 0) + 1;

    const row = await prisma.whatsAppFlow.create({
      data: {
        businessId,
        name: data.name,
        description: data.description ?? null,
        version: nextVersion,
        status: 'DRAFT',
        isActive: false,
        entryNodeId: data.definition.entryNodeId,
        definition: data.definition as unknown as Prisma.InputJsonValue,
        createdBy: createdBy ?? null,
      },
    });

    logger.info({ flowId: row.id, businessId, version: nextVersion }, 'Flow draft saved');
    return toFlowRecord(row);
  }

  /**
   * Publish a flow version.
   * Validates flow schema, checks business readiness, archives previous PUBLISHED,
   * sets target to PUBLISHED, syncs isActive field.
   * Req 2.5, 3.2, 3.3, 3.5, 3.7
   */
  async publish(flowId: string, businessId: string): Promise<FlowRecord> {
    // Verify flow exists and belongs to business
    const target = await prisma.whatsAppFlow.findUnique({ where: { id: flowId } });
    if (!target) {
      throw new NotFoundError('Flow', flowId);
    }
    if (target.businessId !== businessId) {
      throw new ForbiddenError('Access denied to flow owned by another business');
    }

    // Validate flow definition schema (entry node exists, edges reference valid nodes, at least one node)
    const definition = target.definition as unknown as FlowDefinition;
    const parseResult = flowDefinitionSchema.safeParse(definition);
    if (!parseResult.success) {
      throw new ValidationError(
        'Invalid flow definition: ' + parseResult.error.issues.map(i => i.message).join('; '),
        parseResult.error,
      );
    }

    // Check business readiness
    const readiness = await businessFlowReadinessService.checkReadiness(businessId);
    if (!readiness.canPublish) {
      throw new BusinessRuleError(
        'Business is not ready to publish a flow',
        { missing: readiness.missing.map(m => m.message) },
      );
    }

    // In a transaction: archive previous PUBLISHED, set target to PUBLISHED
    const [, , published] = await prisma.$transaction([
      // Archive all currently PUBLISHED flows for this business
      prisma.whatsAppFlow.updateMany({
        where: { businessId, status: 'PUBLISHED' },
        data: { status: 'ARCHIVED', isActive: false },
      }),
      // Also clear isActive on any other active flows (belt-and-suspenders)
      prisma.whatsAppFlow.updateMany({
        where: { businessId, isActive: true, id: { not: flowId } },
        data: { isActive: false },
      }),
      // Set target flow to PUBLISHED
      prisma.whatsAppFlow.update({
        where: { id: flowId },
        data: { status: 'PUBLISHED', isActive: true },
      }),
    ]);

    logger.info({ flowId, businessId, version: published.version }, 'Flow published');
    return toFlowRecord(published);
  }

  /**
   * Archive a flow version.
   * Sets status to ARCHIVED and isActive to false.
   * Req 3.4
   */
  async archive(flowId: string, businessId: string): Promise<FlowRecord> {
    // Verify flow exists and belongs to business
    const target = await prisma.whatsAppFlow.findUnique({ where: { id: flowId } });
    if (!target) {
      throw new NotFoundError('Flow', flowId);
    }
    if (target.businessId !== businessId) {
      throw new ForbiddenError('Access denied to flow owned by another business');
    }

    const archived = await prisma.whatsAppFlow.update({
      where: { id: flowId },
      data: { status: 'ARCHIVED', isActive: false },
    });

    logger.info({ flowId, businessId }, 'Flow archived');
    return toFlowRecord(archived);
  }

  // ------------------------------------------------------------------
  // Flow resolution and loading
  // ------------------------------------------------------------------

  /**
   * Resolve the active flow for a business.
   * Resolves only status === 'PUBLISHED'. Returns DEFAULT_FLOW if none exists.
   * Req 1.4, 3.5, 3.8, 11.1
   */
  async resolveActiveFlow(businessId: string): Promise<{
    flowId: string;
    flowVersion: number;
    definition: FlowDefinition;
  }> {
    // First try: status-based resolution (new lifecycle)
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

    // No active custom flow — use DEFAULT_FLOW (Req 3.8)
    return {
      flowId: DEFAULT_FLOW_ID,
      flowVersion: DEFAULT_FLOW_VERSION,
      definition: DEFAULT_FLOW,
    };
  }

  /**
   * Load a pinned flow by (flowId, flowVersion).
   * Used for in-progress conversations that must continue on the version they started on.
   * Req 5.3
   */
  async loadPinned(
    flowId: string,
    flowVersion: number,
    businessId: string,
  ): Promise<{ definition: FlowDefinition } | null> {
    // Default flow is an in-memory constant
    if (flowId === DEFAULT_FLOW_ID && flowVersion === DEFAULT_FLOW_VERSION) {
      return { definition: DEFAULT_FLOW };
    }

    const row = await prisma.whatsAppFlow.findFirst({
      where: { id: flowId, version: flowVersion, businessId },
    });

    if (!row) {
      return null; // Caller handles reset (Req 14.4)
    }

    return { definition: row.definition as unknown as FlowDefinition };
  }

  /**
   * Pin a fresh conversation run to the then-active (flowId, flowVersion).
   * Returns the pinned identifiers and the definition to execute.
   * Req 5.2, 5.4
   */
  async pinFreshRun(businessId: string): Promise<{
    flowId: string;
    flowVersion: number;
    definition: FlowDefinition;
  }> {
    // Resolve whatever is active right now
    return this.resolveActiveFlow(businessId);
  }

  /**
   * Check whether a business has an active custom flow (not the default).
   * Used by the EngineRouter to decide routing.
   * Only PUBLISHED flows are considered active for routing.
   * Req 8.4, 11.1
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
