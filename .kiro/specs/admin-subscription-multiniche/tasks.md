# Implementation Plan: Admin Dashboard, Subscription System & Multi-Niche Architecture

## Overview

This implementation plan follows a phased approach: Foundation (database + basic admin), Plan Enforcement (feature access), Multi-Niche (templates + terminology). Tasks are ordered to deliver incremental value with each phase.

## Tasks

- [x] 1. Database Schema Updates
  - [x] 1.1 Add subscription and payment models to Prisma schema
    - Add SubscriptionPlan and SubscriptionStatus enums
    - Add Subscription model with businessId, plan, status, trialEndsAt, currentPeriodStart, currentPeriodEnd, cancelledAt
    - Add PaymentRecord model with subscriptionId, amount, currency, paymentMethod, transactionRef, periodStart, periodEnd, recordedBy
    - Add relation from Business to Subscription (one-to-one)
    - _Requirements: 4.7, 6.6_

  - [x] 1.2 Add admin user and audit log models
    - Add AdminRole enum (SUPER_ADMIN, ADMIN, SUPPORT)
    - Add AdminUser model with email, name, role, isActive
    - Add AuditLog model with adminId, action, entityType, entityId, changes, reason, timestamp
    - _Requirements: 1.7, 14.1, 14.2, 14.3, 14.4_

  - [x] 1.3 Add niche template and feature module models
    - Add NicheTemplate model with code, displayName, icon, terminology, enabledModules, defaultServices, defaultHours, messageTemplates
    - Add FeatureModule model with code, name, description, plans
    - Add BusinessModuleConfig model with businessId, moduleCode, isEnabled
    - Add BusinessCategory enum to Business model
    - Add isActive field to Business model (default true)
    - _Requirements: 7.2, 7.4, 8.1_

  - [x] 1.4 Run database migration and generate Prisma client
    - Run pnpm db:push in packages/shared-types
    - Run pnpm db:generate to update Prisma client
    - _Requirements: All data model requirements_

- [x] 2. Subscription Service Implementation
  - [x] 2.1 Create subscription service with state management
    - Implement createTrialSubscription(businessId) - creates subscription with TRIAL status and 7-day trial
    - Implement transitionStatus(subscriptionId, newStatus) - enforces state machine transitions
    - Implement getSubscriptionByBusinessId(businessId)
    - _Requirements: 4.2, 4.3, 4.6_

  - [ ]* 2.2 Write property test for subscription state machine
    - **Property 7: Subscription State Machine Transitions**
    - Test that only valid transitions are allowed (TRIAL→ACTIVE, TRIAL→EXPIRED, ACTIVE→GRACE, etc.)
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.6**

  - [x] 2.3 Implement payment recording functionality
    - Implement recordPayment(subscriptionId, paymentInput) - creates PaymentRecord and activates subscription
    - Calculate currentPeriodEnd as periodStart + 30 days
    - Update subscription status to ACTIVE
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 2.4 Write property test for payment recording side effects
    - **Property 9: Payment Recording Side Effects**
    - Test that payment creates record, activates subscription, sets period end correctly
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 3. Feature Access Service Implementation
  - [x] 3.1 Create feature access service with plan-based access control
    - Implement canAccessFeature(businessId, featureCode) returning { allowed, reason, suggestedPlan }
    - Check business.isActive first
    - Check subscription.status is TRIAL or ACTIVE
    - Check feature is included in plan's feature list
    - Check module is enabled for business
    - Return clear denial reason for each check
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 3.2 Write property test for feature access control matrix
    - **Property 8: Feature Access Control Matrix**
    - Test all access control checks in order with various business/subscription states
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

  - [x] 3.3 Implement getAvailableFeatures(businessId)
    - Return list of all features the business can access based on plan and modules
    - _Requirements: 5.5_

