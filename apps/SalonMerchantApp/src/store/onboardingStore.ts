import { create } from 'zustand';

export interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
  data?: any;
}

export interface BusinessDraft {
  businessId?: string;
  name?: string;
  tagline?: string;
  description?: string;
  logo?: string;
  phone?: string;
  whatsApp?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  services?: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
    category: string;
    description?: string;
  }>;
  hoursOfOperation?: Record<string, {
    open: string;
    close: string;
    closed: boolean;
  }>;
  currency?: string;
  language?: string;
}

// Fixed Salon onboarding steps — no module gating, all steps always visible
const SALON_ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'phone_auth',       label: 'Phone Number',      completed: false },
  { id: 'otp_verification', label: 'OTP Verification',  completed: false },
  { id: 'business_identity',label: 'Business Identity', completed: false },
  { id: 'contact_location', label: 'Contact & Location', completed: false },
  { id: 'services',         label: 'Services & Pricing', completed: false },
  { id: 'resources',        label: 'Chairs Setup',       completed: false },
  { id: 'staff',            label: 'Stylists Setup',     completed: false },
  { id: 'business_hours',   label: 'Business Hours',     completed: false },
  { id: 'review',           label: 'Review & Complete',  completed: false },
];

interface OnboardingStore {
  currentStep: string;
  steps: OnboardingStep[];
  userPhone: string;
  businessDraft: BusinessDraft;
  sessionStartedAt: Date;
  lastUpdatedAt: Date;

  // Actions
  setCurrentStep: (step: string) => void;
  markStepCompleted: (stepId: string) => void;
  setUserPhone: (phone: string) => void;
  updateBusinessDraft: (data: Partial<BusinessDraft>) => void;
  completeOnboarding: () => void;
  reset: () => void;
  updateAuthStep: (step: string) => void;

  // Computed
  getProgress: () => number;
  getCompletedStepsCount: () => number;
  getTotalStepsCount: () => number;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  currentStep: 'phone_auth',
  steps: [...SALON_ONBOARDING_STEPS],
  userPhone: '',
  businessDraft: {},
  sessionStartedAt: new Date(),
  lastUpdatedAt: new Date(),

  setCurrentStep: (step) => set({ currentStep: step }),

  markStepCompleted: (stepId) =>
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === stepId ? { ...step, completed: true } : step
      ),
    })),

  setUserPhone: (phone) => set({ userPhone: phone }),

  updateBusinessDraft: (data) =>
    set((state) => ({
      businessDraft: { ...state.businessDraft, ...data },
      lastUpdatedAt: new Date(),
    })),

  completeOnboarding: () =>
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === 'review' ? { ...step, completed: true } : step
      ),
      lastUpdatedAt: new Date(),
    })),

  reset: () =>
    set({
      currentStep: 'phone_auth',
      steps: [...SALON_ONBOARDING_STEPS],
      businessDraft: {},
      userPhone: '',
      sessionStartedAt: new Date(),
      lastUpdatedAt: new Date(),
    }),

  updateAuthStep: (step) => set({ currentStep: step }),

  getProgress: () => {
    const { steps } = get();
    const completed = steps.filter((s) => s.completed).length;
    return completed / steps.length;
  },

  getCompletedStepsCount: () => {
    const { steps } = get();
    return steps.filter((s) => s.completed).length;
  },

  getTotalStepsCount: () => get().steps.length,
}));