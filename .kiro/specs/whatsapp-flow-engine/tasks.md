# Implementation Plan: WhatsApp Flow Engine

## Overview

This plan implements the custom node-based **Flow_Engine** described in `design.md`, replacing the hardcoded switch-case state machine in `conversation.service.ts` with a dynamic, database-driven graph runner. Work is sequenced to match the design's four-phase **Strangler-Fig** rollout so nothing changes customer behavior until cutover:

- **Phase 1 — Decoupling:** add shared-types flow types/Zod schemas, the conversation-context superset, the versioned `WhatsAppFlow` model + additive conversation/business columns + migration, and the bulk availability helpers. All new code is dormant; every conversation still runs on the legacy engine.
- **Phase 2 — Engine build:** implement node handlers, `TemplateResolver`, `resolveNextNode`, `DEFAULT_FLOW`, `flow.service.ts`, `flow-engine.service.ts`, and the `EngineRouter` (defaulting everyone to legacy), then wire the worker. Land all property tests and both parity harnesses as the cutover gate.
- **Phase 3 — Segmented routing:** flow-management REST API (owner auth + tenant isolation), the React Flow editor, and segment-based routing with engine-marker parity recording.
- **Phase 4 — Full cutover + cleanup:** global cutover flag wiring, legacy-conversation drain, and gated removal of the legacy switch-case (kept intact until parity is verified).

Implementation language is **TypeScript** (matches the existing monorepo: `apps/api` = Express + TS + Vitest + Prisma; `packages/shared-types` = Prisma + Zod; `apps/admin-dashboard` = React + Vite + Tailwind + Zustand + react-router). Property-based tests use **fast-check** on Vitest. Test sub-tasks are marked optional with `*` per the task conventions; core implementation sub-tasks are never optional. Every flow-run property the existing durable pipeline depends on (dedupe, per-customer lock, idempotent outbox, identity, audit, 24h timeout, tenant isolation) is preserved.

## Tasks

### Phase 1 — Decoupling (no behavior change)

- [x] 1. Establish property-based testing tooling and conventions
  - [x] 1.1 Add fast-check and PBT conventions
    - Add `fast-check` as a `devDependency` to `apps/api/package.json` and `packages/shared-types/package.json`; install
    - Create `apps/api/src/test/pbt.ts` exporting a shared default config (`{ numRuns: 100 }`) and a small helper for the standard run count
    - Document conventions in the helper file's header comment: `[pbt]` describe-block prefix for property suites, and the per-test tag `// Feature: whatsapp-flow-engine, Property N: <text>`
    - Confirm `vitest run -t '[pbt]'` filters property suites
    - _Requirements: 15.1, 15.2, 15.3 (testing infrastructure underpinning Properties 1–25)_

- [x] 2. Add shared flow graph types and Zod schemas to shared-types
  - [x] 2.1 Create flow graph TypeScript types
    - Create `packages/shared-types/src/types/flow.ts` with `NodeType`, `EdgeOperator`, `EdgeCondition`, `FlowEdge`, `FlowNode`, `FlowDefinition`, `FlowRecord`, and `FlowSummary` exactly as specified in the design
    - Re-export them from `packages/shared-types/src/index.ts`
    - _Requirements: 1.1, 2.1, 2.3, 2.4_

  - [x] 2.2 Create flow Zod schemas with reference validation
    - Create `packages/shared-types/src/schemas/flow.schema.ts` with `edgeOperatorSchema`, `edgeConditionSchema`, `nodeTypeSchema`, `flowNodeSchema`, `flowEdgeSchema`, `flowDefinitionSchema`, `createFlowSchema`, `updateFlowSchema`
    - Implement the `superRefine` checks: `entryNodeId` references an existing node; every edge `from`/`to` references an existing node; at most one fallback (condition-less) edge per source node; each failure reports the offending node/edge id
    - Export from `packages/shared-types/src/schemas/index.ts`
    - _Requirements: 2.2, 2.4, 2.5, 2.6, 10.6_

  - [ ]* 2.3 Write property test for flow definition validation
    - **Property 9: Flow definition validation**
    - File: `packages/shared-types/src/schemas/__tests__/flow.schema.pbt.test.ts`
    - Generate valid + malformed definitions (missing entry node, dangling edge endpoints, duplicate fallback edges); assert accept-iff-references-resolve-and-≤1-fallback, and that the offending id appears in the issue
    - **Validates: Requirements 2.2, 2.6, 10.6**

