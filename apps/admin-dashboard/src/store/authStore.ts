import { create } from 'zustand';
import { apiClient } from '@/services/apiClient';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
}

interface AuthStore {
  user: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.login(email, password);
      // API returns { success, data: { token, admin } }
      apiClient.setToken(response.data.token);
      set({
        user: response.data.admin,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiClient.logout();
    } catch (error) {
      // Proceed with local cleanup even if API fails
    } finally {
      apiClient.clearToken();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  fetchMe: async () => {
    // Don't set isLoading here - it causes flickering
    // The App component handles the initial loading state
    try {
      const response = await apiClient.getMe();
      // API returns { success, data: { admin } }
      set({
        user: response.data.admin,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
