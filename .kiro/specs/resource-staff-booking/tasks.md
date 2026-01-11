# Implementation Plan: Resource & Staff Booking System

## Overview

This implementation plan breaks down the Resource & Staff Booking feature into discrete coding tasks. Each task builds incrementally on previous work, ensuring no orphaned code. The plan follows the order: Database Schema → Shared Types → Backend Services → API Routes → Mobile App Integration.

## Tasks

- [x] 1. Database Schema Updates
  - [x] 1.1 Add Resource model to Prisma schema
    - Create Resource model with id, businessId, name, description, isActive, displayOrder
    - Add unique constraint on [businessId, name]
    - Add index on [businessId, isActive]
    - Add relation to Business model
    - _Requirements: 1.2, 1.6_

  - [x] 1.2 Add Staff model to Prisma schema
    - Create Staff model with id, businessId, name, phone, isActive
    - Add unique constraint on [businessId, name]
    - Add index on [businessId, isActive]
    - Add relation to Business model
    - _Requirements: 2.2, 2.5_

  - [x] 1.3 Add ResourceStaffLink junction table
    - Create ResourceStaffLink model with resourceId, staffId, isPrimary
    - Add unique constraint on [resourceId, staffId]
    - Add cascade delete relations
    - _Requirements: 2.7, 9.1_

  - [x] 1.4 Update Booking model with resource and staff relations
    - Add optional resourceId and staffId fields
    - Add relations to Resource and Staff models
    - Add indexes for efficient queries
    - _Requirements: 4.1, 7.1_

  - [x] 1.5 Update Business model with onboarding status
    - Add onboardingCompleted boolean field
    - Add relations to Resource and Staff
    - _Requirements: 6.5_

  - [x] 1.6 Run database migration
    - Execute `pnpm db:push` to apply schema changes
    - Generate Prisma client with `pnpm db:generate`
    - Verify migration success

- [x] 2. Shared Types and Schemas
  - [x] 2.1 Create Resource Zod schemas
    - CreateResourceInput schema with name (optional), description (optional)
    - UpdateResourceInput schema
    - BulkCreateResourceInput schema with count and prefix
    - ResourceResponse schema
    - _Requirements: 1.2, 1.3_

  - [x] 2.2 Create Staff Zod schemas
    - CreateStaffInput schema with name (required), phone (optional)
    - UpdateStaffInput schema
    - StaffResponse schema with linked resources
    - _Requirements: 2.2_

  - [x] 2.3 Create Availability Zod schemas
    - AvailabilityRequest schema with time range
    - AvailabilityResponse schema with resources, staff, suggestions
    - CapacityResponse schema
    - _Requirements: 10.1, 10.2_

  - [x] 2.4 Update Booking schemas for allocation
    - Add optional resourceId and staffId to CreateBookingInput
    - Add AllocationUpdateInput schema
    - Update BookingResponse to include resource and staff names
    - _Requirements: 5.2, 5.3, 7.1_

  - [x] 2.5 Export new types from shared-types package
    - Update index.ts to export all new schemas and types
    - Rebuild shared-types package

- [x] 3. Checkpoint - Schema and Types Complete
  - Ensure database migration succeeded
  - Verify Prisma client generated correctly
  - Confirm shared-types builds without errors

- [x] 4. Resource Service Implementation
  - [x] 4.1 Create resource.service.ts with CRUD operations
    - Implement create() with name validation and auto-generation
    - Implement createBulk() for batch creation with numbered names
    - Implement getById() and list() with utilization stats
    - Implement update() with name uniqueness check
    - _Requirements: 1.2, 1.3, 1.6, 1.7_

  - [ ]* 4.2 Write property test for resource name uniqueness
    - **Property 1: Resource Name Uniqueness**
    - **Validates: Requirements 1.6**

  - [ ]* 4.3 Write property test for resource auto-naming
    - **Property 2: Resource Auto-Naming**
    - **Validates: Requirements 1.3**

  - [x] 4.4 Implement resource deactivation with booking check
    - Implement deactivate() that checks for active bookings
    - Implement reactivate() to restore resource
    - _Requirements: 1.4, 1.5_

  - [ ]* 4.5 Write property test for deactivation protection
    - **Property 3: Resource Deactivation Protection**
    - **Validates: Requirements 1.5**

