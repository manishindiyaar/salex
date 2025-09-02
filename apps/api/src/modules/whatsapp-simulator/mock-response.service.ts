import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import {
  WhatsAppOutgoingMessage,
  MockResponseQuery,
  MockResponseData,
  MockResponsesResponse,
  WhatsAppConversation,
  WhatsAppMessage,
} from 'shared-types';

@Injectable()
export class MockResponseService {
  private readonly logger = new Logger(MockResponseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Store a response message for simulator polling
   * This is called when the webhook processes a message and needs to send a response
   */
  async storeResponse(
    conversationId: string,
    responseMessage: WhatsAppOutgoingMessage,
  ): Promise<void> {
    try {
      await this.prisma.whatsAppMessage.create({
        data: {
          conversationId,
          direction: 'OUTGOING',
          messageType: responseMessage.type,
          content: responseMessage as any,
          status: 'sent',
          isSimulator: true,
        },
      });

      this.logger.debug(`Stored response message for conversation: ${conversationId}`);
    } catch (error) {
      this.logger.error(`Failed to store response: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Store an incoming message from the simulator UI
   */
  async storeIncomingMessage(
    conversationId: string,
    messageContent: any,
    messageType: string = 'text',
  ): Promise<void> {
    try {
      await this.prisma.whatsAppMessage.create({
        data: {
          conversationId,
          direction: 'INCOMING',
          messageType,
          content: messageContent,
          status: 'delivered',
          isSimulator: true,
        },
      });

      this.logger.debug(`Stored incoming message for conversation: ${conversationId}`);
    } catch (error) {
      this.logger.error(`Failed to store incoming message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get responses for UI polling
   * Returns messages that the customer hasn't seen yet
   */
  async getResponsesForCustomer(
    query: MockResponseQuery,
  ): Promise<MockResponsesResponse> {
    try {
      const { customerPhone, since, limit = 20 } = query;

      // Find conversation for this customer
      const conversation = await this.prisma.whatsAppConversation.findFirst({
        where: {
          customerPhone,
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      });

      if (!conversation) {
        return {
          success: true,
          data: [],
          hasMore: false,
        };
      }

      // Build where clause for messages
      const whereClause: any = {
        conversationId: conversation.id,
        direction: 'OUTGOING', // Only outgoing messages (responses from business)
        isSimulator: true,
      };

      // Add timestamp filter if provided
      if (since) {
        whereClause.createdAt = {
          gt: new Date(since),
        };
      }

      // Get messages
      const messages = await this.prisma.whatsAppMessage.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'asc',
        },
        take: limit + 1, // Get one extra to check if there are more
      });

      const hasMore = messages.length > limit;
      const resultMessages = hasMore ? messages.slice(0, limit) : messages;

      // Transform to response format
      const responseData: MockResponseData[] = resultMessages.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        messageType: msg.messageType,
        content: msg.content as any,
        timestamp: msg.createdAt,
        delivered: msg.status === 'delivered' || msg.status === 'read',
      }));

      this.logger.debug(`Retrieved ${responseData.length} responses for customer: ${customerPhone}`);

      return {
        success: true,
        data: responseData,
        hasMore,
      };
    } catch (error) {
      this.logger.error(`Failed to get responses: ${error.message}`, error.stack);
      return {
        success: false,
        data: [],
        hasMore: false,
      };
    }
  }

  /**
   * Get all messages for a conversation (for debugging/testing)
   */
  async getConversationMessages(conversationId: string): Promise<WhatsAppMessage[]> {
    try {
      const messages = await this.prisma.whatsAppMessage.findMany({
        where: {
          conversationId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return messages.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        whatsappMessageId: msg.whatsappMessageId,
        direction: msg.direction as 'INCOMING' | 'OUTGOING',
        messageType: msg.messageType,
        content: msg.content,
        status: msg.status as 'sent' | 'delivered' | 'read' | 'failed',
        isSimulator: msg.isSimulator,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to get conversation messages: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create or get existing conversation for customer and business
   */
  async getOrCreateConversation(
    customerPhone: string,
    businessId: string,
  ): Promise<WhatsAppConversation> {
    try {
      // Try to find existing active conversation
      let conversation = await this.prisma.whatsAppConversation.findFirst({
        where: {
          customerPhone,
          businessId,
          expiresAt: {
            gt: new Date(), // Not expired
          },
        },
      });

      if (!conversation) {
        // Create new conversation (expires in 2 hours)
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

        conversation = await this.prisma.whatsAppConversation.create({
          data: {
            customerPhone,
            businessId,
            state: 'GREETING',
            expiresAt,
            lastMessageAt: new Date(),
          },
        });

        this.logger.debug(`Created new conversation: ${conversation.id}`);
      } else {
        // Update last message time
        conversation = await this.prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        });
      }

      return {
        id: conversation.id,
        customerPhone: conversation.customerPhone,
        businessId: conversation.businessId,
        state: conversation.state as any,
        context: conversation.context as any,
        lastMessageAt: conversation.lastMessageAt,
        expiresAt: conversation.expiresAt,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to get/create conversation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update conversation state
   */
  async updateConversationState(
    conversationId: string,
    state: string,
    context?: any,
  ): Promise<void> {
    try {
      await this.prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: {
          state,
          context,
          lastMessageAt: new Date(),
        },
      });

      this.logger.debug(`Updated conversation state: ${conversationId} -> ${state}`);
    } catch (error) {
      this.logger.error(`Failed to update conversation state: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clean up expired conversations
   */
  async cleanupExpiredConversations(): Promise<number> {
    try {
      const result = await this.prisma.whatsAppConversation.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      this.logger.debug(`Cleaned up ${result.count} expired conversations`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to cleanup expired conversations: ${error.message}`, error.stack);
      return 0;
    }
  }
}