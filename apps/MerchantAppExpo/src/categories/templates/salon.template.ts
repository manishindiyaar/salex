/**
 * Salon Template Configuration
 * 
 * Complete template configuration for hair salon businesses.
 * Defines salon-specific terminology, modules, services, and workflows.
 */

import { BusinessCategory } from '../../types/business';
import { NicheTemplate } from '../core/types';

export const salonTemplate: NicheTemplate = {
  id: 'salon-template-v1',
  code: BusinessCategory.SALON,
  displayName: 'Hair Salon',
  icon: '💄',
  description: 'Professional hair styling, coloring, and treatment services',
  
  // Core configurations
  terminology: {
    // Core entities
    customer: {
      singular: 'client',
      plural: 'clients',
      variations: {
        formal: 'valued client',
        casual: 'customer',
        booking: 'client',
      },
      description: 'Person receiving salon services',
    },
    staff: {
      singular: 'stylist',
      plural: 'stylists',
      variations: {
        senior: 'senior stylist',
        junior: 'junior stylist',
        specialist: 'color specialist',
      },
      description: 'Hair styling professional',
    },
    service: {
      singular: 'service',
      plural: 'services',
      variations: {
        hair: 'hair service',
        color: 'color service',
        treatment: 'hair treatment',
      },
      description: 'Hair styling or treatment service',
    },
    appointment: {
      singular: 'appointment',
      plural: 'appointments',
      variations: {
        booking: 'booking',
        session: 'styling session',
        slot: 'time slot',
      },
      description: 'Scheduled salon visit',
    },
    resource: {
      singular: 'station',
      plural: 'stations',
      variations: {
        chair: 'styling chair',
        wash: 'wash station',
        color: 'color station',
      },
      description: 'Salon workstation or equipment',
    },
    
    // Actions
    book: {
      singular: 'book',
      plural: 'book',
      variations: {
        appointment: 'book appointment',
        service: 'book service',
        session: 'schedule session',
      },
    },
    schedule: {
      singular: 'schedule',
      plural: 'schedule',
      variations: {
        appointment: 'schedule appointment',
        service: 'schedule service',
      },
    },
    cancel: {
      singular: 'cancel',
      plural: 'cancel',
      variations: {
        appointment: 'cancel appointment',
        booking: 'cancel booking',
      },
    },
    complete: {
      singular: 'complete',
      plural: 'complete',
      variations: {
        service: 'finish service',
        appointment: 'complete appointment',
      },
    },
    
    // Contexts
    contexts: {
      booking: {
        singular: 'booking',
        plural: 'bookings',
        variations: {
          new: 'new booking',
          confirmed: 'confirmed booking',
          completed: 'completed service',
        },
      },
      payment: {
        singular: 'payment',
        plural: 'payments',
        variations: {
          service: 'service payment',
          tip: 'stylist tip',
        },
      },
    },
    
    // Multi-language support
    languages: {
      hi: {
        customer: {
          singular: 'ग्राहक',
          plural: 'ग्राहक',
          variations: { formal: 'सम्मानित ग्राहक' },
        },
        staff: {
          singular: 'हेयर स्टाइलिस्ट',
          plural: 'हेयर स्टाइलिस्ट',
          variations: {},
        },
        service: {
          singular: 'सेवा',
          plural: 'सेवाएं',
          variations: {},
        },
      },
    },
  },
  
  modules: [
    {
      code: 'hair-services',
      name: 'Hair Services',
      description: 'Core hair styling and cutting services',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.SALON],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        allowWalkIns: true,
        requireConsultation: false,
        enableColorBooking: true,
      },
      permissions: [
        { action: 'create', resource: 'hair_service' },
        { action: 'update', resource: 'hair_service' },
        { action: 'delete', resource: 'hair_service' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'hair-services',
            label: 'Hair Services',
            icon: 'scissors',
            route: '/services/hair',
            permissions: ['create:hair_service'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'hair-bookings-today',
            type: 'metric',
            title: 'Hair Appointments Today',
            configuration: { metric: 'hair_bookings_count' },
          },
        ],
        formFields: [
          {
            name: 'hairType',
            type: 'select',
            label: 'Hair Type',
            required: false,
            validation: { options: ['straight', 'wavy', 'curly', 'coily'] },
          },
        ],
        customComponents: [
          {
            name: 'HairColorPicker',
            props: { allowCustomColors: true },
            conditions: { serviceType: 'color' },
          },
        ],
      },
    },
    {
      code: 'color-services',
      name: 'Color Services',
      description: 'Hair coloring and highlighting services',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.SALON],
      incompatibleWith: [],
      dependencies: ['hair-services'],
      settings: {
        requirePatchTest: true,
        colorConsultationRequired: true,
        allowSameDay: false,
      },
      permissions: [
        { action: 'create', resource: 'color_service' },
        { action: 'update', resource: 'color_service' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'color-services',
            label: 'Color Services',
            icon: 'palette',
            route: '/services/color',
            permissions: ['create:color_service'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'color-revenue',
            type: 'chart',
            title: 'Color Service Revenue',
            configuration: { chartType: 'line', period: 'monthly' },
          },
        ],
        formFields: [
          {
            name: 'currentHairColor',
            type: 'color',
            label: 'Current Hair Color',
            required: true,
            validation: {},
          },
          {
            name: 'desiredColor',
            type: 'color',
            label: 'Desired Color',
            required: true,
            validation: {},
          },
        ],
        customComponents: [],
      },
    },
    {
      code: 'treatment-services',
      name: 'Hair Treatments',
      description: 'Deep conditioning and repair treatments',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.SALON],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        requireHairAnalysis: true,
        treatmentPackages: true,
      },
      permissions: [
        { action: 'create', resource: 'treatment_service' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'treatments',
            label: 'Hair Treatments',
            icon: 'droplet',
            route: '/services/treatments',
            permissions: ['create:treatment_service'],
          },
        ],
        dashboardWidgets: [],
        formFields: [
          {
            name: 'hairCondition',
            type: 'select',
            label: 'Hair Condition',
            required: true,
            validation: { options: ['healthy', 'damaged', 'dry', 'oily'] },
          },
        ],
        customComponents: [],
      },
    },
    {
      code: 'stylist-management',
      name: 'Stylist Management',
      description: 'Manage salon stylists and their specializations',
      category: 'management',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.SALON],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        allowStylistPreference: true,
        trackStylistPerformance: true,
      },
      permissions: [
        { action: 'create', resource: 'stylist' },
        { action: 'update', resource: 'stylist' },
        { action: 'view', resource: 'stylist_performance' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'stylists',
            label: 'Stylists',
            icon: 'users',
            route: '/staff/stylists',
            permissions: ['view:stylist'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'stylist-utilization',
            type: 'gauge',
            title: 'Stylist Utilization',
            configuration: { target: 80 },
          },
        ],
        formFields: [
          {
            name: 'specializations',
            type: 'multiselect',
            label: 'Specializations',
            required: false,
            validation: { options: ['cutting', 'coloring', 'styling', 'treatments'] },
          },
        ],
        customComponents: [],
      },
    },
  ],
  
  services: [
    {
      name: 'Haircut & Style',
      description: 'Professional haircut with styling',
      category: 'hair',
      basePrice: 800,
      currency: 'INR',
      priceVariations: [
        { condition: 'hair_length:long', modifier: 200, type: 'fixed' },
        { condition: 'stylist_level:senior', modifier: 25, type: 'percentage' },
      ],
      duration: 60,
      bufferTime: 15,
      requiredResources: [
        { type: 'styling_chair', quantity: 1, optional: false },
        { type: 'wash_station', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'stylist', skills: ['cutting', 'styling'], optional: false },
      ],
      categorySpecific: {
        salon: {
          hairType: 'all',
          colorCompatible: true,
          stylistLevel: 'junior',
        },
      },
    },
    {
      name: 'Hair Color - Full',
      description: 'Complete hair coloring service',
      category: 'color',
      basePrice: 2500,
      currency: 'INR',
      priceVariations: [
        { condition: 'hair_length:long', modifier: 500, type: 'fixed' },
        { condition: 'color_complexity:high', modifier: 30, type: 'percentage' },
      ],
      duration: 180,
      bufferTime: 30,
      requiredResources: [
        { type: 'color_station', quantity: 1, optional: false },
        { type: 'wash_station', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'colorist', skills: ['coloring', 'color_theory'], optional: false },
      ],
      categorySpecific: {
        salon: {
          hairType: 'all',
          colorCompatible: true,
          stylistLevel: 'senior',
        },
      },
    },
    {
      name: 'Deep Conditioning Treatment',
      description: 'Intensive hair repair and conditioning',
      category: 'treatment',
      basePrice: 1200,
      currency: 'INR',
      priceVariations: [
        { condition: 'hair_damage:severe', modifier: 300, type: 'fixed' },
      ],
      duration: 90,
      bufferTime: 15,
      requiredResources: [
        { type: 'treatment_chair', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'stylist', skills: ['treatments'], optional: false },
      ],
      categorySpecific: {
        salon: {
          hairType: 'all',
          colorCompatible: false,
          stylistLevel: 'junior',
        },
      },
    },
  ],
  
  workflows: [
    {
      id: 'post-service-followup',
      name: 'Post-Service Follow-up',
      description: 'Automated follow-up after salon services',
      category: [BusinessCategory.SALON],
      triggers: [
        { type: 'service_complete', conditions: { serviceType: 'any' } },
      ],
      conditions: [
        { field: 'service.completed', operator: 'equals', value: true },
        { field: 'customer.phone', operator: 'not_equals', value: null },
      ],
      actions: [
        {
          type: 'send_message',
          parameters: {
            template: 'salon_service_complete',
            delay: 3600, // 1 hour after service
          },
        },
        {
          type: 'send_message',
          parameters: {
            template: 'salon_feedback_request',
            delay: 86400, // 24 hours after service
          },
        },
      ],
      isActive: true,
      priority: 1,
    },
    {
      id: 'color-service-reminder',
      name: 'Color Touch-up Reminder',
      description: 'Remind clients about color touch-ups',
      category: [BusinessCategory.SALON],
      triggers: [
        { type: 'service_complete', conditions: { serviceCategory: 'color' } },
      ],
      conditions: [
        { field: 'service.category', operator: 'equals', value: 'color' },
      ],
      actions: [
        {
          type: 'send_message',
          parameters: {
            template: 'color_touchup_reminder',
            delay: 2592000, // 30 days after color service
          },
        },
      ],
      isActive: true,
      priority: 2,
    },
  ],
  
  analytics: {
    metrics: [
      {
        id: 'salon_revenue_per_client',
        name: 'Revenue per Client',
        description: 'Average revenue generated per client visit',
        category: [BusinessCategory.SALON],
        formula: 'total_revenue / unique_clients',
        aggregation: 'average',
        timeframe: 'monthly',
      },
      {
        id: 'stylist_utilization',
        name: 'Stylist Utilization',
        description: 'Percentage of stylist time booked',
        category: [BusinessCategory.SALON],
        formula: 'booked_hours / available_hours * 100',
        aggregation: 'percentage',
        timeframe: 'daily',
      },
      {
        id: 'color_service_ratio',
        name: 'Color Service Ratio',
        description: 'Percentage of appointments that include color services',
        category: [BusinessCategory.SALON],
        formula: 'color_appointments / total_appointments * 100',
        aggregation: 'percentage',
        timeframe: 'weekly',
      },
    ],
    dashboards: [
      {
        id: 'salon_overview',
        name: 'Salon Overview',
        category: [BusinessCategory.SALON],
        widgets: [
          {
            id: 'revenue_chart',
            type: 'chart',
            title: 'Daily Revenue',
            metricIds: ['salon_revenue_per_client'],
            configuration: { chartType: 'line', period: 'week' },
          },
          {
            id: 'utilization_gauge',
            type: 'gauge',
            title: 'Stylist Utilization',
            metricIds: ['stylist_utilization'],
            configuration: { target: 75, warningThreshold: 60 },
          },
        ],
      },
    ],
    reports: [
      {
        id: 'weekly_salon_report',
        name: 'Weekly Salon Performance',
        description: 'Comprehensive weekly performance report',
        category: [BusinessCategory.SALON],
        schedule: {
          frequency: 'weekly',
          time: '09:00',
          recipients: ['owner', 'manager'],
        },
      },
    ],
  },
  
  integrations: [
    {
      id: 'salon_pos_integration',
      name: 'Salon POS Integration',
      description: 'Integration with popular salon POS systems',
      category: [BusinessCategory.SALON],
      provider: 'generic_pos',
      apiVersion: 'v1',
      endpoints: [
        {
          name: 'sync_services',
          url: '/api/pos/services',
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          parameters: {},
        },
      ],
      authType: 'api_key',
      credentials: {},
      dataMapping: [
        { sourceField: 'pos_service_id', targetField: 'external_id', required: true },
        { sourceField: 'pos_price', targetField: 'base_price', required: true },
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
          primary: '#E91E63', // Pink for salon
          secondary: '#F8BBD9',
          accent: '#AD1457',
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