/**
 * Auth Context
 * 
 * Provides authentication state to the app.
 * Uses authStore for JWT token management.
 * Checks business existence to determine onboarding status.
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useBusinessStore } from '../store/businessStore';
import { authService } from '../services/authService';

interface AuthContextType {
  // Auth state
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoadingAuth: boolean;
  
  // Actions
  completeOnboarding: () => void;
  logout: () => void;
  hasBusiness: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const ONBOARDING_KEY = '@salex_onboarded';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // Get auth state from Zustand store
  const { isAuthenticated, isHydrated, clearAuth } = useAuthStore();
  const { setupAppStateListener } = useBusinessStore();

  // Set up app state listener for business data refresh
  useEffect(() => {
    const cleanup = setupAppStateListener();
    return cleanup; // Cleanup on unmount
  }, [setupAppStateListener]);

  // Wait for auth store to hydrate, then check business
  useEffect(() => {
    const initializeAuth = async () => {
      // Wait for auth store to rehydrate from AsyncStorage
      if (!isHydrated) {
        console.log('⏳ Waiting for auth store to hydrate...');
        return;
      }

      console.log('🔐 Auth store hydrated, isAuthenticated:', isAuthenticated);

      if (isAuthenticated) {
        // User has token, check if they have a business
        console.log('🔍 Checking if business exists...');
        const hasExistingBusiness = await checkBusinessExists();
        setIsOnboarded(hasExistingBusiness);
      } else {
        // No token, user needs to login
        setIsOnboarded(false);
      }

      setIsLoadingAuth(false);
    };

    initializeAuth();
  }, [isHydrated, isAuthenticated]);

  // Check if business exists via API
  const checkBusinessExists = async (): Promise<boolean> => {
    try {
      const businessService = require('../services/businessService');
      // getBusinessMe returns the business object directly (or throws on error)
      const business = await businessService.getBusinessMe();
      
      if (business && business.id) {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        console.log('✅ Business exists - user is onboarded:', business.id);
        return true;
      }
      return false;
    } catch (error: any) {
      // 401 means not authenticated, 404 means no business
      if (error.status === 401) {
        console.log('🔒 Not authenticated');
        clearAuth();
      } else {
        console.log('🚀 No business exists - user needs onboarding');
      }
      return false;
    }
  };

  // Public method to check business existence
  const hasBusiness = async (): Promise<boolean> => {
    return await checkBusinessExists();
  };

  // Mark onboarding as complete
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setIsOnboarded(true);
      console.log('🎉 Onboarding completed!');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      setIsOnboarded(true);
    }
  };

  // Logout - clear all auth state and reset all stores
  const logout = async () => {
    try {
      // Clear auth store (JWT token)
      authService.logout();
      
      // Clear local storage
      await AsyncStorage.multiRemove([ONBOARDING_KEY, 'business_id']);
      
      // Reset all Zustand stores to clear stale data
      // Import stores dynamically to avoid circular dependencies
      const { useBusinessStore } = require('../store/businessStore');
      const { useBookingStore } = require('../store/bookingStore');
      const { useServiceStore } = require('../store/serviceStore');
      const { useResourceStore } = require('../store/resourceStore');
      const { useStaffStore } = require('../store/staffStore');
      const { useOnboardingStore } = require('../store/onboardingStore');
      
      // Reset all stores
      useBusinessStore.getState().reset();
      useBookingStore.getState().reset();
      useServiceStore.getState().reset();
      useResourceStore.getState().reset();
      useStaffStore.getState().reset();
      useOnboardingStore.getState().reset();
      
      setIsOnboarded(false);
      console.log('👋 User logged out - all stores reset');
    } catch (error) {
      console.error('Failed to logout:', error);
      setIsOnboarded(false);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isOnboarded,
    isLoadingAuth: isLoadingAuth || !isHydrated,
    completeOnboarding,
    logout,
    hasBusiness,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
