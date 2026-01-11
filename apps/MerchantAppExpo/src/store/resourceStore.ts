/**
 * Resource Store
 * 
 * Zustand store for resource management state.
 */

import { create } from 'zustand';
import { Resource, BulkCreateResourceInput, CreateResourceInput, UpdateResourceInput, ResourceWithStats } from '../types';
import {
  listResources,
  createResource,
  bulkCreateResources,
  updateResource,
  deactivateResource,
  reactivateResource,
} from '../services/resourceService';
import { showErrorToast, showSuccessToast } from './toastStore';

// Re-export types for convenience
export type { ResourceWithStats };

interface ResourceState {
  items: ResourceWithStats[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  currentBusinessId?: string;

  listByBusiness: (businessId: string, includeInactive?: boolean) => Promise<void>;
  createOne: (businessId: string, dto: CreateResourceInput) => Promise<Resource | null>;
  bulkCreate: (businessId: string, dto: BulkCreateResourceInput) => Promise<Resource[] | null>;
  updateOne: (id: string, dto: UpdateResourceInput) => Promise<Resource | null>;
  deactivate: (id: string) => Promise<boolean>;
  reactivate: (id: string) => Promise<boolean>;
  reset: () => void;
}

export const useResourceStore = create<ResourceState>((set, get) => ({
  items: [],
  loading: false,
  creating: false,
  updating: false,
  currentBusinessId: undefined,

  async listByBusiness(businessId, includeInactive = false) {
    try {
      set({ loading: true });
      const resources = await listResources(businessId, { includeInactive });
      set({
        items: resources,
        currentBusinessId: businessId,
      });
    } catch (err: any) {
      const message = err?.message ?? 'Failed to load resources';
      showErrorToast(message);
      set({ items: [] });
    } finally {
      set({ loading: false });
    }
  },

  async createOne(businessId, dto) {
    try {
      set({ creating: true });
      const created = await createResource(businessId, dto);
      // Convert Resource to ResourceWithStats
      const resourceWithStats: ResourceWithStats = {
        ...created,
        utilizationPercent: 0,
        activeBookingsCount: 0,
      };
      set((s) => ({ items: [...s.items, resourceWithStats] }));
      showSuccessToast('Resource created');
      return created;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to create resource';
      showErrorToast(message);
      return null;
    } finally {
      set({ creating: false });
    }
  },

  async bulkCreate(businessId, dto) {
    try {
      set({ creating: true });
      const created = await bulkCreateResources(businessId, dto);
      // Convert Resource[] to ResourceWithStats[]
      const resourcesWithStats: ResourceWithStats[] = created.map(resource => ({
        ...resource,
        utilizationPercent: 0,
        activeBookingsCount: 0,
      }));
      set((s) => ({ items: [...s.items, ...resourcesWithStats] }));
      showSuccessToast(`${created.length} resources created`);
      return created;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to create resources';
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
      const updated = await updateResource(currentBusinessId, id, dto);
      set((s) => ({
        items: s.items.map((it) => (it.id === id ? { ...it, ...updated } : it)),
      }));
      showSuccessToast('Resource updated');
      return updated;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to update resource';
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
      const updated = await deactivateResource(currentBusinessId, id);
      set((s) => ({
        items: s.items.map((it) => (it.id === id ? { ...it, ...updated } : it)),
      }));
      showSuccessToast('Resource deactivated');
      return true;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to deactivate resource';
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
      const updated = await reactivateResource(currentBusinessId, id);
      set((s) => ({
        items: s.items.map((it) => (it.id === id ? { ...it, ...updated } : it)),
      }));
      showSuccessToast('Resource reactivated');
      return true;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to reactivate resource';
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
