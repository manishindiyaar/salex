import axios, { AxiosInstance } from 'axios';

/**
 * Flow API client for the /v1/flows endpoints.
 *
 * Uses the same base URL and auth token pattern as the main apiClient,
 * but exposes typed functions for each flow management endpoint.
 */

// Types matching the shared-types FlowRecord / FlowSummary / FlowDefinition
export interface EdgeCondition {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt';
  value: string | number | boolean;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  condition?: EdgeCondition;
}

export interface FlowNode {
  id: string;
  type: 'message' | 'question' | 'service_picker' | 'staff_picker' | 'time_picker' | 'confirmation' | 'booking';
  config: Record<string, unknown>;
}

export interface FlowDefinition {
  entryNodeId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowRecord {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
  entryNodeId: string;
  definition: FlowDefinition;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlowSummary {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  updatedAt: string;
}

export interface CreateFlowPayload {
  name: string;
  description?: string;
  definition: FlowDefinition;
}

export interface UpdateFlowPayload {
  name?: string;
  description?: string;
  definition: FlowDefinition;
}

interface FlowListResponse {
  success: boolean;
  data: { flows: FlowSummary[] };
}

interface FlowDetailResponse {
  success: boolean;
  data: { flow: FlowRecord };
}

interface VerifyTokenResponse {
  success: boolean;
  data: { verifyToken: string };
}

class FlowsApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1/flows',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Attach auth token from localStorage on each request
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 by redirecting to login
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (window.location.pathname !== '/login') {
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /** GET /v1/flows — list all flows for the authenticated owner's business */
  async listFlows(): Promise<FlowSummary[]> {
    const response = await this.client.get<FlowListResponse>('/');
    return response.data.data.flows;
  }

  /** GET /v1/flows/:id — get a single flow by id */
  async getFlow(id: string): Promise<FlowRecord> {
    const response = await this.client.get<FlowDetailResponse>(`/${id}`);
    return response.data.data.flow;
  }

  /** POST /v1/flows — create a new flow (version 1) */
  async createFlow(payload: CreateFlowPayload): Promise<FlowRecord> {
    const response = await this.client.post<FlowDetailResponse>('/', payload);
    return response.data.data.flow;
  }

  /** PUT /v1/flows/:id — update a flow (creates a new version) */
  async updateFlow(id: string, payload: UpdateFlowPayload): Promise<FlowRecord> {
    const response = await this.client.put<FlowDetailResponse>(`/${id}`, payload);
    return response.data.data.flow;
  }

  /** POST /v1/flows/:id/activate — activate a flow version */
  async activateFlow(id: string): Promise<FlowRecord> {
    const response = await this.client.post<FlowDetailResponse>(`/${id}/activate`);
    return response.data.data.flow;
  }

  /** POST /v1/flows/:id/deactivate — deactivate a flow version */
  async deactivateFlow(id: string): Promise<FlowRecord> {
    const response = await this.client.post<FlowDetailResponse>(`/${id}/deactivate`);
    return response.data.data.flow;
  }

  /** DELETE /v1/flows/:id — delete a flow (refuses if active) */
  async deleteFlow(id: string): Promise<void> {
    await this.client.delete(`/${id}`);
  }

  /** GET /v1/flows/channel/verify-token — get the webhook verify token */
  async getVerifyToken(): Promise<string> {
    const response = await this.client.get<VerifyTokenResponse>('/channel/verify-token');
    return response.data.data.verifyToken;
  }
}

export const flowsApi = new FlowsApiClient();
