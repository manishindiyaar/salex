import { create } from 'zustand';

type ToastType = 'error' | 'success' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  code?: string;
  ts: number;
  durationMs?: number;
}

interface ToastState {
  toasts: ToastItem[];
  show: (toast: Omit<ToastItem, 'id' | 'ts'>) => void;
  showError: (message: string, code?: string, durationMs?: number) => void;
  showSuccess: (message: string, durationMs?: number) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (toast) => {
    const id = uid();
    const item: ToastItem = {
      id,
      ts: Date.now(),
      durationMs: toast.durationMs ?? 4000,
      ...toast,
    };
    set((s) => ({ toasts: [...s.toasts, item] }));
    // auto-dismiss
    const duration = item.durationMs ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        const exists = get().toasts.find((t) => t.id === id);
        if (exists) get().dismiss(id);
      }, duration);
    }
  },
  showError: (message, code, durationMs = 5000) =>
    get().show({ type: 'error', message, code, durationMs }),
  showSuccess: (message, durationMs = 3000) =>
    get().show({ type: 'success', message, durationMs }),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearAll: () => set({ toasts: [] }),
}));

export const showErrorToast = (message: string, code?: string, durationMs?: number) =>
  useToastStore.getState().showError(message, code, durationMs);

export const showSuccessToast = (message: string, durationMs?: number) =>
  useToastStore.getState().showSuccess(message, durationMs);
