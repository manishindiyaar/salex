export interface OnboardingStatus {
  id: string;
  businessId: string;
  userId: string;
  totalSteps: number;
  completedSteps: string[];
  currentStep: string;
  progress: number; // 0-100
  
  // Step specific data
  step1: {
    businessName: string;
    tagline: string;
    logoUrl: string;
    description: string;
    completedAt: string;
  };
  
  step2: {
    primaryPhone: string;
    whatsApp: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      latitude?: number;
      longitude?: number;
    };
    website?: string;
    completedAt: string;
  };
  
  step3: {
    services: Array<{
      name: string;
      price: number;
      duration: number;
      category: string;
      description: string;
    }>;
    completedAt: string;
  };
  
  step4: {
    hoursOfOperation: {
      monday?: { open: string; close: string; closed: boolean };
      tuesday?: { open: string; close: string; closed: boolean };
      wednesday?: { open: string; close: string; closed: boolean };
      thursday?: { open: string; close: string; closed: boolean };
      friday?: { open: string; close: string; closed: boolean };
      saturday?: { open: string; close: string; closed: boolean };
      sunday?: { open: string; close: string; closed: boolean };
    };
    completedAt: string;
  };
  
  step5: {
    reviewCompleted: boolean;
    qrCodeGenerated: boolean;
    servicesReviewed: boolean;
    completedAt: string;
  };
  
  sessionData: {
    startedAt: string;
    lastUpdatedAt: string;
    estimatedCompletionTime: string;
    deviceType?: string;
    platform?: string;
    referrer?: string;
  };
  
  // For analytics and optimization
  dropOffStep?: string;
  completionTime?: number; // in minutes
  retryCount?: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingAnalytics {
  id: string;
  businessId: string;
  userId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: string;
}

export interface OnboardingMetrics {
  completionRate: number;
  averageCompletionTime: number;
  dropOffPoints: Array<{
    step: string;
    count: number;
    percentage: number;
  }>;
  successRates: {
    phoneVerification: number;
    businessCreation: number;
    servicesSetup: number;
    hoursSetup: number;
    completion: number;
  };
  templateUsage: {
    salonServiceCount: number;
    customServiceCount: number;
    skipPercentage: number;
  };
  geographicDistribution: Array<{
    country: string;
    city: string;
    count: number;
    completionRate: number;
  }>;
}

export interface StepMetrics {
  totalEnters: number;
  totalExits: number;
  averageTimeSpent: number; // minutes
  stepSequence: Array<{
    fromStep: string;
    toStep: string;
    count: number;
  }>;
}

export interface OnboardingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
}

export interface ResumeData {
  currentStep: string;
  completedSteps: string[];
  data: Record<string, any>;
  lastUpdatedAt: string;
  expiresIn: number; // hours
}

export interface AutoSaveConfig {
  autoSave: boolean;
  saveInterval: number; // minutes
  maxRetries: number;
  cleanupAfterHours: number;
}

export interface OnboardingResponse {
  businessId: string;
  onboardingStatus: OnboardingStatus;
  nextStep: string;
  estimatedTimeRemaining: number;
  progressPercentage: number;
  qrCodeData?: any;
  resumeData?: ResumeData;
}

export interface StepValidation {
  step: string;
  isValid: boolean;
  requiredFields: string[];
  missingFields: string[];
  canProceed: boolean;
}