import { create } from 'zustand';
import { Booking } from '../../../../packages/shared-types/src';
import * as BookingService from '../services/bookingService';
import { showErrorToast, showSuccessToast } from './toastStore';

interface BookingState {
  items: Booking[];
  loading: boolean;
  cancelling: Record<string, boolean>;

  listByBusiness: (businessId: string) => Promise<void>;
  cancel: (bookingId: string) => Promise<void>;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  items: [],
  loading: false,
  cancelling: {},

  async listByBusiness(businessId) {
    try {
      set({ loading: true });
      const bookings = await BookingService.listBookingsByBusiness(businessId);
      set({ items: bookings });
    } catch (err: any) {
      const message = err?.message ?? 'Failed to load bookings';
      const code = err?.code;
      showErrorToast(message, code);
    } finally {
      set({ loading: false });
    }
  },

  async cancel(bookingId) {
    try {
      set((s) => ({ cancelling: { ...s.cancelling, [bookingId]: true } }));
      const updated = await BookingService.cancelBooking(bookingId);
      set((s) => ({
        items: s.items.map((b) => (b.id === bookingId ? updated : b)),
      }));
      showSuccessToast('Booking cancelled');
    } catch (err: any) {
      const message = err?.message ?? 'Failed to cancel booking';
      const code = err?.code;
      showErrorToast(message, code);
    } finally {
      set((s) => {
        const next = { ...s.cancelling };
        delete next[bookingId];
        return { cancelling: next };
      });
    }
  },

  reset() {
    set({ items: [], loading: false, cancelling: {} });
  },
}));