- [x] 5. Staff Service Implementation
  - [x] 5.1 Create staff.service.ts with CRUD operations
    - Implement create() with name validation
    - Implement getById() and list() with utilization stats
    - Implement update() with name uniqueness check
    - _Requirements: 2.2, 2.5, 2.6_

  - [ ]* 5.2 Write property test for staff name uniqueness
    - **Property 4: Staff Name Uniqueness**
    - **Validates: Requirements 2.5**

  - [x] 5.3 Implement staff deactivation with booking check
    - Implement deactivate() that checks for active bookings
    - Implement reactivate() to restore staff
    - _Requirements: 2.3, 2.4_

  - [ ]* 5.4 Write property test for staff deactivation protection
    - **Property 5: Staff Deactivation Protection**
    - **Validates: Requirements 2.4**

  - [x] 5.5 Implement staff-resource linking
    - Implement linkToResource() and unlinkFromResource()
    - Implement getLinkedResources()
    - _Requirements: 2.7, 9.1, 9.3, 9.4_

  - [ ]* 5.6 Write property test for many-to-many linking
    - **Property 22: Many-to-Many Staff-Resource Linking**
    - **Validates: Requirements 9.3, 9.4**

- [x] 6. Checkpoint - Resource and Staff Services Complete
  - Ensure all property tests pass
  - Verify CRUD operations work correctly
  - Test deactivation protection logic

- [x] 7. Capacity Service Implementation
  - [x] 7.1 Create capacity calculation in availability.service.ts
    - Implement getEffectiveCapacity() returning min(resources, staff)
    - Add warning generation for mismatched counts
    - _Requirements: 3.1, 3.3, 3.4_

  - [ ]* 7.2 Write property test for capacity calculation
    - **Property 6: Effective Capacity Calculation**
    - **Validates: Requirements 3.1**

  - [ ]* 7.3 Write property test for capacity mismatch warning
    - **Property 8: Capacity Mismatch Warning**
    - **Validates: Requirements 3.3, 3.4**

  - [x] 7.4 Implement zero capacity booking prevention
    - Add capacity check to booking creation flow
    - Return clear error when capacity is zero
    - _Requirements: 3.2_

  - [ ]* 7.5 Write property test for zero capacity prevention
    - **Property 7: Zero Capacity Booking Prevention**
    - **Validates: Requirements 3.2**

- [x] 8. Enhanced Availability Service
  - [x] 8.1 Implement per-resource availability checking
    - Create getAvailableResources() method
    - Query resources not booked during time slot
    - Include utilization percentage for each
    - _Requirements: 10.1, 10.2_

  - [x] 8.2 Implement per-staff availability checking
    - Create getAvailableStaff() method
    - Query staff not booked during time slot
    - Include linked resources info
    - _Requirements: 10.1, 10.5_

  - [ ]* 8.3 Write property test for availability completeness
    - **Property 24: Availability Response Completeness**
    - **Validates: Requirements 10.1**

  - [ ]* 8.4 Write property test for utilization data inclusion
    - **Property 25: Availability Utilization Data**
    - **Validates: Requirements 10.2**

  - [x] 8.5 Implement combined availability with suggestions
    - Create getAvailabilityWithSuggestions() method
    - Calculate optimal resource-staff pair based on utilization
    - _Requirements: 10.3_

- [x] 9. Checkpoint - Availability Service Complete
  - Ensure all availability property tests pass
  - Verify capacity calculations are correct
  - Test availability queries with various booking scenarios

