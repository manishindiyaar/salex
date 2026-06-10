/**
 * Booking node handler — finalizes a booking through the existing booking service.
 *
 * The booking node is the terminal step in the flow. It:
 *   1. On render: shows a booking summary (service, time, price) with a "Confirm" button
 *   2. On process/confirm:
 *      - Checks business is active and accepting orders (E7 — Req 12.4)
 *      - Loads the existing BookingIntent (hold) created by the confirmation handler
 *      - Validates the hold is still PENDING and not expired (Req 9.7)
 *      - Re-validates availability via getBulkAvailabilityData + isSlotBookable (Req 13.3)
 *      - If slot no longer available, returns error signaling back to time_picker (E5)
 *      - Finalizes booking through bookingService.create (resource/staff assignment,
 *        identity records, audit trail — Req 9.4, 15.4, 15.5)
 *      - Passes selectedStaffId if present in context (Req 9.4)
 *      - Signals terminal: true and complete: true (Req 14.2)
 *
 * NOTE: The BookingIntent (hold) is created by the confirmation handler, NOT here.
 * This handler only finalizes an existing hold.
 *
 * Config shape:
 *   {
 *     confirmButtonLabel?: string;   // Confirm button text (default: "✅ Confirm Booking")
 *     cancelButtonLabel?: string;    // Cancel button text (default: "❌ Cancel")
 *     summaryHeader?: string;        // Summary header (default: "📋 Booking Summary")
 *   }
 *
 * Requirements: 2.3, 9.1, 9.4, 9.6, 9.7, 12.4, 13.3, 13.4, 14.2, 15.4, 15.5
 */

import { prisma } from '@salex/shared-types';
import { availabilityService } from '../availability.service';
import { bookingService } from '../booking.service';
import type { InteractiveMessage } from '../conversation.service';
import { logger } from '../../utils/logger';
import type { NodeHandler, NodeProcessArgs, NodeRenderArgs, NodeResult } from './types';

/** Default configuration values. */
const DEFAULTS = {
  confirmButtonLabel: '✅ Confirm Booking',
  cancelButtonLabel: '❌ Cancel',
  summaryHeader: '📋 Booking Summary',
};

