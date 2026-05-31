/**
 * Flow graph types for the WhatsApp Flow Engine.
 *
 * These types define the node-based conversation graph structure shared
 * between the API engine and the admin-dashboard editor.
 */

export type NodeType =
  | 'message'         // Static text; auto-advances (no input)
  | 'question'        // Free-text / choice question; waits for reply
  | 'service_picker'  // Lists active services; waits for choice
  | 'staff_picker'    // Lists available staff; waits for choice
  | 'time_picker'     // Lists bookable slots (bulk availability); waits for choice
  | 'confirmation'    // Confirm/cancel buttons; waits for reply
  | 'booking';        // Finalizes booking via bookingService; terminal

// Operators per Req 2.4
export type EdgeOperator = 'eq' | 'neq' | 'contains' | 'gt' | 'lt';

export interface EdgeCondition {
  field: string;            // dot-path into Context_Data, e.g. "responses.confirm"
  operator: EdgeOperator;
  value: string | number | boolean;
}

export interface FlowEdge {
  id: string;
  from: string;             // source node id
  to: string;               // destination node id
  condition?: EdgeCondition; // absent => the single fallback edge for `from` (Req 2.5/2.6)
}

export interface FlowNode {
  id: string;
  type: NodeType;
  // Per-type configuration (message text, list header/footer, prompt copy,
  // validation rules, terminology key, etc.). Validated per-type by Zod.
  config: Record<string, unknown>;
}

export interface FlowDefinition {
  entryNodeId: string;      // Req 2.2 — exactly one
  nodes: FlowNode[];
  edges: FlowEdge[];
}

// Persisted flow record (mirrors WhatsAppFlow row, definition = FlowDefinition)
export interface FlowRecord {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
  entryNodeId: string;
  definition: FlowDefinition;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlowSummary {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  updatedAt: string;
}
