/**
 * Confirmation node handler — renders confirm/cancel buttons and processes the reply.
 *
 * The confirmation node:
 *   1. Renders a booking summary with confirm/cancel buttons
 *   2. Processes the customer's reply (confirm or cancel)
 *   3. On confirm: creates or finds the BookingIntent (hold) idempotently using
 *      an idempotencyKey derived from (conversationId, sorted serviceIds, requestedTime).
 *      - If hold is valid (PENDING + not expired): sets `bookingIntentId` in context,
 *        sets `responses.confirmation = 'confirm'`, and completes
 *      - If hold expired (E4): expires the hold, sets `responses.confirmation = 'expired'`,
 *        and signals a transition back to the time_picker by clearing requestedTime/bookingIntentId
 *   4. On cancel: clears booking context (selectedServiceIds, requestedTime, bookingIntentId)
 *      and sets `responses.confirmation = 'cancel'`
 *
 * Config shape:
 *   {
 *     text?: string;              // Body text template (default: summary with placeholders)
 *     header?: string;            // Header text (default: "✅ Confirm Booking")
 *     confirmLabel?: string;      // Confirm button label (default: "✅ Confirm")
 *     cancelLabel?: string;       // Cancel button label (default: "❌ Cancel")
 *     expiredText?: string;       // Message when hold has expired
 *     holdMinutes?: number;       // Hold window in minutes (default: 10)
 *   }
 *
 * Requirements: 2.3, 3.2, 9.1, 9.2, 9.6, 9.7, 13.2
 */

import { prisma } from '@salex/shared-types';
import type { InteractiveMessage } from '../conversation.service';
import { logger } from '../../utils/logger';
import type { NodeHandler, NodeProcessArgs, NodeRenderArgs, NodeResult } from './types';
import { resolveTemplate } from './template-resolver';

/** Default configuration values matching legacy behavior. */
const DEFAULTS = {
  header: '✅ Confirm Booking',
  confirmLabel: '✅ Confirm',
  cancelLabel: '❌ Cancel',
  confirmButtonId: 'btn_confirm_booking',
  cancelButtonId: 'btn_cancel_booking',
  expiredText: 'This booking hold expired. Please choose a fresh time slot.',
};

