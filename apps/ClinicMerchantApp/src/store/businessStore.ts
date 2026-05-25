import { create } from 'zustand';
import { AppState, AppStateStatus } from 'react-native';
import { Business, UpdateBusinessInput } from '../types';
import * as BusinessService from '../services/businessService';
import { showErrorToast, showSuccessToast } from './toastStore';

// Re-export type for backward compatibility
export type UpdateBusinessRequest = UpdateBusinessInput;

interface BusinessState {
  business: Business | null;
  loading: boolean;
  updating: boolean;
  updatingHours: boolean;
  fetchMe: () => Promise<void>;
  update: (businessId: string, dto: UpdateBusinessInput) => Promise<void>;
  updateHours: (businessId: string, hoursOfOperation: Record<string, { open: string; close: string; closed: boolean }>) => Promise<void>;
  reset: () => void;
  setupAppStateListener: () => () => void; // Returns cleanup function
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  business: null,
  loading: false,
  updating: false,
  updatingHours: false,

  async fetchMe() {
    try {
      set({ loading: true });
      const data = await BusinessService.getBusinessMe();
      set({ business: data });
    } catch (err: any) {
      const message = err?.message ?? 'Failed to load business';
      const code = err?.code;
      showErrorToast(message, code);
    } finally {
      set({ loading: false });
    }
  },

  async update(businessId, dto) {
    try {
      set({ updating: true });
      const updated = await BusinessService.updateBusiness(businessId, dto);
      set({ business: updated });
      showSuccessToast('Business updated');
    } catch (err: any) {
      const message = err?.message ?? 'Failed to update business';
      const code = err?.code;
      showErrorToast(message, code);
    } finally {
      set({ updating: false });
    }
  },

  async updateHours(businessId, hoursOfOperation) {
    try {
      set({ updatingHours: true });
      const updated = await BusinessService.updateBusinessHours(businessId, hoursOfOperation);
      set({ business: updated });
      showSuccessToast('Business hours updated');
    } catch (err: any) {
      const message = err?.message ?? 'Failed to update business hours';
      const code = err?.code;
      showErrorToast(message, code);
    } finally {
      set({ updatingHours: false });
    }
  },

  reset() {
    set({ business: null, loading: false, updating: false, updatingHours: false });
  },

  setupAppStateListener() {
    let lastAppState = AppState.currentState;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Refresh business data when app comes to foreground
      if (lastAppState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App came to foreground, refreshing business data');
        const { business } = get();
        if (business) {
          // Only refresh if we have business data (user is logged in)
          get().fetchMe();
        }
      }
      lastAppState = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Return cleanup function
    return () => {
      subscription?.remove();
    };
  },
}));
