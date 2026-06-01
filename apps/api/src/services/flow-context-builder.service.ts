import { prisma } from '@salex/shared-types';
import type { FlowContext } from './flow-engine/resolve-next-node';

function formatSelectedTime(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function removeUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(removeUndefined);
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (nestedValue !== undefined) {
        result[key] = removeUndefined(nestedValue);
      }
    }
    return result;
  }

  return value;
}

class FlowContextBuilderService {
  async hydrate(
    businessId: string,
    context: FlowContext,
  ): Promise<FlowContext> {
    const hydrated: FlowContext = { ...context };

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, category: true, routingCode: true },
    });

    if (business) {
      hydrated.businessName = business.name;
      hydrated.businessCategory = business.category;
      hydrated.routingCode = business.routingCode;
      hydrated.business = {
        name: business.name,
        category: business.category,
        routingCode: business.routingCode,
      };
      hydrated['business.name'] = business.name;
      hydrated['business.category'] = business.category;
      hydrated['business.routingCode'] = business.routingCode;
    }

    const selectedServiceIds = Array.isArray(hydrated.selectedServiceIds)
      ? hydrated.selectedServiceIds.filter((id): id is string => typeof id === 'string')
      : [];

    if (selectedServiceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: { businessId, id: { in: selectedServiceIds }, isActive: true },
        select: { id: true, name: true, price: true, durationMinutes: true },
        orderBy: { name: 'asc' },
      });

      if (services.length > 0) {
        const serviceNames = services.map((service) => service.name).join(', ');
        const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0);
        const totalDuration = services.reduce((sum, service) => sum + service.durationMinutes, 0);

        hydrated.serviceNames = serviceNames;
        hydrated.selectedServiceName = serviceNames;
        hydrated.selectedService = {
          name: serviceNames,
          price: hydrated.totalPrice ?? totalPrice,
          duration: hydrated.totalDuration ?? totalDuration,
        };
        hydrated['selectedService.name'] = serviceNames;

        if (hydrated.totalPrice === undefined || hydrated.totalPrice === null) {
          hydrated.totalPrice = totalPrice;
        }
        if (hydrated.totalDuration === undefined || hydrated.totalDuration === null) {
          hydrated.totalDuration = totalDuration;
        }

        hydrated['selectedService.price'] = hydrated.totalPrice;
        hydrated['selectedService.duration'] = hydrated.totalDuration;
      }
    }

    if (typeof hydrated.selectedStaffId === 'string') {
      const staff = await prisma.staff.findFirst({
        where: { id: hydrated.selectedStaffId, businessId, isActive: true },
        select: { name: true },
      });

      if (staff) {
        hydrated.selectedStaffName = staff.name;
        hydrated.selectedStaff = { name: staff.name };
        hydrated['selectedStaff.name'] = staff.name;
      }
    }

    const selectedTime = formatSelectedTime(hydrated.requestedTime);
    if (selectedTime) {
      hydrated.selectedTime = selectedTime;
    }

    if (typeof hydrated.bookingId === 'string') {
      hydrated.booking = { id: hydrated.bookingId };
      hydrated['booking.id'] = hydrated.bookingId;
    }

    return removeUndefined(hydrated) as FlowContext;
  }
}

export const flowContextBuilder = new FlowContextBuilderService();
