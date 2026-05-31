import { create } from 'zustand';
import {
  flowsApi,
  FlowRecord,
  FlowSummary,
  CreateFlowPayload,
  UpdateFlowPayload,
} from '@/api/flows';

interface FlowStore {
  // State
  flows: FlowSummary[];
  currentFlow: FlowRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  fetchFlows: () => Promise<void>;
  fetchFlow: (id: string) => Promise<void>;
  createFlow: (payload: CreateFlowPayload) => Promise<FlowRecord>;
  updateFlow: (id: string, payload: UpdateFlowPayload) => Promise<FlowRecord>;
  activateFlow: (id: string) => Promise<void>;
  deactivateFlow: (id: string) => Promise<void>;
  deleteFlow: (id: string) => Promise<void>;
  setCurrentFlow: (flow: FlowRecord | null) => void;
  clearError: () => void;
}

export const useFlowStore = create<FlowStore>((set) => ({
  flows: [],
  currentFlow: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchFlows: async () => {
    set({ isLoading: true, error: null });
    try {
      const flows = await flowsApi.listFlows();
      set({ flows, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch flows',
        isLoading: false,
      });
    }
  },

  fetchFlow: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const flow = await flowsApi.getFlow(id);
      set({ currentFlow: flow, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch flow',
        isLoading: false,
      });
    }
  },

  createFlow: async (payload: CreateFlowPayload) => {
    set({ isSaving: true, error: null });
    try {
      const flow = await flowsApi.createFlow(payload);
      set((state) => ({
        flows: [...state.flows, {
          id: flow.id,
          name: flow.name,
          version: flow.version,
          isActive: flow.isActive,
          updatedAt: flow.updatedAt,
        }],
        currentFlow: flow,
        isSaving: false,
      }));
      return flow;
    } catch (error: any) {
      const message = error.response?.data?.error?.message
        || error.response?.data?.message
        || 'Failed to create flow';
      set({ error: message, isSaving: false });
      throw error;
    }
  },

  updateFlow: async (id: string, payload: UpdateFlowPayload) => {
    set({ isSaving: true, error: null });
    try {
      const flow = await flowsApi.updateFlow(id, payload);
      // Update replaces the flow entry in the list (new version)
      set((state) => ({
        flows: state.flows.map((f) =>
          f.id === id
            ? { id: flow.id, name: flow.name, version: flow.version, isActive: flow.isActive, updatedAt: flow.updatedAt }
            : f
        ),
        currentFlow: flow,
        isSaving: false,
      }));
      return flow;
    } catch (error: any) {
      const message = error.response?.data?.error?.message
        || error.response?.data?.message
        || 'Failed to update flow';
      set({ error: message, isSaving: false });
      throw error;
    }
  },

  activateFlow: async (id: string) => {
    set({ isSaving: true, error: null });
    try {
      const flow = await flowsApi.activateFlow(id);
      // Only one flow can be active — update the list accordingly
      set((state) => ({
        flows: state.flows.map((f) => ({
          ...f,
          isActive: f.id === id,
        })),
        currentFlow: state.currentFlow?.id === id ? flow : state.currentFlow,
        isSaving: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to activate flow',
        isSaving: false,
      });
      throw error;
    }
  },

  deactivateFlow: async (id: string) => {
    set({ isSaving: true, error: null });
    try {
      const flow = await flowsApi.deactivateFlow(id);
      set((state) => ({
        flows: state.flows.map((f) =>
          f.id === id ? { ...f, isActive: false } : f
        ),
        currentFlow: state.currentFlow?.id === id ? flow : state.currentFlow,
        isSaving: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to deactivate flow',
        isSaving: false,
      });
      throw error;
    }
  },

  deleteFlow: async (id: string) => {
    set({ isSaving: true, error: null });
    try {
      await flowsApi.deleteFlow(id);
      set((state) => ({
        flows: state.flows.filter((f) => f.id !== id),
        currentFlow: state.currentFlow?.id === id ? null : state.currentFlow,
        isSaving: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete flow',
        isSaving: false,
      });
      throw error;
    }
  },

  setCurrentFlow: (flow: FlowRecord | null) => {
    set({ currentFlow: flow });
  },

  clearError: () => set({ error: null }),
}));
