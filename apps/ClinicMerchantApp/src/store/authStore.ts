/**
 * Auth Store
 * 
 * Manages authentication state including JWT token and user info.
 * Persists to AsyncStorage so users stay logged in.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  phone: string;
  role: string;
  mustChangePassword?: boolean;
}

interface AuthState {
  // State
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  
  // Actions
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      
      // Set auth after successful login
      setAuth: (token: string, user: AuthUser) => {
        console.log('🔐 Auth store: Setting auth for user', user.id);
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },
      
      // Clear auth on logout
      clearAuth: () => {
        console.log('🔐 Auth store: Clearing auth');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
      
      // Track hydration state
      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: 'salex-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist token and user, not hydration state
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Called when storage is rehydrated
        if (state) {
          state.setHydrated(true);
          if (state.token) {
            console.log('🔐 Auth store: Rehydrated with existing token');
          }
        }
      },
    }
  )
);

// Selector hooks for convenience
export const useToken = () => useAuthStore((state) => state.token);
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
