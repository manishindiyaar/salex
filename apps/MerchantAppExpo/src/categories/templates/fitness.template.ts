/**
 * Fitness Center Template Configuration
 * 
 * Complete template configuration for fitness center businesses.
 * Defines fitness-specific terminology, modules, services, and workflows.
 */

import { BusinessCategory } from '../../types/business';
import { NicheTemplate } from '../core/types';

export const fitnessTemplate: NicheTemplate = {
  id: 'fitness-template-v1',
  code: BusinessCategory.FITNESS,
  displayName: 'Fitness Center',
  icon: '💪',
  description: 'Personal training, group classes, and fitness programs',
  
  // Core configurations
  terminology: {
    // Core entities
    customer: {
      singular: 'member',
      plural: 'members',
      variations: {
        formal: 'valued member',
        new: 'new member',
        premium: 'premium member',
      },
      description: 'Fitness center member or client',
    },
    staff: {
      singular: 'trainer',
      plural: 'trainers',
      variations: {
        personal: 'personal trainer',
        group: 'group instructor',
        specialist: 'fitness specialist',
      },
      description: 'Fitness professional or instructor',
    },
    service: {
      singular: 'session',
      plural: 'sessions',
      variations: {
        training: 'training session',
        class: 'fitness class',
        program: 'fitness program',
      },
      description: 'Fitness training or class session',
    },
    appointment: {
      singular: 'booking',
      plural: 'bookings',
      variations: {
        session: 'training session',
        class: 'class booking',
        slot: 'time slot',
      },
      description: 'Scheduled fitness session',
    },
    resource: {
      singular: 'equipment',
      plural: 'equipment',
      variations: {
        room: 'training room',
        studio: 'fitness studio',
        machine: 'exercise machine',
      },
      description: 'Fitness equipment or training space',
    },
    
    // Actions
    book: {
      singular: 'book',
      plural: 'book',
      variations: {
        session: 'book session',
        class: 'join class',
        program: 'enroll in program',
      },
    },
    schedule: {
      singular: 'schedule',
      plural: 'schedule',
      variations: {
        training: 'schedule training',
        workout: 'plan workout',
      },
    },
    cancel: {
      singular: 'cancel',
      plural: 'cancel',
      variations: {
        booking: 'cancel booking',
        session: 'cancel session',
      },
    },
    complete: {
      singular: 'complete',
      plural: 'complete',
      variations: {
        workout: 'finish workout',
        session: 'complete session',
      },
    },
    
    // Contexts
    contexts: {
      training: {
        singular: 'training program',
        plural: 'training programs',
        variations: {
          personal: 'personal training',
          group: 'group training',
        },
      },
      membership: {
        singular: 'membership',
        plural: 'memberships',
        variations: {
          plan: 'membership plan',
          package: 'fitness package',
        },
      },
    },
    
    // Multi-language support
    languages: {
      hi: {
        customer: {
          singular: 'सदस्य',
          plural: 'सदस्य',
          variations: { new: 'नया सदस्य' },
        },
        staff: {
          singular: 'प्रशिक्षक',
          plural: 'प्रशिक्षक',
          variations: { personal: 'व्यक्तिगत प्रशिक्षक' },
        },
        service: {
          singular: 'सत्र',
          plural: 'सत्र',
          variations: { training: 'प्रशिक्षण सत्र' },
        },
      },
    },
  },
  
  modules: [
    {
      code: 'personal-training',
      name: 'Personal Training',
      description: 'One-on-one personal training sessions',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.FITNESS],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        fitnessAssessment: true,
        goalTracking: true,
        progressMonitoring: true,
      },
      permissions: [
        { action: 'create', resource: 'personal_training' },
        { action: 'update', resource: 'training_plan' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'personal-training',
            label: 'Personal Training',
            icon: 'user',
            route: '/training/personal',
            permissions: ['create:personal_training'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'pt-sessions-today',
            type: 'metric',
            title: 'PT Sessions Today',
            configuration: { metric: 'pt_sessions_count' },
          },
        ],
        formFields: [
          {
            name: 'fitnessLevel',
            type: 'select',
            label: 'Fitness Level',
            required: true,
            validation: { options: ['beginner', 'intermediate', 'advanced'] },
          },
          {
            name: 'fitnessGoals',
            type: 'multiselect',
            label: 'Fitness Goals',
            required: true,
            validation: { options: ['weight_loss', 'muscle_gain', 'endurance', 'strength'] },
          },
        ],
        customComponents: [
          {
            name: 'FitnessAssessment',
            props: { includeBodyComposition: true },
            conditions: { isNewMember: true },
          },
        ],
      },
    },
    {
      code: 'group-classes',
      name: 'Group Classes',
      description: 'Group fitness classes and programs',
      category: 'booking',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.FITNESS],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        classCapacity: true,
        waitingList: true,
        classPackages: true,
      },
      permissions: [
        { action: 'create', resource: 'group_class' },
        { action: 'manage', resource: 'class_schedule' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'group-classes',
            label: 'Group Classes',
            icon: 'users',
            route: '/classes',
            permissions: ['create:group_class'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'class-utilization',
            type: 'gauge',
            title: 'Class Utilization',
            configuration: { target: 80 },
          },
        ],
        formFields: [
          {
            name: 'classType',
            type: 'select',
            label: 'Class Type',
            required: true,
            validation: { options: ['yoga', 'pilates', 'hiit', 'cardio', 'strength'] },
          },
          {
            name: 'intensity',
            type: 'select',
            label: 'Intensity Level',
            required: true,
            validation: { options: ['low', 'moderate', 'high'] },
          },
        ],
        customComponents: [
          {
            name: 'ClassScheduleGrid',
            props: { showCapacity: true },
            conditions: { viewType: 'schedule' },
          },
        ],
      },
    },
    {
      code: 'membership-management',
      name: 'Membership Management',
      description: 'Fitness membership plans and billing',
      category: 'management',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.FITNESS],
      incompatibleWith: [],
      dependencies: [],
      settings: {
        membershipTiers: true,
        autoRenewal: true,
        freezeOptions: true,
      },
      permissions: [
        { action: 'create', resource: 'membership' },
        { action: 'manage', resource: 'billing' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'memberships',
            label: 'Memberships',
            icon: 'credit-card',
            route: '/memberships',
            permissions: ['create:membership'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'membership-revenue',
            type: 'chart',
            title: 'Membership Revenue',
            configuration: { chartType: 'area', period: 'monthly' },
          },
          {
            id: 'member-retention',
            type: 'metric',
            title: 'Member Retention Rate',
            configuration: { metric: 'retention_percentage' },
          },
        ],
        formFields: [
          {
            name: 'membershipType',
            type: 'select',
            label: 'Membership Type',
            required: true,
            validation: { options: ['basic', 'premium', 'vip', 'student'] },
          },
        ],
        customComponents: [],
      },
    },
    {
      code: 'progress-tracking',
      name: 'Progress Tracking',
      description: 'Member fitness progress and analytics',
      category: 'analytics',
      enabledByDefault: true,
      requiredForCategories: [BusinessCategory.FITNESS],
      incompatibleWith: [],
      dependencies: ['personal-training'],
      settings: {
        bodyMetrics: true,
        workoutLogs: true,
        progressPhotos: true,
      },
      permissions: [
        { action: 'view', resource: 'member_progress' },
        { action: 'update', resource: 'fitness_metrics' },
      ],
      uiConfig: {
        menuItems: [
          {
            id: 'progress-tracking',
            label: 'Progress Tracking',
            icon: 'trending-up',
            route: '/progress',
            permissions: ['view:member_progress'],
          },
        ],
        dashboardWidgets: [
          {
            id: 'member-progress',
            type: 'chart',
            title: 'Member Progress Overview',
            configuration: { chartType: 'line', showGoals: true },
          },
        ],
        formFields: [
          {
            name: 'bodyWeight',
            type: 'number',
            label: 'Body Weight (kg)',
            required: false,
            validation: { min: 30, max: 200 },
          },
          {
            name: 'bodyFatPercentage',
            type: 'number',
            label: 'Body Fat %',
            required: false,
            validation: { min: 5, max: 50 },
          },
        ],
        customComponents: [
          {
            name: 'ProgressChart',
            props: { showTrends: true },
            conditions: { hasProgressData: true },
          },
        ],
      },
    },
  ],
  
  services: [
    {
      name: 'Personal Training Session',
      description: 'One-on-one training with certified personal trainer',
      category: 'personal_training',
      basePrice: 1500,
      currency: 'INR',
      priceVariations: [
        { condition: 'trainer_level:master', modifier: 500, type: 'fixed' },
        { condition: 'session_package:10', modifier: -10, type: 'percentage' },
      ],
      duration: 60,
      bufferTime: 15,
      requiredResources: [
        { type: 'training_area', quantity: 1, optional: false },
        { type: 'equipment_set', quantity: 1, optional: true },
      ],
      requiredStaff: [
        { role: 'personal_trainer', skills: ['fitness_training', 'goal_setting'], optional: false },
      ],
      categorySpecific: {
        fitness: {
          fitnessLevel: 'all',
          equipmentRequired: ['dumbbells', 'resistance_bands'],
          groupSize: 1,
        },
      },
    },
    {
      name: 'HIIT Group Class',
      description: 'High-intensity interval training group class',
      category: 'group_class',
      basePrice: 500,
      currency: 'INR',
      priceVariations: [
        { condition: 'class_package:unlimited', modifier: -20, type: 'percentage' },
        { condition: 'peak_hours', modifier: 100, type: 'fixed' },
      ],
      duration: 45,
      bufferTime: 10,
      requiredResources: [
        { type: 'group_studio', quantity: 1, optional: false },
        { type: 'sound_system', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'group_instructor', skills: ['hiit_training', 'group_motivation'], optional: false },
      ],
      categorySpecific: {
        fitness: {
          fitnessLevel: 'intermediate',
          equipmentRequired: ['mats', 'kettlebells'],
          groupSize: 15,
        },
      },
    },
    {
      name: 'Yoga Class',
      description: 'Relaxing yoga session for flexibility and mindfulness',
      category: 'group_class',
      basePrice: 400,
      currency: 'INR',
      priceVariations: [
        { condition: 'instructor_level:certified', modifier: 100, type: 'fixed' },
        { condition: 'morning_class', modifier: -50, type: 'fixed' },
      ],
      duration: 75,
      bufferTime: 15,
      requiredResources: [
        { type: 'yoga_studio', quantity: 1, optional: false },
        { type: 'yoga_props', quantity: 1, optional: false },
      ],
      requiredStaff: [
        { role: 'yoga_instructor', skills: ['yoga_instruction', 'meditation'], optional: false },
      ],
      categorySpecific: {
        fitness: {
          fitnessLevel: 'beginner',
          equipmentRequired: ['yoga_mats', 'blocks', 'straps'],
          groupSize: 20,
        },
      },
    },
    {
      name: 'Fitness Assessment',
      description: 'Comprehensive fitness evaluation and goal setting',
      category: 'assessment',
      basePrice: 800,
      currency: 'INR',
      priceVariations: [
        { condition: 'includes_body_composition', modifier: 300, type: 'fixed' },
        { condition: 'detailed_report', modifier: 200, type: 'fixed' },
      ],
      duration: 90,
      bufferTime: 20,
      requiredResources: [
        { type: 'assessment_room', quantity: 1, optional: false },
        { type: 'body_composition_analyzer', quantity: 1, optional: true },
      ],
      requiredStaff: [
        { role: 'fitness_assessor', skills: ['fitness_testing', 'goal_planning'], optional: false },
      ],
      categorySpecific: {
        fitness: {
          fitnessLevel: 'all',
          equipmentRequired: ['measuring_tools', 'assessment_forms'],
          groupSize: 1,
        },
      },
    },
  ],
  
  workflows: [
    {
      id: 'new-member-onboarding',
      name: 'New Member Onboarding',
      description: 'Complete onboarding process for new fitness members',
      category: [BusinessCategory.FITNESS],
      triggers: [
        { type: 'booking_created', conditions: { memberType: 'new' } },
      ],
      conditions: [
        { field: 'member.isNew', operator: 'equals', value: true },
      ],
      actions: [
        {
          type: 'create_booking',
          parameters: {
            serviceType: 'fitness_assessment',
            priority: 'high',
            complimentary: true,
          },
        },
        {
          type: 'send_message',
          parameters: {
            template: 'welcome_new_member',
            delay: 0,
          },
        },
        {
          type: 'send_message',
          parameters: {
            template: 'gym_orientation_guide',
            delay: 3600, // 1 hour after signup
          },
        },
      ],
      isActive: true,
      priority: 1,
    },
    {
      id: 'workout-completion-tracking',
      name: 'Workout Completion Tracking',
      description: 'Track and celebrate workout completions',
      category: [BusinessCategory.FITNESS],
      triggers: [
        { type: 'service_complete', conditions: { serviceType: 'training' } },
      ],
      conditions: [
        { field: 'session.completed', operator: 'equals', value: true },
      ],
      actions: [
        {
          type: 'update_record',
          parameters: {
            entity: 'member_progress',
            action: 'log_workout',
            includeMetrics: true,
          },
        },
        {
          type: 'send_message',
          parameters: {
            template: 'workout_completion_celebration',
            delay: 300, // 5 minutes after workout
          },
        },
      ],
      isActive: true,
      priority: 2,
    },
    {
      id: 'membership-renewal-reminder',
      name: 'Membership Renewal Reminder',
      description: 'Remind members about upcoming membership expiry',
      category: [BusinessCategory.FITNESS],
      triggers: [
        { type: 'time_based', conditions: { schedule: 'daily' } },
      ],
      conditions: [
        { field: 'membership.expiryDate', operator: 'less_than', value: '7_days' },
      ],
      actions: [
        {
          type: 'send_message',
          parameters: {
            template: 'membership_renewal_reminder',
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
        id: 'member_attendance_rate',
        name: 'Member Attendance Rate',
        description: 'Average attendance rate of active members',
        category: [BusinessCategory.FITNESS],
        formula: 'attended_sessions / scheduled_sessions * 100',
        aggregation: 'percentage',
        timeframe: 'monthly',
      },
      {
        id: 'trainer_utilization',
        name: 'Trainer Utilization Rate',
        description: 'Percentage of trainer time that is booked',
        category: [BusinessCategory.FITNESS],
        formula: 'booked_trainer_hours / available_trainer_hours * 100',
        aggregation: 'percentage',
        timeframe: 'weekly',
      },
      {
        id: 'class_fill_rate',
        name: 'Class Fill Rate',
        description: 'Average percentage of class capacity filled',
        category: [BusinessCategory.FITNESS],
        formula: 'class_attendees / class_capacity * 100',
        aggregation: 'percentage',
        timeframe: 'weekly',
      },
      {
        id: 'member_progress_score',
        name: 'Member Progress Score',
        description: 'Average progress score based on goal achievement',
        category: [BusinessCategory.FITNESS],
        formula: 'sum(progress_scores) / active_members',
        aggregation: 'average',
        timeframe: 'monthly',
      },
    ],
    dashboards: [
      {
        id: 'fitness_center_dashboard',
        name: 'Fitness Center Dashboard',
        category: [BusinessCategory.FITNESS],
        widgets: [
          {
            id: 'attendance_gauge',
            type: 'gauge',
            title: 'Member Attendance Rate',
            metricIds: ['member_attendance_rate'],
            configuration: { target: 75, warningThreshold: 60 },
          },
          {
            id: 'utilization_chart',
            type: 'chart',
            title: 'Trainer Utilization Trend',
            metricIds: ['trainer_utilization'],
            configuration: { chartType: 'area', period: 'month' },
          },
          {
            id: 'class_performance',
            type: 'metric',
            title: 'Class Fill Rate',
            metricIds: ['class_fill_rate'],
            configuration: { showTrend: true },
          },
        ],
      },
    ],
    reports: [
      {
        id: 'monthly_fitness_report',
        name: 'Monthly Fitness Center Report',
        description: 'Comprehensive monthly performance and member progress report',
        category: [BusinessCategory.FITNESS],
        schedule: {
          frequency: 'monthly',
          time: '08:00',
          recipients: ['gym_manager', 'owner'],
        },
      },
    ],
  },
  
  integrations: [
    {
      id: 'fitness_app_integration',
      name: 'Fitness App Integration',
      description: 'Integration with popular fitness tracking apps',
      category: [BusinessCategory.FITNESS],
      provider: 'fitness_tracker',
      apiVersion: 'v1',
      endpoints: [
        {
          name: 'sync_workouts',
          url: '/api/fitness/workouts',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          parameters: {},
        },
      ],
      authType: 'oauth',
      credentials: {},
      dataMapping: [
        { sourceField: 'workout_id', targetField: 'external_workout_id', required: true },
        { sourceField: 'calories_burned', targetField: 'session_calories', required: false },
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
          primary: '#FF5722', // Fitness orange
          secondary: '#FFF3E0',
          accent: '#E64A19',
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