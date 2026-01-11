import { create } from 'zustand';
import { NicheTemplate } from '../services/templateService';

export interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
  data?: any;
  requiredModule?: string; // Module required for this step
}

export interface BusinessDraft {
  businessId?: string; // Store the created business ID
  name?: string;
  tagline?: string;
  description?: string;
  businessType?: string;
  template?: NicheTemplate | null; // Store the selected niche template
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
  updateStepsForTemplate: () => void; // New method to update steps based on template
  
  // Computed getters - these will be computed properties
  getProgress: () => number;
  getCompletedStepsCount: () => number;
  getTotalStepsCount: () => number;
  getVisibleSteps: () => OnboardingStep[]; // New getter for visible steps
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
    { id: 'resources', label: 'Resources Setup', completed: false, requiredModule: 'resource_management' },
    { id: 'staff', label: 'Staff Setup', completed: false, requiredModule: 'staff_management' },
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
        { id: 'resources', label: 'Resources Setup', completed: false, requiredModule: 'resource_management' },
        { id: 'staff', label: 'Staff Setup', completed: false, requiredModule: 'staff_management' },
        { id: 'business_hours', label: 'Business Hours', completed: false },
        { id: 'review', label: 'Review & Complete', completed: false },
      ],
      businessDraft: {},
      userPhone: '',
      sessionStartedAt: new Date(),
      lastUpdatedAt: new Date(),
    }),

  updateAuthStep: (step: string) => set({ currentStep: step }),

  updateStepsForTemplate: () => {
    const state = get();
    const template = state.businessDraft.template;
    
    if (!template) return;
    
    // Filter steps based on enabled modules
    const enabledModules = template.enabledModules || [];
    const updatedSteps = state.steps.map(step => {
      // If step requires a module, check if it's enabled
      if (step.requiredModule && !enabledModules.includes(step.requiredModule)) {
        // Skip this step by marking it as completed
        return { ...step, completed: true };
      }
      return step;
    });
    
    set({ steps: updatedSteps });
  },

  getProgress: () => {
    const state = get();
    const visibleSteps = state.getVisibleSteps();
    const completedSteps = visibleSteps.filter(step => step.completed).length;
    return completedSteps / visibleSteps.length;
  },

  getCompletedStepsCount: () => {
    const state = get();
    return state.getVisibleSteps().filter(step => step.completed).length;
  },

  getTotalStepsCount: () => {
    const state = get();
    return state.getVisibleSteps().length;
  },

  getVisibleSteps: () => {
    const state = get();
    const template = state.businessDraft.template;
    
    if (!template) return state.steps;
    
    const enabledModules = template.enabledModules || [];
    
    // Return only steps that don't require modules or have their required module enabled
    return state.steps.filter(step => {
      if (!step.requiredModule) return true;
      return enabledModules.includes(step.requiredModule);
    });
  },
}));