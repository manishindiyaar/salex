import { create } from 'zustand';

export interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
  data?: any;
}

export interface BusinessDraft {
  businessId?: string; // Store the created business ID
  name?: string;
  tagline?: string;
  description?: string;
  businessType?: string;
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

interface OnboardingStore {
  currentStep: string;
  steps: OnboardingStep[];
  userPhone: string;
  businessDraft: BusinessDraft;
  clerkUserId: string;
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
  
  // Computed getters - these will be computed properties
  getProgress: () => number;
  getCompletedStepsCount: () => number;
  getTotalStepsCount: () => number;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  currentStep: 'phone_auth',
  steps: [
    { id: 'phone_auth', label: 'Phone Number', completed: false },
    { id: 'otp_verification', label: 'OTP Verification', completed: false },
    { id: 'business_type', label: 'Business Type', completed: false },
    { id: 'business_identity', label: 'Business Identity', completed: false },
    { id: 'contact_location', label: 'Contact & Location', completed: false },
    { id: 'services', label: 'Services & Pricing', completed: false },
    { id: 'business_hours', label: 'Business Hours', completed: false },
    { id: 'review', label: 'Review & Complete', completed: false },
  ],
  userPhone: '',
  businessDraft: {},
  clerkUserId: '',
  sessionStartedAt: new Date(),
  lastUpdatedAt: new Date(),

  setCurrentStep: (step: string) => set({ currentStep: step }),

  markStepCompleted: (stepId: string) =>
    set((state) => ({
      steps: state.steps.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    })),

  setUserPhone: (phone: string) => set({ userPhone: phone }),

  updateBusinessDraft: (data: Partial<BusinessDraft>) =>
    set((state) => ({
      businessDraft: { ...state.businessDraft, ...data },
      lastUpdatedAt: new Date(),
    })),

  completeOnboarding: () =>
    set((state) => ({
      steps: state.steps.map(step =>
        step.id === 'review' ? { ...step, completed: true } : step
      ),
      lastUpdatedAt: new Date(),
    })),

  reset: () =>
    set({
      currentStep: 'phone_auth',
      steps: [
        { id: 'phone_auth', label: 'Phone Number', completed: false },
        { id: 'otp_verification', label: 'OTP Verification', completed: false },
        { id: 'business_type', label: 'Business Type', completed: false },
        { id: 'business_identity', label: 'Business Identity', completed: false },
        { id: 'contact_location', label: 'Contact & Location', completed: false },
        { id: 'services', label: 'Services & Pricing', completed: false },
        { id: 'business_hours', label: 'Business Hours', completed: false },
        { id: 'review', label: 'Review & Complete', completed: false },
      ],
      businessDraft: {},
      userPhone: '',
      sessionStartedAt: new Date(),
      lastUpdatedAt: new Date(),
    }),

  updateAuthStep: (step: string) => set({ currentStep: step }),

  getProgress: () => {
    const state = get();
    const completedSteps = state.steps.filter(step => step.completed).length;
    return completedSteps / state.steps.length;
  },

  getCompletedStepsCount: () => {
    return get().steps.filter(step => step.completed).length;
  },

  getTotalStepsCount: () => {
    return get().steps.length;
  },
}));