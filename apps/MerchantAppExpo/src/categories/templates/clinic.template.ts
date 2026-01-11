/**
 * Clinic Template Configuration
 * 
 * Complete template configuration for medical/beauty clinic businesses.
 * Defines clinic-specific terminology, modules, services, and workflows.
 */

import { BusinessCategory } from '../../types/business';
import { NicheTemplate } from '../core/types';

export const clinicTemplate: NicheTemplate = {
  id: 'clinic-template-v1',
  code: BusinessCategory.CLINIC,
  displayName: 'Beauty Clinic',
  icon: '🧴',
  description: 'Medical aesthetics, skincare, and beauty treatments',
  
  // Core configurations
  terminology: {
    // Core entities
    customer: {
      singular: 'patient',
      plural: 'patients',
      variations: {
        formal: 'valued patient',
        casual: 'client',
        booking: 'patient',
      },
      description: 'Person receiving medical aesthetic services',
    },
    staff: {
      singular: 'practitioner',
      plural: 'practitioners',
      variations: {
        doctor: 'doctor',
        nurse: 'aesthetic nurse',
        therapist: 'therapist',
      },
      description: 'Medical aesthetic professional',
    },
    service: {
      singular: 'treatment',
      plural: 'treatments',
      variations: {
        procedure: 'procedure',
        therapy: 'therapy',
        consultation: 'consultation',
      },
      description: 'Medical aesthetic treatment or procedure',
    },
    appointment: {
      singular: 'consultation',
      plural: 'consultations',
      variations: {
        booking: 'appointment',
        session: 'treatment session',
        visit: 'clinic visit',
      },
      description: 'Scheduled clinic visit',
    },
    resource: {
      singular: 'equipment',
      plural: 'equipment',
      variations: {
        room: 'treatment room',
        device: 'medical device',
        bed: 'treatment bed',
      },
      description: 'Medical equipment or treatment room',
    },
    
    // Actions
    book: {
      singular: 'schedule',
      plural: 'schedule',
      variations: {
        appointment: 'schedule consultation',
        treatment: 'book treatment',
        procedure: 'schedule procedure',
      },
    },
    schedule: {
      singular: 'schedule',
      plural: 'schedule',
      variations: {
        consultation: 'schedule consultation',
        followup: 'schedule follow-up',
      },
    },
    cancel: {
      singular: 'cancel',
      plural: 'cancel',
      variations: {
        appointment: 'cancel consultation',
        treatment: 'cancel treatment',
      },
    },
    complete: {
      singular: 'complete',
      plural: 'complete',
      variations: {
        treatment: 'complete treatment',
        consultation: 'finish consultation',
      },
    },
    
    // Contexts
    contexts: {
      booking: {
        singular: 'consultation',
        plural: 'consultations',
        variations: {
          new: 'new consultation',
          followup: 'follow-up visit',
          treatment: 'treatment session',
        },
      },
      medical: {
        singular: 'medical record',
        plural: 'medical records',
        variations: {
          history: 'treatment history',
          notes: 'clinical notes',
        },
      },
    },
    
    // Multi-language support
    languages: {
      hi: {
        customer: {
          singular: 'मरीज़',
          plural: 'मरीज़',
          variations: { formal: 'सम्मानित मरीज़' },
        },
        staff: {
          singular: 'डॉक्टर',
          plural: 'डॉक्टर',
          variations: { nurse: 'नर्स' },
        },
        service: {
          singular: 'इलाज',
          plural: 'इलाज',
          variations: { consultation: 'सलाह' },
        },
      },
    },
  },
  
  modules: [
    {
      code: 'consultation-services',
      name: 'Consultation Services',
      description: 'Initial consultations and assessments',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.CLINIC],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        requireMedicalHistory: true,
        consultationRequired: true,
        allowDirectTreatment: false,
      },
      permissions: [
        { action: 'create', resource: 'consultation' },
        { action: 'update', resource: 'consultation' },
        { action: 'view', resource: 'medical_history' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'consultations',
            label: 'Consultations',
            icon: 'clipboard',
            route: '/consultations',
            permissions: ['create:consultation'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'consultations-today',
            type: 'metric',
            title: 'Consultations Today',
            configuration: { metric: 'consultation_count' },
          },
        ],
        formFields: [
          {
            name: 'medicalHistory',
            type: 'textarea',
            label: 'Medical History',
            required: true,
            validation: { minLength: 10 },
          },
          {
            name: 'allergies',
            type: 'text',
            label: 'Known Allergies',
            required: false,
            validation: {},
          },
        ],
        customComponents: [
          {
            name: 'MedicalHistoryForm',
            props: { requireSignature: true },
            conditions: { isNewPatient: true },
          },
        ],
      },
    },
    {
      code: 'aesthetic-treatments',
      name: 'Aesthetic Treatments',
      description: 'Non-invasive beauty and aesthetic procedures',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.CLINIC],
      incompatibleWith: [],
      dependencies: ['consultation-services'],
      settings: {
        requireConsultation: true,
        consentFormRequired: true,
        followUpRequired: true,
      },
      permissions: [
        { action: 'create', resource: 'aesthetic_treatment' },
        { action: 'update', resource: 'aesthetic_treatment' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'treatments',
            label: 'Treatments',
            icon: 'zap',
            route: '/treatments',
            permissions: ['create:aesthetic_treatment'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'treatment-revenue',
            type: 'chart',
            title: 'Treatment Revenue',
            configuration: { chartType: 'bar', period: 'monthly' },
          },
        ],
        formFields: [
          {
            name: 'skinType',
            type: 'select',
            label: 'Skin Type',
            required: true,
            validation: { options: ['oily', 'dry', 'combination', 'sensitive'] },
          },
          {
            name: 'treatmentArea',
            type: 'multiselect',
            label: 'Treatment Areas',
            required: true,
            validation: { options: ['face', 'neck', 'hands', 'body'] },
          },
        ],
        customComponents: [
          {
            name: 'ConsentForm',
            props: { requireSignature: true },
            conditions: { treatmentType: 'invasive' },
          },
        ],
      },
    },
    {
      code: 'skincare-analysis',
      name: 'Skin Analysis',
      description: 'Professional skin analysis and assessment tools',
      category: 'analytics',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.CLINIC],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        useDigitalAnalysis: true,
        trackProgress: true,
        generateReports: true,
      },
      permissions: [
        { action: 'create', resource: 'skin_analysis' },
        { action: 'view', resource: 'analysis_report' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'skin-analysis',
            label: 'Skin Analysis',
            icon: 'search',
            route: '/analysis',
            permissions: ['create:skin_analysis'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'analysis-completion',
            type: 'gauge',
            title: 'Analysis Completion Rate',
            configuration: { target: 90 },
          },
        ],
        formFields: [
          {
            name: 'skinConcerns',
            type: 'multiselect',
            label: 'Skin Concerns',
            required: true,
            validation: { options: ['acne', 'aging', 'pigmentation', 'sensitivity'] },
          },
        ],
        customComponents: [
          {
            name: 'SkinAnalysisCamera',
            props: { enableAI: true },
            conditions: { hasCamera: true },
          },
        ],
      },
    },
    {
      code: 'medical-records',
      name: 'Medical Records',
      description: 'Patient medical history and treatment records',
      category: 'management',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.CLINIC],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        encryptRecords: true,
        auditTrail: true,
        backupRequired: true,
      },
      permissions: [
        { action: 'create', resource: 'medical_record' },
        { action: 'update', resource: 'medical_record' },
        { action: 'view', resource: 'medical_record' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'medical-records',
            label: 'Medical Records',
            icon: 'file-text',
            route: '/records',
            permissions: ['view:medical_record'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'records-compliance',
            type: 'metric',
            title: 'Records Compliance',
            configuration: { metric: 'compliance_percentage' },
          },
        ],
        formFields: [
          {
            name: 'treatmentNotes',
            type: 'textarea',
            label: 'Treatment Notes',
            required: true,
            validation: { minLength: 20 },
          },
        ],
        customComponents: [],
      },
    },
  ],
  
  services: [
    {
      name: 'Initial Consultation',
      description: 'Comprehensive skin assessment and treatment planning',
      category: 'consultation',
      basePrice: 1500,
      currency: 'INR',
      priceVariations: [
        { condition: 'practitioner_level:senior', modifier: 25, type: 'percentage' },
      ],
      duration: 45,
      bufferTime: 15,
      requiredResources: [
        { type: 'consultation_room', quantity: 1, optional: false },
        { type: 'analysis_equipment', quantity: 1, optional: true },
      ],
      requiredStaff: [
        { role: 'practitioner', skills: ['consultation', 'skin_analysis'], optional: false },
      ],
      categorySpecific: {
        clinic: {
          requiresConsultation: false, // This IS the consultation
          followUpRequired: true,
          prescriptionEnabled: false,
        },
      },
    },
    {
      name: 'Facial Treatment - Basic',
      description: 'Deep cleansing and hydrating facial treatment',
      category: 'treatment',
      basePrice: 2500,
      currency: 'INR',
      priceVariations: [
        { condition: 'skin_type:sensitive', modifier: 300, type: 'fixed' },
        { condition: 'add_on:mask', modifier: 500, type: 'fixed' },
      ],
      duration: 90,
      bufferTime: 20,
      requiredResources: [
        { type: 'treatment_bed', quantity: 1, optional: false },
        { type: 'steamer', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'therapist', skills: ['facial_treatments'], optional: false },
      ],
      categorySpecific: {
        clinic: {
          requiresConsultation: true,
          followUpRequired: false,
          prescriptionEnabled: false,
        },
      },
    },
    {
      name: 'Chemical Peel - Light',
      description: 'Gentle chemical exfoliation for skin renewal',
      category: 'procedure',
      basePrice: 4000,
      currency: 'INR',
      priceVariations: [
        { condition: 'peel_strength:medium', modifier: 1000, type: 'fixed' },
        { condition: 'multiple_areas', modifier: 20, type: 'percentage' },
      ],
      duration: 60,
      bufferTime: 30,
      requiredResources: [
        { type: 'procedure_room', quantity: 1, optional: false },
        { type: 'neutralizing_station', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'practitioner', skills: ['chemical_peels', 'skin_assessment'], optional: false },
      ],
      categorySpecific: {
        clinic: {
          requiresConsultation: true,
          followUpRequired: true,
          prescriptionEnabled: true,
          insuranceCoverage: [],
        },
      },
    },
    {
      name: 'Laser Hair Removal',
      description: 'Professional laser hair removal treatment',
      category: 'laser',
      basePrice: 3500,
      currency: 'INR',
      priceVariations: [
        { condition: 'body_area:large', modifier: 50, type: 'percentage' },
        { condition: 'session_package:6', modifier: -15, type: 'percentage' },
      ],
      duration: 45,
      bufferTime: 15,
      requiredResources: [
        { type: 'laser_room', quantity: 1, optional: false },
        { type: 'laser_device', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'laser_technician', skills: ['laser_operation', 'safety_protocols'], optional: false },
      ],
      categorySpecific: {
        clinic: {
          requiresConsultation: true,
          followUpRequired: true,
          prescriptionEnabled: false,
        },
      },
    },
  ],
  
  workflows: [
    {
      id: 'pre-treatment-consultation',
      name: 'Pre-Treatment Consultation',
      description: 'Mandatory consultation before any treatment',
      category: [BusinessCategory.CLINIC],
      triggers: [
        { type: 'booking_created', conditions: { serviceType: 'treatment' } },
      ],
      conditions: [
        { field: 'patient.hasConsultation', operator: 'equals', value: false },
      ],
      actions: [
        {
          type: 'create_booking',
          parameters: {
            serviceType: 'consultation',
            priority: 'high',
            scheduleBefore: 'treatment',
          },
        },
        {
          type: 'send_message',
          parameters: {
            template: 'consultation_required',
            delay: 0,
          },
        },
      ],
      isActive: true,
      priority: 1,
    },
    {
      id: 'post-treatment-care',
      name: 'Post-Treatment Care Instructions',
      description: 'Send care instructions after treatments',
      category: [BusinessCategory.CLINIC],
      triggers: [
        { type: 'service_complete', conditions: { serviceCategory: 'treatment' } },
      ],
      conditions: [
        { field: 'treatment.requiresAftercare', operator: 'equals', value: true },
      ],
      actions: [
        {
          type: 'send_message',
          parameters: {
            template: 'aftercare_instructions',
            delay: 1800, // 30 minutes after treatment
          },
        },
        {
          type: 'send_message',
          parameters: {
            template: 'followup_reminder',
            delay: 604800, // 7 days after treatment
          },
        },
      ],
      isActive: true,
      priority: 2,
    },
    {
      id: 'treatment-series-reminder',
      name: 'Treatment Series Reminder',
      description: 'Remind patients about follow-up treatments in a series',
      category: [BusinessCategory.CLINIC],
      triggers: [
        { type: 'service_complete', conditions: { isPartOfSeries: true } },
      ],
      conditions: [
        { field: 'treatment.seriesRemaining', operator: 'greater_than', value: 0 },
      ],
      actions: [
        {
          type: 'send_message',
          parameters: {
            template: 'series_reminder',
            delay: 1209600, // 14 days after treatment
          },
        },
      ],
      isActive: true,
      priority: 3,
    },
  ],
  
  analytics: {
    metrics: [
      {
        id: 'treatment_success_rate',
        name: 'Treatment Success Rate',
        description: 'Percentage of treatments with positive outcomes',
        category: [BusinessCategory.CLINIC],
        formula: 'successful_treatments / total_treatments * 100',
        aggregation: 'percentage',
        timeframe: 'monthly',
      },
      {
        id: 'patient_retention_rate',
        name: 'Patient Retention Rate',
        description: 'Percentage of patients returning for follow-up treatments',
        category: [BusinessCategory.CLINIC],
        formula: 'returning_patients / total_patients * 100',
        aggregation: 'percentage',
        timeframe: 'monthly',
      },
      {
        id: 'consultation_conversion',
        name: 'Consultation Conversion Rate',
        description: 'Percentage of consultations that lead to treatments',
        category: [BusinessCategory.CLINIC],
        formula: 'consultations_with_treatment / total_consultations * 100',
        aggregation: 'percentage',
        timeframe: 'weekly',
      },
    ],
    dashboards: [
      {
        id: 'clinic_performance',
        name: 'Clinic Performance',
        category: [BusinessCategory.CLINIC],
        widgets: [
          {
            id: 'success_rate_gauge',
            type: 'gauge',
            title: 'Treatment Success Rate',
            metricIds: ['treatment_success_rate'],
            configuration: { target: 85, warningThreshold: 75 },
          },
          {
            id: 'retention_chart',
            type: 'chart',
            title: 'Patient Retention Trend',
            metricIds: ['patient_retention_rate'],
            configuration: { chartType: 'line', period: 'quarter' },
          },
        ],
      },
    ],
    reports: [
      {
        id: 'monthly_clinic_report',
        name: 'Monthly Clinic Performance',
        description: 'Comprehensive monthly performance and compliance report',
        category: [BusinessCategory.CLINIC],
        schedule: {
          frequency: 'monthly',
          time: '08:00',
          recipients: ['doctor', 'manager'],
        },
      },
    ],
  },
  
  integrations: [
    {
      id: 'medical_records_system',
      name: 'Medical Records Integration',
      description: 'Integration with electronic medical records systems',
      category: [BusinessCategory.CLINIC],
      provider: 'emr_system',
      apiVersion: 'v2',
      endpoints: [
        {
          name: 'sync_patient_records',
          url: '/api/emr/patients',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          parameters: {},
        },
      ],
      authType: 'oauth',
      credentials: {},
      dataMapping: [
        { sourceField: 'patient_id', targetField: 'external_patient_id', required: true },
        { sourceField: 'treatment_notes', targetField: 'clinical_notes', required: true },
      ],
      isActive: false,
    },
  ],
  
  customizations: {
    terminology: {},
    modules: [],
    services: [],
    workflows: [],
    ui: {
      theme: {
        colors: {
          primary: '#2196F3', // Medical blue
          secondary: '#E3F2FD',
          accent: '#1976D2',
        },
        fonts: {},
        spacing: {},
      },
      layout: {
        navigation: {},
        screens: {},
      },
      components: [],
    },
  },
  
  version: '1.0.0',
  isCustom: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};