export const bookingHandler: NodeHandler = {
  type: 'booking',
  autoAdvance: false,

  async render(args: NodeRenderArgs): Promise<InteractiveMessage> {
    const { config, context, businessId } = args;

    const headerText = (config.summaryHeader as string) || DEFAULTS.summaryHeader;
    const confirmLabel = (config.confirmButtonLabel as string) || DEFAULTS.confirmButtonLabel;
    const cancelLabel = (config.cancelButtonLabel as string) || DEFAULTS.cancelButtonLabel;

    // Build summary from context
    const requestedTime = context.requestedTime as string | undefined;
    const totalPrice = context.totalPrice as number | undefined;
    const selectedServiceIds = context.selectedServiceIds as string[] | undefined;

    // Fetch service names for the summary
    let serviceNames = 'Your selected service';
    if (selectedServiceIds && selectedServiceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: { id: { in: selectedServiceIds }, businessId },
        select: { name: true, price: true },
      });
      if (services.length > 0) {
        serviceNames = services.map((s) => s.name).join(', ');
      }
    }

    // Format time for display
    let timeDisplay = 'Selected time';
    if (requestedTime) {
      const date = new Date(requestedTime);
      if (!isNaN(date.getTime())) {
        timeDisplay = date.toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
      }
    }

    // Format price
    const priceDisplay = totalPrice != null ? `₹${totalPrice}` : 'TBD';

    const bodyText =
      `💇 ${serviceNames}\n` +
      `📅 ${timeDisplay}\n` +
      `💰 ${priceDisplay}\n\n` +
      `Please confirm your booking:`;

    return {
      type: 'button',
      header: { type: 'text', text: headerText },
      body: { text: bodyText },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'btn_confirm_booking', title: confirmLabel } },
          { type: 'reply', reply: { id: 'btn_cancel_booking', title: cancelLabel } },
        ],
      },
    };
  },

  async process(args: NodeProcessArgs): Promise<NodeResult> {
    const { incomingMessage, interactiveReply, context, businessId } = args;

    // Determine if this is a confirm or cancel action
    const isConfirm =
      interactiveReply?.id === 'btn_confirm_booking' ||
      incomingMessage.toLowerCase().includes('confirm') ||
      incomingMessage.toLowerCase().includes('yes');

    const isCancel =
      interactiveReply?.id === 'btn_cancel_booking' ||
      incomingMessage.toLowerCase().includes('cancel') ||
      incomingMessage.toLowerCase().includes('no');

    // --- Cancel path: clear booking context, signal incomplete to go back ---
    if (isCancel) {
      // Expire any existing hold
      const bookingIntentId = context.bookingIntentId as string | undefined;
      if (bookingIntentId) {
        await prisma.bookingIntent.updateMany({
          where: { id: bookingIntentId, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        });
      }

      return {
        complete: true,
        contextUpdates: {
          requestedTime: undefined,
          bookingIntentId: undefined,
          bookingCancelled: true,
        },
      };
    }

    // --- Confirm path ---
    if (!isConfirm) {
      return {
        complete: false,
        errorMessage: 'Please tap "Confirm" to finalize your booking or "Cancel" to go back.',
      };
    }

    // E7: Check business is active and accepting orders (Req 12.4)
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        ownerId: true,
        name: true,
        isActive: true,
        isAcceptingOrders: true,
      },
    });

    if (!business) {
      return {
        complete: false,
        errorMessage: '❌ Business not found. Please try again later.',
      };
    }

    if (!business.isActive) {
      return {
        complete: false,
        errorMessage: '❌ This business is currently unavailable. Please try again later.',
      };
    }

    if (!business.isAcceptingOrders) {
      return {
        complete: false,
        errorMessage: '❌ This business is not accepting bookings at the moment. Please try again later.',
      };
    }

    // Extract booking details from context
    const requestedTime = context.requestedTime as string | undefined;
    const selectedServiceIds = context.selectedServiceIds as string[] | undefined;
    const customerPhone = context.customerPhone as string | undefined;
    const totalDuration = (context.totalDuration as number) || 0;
    const selectedStaffId = context.selectedStaffId as string | undefined;

    if (!requestedTime || !selectedServiceIds || selectedServiceIds.length === 0) {
      return {
        complete: false,
        errorMessage: '❌ Missing booking details. Please start over.',
      };
    }

    const scheduledAt = new Date(requestedTime);
    if (isNaN(scheduledAt.getTime())) {
      return {
        complete: false,
        errorMessage: '❌ Invalid time selection. Please choose a time again.',
      };
    }

    const endAt = new Date(scheduledAt.getTime() + totalDuration * 60 * 1000);

    // --- Load existing BookingIntent (created by confirmation handler) ---
    const bookingIntentId = context.bookingIntentId as string | undefined;

    if (!bookingIntentId) {
      // No hold exists — shouldn't happen in normal flow (confirmation creates it)
      logger.error({ businessId }, 'booking: no bookingIntentId in context — hold was not created by confirmation');

      return {
        complete: true,
        contextUpdates: {
          requestedTime: undefined,
          bookingIntentId: undefined,
          holdExpired: true,
        },
        errorMessage: '⏰ Your booking hold has expired. Please choose a new time slot.',
      };
    }

    // Load the existing hold
    const bookingIntent = await prisma.bookingIntent.findUnique({
      where: { id: bookingIntentId },
    });

    if (!bookingIntent) {
      logger.error(
        { bookingIntentId, businessId },
        'booking: bookingIntentId not found in database',
      );

      return {
        complete: true,
        contextUpdates: {
          requestedTime: undefined,
          bookingIntentId: undefined,
          holdExpired: true,
        },
        errorMessage: '⏰ Your booking hold has expired. Please choose a new time slot.',
      };
    }

    // If already confirmed (idempotent finalization, Req 9.6)
    if (bookingIntent.status === 'CONFIRMED' && bookingIntent.bookingId) {
      logger.info(
        { bookingIntentId: bookingIntent.id, bookingId: bookingIntent.bookingId },
        'booking: already confirmed (idempotent)',
      );

      return {
        complete: true,
        terminal: true,
        contextUpdates: {
          bookingIntentId: bookingIntent.id,
          bookingId: bookingIntent.bookingId,
        },
      };
    }

    // Check if hold has expired (Req 9.7)
    if (bookingIntent.status !== 'PENDING' || bookingIntent.expiresAt <= new Date()) {
      await prisma.bookingIntent.updateMany({
        where: { id: bookingIntent.id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });

      logger.info(
        { bookingIntentId: bookingIntent.id },
        'booking: hold expired, returning to time_picker',
      );

      return {
        complete: true,
        contextUpdates: {
          requestedTime: undefined,
          bookingIntentId: undefined,
          holdExpired: true,
        },
        errorMessage: '⏰ Your booking hold has expired. Please choose a new time slot.',
      };
    }

    // --- Re-validate availability at confirmation (Req 13.3, E5) ---
    const bulkData = await availabilityService.getBulkAvailabilityData(
      businessId,
      scheduledAt,
      endAt,
    );

    const slotStillBookable = availabilityService.isSlotBookable(bulkData, scheduledAt, endAt);

    if (!slotStillBookable) {
      // Expire the hold since the slot is no longer available
      await prisma.bookingIntent.updateMany({
        where: { id: bookingIntent.id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });

      logger.info(
        { bookingIntentId: bookingIntent.id, businessId },
        'booking: slot no longer available at confirmation (E5)',
      );

      return {
        complete: true,
        contextUpdates: {
          requestedTime: undefined,
          bookingIntentId: undefined,
          slotUnavailable: true,
        },
        errorMessage:
          '😔 Sorry, this time slot is no longer available. Please choose a different time.',
      };
    }

    // --- Finalize booking through bookingService.create (Req 9.4, 15.4, 15.5) ---
    try {
      // Ensure identity records (Req 15.4)
      const normalizedPhone = (customerPhone || '').replace(/\D/g, '');

      const [customer, businessCustomer] = await Promise.all([
        prisma.customer.upsert({
          where: { phoneNumber: normalizedPhone },
          update: { updatedAt: new Date() },
          create: { phoneNumber: normalizedPhone, name: null },
        }),
        ensureBusinessCustomer(businessId, normalizedPhone),
      ]);

      // Build booking params — pass selectedStaffId if present (Req 9.4)
      const bookingParams: {
        businessId: string;
        customerId: string;
        businessCustomerId: string;
        serviceIds: string[];
        scheduledAt: string;
        source: 'whatsapp' | 'manual' | 'walk-in';
        staffId?: string;
      } = {
        businessId,
        customerId: customer.id,
        businessCustomerId: businessCustomer.id,
        serviceIds: selectedServiceIds,
        scheduledAt: scheduledAt.toISOString(),
        source: 'whatsapp',
      };

      if (selectedStaffId) {
        bookingParams.staffId = selectedStaffId;
      }

      // Create booking via bookingService.create (resource/staff assignment, audit trail)
      const booking = await bookingService.create(business.ownerId, bookingParams);

      // Mark the BookingIntent as CONFIRMED (Req 13.4)
      await prisma.bookingIntent.update({
        where: { id: bookingIntent.id },
        data: {
          status: 'CONFIRMED',
          bookingId: booking.id,
        },
      });

      logger.info(
        { bookingIntentId: bookingIntent.id, bookingId: booking.id, businessId },
        'booking: finalized successfully',
      );

      return {
        complete: true,
        terminal: true,
        contextUpdates: {
          bookingIntentId: bookingIntent.id,
          bookingId: booking.id,
          bookingConfirmed: true,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error(
        { businessId, error: errorMessage },
        'booking: finalization failed',
      );

      // If it's a known business rule error (e.g. no capacity), inform the customer
      if (errorMessage.includes('No availability') || errorMessage.includes('unavailable')) {
        await prisma.bookingIntent.updateMany({
          where: { id: bookingIntent.id, status: 'PENDING' },
          data: { status: 'EXPIRED' },
        });

        return {
          complete: true,
          contextUpdates: {
            requestedTime: undefined,
            bookingIntentId: undefined,
            slotUnavailable: true,
          },
          errorMessage:
            '😔 Sorry, this time slot is no longer available. Please choose a different time.',
        };
      }

      // For unexpected errors, let the customer retry
      return {
        complete: false,
        errorMessage:
          '❌ Something went wrong while confirming your booking. Please try again.',
      };
    }
  },
};

/**
 * Ensure Foundation V2 identity records exist for this business/customer pair.
 * Mirrors the legacy `ensureBusinessCustomer` from conversation.service.ts (Req 15.4).
 */
async function ensureBusinessCustomer(businessId: string, phoneNumber: string) {
  const person = await prisma.person.upsert({
    where: { phoneNumber },
    update: { updatedAt: new Date() },
    create: { phoneNumber },
  });

  const businessCustomer = await prisma.businessCustomer.upsert({
    where: {
      businessId_personId: {
        businessId,
        personId: person.id,
      },
    },
    update: {
      lastInteractedAt: new Date(),
    },
    create: {
      businessId,
      personId: person.id,
      displayName: null,
      lastInteractedAt: new Date(),
    },
  });

  return businessCustomer;
}
