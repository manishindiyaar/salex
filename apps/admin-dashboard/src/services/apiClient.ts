import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = '/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Don't redirect for /me endpoint - it's expected to fail when not logged in
          const isAuthCheck = error.config?.url?.includes('/auth/me');
          if (!isAuthCheck) {
            this.clearToken();
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('adminToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('adminToken');
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/admin/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    await this.client.post('/admin/auth/logout');
    this.clearToken();
  }

  async getMe() {
    const response = await this.client.get('/admin/auth/me');
    return response.data;
  }

  // Business endpoints
  async listBusinesses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }) {
    const response = await this.client.get('/admin/businesses', { params });
    return response.data;
  }

  async getBusinessDetails(id: string) {
    const response = await this.client.get(`/admin/businesses/${id}`);
    return response.data;
  }

  async toggleBusinessStatus(id: string) {
    const response = await this.client.post(`/admin/businesses/${id}/toggle`);
    return response.data;
  }

  async changeSubscriptionPlan(id: string, plan: string, reason: string) {
    console.log('=== DEBUG: Frontend API Call ===');
    console.log('ID:', id);
    console.log('Plan:', plan);
    console.log('Reason:', reason);
    console.log('Payload:', { plan, reason });
    console.log('================================');
    
    const response = await this.client.patch(`/admin/businesses/${id}/plan`, { plan, reason });
    return response.data;
  }

  async getBusinessPayments(id: string, params?: { page?: number; limit?: number }) {
    const response = await this.client.get(`/admin/businesses/${id}/payments`, { params });
    return response.data;
  }

  async getBusinessModules(id: string) {
    const response = await this.client.get(`/admin/businesses/${id}/modules`);
    return response.data;
  }

  async updateBusinessModules(id: string, modules: Record<string, boolean>) {
    const response = await this.client.patch(`/admin/businesses/${id}/modules`, { modules });
    return response.data;
  }

  // Payment endpoints
  async recordPayment(
    businessId: string,
    amount: number,
    paymentMethod: string,
    transactionRef?: string,
    periodStart?: string,
    periodEnd?: string,
    notes?: string
  ) {
    const response = await this.client.post('/admin/payments', {
      businessId,
      amount,
      paymentMethod,
      transactionRef,
      periodStart,
      periodEnd,
      notes,
    });
    return response.data;
  }

  async listPayments(params?: {
    page?: number;
    limit?: number;
    businessId?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.client.get('/admin/payments', { params });
    return response.data;
  }

  async getPaymentAnalytics(params?: { startDate?: string; endDate?: string }) {
    const response = await this.client.get('/admin/payments/analytics', { params });
    return response.data;
  }

  // Template endpoints
  async listTemplates(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/admin/templates', { params });
    return response.data;
  }

  async getTemplate(id: string) {
    const response = await this.client.get(`/admin/templates/${id}`);
    return response.data;
  }

  async createTemplate(data: any) {
    const response = await this.client.post('/admin/templates', data);
    return response.data;
  }

  async updateTemplate(id: string, data: any) {
    const response = await this.client.patch(`/admin/templates/${id}`, data);
    return response.data;
  }

  async deleteTemplate(id: string) {
    const response = await this.client.delete(`/admin/templates/${id}`);
    return response.data;
  }

  // Health endpoints
  async getSystemHealth() {
    const response = await this.client.get('/admin/health');
    return response.data;
  }

  async getPlatformStats() {
    const response = await this.client.get('/admin/health/stats');
    return response.data;
  }

  // Audit log endpoints
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    adminId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.client.get('/admin/audit-logs', { params });
    return response.data;
  }

  // Export endpoints
  async exportBusinesses(params?: any) {
    const response = await this.client.get('/admin/export/businesses', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  async exportPayments(params?: any) {
    const response = await this.client.get('/admin/export/payments', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