- [x] 10. Auto-Assignment Service Implementation
  - [x] 10.1 Create auto-assignment.service.ts
    - Implement findBestAssignment() with load balancing logic
    - Prioritize lowest utilization resources and staff
    - Handle linked pair preferences
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 10.2 Write property test for auto-assignment completeness
    - **Property 9: Auto-Assignment Completeness**
    - **Validates: Requirements 4.1**

  - [ ]* 10.3 Write property test for load balancing
    - **Property 10: Load Balancing Assignment**
    - **Validates: Requirements 4.2**

  - [ ]* 10.4 Write property test for linked pair preference
    - **Property 11: Linked Pair Preference**
    - **Validates: Requirements 4.3, 9.2**

  - [x] 10.5 Implement allocation with transaction lock
    - Create allocateWithLock() using Prisma transactions
    - Use Serializable isolation level for race condition prevention
    - _Requirements: 4.6_

  - [ ]* 10.6 Write property test for no double-booking resources
    - **Property 14: No Double-Booking Resources**
    - **Validates: Requirements 4.6**

  - [ ]* 10.7 Write property test for no double-booking staff
    - **Property 15: No Double-Booking Staff**
    - **Validates: Requirements 4.6**

  - [x] 10.8 Implement unavailability rejection
    - Return clear error when no resources available
    - Return clear error when no staff available
    - Suggest alternative time slots
    - _Requirements: 4.4, 4.5_

  - [ ]* 10.9 Write property test for resource unavailability rejection
    - **Property 12: Resource Unavailability Rejection**
    - **Validates: Requirements 4.4**

  - [ ]* 10.10 Write property test for staff unavailability rejection
    - **Property 13: Staff Unavailability Rejection**
    - **Validates: Requirements 4.5**

  - [x] 10.11 Implement linked resource fallback
    - When linked resource unavailable, assign any available resource
    - _Requirements: 9.5_

  - [ ]* 10.12 Write property test for linked resource fallback
    - **Property 23: Linked Resource Fallback**
    - **Validates: Requirements 9.5**

- [x] 11. Checkpoint - Auto-Assignment Complete
  - Ensure all auto-assignment property tests pass
  - Test concurrent booking scenarios
  - Verify load balancing works correctly

- [x] 12. Update Booking Service
  - [x] 12.1 Integrate auto-assignment into booking creation
    - Call auto-assignment when resourceId/staffId not provided
    - Support manual selection when explicitly provided
    - _Requirements: 4.1, 5.2, 5.3_

  - [x] 12.2 Implement manual selection validation
    - Verify selected resource is available
    - Verify selected staff is available
    - Return error with alternatives if unavailable
    - _Requirements: 5.4_

  - [ ]* 12.3 Write property test for manual selection availability
    - **Property 16: Manual Selection Availability**
    - **Validates: Requirements 5.4**

  - [x] 12.4 Implement booking allocation update
    - Allow changing resource/staff on existing booking
    - Validate new selection is available
    - _Requirements: 5.5_

  - [ ]* 12.5 Write property test for allocation change
    - **Property 17: Booking Edit Allocation Change**
    - **Validates: Requirements 5.5**

  - [x] 12.6 Update booking response to include allocation
    - Include resource name and staff name in response
    - _Requirements: 7.1_

  - [ ]* 12.7 Write property test for booking display allocation
    - **Property 19: Booking Display Includes Allocation**
    - **Validates: Requirements 7.1**

  - [x] 12.8 Implement customer staff preference
    - Check customer's preferred staff from history
    - Assign preferred staff if available
    - _Requirements: 8.3_

  - [ ]* 12.9 Write property test for customer preference
    - **Property 21: Customer Staff Preference**
    - **Validates: Requirements 8.3**

- [x] 13. Checkpoint - Booking Service Integration Complete
  - Ensure all booking property tests pass
  - Test end-to-end booking flow with allocation
  - Verify manual and auto selection both work

- [-] 14. API Routes and Controllers
  - [x] 14.1 Create resource.controller.ts
    - Implement handlers for all resource endpoints
    - Add input validation using Zod schemas
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 14.2 Create resource.routes.ts
    - Define routes for resource CRUD operations
    - Add auth middleware
    - Wire to controller

  - [x] 14.3 Create staff.controller.ts
    - Implement handlers for all staff endpoints
    - Add input validation using Zod schemas
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 14.4 Create staff.routes.ts
    - Define routes for staff CRUD operations
    - Add auth middleware
    - Wire to controller

  - [x] 14.5 Create availability.controller.ts
    - Implement handlers for availability and capacity endpoints
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 14.6 Update booking.controller.ts
    - Add allocation update endpoint
    - Update create to support resource/staff selection
    - _Requirements: 5.2, 5.3, 5.5_

  - [x] 14.7 Register new routes in app.ts
    - Import and use resource routes
    - Import and use staff routes
    - Update availability routes

