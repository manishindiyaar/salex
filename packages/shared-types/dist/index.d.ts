/**
 * @salex/shared-types
 *
 * Single source of truth for domain models, DTOs, API contracts,
 * Prisma client, and Zod validation schemas.
 *
 * IMPORTANT: App code must import exclusively from this package.
 */
export { prisma, PrismaClient, Prisma } from './db';
export type { User, Otp, Customer, Business, Service, Booking, BookingItem, WhatsAppConversation, WhatsAppMessage, CustomerSession, SimulatorMessage, UserRole, BookingStatus, PaymentMode, Resource, Staff, ResourceStaffLink, Subscription, PaymentRecord, AdminUser, AuditLog, NicheTemplate, FeatureModule, BusinessModuleConfig, SubscriptionPlan, SubscriptionStatus, AdminRole, BusinessCategory, } from '@prisma/client';
export * from './schemas';
export { formatZodErrors, getZodErrorMessages, getFirstZodError } from './utils/format-zod-errors';
export type ID = string;
export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    correlationId?: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: {
        page?: number;
        pageSize?: number;
        total?: number;
    };
}
export interface AuthContext {
    userId: string;
    phone: string;
    role: string;
}
export interface JwtPayload {
    sub: string;
    phone: string;
    role: string;
    iat: number;
    exp: number;
}
export interface WhatsAppWebhookPayload {
    object: 'whatsapp_business_account';
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: 'whatsapp';
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    wa_id: string;
                    profile: {
                        name: string;
                    };
                }>;
                messages?: Array<{
                    id: string;
                    from: string;
                    timestamp: string;
                    type: 'text' | 'interactive' | 'button';
                    text?: {
                        body: string;
                    };
                    interactive?: {
                        type: 'button_reply' | 'list_reply';
                        button_reply?: {
                            id: string;
                            title: string;
                        };
                        list_reply?: {
                            id: string;
                            title: string;
                        };
                    };
                }>;
                statuses?: Array<{
                    id: string;
                    status: 'sent' | 'delivered' | 'read' | 'failed';
                    timestamp: string;
                    recipient_id: string;
                }>;
            };
            field: string;
        }>;
    }>;
}
export interface WhatsAppOutgoingMessage {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    type: 'text' | 'interactive' | 'template';
    text?: {
        body: string;
    };
    interactive?: {
        type: 'button' | 'list';
        header?: {
            type: 'text';
            text: string;
        };
        body: {
            text: string;
        };
        footer?: {
            text: string;
        };
        action: {
            buttons?: Array<{
                type: 'reply';
                reply: {
                    id: string;
                    title: string;
                };
            }>;
            button?: string;
            sections?: Array<{
                title: string;
                rows: Array<{
                    id: string;
                    title: string;
                    description?: string;
                }>;
            }>;
        };
    };
    template?: {
        name: string;
        language: {
            code: string;
        };
        components?: Array<{
            type: 'body' | 'header';
            parameters: Array<{
                type: 'text';
                text: string;
            }>;
        }>;
    };
}
export interface AvailabilityResult {
    available: boolean;
    currentCount: number;
    maxCapacity: number;
    conflictingBookings?: Array<{
        id: string;
        scheduledAt: Date;
        endAt: Date;
    }>;
}
export interface BookingWithItems {
    id: string;
    businessId: string;
    customerId: string | null;
    status: string;
    scheduledAt: Date;
    endAt: Date;
    totalPrice: number;
    paymentMode: string | null;
    notes: string | null;
    source: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
        id: string;
        serviceId: string;
        nameSnapshot: string;
        priceSnapshot: number;
    }>;
    customer?: {
        id: string;
        phoneNumber: string;
        name: string | null;
    } | null;
}
export interface SimulatorSendRequest {
    customerPhone: string;
    businessPhone: string;
    message: string;
    messageType?: 'text' | 'interactive';
}
export interface SimulatorPollResponse {
    success: boolean;
    data: Array<{
        id: string;
        conversationId: string;
        messageType: string;
        content: Record<string, unknown>;
        timestamp: Date;
        delivered: boolean;
    }>;
    hasMore: boolean;
}
