/**
 * Staff picker node handler — renders available staff and processes selection.
 *
 * Queries active staff for the business, renders them as a WhatsApp list
 * message, and processes the customer's selection into `contextUpdates.selectedStaffId`.
 *
 * If no active staff are available, renders an informational message and
 * does not advance (complete: false with no errorMessage — the engine will
 * treat this as a dead-end or the flow can route around it).
 *
 * Config shape:
 *   {
 *     text?: string;          // Prompt body text (default: "Please select a staff member:")
 *     header?: string;        // Optional header
 *     footer?: string;        // Optional footer
 *     buttonLabel?: string;   // Button label for the list (default: "Select Staff")
 *     noStaffMessage?: string; // Message when no staff available
 *   }
 *
 * Requirements: 2.3, 9.4
 */

import { prisma } from '@salex/shared-types';
import type { InteractiveMessage } from '../conversation.service';
import type { NodeHandler, NodeProcessArgs, NodeRenderArgs, NodeResult } from './types';
import { logger } from '../../utils/logger';

export const staffPickerHandler: NodeHandler = {
  type: 'staff_picker',
  autoAdvance: false,

  async render(args: NodeRenderArgs): Promise<InteractiveMessage> {
    const { config, businessId } = args;

    // Query active staff for this business
    const staff = await prisma.staff.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
    });

    // No staff available — render informational text message
    if (staff.length === 0) {
      const noStaffMessage =
        (config.noStaffMessage as string) ||
        'Sorry, there are no staff members available at the moment. Please try again later.';

      return {
        type: 'text',
        body: { text: noStaffMessage },
      };
    }

    const text =
      (config.text as string) || 'Please select a staff member:';
    const header = config.header as string | undefined;
    const footer = config.footer as string | undefined;
    const buttonLabel = (config.buttonLabel as string) || 'Select Staff';

    // Render as buttons (≤3 staff) or list (>3 staff)
    if (staff.length <= 3) {
      return {
        type: 'button',
        ...(header ? { header: { type: 'text' as const, text: header } } : {}),
        body: { text },
        ...(footer ? { footer: { text: footer } } : {}),
        action: {
          buttons: staff.map((s) => ({
            type: 'reply' as const,
            reply: { id: s.id, title: s.name },
          })),
        },
      };
    }

    // List-style interactive message (>3 staff)
    return {
      type: 'list',
      ...(header ? { header: { type: 'text' as const, text: header } } : {}),
      body: { text },
      ...(footer ? { footer: { text: footer } } : {}),
      action: {
        button: buttonLabel,
        sections: [
          {
            rows: staff.map((s) => ({
              id: s.id,
              title: s.name,
            })),
          },
        ],
      },
    };
  },

  async process(args: NodeProcessArgs): Promise<NodeResult> {
    const { incomingMessage, interactiveReply, businessId } = args;

    // Query active staff to validate the selection
    const staff = await prisma.staff.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
    });

    // No staff available — cannot complete
    if (staff.length === 0) {
      logger.warn({ businessId }, 'staff_picker process called with no active staff');
      return {
        complete: false,
        errorMessage:
          'Sorry, there are no staff members available at the moment. Please try again later.',
      };
    }

    let selectedStaff: { id: string; name: string } | undefined;

    if (interactiveReply) {
      // Interactive reply — match by id
      selectedStaff = staff.find((s) => s.id === interactiveReply.id);
    } else {
      // Free-text — try to match by name (case-insensitive)
      const normalizedInput = incomingMessage.trim().toLowerCase();
      selectedStaff = staff.find(
        (s) => s.name.toLowerCase() === normalizedInput,
      );

      // Also try matching by numeric index (1-based)
      if (!selectedStaff) {
        const index = parseInt(normalizedInput, 10);
        if (!isNaN(index) && index >= 1 && index <= staff.length) {
          selectedStaff = staff[index - 1];
        }
      }
    }

    if (!selectedStaff) {
      return {
        complete: false,
        errorMessage: 'Please select a valid staff member from the list.',
      };
    }

    return {
      complete: true,
      contextUpdates: {
        selectedStaffId: selectedStaff.id,
        selectedStaffName: selectedStaff.name,
      },
    };
  },
};
