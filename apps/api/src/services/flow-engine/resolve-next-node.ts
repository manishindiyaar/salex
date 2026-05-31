/**
 * Transition resolution for the WhatsApp Flow Engine.
 *
 * Pure function: given a set of edges, the current node id, and the
 * conversation context, determines the next node to transition to.
 *
 * Algorithm (Req 4.1, 4.2, 4.5, 2.5, 2.6):
 * 1. Collect edges whose `from === fromNodeId` in definition order.
 * 2. Evaluate each conditional edge in order; return the first whose
 *    condition matches the context.
 * 3. If no conditional edge matches, return the single fallback edge
 *    (the edge with no condition).
 * 4. If neither exists, return `null` (dead-end).
 *
 * Operator evaluation is total: malformed/non-numeric inputs produce
 * no-match rather than throwing.
 */

import type { FlowEdge, EdgeCondition } from '@salex/shared-types';

export type FlowContext = Record<string, unknown>;

/**
 * Resolve a value from a dot-path in the context object.
 * e.g. "responses.confirm" → context.responses.confirm
 *
 * Returns `undefined` if any segment along the path is missing or
 * the intermediate value is not an object.
 */
function getByDotPath(context: FlowContext, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = context;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

/**
 * Evaluate a single edge condition against the context.
 * Returns `true` if the condition matches, `false` otherwise.
 * Never throws — malformed inputs produce `false` (total function).
 */
function evaluateCondition(condition: EdgeCondition, context: FlowContext): boolean {
  const fieldValue = getByDotPath(context, condition.field);
  const conditionValue = condition.value;

  switch (condition.operator) {
    case 'eq':
      return String(fieldValue) === String(conditionValue);

    case 'neq':
      return String(fieldValue) !== String(conditionValue);

    case 'contains': {
      if (Array.isArray(fieldValue)) {
        // Array membership: check if any element equals the condition value
        // after string coercion
        return fieldValue.some((item) => String(item) === String(conditionValue));
      }
      if (typeof fieldValue === 'string') {
        // Substring check
        return fieldValue.includes(String(conditionValue));
      }
      // Non-string, non-array field → no match
      return false;
    }

    case 'gt': {
      const numField = Number(fieldValue);
      const numCondition = Number(conditionValue);
      if (Number.isNaN(numField) || Number.isNaN(numCondition)) {
        return false;
      }
      return numField > numCondition;
    }

    case 'lt': {
      const numField = Number(fieldValue);
      const numCondition = Number(conditionValue);
      if (Number.isNaN(numField) || Number.isNaN(numCondition)) {
        return false;
      }
      return numField < numCondition;
    }

    default:
      // Unknown operator → no match (defensive, should not happen with typed input)
      return false;
  }
}

/**
 * Resolve the next node from the current node given the edges and context.
 *
 * @param edges - All edges in the flow definition (definition order preserved)
 * @param fromNodeId - The current node id to transition from
 * @param context - The conversation context data
 * @returns The destination node id, or `null` if no transition is possible (dead-end)
 */
export function resolveNextNode(
  edges: FlowEdge[],
  fromNodeId: string,
  context: FlowContext,
): string | null {
  // 1. Collect edges from the current node in definition order
  const outgoing = edges.filter((e) => e.from === fromNodeId);

  // 2. Evaluate conditional edges in order; return first match
  let fallbackEdge: FlowEdge | null = null;

  for (const edge of outgoing) {
    if (edge.condition) {
      if (evaluateCondition(edge.condition, context)) {
        return edge.to;
      }
    } else {
      // Track the fallback edge (condition-less); per Req 2.6 there is at most one
      fallbackEdge = edge;
    }
  }

  // 3. No conditional matched — use the fallback if present
  if (fallbackEdge) {
    return fallbackEdge.to;
  }

  // 4. No transition possible — dead-end
  return null;
}

// Re-export evaluateCondition for testing purposes
export { evaluateCondition, getByDotPath };
