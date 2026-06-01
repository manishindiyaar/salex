/**
 * Flow Zod Schemas
 *
 * Validation schemas for WhatsApp Flow Engine graph definitions.
 * Includes reference validation (superRefine) ensuring:
 * - entryNodeId references an existing node
 * - every edge from/to references an existing node
 * - at most one fallback (condition-less) edge per source node
 * - each failure reports the offending node/edge id
 */

import { z } from 'zod';

// Edge condition operators (Req 2.4)
export const edgeOperatorSchema = z.enum(['eq', 'neq', 'contains', 'gt', 'lt']);

export type EdgeOperatorType = z.infer<typeof edgeOperatorSchema>;

// Edge condition: field + operator + value
export const edgeConditionSchema = z.object({
  field: z.string().min(1),
  operator: edgeOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export type EdgeConditionType = z.infer<typeof edgeConditionSchema>;

// Supported node types (Req 2.3)
export const nodeTypeSchema = z.enum([
  'message',
  'question',
  'service_picker',
  'staff_picker',
  'time_picker',
  'confirmation',
  'booking',
]);

export type NodeTypeType = z.infer<typeof nodeTypeSchema>;

// Flow node: id + type + per-type config
export const flowNodeSchema = z.object({
  id: z.string().min(1),
  type: nodeTypeSchema,
  config: z.record(z.unknown()).default({}),
});

export type FlowNodeType = z.infer<typeof flowNodeSchema>;

// Flow edge: directed connection with optional condition
export const flowEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  condition: edgeConditionSchema.optional(),
});

export type FlowEdgeType = z.infer<typeof flowEdgeSchema>;

// Flow definition with reference validation (Req 2.2, 2.5, 2.6, 10.6)
export const flowDefinitionSchema = z
  .object({
    entryNodeId: z.string().min(1),
    nodes: z.array(flowNodeSchema).min(1),
    edges: z.array(flowEdgeSchema),
  })
  .superRefine((def, ctx) => {
    const nodeIds = new Set(def.nodes.map((n) => n.id));

    // Req 2.2: entryNodeId must reference an existing node
    if (!nodeIds.has(def.entryNodeId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `entryNodeId "${def.entryNodeId}" does not reference an existing node`,
        path: ['entryNodeId'],
      });
    }

    // Req 10.6: every edge from/to must reference an existing node
    for (const edge of def.edges) {
      if (!nodeIds.has(edge.from)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge "${edge.id}" references non-existent from-node "${edge.from}"`,
          path: ['edges', edge.id, 'from'],
        });
      }
      if (!nodeIds.has(edge.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge "${edge.id}" references non-existent to-node "${edge.to}"`,
          path: ['edges', edge.id, 'to'],
        });
      }
    }

    // Req 2.6: at most one fallback (condition-less) edge per source node
    const fallbackCountBySource = new Map<string, string[]>();
    for (const edge of def.edges) {
      if (!edge.condition) {
        const existing = fallbackCountBySource.get(edge.from) ?? [];
        existing.push(edge.id);
        fallbackCountBySource.set(edge.from, existing);
      }
    }
    for (const [sourceNodeId, edgeIds] of fallbackCountBySource) {
      if (edgeIds.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `node "${sourceNodeId}" has ${edgeIds.length} fallback edges (${edgeIds.join(', ')}); at most one is allowed`,
          path: ['edges'],
        });
      }
    }

    // Req 12.4: question nodes must not have duplicate choice ids
    for (const node of def.nodes) {
      if (node.type === 'question' && node.config.choices) {
        const choices = node.config.choices as Array<unknown>;
        if (choices.length > 0 && typeof choices[0] === 'object' && choices[0] !== null) {
          // Structured choices — validate unique ids
          const ids = (choices as Array<{ id?: string }>).map((c) => c.id).filter(Boolean) as string[];
          const seen = new Set<string>();
          const duplicates: string[] = [];
          for (const id of ids) {
            if (seen.has(id)) {
              duplicates.push(id);
            } else {
              seen.add(id);
            }
          }
          if (duplicates.length > 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `question node "${node.id}" has duplicate choice ids: ${[...new Set(duplicates)].join(', ')}. Choice ids must be unique within a single question node.`,
              path: ['nodes', node.id, 'config', 'choices'],
            });
          }
        } else if (choices.length > 0 && typeof choices[0] === 'string') {
          // String choices — validate unique values (since they become ids)
          const seen = new Set<string>();
          const duplicates: string[] = [];
          for (const choice of choices as string[]) {
            if (seen.has(choice)) {
              duplicates.push(choice);
            } else {
              seen.add(choice);
            }
          }
          if (duplicates.length > 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `question node "${node.id}" has duplicate choice ids: ${[...new Set(duplicates)].join(', ')}. Choice ids must be unique within a single question node.`,
              path: ['nodes', node.id, 'config', 'choices'],
            });
          }
        }
      }
    }
  });

export type FlowDefinitionType = z.infer<typeof flowDefinitionSchema>;

// Create flow request body
export const createFlowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  definition: flowDefinitionSchema,
});

export type CreateFlowInput = z.infer<typeof createFlowSchema>;

// Update flow request body (name and description are optional on update)
export const updateFlowSchema = createFlowSchema.partial({ name: true, description: true });

export type UpdateFlowInput = z.infer<typeof updateFlowSchema>;
