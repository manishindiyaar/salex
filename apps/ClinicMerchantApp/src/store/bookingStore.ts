/**
 * Booking Store
 * 
 * Zustand store for managing booking state.
 * Connects to the Express.js backend via bookingService.
 */

import { create } from 'zustand';
import { Booking } from '../types';
import * as BookingService from '../services/bookingService';
import { showErrorToast, showSuccessToast } from './toastStore';

interface BookingState {
  // Booking list
  items: Booking[];
  loading: boolean;
  
  // Pending requests (for real-time WhatsApp bookings)
  pendingRequests: Booking[];
  
  // Action states
  confirming: Record<string, boolean>;
  cancelling: Record<string, boolean>;
  completing: Record<string, boolean>;

  // Actions
  listByBusiness: (businessId: string, params?: BookingService.ListBookingParams) => Promise<void>;
  confirm: (bookingId: string) => Promise<void>;
  cancel: (bookingId: string) => Promise<void>;
  reject: (bookingId: string) => Promise<void>;
  complete: (bookingId: string, paymentMethod: 'CASH' | 'BANK') => Promise<void>;
  
  // Pending request management
  addPendingRequest: (booking: Booking) => void;
  removePendingRequest: (bookingId: string) => void;
  
  // Reset
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  items: [],
  loading: false,
  pendingRequests: [],
  confirming: {},
  cancelling: {},
  completing: {},

  async listByBusiness(businessId, params = {}) {
    try {
      set({ loading: true });
      const bookings = await BookingService.listBookingsByBusiness(businessId, params);
      set({ items: bookings });
    } catch (err: any) {
      const message = err?.message ?? 'Failed to load bookings';
      const code = err?.code;
      showErrorToast(message, code);
    } finally {
      set({ loading: false });
    }
  },

  async confirm(bookingId) {
    try {
      set((s) => ({ confirming: { ...s.confirming, [bookingId]: true } }));
      const updated = await BookingService.confirmBooking(bookingId);
      set((s) => ({
        items: s.items.map((b) => (b.id === bookingId ? updated : b)),
        pendingRequests: s.pendingRequests.filter((b) => b.id !== bookingId),
      }));
      showSuccessToast('Booking confirmed');
    } catch (err: any) {
      const message = err?.message ?? 'Failed to confirm booking';
      const code = err?.code;
      showErrorToast(message, code);
    } finally {
      set((s) => {
        const next = { ...s.confirming };
        delete next[bookingId];
        return { confirming: next };
      });
    }
  },

  async cancel(bookingId) {
    try {
      set((s) => ({ cancelling: { ...s.cancelling, [bookingId]: true } }));
      const updated = await BookingService.cancelBooking(bookingId);
      set((s) => ({
        items: s.items.map((b) => (b.id === bookingId ? updated : b)),
        pendingRequests: s.pendingRequests.filter((b) => b.id !== bookingId),
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

  async reject(bookingId) {
    try {
      set((s) => ({ cancelling: { ...s.cancelling, [bookingId]: true } }));
      const updated = await BookingService.rejectBooking(bookingId);
      set((s) => ({
        items: s.items.map((b) => (b.id === bookingId ? updated : b)),
        pendingRequests: s.pendingRequests.filter((b) => b.id !== bookingId),
      }));
      showSuccessToast('Booking rejected');
    } catch (err: any) {
      const message = err?.message ?? 'Failed to reject booking';
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

  async complete(bookingId, paymentMethod) {
    try {
      set((s) => ({ completing: { ...s.completing, [bookingId]: true } }));
      const updated = await BookingService.completeBookingWithPayment(bookingId, paymentMethod);
      set((s) => ({
        items: s.items.map((b) => (b.id === bookingId ? updated : b)),
      }));
      showSuccessToast(`Payment received via ${paymentMethod}`);
    } catch (err: any) {
      const message = err?.message ?? 'Failed to complete booking';
      const code = err?.code;
      showErrorToast(message, code);
    } finally {
      set((s) => {
        const next = { ...s.completing };
        delete next[bookingId];
        return { completing: next };
      });
    }
  },

  addPendingRequest(booking) {
    set((s) => ({
      pendingRequests: [...s.pendingRequests, booking],
    }));
  },

  removePendingRequest(bookingId) {
    set((s) => ({
      pendingRequests: s.pendingRequests.filter((b) => b.id !== bookingId),
    }));
  },

  reset() {
    set({ 
      items: [], 
      loading: false, 
      pendingRequests: [],
      confirming: {}, 
      cancelling: {},
      completing: {},
    });
  },
}));
