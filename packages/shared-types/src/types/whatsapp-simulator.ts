// packages/shared-types/src/types/whatsapp-simulator.ts
import { WhatsAppWebhookPayload } from './whatsapp-api-types';

export interface Customer {
  id: string;
  phoneNumber: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerSession {
  id: string;
  customerId: string;
  businessId: string;
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  customerId: string;
  businessId: string;
  sessionToken: string;
  state: ConversationState;
  context: Record<string, any>;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConversationState {
  GREETING = 'GREETING',
  SERVICE_SELECTION = 'SERVICE_SELECTION',
  TIME_SELECTION = 'TIME_SELECTION',
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  COMPLETED = 'COMPLETED'
}

export interface Message {
  id: string;
  conversationId: string;
  whatsappMessageId?: string;
  direction: MessageDirection;
  type: MessageType;
  content: Record<string, any>;
  status: MessageStatus;
  createdAt: Date;
}

export enum MessageDirection {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING'
}

export enum MessageType {
  TEXT = 'text',
  INTERACTIVE = 'interactive',
  IMAGE = 'image',
  AUDIO = 'audio',
  DOCUMENT = 'document'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export interface WhatsAppResponse {
  id: string;
  status: string;
  timestamp: string;
  message?: string;
}

export interface BookingContext {
  selectedServiceId?: string;
  selectedService?: any;
  selectedDate?: string;
  selectedTime?: string;
  customerPhone?: string;
  customerName?: string;
}

export interface BusinessRoutingCodes {
  [code: string]: string;
}

export interface SimulatorConfig {
  pollingInterval: number;
  maxConcurrentConversations: number;
  sessionDurationHours: number;
  enableSimulator: boolean;
}

export interface WhatsAppSimulatorSession {
  conversationId: string;
  businessId: string;
  customerId: string;
  lastMessageTimestamp?: Date;
  isActive: boolean;
}