export const confirmationHandler: NodeHandler = {
  type: 'confirmation',
  autoAdvance: false,

  async render(args: NodeRenderArgs): Promise<InteractiveMessage> {
    const { config, context, businessId } = args;

    const headerText = (config.header as string) || DEFAULTS.header;
    const confirmLabel = (config.confirmLabel as string) || DEFAULTS.confirmLabel;
    const cancelLabel = (config.cancelLabel as string) || DEFAULTS.cancelLabel;

    // Build the summary body text
    let bodyText = (config.text as string) || '';

    if (!bodyText) {
      // Build a default summary from context (mirrors legacy showConfirmation)
      const parts: string[] = [];

      const businessName = (context.businessName as string) || 'the business';
      parts.push(`📍 ${businessName}`);

      const serviceNames = (context.serviceNames as string) || 'Selected services';
      parts.push(`🧴 ${serviceNames}`);

      const requestedTime = context.requestedTime as string | undefined;
      const formattedTime = requestedTime
        ? new Date(requestedTime).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'Selected time';
      parts.push(`⏰ ${formattedTime}`);

      const totalPrice = context.totalPrice as number | undefined;
      if (totalPrice !== undefined && totalPrice !== null) {
        parts.push(`💰 ₹${totalPrice}`);
      }

      parts.push('');
      parts.push('Confirm your booking?');

      bodyText = parts.join('\n');
    } else {
      // Resolve template variables in the configured text
      const requestedTime = context.requestedTime as string | undefined;
      const formattedTime = requestedTime
        ? new Date(requestedTime).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : '';

      bodyText = resolveTemplate(bodyText, {
        businessName: (context.businessName as string) || undefined,
        category: (context.businessCategory as string) || undefined,
        selectedServiceName: (context.serviceNames as string) || (context.selectedServiceName as string) || undefined,
        selectedServicePrice: (context.totalPrice as number) ?? undefined,
        selectedTime: formattedTime || undefined,
        selectedStaffName: (context.selectedStaffName as string) || undefined,
        bookingId: (context.bookingId as string) || undefined,
      });
    }

    return {
      type: 'button',
      header: { type: 'text', text: headerText },
      body: { text: bodyText },
      action: {
        buttons: [
          { type: 'reply', reply: { id: DEFAULTS.confirmButtonId, title: confirmLabel } },
          { type: 'reply', reply: { id: DEFAULTS.cancelButtonId, title: cancelLabel } },
        ],
      },
    };
  },

  async process(args: NodeProcessArgs): Promise<NodeResult> {
    const { incomingMessage, interactiveReply, config, context, businessId } = args;

    const expiredText = (config.expiredText as string) || DEFAULTS.expiredText;

    // Determine if the customer confirmed or cancelled
    const isConfirm =
      interactiveReply?.id === DEFAULTS.confirmButtonId ||
      incomingMessage.toLowerCase().includes('confirm') ||
      incomingMessage.toLowerCase().includes('yes');

    const isCancel =
      interactiveReply?.id === DEFAULTS.cancelButtonId ||
      incomingMessage.toLowerCase().includes('cancel') ||
      incomingMessage.toLowerCase().includes('no');

    // --- CANCEL ---
    if (isCancel) {
      logger.debug({ businessId }, 'confirmation: customer cancelled booking');

      const existingResponses = (context.responses as Record<string, unknown>) || {};

      return {
        complete: true,
        contextUpdates: {
          responses: {
            ...existingResponses,
            confirmation: 'cancel',
          },
          // Clear booking context so the flow can restart from service selection
          selectedServiceIds: undefined,
          requestedTime: undefined,
          bookingIntentId: undefined,
        },
      };
    }

    // --- CONFIRM ---
    if (isConfirm) {
      const existingResponses = (context.responses as Record<string, unknown>) || {};

      // Extract booking details from context to create/find the hold
      const requestedTime = context.requestedTime as string | undefined;
      const selectedServiceIds = context.selectedServiceIds as string[] | undefined;
      const conversationId = (context.conversationId || context.__conversationId) as string | undefined;
      const customerPhone = context.customerPhone as string | undefined;
      const totalDuration = (context.totalDuration as number) || 0;
      const totalPrice = (context.totalPrice as number) || 0;
      const holdMinutes = (config.holdMinutes as number) || 10;

      // If requestedTime or selectedServiceIds are missing, signal expired (transition back to time_picker)
      if (!requestedTime || !selectedServiceIds || selectedServiceIds.length === 0) {
        logger.warn({ businessId }, 'confirmation: missing requestedTime or selectedServiceIds');

        return {
          complete: true,
          contextUpdates: {
            responses: {
              ...existingResponses,
              confirmation: 'expired',
            },
            requestedTime: undefined,
            bookingIntentId: undefined,
          },
          errorMessage: expiredText,
        };
      }

      const scheduledAt = new Date(requestedTime);
      if (isNaN(scheduledAt.getTime())) {
        logger.warn({ businessId }, 'confirmation: invalid requestedTime');

        return {
          complete: true,
          contextUpdates: {
            responses: {
              ...existingResponses,
              confirmation: 'expired',
            },
            requestedTime: undefined,
            bookingIntentId: undefined,
          },
          errorMessage: expiredText,
        };
      }

      // Create or find existing BookingIntent idempotently (Req 9.1, 9.6)
      const serviceIdsSorted = [...selectedServiceIds].sort();
      const idempotencyKey = [
        conversationId || businessId,
        serviceIdsSorted.join(','),
        scheduledAt.toISOString(),
      ].join(':');

      const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

      let bookingIntent = await prisma.bookingIntent.upsert({
        where: { idempotencyKey },
        update: {
          // Refresh expiry on re-attempt if still PENDING
          expiresAt,
        },
        create: {
          conversationId: conversationId || businessId,
          businessId,
          customerPhone: customerPhone || '',
          serviceIds: serviceIdsSorted,
          requestedTime: scheduledAt,
          totalDuration,
          totalPrice,
          idempotencyKey,
          expiresAt,
        },
      });

      // If already confirmed (idempotent — Req 9.6)
      if (bookingIntent.status === 'CONFIRMED' && bookingIntent.bookingId) {
        logger.info(
          { bookingIntentId: bookingIntent.id, bookingId: bookingIntent.bookingId },
          'confirmation: already confirmed (idempotent)',
        );

        return {
          complete: true,
          contextUpdates: {
            responses: {
              ...existingResponses,
              confirmation: 'confirm',
            },
            bookingIntentId: bookingIntent.id,
            bookingId: bookingIntent.bookingId,
          },
        };
      }

      // Check if the hold is still valid (PENDING and not expired) — Req 9.7
      if (bookingIntent.status !== 'PENDING' || bookingIntent.expiresAt <= new Date()) {
        // Hold has expired (E4) — expire it and signal transition back to time_picker
        logger.debug(
          { businessId, bookingIntentId: bookingIntent.id },
          'confirmation: booking hold expired (E4)',
        );

        await prisma.bookingIntent.updateMany({
          where: {
            id: bookingIntent.id,
            status: 'PENDING',
          },
          data: { status: 'EXPIRED' },
        });

        return {
          complete: true,
          contextUpdates: {
            responses: {
              ...existingResponses,
              confirmation: 'expired',
            },
            requestedTime: undefined,
            bookingIntentId: undefined,
          },
          errorMessage: expiredText,
        };
      }

      // Hold is valid — set bookingIntentId in context and confirm
      logger.debug(
        { businessId, bookingIntentId: bookingIntent.id },
        'confirmation: booking hold created/valid, confirming',
      );

      return {
        complete: true,
        contextUpdates: {
          responses: {
            ...existingResponses,
            confirmation: 'confirm',
          },
          bookingIntentId: bookingIntent.id,
        },
      };
    }

    // --- NEITHER CONFIRM NOR CANCEL ---
    // Re-render the same node (validation failure, Req 12.1/12.2)
    return {
      complete: false,
      errorMessage: 'Please tap ✅ Confirm or ❌ Cancel to proceed.',
    };
  },
};