- [x] 3. Evolve the conversation context schema (additive, non-breaking)
  - [x] 3.1 Add the flowContextSchema superset
    - In `packages/shared-types/src/schemas/conversation.schema.ts`, keep `conversationContextSchema` and `conversationStateSchema` unchanged for the Legacy_Router; add `flowContextSchema` extending `conversationContextSchema` with `responses`, `selectedStaffId`, `flowRunId`, and `.passthrough()`; export `FlowContextType`
    - Do not constrain `state` to the enum in the engine path (treated as opaque node id); document the `"GREETING"` entry sentinel
    - _Requirements: 5.5, 11.5, 15.6_

  - [ ]* 3.2 Write round-trip test for flowContextSchema backward compatibility
    - File: `packages/shared-types/src/schemas/__tests__/conversation.schema.test.ts`
    - Assert legacy context objects parse unchanged and unknown keys survive a parse→serialize round-trip (passthrough), so pre-existing rows lose no `contextData`
    - _Requirements: 15.6_

- [x] 4. Add versioned flow persistence to the Prisma schema and migrate
  - [x] 4.1 Add WhatsAppFlow model and additive columns
    - In `packages/shared-types/prisma/schema.prisma`: add `WhatsAppFlow` (one row per version, `@@unique([businessId, version])`, `@@index([businessId, isActive])`, `definition Json`, `isActive`, `entryNodeId`, `createdBy`); add `Business.whatsAppFlows` relation and `Business.whatsappSettings Json?`; add nullable `WhatsAppConversation.flowId` and `flowVersion` (leave the optimistic-lock `version`, `lockedAt/lockedBy`, `@@unique([customerPhone, businessId])` untouched)
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 5.2, 11.1, 15.6_

  - [x] 4.2 Generate the Prisma migration and single-active index
    - Generate the migration against `DIRECT_URL` (`prisma migrate dev`); ensure `prisma migrate deploy` is the production path
    - Add a hand-written SQL step inside the migration: `CREATE UNIQUE INDEX ... ON "WhatsAppFlow"("businessId") WHERE "isActive"` (DB-enforced single active flow)
    - Verify all new columns are nullable/defaulted so the migration is non-destructive for pre-existing conversation rows
    - Regenerate the Prisma client (`pnpm --filter @salex/shared-types build`)
    - _Requirements: 1.3, 1.4, 15.6_

- [x] 5. Add bulk availability helpers to AvailabilityService
  - [x] 5.1 Implement getBulkAvailabilityData, isSlotBookable, isSlotBookableLegacyParity
    - In `apps/api/src/services/availability.service.ts`, add `getBulkAvailabilityData(businessId, start, end)` issuing a bounded, slot-count-independent set of queries (active resource count, active staff count, overlapping `PENDING|CONFIRMED` bookings selecting `{ id, scheduledAt, endAt, resourceId, staffId }`); compute `effectiveCapacity = min(...)`
    - Add pure in-memory `isSlotBookable(data, slotStart, slotEnd)` (capacity-count: `c > 0 && overlapCount < c`, overlap `scheduledAt < slotEnd && endAt > slotStart`)
    - Add pure in-memory `isSlotBookableLegacyParity(data, slotStart, slotEnd)` reproducing legacy `getAvailabilityWithSuggestions(...).available` (free-resource-AND-free-staff from the bulk rows incl. null `resourceId`/`staffId`)
    - Keep all existing legacy methods unchanged (helpers stay dormant)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 5.2 Write property test for the capacity invariant
    - **Property 2: Capacity invariant**
    - File: `apps/api/src/services/__tests__/availability-bulk.pbt.test.ts`
    - Generate random `c = min(r, s)`, random bookings, random slot; assert `isSlotBookable === (c > 0 && overlapCount < c)` recomputed independently, including boundaries (`count === c-1`, `count === c`, `c === 0`)
    - **Validates: Requirements 6.3, 6.4, 6.5**

  - [ ]* 5.3 Write availability parity harness (property + golden)
    - **Property 1: Availability parity with the legacy calculation**
    - File: `apps/api/src/services/__tests__/availability-parity.pbt.test.ts`
    - fast-check over random resource/staff counts and bookings (incl. null resource/staff); assert `isSlotBookableLegacyParity(getBulkAvailabilityData(...), s, e) === getAvailabilityWithSuggestions(...).available` for the same slot; add golden fixtures for the known divergence cases (null resource/staff, both-staff-booked-with-min-headroom)
    - **Validates: Requirements 6.2, 6.6, 9.2**

  - [ ]* 5.4 Write integration test for bounded availability query count
    - **Property 24: Bounded availability query count**
    - File: `apps/api/src/services/__tests__/availability-query-count.test.ts`
    - Spy/count DB queries while evaluating varying candidate-slot counts; assert query count is constant and independent of slot count
    - **Validates: Requirements 6.1**

