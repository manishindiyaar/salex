/**
 * Beauty Parlor Template Configuration
 * 
 * Complete template configuration for beauty parlor businesses.
 * Defines beauty parlor-specific terminology, modules, services, and workflows.
 */

import { BusinessCategory } from '../../types/business';
import { NicheTemplate } from '../core/types';

export const beautyParlorTemplate: NicheTemplate = {
  id: 'beauty-parlor-template-v1',
  code: BusinessCategory.BEAUTY_PARLOR,
  displayName: 'Beauty Parlor',
  icon: '💄',
  description: 'Comprehensive beauty services, bridal packages, and event styling',
  
  // Core configurations
  terminology: {
    // Core entities
    customer: {
      singular: 'client',
      plural: 'clients',
      variations: {
        formal: 'valued client',
        bride: 'bride-to-be',
        regular: 'regular client',
      },
      description: 'Person receiving beauty services',
    },
    staff: {
      singular: 'beautician',
      plural: 'beauticians',
      variations: {
        makeup: 'makeup artist',
        hair: 'hair stylist',
        nail: 'nail technician',
        bridal: 'bridal specialist',
      },
      description: 'Beauty service professional',
    },
    service: {
      singular: 'service',
      plural: 'services',
      variations: {
        beauty: 'beauty service',
        bridal: 'bridal service',
        makeup: 'makeup service',
        grooming: 'grooming service',
      },
      description: 'Beauty enhancement service',
    },
    appointment: {
      singular: 'appointment',
      plural: 'appointments',
      variations: {
        booking: 'booking',
        session: 'beauty session',
        trial: 'trial session',
      },
      description: 'Scheduled beauty service',
    },
    resource: {
      singular: 'station',
      plural: 'stations',
      variations: {
        makeup: 'makeup station',
        hair: 'styling station',
        nail: 'nail station',
      },
      description: 'Beauty service workstation',
    },
    
    // Actions
    book: {
      singular: 'book',
      plural: 'book',
      variations: {
        appointment: 'book appointment',
        trial: 'schedule trial',
        package: 'book package',
      },
    },
    schedule: {
      singular: 'schedule',
      plural: 'schedule',
      variations: {
        service: 'schedule service',
        consultation: 'arrange consultation',
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
        makeover: 'complete makeover',
      },
    },
    
    // Contexts
    contexts: {
      bridal: {
        singular: 'bridal service',
        plural: 'bridal services',
        variations: {
          package: 'bridal package',
          trial: 'bridal trial',
          ceremony: 'wedding ceremony',
        },
      },
      event: {
        singular: 'event styling',
        plural: 'event styling',
        variations: {
          party: 'party makeup',
          formal: 'formal styling',
        },
      },
    },
    
    // Multi-language support
    languages: {
      hi: {
        customer: {
          singular: 'ग्राहक',
          plural: 'ग्राहक',
          variations: { bride: 'दुल्हन' },
        },
        staff: {
          singular: 'ब्यूटीशियन',
          plural: 'ब्यूटीशियन',
          variations: { makeup: 'मेकअप आर्टिस्ट' },
        },
        service: {
          singular: 'सेवा',
          plural: 'सेवाएं',
          variations: { bridal: 'दुल्हन सेवा' },
        },
      },
    },
  },
  
  modules: [
    {
      code: 'makeup-services',
      name: 'Makeup Services',
      description: 'Professional makeup application and artistry',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.BEAUTY_PARLOR],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        allowTrials: true,
        productTracking: true,
        beforeAfterPhotos: true,
      },
      permissions: [
        { action: 'create', resource: 'makeup_service' },
        { action: 'update', resource: 'makeup_service' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'makeup-services',
            label: 'Makeup Services',
            icon: 'palette',
            route: '/services/makeup',
            permissions: ['create:makeup_service'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'makeup-bookings',
            type: 'metric',
            title: 'Makeup Appointments Today',
            configuration: { metric: 'makeup_bookings_count' },
          },
        ],
        formFields: [
          {
            name: 'skinTone',
            type: 'select',
            label: 'Skin Tone',
            required: true,
            validation: { options: ['fair', 'medium', 'olive', 'dark', 'deep'] },
          },
          {
            name: 'makeupStyle',
            type: 'select',
            label: 'Makeup Style',
            required: true,
            validation: { options: ['natural', 'glamorous', 'dramatic', 'vintage'] },
          },
        ],
        customComponents: [
          {
            name: 'MakeupColorMatcher',
            props: { enableAI: true },
            conditions: { hasColorAnalysis: true },
          },
        ],
      },
    },
    {
      code: 'bridal-packages',
      name: 'Bridal Packages',
      description: 'Comprehensive bridal beauty packages and trials',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.BEAUTY_PARLOR],
      incompatibleWith: [],
      dependencies: ['makeup-services'],
      settings: {
        trialRequired: true,
        packageDiscounts: true,
        multiDayBooking: true,
      },
      permissions: [
        { action: 'create', resource: 'bridal_package' },
        { action: 'manage', resource: 'bridal_pricing' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'bridal-packages',
            label: 'Bridal Packages',
            icon: 'heart',
            route: '/packages/bridal',
            permissions: ['create:bridal_package'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'bridal-revenue',
            type: 'chart',
            title: 'Bridal Package Revenue',
            configuration: { chartType: 'bar', period: 'monthly' },
          },
        ],
        formFields: [
          {
            name: 'weddingDate',
            type: 'date',
            label: 'Wedding Date',
            required: true,
            validation: { minDate: 'today' },
          },
          {
            name: 'ceremonies',
            type: 'multiselect',
            label: 'Ceremonies',
            required: true,
            validation: { options: ['engagement', 'mehendi', 'sangeet', 'wedding', 'reception'] },
          },
        ],
        customComponents: [
          {
            name: 'BridalPackageBuilder',
            props: { allowCustomization: true },
            conditions: { packageType: 'custom' },
          },
        ],
      },
    },
    {
      code: 'hair-styling',
      name: 'Hair Styling',
      description: 'Professional hair styling and treatments',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.BEAUTY_PARLOR],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        styleGallery: true,
        hairAnalysis: true,
        productRecommendations: true,
      },
      permissions: [
        { action: 'create', resource: 'hair_service' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'hair-styling',
            label: 'Hair Styling',
            icon: 'scissors',
            route: '/services/hair',
            permissions: ['create:hair_service'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'hair-utilization',
            type: 'gauge',
            title: 'Hair Station Utilization',
            configuration: { target: 75 },
          },
        ],
        formFields: [
          {
            name: 'hairLength',
            type: 'select',
            label: 'Hair Length',
            required: true,
            validation: { options: ['short', 'medium', 'long', 'extra-long'] },
          },
          {
            name: 'hairTexture',
            type: 'select',
            label: 'Hair Texture',
            required: true,
            validation: { options: ['straight', 'wavy', 'curly', 'coily'] },
          },
        ],
        customComponents: [],
      },
    },
    {
      code: 'nail-services',
      name: 'Nail Services',
      description: 'Manicure, pedicure, and nail art services',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.BEAUTY_PARLOR],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        nailArt: true,
        gelServices: true,
        hygienePriority: true,
      },
      permissions: [
        { action: 'create', resource: 'nail_service' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'nail-services',
            label: 'Nail Services',
            icon: 'hand',
            route: '/services/nails',
            permissions: ['create:nail_service'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'nail-bookings',
            type: 'metric',
            title: 'Nail Appointments Today',
            configuration: { metric: 'nail_appointments_count' },
          },
        ],
        formFields: [
          {
            name: 'nailShape',
            type: 'select',
            label: 'Preferred Nail Shape',
            required: false,
            validation: { options: ['round', 'square', 'oval', 'almond', 'stiletto'] },
          },
        ],
        customComponents: [
          {
            name: 'NailArtGallery',
            props: { allowCustomDesigns: true },
            conditions: { serviceType: 'nail_art' },
          },
        ],
      },
    },
  ],
  
  services: [
    {
      name: 'Party Makeup',
      description: 'Glamorous makeup for special occasions and parties',
      category: 'makeup',
      basePrice: 2000,
      currency: 'INR',
      priceVariations: [
        { condition: 'makeup_style:dramatic', modifier: 500, type: 'fixed' },
        { condition: 'includes_lashes', modifier: 300, type: 'fixed' },
      ],
      duration: 90,
      bufferTime: 20,
      requiredResources: [
        { type: 'makeup_station', quantity: 1, optional: false },
        { type: 'lighting_setup', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'makeup_artist', skills: ['party_makeup', 'color_theory'], optional: false },
      ],
      categorySpecific: {
        beautyParlor: {
          skinType: 'all',
          bridalPackage: false,
          eventService: true,
        },
      },
    },
    {
      name: 'Bridal Makeup Trial',
      description: 'Complete bridal makeup trial with consultation',
      category: 'bridal',
      basePrice: 3500,
      currency: 'INR',
      priceVariations: [
        { condition: 'includes_hair_trial', modifier: 1500, type: 'fixed' },
        { condition: 'premium_products', modifier: 25, type: 'percentage' },
      ],
      duration: 150,
      bufferTime: 30,
      requiredResources: [
        { type: 'bridal_suite', quantity: 1, optional: false },
        { type: 'photography_setup', quantity: 1, optional: true },
      ],
      requiredStaff: [
        { role: 'bridal_specialist', skills: ['bridal_makeup', 'consultation'], optional: false },
      ],
      categorySpecific: {
        beautyParlor: {
          skinType: 'all',
          bridalPackage: true,
          eventService: true,
        },
      },
    },
    {
      name: 'Hair Styling & Blowdry',
      description: 'Professional hair styling with blowdry finish',
      category: 'hair',
      basePrice: 1200,
      currency: 'INR',
      priceVariations: [
        { condition: 'hair_length:long', modifier: 300, type: 'fixed' },
        { condition: 'complex_style', modifier: 500, type: 'fixed' },
      ],
      duration: 75,
      bufferTime: 15,
      requiredResources: [
        { type: 'hair_station', quantity: 1, optional: false },
        { type: 'wash_basin', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'hair_stylist', skills: ['styling', 'blowdry'], optional: false },
      ],
      categorySpecific: {
        beautyParlor: {
          skinType: 'all',
          bridalPackage: true,
          eventService: true,
        },
      },
    },
    {
      name: 'Gel Manicure with Nail Art',
      description: 'Long-lasting gel manicure with custom nail art',
      category: 'nails',
      basePrice: 1800,
      currency: 'INR',
      priceVariations: [
        { condition: 'complex_art', modifier: 500, type: 'fixed' },
        { condition: 'premium_gel', modifier: 200, type: 'fixed' },
      ],
      duration: 90,
      bufferTime: 10,
      requiredResources: [
        { type: 'nail_station', quantity: 1, optional: false },
        { type: 'uv_lamp', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'nail_technician', skills: ['gel_application', 'nail_art'], optional: false },
      ],
      categorySpecific: {
        beautyParlor: {
          skinType: 'all',
          bridalPackage: true,
          eventService: false,
        },
      },
    },
    {
      name: 'Complete Bridal Package',
      description: 'Full bridal makeover including makeup, hair, and nails',
      category: 'bridal_package',
      basePrice: 15000,
      currency: 'INR',
      priceVariations: [
        { condition: 'multiple_ceremonies', modifier: 5000, type: 'fixed' },
        { condition: 'home_service', modifier: 30, type: 'percentage' },
      ],
      duration: 240, // 4 hours
      bufferTime: 60,
      requiredResources: [
        { type: 'bridal_suite', quantity: 1, optional: false },
        { type: 'makeup_station', quantity: 1, optional: false },
        { type: 'hair_station', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'bridal_specialist', skills: ['bridal_makeup'], optional: false },
        { role: 'hair_stylist', skills: ['bridal_hair'], optional: false },
        { role: 'nail_technician', skills: ['bridal_nails'], optional: true },
      ],
      categorySpecific: {
        beautyParlor: {
          skinType: 'all',
          bridalPackage: true,
          eventService: true,
        },
      },
    },
  ],
  
  workflows: [
    {
      id: 'bridal-consultation-workflow',
      name: 'Bridal Consultation Workflow',
      description: 'Comprehensive bridal consultation and trial scheduling',
      category: [BusinessCategory.BEAUTY_PARLOR],
      triggers: [
        { type: 'booking_created', conditions: { serviceCategory: 'bridal' } },
      ],
      conditions: [
        { field: 'service.isBridalService', operator: 'equals', value: true },
      ],
      actions: [
        {
          type: 'send_message',
          parameters: {
            template: 'bridal_welcome',
            delay: 0,
          },
        },
        {
          type: 'create_booking',
          parameters: {
            serviceType: 'bridal_consultation',
            scheduleBefore: 'main_service',
            duration: 30,
          },
        },
        {
          type: 'send_message',
          parameters: {
            template: 'bridal_preparation_guide',
            delay: 86400, // 24 hours before trial
          },
        },
      ],
      isActive: true,
      priority: 1,
    },
    {
      id: 'post-service-photos',
      name: 'Post-Service Photo Collection',
      description: 'Collect before/after photos for portfolio',
      category: [BusinessCategory.BEAUTY_PARLOR],
      triggers: [
        { type: 'service_complete', conditions: { allowPhotos: true } },
      ],
      conditions: [
        { field: 'client.consentPhotos', operator: 'equals', value: true },
      ],
      actions: [
        {
          type: 'trigger_integration',
          parameters: {
            action: 'capture_photos',
            type: 'before_after',
          },
        },
        {
          type: 'send_message',
          parameters: {
            template: 'photo_sharing_request',
            delay: 1800, // 30 minutes after service
          },
        },
      ],
      isActive: true,
      priority: 2,
    },
    {
      id: 'product-recommendation',
      name: 'Product Recommendation Follow-up',
      description: 'Send personalized product recommendations',
      category: [BusinessCategory.BEAUTY_PARLOR],
      triggers: [
        { type: 'service_complete', conditions: { serviceType: 'any' } },
      ],
      conditions: [
        { field: 'service.usedProducts', operator: 'not_equals', value: null },
      ],
      actions: [
        {
          type: 'send_message',
          parameters: {
            template: 'product_recommendations',
            delay: 7200, // 2 hours after service
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
        id: 'bridal_booking_conversion',
        name: 'Bridal Booking Conversion Rate',
        description: 'Percentage of bridal trials that convert to full packages',
        category: [BusinessCategory.BEAUTY_PARLOR],
        formula: 'bridal_package_bookings / bridal_trial_bookings * 100',
        aggregation: 'percentage',
        timeframe: 'monthly',
      },
      {
        id: 'service_mix_revenue',
        name: 'Service Mix Revenue',
        description: 'Revenue distribution across different service categories',
        category: [BusinessCategory.BEAUTY_PARLOR],
        formula: 'category_revenue / total_revenue * 100',
        aggregation: 'percentage',
        timeframe: 'weekly',
      },
      {
        id: 'client_retention_rate',
        name: 'Client Retention Rate',
        description: 'Percentage of clients returning within 3 months',
        category: [BusinessCategory.BEAUTY_PARLOR],
        formula: 'returning_clients / total_clients * 100',
        aggregation: 'percentage',
        timeframe: 'monthly',
      },
    ],
    dashboards: [
      {
        id: 'beauty_parlor_overview',
        name: 'Beauty Parlor Overview',
        category: [BusinessCategory.BEAUTY_PARLOR],
        widgets: [
          {
            id: 'bridal_conversion_gauge',
            type: 'gauge',
            title: 'Bridal Conversion Rate',
            metricIds: ['bridal_booking_conversion'],
            configuration: { target: 70, warningThreshold: 50 },
          },
          {
            id: 'service_revenue_chart',
            type: 'chart',
            title: 'Service Revenue Mix',
            metricIds: ['service_mix_revenue'],
            configuration: { chartType: 'pie', showPercentages: true },
          },
        ],
      },
    ],
    reports: [
      {
        id: 'monthly_beauty_report',
        name: 'Monthly Beauty Parlor Report',
        description: 'Comprehensive monthly performance and client analysis',
        category: [BusinessCategory.BEAUTY_PARLOR],
        schedule: {
          frequency: 'monthly',
          time: '09:00',
          recipients: ['owner', 'manager'],
        },
      },
    ],
  },
  
  integrations: [
    {
      id: 'beauty_product_catalog',
      name: 'Beauty Product Catalog Integration',
      description: 'Integration with beauty product suppliers and catalogs',
      category: [BusinessCategory.BEAUTY_PARLOR],
      provider: 'beauty_supplier',
      apiVersion: 'v1',
      endpoints: [
        {
          name: 'sync_products',
          url: '/api/products/beauty',
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          parameters: {},
        },
      ],
      authType: 'api_key',
      credentials: {},
      dataMapping: [
        { sourceField: 'product_id', targetField: 'external_product_id', required: true },
        { sourceField: 'product_price', targetField: 'retail_price', required: true },
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
          primary: '#E91E63', // Beauty pink
          secondary: '#FCE4EC',
          accent: '#C2185B',
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