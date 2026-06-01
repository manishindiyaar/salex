/**
 * Time-picker node handler — renders available time slots and processes selection.
 *
 * The time_picker node:
 *   1. Generates candidate time slots based on business hours (or a default 9 AM–7 PM range)
 *   2. Calls `getBulkAvailabilityData` once for the entire search range (Req 6.1)
 *   3. Filters slots in memory using `isSlotBookableLegacyParity` (parity/legacy mode)
 *      or `isSlotBookable` (capacity mode), controlled by `config.parityMode` (Req 6.2)
 *   4. Renders available slots as a WhatsApp list message
 *   5. Processes the customer's slot selection into context (`requestedTime`)
 *   6. Renders a "no available slots" message when the list is empty
 *
 * Config shape:
 *   {
 *     text?: string;              // Body text prompt (default: "Choose your preferred time slot:")
 *     header?: string;            // List header (default: "⏰ Select Time")
 *     footer?: string;            // List footer (default: "Tap to select a time")
 *     buttonLabel?: string;       // List button label (default: "View Times")
 *     noSlotsText?: string;       // Message when no slots available
 *     parityMode?: 'legacy' | 'capacity';  // Availability check mode (default: "legacy")
 *     durationMinutes?: number;   // Slot duration in minutes (default: from context.totalDuration or 60)
 *     daysAhead?: number;         // Number of days to search (default: 2 — today + tomorrow)
 *     startHour?: number;         // First candidate hour (default: 9)
 *     endHour?: number;           // Last candidate hour (default: 19)
 *     maxSlots?: number;          // Maximum slots to show (default: 10, WhatsApp list limit)
 *   }
 *
 * Requirements: 2.3, 6.1, 6.2, 9.1
 */

import { availabilityService } from '../availability.service';
import type { InteractiveMessage } from '../conversation.service';
import { logger } from '../../utils/logger';
import type { NodeHandler, NodeProcessArgs, NodeRenderArgs, NodeResult } from './types';

/** Default configuration values matching legacy behavior. */
const DEFAULTS = {
  startHour: 9,
  endHour: 19,
  daysAhead: 2,
  maxSlots: 10,
  durationMinutes: 60,
  parityMode: 'legacy' as const,
  header: '⏰ Select Time',
  footer: 'Tap to select a time',
  buttonLabel: 'View Times',
  noSlotsText: 'No slots are available right now. Please try again later or contact the business directly.',
};

interface TimeSlotCandidate {
  scheduledAt: Date;
  endAt: Date;
  label: string;
  dateLabel: string;
}

/**
 * Generate candidate time slots for the search range.
 * Mirrors the legacy `generateAvailableTimeSlots` slot generation logic:
 * hourly slots from startHour to endHour, skipping past times for today.
 */
function generateCandidateSlots(
  durationMinutes: number,
  daysAhead: number,
  startHour: number,
  endHour: number,
): TimeSlotCandidate[] {
  const candidates: TimeSlotCandidate[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);

    const dateLabel = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    const dateStr = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    for (let hour = startHour; hour <= endHour; hour++) {
      // Skip past times for today
      if (dayOffset === 0 && hour <= now.getHours()) continue;

      const slotDate = new Date(date);
      slotDate.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotDate.getTime() + durationMinutes * 60 * 1000);

      const timeLabel = slotDate.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      candidates.push({
        scheduledAt: slotDate,
        endAt: slotEnd,
        label: timeLabel,
        dateLabel: `${dateLabel}, ${dateStr}`,
      });
    }
  }

  return candidates;
}

