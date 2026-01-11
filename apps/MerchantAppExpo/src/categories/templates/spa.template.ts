/**
 * Spa Template Configuration
 * 
 * Complete template configuration for wellness spa businesses.
 * Defines spa-specific terminology, modules, services, and workflows.
 */

import { BusinessCategory } from '../../types/business';
import { NicheTemplate } from '../core/types';

export const spaTemplate: NicheTemplate = {
  id: 'spa-template-v1',
  code: BusinessCategory.SPA,
  displayName: 'Wellness Spa',
  icon: '💅',
  description: 'Holistic wellness, massage therapy, and relaxation services',
  
  // Core configurations
  terminology: {
    // Core entities
    customer: {
      singular: 'guest',
      plural: 'guests',
      variations: {
        formal: 'valued guest',
        casual: 'client',
        member: 'spa member',
      },
      description: 'Person receiving spa services',
    },
    staff: {
      singular: 'therapist',
      plural: 'therapists',
      variations: {
        massage: 'massage therapist',
        wellness: 'wellness specialist',
        aesthetician: 'aesthetician',
      },
      description: 'Spa wellness professional',
    },
    service: {
      singular: 'treatment',
      plural: 'treatments',
      variations: {
        massage: 'massage therapy',
        facial: 'facial treatment',
        body: 'body treatment',
        wellness: 'wellness service',
      },
      description: 'Spa treatment or wellness service',
    },
    appointment: {
      singular: 'session',
      plural: 'sessions',
      variations: {
        booking: 'reservation',
        treatment: 'treatment session',
        package: 'spa package',
      },
      description: 'Scheduled spa visit',
    },
    resource: {
      singular: 'room',
      plural: 'rooms',
      variations: {
        massage: 'massage room',
        relaxation: 'relaxation area',
        facility: 'spa facility',
      },
      description: 'Spa treatment room or facility',
    },
    
    // Actions
    book: {
      singular: 'reserve',
      plural: 'reserve',
      variations: {
        treatment: 'book treatment',
        package: 'reserve package',
        session: 'schedule session',
      },
    },
    schedule: {
      singular: 'schedule',
      plural: 'schedule',
      variations: {
        treatment: 'schedule treatment',
        consultation: 'arrange consultation',
      },
    },
    cancel: {
      singular: 'cancel',
      plural: 'cancel',
      variations: {
        reservation: 'cancel reservation',
        treatment: 'cancel treatment',
      },
    },
    complete: {
      singular: 'complete',
      plural: 'complete',
      variations: {
        treatment: 'finish treatment',
        session: 'complete session',
      },
    },
    
    // Contexts
    contexts: {
      wellness: {
        singular: 'wellness journey',
        plural: 'wellness journeys',
        variations: {
          program: 'wellness program',
          package: 'spa package',
        },
      },
      relaxation: {
        singular: 'relaxation experience',
        plural: 'relaxation experiences',
        variations: {
          session: 'relaxation session',
          therapy: 'therapeutic experience',
        },
      },
    },
    
    // Multi-language support
    languages: {
      hi: {
        customer: {
          singular: 'अतिथि',
          plural: 'अतिथि',
          variations: { formal: 'सम्मानित अतिथि' },
        },
        staff: {
          singular: 'चिकित्सक',
          plural: 'चिकित्सक',
          variations: { massage: 'मसाज थेरेपिस्ट' },
        },
        service: {
          singular: 'उपचार',
          plural: 'उपचार',
          variations: { massage: 'मसाज' },
        },
      },
    },
  },
  
  modules: [
    {
      code: 'massage-therapy',
      name: 'Massage Therapy',
      description: 'Professional massage and bodywork services',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.SPA],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        requireIntake: true,
        allowPreferences: true,
        trackPressure: true,
      },
      permissions: [
        { action: 'create', resource: 'massage_service' },
        { action: 'update', resource: 'massage_service' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'massage-therapy',
            label: 'Massage Therapy',
            icon: 'hand',
            route: '/services/massage',
            permissions: ['create:massage_service'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'massage-bookings',
            type: 'metric',
            title: 'Massage Sessions Today',
            configuration: { metric: 'massage_sessions_count' },
          },
        ],
        formFields: [
          {
            name: 'pressurePreference',
            type: 'select',
            label: 'Pressure Preference',
            required: true,
            validation: { options: ['light', 'medium', 'firm', 'deep'] },
          },
          {
            name: 'focusAreas',
            type: 'multiselect',
            label: 'Focus Areas',
            required: false,
            validation: { options: ['neck', 'shoulders', 'back', 'legs'] },
          },
        ],
        customComponents: [
          {
            name: 'MassageIntakeForm',
            props: { includeHealthHistory: true },
            conditions: { isNewGuest: true },
          },
        ],
      },
    },
    {
      code: 'facial-treatments',
      name: 'Facial Treatments',
      description: 'Skincare and facial wellness treatments',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.SPA],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        skinAnalysis: true,
        customBlends: true,
        homecare: true,
      },
      permissions: [
        { action: 'create', resource: 'facial_service' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'facials',
            label: 'Facial Treatments',
            icon: 'smile',
            route: '/services/facials',
            permissions: ['create:facial_service'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'facial-revenue',
            type: 'chart',
            title: 'Facial Treatment Revenue',
            configuration: { chartType: 'area', period: 'weekly' },
          },
        ],
        formFields: [
          {
            name: 'skinType',
            type: 'select',
            label: 'Skin Type',
            required: true,
            validation: { options: ['normal', 'oily', 'dry', 'combination', 'sensitive'] },
          },
        ],
        customComponents: [],
      },
    },
    {
      code: 'wellness-packages',
      name: 'Wellness Packages',
      description: 'Multi-service wellness and relaxation packages',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.SPA],
      incompatibleWith: [],
      dependencies: ['massage-therapy', 'facial-treatments'],
      settings: {
        packageDiscounts: true,
        flexibleScheduling: true,
        membershipIntegration: true,
      },
      permissions: [
        { action: 'create', resource: 'wellness_package' },
        { action: 'manage', resource: 'package_pricing' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'packages',
            label: 'Wellness Packages',
            icon: 'gift',
            route: '/packages',
            permissions: ['create:wellness_package'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'package-sales',
            type: 'gauge',
            title: 'Package Sales Rate',
            configuration: { target: 30 },
          },
        ],
        formFields: [
          {
            name: 'packageDuration',
            type: 'select',
            label: 'Package Duration',
            required: true,
            validation: { options: ['half-day', 'full-day', 'weekend', 'week'] },
          },
        ],
        customComponents: [
          {
            name: 'PackageBuilder',
            props: { allowCustomization: true },
            conditions: { packageType: 'custom' },
          },
        ],
      },
    },
    {
      code: 'membership-program',
      name: 'Membership Program',
      description: 'Spa membership and loyalty program management',
      category: 'management',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.SPA],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        tieredMembership: true,
        pointsSystem: true,
        memberDiscounts: true,
      },
      permissions: [
        { action: 'create', resource: 'membership' },
        { action: 'manage', resource: 'member_benefits' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'memberships',
            label: 'Memberships',
            icon: 'star',
            route: '/memberships',
            permissions: ['create:membership'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'member-retention',
            type: 'metric',
            title: 'Member Retention Rate',
            configuration: { metric: 'retention_percentage' },
          },
        ],
        formFields: [
          {
            name: 'membershipTier',
            type: 'select',
            label: 'Membership Tier',
            required: true,
            validation: { options: ['bronze', 'silver', 'gold', 'platinum'] },
          },
        ],
        customComponents: [],
      },
    },
  ],
  
  services: [
    {
      name: 'Swedish Massage',
      description: 'Classic relaxation massage with long, flowing strokes',
      category: 'massage',
      basePrice: 3500,
      currency: 'INR',
      priceVariations: [
        { condition: 'duration:90min', modifier: 1000, type: 'fixed' },
        { condition: 'therapist_level:senior', modifier: 20, type: 'percentage' },
      ],
      duration: 60,
      bufferTime: 20,
      requiredResources: [
        { type: 'massage_room', quantity: 1, optional: false },
        { type: 'massage_table', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'massage_therapist', skills: ['swedish_massage', 'relaxation'], optional: false },
      ],
      categorySpecific: {
        spa: {
          wellnessCategory: 'relaxation',
          packageCompatible: true,
          membershipDiscount: 15,
        },
      },
    },
    {
      name: 'Deep Tissue Massage',
      description: 'Therapeutic massage targeting muscle tension and knots',
      category: 'massage',
      basePrice: 4000,
      currency: 'INR',
      priceVariations: [
        { condition: 'intensity:extra_firm', modifier: 500, type: 'fixed' },
        { condition: 'add_on:hot_stones', modifier: 800, type: 'fixed' },
      ],
      duration: 75,
      bufferTime: 25,
      requiredResources: [
        { type: 'massage_room', quantity: 1, optional: false },
        { type: 'massage_table', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'massage_therapist', skills: ['deep_tissue', 'therapeutic'], optional: false },
      ],
      categorySpecific: {
        spa: {
          wellnessCategory: 'therapeutic',
          packageCompatible: true,
          membershipDiscount: 10,
        },
      },
    },
    {
      name: 'Signature Facial',
      description: 'Customized facial treatment for all skin types',
      category: 'facial',
      basePrice: 2800,
      currency: 'INR',
      priceVariations: [
        { condition: 'skin_type:sensitive', modifier: 300, type: 'fixed' },
        { condition: 'add_on:eye_treatment', modifier: 600, type: 'fixed' },
      ],
      duration: 75,
      bufferTime: 15,
      requiredResources: [
        { type: 'facial_room', quantity: 1, optional: false },
        { type: 'steamer', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'aesthetician', skills: ['facial_treatments', 'skin_analysis'], optional: false },
      ],
      categorySpecific: {
        spa: {
          wellnessCategory: 'beauty',
          packageCompatible: true,
          membershipDiscount: 12,
        },
      },
    },
    {
      name: 'Wellness Day Package',
      description: 'Full day spa experience with multiple treatments',
      category: 'package',
      basePrice: 8500,
      currency: 'INR',
      priceVariations: [
        { condition: 'includes_lunch', modifier: 1200, type: 'fixed' },
        { condition: 'member_discount', modifier: -15, type: 'percentage' },
      ],
      duration: 360, // 6 hours
      bufferTime: 30,
      requiredResources: [
        { type: 'massage_room', quantity: 1, optional: false },
        { type: 'facial_room', quantity: 1, optional: false },
        { type: 'relaxation_lounge', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'massage_therapist', skills: ['massage'], optional: false },
        { role: 'aesthetician', skills: ['facials'], optional: false },
      ],
      categorySpecific: {
        spa: {
          wellnessCategory: 'relaxation',
          packageCompatible: false, // This IS a package
          membershipDiscount: 20,
        },
      },
    },
  ],
  
  workflows: [
    {
      id: 'pre-arrival-preparation',
      name: 'Pre-Arrival Preparation',
      description: 'Prepare guest experience before arrival',
      category: [BusinessCategory.SPA],
      triggers: [
        { type: 'booking_created', conditions: { serviceType: 'any' } },
      ],
      conditions: [
        { field: 'booking.scheduledDate', operator: 'equals', value: 'today' },
      ],
      actions: [
        {
          type: 'send_message',
          parameters: {
            template: 'spa_arrival_instructions',
            delay: 7200, // 2 hours before appointment
          },
        },
        {
          type: 'trigger_integration',
          parameters: {
            action: 'prepare_treatment_room',
            roomType: 'based_on_service',
          },
        },
      ],
      isActive: true,
      priority: 1,
    },
    {
      id: 'post-treatment-relaxation',
      name: 'Post-Treatment Relaxation',
      description: 'Guide guests through post-treatment relaxation',
      category: [BusinessCategory.SPA],
      triggers: [
        { type: 'service_complete', conditions: { serviceCategory: 'massage' } },
      ],
      conditions: [
        { field: 'service.duration', operator: 'greater_than', value: 60 },
      ],
      actions: [
        {
          type: 'send_message',
          parameters: {
            template: 'relaxation_guidance',
            delay: 0,
          },
        },
        {
          type: 'send_message',
          parameters: {
            template: 'hydration_reminder',
            delay: 900, // 15 minutes after treatment
          },
        },
      ],
      isActive: true,
      priority: 2,
    },
    {
      id: 'membership-renewal-reminder',
      name: 'Membership Renewal Reminder',
      description: 'Remind members about upcoming renewal',
      category: [BusinessCategory.SPA],
      triggers: [
        { type: 'time_based', conditions: { schedule: 'daily' } },
      ],
      conditions: [
        { field: 'membership.expiryDate', operator: 'less_than', value: '30_days' },
      ],
      actions: [
        {
          type: 'send_message',
          parameters: {
            template: 'membership_renewal',
            delay: 0,
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
        id: 'guest_satisfaction_score',
        name: 'Guest Satisfaction Score',
        description: 'Average satisfaction rating from guest feedback',
        category: [BusinessCategory.SPA],
        formula: 'sum(satisfaction_ratings) / count(feedback_responses)',
        aggregation: 'average',
        timeframe: 'monthly',
      },
      {
        id: 'treatment_utilization',
        name: 'Treatment Room Utilization',
        description: 'Percentage of treatment room capacity used',
        category: [BusinessCategory.SPA],
        formula: 'booked_room_hours / available_room_hours * 100',
        aggregation: 'percentage',
        timeframe: 'daily',
      },
      {
        id: 'package_conversion_rate',
        name: 'Package Conversion Rate',
        description: 'Percentage of single services converted to packages',
        category: [BusinessCategory.SPA],
        formula: 'package_bookings / total_bookings * 100',
        aggregation: 'percentage',
        timeframe: 'weekly',
      },
      {
        id: 'membership_retention',
        name: 'Membership Retention Rate',
        description: 'Percentage of members who renew their membership',
        category: [BusinessCategory.SPA],
        formula: 'renewed_memberships / expiring_memberships * 100',
        aggregation: 'percentage',
        timeframe: 'monthly',
      },
    ],
    dashboards: [
      {
        id: 'spa_wellness_dashboard',
        name: 'Spa Wellness Dashboard',
        category: [BusinessCategory.SPA],
        widgets: [
          {
            id: 'satisfaction_gauge',
            type: 'gauge',
            title: 'Guest Satisfaction',
            metricIds: ['guest_satisfaction_score'],
            configuration: { target: 4.5, scale: 5, warningThreshold: 4.0 },
          },
          {
            id: 'utilization_chart',
            type: 'chart',
            title: 'Room Utilization Trend',
            metricIds: ['treatment_utilization'],
            configuration: { chartType: 'area', period: 'week' },
          },
          {
            id: 'package_conversion',
            type: 'metric',
            title: 'Package Conversion Rate',
            metricIds: ['package_conversion_rate'],
            configuration: { showTrend: true },
          },
        ],
      },
    ],
    reports: [
      {
        id: 'weekly_wellness_report',
        name: 'Weekly Wellness Report',
        description: 'Comprehensive weekly spa performance and guest satisfaction report',
        category: [BusinessCategory.SPA],
        schedule: {
          frequency: 'weekly',
          time: '10:00',
          recipients: ['spa_manager', 'owner'],
        },
      },
    ],
  },
  
  integrations: [
    {
      id: 'wellness_app_integration',
      name: 'Wellness App Integration',
      description: 'Integration with popular wellness and meditation apps',
      category: [BusinessCategory.SPA],
      provider: 'wellness_platform',
      apiVersion: 'v1',
      endpoints: [
        {
          name: 'sync_wellness_programs',
          url: '/api/wellness/programs',
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          parameters: {},
        },
      ],
      authType: 'api_key',
      credentials: {},
      dataMapping: [
        { sourceField: 'program_id', targetField: 'external_program_id', required: true },
        { sourceField: 'wellness_score', targetField: 'guest_wellness_rating', required: false },
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
          primary: '#4CAF50', // Wellness green
          secondary: '#E8F5E8',
          accent: '#388E3C',
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