- [ ] 4. Checkpoint - Core Services Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Admin Authentication Implementation
  - [x] 5.1 Create admin auth middleware
    - Verify JWT token from Authorization header
    - Lookup AdminUser by email from token
    - Return 401 for missing/invalid token
    - Return 403 for non-admin users
    - Attach adminUser to request object
    - _Requirements: 1.4, 1.5, 1.6_

  - [ ]* 5.2 Write property test for admin authentication security
    - **Property 1: Admin Authentication Security**
    - Test that all admin endpoints return 401 without valid token
    - **Validates: Requirements 1.5**

  - [ ]* 5.3 Write property test for admin authorization enforcement
    - **Property 2: Admin Authorization Enforcement**
    - Test that admin endpoints return 403 for non-admin users
    - **Validates: Requirements 1.6**

  - [x] 5.4 Create admin auth controller and routes
    - POST /v1/admin/auth/login - authenticate with email/password via Supabase
    - POST /v1/admin/auth/logout - invalidate session
    - GET /v1/admin/auth/me - get current admin user
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 6. Admin Business Management API
  - [x] 6.1 Create admin business controller
    - GET /v1/admin/businesses - list all businesses with pagination, search, filter
    - GET /v1/admin/businesses/:id - get business details with subscription, bookings, revenue
    - POST /v1/admin/businesses/:id/toggle - toggle isActive status
    - PATCH /v1/admin/businesses/:id/plan - change subscription plan
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.5_

  - [ ]* 6.2 Write property test for business search completeness
    - **Property 3: Business Search Completeness**
    - Test that search results match query against name, phone, or routingCode
    - **Validates: Requirements 2.2**

  - [ ]* 6.3 Write property test for business filter accuracy
    - **Property 4: Business Filter Accuracy**
    - Test that filtered results match filter criteria exactly
    - **Validates: Requirements 2.3**

  - [ ]* 6.4 Write property test for business status toggle persistence
    - **Property 5: Business Status Toggle Persistence**
    - Test that toggle updates database and creates audit log
    - **Validates: Requirements 3.1, 3.7, 14.1**

- [x] 7. Audit Log Service Implementation
  - [x] 7.1 Create audit log service
    - Implement logAction(adminId, action, entityType, entityId, changes, reason)
    - Implement getAuditLogs(filters) with pagination
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 7.2 Write property test for audit log completeness
    - **Property 16: Audit Log Completeness**
    - Test that all admin actions create audit log entries with required fields
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4**

- [x] 8. Admin Payment Management API
  - [x] 8.1 Create admin payment controller
    - POST /v1/admin/payments - record manual payment
    - GET /v1/admin/payments - list all payments with pagination and date filter
    - GET /v1/admin/businesses/:id/payments - get business payment history
    - _Requirements: 6.1, 6.4, 6.5_

  - [ ]* 8.2 Write property test for revenue calculation accuracy
    - **Property 10: Revenue Calculation Accuracy**
    - Test that revenue totals match sum of payments in date range
    - **Validates: Requirements 6.5**

- [ ] 9. Checkpoint - Admin API Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Niche Template Service Implementation
  - [x] 10.1 Create niche template service
    - Implement getTemplate(code) - get template by category code
    - Implement getAllTemplates() - list all active templates
    - Implement createTemplate(data) - create new template
    - Implement updateTemplate(code, data) - update existing template
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 10.2 Implement template application to business
    - Implement applyTemplate(businessId, templateCode)
    - Create BusinessModuleConfig entries for enabled modules
    - Store template defaults in business context
    - _Requirements: 7.5, 8.2_

  - [ ]* 10.3 Write property test for niche template application
    - **Property 11: Niche Template Application**
    - Test that template defaults are applied correctly during onboarding
    - **Validates: Requirements 7.5, 10.4, 10.5, 8.2**

  - [x] 10.4 Implement terminology retrieval
    - Implement getTerminology(category) - return TerminologyConfig for category
    - _Requirements: 7.4, 9.1, 9.2, 9.3_

- [x] 11. Admin Template Management API
  - [x] 11.1 Create admin template controller
    - GET /v1/admin/templates - list all niche templates
    - GET /v1/admin/templates/:code - get template by code
    - POST /v1/admin/templates - create new template
    - PATCH /v1/admin/templates/:code - update template
    - DELETE /v1/admin/templates/:code - delete template
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 12. Admin Module Override API
  - [x] 12.1 Create business module management endpoints
    - GET /v1/admin/businesses/:id/modules - get business module configs
    - PATCH /v1/admin/businesses/:id/modules - update module enablement
    - Log module changes to audit log
    - _Requirements: 8.3, 8.5, 14.4_

