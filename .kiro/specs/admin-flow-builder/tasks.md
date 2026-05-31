# Implementation Plan: Admin Flow Builder

## Overview

This plan layers admin-scoped flow management, draft/publish lifecycle, business readiness validation, a WhatsApp-like simulator, and runtime correctness fixes on top of the existing Flow Engine foundation. Implementation proceeds from schema changes → backend services → API controllers → frontend UI → runtime fixes, ensuring each step builds on the previous.

## Tasks

- [x] 1. Schema changes and migration
  - [x] 1.1 Add FlowStatus enum and status field to WhatsAppFlow model
    - Add `FlowStatus` enum (`DRAFT`, `PUBLISHED`, `ARCHIVED`) to `schema.prisma`
    - Add `status FlowStatus @default(DRAFT)` field to `WhatsAppFlow` model
    - Add `@@index([businessId, status])` index for status-based queries
    - Keep `isActive` field for backward compatibility
    - _Requirements: 3.4, 11.1_

  - [x] 1.2 Add SimulationSession and SimulationMessage models
    - Add `SimulationSession` model with fields: id, businessId, flowId, flowVersion, adminId, currentNodeId, contextData (Json), lastMessageAt, createdAt, updatedAt
    - Add `SimulationMessage` model with fields: id, sessionId, direction, messageType, content (Json), nodeId, timestamp
    - Add appropriate indexes (businessId, adminId, lastMessageAt, sessionId+timestamp)
    - Add relation between SimulationSession and SimulationMessage
    - _Requirements: 7.1, 7.5, 10.1_

  - [x] 1.3 Create and run Prisma migration
    - Generate migration with `npx prisma migrate dev --name add-flow-status-and-simulation`
    - Write data migration SQL: `UPDATE "WhatsAppFlow" SET status = 'PUBLISHED' WHERE "isActive" = true`
    - Set remaining rows: `UPDATE "WhatsAppFlow" SET status = 'DRAFT' WHERE "isActive" = false`
    - Regenerate Prisma client
    - _Requirements: 3.4, 11.1_

- [x] 2. Business Flow Readiness Service
  - [x] 2.1 Implement BusinessFlowReadinessService
    - Create `apps/api/src/services/business-flow-readiness.service.ts`
    - Implement `checkReadiness(businessId: string): Promise<ReadinessResult>` method
    - Check: business exists, onboardingCompleted, isActive, active services (price > 0, duration >= 1), capacity (staff OR resources), hoursOfOperation defined
    - Resolve channelMode: DEDICATED (WhatsAppChannel mode=DEDICATED, status=CONNECTED), SHARED (routingCode OR WhatsAppChannel mode=SHARED), NONE
    - Compute `canPublish = ready && channelMode !== 'NONE'`
    - Return `{ ready, missing, channelMode, canPublish }` with proper severity codes
    - _Requirements: 2.1, 2.2, 2.3, 2.7_

  - [ ]* 2.2 Write property test for readiness computation
    - **Property 2: Readiness Computation Correctness**
    - Generate random business states (all combinations of onboarding, active, services, staff/resources, hours)
    - Assert `ready: true` iff ALL conditions pass; `missing` array contains exactly the failed items
    - **Validates: Requirements 2.1, 2.3**

  - [ ]* 2.3 Write unit tests for BusinessFlowReadinessService
    - Test all-pass scenario returns `ready: true, missing: []`
    - Test each individual failure returns correct code in `missing`
    - Test channelMode resolution for SHARED, DEDICATED, NONE
    - Test `canPublish` logic (ready + channelMode !== NONE)
    - Test non-existent business returns 404
    - _Requirements: 2.1, 2.2, 2.3, 2.7_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Flow Service v2 extensions
  - [x] 4.1 Add saveDraft, publish, and archive methods to FlowService
    - Add `saveDraft(businessId, data, createdBy?)` — creates/updates a DRAFT version, no readiness check
    - Add `publish(flowId, businessId)` — validates flow schema, calls readiness service, archives previous PUBLISHED, sets target to PUBLISHED, syncs `isActive` field
    - Add `archive(flowId, businessId)` — sets status to ARCHIVED, syncs `isActive = false`
    - Update `resolveActiveFlow` to check `status === 'PUBLISHED'` first, fall back to `isActive === true` for pre-migration flows
    - Add flow schema validation in publish (entry node exists, edges reference valid nodes, at least one node)
    - _Requirements: 2.5, 2.6, 3.1, 3.2, 3.3, 3.5, 3.7, 3.8, 11.1_

  - [ ]* 4.2 Write property test for publish lifecycle transitions
    - **Property 5: Publish Lifecycle Transitions**
    - Generate sequences of save/publish operations for a business
    - Assert: publishing sets status to PUBLISHED, archives previous PUBLISHED, total version count never decreases
    - **Validates: Requirements 3.2, 3.7**

  - [ ]* 4.3 Write property test for flow resolution
    - **Property 4: Flow Resolution Serves Only Published or Default**
    - Generate random sets of flow versions with various statuses
    - Assert: resolveActiveFlow returns PUBLISHED version or DEFAULT_FLOW, never DRAFT or ARCHIVED
    - **Validates: Requirements 3.1, 3.5, 3.8, 8.4**

  - [ ]* 4.4 Write property test for draft vs publish readiness gate
    - **Property 3: Publish Requires Readiness, Draft Does Not**
    - Generate random flow definitions × random readiness states
    - Assert: saveDraft succeeds regardless of readiness; publish succeeds only when canPublish is true
    - **Validates: Requirements 2.5, 2.6**

