/**
 * Service picker node handler — renders active services and processes selection.
 *
 * Queries the business's active services, renders them as a WhatsApp list
 * message using template-resolved terminology, and processes the customer's
 * selection into context (selectedServiceIds, totalDuration, totalPrice).
 *
 * If the business has no active services (E6), returns an informational text
 * message and does NOT advance (complete: false) — no hold is created.
 *
 * Config shape:
 *   {
 *     header?: string;       // Optional header template (supports {{placeholders}})
 *     body?: string;         // Optional body template (default: "Select a {{serviceTerm}} to book:")
 *     footer?: string;       // Optional footer template (default: "Tap to select a {{serviceTerm}}")
 *     buttonLabel?: string;  // Optional list button label (default: "View {{servicePluralTerm}}")
 *     noServicesMessage?: string; // Optional message when no services available
 *     nodeId?: string;       // Override key for context storage
 *   }
 *
 * Requirements: 2.3, 9.1, 12.3
 */

import { prisma } from '@salex/shared-types';
import type { InteractiveMessage } from '../conversation.service';
import type { NodeHandler, NodeProcessArgs, NodeRenderArgs, NodeResult } from './types';
import { TemplateResolver } from './template-resolver';

export const servicePickerHandler: NodeHandler = {
  type: 'service_picker',
  autoAdvance: false,

  async render(args: NodeRenderArgs): Promise<InteractiveMessage> {
    const { config, businessId } = args;

    // Get business with category for terminology resolution
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, category: true },
    });

    const resolver = new TemplateResolver({
      category: business?.category ?? null,
      businessName: business?.name ?? null,
    });

    // Get active services for the business
    const services = await prisma.service.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
    });

    // E6: No active services — return informational message, do not advance
    if (services.length === 0) {
      const noServicesMessage =
        (config.noServicesMessage as string) ||
        (config.emptyText as string) ||
        '😔 This business has no services available at the moment.\n\nPlease try again later.';

      return {
        type: 'text',
        body: { text: resolver.resolve(noServicesMessage) },
      };
    }

    // Resolve template strings for the list message
    const headerText = resolver.resolve(
      (config.header as string) || (config.headerTemplate as string) || '📋 {{businessName}}'
    );
    const bodyText = resolver.resolve(
      (config.body as string) || (config.bodyTemplate as string) || 'Select a {{serviceTerm}} to book:'
    );
    const footerText = resolver.resolve(
      (config.footer as string) || 'Tap to select a {{serviceTerm}}'
    );
    const buttonLabel = resolver.resolve(
      (config.buttonLabel as string) || (config.buttonTemplate as string) || 'View {{servicePluralTerm}}'
    );

    // Build list rows from active services (mirrors legacy pattern)
    const rows = services.map((service) => ({
      id: `service_${service.id}`,
      title: service.name,
      description: `₹${service.price} • ${service.durationMinutes} min`,
    }));

    return {
      type: 'list',
      header: { type: 'text' as const, text: headerText },
      body: { text: bodyText },
      footer: { text: footerText },
      action: {
        button: buttonLabel,
        sections: [
          {
            title: `Available ${resolver.getServicePluralTerm()}`,
            rows,
          },
        ],
      },
    };
  },

  async process(args: NodeProcessArgs): Promise<NodeResult> {
    const { incomingMessage, interactiveReply, businessId, config } = args;

    // Get active services for validation
    const services = await prisma.service.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
    });

    // E6: No active services — do not advance, do not create a hold
    if (services.length === 0) {
      return {
        complete: false,
        errorMessage:
          '😔 This business has no services available at the moment.\n\nPlease try again later.',
      };
    }

    // Determine which service was selected
    let serviceId: string | null = null;

    if (interactiveReply?.id?.startsWith('service_')) {
      // Interactive list selection — extract the service id
      serviceId = interactiveReply.id.replace('service_', '');
    } else {
      // Text-based selection — try number or name match (mirrors legacy findServiceByText)
      serviceId = findServiceByText(services, incomingMessage);
    }

    if (!serviceId) {
      return {
        complete: false,
        errorMessage: 'Please select a valid option from the list.',
      };
    }

    // Validate the selected service exists and is active
    const selectedService = services.find((s) => s.id === serviceId);
    if (!selectedService) {
      return {
        complete: false,
        errorMessage: '❌ Service not found or unavailable.\n\nPlease select from the list.',
      };
    }

    // Build context updates with selected service details
    return {
      complete: true,
      contextUpdates: {
        selectedServiceIds: [selectedService.id],
        selectedServiceName: selectedService.name,
        serviceNames: selectedService.name,
        totalDuration: selectedService.durationMinutes,
        totalPrice: Number(selectedService.price),
      },
    };
  },
};

/**
 * Find a service by text input — matches by number (1-based index) or name
 * (case-insensitive substring). Mirrors the legacy `findServiceByText` behavior.
 */
function findServiceByText(
  services: Array<{ id: string; name: string }>,
  text: string
): string | null {
  const trimmed = text.trim();

  // Try to match by number (1, 2, 3...)
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num > 0 && num <= services.length) {
    return services[num - 1].id;
  }

  // Try to match by name (case-insensitive substring)
  const lowerText = trimmed.toLowerCase();
  const match = services.find(
    (s) =>
      s.name.toLowerCase().includes(lowerText) ||
      lowerText.includes(s.name.toLowerCase())
  );

  return match?.id || null;
}