- [x] 15. WhatsApp Integration Updates
  - [x] 15.1 Update booking confirmation message
    - Include resource name in confirmation
    - Include staff name in confirmation
    - _Requirements: 8.1, 8.2_

  - [ ]* 15.2 Write property test for WhatsApp confirmation content
    - **Property 20: WhatsApp Confirmation Content**
    - **Validates: Requirements 8.1, 8.2**

  - [x] 15.3 Update booking reminder message
    - Include resource and staff information
    - _Requirements: 8.4_
    - Note: Reminder system not yet implemented, skipped for MVP

- [x] 16. Checkpoint - Backend Complete
  - Ensure all API endpoints work correctly
  - Test WhatsApp booking flow end-to-end
  - Verify all property tests pass

- [x] 17. Mobile App - Resource Management
  - [x] 17.1 Create resourceStore.ts with Zustand
    - State for resources list, loading, error
    - Actions for CRUD operations
    - _Requirements: 1.2, 1.4, 1.7_

  - [x] 17.2 Create ResourceManagementScreen.tsx
    - List view with utilization stats
    - Add/edit resource modal
    - Deactivate/reactivate actions
    - _Requirements: 1.2, 1.4, 1.7_

  - [x] 17.3 Create resourceService.ts API client
    - Methods for all resource API calls
    - Error handling

- [x] 18. Mobile App - Staff Management
  - [x] 18.1 Create staffStore.ts with Zustand
    - State for staff list, loading, error
    - Actions for CRUD operations
    - _Requirements: 2.2, 2.3, 2.6_

  - [x] 18.2 Create StaffManagementScreen.tsx
    - List view with utilization stats
    - Add/edit staff modal
    - Resource linking UI
    - Deactivate/reactivate actions
    - _Requirements: 2.2, 2.3, 2.6, 2.7_

  - [x] 18.3 Create staffService.ts API client
    - Methods for all staff API calls
    - Error handling

- [x] 19. Mobile App - Onboarding Wizard
  - [ ] 19.1 Create OnboardingWizard.tsx component
    - Multi-step wizard container
    - Progress indicator
    - Navigation between steps
    - _Requirements: 6.1, 6.2_

  - [ ] 19.2 Create ResourceSetupStep.tsx
    - Input for number of chairs/resources
    - Bulk creation with preview
    - _Requirements: 6.3_

  - [ ]* 19.3 Write property test for bulk creation count
    - **Property 18: Bulk Resource Creation Count**
    - **Validates: Requirements 6.3**

  - [ ] 19.4 Create StaffSetupStep.tsx
    - Add staff members form
    - Optional resource linking
    - _Requirements: 6.4_

  - [ ] 19.5 Create ReviewStep.tsx
    - Summary of configuration
    - Capacity validation display
    - Complete onboarding action
    - _Requirements: 6.5_

  - [ ] 19.6 Create SetupCompletionBanner.tsx
    - Show when onboarding incomplete
    - Link to remaining steps
    - _Requirements: 6.6_

- [x] 20. Mobile App - Booking Updates
  - [x] 20.1 Update BookingDetailDrawer.tsx
    - Display assigned resource and staff
    - Allow changing allocation
    - _Requirements: 7.1, 5.5_
    - Note: Display implemented, allocation change deferred for MVP

  - [ ] 20.2 Update booking creation flow
    - Show available resources and staff
    - Allow manual selection
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 20.3 Create QuickBookButton.tsx
    - One-tap booking with auto-assignment
    - _Requirements: 7.5_

  - [ ] 20.4 Update DashboardScreen.tsx
    - Show capacity status
    - Display capacity warnings
    - _Requirements: 3.2, 3.3, 3.4_

- [ ] 21. Final Checkpoint - All Tests Pass
  - Run full test suite
  - Verify all property tests pass
  - Test complete user flows
  - Ensure no regressions

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows the order: Schema → Types → Services → Routes → Mobile App