- [x] 5. Business Context Service
  - [x] 5.1 Implement BusinessContextService
    - Create `apps/api/src/services/business-context.service.ts`
    - Implement `getContext(businessId: string): Promise<BusinessFlowContext>`
    - Return business metadata (name, category, routingCode, channelMode), active services, active staff, active resources, operating hours, and template variable registry grouped by category
    - Return empty arrays for missing services/staff/resources (not omit)
    - _Requirements: 4.1, 4.2, 4.7_

- [x] 6. Template Resolver v2
  - [x] 6.1 Extend TemplateResolver with dot-path variables
    - Add variable registry to `apps/api/src/services/flow-handlers/template-resolver.ts`
    - Support new variables: `{{business.name}}`, `{{business.category}}`, `{{business.routingCode}}`, `{{selectedService.name}}`, `{{selectedService.price}}`, `{{selectedService.duration}}`, `{{selectedTime}}`, `{{selectedStaff.name}}`, `{{booking.id}}`
    - Maintain backward compat: `{{businessName}}` resolves same as `{{business.name}}`
    - Replace unresolvable variables with empty string (no raw `{{...}}` in output)
    - Extend `TemplateResolverParams` interface with new context fields
    - _Requirements: 4.3, 4.4, 4.6, 11.3_

  - [ ]* 6.2 Write property test for template resolution
    - **Property 6: Template Resolution Correctness**
    - Generate random template strings with supported variables and random contexts
    - Assert: (a) registered variables resolve to context values, (b) unresolvable → empty string, (c) `{{businessName}}` === `{{business.name}}`
    - **Validates: Requirements 4.3, 4.4, 4.6, 11.3**

- [x] 7. Admin Flow Controller and routes
  - [x] 7.1 Create AdminFlowController
    - Create `apps/api/src/controllers/admin-flow.controller.ts`
    - Implement handlers: list, get, create (saveDraft), update (saveDraft), publish, archive, delete
    - Extract `businessId` from `req.params.businessId` — return 400 `MISSING_BUSINESS_ID` if missing/empty
    - Validate business exists — return 404 `BUSINESS_NOT_FOUND` if not found
    - Wire to FlowService v2 methods (saveDraft, publish, archive)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 7.2 Create admin flow routes and readiness/context endpoints
    - Create `apps/api/src/routes/admin-flow.routes.ts`
    - Mount at `/api/v1/admin/businesses/:businessId/flows` with admin auth middleware
    - Add `GET /api/v1/admin/businesses/:businessId/flow-readiness` endpoint
    - Add `GET /api/v1/admin/businesses/:businessId/flow-context` endpoint
    - Register routes in the Express app
    - _Requirements: 1.1, 2.4, 4.1_

  - [ ]* 7.3 Write property test for businessId enforcement
    - **Property 1: Admin Endpoint BusinessId Enforcement**
    - Generate random endpoint × random token × optional businessId
    - Assert: missing/empty businessId → 400 MISSING_BUSINESS_ID, no flow operation performed
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Simulator Service
  - [x] 9.1 Implement SimulatorService
    - Create `apps/api/src/services/simulator.service.ts`
    - Implement `createSession(params)` — creates SimulationSession record, loads flow definition by id/version
    - Implement `sendMessage(sessionId, text)` — processes through Flow Engine with isolation adapter
    - Implement `sendInteractive(sessionId, reply)` — processes interactive reply through Flow Engine
    - Implement `resetSession(sessionId)` — deletes session and associated messages
    - Implement `getSession(sessionId)` — returns session or null
    - Implement isolation: intercept persistence calls (no WhatsAppConversation writes, no BookingIntent creation, no outbox writes)
    - Handle session expiry (60-minute timeout)
    - Skip booking finalization at booking nodes — return simulated confirmation
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7, 7.8, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 9.2 Create Simulator Controller v2 and routes
    - Create `apps/api/src/controllers/admin-simulator.controller.ts`
    - Endpoints: POST create session, POST send message, POST send interactive, POST reset, GET session
    - Mount at `/api/v1/admin/businesses/:businessId/simulator` with admin auth
    - Validate flow accessibility (belongs to business, exists)
    - Return 410 SESSION_EXPIRED for expired sessions, 403 FLOW_NOT_ACCESSIBLE for wrong business
    - _Requirements: 7.1, 7.4, 7.7, 7.8_

  - [ ]* 9.3 Write property test for simulator isolation
    - **Property 7: Simulator Isolation**
    - Generate random message sequences processed through simulator
    - Assert: no WhatsAppConversation, BookingIntent, Booking, or WhatsAppOutboundMessage records created/modified
    - **Validates: Requirements 7.2, 7.5, 10.1, 10.2, 10.6**

