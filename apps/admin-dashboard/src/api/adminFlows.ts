import axios, { AxiosInstance } from 'axios';
import {
  FlowRecord,
  FlowSummary,
  FlowDefinition,
} from './flows';

/**
 * Admin Flow API client for the /api/v1/admin/businesses/:businessId/flows endpoints.
 * All operations are scoped to a specific business via the businessId parameter.
 */

export interface TemplateVariable {
  key: string;
  description: string;
  example: string;
}

export interface TemplateVariableGroup {
  category: string;
  variables: TemplateVariable[];
}

export interface BusinessFlowContext {
  business: {
    id: string;
    name: string;
    category: string;
    routingCode: string | null;
    channelMode: 'SHARED' | 'DEDICATED' | 'NONE';
  };
  services: Array<{ id: string; name: string; price: number; duration: number }>;
  staff: Array<{ id: string; name: string }>;
  resources: Array<{ id: string; name: string }>;
  operatingHours: Record<string, { start: string; end: string }> | null;
  templateVariables: TemplateVariableGroup[];
}

export interface ReadinessItem {
  code: string;
  label: string;
  message: string;
  severity: 'blocker' | 'warning';
}

export interface ReadinessResult {
  ready: boolean;
  missing: ReadinessItem[];
  channelMode: 'SHARED' | 'DEDICATED' | 'NONE';
  canPublish: boolean;
}

export interface AdminCreateFlowPayload {
  name: string;
  description?: string;
  definition: FlowDefinition;
}

export interface AdminUpdateFlowPayload {
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

interface ReadinessResponse {
  success: boolean;
  data: ReadinessResult;
}

interface FlowContextResponse {
  success: boolean;
  data: BusinessFlowContext;
}

class AdminFlowsApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1/admin/businesses',
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

  /** GET /admin/businesses/:businessId/flow-readiness */
  async getReadiness(businessId: string): Promise<ReadinessResult> {
    const response = await this.client.get<ReadinessResponse>(
      `/${businessId}/flow-readiness`
    );
    return response.data.data;
  }

  /** GET /admin/businesses/:businessId/flow-context */
  async getContext(businessId: string): Promise<BusinessFlowContext> {
    const response = await this.client.get<FlowContextResponse>(
      `/${businessId}/flow-context`
    );
    return response.data.data;
  }

  /** GET /admin/businesses/:businessId/flows — list flows for business */
  async listFlows(businessId: string): Promise<FlowSummary[]> {
    const response = await this.client.get<FlowListResponse>(
      `/${businessId}/flows`
    );
    return response.data.data.flows;
  }

  /** GET /admin/businesses/:businessId/flows/:flowId */
  async getFlow(businessId: string, flowId: string): Promise<FlowRecord> {
    const response = await this.client.get<FlowDetailResponse>(
      `/${businessId}/flows/${flowId}`
    );
    return response.data.data.flow;
  }

  /** POST /admin/businesses/:businessId/flows — create new flow (DRAFT) */
  async createFlow(businessId: string, payload: AdminCreateFlowPayload): Promise<FlowRecord> {
    const response = await this.client.post<FlowDetailResponse>(
      `/${businessId}/flows`,
      payload
    );
    return response.data.data.flow;
  }

  /** PUT /admin/businesses/:businessId/flows/:flowId — update flow (save draft) */
  async updateFlow(businessId: string, flowId: string, payload: AdminUpdateFlowPayload): Promise<FlowRecord> {
    const response = await this.client.put<FlowDetailResponse>(
      `/${businessId}/flows/${flowId}`,
      payload
    );
    return response.data.data.flow;
  }

  /** POST /admin/businesses/:businessId/flows/:flowId/publish — publish a flow */
  async publishFlow(businessId: string, flowId: string): Promise<FlowRecord> {
    const response = await this.client.post<FlowDetailResponse>(
      `/${businessId}/flows/${flowId}/publish`
    );
    return response.data.data.flow;
  }

  /** POST /admin/businesses/:businessId/flows/:flowId/archive — archive a flow */
  async archiveFlow(businessId: string, flowId: string): Promise<FlowRecord> {
    const response = await this.client.post<FlowDetailResponse>(
      `/${businessId}/flows/${flowId}/archive`
    );
    return response.data.data.flow;
  }

  /** DELETE /admin/businesses/:businessId/flows/:flowId */
  async deleteFlow(businessId: string, flowId: string): Promise<void> {
    await this.client.delete(`/${businessId}/flows/${flowId}`);
  }
}

export const adminFlowsApi = new AdminFlowsApiClient();

// ─── Simulator API Types ─────────────────────────────────────────────────────

export interface InteractiveButton {
  type: 'reply';
  reply: { id: string; title: string };
}

export interface InteractiveListRow {
  id: string;
  title: string;
  description?: string;
}

export interface InteractiveListSection {
  title?: string;
  rows: InteractiveListRow[];
}

export interface InteractiveMessage {
  type: 'button' | 'list' | 'text';
  header?: { type: 'text'; text: string };
  body: { text: string };
  footer?: { text: string };
  action?: {
    button?: string;
    buttons?: InteractiveButton[];
    sections?: InteractiveListSection[];
  };
}

export interface SimulatorSession {
  id: string;
  businessId: string;
  flowId: string;
  flowVersion: number;
  adminId: string;
  currentNodeId: string;
  contextData: Record<string, unknown>;
  lastMessageAt: string;
  createdAt: string;
}

export interface SimulatorResponse {
  sessionId: string;
  message: InteractiveMessage;
  messages: InteractiveMessage[];
  currentNodeId: string;
  contextData: Record<string, unknown>;
  complete: boolean;
}

export interface InteractiveReply {
  type: string;
  id: string;
  title: string;
}

// ─── Simulator API Client ────────────────────────────────────────────────────

class SimulatorApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1/admin/businesses',
      headers: {
        'Content-Type': 'application/json',
      },
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

  /** POST /admin/businesses/:businessId/simulator/sessions */
  async createSession(
    businessId: string,
    flowId: string
  ): Promise<{ session: SimulatorSession; initialResponse: SimulatorResponse }> {
    const response = await this.client.post<{
      success: boolean;
      data: { session: SimulatorSession; initialResponse: SimulatorResponse };
    }>(`/${businessId}/simulator/sessions`, { flowId });
    return response.data.data;
  }

  /** POST /admin/businesses/:businessId/simulator/sessions/:sessionId/message */
  async sendMessage(
    businessId: string,
    sessionId: string,
    text: string
  ): Promise<SimulatorResponse> {
    const response = await this.client.post<{
      success: boolean;
      data: SimulatorResponse;
    }>(`/${businessId}/simulator/sessions/${sessionId}/message`, { text });
    return response.data.data;
  }

  /** POST /admin/businesses/:businessId/simulator/sessions/:sessionId/interactive */
  async sendInteractive(
    businessId: string,
    sessionId: string,
    reply: InteractiveReply
  ): Promise<SimulatorResponse> {
    const response = await this.client.post<{
      success: boolean;
      data: SimulatorResponse;
    }>(`/${businessId}/simulator/sessions/${sessionId}/interactive`, reply);
    return response.data.data;
  }

  /** POST /admin/businesses/:businessId/simulator/sessions/:sessionId/reset */
  async resetSession(businessId: string, sessionId: string): Promise<void> {
    await this.client.post(`/${businessId}/simulator/sessions/${sessionId}/reset`);
  }
}

export const simulatorApi = new SimulatorApiClient();
