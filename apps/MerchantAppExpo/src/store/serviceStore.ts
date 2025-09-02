import { create } from 'zustand';
import { Paginated, Service, CreateServiceRequest } from '../../../../packages/shared-types/src';
import { 
  listBusinessServices, 
  createBusinessService, 
  updateService, 
  updateBusinessService,
  deleteService,
  deleteBusinessService,
  getBusinessService
} from '../services/serviceService';
import { showErrorToast, showSuccessToast } from './toastStore';

interface ServiceState {
  items: Service[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  currentBusinessId?: string; // Track current business ID for updates

  listByBusiness: (businessId: string, params?: { page?: number; pageSize?: number; search?: string }) => Promise<void>;
  createForBusiness: (businessId: string, dto: Omit<CreateServiceRequest, 'businessId'>) => Promise<Service | null>;
  updateOne: (id: string, dto: Partial<Service>) => Promise<Service | null>;
  deleteOne: (id: string) => Promise<boolean>;
  reset: () => void;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  currentBusinessId: undefined,

  async listByBusiness(businessId, params = {}) {
    try {
      set({ loading: true });
      const res = await listBusinessServices(businessId, params);
      
      // Handle the actual API response structure
      const services = res.services || res.items || [];
      const total = services.length;
      
      set({
        items: services,
        total: total,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        currentBusinessId: businessId, // Store the business ID for updates
      });
      
      console.log('✅ Services loaded:', services.length, 'services');
    } catch (err: any) {
      console.error('❌ Failed to load services:', err);
      const message = err?.message ?? 'Failed to load services';
      const code = err?.code;
      showErrorToast(message, code);
      
      // Set empty state on error
      set({ items: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },

  async createForBusiness(businessId, dto) {
    try {
      set({ creating: true });
      const created = await createBusinessService(businessId, dto);
      
      // Extract the actual service data from the response (avoid API response wrapper)
      const actualCreated = (created as any)?.data || created;
      
      set((s) => ({ items: [actualCreated, ...s.items] }));
      showSuccessToast('Service created');
      return actualCreated;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to create service';
      const code = err?.code;
      showErrorToast(message, code);
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
        throw new Error('Business ID not available for service update');
      }
      
      // Use the business-scoped update endpoint
      const updated = await updateBusinessService(currentBusinessId, id, dto);
      
      // Extract the actual service data from the response (avoid API response wrapper)
      const actualUpdated = (updated as any)?.data || updated;
      
      set((s) => ({
        items: s.items.map((it) => (it.id === id ? { ...it, ...actualUpdated } : it)),
      }));
      showSuccessToast('Service updated');
      return updated;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to update service';
      const code = err?.code;
      showErrorToast(message, code);
      return null;
    } finally {
      set({ updating: false });
    }
  },

  async deleteOne(id) {
    try {
      set({ deleting: true });
      const { currentBusinessId } = get();
      
      if (!currentBusinessId) {
        throw new Error('Business ID not available for service deletion');
      }
      
      // Use the business-scoped delete endpoint
      const res = await deleteBusinessService(currentBusinessId, id);
      const success = !!res?.success || true; // many APIs return 200/204
      set((s) => ({ items: s.items.filter((it) => it.id !== id) }));
      showSuccessToast('Service deleted');
      return success;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to delete service';
      const code = err?.code;
      showErrorToast(message, code);
      return false;
    } finally {
      set({ deleting: false });
    }
  },

  reset() {
    set({ 
      items: [], 
      total: 0, 
      page: 1, 
      pageSize: 20, 
      loading: false, 
      creating: false, 
      updating: false, 
      deleting: false, 
      currentBusinessId: undefined 
    });
  },
}));
