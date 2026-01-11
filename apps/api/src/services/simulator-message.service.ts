/**
 * Simulator Message Service
 * 
 * Stores messages for the WhatsApp simulator polling mechanism.
 * This allows the Mock UI to poll for bot responses.
 * 
 * Features:
 * - Store outgoing messages (bot → customer)
 * - Poll messages since timestamp
 * - Session management for simulator
 */

import { prisma, CustomerSession } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { InteractiveMessage } from './conversation.service';

// Message content structure
export interface SimulatorMessageContent {
  text?: { body: string };
  interactive?: {
    type: string;
    header?: { type: string; text: string };
    body: { text: string };
    footer?: { text: string };
    action?: any;
  };
}

// Stored message type
export interface StoredMessage {
  id: string;
  messageId: string;
  fromPhone: string;
  toPhone: string;
  messageType: string;
  content: SimulatorMessageContent;
  timestamp: Date;
  isFromCustomer: boolean;
  delivered: boolean;
}

class SimulatorMessageService {
  /**
   * Get or create a simulator session for a customer
   */
  async getOrCreateSession(
    customerPhone: string,
    businessId?: string | null
  ): Promise<CustomerSession> {
    const normalizedPhone = this.normalizePhoneNumber(customerPhone);

    // Try to find existing session
    let session = await prisma.customerSession.findFirst({
      where: {
        customerPhone: normalizedPhone,
        businessId: businessId || null,
      },
    });

    if (session) {
      // Update last message time
      session = await prisma.customerSession.update({
        where: { id: session.id },
        data: { lastMessageAt: new Date() },
      });
      return session;
    }

    // Create new session
    session = await prisma.customerSession.create({
      data: {
        customerPhone: normalizedPhone,
        businessId: businessId || null,
        currentState: 'GREETING',
        sessionData: {},
        lastMessageAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    logger.debug({ sessionId: session.id, customerPhone: normalizedPhone }, 'Simulator session created');
    return session;
  }

  /**
   * Store an outgoing message (bot response)
   */
  async storeOutgoingMessage(
    customerPhone: string,
    businessPhone: string,
    message: InteractiveMessage,
    businessId?: string | null
  ): Promise<StoredMessage> {
    const normalizedCustomerPhone = this.normalizePhoneNumber(customerPhone);
    const normalizedBusinessPhone = this.normalizePhoneNumber(businessPhone);

    // Get or create session
    const session = await this.getOrCreateSession(normalizedCustomerPhone, businessId);

    // Convert InteractiveMessage to storage format
    const content = this.convertToStorageFormat(message);

    // Store message
    const stored = await prisma.simulatorMessage.create({
      data: {
        sessionId: session.id,
        fromPhone: normalizedBusinessPhone,
        toPhone: normalizedCustomerPhone,
        messageType: message.type,
        content: content as any,
        isFromCustomer: false,
        delivered: false,
      },
    });

    logger.debug({ 
      messageId: stored.messageId, 
      toPhone: normalizedCustomerPhone,
      type: message.type 
    }, 'Simulator message stored');

    return {
      id: stored.id,
      messageId: stored.messageId,
      fromPhone: stored.fromPhone,
      toPhone: stored.toPhone,
      messageType: stored.messageType,
      content: stored.content as SimulatorMessageContent,
      timestamp: stored.timestamp,
      isFromCustomer: stored.isFromCustomer,
      delivered: stored.delivered,
    };
  }

  /**
   * Store an incoming message (customer message)
   */
  async storeIncomingMessage(
    customerPhone: string,
    businessPhone: string,
    messageText: string,
    messageType: string = 'text',
    businessId?: string | null
  ): Promise<StoredMessage> {
    const normalizedCustomerPhone = this.normalizePhoneNumber(customerPhone);
    const normalizedBusinessPhone = this.normalizePhoneNumber(businessPhone);

    // Get or create session
    const session = await this.getOrCreateSession(normalizedCustomerPhone, businessId);

    // Store message
    const stored = await prisma.simulatorMessage.create({
      data: {
        sessionId: session.id,
        fromPhone: normalizedCustomerPhone,
        toPhone: normalizedBusinessPhone,
        messageType,
        content: { text: { body: messageText } },
        isFromCustomer: true,
        delivered: true,
      },
    });

    return {
      id: stored.id,
      messageId: stored.messageId,
      fromPhone: stored.fromPhone,
      toPhone: stored.toPhone,
      messageType: stored.messageType,
      content: stored.content as SimulatorMessageContent,
      timestamp: stored.timestamp,
      isFromCustomer: stored.isFromCustomer,
      delivered: stored.delivered,
    };
  }

  /**
   * Poll for messages since a timestamp
   * Returns messages sent TO the customer (bot responses)
   */
  async getMessagesSince(
    customerPhone: string,
    since: Date,
    limit: number = 10
  ): Promise<StoredMessage[]> {
    const normalizedPhone = this.normalizePhoneNumber(customerPhone);

    const messages = await prisma.simulatorMessage.findMany({
      where: {
        toPhone: normalizedPhone,
        isFromCustomer: false,
        timestamp: { gt: since },
      },
      orderBy: { timestamp: 'asc' },
      take: limit,
    });

    // Mark as delivered
    if (messages.length > 0) {
      await prisma.simulatorMessage.updateMany({
        where: {
          id: { in: messages.map(m => m.id) },
        },
        data: { delivered: true },
      });
    }

    return messages.map(m => ({
      id: m.id,
      messageId: m.messageId,
      fromPhone: m.fromPhone,
      toPhone: m.toPhone,
      messageType: m.messageType,
      content: m.content as SimulatorMessageContent,
      timestamp: m.timestamp,
      isFromCustomer: m.isFromCustomer,
      delivered: m.delivered,
    }));
  }

  /**
   * Get all messages for a customer (for debugging)
   */
  async getAllMessages(
    customerPhone: string,
    limit: number = 50
  ): Promise<StoredMessage[]> {
    const normalizedPhone = this.normalizePhoneNumber(customerPhone);

    // Find session
    const session = await prisma.customerSession.findFirst({
      where: { customerPhone: normalizedPhone },
    });

    if (!session) {
      return [];
    }

    const messages = await prisma.simulatorMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return messages.map(m => ({
      id: m.id,
      messageId: m.messageId,
      fromPhone: m.fromPhone,
      toPhone: m.toPhone,
      messageType: m.messageType,
      content: m.content as SimulatorMessageContent,
      timestamp: m.timestamp,
      isFromCustomer: m.isFromCustomer,
      delivered: m.delivered,
    }));
  }

  /**
   * Clear messages for a customer (reset session)
   */
  async clearMessages(customerPhone: string): Promise<void> {
    const normalizedPhone = this.normalizePhoneNumber(customerPhone);

    // Find and delete session (cascade deletes messages)
    await prisma.customerSession.deleteMany({
      where: { customerPhone: normalizedPhone },
    });

    logger.info({ customerPhone: normalizedPhone }, 'Simulator session cleared');
  }

  /**
   * Convert InteractiveMessage to storage format
   */
  private convertToStorageFormat(message: InteractiveMessage): SimulatorMessageContent {
    if (message.type === 'text') {
      return {
        text: { body: message.body.text },
      };
    }

    return {
      interactive: {
        type: message.type,
        header: message.header,
        body: message.body,
        footer: message.footer,
        action: message.action,
      },
    };
  }

  /**
   * Normalize phone number
   */
  private normalizePhoneNumber(phone: string | null | undefined): string {
    // Handle null/undefined - use a default simulator business phone
    if (!phone) {
      return '+919999999999'; // Default simulator business phone
    }
    
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
}

export const simulatorMessageService = new SimulatorMessageService();
