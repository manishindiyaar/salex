/**
 * Unit tests for the confirmation node handler.
 *
 * The confirmation handler now creates the BookingIntent (hold) on the confirm path,
 * using an idempotencyKey derived from (conversationId, sorted serviceIds, requestedTime).
 *
 * Requirements: 2.3, 3.2, 9.1, 9.2, 9.6, 9.7, 13.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { confirmationHandler } from '../confirmation';
import type { NodeRenderArgs, NodeProcessArgs } from '../types';

// Mock prisma
vi.mock('@salex/shared-types', () => ({
  prisma: {
    bookingIntent: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from '@salex/shared-types';

const mockedPrisma = prisma as unknown as {
  bookingIntent: {
    findFirst: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
};

describe('confirmationHandler', () => {
  const baseRenderArgs: NodeRenderArgs = {
    config: {},
    context: {
      businessName: 'Test Salon',
      serviceNames: 'Haircut, Shave',
      requestedTime: '2025-06-01T10:00:00.000Z',
      totalPrice: 500,
    },
    businessId: 'biz_123',
  };

  const baseProcessArgs: NodeProcessArgs = {
    incomingMessage: '',
    config: {},
    context: {
      requestedTime: '2025-06-01T10:00:00.000Z',
      selectedServiceIds: ['svc_1', 'svc_2'],
      conversationId: 'conv_123',
      customerPhone: '919876543210',
      totalDuration: 60,
      totalPrice: 500,
      responses: {},
    },
    businessId: 'biz_123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has type "confirmation" and autoAdvance false', () => {
    expect(confirmationHandler.type).toBe('confirmation');
    expect(confirmationHandler.autoAdvance).toBe(false);
  });

  it('has a process method', () => {
    expect(confirmationHandler.process).toBeDefined();
  });

  describe('render', () => {
    it('renders confirm/cancel buttons with default header', async () => {
      const result = await confirmationHandler.render(baseRenderArgs);

      expect(result.type).toBe('button');
      expect(result.header).toEqual({ type: 'text', text: '✅ Confirm Booking' });
      expect(result.action?.buttons).toHaveLength(2);
      expect(result.action?.buttons?.[0]).toEqual({
        type: 'reply',
        reply: { id: 'btn_confirm_booking', title: '✅ Confirm' },
      });
      expect(result.action?.buttons?.[1]).toEqual({
        type: 'reply',
        reply: { id: 'btn_cancel_booking', title: '❌ Cancel' },
      });
    });

    it('builds summary body from context', async () => {
      const result = await confirmationHandler.render(baseRenderArgs);

      expect(result.body.text).toContain('📍 Test Salon');
      expect(result.body.text).toContain('🧴 Haircut, Shave');
      expect(result.body.text).toContain('⏰');
      expect(result.body.text).toContain('💰 ₹500');
      expect(result.body.text).toContain('Confirm your booking?');
    });

    it('uses custom text from config when provided', async () => {
      const result = await confirmationHandler.render({
        ...baseRenderArgs,
        config: { text: 'Custom confirmation message' },
      });

      expect(result.body.text).toBe('Custom confirmation message');
    });

    it('uses custom header and button labels from config', async () => {
      const result = await confirmationHandler.render({
        ...baseRenderArgs,
        config: {
          header: 'Custom Header',
          confirmLabel: 'Yes!',
          cancelLabel: 'No!',
        },
      });

      expect(result.header).toEqual({ type: 'text', text: 'Custom Header' });
      expect(result.action?.buttons?.[0].reply.title).toBe('Yes!');
      expect(result.action?.buttons?.[1].reply.title).toBe('No!');
    });

    it('handles missing context gracefully', async () => {
      const result = await confirmationHandler.render({
        config: {},
        context: {},
        businessId: 'biz_123',
      });

      expect(result.type).toBe('button');
      expect(result.body.text).toContain('📍 the business');
      expect(result.body.text).toContain('🧴 Selected services');
      expect(result.body.text).toContain('⏰ Selected time');
    });
  });

  describe('process', () => {
    describe('confirm — creates hold and completes', () => {
      it('creates a BookingIntent hold and sets bookingIntentId in context', async () => {
        mockedPrisma.bookingIntent.upsert.mockResolvedValue({
          id: 'intent_new',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 600000), // 10 min in future
          bookingId: null,
        });

        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          interactiveReply: { type: 'button', id: 'btn_confirm_booking', title: '✅ Confirm' },
        });

        expect(result.complete).toBe(true);
        expect(result.contextUpdates?.responses).toEqual({
          confirmation: 'confirm',
        });
        expect(result.contextUpdates?.bookingIntentId).toBe('intent_new');
        expect(result.errorMessage).toBeUndefined();

        // Verify upsert was called with correct idempotencyKey
        expect(mockedPrisma.bookingIntent.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              idempotencyKey: 'conv_123:svc_1,svc_2:2025-06-01T10:00:00.000Z',
            },
            create: expect.objectContaining({
              conversationId: 'conv_123',
              businessId: 'biz_123',
              customerPhone: '919876543210',
              serviceIds: ['svc_1', 'svc_2'],
            }),
          }),
        );
      });

      it('recognizes "yes" text as confirm', async () => {
        mockedPrisma.bookingIntent.upsert.mockResolvedValue({
          id: 'intent_new',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 600000),
          bookingId: null,
        });

        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          incomingMessage: 'yes',
        });

        expect(result.complete).toBe(true);
        expect(result.contextUpdates?.responses).toEqual({
          confirmation: 'confirm',
        });
        expect(result.contextUpdates?.bookingIntentId).toBe('intent_new');
      });

      it('recognizes "confirm" text as confirm', async () => {
        mockedPrisma.bookingIntent.upsert.mockResolvedValue({
          id: 'intent_new',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 600000),
          bookingId: null,
        });

        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          incomingMessage: 'I confirm',
        });

        expect(result.complete).toBe(true);
        expect(result.contextUpdates?.responses).toEqual({
          confirmation: 'confirm',
        });
        expect(result.contextUpdates?.bookingIntentId).toBe('intent_new');
      });

      it('returns existing booking when hold is already CONFIRMED (idempotent)', async () => {
        mockedPrisma.bookingIntent.upsert.mockResolvedValue({
          id: 'intent_existing',
          status: 'CONFIRMED',
          expiresAt: new Date(Date.now() + 600000),
          bookingId: 'booking_abc',
        });

        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          interactiveReply: { type: 'button', id: 'btn_confirm_booking', title: '✅ Confirm' },
        });

        expect(result.complete).toBe(true);
        expect(result.contextUpdates?.bookingIntentId).toBe('intent_existing');
        expect(result.contextUpdates?.bookingId).toBe('booking_abc');
        expect(result.contextUpdates?.responses).toEqual({
          confirmation: 'confirm',
        });
      });

      it('generates idempotencyKey from sorted serviceIds', async () => {
        mockedPrisma.bookingIntent.upsert.mockResolvedValue({
          id: 'intent_new',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 600000),
          bookingId: null,
        });

        // Pass unsorted serviceIds — they should be sorted in the key
        await confirmationHandler.process!({
          ...baseProcessArgs,
          context: {
            ...baseProcessArgs.context,
            selectedServiceIds: ['svc_b', 'svc_a'],
          },
          interactiveReply: { type: 'button', id: 'btn_confirm_booking', title: '✅ Confirm' },
        });

        expect(mockedPrisma.bookingIntent.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              idempotencyKey: 'conv_123:svc_a,svc_b:2025-06-01T10:00:00.000Z',
            },
          }),
        );
      });

      it('falls back to businessId when conversationId is missing', async () => {
        mockedPrisma.bookingIntent.upsert.mockResolvedValue({
          id: 'intent_new',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 600000),
          bookingId: null,
        });

        await confirmationHandler.process!({
          ...baseProcessArgs,
          context: {
            ...baseProcessArgs.context,
            conversationId: undefined,
          },
          interactiveReply: { type: 'button', id: 'btn_confirm_booking', title: '✅ Confirm' },
        });

        expect(mockedPrisma.bookingIntent.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              idempotencyKey: 'biz_123:svc_1,svc_2:2025-06-01T10:00:00.000Z',
            },
            create: expect.objectContaining({
              conversationId: 'biz_123',
            }),
          }),
        );
      });
    });

    describe('confirm with expired hold (E4)', () => {
      it('expires the hold and signals "expired" when hold has expired', async () => {
        mockedPrisma.bookingIntent.upsert.mockResolvedValue({
          id: 'intent_123',
          status: 'PENDING',
          expiresAt: new Date(Date.now() - 60000), // expired in the past
          bookingId: null,
        });
        mockedPrisma.bookingIntent.updateMany.mockResolvedValue({ count: 1 });

        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          interactiveReply: { type: 'button', id: 'btn_confirm_booking', title: '✅ Confirm' },
        });

        expect(result.complete).toBe(true);
        expect(result.contextUpdates?.responses).toEqual({
          confirmation: 'expired',
        });
        expect(result.contextUpdates?.requestedTime).toBeUndefined();
        expect(result.contextUpdates?.bookingIntentId).toBeUndefined();
        expect(result.errorMessage).toBe(
          'This booking hold expired. Please choose a fresh time slot.',
        );

        // Verify the hold was expired in the database
        expect(mockedPrisma.bookingIntent.updateMany).toHaveBeenCalledWith({
          where: { id: 'intent_123', status: 'PENDING' },
          data: { status: 'EXPIRED' },
        });
      });

      it('signals "expired" when hold status is not PENDING', async () => {
        mockedPrisma.bookingIntent.upsert.mockResolvedValue({
          id: 'intent_123',
          status: 'EXPIRED',
          expiresAt: new Date(Date.now() + 60000),
          bookingId: null,
        });
        mockedPrisma.bookingIntent.updateMany.mockResolvedValue({ count: 0 });

        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          interactiveReply: { type: 'button', id: 'btn_confirm_booking', title: '✅ Confirm' },
        });

        expect(result.complete).toBe(true);
        expect(result.contextUpdates?.responses).toEqual({
          confirmation: 'expired',
        });
        expect(result.contextUpdates?.requestedTime).toBeUndefined();
        expect(result.contextUpdates?.bookingIntentId).toBeUndefined();
      });

      it('signals "expired" when requestedTime is missing from context', async () => {
        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          context: {
            selectedServiceIds: ['svc_1'],
            conversationId: 'conv_123',
            responses: {},
          },
          interactiveReply: { type: 'button', id: 'btn_confirm_booking', title: '✅ Confirm' },
        });

        expect(result.complete).toBe(true);
        expect(result.contextUpdates?.responses).toEqual({
          confirmation: 'expired',
        });
        expect(result.contextUpdates?.requestedTime).toBeUndefined();
        expect(result.contextUpdates?.bookingIntentId).toBeUndefined();
        // Should not call upsert since requestedTime is missing
        expect(mockedPrisma.bookingIntent.upsert).not.toHaveBeenCalled();
      });

      it('signals "expired" when selectedServiceIds is missing from context', async () => {
        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          context: {
            requestedTime: '2025-06-01T10:00:00.000Z',
            conversationId: 'conv_123',
            responses: {},
          },
          interactiveReply: { type: 'button', id: 'btn_confirm_booking', title: '✅ Confirm' },
        });

        expect(result.complete).toBe(true);
        expect(result.contextUpdates?.responses).toEqual({
          confirmation: 'expired',
        });
        expect(mockedPrisma.bookingIntent.upsert).not.toHaveBeenCalled();
      });
    });

    describe('cancel', () => {
      it('clears booking context and sets responses.confirmation to "cancel"', async () => {
        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          interactiveReply: { type: 'button', id: 'btn_cancel_booking', title: '❌ Cancel' },
        });

        expect(result.complete).toBe(true);
        expect(result.contextUpdates?.responses).toEqual({
          confirmation: 'cancel',
        });
        expect(result.contextUpdates?.selectedServiceIds).toBeUndefined();
        expect(result.contextUpdates?.requestedTime).toBeUndefined();
        expect(result.contextUpdates?.bookingIntentId).toBeUndefined();
      });

      it('recognizes "cancel" text as cancel', async () => {
        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          incomingMessage: 'cancel',
        });

        expect(result.complete).toBe(true);
        expect(result.contextUpdates?.responses).toEqual({
          confirmation: 'cancel',
        });
      });

      it('recognizes "no" text as cancel', async () => {
        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          incomingMessage: 'no thanks',
        });

        expect(result.complete).toBe(true);
        expect(result.contextUpdates?.responses).toEqual({
          confirmation: 'cancel',
        });
      });

      it('preserves existing responses on cancel', async () => {
        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          context: {
            ...baseProcessArgs.context,
            bookingIntentId: 'intent_123',
            responses: { someNode: 'previous value' },
          },
          interactiveReply: { type: 'button', id: 'btn_cancel_booking', title: '❌ Cancel' },
        });

        expect(result.contextUpdates?.responses).toEqual({
          someNode: 'previous value',
          confirmation: 'cancel',
        });
      });
    });

    describe('neither confirm nor cancel', () => {
      it('returns incomplete with error message for unrecognized input', async () => {
        const result = await confirmationHandler.process!({
          ...baseProcessArgs,
          incomingMessage: 'hello there',
        });

        expect(result.complete).toBe(false);
        expect(result.errorMessage).toBe(
          'Please tap ✅ Confirm or ❌ Cancel to proceed.',
        );
      });
    });
  });
});
