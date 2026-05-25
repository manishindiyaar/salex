/**
 * Staff Store
 * 
 * Zustand store for staff management state.
 */

import { create } from 'zustand';
import { Staff, CreateStaffInput, UpdateStaffInput, LinkResourceInput, StaffWithStats } from '../types';
import {
  listStaff,
  createStaff,
  updateStaff,
  deactivateStaff,
  reactivateStaff,
  linkStaffToResource,
  unlinkStaffFromResource,
} from '../services/staffService';
import { showErrorToast, showSuccessToast } from './toastStore';

// Re-export types for convenience
export type { StaffWithStats };

interface StaffState {
  items: StaffWithStats[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  currentBusinessId?: string;

  listByBusiness: (businessId: string, includeInactive?: boolean) => Promise<void>;
  createOne: (businessId: string, dto: CreateStaffInput) => Promise<Staff | null>;
  updateOne: (id: string, dto: UpdateStaffInput) => Promise<Staff | null>;
  deactivate: (id: string) => Promise<boolean>;
  reactivate: (id: string) => Promise<boolean>;
  linkToResource: (staffId: string, dto: LinkResourceInput) => Promise<boolean>;
  unlinkFromResource: (staffId: string, resourceId: string) => Promise<boolean>;
  reset: () => void;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  items: [],
  loading: false,
  creating: false,
  updating: false,
  currentBusinessId: undefined,

  async listByBusiness(businessId, includeInactive = false) {
    try {
      set({ loading: true });
      const staff = await listStaff(businessId, { includeInactive });
      set({
        items: staff,
        currentBusinessId: businessId,
      });
    } catch (err: any) {
      const message = err?.message ?? 'Failed to load staff';
      showErrorToast(message);
      set({ items: [] });
    } finally {
      set({ loading: false });
    }
  },

  async createOne(businessId, dto) {
    try {
      set({ creating: true });
      const created = await createStaff(businessId, dto);
      set((s) => ({ items: [...s.items, created as StaffWithStats] }));
      showSuccessToast('Staff member added');
      return created;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to add staff member';
      showErrorToast(message);
      return null;
    } finally {
      set({ creating: false });
    }
  },

  async updateOne(id, dto) {
    try {
      set({ updating: true });
      const { currentBusinessId } = get();
      if (!currentBusinessId) {
        throw new Error('Business ID not available');
      }
      const updated = await updateStaff(currentBusinessId, id, dto);
      set((s) => ({
        items: s.items.map((it) => (it.id === id ? { ...it, ...updated } : it)),
      }));
      showSuccessToast('Staff member updated');
      return updated;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to update staff member';
      showErrorToast(message);
      return null;
    } finally {
      set({ updating: false });
    }
  },

  async deactivate(id) {
    try {
      set({ updating: true });
      const { currentBusinessId } = get();
      if (!currentBusinessId) {
        throw new Error('Business ID not available');
      }
      const updated = await deactivateStaff(currentBusinessId, id);
      set((s) => ({
        items: s.items.map((it) => (it.id === id ? { ...it, ...updated } : it)),
      }));
      showSuccessToast('Staff member deactivated');
      return true;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to deactivate staff member';
      showErrorToast(message);
      return false;
    } finally {
      set({ updating: false });
    }
  },

  async reactivate(id) {
    try {
      set({ updating: true });
      const { currentBusinessId } = get();
      if (!currentBusinessId) {
        throw new Error('Business ID not available');
      }
      const updated = await reactivateStaff(currentBusinessId, id);
      set((s) => ({
        items: s.items.map((it) => (it.id === id ? { ...it, ...updated } : it)),
      }));
      showSuccessToast('Staff member reactivated');
      return true;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to reactivate staff member';
      showErrorToast(message);
      return false;
    } finally {
      set({ updating: false });
    }
  },

  async linkToResource(staffId, dto) {
    try {
      set({ updating: true });
      const { currentBusinessId } = get();
      if (!currentBusinessId) {
        throw new Error('Business ID not available');
      }
      const updated = await linkStaffToResource(currentBusinessId, staffId, dto);
      set((s) => ({
        items: s.items.map((it) => (it.id === staffId ? updated : it)),
      }));
      showSuccessToast('Resource linked');
      return true;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to link resource';
      showErrorToast(message);
      return false;
    } finally {
      set({ updating: false });
    }
  },

  async unlinkFromResource(staffId, resourceId) {
    try {
      set({ updating: true });
      const { currentBusinessId } = get();
      if (!currentBusinessId) {
        throw new Error('Business ID not available');
      }
      const updated = await unlinkStaffFromResource(currentBusinessId, staffId, resourceId);
      set((s) => ({
        items: s.items.map((it) => (it.id === staffId ? updated : it)),
      }));
      showSuccessToast('Resource unlinked');
      return true;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to unlink resource';
      showErrorToast(message);
      return false;
    } finally {
      set({ updating: false });
    }
  },

  reset() {
    set({
      items: [],
      loading: false,
      creating: false,
      updating: false,
      currentBusinessId: undefined,
    });
  },
}));
