/**
 * Auth Service
 * 
 * Handles authentication with the Express.js backend.
 * Supports password login (admin-provisioned accounts) and OTP (when enabled).
 * 
 * Backend endpoints:
 * - POST /api/v1/auth/password/login  - Password login
 * - POST /api/v1/auth/password/change - Change password
 * - POST /api/v1/auth/otp/request     - Request OTP
 * - POST /api/v1/auth/otp/verify      - Verify OTP and get JWT token
 */

import axios from 'axios';
import { API_CONFIG } from '../config';
import { useAuthStore, AuthUser } from '../store/authStore';

// Response types matching backend
interface AuthSuccessResponse {
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
    details?: unknown;
  };
}

const authClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

export const authService = {
  /**
   * Login with phone and password (admin-provisioned accounts)
   */
  async loginWithPassword(phone: string, password: string): Promise<{
    success: boolean;
    message: string;
    token?: string;
    user?: AuthUser;
  }> {
    try {
      const response = await authClient.post<AuthSuccessResponse>('/auth/password/login', {
        phone,
        password,
      });

      const { token, user } = response.data.data;
      useAuthStore.getState().setAuth(token, user);

      return { success: true, message: 'Login successful', token, user };
    } catch (error: any) {
      const errorData = error.response?.data as AuthErrorResponse;
      if (__DEV__) {
        console.warn('[AUTH][PASSWORD_LOGIN_ERROR]', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          baseURL: API_CONFIG.BASE_URL,
        });
      }
      return {
        success: false,
        message: errorData?.error?.message || 'Login failed. Please check your credentials.',
      };
    }
  },

  /**
   * Change password (required after first login with temporary password)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const token = useAuthStore.getState().token;
    try {
      await authClient.post('/auth/password/change', {
        currentPassword,
        newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update store to clear mustChangePassword
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setAuth(token!, { ...user, mustChangePassword: false });
      }

      return { success: true, message: 'Password changed successfully' };
    } catch (error: any) {
      const errorData = error.response?.data as AuthErrorResponse;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to change password.',
      };
    }
  },

  /**
   * Request OTP for phone number
   */
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await authClient.post('/auth/otp/request', { phone });
      return { success: true, message: response.data.data.message };
    } catch (error: any) {
      const errorData = error.response?.data as AuthErrorResponse;
      return {
        success: false,
        message: errorData?.error?.message || 'Failed to send OTP. Please try again.',
      };
    }
  },

  /**
   * Verify OTP and get JWT token
   */
  async verifyOtp(phone: string, otp: string): Promise<{
    success: boolean;
    message: string;
    token?: string;
    user?: AuthUser;
  }> {
    try {
      const response = await authClient.post<AuthSuccessResponse>('/auth/otp/verify', {
        phone,
        otp,
      });

      const { token, user } = response.data.data;
      useAuthStore.getState().setAuth(token, user);

      return { success: true, message: 'Phone verified successfully', token, user };
    } catch (error: any) {
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
    if (!token) return null;

    try {
      const response = await authClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data.user;
    } catch {
      return null;
    }
  },

  /** Logout */
  logout(): void {
    useAuthStore.getState().clearAuth();
  },

  /** Check if user is authenticated */
  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  },

  /** Get stored token */
  getToken(): string | null {
    return useAuthStore.getState().token;
  },
};

export default authService;