- [x] 13. System Health and Stats API
  - [x] 13.1 Create admin health controller
    - GET /v1/admin/health - check API, Database, WhatsApp API, Supabase status
    - GET /v1/admin/stats - platform statistics (total businesses, active, revenue, bookings)
    - _Requirements: 13.1, 13.4, 13.5, 2.5_

  - [ ]* 13.2 Write property test for health endpoint completeness
    - **Property 15: Health Endpoint Completeness**
    - Test that health endpoint returns status for all dependent services
    - **Validates: Requirements 13.5**

- [x] 14. Data Export API
  - [x] 14.1 Create admin export controller
    - GET /v1/admin/export/businesses - export businesses to CSV
    - GET /v1/admin/export/payments - export payments to CSV
    - _Requirements: 2.6_

  - [ ]* 14.2 Write property test for CSV export accuracy
    - **Property 6: Business Export Completeness**
    - Test that exported CSV contains all selected fields
    - **Validates: Requirements 2.6**

- [x] 15. Checkpoint - Backend Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. WhatsApp Routing Updates
  - [x] 16.1 Update routing service for inactive business handling
    - Check business.isActive before processing messages
    - Return "This business is temporarily unavailable" for inactive businesses
    - _Requirements: 3.2_

  - [x] 16.2 Update routing service for plan-based access
    - Check canAccessFeature(businessId, 'whatsapp_booking') before booking flow
    - Return "Please call business directly" for BASIC plan businesses
    - _Requirements: 5.3_

  - [ ]* 16.3 Write property test for inactive business booking restriction
    - **Property 6: Inactive Business Booking Restriction**
    - Test that inactive businesses cannot receive new bookings
    - **Validates: Requirements 3.2, 3.4**

- [x] 17. WhatsApp Message Customization
  - [x] 17.1 Update conversation service for template-based messages
    - Use business's niche template for welcome message
    - Apply terminology to service list messages
    - Apply terminology to booking confirmation messages
    - Substitute placeholders with actual data
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [ ]* 17.2 Write property test for WhatsApp message customization
    - **Property 13: WhatsApp Message Customization**
    - Test that messages use correct templates and terminology
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.5**

- [ ] 18. Checkpoint - WhatsApp Integration Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Merchant App - Subscription Display
  - [x] 19.1 Create subscription display components
    - Create SubscriptionCard component showing plan, status, billing date
    - Create TrialBanner showing days remaining
    - Create GraceBanner with payment instructions
    - Create ExpiredAlert with contact information
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 19.2 Update ProfileScreen with subscription info
    - Display SubscriptionCard with current plan and status
    - Show appropriate banner based on subscription status
    - _Requirements: 12.1_

  - [ ]* 19.3 Write property test for trial days calculation
    - **Property 14: Trial Days Calculation**
    - Test that days remaining is calculated correctly
    - **Validates: Requirements 12.2**

- [x] 20. Merchant App - Feature Gating
  - [x] 20.1 Create useFeatureAccess hook
    - Implement hook that checks feature availability via API
    - Cache results for performance
    - _Requirements: 5.6_

  - [x] 20.2 Create UpgradePrompt component
    - Display when feature is restricted by plan
    - Show plan comparison and upgrade instructions
    - _Requirements: 12.6_

  - [x] 20.3 Gate WhatsApp booking features for BASIC plan
    - Hide WhatsApp-related UI for BASIC plan businesses
    - Show UpgradePrompt when attempting to access
    - _Requirements: 5.3_

- [x] 21. Merchant App - Dynamic Terminology
  - [x] 21.1 Create useCategoryConfig hook
    - Fetch terminology based on business category
    - Provide terminology values to components
    - _Requirements: 9.4_

  - [x] 21.2 Update ResourceManagementScreen with dynamic terminology
    - Use config.resourcePlural for screen title
    - Use config.resource for individual items
    - _Requirements: 9.1, 9.5_

  - [x] 21.3 Update StaffManagementScreen with dynamic terminology
    - Use config.staffPlural for screen title
    - Use config.staff for individual items
    - _Requirements: 9.2, 9.5_

  - [ ]* 21.4 Write property test for terminology substitution consistency
    - **Property 12: Terminology Substitution Consistency**
    - Test that terminology is applied consistently across screens
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.5, 10.2, 10.3**

