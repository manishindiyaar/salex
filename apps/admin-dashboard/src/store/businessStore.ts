import { create } from 'zustand';
import { apiClient } from '@/services/apiClient';

interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  isActive: boolean;
  subscription?: {
    status: string;
    plan: string;
  };
  analytics?: {
    totalBookings: number;
    totalRevenue: number;
    totalCustomers: number;
  };
}

interface BusinessStore {
  businesses: Business[];
  selectedBusiness: Business | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };

  fetchBusinesses: (params?: any) => Promise<void>;
  fetchBusinessDetails: (id: string) => Promise<void>;
  toggleBusinessStatus: (id: string) => Promise<void>;
  changeSubscriptionPlan: (id: string, plan: string, reason: string) => Promise<void>;
  setPagination: (page: number, limit: number) => void;
  clearError: () => void;
}

export const useBusinessStore = create<BusinessStore>((set) => ({
  businesses: [],
  selectedBusiness: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },

  fetchBusinesses: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.listBusinesses(params);
      // API returns { success, data: { businesses, pagination } }
      set({
        businesses: response.data.businesses,
        pagination: {
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.totalCount,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch businesses',
        isLoading: false,
      });
    }
  },

  fetchBusinessDetails: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getBusinessDetails(id);
      // API returns { success, data: { business, analytics } }
      set({
        selectedBusiness: response.data.business,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch business details',
        isLoading: false,
      });
    }
  },

  toggleBusinessStatus: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.toggleBusinessStatus(id);
      // API returns { success, data: { business, message } }
      set((state) => ({
        businesses: state.businesses.map((b) =>
          b.id === id ? { ...b, isActive: response.data.business.isActive } : b
        ),
        selectedBusiness:
          state.selectedBusiness?.id === id
            ? { ...state.selectedBusiness, isActive: response.data.business.isActive }
            : state.selectedBusiness,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to toggle business status',
        isLoading: false,
      });
    }
  },

  changeSubscriptionPlan: async (id: string, plan: string, reason: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.changeSubscriptionPlan(id, plan, reason);
      // API returns { success, data: { subscription, message } }
      set((state) => ({
        businesses: state.businesses.map((b) =>
          b.id === id ? { ...b, subscription: response.data.subscription } : b
        ),
        selectedBusiness:
          state.selectedBusiness?.id === id
            ? { ...state.selectedBusiness, subscription: response.data.subscription }
            : state.selectedBusiness,
        isLoading: false,
      }));
    } catch (error: any) {
      let errorMessage = 'Failed to change subscription plan';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error.message;
        
        // If there are validation details, include them
        if (error.response.data.error.details) {
          const details = error.response.data.error.details;
          const detailMessages = Object.entries(details)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ');
          errorMessage += ` (${detailMessages})`;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  setPagination: (page: number, limit: number) => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        page,
        limit,
      },
    }));
  },

  clearError: () => set({ error: null }),
}));