- [x] 6. Checkpoint - Phase 1 decoupling complete
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2 — Engine build (still defaulting to legacy)

- [x] 7. Implement node handler contracts and the TemplateResolver
  - [x] 7.1 Define the NodeHandler interface and types
    - Create `apps/api/src/services/flow-handlers/types.ts` with `FlowContext`, `NodeResult`, `NodeRenderArgs`, `NodeProcessArgs`, `NodeHandler`, `NodeHandlerMap`; import `InteractiveMessage` from the existing `conversation.service.ts`
    - _Requirements: 3.1, 3.2, 3.5, 4.3, 12.1_

  - [x] 7.2 Implement the TemplateResolver
    - Create `apps/api/src/services/flow-handlers/template-resolver.ts` resolving clinic/salon/generic service terminology by `Business.category` and substituting `{{businessName}}`, `{{serviceTerm}}`, `{{servicePluralTerm}}` placeholders (mirror legacy `getServiceTerm`/`getServicePluralTerm`)
    - _Requirements: 9.3_

  - [ ]* 7.3 Write property test for terminology resolution
    - **Property 22: Terminology resolution**
    - File: `apps/api/src/services/flow-handlers/__tests__/template-resolver.pbt.test.ts`
    - Generate random business categories; assert clinic→clinic terms, salon→salon terms, otherwise generic; assert `{{placeholder}}` substitution
    - **Validates: Requirements 9.3**

- [x] 8. Implement transition resolution and condition evaluation
  - [x] 8.1 Implement resolveNextNode and operator evaluation
    - Create `apps/api/src/services/flow-engine/resolve-next-node.ts` (pure): collect `from`-matching edges in definition order, return first conditional whose condition matches, else the single fallback, else `null`
    - Implement operator evaluation reading `field` as a dot-path: `eq`/`neq` strict (in)equality after string coercion, `contains` substring/array membership, `gt`/`lt` numeric after `Number()` coercion; non-numeric/malformed inputs return no-match and never throw (total function)
    - _Requirements: 2.5, 2.6, 4.1, 4.2, 4.5_

  - [ ]* 8.2 Write property test for transition determinism and totality
    - **Property 3: Transition determinism and totality**
    - File: `apps/api/src/services/flow-engine/__tests__/resolve-next-node.pbt.test.ts`
    - Generate random edge sets (conditionals + ≤1 fallback) and random context incl. malformed condition values; assert first-matching-conditional → fallback → null ordering and that it never throws
    - **Validates: Requirements 2.5, 2.6, 3.5, 4.1, 4.2, 4.5**

- [x] 9. Implement the node handlers
  - [x] 9.1 Implement message and question handlers
    - Create `apps/api/src/services/flow-handlers/message.ts` (renders static text, `autoAdvance: true`, no `process`) and `question.ts` (renders prompt, processes free-text/choice into `responses[nodeId]`, validates, returns `errorMessage` on failure)
    - _Requirements: 2.3, 3.1, 3.2, 4.3, 12.1, 12.2_

  - [x] 9.2 Implement the service_picker handler
    - Create `apps/api/src/services/flow-handlers/service-picker.ts` rendering the active-services list (template terminology) and processing the selection into context; if the business has no active services, return an informational message and do not advance / do not create a hold (E6)
    - _Requirements: 2.3, 9.1, 12.3_

  - [x] 9.3 Implement the staff_picker handler
    - Create `apps/api/src/services/flow-handlers/staff-picker.ts` rendering available staff (from bulk availability) and processing the selection into `selectedStaffId`
    - _Requirements: 2.3, 9.4_

  - [x] 9.4 Implement the time_picker handler
    - Create `apps/api/src/services/flow-handlers/time-picker.ts` using `getBulkAvailabilityData` once and filtering candidate slots in memory via `isSlotBookableLegacyParity` (parity mode) or `isSlotBookable` (capacity mode by config); render slot list, process selection; render no-slots message when empty
    - _Requirements: 2.3, 6.1, 6.2, 9.1_

  - [x] 9.5 Implement the confirmation handler
    - Create `apps/api/src/services/flow-handlers/confirmation.ts` rendering confirm/cancel buttons and processing the reply into `responses.confirmation`; on expired Booking_Hold at confirm, expire the hold and signal a transition back to the time_picker (E4); on cancel, clear booking context
    - _Requirements: 2.3, 3.2, 13.2_

  - [x] 9.6 Implement the booking handler
    - Create `apps/api/src/services/flow-handlers/booking.ts` creating an idempotent Booking_Hold (existing `BookingIntent`) on slot selection, re-validating availability at confirmation via `getBulkAvailabilityData` + `isSlotBookable` (if unbookable, do not finalize, return to time_picker — E5), finalizing through the existing `bookingService.create` path (resource/staff assignment, identity records, audit trail), and signaling `terminal`/`complete`; refuse to create a hold when the business is inactive/not accepting orders (E7)
    - _Requirements: 2.3, 9.1, 9.4, 12.4, 13.1, 13.3, 13.4, 13.5, 14.2, 15.4, 15.5_

  - [ ]* 9.7 Write property test for idempotent booking and hold
    - **Property 7: Idempotent booking and hold**
    - File: `apps/api/src/services/flow-handlers/__tests__/booking.pbt.test.ts`
    - Submit the same confirmation (same idempotency key) one or more times; assert at most one Booking finalized and at most one active hold per key
    - **Validates: Requirements 13.1, 13.4**

  - [ ]* 9.8 Write unit tests for handler validation and error recovery
    - File: `apps/api/src/services/flow-handlers/__tests__/handlers.test.ts`
    - Cover question/picker validation failures (return `errorMessage`, `complete: false`), no-services (E6), inactive business (E7), and expired/taken-slot paths (E4/E5)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 13.2, 13.3_