- [x] 10. Question choice serialization
  - [x] 10.1 Update question handler for structured choices
    - Modify `apps/api/src/services/flow-handlers/question.ts`
    - Support `StructuredChoice[]` format: `{ id, title, description? }`
    - Normalize `string[]` to `StructuredChoice[]` at runtime (backward compat)
    - Use `id` for reply matching, `title` for display
    - Render as buttons when N ≤ 3, list when N > 3
    - Add duplicate `id` validation in flow save/schema validation
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 10.2 Write property test for choice rendering format
    - **Property 13: Choice Rendering Format**
    - Generate random choice arrays (1-10 structured choices)
    - Assert: N ≤ 3 → button-style, N > 3 → list-style; id used for matching, title for display
    - **Validates: Requirements 12.2, 12.5**

  - [ ]* 10.3 Write property test for choice backward compatibility
    - **Property 14: Choice Backward Compatibility**
    - Generate random string[] choices
    - Assert: each string treated as both id and title, identical behavior to structured format
    - **Validates: Requirements 12.3**

  - [ ]* 10.4 Write property test for duplicate choice ID rejection
    - **Property 15: Duplicate Choice ID Rejection**
    - Generate random choice arrays with injected duplicate ids
    - Assert: validation rejects the operation, reports duplicate ids
    - **Validates: Requirements 12.4**

