import { describe, it, expect } from 'vitest';
import { availabilityService, BulkAvailabilityData, BulkBookingRow } from '../availability.service';

describe('AvailabilityService - Bulk Methods', () => {
  // Helper to create a BulkAvailabilityData object
  function makeBulkData(
    activeResourceCount: number,
    activeStaffCount: number,
    bookings: BulkBookingRow[] = [],
  ): BulkAvailabilityData {
    return {
      effectiveCapacity: Math.min(activeResourceCount, activeStaffCount),
      bookings,
      activeResourceCount,
      activeStaffCount,
    };
  }

  // Helper to create a booking row
  function makeBooking(
    id: string,
    scheduledAt: Date,
    endAt: Date,
    resourceId: string | null = null,
    staffId: string | null = null,
  ): BulkBookingRow {
    return { id, scheduledAt, endAt, resourceId, staffId };
  }

  describe('isSlotBookable', () => {
    it('returns false when effectiveCapacity is 0', () => {
      const data = makeBulkData(0, 0);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      expect(availabilityService.isSlotBookable(data, slotStart, slotEnd)).toBe(false);
    });

    it('returns true when no overlapping bookings and capacity > 0', () => {
      const data = makeBulkData(2, 2);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      expect(availabilityService.isSlotBookable(data, slotStart, slotEnd)).toBe(true);
    });

    it('returns true when overlap count < capacity', () => {
      const data = makeBulkData(2, 2, [
        makeBooking('b1', new Date('2025-01-01T09:45:00Z'), new Date('2025-01-01T10:15:00Z')),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      // 1 overlap < capacity 2
      expect(availabilityService.isSlotBookable(data, slotStart, slotEnd)).toBe(true);
    });

    it('returns false when overlap count equals capacity', () => {
      const data = makeBulkData(2, 2, [
        makeBooking('b1', new Date('2025-01-01T09:45:00Z'), new Date('2025-01-01T10:15:00Z')),
        makeBooking('b2', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z')),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      // 2 overlaps == capacity 2
      expect(availabilityService.isSlotBookable(data, slotStart, slotEnd)).toBe(false);
    });

    it('returns false when overlap count exceeds capacity', () => {
      const data = makeBulkData(1, 1, [
        makeBooking('b1', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z')),
        makeBooking('b2', new Date('2025-01-01T10:10:00Z'), new Date('2025-01-01T10:40:00Z')),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      expect(availabilityService.isSlotBookable(data, slotStart, slotEnd)).toBe(false);
    });

    it('does not count non-overlapping bookings', () => {
      const data = makeBulkData(1, 1, [
        // Booking ends exactly at slot start (no overlap)
        makeBooking('b1', new Date('2025-01-01T09:00:00Z'), new Date('2025-01-01T10:00:00Z')),
        // Booking starts exactly at slot end (no overlap)
        makeBooking('b2', new Date('2025-01-01T10:30:00Z'), new Date('2025-01-01T11:00:00Z')),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      // Neither booking overlaps (boundary: scheduledAt < slotEnd && endAt > slotStart)
      expect(availabilityService.isSlotBookable(data, slotStart, slotEnd)).toBe(true);
    });

    it('counts bookings that partially overlap at the start', () => {
      const data = makeBulkData(1, 1, [
        // Booking ends 1ms after slot start (overlaps)
        makeBooking('b1', new Date('2025-01-01T09:00:00Z'), new Date('2025-01-01T10:00:01Z')),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      expect(availabilityService.isSlotBookable(data, slotStart, slotEnd)).toBe(false);
    });

    it('returns false when resources > 0 but staff = 0 (capacity = 0)', () => {
      const data = makeBulkData(3, 0);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      expect(availabilityService.isSlotBookable(data, slotStart, slotEnd)).toBe(false);
    });
  });

  describe('isSlotBookableLegacyParity', () => {
    it('returns false when no resources configured', () => {
      const data = makeBulkData(0, 2);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(false);
    });

    it('returns false when no staff configured', () => {
      const data = makeBulkData(2, 0);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(false);
    });

    it('returns true when no overlapping bookings', () => {
      const data = makeBulkData(2, 2);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(true);
    });

    it('returns true when some resources and staff are still free', () => {
      const data = makeBulkData(2, 2, [
        makeBooking('b1', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z'), 'r1', 's1'),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      // 1 resource busy, 1 free; 1 staff busy, 1 free
      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(true);
    });

    it('returns false when all resources are busy', () => {
      const data = makeBulkData(2, 2, [
        makeBooking('b1', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z'), 'r1', 's1'),
        makeBooking('b2', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z'), 'r2', null),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      // Both resources busy, but 1 staff still free
      // availableResources = 2 - 2 = 0 → false
      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(false);
    });

    it('returns false when all staff are busy', () => {
      const data = makeBulkData(2, 2, [
        makeBooking('b1', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z'), 'r1', 's1'),
        makeBooking('b2', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z'), null, 's2'),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      // 1 resource busy, 1 free; but both staff busy
      // availableStaff = 2 - 2 = 0 → false
      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(false);
    });

    it('bookings with null resourceId do not consume a resource slot', () => {
      const data = makeBulkData(1, 2, [
        makeBooking('b1', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z'), null, 's1'),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      // null resourceId → resource still free; 1 staff busy, 1 free
      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(true);
    });

    it('bookings with null staffId do not consume a staff slot', () => {
      const data = makeBulkData(2, 1, [
        makeBooking('b1', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z'), 'r1', null),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      // 1 resource busy, 1 free; null staffId → staff still free
      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(true);
    });

    it('counts distinct resource/staff IDs (same ID in multiple bookings counts once)', () => {
      const data = makeBulkData(2, 2, [
        makeBooking('b1', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:15:00Z'), 'r1', 's1'),
        makeBooking('b2', new Date('2025-01-01T10:15:00Z'), new Date('2025-01-01T10:30:00Z'), 'r1', 's1'),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      // r1 appears twice but only counts as 1 busy resource; s1 same
      // availableResources = 2 - 1 = 1 > 0; availableStaff = 2 - 1 = 1 > 0
      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(true);
    });

    it('does not count non-overlapping bookings', () => {
      const data = makeBulkData(1, 1, [
        // Ends exactly at slot start (no overlap)
        makeBooking('b1', new Date('2025-01-01T09:00:00Z'), new Date('2025-01-01T10:00:00Z'), 'r1', 's1'),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(true);
    });

    it('divergence case: capacity formula says bookable but legacy parity says not (all staff individually booked)', () => {
      // 2 resources, 2 staff, 2 bookings each with different staff but same resource
      // Capacity: overlap = 2, capacity = 2 → NOT bookable (overlap not < capacity)
      // Legacy parity: busyResources = {r1} (1), busyStaff = {s1, s2} (2)
      //   availableResources = 2 - 1 = 1 > 0, availableStaff = 2 - 2 = 0 → NOT bookable
      const data = makeBulkData(2, 2, [
        makeBooking('b1', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z'), 'r1', 's1'),
        makeBooking('b2', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z'), 'r1', 's2'),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      // Both agree: not bookable
      expect(availabilityService.isSlotBookable(data, slotStart, slotEnd)).toBe(false);
      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(false);
    });

    it('divergence case: null staffId booking - capacity counts it but legacy parity does not consume staff', () => {
      // 1 resource, 1 staff, 1 booking with null staffId
      // Capacity: overlap = 1, capacity = 1 → NOT bookable (1 not < 1)
      // Legacy parity: busyResources = {r1} (1), busyStaff = {} (0)
      //   availableResources = 1 - 1 = 0 → NOT bookable (resources exhausted)
      const data = makeBulkData(1, 1, [
        makeBooking('b1', new Date('2025-01-01T10:00:00Z'), new Date('2025-01-01T10:30:00Z'), 'r1', null),
      ]);
      const slotStart = new Date('2025-01-01T10:00:00Z');
      const slotEnd = new Date('2025-01-01T10:30:00Z');

      expect(availabilityService.isSlotBookable(data, slotStart, slotEnd)).toBe(false);
      expect(availabilityService.isSlotBookableLegacyParity(data, slotStart, slotEnd)).toBe(false);
    });
  });
});
