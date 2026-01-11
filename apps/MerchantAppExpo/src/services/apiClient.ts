/**
 * API Client
 * 
 * Centralized HTTP client with JWT token injection.
 * All API requests should go through this client.
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../config';
import { useAuthStore } from '../store/authStore';

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
  status?: number;
}

export interface ApiResponseShape<T> {
  data: T;
  meta?: Record<string, unknown>;
}

const BASE_URL = API_CONFIG.BASE_URL;
const DEFAULT_TIMEOUT_MS = API_CONFIG.TIMEOUT_MS;

/**
 * Centralized API Client with:
 * - JWT token injection from auth store
 * - Standardized error normalization
 * - Dev logging
 * - Typed helper methods
 */
class APIClient {
  private static _instance: APIClient | null = null;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  static get instance(): APIClient {
    if (!APIClient._instance) {
      APIClient._instance = new APIClient();
    }
    return APIClient._instance;
  }

  private setupInterceptors() {
    // Request interceptor: inject JWT token
    this.client.interceptors.request.use(async (config) => {
      // Get token from auth store
      const token = useAuthStore.getState().token;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (__DEV__) {
          console.log('[API][AUTH] ✅ Token injected');
        }
      } else {
        if (__DEV__) {
          console.log('[API][AUTH] ⚠️ No token available');
        }
      }

      // Add request id for tracing
      config.headers['x-request-id'] = this.generateRequestId();
      
      // Dev logging
      if (__DEV__) {
        console.log('[API][REQUEST]', config.method?.toUpperCase(), config.url, {
          params: config.params,
          data: config.data,
          hasToken: !!token,
        });
      }
      
      return config;
    });

    // Response interceptor: normalize errors, handle 401
    this.client.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log('[API][RESPONSE]', response.config.url, response.status, response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        const normalized = this.normalizeError(error);

        // Handle 401 - token expired or invalid
        if (normalized.status === 401) {
          console.log('[API][AUTH] 🔒 Unauthorized - clearing auth');
          // Clear auth state - user needs to login again
          useAuthStore.getState().clearAuth();
        }

        if (__DEV__) {
          console.warn('[API][ERROR]', normalized);
        }
        
        return Promise.reject(normalized);
      }
    );
  }

  private normalizeError(error: AxiosError): ApiErrorShape {
    const status = error.response?.status;
    const data: any = error.response?.data;
    
    // Handle backend error format: { success: false, error: { code, message } }
    const code = data?.error?.code || data?.code || error.code || 'UNKNOWN';
    const message = data?.error?.message || data?.message || error.message || 'Unexpected error';

    return {
      code,
      message,
      details: data,
      status,
    };
  }

  private generateRequestId(): string {
    return Math.random().toString(36).slice(2);
  }

  // HTTP methods
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponseShape<T>> {
    const res: AxiosResponse<T> = await this.client.get(endpoint, config);
    return { data: res.data };
  }

  async post<T, B = unknown>(endpoint: string, body?: B, config?: AxiosRequestConfig): Promise<ApiResponseShape<T>> {
    const res: AxiosResponse<T> = await this.client.post(endpoint, body, config);
    return { data: res.data };
  }

  async put<T, B = unknown>(endpoint: string, body?: B, config?: AxiosRequestConfig): Promise<ApiResponseShape<T>> {
    const res: AxiosResponse<T> = await this.client.put(endpoint, body, config);
    return { data: res.data };
  }

  async patch<T, B = unknown>(endpoint: string, body?: B, config?: AxiosRequestConfig): Promise<ApiResponseShape<T>> {
    const res: AxiosResponse<T> = await this.client.patch(endpoint, body, config);
    return { data: res.data };
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponseShape<T>> {
    const res: AxiosResponse<T> = await this.client.delete(endpoint, config);
    return { data: res.data };
  }
}

export const apiClient = APIClient.instance;
export default apiClient;
