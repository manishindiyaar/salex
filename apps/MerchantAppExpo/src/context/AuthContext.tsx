import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_CONFIG } from '../config';

interface AuthContextType {
  isOnboarded: boolean;
  isLoadingAuth: boolean;
  completeOnboarding: () => void;
  logout: () => void;
  authEnabled: boolean;
  mockUser: typeof AUTH_CONFIG.MOCK_USER | null;
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

  // Load persisted onboarding state on app start
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        // Check if business exists instead of just local storage
        console.log('🔍 Checking if business exists...');
        const businessExists = await checkBusinessExists();
        
        if (businessExists) {
          setIsOnboarded(true);
          console.log('✅ Business exists - user is onboarded');
        } else {
          setIsOnboarded(false);
          console.log('🚀 No business exists - user needs onboarding');
        }
      } catch (error) {
        console.error('Failed to load onboarding state:', error);
        setIsOnboarded(false); // Default to onboarding on error
      } finally {
        setIsLoadingAuth(false);
      }
    };

    loadOnboardingState();
  }, []);

  // Check if business exists and update onboarding state accordingly
  const checkBusinessExists = async () => {
    try {
      const businessService = require('../services/businessService');
      const response = await businessService.getBusinessMe();
      if (response.data) {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        setIsOnboarded(true);
        console.log('✅ Business exists - marking as onboarded');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking business existence:', error);
      return false;
    }
  };

  // Public method to check business existence from anywhere
  const hasBusiness = async () => {
    return await checkBusinessExists();
  };

  const completeOnboarding = async () => {
    try {
      // Save onboarding completion flag
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setIsOnboarded(true);
      
      console.log('🎉 Onboarding completed! User can now access main app');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      // Still set state even if persistence fails
      setIsOnboarded(true);
    }
  };

  const logout = async () => {
    try {
      // Always allow logout (even when auth disabled for testing)
      await AsyncStorage.multiRemove(['@salex_onboarded', 'business_id']);
      setIsOnboarded(false);
      console.log('👋 User logged out and all data cleared');
    } catch (error) {
      console.error('Failed to clear onboarding state:', error);
      // Still set state even if persistence fails
      setIsOnboarded(false);
    }
  };

  const value = {
    isOnboarded,
    isLoadingAuth,
    completeOnboarding,
    logout,
    authEnabled: AUTH_CONFIG.ENABLE_AUTH,
    mockUser: AUTH_CONFIG.ENABLE_AUTH ? null : AUTH_CONFIG.MOCK_USER,
    hasBusiness,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};