/**
 * Message node handler — renders static text and auto-advances.
 *
 * A message node presents informational text to the customer without
 * waiting for a reply. The engine auto-advances to the next node
 * immediately after rendering (Req 4.3).
 *
 * Config shape:
 *   { text: string }  — the message body (may contain {{placeholder}} templates)
 *   OR { body: string } — alias for text
 *
 * Requirements: 2.3, 3.1, 4.3
 */

import type { InteractiveMessage } from '../conversation.service';
import type { NodeHandler, NodeRenderArgs } from './types';
import { resolveTemplate } from './template-resolver';

export const messageHandler: NodeHandler = {
  type: 'message',
  autoAdvance: true,

  async render(args: NodeRenderArgs): Promise<InteractiveMessage> {
    const { config, context } = args;

    // Support both `text` and `body` as the message content key
    let text = (config.text as string) || (config.body as string) || '';

    // Resolve template variables ({{business.name}}, {{selectedService.name}}, etc.)
    if (text.includes('{{')) {
      text = resolveTemplate(text, {
        businessName: (context.businessName as string) || undefined,
        category: (context.businessCategory as string) || undefined,
        routingCode: (context.routingCode as string) || undefined,
        selectedServiceName: (context.serviceNames as string) || (context.selectedServiceName as string) || undefined,
        selectedServicePrice: (context.totalPrice as number) ?? undefined,
        selectedServiceDuration: (context.totalDuration as number) ?? undefined,
        selectedTime: (context.requestedTime as string) || undefined,
        selectedStaffName: (context.selectedStaffName as string) || undefined,
        bookingId: (context.bookingId as string) || undefined,
      });
    }

    return {
      type: 'text',
      body: { text },
    };
  },

  // No process method — message nodes auto-advance without customer input (Req 4.3)
};