- [x] 11. Booking flow correctness fixes
  - [x] 11.1 Fix hold creation timing and confirmation handler
    - Ensure BookingIntent (hold) is created at the confirmation node AFTER time selection, not at booking node
    - Move hold creation logic from booking handler to confirmation handler's confirm path
    - Generate idempotencyKey from (conversationId, sorted serviceIds, requestedTime)
    - Confirmation handler confirm path: create hold → set bookingIntentId in context → complete
    - Booking handler: only finalize existing hold (no hold creation)
    - _Requirements: 9.1, 9.2, 9.6, 9.7_

  - [x] 11.2 Fix confirmation loop and hold expiry handling
    - In confirmation handler: if `bookingIntentId` missing on confirm → inform expired, transition to time_picker
    - If hold status !== PENDING or expiresAt < now() → mark EXPIRED, clear bookingIntentId + requestedTime, transition to time_picker
    - Ensure no re-render loop (confirm action completes the node, doesn't re-render)
    - _Requirements: 9.2, 9.7_

  - [x] 11.3 Pass selectedStaffId to booking creation
    - In booking handler: check context for `selectedStaffId`
    - If present, pass as `staffId` parameter to `bookingService.create`
    - _Requirements: 9.4_

  - [ ]* 11.4 Write property test for booking hold idempotency
    - **Property 9: Booking Hold Idempotency**
    - Generate random (conversationId, serviceIds, time) tuples, call confirmation handler multiple times
    - Assert: deterministic idempotencyKey, no duplicate BookingIntent created, existing CONFIRMED returns existing booking
    - **Validates: Requirements 9.1, 9.6**

  - [ ]* 11.5 Write property test for hold expiry transitions
    - **Property 11: Hold Expiry Transitions**
    - Generate random BookingIntent states (expired, cancelled, pending)
    - Assert: expired/non-PENDING → mark EXPIRED, clear context, signal time_picker transition
    - **Validates: Requirements 9.7**

  - [ ]* 11.6 Write property test for single outbound message
    - **Property 10: Single Outbound Message Per Inbound**
    - Generate random flows × random messages
    - Assert: at most one outbound message per inbound (auto-advance combines into single response)
    - **Validates: Requirements 9.5**

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Admin Dashboard - Routes and business-scoped flow pages
  - [x] 13.1 Add business-scoped flow routes to App.tsx
    - Add routes: `/businesses/:businessId/flows`, `/businesses/:businessId/flows/new`, `/businesses/:businessId/flows/:flowId/edit`
    - If no businessId in route → redirect to `/businesses`
    - Keep existing `/flows` routes for backward compat (redirect to business selection)
    - Create `FlowListPage` variant that reads businessId from route params
    - _Requirements: 5.1, 5.2_

  - [x] 13.2 Create Readiness Checklist panel component
    - Create `apps/admin-dashboard/src/components/flow/ReadinessChecklist.tsx`
    - Fetch `GET /api/v1/admin/businesses/:businessId/flow-readiness`
    - Display pass/fail for each readiness item with severity indicators
    - Show channel mode badge (SHARED with routing code, or DEDICATED with phone number)
    - _Requirements: 5.3, 5.4_

  - [x] 13.3 Update FlowEditorPage with readiness, simulate, and publish actions
    - Add "Save Draft", "Simulate", and "Publish" buttons to the top bar
    - "Save Draft" → calls saveDraft endpoint (always enabled)
    - "Publish" → calls publish endpoint (disabled when readiness fails)
    - "Simulate" → opens simulator slide-over panel
    - Integrate ReadinessChecklist as a sidebar panel
    - Wire to admin flow API endpoints with businessId from route
    - _Requirements: 5.5, 5.6_

- [x] 14. Admin Dashboard - Per-node-type config panels
  - [x] 14.1 Implement per-node-type configuration panels
    - Refactor `NodeConfigPanel.tsx` to dispatch to type-specific sub-components
    - Create `MessageNodeConfig` — text area with variable picker
    - Create `QuestionNodeConfig` — text area + variable picker + structured choice editor (id/title/description fields, max 10, duplicate id validation)
    - Create `ServicePickerNodeConfig` — read-only service list preview + header/body/footer/button/empty-message fields
    - Create `StaffPickerNodeConfig` — prompt text + header/footer/button/empty-message fields
    - Create `TimePickerNodeConfig` — days ahead (1-14), start hour, end hour, slot duration (15-480 min), max slots (1-10)
    - Create `ConfirmationNodeConfig` — confirm label, cancel label, summary template
    - Create `BookingNodeConfig` — read-only terminal node summary
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 14.2 Create template variable picker component
    - Create `apps/admin-dashboard/src/components/flow/VariablePicker.tsx`
    - Fetch variables from `/api/v1/admin/businesses/:businessId/flow-context`
    - Group by category (business, booking, service, staff)
    - Insert selected variable at cursor position in text field
    - _Requirements: 6.3, 4.2_

- [x] 15. Admin Dashboard - Simulator UI
  - [x] 15.1 Implement Simulator slide-over panel
    - Create `apps/admin-dashboard/src/components/flow/SimulatorPanel.tsx`
    - WhatsApp-like chat interface: bot messages left, user messages right
    - Clickable interactive buttons and list items
    - Debug panel showing current node ID and contextData
    - "Reset" button to clear session
    - Session expiry indicator (60-minute timeout)
    - Wire to admin simulator API endpoints
    - _Requirements: 7.1, 7.3, 7.8_

- [x] 16. Runtime routing and version pinning
  - [x] 16.1 Update Engine Router to use status field for flow resolution
    - Update `resolveActiveFlow` usage in engine-router to prefer `status === 'PUBLISHED'`
    - Maintain fallback to `isActive === true` for pre-migration flows
    - Ensure DRAFT/ARCHIVED flows are never served to customers
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 11.1_

  - [ ]* 16.2 Write property test for runtime routing correctness
    - **Property 8: Runtime Routing Correctness**
    - Generate random routing codes × phone numbers × business configs
    - Assert: correct business resolved, PUBLISHED flow (or Default_Flow) started, context contains required fields
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [ ]* 16.3 Write property test for version pinning
    - **Property 12: Version Pinning for In-Progress Conversations**
    - Activate new version mid-conversation
    - Assert: in-progress conversation continues on originally pinned version
    - **Validates: Requirements 11.7**

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (fast-check, 100+ iterations)
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout (Express + Vitest + fast-check for API, React + Vite for dashboard)
- Existing Flow Engine, Engine Router, node handlers, and durable queue/outbox remain intact
- The `isActive` field is kept synchronized with `status` for backward compatibility during migration

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2.1", "5.1", "6.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "4.1", "6.2"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "7.1", "10.1"] },
    { "id": 5, "tasks": ["7.2", "7.3", "10.2", "10.3", "10.4", "11.1"] },
    { "id": 6, "tasks": ["9.1", "11.2", "11.3"] },
    { "id": 7, "tasks": ["9.2", "9.3", "11.4", "11.5", "11.6"] },
    { "id": 8, "tasks": ["13.1", "16.1"] },
    { "id": 9, "tasks": ["13.2", "13.3", "16.2", "16.3"] },
    { "id": 10, "tasks": ["14.1", "14.2", "15.1"] }
  ]
}
```
