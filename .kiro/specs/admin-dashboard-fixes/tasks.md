# Implementation Plan: Admin Dashboard Fixes

## Overview

This implementation plan addresses multiple issues in the Admin Dashboard and Merchant App integration. Tasks are organized to fix API issues first, then frontend issues, and finally add the Merchant App deactivation enforcement.

## Tasks

- [x] 1. Fix Admin Dashboard API Client
  - [x] 1.1 Fix changeSubscriptionPlan method to send `plan` instead of `planId`
    - Update `apps/admin-dashboard/src/services/apiClient.ts`
    - Change parameter name from `planId` to `plan`
    - Add `reason` parameter to the API call
    - _Requirements: 2.1, 2.6_

  - [x] 1.2 Update BusinessDetailPage to pass reason to plan change
    - Update `apps/admin-dashboard/src/pages/BusinessDetailPage.tsx`
    - Pass `planReason` to the `changeSubscriptionPlan` call
    - _Requirements: 2.1_

  - [x] 1.3 Update businessStore to pass reason parameter
    - Update `apps/admin-dashboard/src/store/businessStore.ts`
    - Update `changeSubscriptionPlan` method signature to include reason
    - _Requirements: 2.1_

- [x] 2. Fix Backend Audit Logging
  - [x] 2.1 Add audit logging to toggleBusinessStatus controller
    - Update `apps/api/src/controllers/admin-business.controller.ts`
    - Import and call `auditLogService.logBusinessStatusChange`
    - _Requirements: 3.2, 7.5_

  - [x] 2.2 Add audit logging to changeSubscriptionPlan controller
    - Update `apps/api/src/controllers/admin-business.controller.ts`
    - Import and call `auditLogService.logSubscriptionPlanChange`
    - _Requirements: 2.3, 7.5_

  - [ ]* 2.3 Write property test for audit logging
    - **Property 2: Admin Action Audit Logging**
    - **Validates: Requirements 2.3, 3.2, 7.5**

- [x] 3. Fix Templates Page
  - [x] 3.1 Fix response structure parsing in TemplatesPage
    - Update `apps/admin-dashboard/src/pages/TemplatesPage.tsx`
    - Change `setTemplates(response.data)` to `setTemplates(response.data.templates || [])`
    - _Requirements: 5.1, 5.4_

- [x] 4. Fix System Health Page
  - [x] 4.1 Fix response structure parsing in SystemHealthPage
    - Update `apps/admin-dashboard/src/pages/SystemHealthPage.tsx`
    - Transform API response to match expected frontend structure
    - Convert services object to array format
    - _Requirements: 6.1, 6.4_

- [x] 5. Fix Dashboard Stats Page
  - [x] 5.1 Verify and fix response structure parsing in DashboardPage
    - Update `apps/admin-dashboard/src/pages/DashboardPage.tsx`
    - Ensure response.data structure matches API response
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6. Checkpoint - Verify Admin Dashboard Fixes
  - Ensure all Admin Dashboard pages load without errors
  - Test plan change functionality
  - Test toggle status functionality
  - Verify audit logs are being created

- [x] 7. Implement Merchant App Deactivation Enforcement
  - [x] 7.1 Update Business type to include isActive field
    - Update `apps/MerchantAppExpo/src/types/index.ts`
    - Ensure Business interface includes `isActive: boolean`
    - _Requirements: 4.1_

  - [x] 7.2 Create AccountSuspendedScreen component
    - Create full-screen suspension notice component
    - Include "Contact Admin" button with WhatsApp link
    - Display clear message about account status
    - _Requirements: 4.1, 4.3_

  - [x] 7.3 Add deactivation check to TabNavigator
    - Update `apps/MerchantAppExpo/src/navigation/TabNavigator.tsx`
    - Check `business.isActive` status
    - Show AccountSuspendedScreen when deactivated
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 7.4 Update businessStore to refresh on app focus
    - Update `apps/MerchantAppExpo/src/store/businessStore.ts`
    - Ensure business data is refreshed to get latest isActive status
    - _Requirements: 4.5_

  - [ ]* 7.5 Write property test for deactivation enforcement
    - **Property 3: Deactivated Business Feature Blocking**
    - **Validates: Requirements 4.1, 4.2, 4.4**

- [x] 8. Final Checkpoint
  - Ensure all tests pass
  - Verify Admin Dashboard functionality end-to-end
  - Verify Merchant App shows suspension banner when deactivated
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
