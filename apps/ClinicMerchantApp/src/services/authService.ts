/**
 * Auth Service
 * 
 * Handles OTP authentication with the Express.js backend.
 * In development mode, use magic OTP "123456".
 * 
 * Backend endpoints:
 * - POST /api/v1/auth/otp/request - Request OTP
 * - POST /api/v1/auth/otp/verify - Verify OTP and get JWT token
 */

import axios from 'axios';
import { API_CONFIG, AUTH_CONFIG } from '../config';
import { useAuthStore, AuthUser } from '../store/authStore';

// Response types matching backend
interface OtpRequestResponse {
  success: boolean;
  data: {
    message: string;
  };
}

interface OtpVerifyResponse {
  success: boolean;
  data: {
    token: string;
    user: AuthUser;
  };
}

interface AuthErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Create a separate axios instance for auth (no token injection needed)
const authClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  /**
   * Request OTP for phone number
   * In dev mode, backend uses magic OTP "123456"
   */
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    console.log('📱 Requesting OTP for:', phone);
    
    try {
      const response = await authClient.post<OtpRequestResponse>('/auth/otp/request', {
        phone,
      });
      
      console.log('✅ OTP request successful:', response.data.data.message);
      return {
        success: true,
        message: response.data.data.message,
      };
    } catch (error: any) {
      console.error('❌ OTP request failed:', error.response?.data || error.message);
      
      const errorData = error.response?.data as AuthErrorResponse;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to send OTP. Please try again.',
      };
    }
  },

  /**
   * Verify OTP and get JWT token
   * In dev mode, use "123456" as the OTP
   */
  async verifyOtp(phone: string, otp: string): Promise<{ 
    success: boolean; 
    message: string;
    token?: string;
    user?: AuthUser;
  }> {
    console.log('🔐 Verifying OTP for:', phone);
    
    try {
      const response = await authClient.post<OtpVerifyResponse>('/auth/otp/verify', {
        phone,
        otp,
      });
      
      const { token, user } = response.data.data;
      
      console.log('✅ OTP verified successfully for user:', user.id);
      
      // Store auth in Zustand store (persists to AsyncStorage)
      useAuthStore.getState().setAuth(token, user);
      
      return {
        success: true,
        message: 'Phone verified successfully',
        token,
        user,
      };
    } catch (error: any) {
      console.error('❌ OTP verification failed:', error.response?.data || error.message);
      
      const errorData = error.response?.data as AuthErrorResponse;
      return {
        success: false,
        message: errorData?.error?.message || 'Invalid OTP. Please try again.',
      };
    }
  },

  /**
   * Get current authenticated user from backend
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const token = useAuthStore.getState().token;
    
    if (!token) {
      console.log('⚠️ No token available');
      return null;
    }
    
    try {
      const response = await authClient.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data.data.user;
    } catch (error: any) {
      console.error('❌ Failed to get current user:', error.response?.data || error.message);
      return null;
    }
  },

  /**
   * Logout - clear stored auth
   */
  logout(): void {
    console.log('👋 Logging out...');
    useAuthStore.getState().clearAuth();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  },

  /**
   * Get stored token
   */
  getToken(): string | null {
    return useAuthStore.getState().token;
  },

  /**
   * Get dev magic OTP (for UI hint in dev mode)
   */
  getDevMagicOtp(): string {
    return AUTH_CONFIG.DEV_MAGIC_OTP;
  },
};

export default authService;
