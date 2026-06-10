import type { BulkAvailabilityData } from './availability.types';

export function hasTimeOverlap(
  existingStart: Date,
  existingEnd: Date,
  requestedStart: Date,
  requestedEnd: Date,
): boolean {
  return existingStart < requestedEnd && existingEnd > requestedStart;
}

/**
 * Pure in-memory slot availability check using the capacity-count formula.
 *
 * A slot is bookable iff:
 * - effectiveCapacity > 0, AND
 * - the count of overlapping bookings is strictly less than effectiveCapacity
 */
export function isSlotBookable(
  data: BulkAvailabilityData,
  slotStart: Date,
  slotEnd: Date,
): boolean {
  if (data.effectiveCapacity <= 0) {
    return false;
  }

  const overlapCount = data.bookings.filter((booking) =>
    hasTimeOverlap(booking.scheduledAt, booking.endAt, slotStart, slotEnd)
  ).length;

  return overlapCount < data.effectiveCapacity;
}

/**
 * Pure in-memory slot availability check reproducing the legacy
 * `getAvailabilityWithSuggestions(...).available` determination.
 */
export function isSlotBookableLegacyParity(
  data: BulkAvailabilityData,
  slotStart: Date,
  slotEnd: Date,
): boolean {
  if (data.activeResourceCount <= 0 || data.activeStaffCount <= 0) {
    return false;
  }

  const overlapping = data.bookings.filter((booking) =>
    hasTimeOverlap(booking.scheduledAt, booking.endAt, slotStart, slotEnd)
  );

  const busyResourceIds = new Set<string>();
  for (const booking of overlapping) {
    if (booking.resourceId !== null) {
      busyResourceIds.add(booking.resourceId);
    }
  }

  const busyStaffIds = new Set<string>();
  for (const booking of overlapping) {
    if (booking.staffId !== null) {
      busyStaffIds.add(booking.staffId);
    }
  }

  const availableResourceCount = data.activeResourceCount - busyResourceIds.size;
  const availableStaffCount = data.activeStaffCount - busyStaffIds.size;

  return availableResourceCount > 0 && availableStaffCount > 0;
}

export function calculateEndTime(scheduledAt: Date, totalDurationMinutes: number): Date {
  return new Date(scheduledAt.getTime() + totalDurationMinutes * 60 * 1000);
}
