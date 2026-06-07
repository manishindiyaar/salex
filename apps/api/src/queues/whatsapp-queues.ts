/**
 * BullMQ Queue Definitions for WhatsApp Pipeline
 *
 * Queues:
 * - whatsapp-inbound  — incoming customer messages to process
 * - whatsapp-outbound — response messages to send via Meta API
 */

import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from './redis-connection';

// ─── Job Payload Types ───────────────────────────────────────────────────────

export interface InboundJobPayload {
  waMessageId: string;
  phoneNumberId?: string;
  customerPhone: string;
  businessId?: string;
  messageType: string;
  messageText?: string;
  interactiveReply?: {
    type: string;
    id: string;
    title: string;
    description?: string;
  };
  receivedAt: string;
}

export interface OutboundJobPayload {
  waMessageId: string;
  conversationId: string;
  toPhone: string;
  phoneNumberId?: string;
  businessId?: string;
  messageType: string;
  payload: Record<string, unknown>;
  conversationVersion: number | null;
  engine: string;
  createdAt: string;
}

// ─── Queue Instances ─────────────────────────────────────────────────────────

let _inboundQueue: Queue<InboundJobPayload> | null = null;
let _outboundQueue: Queue<OutboundJobPayload> | null = null;

export function getInboundQueue(): Queue<InboundJobPayload> {
  if (!_inboundQueue) {
    _inboundQueue = new Queue<InboundJobPayload>('whatsapp-inbound', {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }
  return _inboundQueue;
}

export function getOutboundQueue(): Queue<OutboundJobPayload> {
  if (!_outboundQueue) {
    _outboundQueue = new Queue<OutboundJobPayload>('whatsapp-outbound', {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }
  return _outboundQueue;
}

/**
 * Close all queue connections gracefully.
 */
export async function closeQueues(): Promise<void> {
  await _inboundQueue?.close().catch(() => {});
  await _outboundQueue?.close().catch(() => {});
  _inboundQueue = null;
  _outboundQueue = null;
}