export const timePickerHandler: NodeHandler = {
  type: 'time_picker',
  autoAdvance: false,

  async render(args: NodeRenderArgs): Promise<InteractiveMessage> {
    const { config, context, businessId } = args;

    // Resolve configuration with defaults
    const parityMode = (config.parityMode as string) || DEFAULTS.parityMode;
    const durationMinutes =
      (config.durationMinutes as number) ||
      (config.slotDuration as number) ||
      (context.totalDuration as number) ||
      DEFAULTS.durationMinutes;
    const daysAhead = (config.daysAhead as number) || DEFAULTS.daysAhead;
    const startHour = (config.startHour as number) ?? DEFAULTS.startHour;
    const endHour = (config.endHour as number) ?? DEFAULTS.endHour;
    const maxSlots = (config.maxSlots as number) || DEFAULTS.maxSlots;
    const headerText = (config.header as string) || DEFAULTS.header;
    const footerText = (config.footer as string) || DEFAULTS.footer;
    const buttonLabel = (config.buttonLabel as string) || DEFAULTS.buttonLabel;
    const noSlotsText = (config.noSlotsText as string) || DEFAULTS.noSlotsText;
    const bodyText = (config.text as string) || 'Choose your preferred time slot:';

    // Step 1: Generate candidate time slots
    const candidates = generateCandidateSlots(durationMinutes, daysAhead, startHour, endHour);

    if (candidates.length === 0) {
      // No candidate slots at all (e.g. past end of day and no days ahead)
      return {
        type: 'text',
        body: { text: noSlotsText },
      };
    }

    // Step 2: Fetch bulk availability data once for the entire range (Req 6.1)
    const rangeStart = candidates[0].scheduledAt;
    const rangeEnd = candidates[candidates.length - 1].endAt;

    const bulkData = await availabilityService.getBulkAvailabilityData(
      businessId,
      rangeStart,
      rangeEnd,
    );

    // Step 3: Filter slots in memory using the appropriate check function (Req 6.2)
    const isBookable = parityMode === 'capacity'
      ? (slotStart: Date, slotEnd: Date) =>
          availabilityService.isSlotBookable(bulkData, slotStart, slotEnd)
      : (slotStart: Date, slotEnd: Date) =>
          availabilityService.isSlotBookableLegacyParity(bulkData, slotStart, slotEnd);

    const availableSlots = candidates.filter((slot) =>
      isBookable(slot.scheduledAt, slot.endAt)
    );

    // Step 4: Limit to maxSlots (WhatsApp list limit)
    const displaySlots = availableSlots.slice(0, maxSlots);

    // Step 6: Render no-slots message when empty
    if (displaySlots.length === 0) {
      logger.debug(
        { businessId, candidateCount: candidates.length, parityMode },
        'time_picker: no available slots found',
      );
      return {
        type: 'text',
        body: { text: noSlotsText },
      };
    }

    // Step 4: Render available slots as a list message
    const rows = displaySlots.map((slot) => ({
      id: `timeslot_${slot.scheduledAt.toISOString()}`,
      title: slot.label,
      description: slot.dateLabel,
    }));

    return {
      type: 'list',
      header: { type: 'text' as const, text: headerText },
      body: { text: bodyText },
      footer: { text: footerText },
      action: {
        button: buttonLabel,
        sections: [{ title: 'Available Slots', rows }],
      },
    };
  },

  async process(args: NodeProcessArgs): Promise<NodeResult> {
    const { incomingMessage, interactiveReply, config, context } = args;

    let selectedTime: string | null = null;

    // Check for interactive reply (list selection)
    if (interactiveReply?.id?.startsWith('timeslot_')) {
      selectedTime = interactiveReply.id.replace('timeslot_', '');
    } else {
      // Try to parse time from free-text input
      selectedTime = parseTimeFromText(incomingMessage);
    }

    if (!selectedTime) {
      return {
        complete: false,
        errorMessage: 'Please select a valid time slot from the list.',
      };
    }

    // Validate the parsed time is a valid date
    const parsedDate = new Date(selectedTime);
    if (isNaN(parsedDate.getTime())) {
      return {
        complete: false,
        errorMessage: 'Please select a valid time slot from the list.',
      };
    }

    // Store the selected time in context as `requestedTime`
    return {
      complete: true,
      contextUpdates: {
        requestedTime: selectedTime,
      },
    };
  },
};

/**
 * Parse time from free-text message input.
 * Supports common time formats like "3:00 pm", "15:00", "3 pm".
 * Mirrors the legacy `parseTimeFromText` behavior.
 */
function parseTimeFromText(text: string): string | null {
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    /(\d{1,2})\s*(am|pm)/i,
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      let hour = parseInt(match[1], 10);
      const minute = match[2] && !match[2].match(/am|pm/i) ? parseInt(match[2], 10) : 0;
      const meridiem = (match[3] || match[2])?.toLowerCase();

      if (meridiem === 'pm' && hour < 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;

      const date = new Date();
      date.setHours(hour, minute, 0, 0);

      // If time is in the past, assume tomorrow
      if (date < new Date()) {
        date.setDate(date.getDate() + 1);
      }

      return date.toISOString();
    }
  }

  return null;
}