- [x] 22. Merchant App - Dynamic Onboarding
  - [x] 22.1 Update onboarding flow to load niche template
    - Fetch template when business type is selected
    - Store template in onboarding context
    - _Requirements: 10.1_

  - [x] 22.2 Update ResourceSetupScreen with template terminology
    - Use template's resource terminology in prompts
    - _Requirements: 10.2_

  - [x] 22.3 Update StaffSetupScreen with template terminology
    - Use template's staff terminology in prompts
    - _Requirements: 10.3_

  - [x] 22.4 Update ServiceSetupScreen with template defaults
    - Pre-populate with template's default services
    - _Requirements: 10.4_

  - [x] 22.5 Update HoursSetupScreen with template defaults
    - Pre-fill with template's default hours
    - _Requirements: 10.5_

  - [x] 22.6 Conditionally show onboarding steps based on enabled modules
    - Only show steps relevant to enabled modules
    - _Requirements: 10.6_

- [x] 23. Merchant App - Inactive Business Handling
  - [x] 23.1 Create AccountSuspendedBanner component
    - Prominent banner for inactive businesses
    - Display contact information for support
    - _Requirements: 3.3_

  - [x] 23.2 Update app to check business active status
    - Show AccountSuspendedBanner when isActive=false
    - Disable booking creation when inactive
    - _Requirements: 3.3, 3.4_

- [ ] 24. Checkpoint - Merchant App Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Admin Dashboard - Project Setup
  - [x] 25.1 Create admin dashboard React + Vite project
    - Initialize apps/admin-dashboard with Vite + React + TypeScript
    - Add Tailwind CSS and shadcn/ui
    - Configure API client to use same Express backend
    - _Requirements: 1.1_

  - [x] 25.2 Create admin authentication pages
    - Create LoginPage with email/password form
    - Implement Supabase Auth integration
    - Create protected route wrapper
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 26. Admin Dashboard - Business Management Pages
  - [x] 26.1 Create BusinessesPage with list view
    - Display business table with name, plan, status, payment status, last activity
    - Implement search by name, phone, routing code
    - Implement filter by plan and status
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 26.2 Create BusinessDetailPage
    - Display business info, bookings, revenue, resources, staff
    - Add status toggle with confirmation dialog
    - Add plan change functionality
    - Add module toggle grid
    - _Requirements: 2.4, 3.1, 3.5, 3.6, 8.5_

- [x] 27. Admin Dashboard - Payment Management Pages
  - [x] 27.1 Create PaymentsPage
    - Display payment list with date range filter
    - Show total platform revenue
    - _Requirements: 6.4, 6.5_

  - [x] 27.2 Create PaymentRecordForm component
    - Form for recording manual payments
    - Fields: amount, payment method, transaction ref, period dates, notes
    - _Requirements: 6.1_

- [x] 28. Admin Dashboard - Template Management Pages
  - [x] 28.1 Create NicheTemplatesPage
    - Display list of all niche templates
    - Add create/edit/delete functionality
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 29. Admin Dashboard - System Pages
  - [x] 29.1 Create DashboardPage with platform stats
    - Display total businesses, active count, revenue, booking metrics
    - _Requirements: 2.5_

  - [x] 29.2 Create SystemHealthPage
    - Display health status for all services
    - Add quick actions: Clear Cache, Sync WhatsApp, View Logs
    - Display key metrics
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 29.3 Create AuditLogPage
    - Display audit log with filtering by admin, action type, date range
    - _Requirements: 14.5_

- [x] 30. Admin Dashboard - Data Export
  - [x] 30.1 Add export functionality to BusinessesPage
    - Export button that generates CSV with selected fields
    - _Requirements: 2.6_

- [ ] 31. Final Checkpoint - All Components Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 32. Seed Data and Migration Scripts
  - [x] 32.1 Create seed script for niche templates
    - Seed SALON, BEAUTY_PARLOR, SPA, CLINIC, FITNESS, OTHER templates
    - Include default terminology, services, hours, message templates
    - _Requirements: 7.6_

  - [x] 32.2 Create seed script for feature modules
    - Seed appointment_booking, walk_in_queue, resource_management, staff_management, prescription_management, class_scheduling, membership_system, package_deals
    - _Requirements: 8.1_

  - [x] 32.3 Create migration script for existing businesses
    - Create Subscription records for existing businesses (ACTIVE status, BASIC plan)
    - Set category to SALON for existing businesses
    - _Requirements: 4.2_

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows the priority order: Admin UI → Subscription → Multi-Niche