- [x] 10. Implement the DEFAULT_FLOW constant
  - [x] 10.1 Author the Default_Flow graph
    - Create `apps/api/src/services/flow-engine/default-flow.ts` exporting the `FlowDefinition` reproducing greeting → service selection → time selection → confirmation → booking, with the confirmation→finalize conditional edge and confirmation→service_selection fallback (per the design's example JSON); time_picker config uses `parityMode: "legacy"`; assign a constant internal version (e.g. `0`)
    - _Requirements: 9.1, 9.2, 9.4_

- [x] 11. Implement flow persistence, loading, and version pinning
  - [x] 11.1 Implement flow.service.ts (versioned CRUD + loader + pinning)
    - Create `apps/api/src/services/flow.service.ts` with: versioned create (version 1) and save (`version = max(business version) + 1`, never mutate prior versions); `getById`/`list` scoped to a business id; `activate`/`deactivate` in a transaction (set target active, clear siblings); resolve-active-flow (active custom flow → else `DEFAULT_FLOW`); `loadPinned(flowId, flowVersion)`; pin a fresh run to the then-active `(flowId, flowVersion)`
    - All reads/writes are scoped to a resolved business id; reject access to another business's flow
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 5.2, 5.3, 5.4, 10.3, 16.1, 16.2_

  - [ ]* 11.2 Write property test for version monotonicity and retention
    - **Property 10: Version monotonicity and retention**
    - File: `apps/api/src/services/__tests__/flow-service-versions.pbt.test.ts`
    - For N saves, assert persisted versions are exactly `1..N` and all prior versions remain retrievable
    - **Validates: Requirements 1.2, 10.3**

  - [ ]* 11.3 Write property test for single active version
    - **Property 11: Single active version**
    - File: `apps/api/src/services/__tests__/flow-service-active.pbt.test.ts`
    - For random save/activate/deactivate sequences, assert after `activate(v)` exactly one active equals `v`, and after `deactivate` none active
    - **Validates: Requirements 10.4, 1.3**

  - [ ]* 11.4 Write property test for version pinning
    - **Property 6: Version pinning**
    - File: `apps/api/src/services/__tests__/flow-service-pinning.pbt.test.ts`
    - For an in-progress run pinned to `(flowId, flowVersion)` and arbitrary later activations, assert the loader keeps returning the pinned version; runs started post-activation pin the then-active version
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 11.5 Write property test for invalid pinned-flow reset
    - **Property 16: Invalid pinned-flow reset**
    - File: `apps/api/src/services/__tests__/flow-service-invalid-pin.pbt.test.ts`
    - For unloadable/invalid pinned flows, assert the loader/engine path resets to the active flow's entry node and surfaces a "restarting" outcome rather than throwing
    - **Validates: Requirements 14.4**

- [x] 12. Implement the Flow_Engine orchestration loop
  - [x] 12.1 Implement flow-engine.service.ts
    - Create `apps/api/src/services/flow-engine.service.ts` exposing `processMessage(customerPhone, messageText, interactiveReply, businessId)` and the pure `resolveNextNode` surface; implement the two-phase loop: fresh-start detection via entry sentinel, load pinned flow (invalid → reset per Property 16), `process` → merge `contextUpdates` → `resolveNextNode` → auto-advance through message nodes with a visited-set cycle guard → atomic persist-transition-and-render (persisted `currentNodeId` always equals the rendered node; render-throw rolls back, no partial advance); validation failure re-renders the same node with an error banner; dead-end returns the cannot-continue message; 24h timeout resets to entry; mark complete on booking finalize; return the `engine: 'flow'` marker
    - Emit transition logs (`conversationId`, source node, destination node) and error logs (`conversationId`, `nodeId`) with no secrets/message-body content
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.5, 12.1, 12.2, 14.1, 14.2, 14.3, 14.4, 17.1, 17.2, 17.4_

  - [ ]* 12.2 Write property test for render-after-transition and atomicity
    - **Property 5: Render-after-transition and atomicity**
    - File: `apps/api/src/services/__tests__/flow-engine-step.pbt.test.ts`
    - Over an in-memory/mock store, random flows and process outcomes (complete / validation-fail / render-throws); assert (a) persisted `currentNodeId === rendered node`, render-throw retains pre-step node; (b) validation-fail re-renders same node with banner, node unchanged
    - **Validates: Requirements 3.1, 3.3, 3.4, 12.1, 12.2**

  - [ ]* 12.3 Write property test for auto-advance termination
    - **Property 4: Auto-advance termination**
    - File: `apps/api/src/services/__tests__/flow-engine-autoadvance.pbt.test.ts`
    - Random message-node chains incl. cycles; assert the loop halts on an input/terminal node or raises a dead-end on a cycle, within bounded steps (never infinite-loops)
    - **Validates: Requirements 4.3, 4.4**

  - [ ]* 12.4 Write property test for context monotonicity
    - **Property 14: Context monotonicity**
    - File: `apps/api/src/services/__tests__/flow-engine-context.pbt.test.ts`
    - Random sequences of context updates (with occasional explicit clears); assert written values persist across steps unless explicitly cleared
    - **Validates: Requirements 5.5**

  - [ ]* 12.5 Write property test for the timeout reset boundary
    - **Property 15: Timeout reset boundary**
    - File: `apps/api/src/services/__tests__/flow-engine-timeout.pbt.test.ts`
    - With an injected clock and random last-message timestamps around 24h; assert `>24h` resets to entry/new run and `<=24h` preserves node + context
    - **Validates: Requirements 14.1**

- [x] 13. Implement the EngineRouter
  - [x] 13.1 Implement engine-router.service.ts (selectEngine + fallback)
    - Create `apps/api/src/services/engine-router.service.ts` with pure `selectEngine({ businessId, globalCutover, businessFlagged, hasActiveCustomFlow })` (cutover→flow; else flagged/active-custom→flow; else legacy; undefined business→legacy) and `route(...)` that invokes the selected engine, wraps it in try/catch to fall back to the Legacy_Router on Flow_Engine error, and returns + logs the chosen-vs-actual `engine` marker (resolved business id + chosen engine)
    - Default configuration routes everyone to legacy (no business flagged, global cutover off)
    - _Requirements: 7.2, 7.3, 7.4, 11.1, 11.2, 11.3, 11.4, 11.5, 17.3, 17.4_

  - [ ]* 13.2 Write property test for engine selection
    - **Property 12: Engine selection**
    - File: `apps/api/src/services/__tests__/engine-router-select.pbt.test.ts`
    - Full boolean cross-product of flags + business presence; assert output matches the `selectEngine` spec table, incl. undefined business → legacy
    - **Validates: Requirements 1.3, 1.4, 7.2, 7.3, 7.4, 11.1, 11.2, 11.3**

- [x] 14. Wire the EngineRouter into the durable pipeline
  - [x] 14.1 Route worker processing through the EngineRouter
    - In `apps/api/src/services/whatsapp-db-worker.service.ts`, replace the direct `conversationService.processMessage(...)` call inside `processInboundEvent` with `engineRouter.route(...)` (passing `customerPhone`, text, interactiveReply, `businessId`, `phoneNumberId`); preserve the per-customer lock, the idempotent outbound upsert keyed `inbound:{waMessageId}:response`, dedupe, retry/backoff, and DONE/PENDING/FAILED transitions exactly
    - _Requirements: 11.4, 15.1, 15.2, 15.3, 15.5_

  - [x] 14.2 Add unmatched phone_number_id observability to the webhook controller
    - In `apps/api/src/controllers/whatsapp-webhook.controller.ts`, when a signature-validated inbound `phone_number_id` matches no registered DEDICATED `WhatsAppChannel`, log the unmatched id for observability and continue storing the event for the shared-number/Legacy_Router path (no rejection); ensure verify-token and signature handling stay unchanged and no secrets are logged
    - _Requirements: 7.1, 7.3, 8.5, 17.3, 17.4_

- [ ] 15. Build the message parity harness
  - [ ]* 15.1 Write the Default_Flow vs legacy message parity harness
    - **Property 21: Default-flow message parity**
    - File: `apps/api/src/services/__tests__/message-parity.pbt.test.ts`
    - Golden fixtures: capture legacy `conversation.service.ts` `InteractiveMessage[]` for fixed input sequences and assert the Flow_Engine on `DEFAULT_FLOW` produces equivalent type/header/body/action; add a fast-check differential test feeding random valid input sequences to both engines with the legacy engine as oracle
    - **Validates: Requirements 9.2**

- [ ] 16. Add durable-pipeline integration tests (cutover gate)
  - [ ]* 16.1 Write end-to-end dedupe and idempotent-outbound test
    - **Property 17: Inbound dedupe**
    - File: `apps/api/src/test/pipeline-dedupe.test.ts`
    - Deliver duplicate `waMessageId` events through webhook→inbox→worker→EngineRouter→outbox; assert exactly one `WhatsAppInboundEvent` per distinct id and one outbound row per `inbound:{waMessageId}:response` even on retry
    - **Validates: Requirements 15.1, 15.2**

  - [ ]* 16.2 Write per-customer serialization test
    - **Property 18: Per-customer serialization**
    - File: `apps/api/src/test/pipeline-lock.test.ts`
    - Two claimable events for the same phone; assert serialized processing and that an un-acquired lock requeues PENDING with `nextAttemptAt ≈ now + 2s` rather than processing concurrently
    - **Validates: Requirements 15.3**

  - [ ]* 16.3 Write engine-failure fallback test
    - **Property 13: Engine-failure fallback totality**
    - File: `apps/api/src/test/engine-fallback.test.ts`
    - Stub the Flow_Engine to throw; assert `route` still returns a valid legacy-produced `InteractiveMessage` and markers record `chosen: flow`, `actual: legacy`
    - **Validates: Requirements 11.4**

  - [ ]* 16.4 Write unknown-phone routing and webhook-security test
    - **Property 20: Webhook security (verify token + signature)**
    - File: `apps/api/src/test/webhook-security.test.ts`
    - Assert verify request succeeds iff token matches; inbound accepted iff signature valid (reject otherwise); unmatched `phone_number_id` routes to the Legacy_Router shared-number path and logs the unmatched id
    - **Validates: Requirements 7.3, 8.3, 8.5**

  - [ ]* 16.5 Write tenant isolation integration test
    - **Property 8: Tenant isolation (no cross-tenant leakage)**
    - File: `apps/api/src/test/tenant-isolation.test.ts`
    - Seed businesses A and B in isolated transactions; assert flow/conversation/availability/booking reads and writes for B never touch A's rows
    - **Validates: Requirements 1.5, 10.5, 16.1, 16.2, 16.5**

  - [ ]* 16.6 Write legacy-row backward-compatibility test
    - **Property 19: Legacy-row backward compatibility**
    - File: `apps/api/src/test/legacy-row-compat.test.ts`
    - Seed pre-existing rows (null `flowId`/`flowVersion`, legacy enum `state`, arbitrary `contextData`); assert the engine path processes an inbound message without throwing and preserves existing `contextData`
    - **Validates: Requirements 15.6**

  - [ ]* 16.7 Write single-active-conversation test
    - **Property 25: Single active conversation per (phone, business)**
    - File: `apps/api/src/test/single-conversation.test.ts`
    - Drive random inbound sequences per `(phone, business)`; assert at most one conversation row per pair
    - **Validates: Requirements 14.3**

  - [ ]* 16.8 Write secret-redaction log test
    - **Property 23: Secret redaction in logs**
    - File: `apps/api/src/test/log-redaction.test.ts`
    - Spy on the logger across engine + gateway paths; assert emitted records never contain the verify token, signing secret, or raw message-body content
    - **Validates: Requirements 17.4**

- [x] 17. Checkpoint - Phase 2 engine build complete (cutover gate)
  - Ensure all tests pass (all property suites and both parity harnesses must be green before any traffic is routed to the engine), ask the user if questions arise.

### Phase 3 — Segmented routing

- [x] 18. Build the flow-management REST API
  - [x] 18.1 Implement flow.controller.ts (owner-scoped CRUD + versioning + activate)
    - Create `apps/api/src/controllers/flow.controller.ts` resolving the caller's business from `req.auth.userId` (owner → `Business.ownerId`) and ignoring any client-supplied businessId; implement list/get/create/update(new version)/activate/deactivate/delete(refuse if active) and the `GET /channel/verify-token` handler (from config); validate bodies with `createFlowSchema`/`updateFlowSchema`, returning `400 INVALID_FLOW_REFERENCE` with offending ids on bad references; deny access to flows owned by another business (404/denied)
    - _Requirements: 1.2, 8.4, 10.1, 10.3, 10.4, 10.6, 16.2, 16.3, 16.5_

  - [x] 18.2 Add flow routes with authentication
    - Create `apps/api/src/routes/flow.routes.ts` mounting `/v1/flows` behind the existing owner `authMiddleware` (JWT `role: 'merchant'`); register in `apps/api/src/routes/index.ts`; expose the configured verify token via `config/index.ts` for the verify-token route; do not introduce any unauthenticated flow-management surface
    - _Requirements: 8.4, 10.1, 16.3, 16.4_

  - [ ]* 18.3 Write tenant-isolation integration test for the flow API
    - **Property 8: Tenant isolation (no cross-tenant leakage)**
    - File: `apps/api/src/test/flow-api-tenant.test.ts`
    - As owner of business B, assert requests targeting A's flow id are denied and that responses list only B's flows
    - **Validates: Requirements 10.5, 16.2, 16.3, 16.5**

  - [ ]* 18.4 Write unit tests for versioning + reference validation semantics
    - File: `apps/api/src/controllers/__tests__/flow-controller.test.ts`
    - Assert POST creates v1, PUT inserts max+1 without mutating priors, activate flips single-active, delete refuses active, and invalid references return the offending ids
    - _Requirements: 1.2, 10.3, 10.4, 10.6_

- [x] 19. Build the visual Flow Editor in the admin dashboard
  - [x] 19.1 Add React Flow and the flow API client
    - Add `@xyflow/react` to `apps/admin-dashboard/package.json`; create `apps/admin-dashboard/src/api/flows.ts` (axios) for the `/v1/flows` endpoints and a Zustand store `src/store/flowStore.ts`
    - _Requirements: 10.1_

  - [x] 19.2 Implement the graph editor page and node/edge components
    - Create `apps/admin-dashboard/src/pages/FlowEditorPage.tsx` and `src/components/flow/*` (node palette for the 7 node types, message-text/config panels, conditional-edge editor) using `@xyflow/react`; serialize the canvas to a `FlowDefinition` and save via the API (new version per save)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 19.3 Implement flow list, activate/deactivate, and route wiring
    - Create the flow list view (own-business only) with activate/deactivate controls and version display; wire routes in the dashboard router (`App.tsx`); surface `400 INVALID_FLOW_REFERENCE` errors with the offending ids; display only the owner's own flows
    - _Requirements: 10.1, 10.4, 10.5, 10.6_

  - [ ]* 19.4 Write component tests for the editor
    - File: `apps/admin-dashboard/src/components/flow/__tests__/flow-editor.test.tsx`
    - Assert node/edge editing produces a valid `FlowDefinition`, save triggers a new version, and reference-validation errors render
    - _Requirements: 10.2, 10.3, 10.6_

- [x] 20. Enable segmented routing and engine-marker parity recording
  - [x] 20.1 Feed segmentation signals into selectEngine
    - In `apps/api/src/services/engine-router.service.ts`, source `businessFlagged` from `Business.whatsappSettings.flowEngineEnabled` and `hasActiveCustomFlow` from `flow.service` (active-flow lookup) so flagged businesses / businesses with an active custom flow route to the Flow_Engine while everyone else stays on legacy
    - _Requirements: 11.1, 11.2_

  - [x] 20.2 Record the handling engine for parity verification
    - In `apps/api/src/services/whatsapp-db-worker.service.ts` (and `whatsapp-message-audit.service.ts`), write the `engine` (`"flow" | "legacy"`) into the outbound `WhatsAppMessage` audit `content` JSON and persist the last-handling engine into `contextData.__engine` (via passthrough); no schema change
    - _Requirements: 11.5, 17.3_

  - [ ]* 20.3 Write segmented-routing parity marker integration test
    - File: `apps/api/src/test/engine-marker-parity.test.ts`
    - Assert flagged/active-custom-flow businesses are handled by the Flow_Engine, others by legacy, and that the engine marker is recorded per message and per conversation
    - _Requirements: 11.1, 11.2, 11.5_

### Phase 4 — Full cutover + cleanup

- [x] 21. Wire the global cutover flag
  - [x] 21.1 Add and wire the global cutover config flag
    - Add a platform-level cutover flag to `apps/api/src/config/index.ts`; pass it as `globalCutover` into `EngineRouter.selectEngine` so all conversations route to the Flow_Engine (using `DEFAULT_FLOW` where no custom flow exists) when enabled
    - _Requirements: 11.3_

  - [x] 21.2 Drain in-flight legacy-enum conversations
    - In the EngineRouter path, keep conversations whose `state` is a legacy enum value and that are mid-flight on the Legacy_Router until they complete or hit the 24h timeout, avoiding mid-conversation engine swaps; only conversations starting after activation/cutover pin to the engine
    - _Requirements: 5.4, 14.1, 15.6_

  - [ ]* 21.3 Write global-cutover integration test
    - File: `apps/api/src/test/global-cutover.test.ts`
    - With the cutover flag on, assert all new conversations route to the Flow_Engine (Default_Flow when no custom flow) while in-flight legacy-enum conversations drain on legacy
    - _Requirements: 11.3, 5.4_

- [x] 22. Retire the legacy switch-case (gated)
  - [x] 22.1 Remove the legacy switch-case handlers after parity is verified
    - Only after the soak/verification window confirms parity (golden + engine-marker diffing), remove the legacy switch-case handlers from `apps/api/src/services/conversation.service.ts`, retaining any shared helpers still referenced, and simplify the `EngineRouter` fallback now that legacy is gone; keep legacy fully intact until this verification gate is met
    - _Requirements: 11.3, 11.5_

- [x] 23. Final checkpoint - full cutover verified
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP, but the Phase 2 cutover gate (task 17) requires all property suites and both parity harnesses to be green before any traffic is routed to the Flow_Engine.
- Each task references specific requirements and, where applicable, the exact correctness property number from `design.md` (Properties 1–25).
- Sequencing follows the design's four-phase Strangler-Fig plan so the legacy path is unchanged until cutover; the `EngineRouter` defaults everyone to legacy until Phase 3/4 explicitly enables segments and the global cutover flag.
- Property tests use **fast-check** on Vitest with `numRuns: 100`, a `[pbt]` describe prefix, and a `// Feature: whatsapp-flow-engine, Property N` tag per the design's Testing Strategy.
- Coverage: every requirement 1–17 and every correctness property 1–25 is referenced by at least one task. PBT vs integration test type follows the design's coverage map (e.g. P1–P7, P9–P12, P14–P16, P19, P22 fast-check; P8, P13, P17, P18, P20, P21, P24, P25 integration; P23 unit + integration log spy).
- The legacy switch-case in `conversation.service.ts` is retained as the fallback engine and is only removed in task 22.1 after parity is verified.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "5.1"] },
    { "id": 1, "tasks": ["2.2", "3.1", "5.2", "5.3", "5.4"] },
    { "id": 2, "tasks": ["2.3", "3.2", "4.1", "7.1", "8.1"] },
    { "id": 3, "tasks": ["4.2", "7.2", "8.2", "10.1"] },
    { "id": 4, "tasks": ["7.3", "9.1", "9.2", "9.3", "9.4", "9.5", "9.6"] },
    { "id": 5, "tasks": ["9.7", "9.8", "11.1"] },
    { "id": 6, "tasks": ["11.2", "11.3", "11.4", "11.5", "12.1"] },
    { "id": 7, "tasks": ["12.2", "12.3", "12.4", "12.5", "13.1"] },
    { "id": 8, "tasks": ["13.2", "14.1", "14.2"] },
    { "id": 9, "tasks": ["15.1", "16.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8"] },
    { "id": 10, "tasks": ["18.1"] },
    { "id": 11, "tasks": ["18.2", "19.1"] },
    { "id": 12, "tasks": ["18.3", "18.4", "19.2"] },
    { "id": 13, "tasks": ["19.3", "20.1", "20.2"] },
    { "id": 14, "tasks": ["19.4", "20.3", "21.1"] },
    { "id": 15, "tasks": ["21.2"] },
    { "id": 16, "tasks": ["21.3", "22.1"] }
  ]
}
```
