import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, AUTH_CONFIG } from '../config';

// Source of truth for domain types must come from packages/shared-types
// Example imports (uncomment/adjust as real types are added/needed):
// import { ApiResponse, ApiError } from '../../../../packages/shared-types/src';

type Nullable<T> = T | null;

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
  status?: number;
}

// Generic API response wrapper. Prefer replacing with ApiResponse<T> from packages/shared-types when available.
export interface ApiResponseShape<T> {
  data: T;
  meta?: Record<string, unknown>;
}

const BASE_URL = API_CONFIG.BASE_URL;
const DEFAULT_TIMEOUT_MS = API_CONFIG.TIMEOUT_MS;

/**
 * Centralized API Client with:
 * - Firebase JWT injection
 * - Standardized error normalization
 * - Dev logging
 * - Typed helper methods
 *
 * Per architecture docs:
 *  - Use a single axios instance with auth + error interceptors
 *  - Never call axios directly from components; always via services
 *  - Normalize error handling (see docs/architecture/18-error-handling-strategy.md)
 */
class APIClient {
  private static _instance: Nullable<APIClient> = null;
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
    // Request: conditionally inject Firebase auth token
    this.client.interceptors.request.use(async (config) => {
      // Only include auth headers if authentication is enabled
      if (API_CONFIG.INCLUDE_AUTH_HEADERS) {
        // Firebase auth is disabled - this code path is not used in development
        console.log('[API][AUTH] ⚠️  Firebase auth integration disabled');
      } else {
        // Auth disabled - log for development
        if (__DEV__) {
          console.log('[API][AUTH] 🔧 Auth disabled - skipping token injection');
        }
      }

      // Add request id + basic dev logging
      (config.headers as Record<string, string>)['x-request-id'] = this.generateRequestId();
      if (__DEV__) {
         
        console.log('[API][REQUEST]', config.method?.toUpperCase(), config.url, {
          params: config.params,
          data: config.data,
          authEnabled: API_CONFIG.INCLUDE_AUTH_HEADERS,
        });
      }
      return config;
    });

    // Response: normalize errors, dev logging, 401 handling hook
    this.client.interceptors.response.use(
      (response) => {
        if (__DEV__) {
           
          console.log('[API][RESPONSE]', response.config.url, response.status, response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        const normalized = this.normalizeError(error);

        // Example 401 handling strategy: sign out or trigger re-auth flow via a global handler
        if (normalized.status === 401) {
          // Optionally implement a token refresh strategy here if needed
          // For now we surface the error to caller to drive UX (e.g., redirect to login)
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
    // Try to map backend standardized error shape if present
    const data: any = error.response?.data;
    const code = (data?.code as string) || (error.code ?? 'UNKNOWN');
    const message =
      (typeof data?.message === 'string' && data.message) ||
      (Array.isArray(data?.message) ? data.message.join(', ') : undefined) ||
      error.message ||
      'Unexpected error';

    return {
      code,
      message,
      details: data?.details ?? data,
      status,
    };
  }

  private generateRequestId(): string {
    // Lightweight request id; can be replaced with UUID if desired
    return Math.random().toString(36).slice(2);
  }

  // Helper methods returning typed responses. Replace ApiResponseShape<T> with shared ApiResponse<T> when available.
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

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponseShape<T>> {
    const res: AxiosResponse<T> = await this.client.delete(endpoint, config);
    return { data: res.data };
  }
}

export const apiClient = APIClient.instance;

// Usage example in a service module (do not place in components):
// import { apiClient } from './apiClient';
// import { SomeType } from '../../../../packages/shared-types/src';
// export async function getBusiness(id: string) {
//   const res = await apiClient.get<SomeType>(`/business/${id}`);
//   return res.data;
// }

export default apiClient;
