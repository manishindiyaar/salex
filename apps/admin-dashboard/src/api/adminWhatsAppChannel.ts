/**
 * Admin WhatsApp Channel API Client
 *
 * Handles all API calls for the dedicated WhatsApp channel configuration.
 */

import axios, { AxiosInstance } from 'axios';

export interface WhatsAppChannelData {
  id: string;
  businessId: string | null;
  mode: string;
  displayPhoneNumber: string;
  phoneNumberId: string;
  wabaId: string | null;
  status: string;
  accessTokenMasked: string | null;
  appSecretMasked: string | null;
  lastTestedAt: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetChannelResponse {
  success: boolean;
  data: {
    mode: 'SHARED' | 'DEDICATED';
    channel: WhatsAppChannelData | null;
  };
}

export interface UpsertChannelPayload {
  phoneNumberId: string;
  displayPhoneNumber: string;
  wabaId: string;
  accessToken: string;
  appSecret: string;
}

export interface TestConnectionResult {
  success: boolean;
  displayPhoneNumber?: string;
  verifiedName?: string;
  error?: string;
}

class AdminWhatsAppChannelApi {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1/admin/businesses',
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
          localStorage.removeItem('adminToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /** GET /admin/businesses/:businessId/whatsapp-channel */
  async getChannel(businessId: string): Promise<GetChannelResponse> {
    const response = await this.client.get<GetChannelResponse>(
      `/${businessId}/whatsapp-channel`
    );
    return response.data;
  }

  /** PUT /admin/businesses/:businessId/whatsapp-channel */
  async upsertChannel(businessId: string, payload: UpsertChannelPayload): Promise<WhatsAppChannelData> {
    const response = await this.client.put<{ success: boolean; data: { channel: WhatsAppChannelData } }>(
      `/${businessId}/whatsapp-channel`,
      payload
    );
    return response.data.data.channel;
  }

  /** POST /admin/businesses/:businessId/whatsapp-channel/test */
  async testConnection(businessId: string): Promise<TestConnectionResult> {
    const response = await this.client.post<{ success: boolean; data: TestConnectionResult }>(
      `/${businessId}/whatsapp-channel/test`
    );
    return response.data.data;
  }

  /** POST /admin/businesses/:businessId/whatsapp-channel/connect */
  async connect(businessId: string): Promise<void> {
    await this.client.post(`/${businessId}/whatsapp-channel/connect`);
  }

  /** POST /admin/businesses/:businessId/whatsapp-channel/disconnect */
  async disconnect(businessId: string): Promise<void> {
    await this.client.post(`/${businessId}/whatsapp-channel/disconnect`);
  }
}

export const adminWhatsAppChannelApi = new AdminWhatsAppChannelApi();
