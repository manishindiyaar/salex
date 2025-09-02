import { Injectable, Logger } from '@nestjs/common';

export interface StoredMessage {
  id: string;
  customerPhone: string;
  content: any;
  timestamp: Date;
  type: 'sent' | 'received';
}

@Injectable()
export class SimulatorMessageStoreService {
  private readonly logger = new Logger(SimulatorMessageStoreService.name);
  private readonly messages: Map<string, StoredMessage[]> = new Map();
  private readonly maxMessagesPerCustomer = 100;

  /**
   * Store a message for a customer
   */
  storeMessage(customerPhone: string, content: any, type: 'sent' | 'received'): void {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message: StoredMessage = {
      id: messageId,
      customerPhone,
      content,
      timestamp: new Date(),
      type
    };

    // Get existing messages for customer
    let customerMessages = this.messages.get(customerPhone) || [];
    
    // Add new message
    customerMessages.push(message);
    
    // Keep only the last N messages
    if (customerMessages.length > this.maxMessagesPerCustomer) {
      customerMessages = customerMessages.slice(-this.maxMessagesPerCustomer);
    }
    
    // Store back
    this.messages.set(customerPhone, customerMessages);
    
    this.logger.debug(`Stored ${type} message for ${customerPhone}: ${messageId}`);
  }

  /**
   * Get messages for a customer since a timestamp
   */
  getMessagesSince(customerPhone: string, since?: Date): StoredMessage[] {
    const customerMessages = this.messages.get(customerPhone) || [];
    
    if (!since) {
      return customerMessages.slice(-10); // Return last 10 messages if no timestamp
    }
    
    return customerMessages.filter(msg => msg.timestamp > since);
  }

  /**
   * Get all messages for a customer
   */
  getAllMessages(customerPhone: string): StoredMessage[] {
    return this.messages.get(customerPhone) || [];
  }

  /**
   * Clear messages for a customer
   */
  clearMessages(customerPhone: string): void {
    this.messages.delete(customerPhone);
    this.logger.debug(`Cleared messages for ${customerPhone}`);
  }

  /**
   * Get store stats
   */
  getStats(): { totalCustomers: number; totalMessages: number } {
    let totalMessages = 0;
    for (const customerMessages of this.messages.values()) {
      totalMessages += customerMessages.length;
    }
    
    return {
      totalCustomers: this.messages.size,
      totalMessages
    };
  }

  /**
   * Store a response message for polling
   */
  async storeResponse(customerPhone: string, responseData: any): Promise<void> {
    this.storeMessage(customerPhone, responseData, 'received');
  }
}