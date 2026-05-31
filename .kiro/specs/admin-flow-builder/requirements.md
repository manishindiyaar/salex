# Requirements Document

## Introduction

This specification covers the product-level rework of the existing WhatsApp Flow Engine to enforce proper admin-scoped flow management, draft/publish lifecycle, business readiness validation, a WhatsApp-like simulator backed by the Flow Engine, and runtime correctness fixes. The existing Flow Engine graph runner, node handlers, and durable queue/outbox remain intact; this spec layers product rules on top of that foundation.

## Glossary

- **Admin_Dashboard**: The React admin application (`apps/admin-dashboard`) used by platform admins to manage businesses and flows
- **Platform_Admin**: A user authenticated with JWT `type: 'admin'` who manages flows on behalf of businesses
- **Business**: A merchant entity in the system with onboarding state, services, staff, resources, and hours
- **Flow_Editor**: The React Flow-based visual editor page in the Admin_Dashboard for building flow graphs
- **Flow_Engine**: The existing graph runner service (`flow-engine.service.ts`) that processes customer messages through node-based flow definitions
- **Flow_Service**: The versioned CRUD service (`flow.service.ts`) managing WhatsApp flow definitions
- **Readiness_Service**: A new service (`BusinessFlowReadinessService`) that validates whether a business has sufficient setup data to publish a flow
- **Flow_Simulator**: A new WhatsApp-like simulator component that runs draft or published flows through the Flow_Engine in isolation
- **Draft_Flow**: A saved flow version that is not yet published and not served to real customers
- **Published_Flow**: A flow version that has been validated and activated for real customer runtime
- **Routing_Code**: A short alphanumeric code customers text to the shared Salex WhatsApp number to reach a specific business
- **Channel_Mode**: Whether a business uses the shared Salex number (`SHARED`) or a dedicated WhatsApp number (`DEDICATED`)
- **Template_Variable**: A placeholder in message text (e.g. `{{business.name}}`) that resolves to dynamic business or booking data at runtime
- **Node_Config_Panel**: The right-side configuration panel in the Flow_Editor that provides per-node-type editing controls
- **Simulation_Session**: An isolated session record used by the Flow_Simulator that does not affect real WhatsAppConversation rows

## Requirements

### Requirement 1: Business-Scoped Admin Flow Endpoints

**User Story:** As a platform admin, I want all flow management endpoints to require an explicit businessId, so that flows are always scoped to a specific business and no ambiguous fallback logic is used.

#### Acceptance Criteria

1. WHEN a platform admin calls any flow management endpoint (list, get, create, update, activate, deactivate, or delete), THE Admin_Flow_API SHALL require an explicit `businessId` path or query parameter in the request.
2. IF a flow management request from a platform admin is received without a `businessId` parameter or with an empty `businessId` value, THEN THE Admin_Flow_API SHALL return HTTP 400 with error code `MISSING_BUSINESS_ID` and SHALL NOT perform the requested operation.
3. THE Admin_Flow_API SHALL NOT fall back to "first business," ownership-based resolution, or any other implicit business resolution when the requester is a platform admin.
4. WHEN a platform admin provides a `businessId` that does not match any existing business record, THE Admin_Flow_API SHALL return HTTP 404 with error code `BUSINESS_NOT_FOUND` and SHALL NOT perform the requested operation.
5. THE Admin_Flow_API SHALL verify that the business record identified by `businessId` exists in the database before performing any flow operation for that business.
6. WHEN an authenticated business owner calls a flow management endpoint, THE Admin_Flow_API SHALL resolve the business from the owner's authenticated identity and SHALL NOT require an explicit `businessId` parameter from the owner.

### Requirement 2: Business Flow Readiness Validation

**User Story:** As a platform admin, I want to check whether a business has completed enough setup to publish a flow, so that I do not publish flows for businesses that cannot fulfill bookings.

#### Acceptance Criteria

1. WHEN a readiness check is requested for a business, THE Readiness_Service SHALL verify: business exists, `onboardingCompleted` is true, `isActive` is true, business has at least one active service with a price greater than zero and a duration of at least 1 minute, business has capacity (at least one active staff member or at least one active resource), and business has operating hours defined in `hoursOfOperation`.
2. THE Readiness_Service SHALL NOT require a dedicated WhatsApp channel for readiness; businesses using the shared Salex number via routing code are eligible.
3. WHEN readiness is checked, THE Readiness_Service SHALL return a result containing: `ready` (boolean, true only when all checks in criterion 1 pass), `missing` (array of `{code, label, message, severity}` where severity is one of `blocker` or `warning`), `channelMode` (`SHARED` if the business has a routing code or shared channel, `DEDICATED` if the business has a dedicated WhatsApp_Channel with status CONNECTED, or `NONE` if neither), and `canPublish` (boolean, true only when `ready` is true and `channelMode` is not `NONE`).
4. THE Admin_Flow_API SHALL expose readiness at `GET /api/v1/admin/businesses/:businessId/flow-readiness`.
5. WHEN a publish or activate action is attempted, THE Flow_Service SHALL enforce readiness validation and reject with HTTP 422 and error code `BUSINESS_NOT_READY` if readiness fails, including the `missing` array in the error response.
6. THE Flow_Service SHALL allow saving a flow with status `DRAFT` even when readiness is incomplete.
7. IF a readiness check is requested for a businessId that does not exist, THEN THE Readiness_Service SHALL reject the request with HTTP 404 and error code `BUSINESS_NOT_FOUND`.

### Requirement 3: Draft vs Published Flow Lifecycle

**User Story:** As a platform admin, I want to save flow changes as drafts without affecting live customers, and explicitly publish when ready, so that I can iterate on flow design safely.

#### Acceptance Criteria

1. WHEN a flow is saved, THE Flow_Service SHALL create or update a draft version with status `DRAFT` and SHALL NOT make the flow available for live customer conversations.
2. WHEN a publish action is requested, THE Flow_Service SHALL validate the flow definition against the flow schema (entry node exists, all edge endpoints reference existing nodes, at most one Fallback_Edge per source node), SHALL verify that the flow contains at least one node, and SHALL set the selected version's status to `PUBLISHED` while setting any previously `PUBLISHED` version for that business to `ARCHIVED`.
3. IF schema validation or readiness verification fails during a publish action, THEN THE Flow_Service SHALL reject the publish request, SHALL leave the version in `DRAFT` status, and SHALL return an error message indicating which validation rule failed.
4. THE Flow_Service SHALL support three flow statuses: `DRAFT`, `PUBLISHED`, and `ARCHIVED`.
5. THE Flow_Engine SHALL use only the version with status `PUBLISHED` for real customer conversations at runtime.
6. THE Flow_Simulator SHALL be able to run a `DRAFT` flow by flow id without requiring publication.
7. WHEN a flow version is published, THE Flow_Service SHALL retain all prior versions in version history with their respective statuses and SHALL NOT delete or overwrite any previously saved version.
8. IF a business has no version with status `PUBLISHED`, THEN THE Flow_Engine SHALL conduct the conversation using the Default_Flow.

### Requirement 4: Business Context and Variable Registry

**User Story:** As a platform admin, I want to see available business data and template variables while building a flow, so that I can configure nodes with dynamic content that resolves correctly at runtime.

#### Acceptance Criteria

1. THE Admin_Flow_API SHALL expose business context at `GET /api/v1/admin/businesses/:businessId/flow-context` and SHALL require an authenticated platform admin session.
2. WHEN business context is requested, THE Admin_Flow_API SHALL return: business metadata (name, category, routingCode, channelMode), active services list (id, name, price, duration), active staff list (id, name), active resources list (id, name), operating hours summary (days with start/end times), and supported template variables grouped by category.
3. THE Template_Resolver SHALL support the following variables: `{{business.name}}`, `{{business.category}}`, `{{business.routingCode}}`, `{{selectedService.name}}`, `{{selectedService.price}}`, `{{selectedService.duration}}`, `{{selectedTime}}`, `{{selectedStaff.name}}`, `{{booking.id}}`.
4. THE Template_Resolver SHALL maintain backward compatibility with the existing `{{businessName}}`, `{{serviceTerm}}`, and `{{servicePluralTerm}}` variables by resolving them identically to their current behavior.
5. WHEN a service_picker, staff_picker, or time_picker node is rendered at runtime, THE Flow_Engine SHALL use live database data (active services, staff, availability) rather than manually configured static lists.
6. IF a template variable cannot be resolved at runtime (e.g. `{{selectedStaff.name}}` when no staff was selected), THEN THE Template_Resolver SHALL replace the variable with an empty string rather than leaving the raw placeholder visible to the customer.
7. IF the business has no active services, no active staff, or no active resources, THEN THE Admin_Flow_API SHALL return empty arrays for those fields rather than omitting them.

### Requirement 5: Admin UI Business Context Enforcement

**User Story:** As a platform admin, I want the flow editor to require a business context before I can create or edit flows, so that every flow is always associated with a specific business.

#### Acceptance Criteria

1. WHEN a platform admin navigates to create or edit a flow, THE Flow_Editor SHALL require a `businessId` in the URL path or route parameters before rendering the editor canvas.
2. IF no `businessId` is present in the route, THEN THE Flow_Editor SHALL redirect the admin to a business selection page that lists all businesses and does not render the editor until a business is chosen.
3. THE Flow_Editor SHALL display a readiness checklist panel showing the current business readiness status with a pass or fail indicator for each item.
4. THE Flow_Editor SHALL display the channel mode for the selected business: IF the channel mode is SHARED, THEN show the business routing code; IF the channel mode is DEDICATED and connected, THEN show the dedicated phone number.
5. THE Flow_Editor SHALL provide three distinct actions: "Save Draft" which persists the current flow graph as a new version without activating it, "Simulate" which opens a test conversation preview against the current graph without affecting live traffic, and "Publish" which activates the saved flow version for the business.
6. WHILE any item in the readiness checklist fails, THE Flow_Editor SHALL disable the "Publish" action and SHALL display which specific checklist items are not met.

### Requirement 6: Per-Node-Type Configuration Panels

**User Story:** As a platform admin, I want specialized configuration panels for each node type, so that I can configure nodes with appropriate controls rather than generic text fields.

#### Acceptance Criteria

1. WHEN a service_picker node is selected, THE Node_Config_Panel SHALL display the business's active services from the database as a read-only preview list and SHALL allow configuration of header text, body text, footer text, list button label, and a no-services-available message.
2. WHEN a time_picker node is selected, THE Node_Config_Panel SHALL allow configuration of: days ahead (integer, 1 to 14), start hour (integer, 0 to 23), end hour (integer, 0 to 23, greater than start hour), slot duration in minutes (integer, 15 to 480), and maximum slots to display (integer, 1 to 10).
3. WHEN a message or question node is selected, THE Node_Config_Panel SHALL provide a template variable picker listing the variables defined in the business context endpoint and SHALL insert the selected variable at the cursor position in the message text field.
4. WHEN a question node is selected, THE Node_Config_Panel SHALL allow configuring between 1 and 10 choices as structured objects with `id`, `title`, and optional `description` fields rather than raw strings.
5. THE Node_Config_Panel SHALL render type-specific controls for each supported node type: message, question, service_picker, staff_picker, time_picker, confirmation, and booking.
6. WHEN a staff_picker node is selected, THE Node_Config_Panel SHALL allow configuration of prompt text, header text, footer text, list button label, and a no-staff-available message.
7. WHEN a confirmation node is selected, THE Node_Config_Panel SHALL allow configuration of the confirm button label, cancel button label, and summary text template.
8. WHEN a booking node is selected, THE Node_Config_Panel SHALL display a read-only summary indicating that this node finalizes the booking using the context accumulated by prior nodes.

### Requirement 7: WhatsApp-Like Flow Simulator

**User Story:** As a platform admin, I want to test a draft flow in a WhatsApp-like chat interface before publishing, so that I can verify the conversation experience without affecting real customers.

#### Acceptance Criteria

1. WHEN a simulation is started, THE Flow_Simulator SHALL create an isolated Simulation_Session for the selected business and flow id/version, and SHALL require an authenticated platform admin session for access.
2. THE Flow_Simulator SHALL process messages through the same Flow_Engine logic used in production, without publishing the flow, sending real WhatsApp messages, creating real BookingIntent or Booking records, or writing to the WhatsAppConversation table.
3. THE Flow_Simulator SHALL display: chat bubbles with rendered messages, clickable interactive reply buttons, the current node identifier, and the current contextData object.
4. THE Flow_Simulator backend SHALL expose endpoints to: create or reset a session, send a text message, send an interactive reply, and return the bot response including the rendered message, the current node identifier, and the full contextData.
5. THE Flow_Simulator SHALL use separate simulation storage (Simulation_Session records) and SHALL NOT create or modify real WhatsAppConversation rows or trigger the durable outbox (WhatsAppOutboundMessage).
6. THE Flow_Simulator SHALL support running both draft and published flow versions for testing.
7. IF the specified flow id does not exist, the version is not found, or the flow belongs to a business other than the one selected for simulation, THEN THE Flow_Simulator SHALL reject the simulation request and SHALL return an error indicating the flow is not accessible.
8. WHEN a Simulation_Session has received no messages for 60 minutes, THE Flow_Simulator SHALL treat the session as expired and SHALL require a new session to be created before accepting further messages.

### Requirement 8: Runtime Routing Correctness

**User Story:** As a customer, I want my WhatsApp messages to reach the correct business flow regardless of whether the business uses a shared or dedicated number, so that I receive the correct booking experience.

#### Acceptance Criteria

1. WHEN a customer sends a routing code to the shared Salex number, THE Engine_Router SHALL resolve the business from the routing code and start the active Flow_Definition for that business, or the Default_Flow if the business has no active Flow_Definition.
2. WHEN a message arrives on a dedicated WhatsApp number (identified by `phone_number_id`), THE Engine_Router SHALL resolve the business from the WhatsAppChannel record and start the active Flow_Definition for that business, or the Default_Flow if the business has no active Flow_Definition.
3. WHEN the Flow_Engine starts or resumes a flow run for a conversation, THE Flow_Engine context SHALL include: `customerPhone`, `conversationId`, `businessId`, and business metadata (name, category) for template resolution.
4. THE Engine_Router SHALL use only the active Flow_Definition for inbound customer messages routed through the Webhook_Gateway and SHALL NOT serve inactive or draft flow versions to customers.
5. IF the Engine_Router cannot resolve a business from the routing code on the shared number, THEN THE Engine_Router SHALL inform the customer that the code is not recognized and SHALL NOT start a flow run.

### Requirement 9: Booking Flow Correctness

**User Story:** As a customer completing a booking through WhatsApp, I want the flow to handle holds, confirmations, and staff selection correctly without loops or duplicate bookings.

#### Acceptance Criteria

1. WHEN the booking flow reaches the confirmation node after time selection, THE Flow_Engine SHALL create a Booking_Hold (BookingIntent with status PENDING) that reserves the selected slot for a 10-minute holding window, using an idempotencyKey derived from the conversation identifier, sorted service identifiers, and requested time, so that re-processing the same confirmation-node entry does not create a second hold.
2. IF the confirmation node receives a confirm action but no `bookingIntentId` exists in Context_Data, THEN THE Flow_Engine SHALL inform the customer that the hold has expired and SHALL transition the conversation back to the time_picker node without re-attempting confirmation.
3. WHEN the booking node completes successfully, THE Flow_Engine SHALL produce a single outbound confirmation message to the customer containing the booked time and service details, and SHALL mark the conversation interaction as complete by setting the conversation to a terminal state.
4. IF a staff_picker node has been completed earlier in the flow and a `selectedStaffId` exists in Context_Data, THEN THE Flow_Engine SHALL pass that `selectedStaffId` as the `staffId` parameter when creating the booking.
5. THE Flow_Engine SHALL produce at most one outbound message per single inbound message processing cycle, except where auto-advancing through Message_Nodes appends rendered content into a single combined outbound message.
6. THE Flow_Engine SHALL NOT create duplicate bookings for the same BookingIntent; WHEN a confirmed booking already exists for a given `idempotencyKey`, THE Flow_Engine SHALL return the existing booking confirmation rather than finalizing a second booking.
7. IF the Booking_Hold referenced by `bookingIntentId` in Context_Data has a status other than PENDING or an `expiresAt` earlier than the current time when the customer confirms, THEN THE Flow_Engine SHALL mark the hold as EXPIRED, clear the `bookingIntentId` and `requestedTime` from Context_Data, inform the customer that the hold has expired, and transition the conversation to the time_picker node.

### Requirement 10: Simulator Backend Isolation

**User Story:** As a platform admin testing flows, I want the simulator to be completely isolated from production conversations, so that testing does not corrupt real customer data.

#### Acceptance Criteria

1. WHEN the Flow_Simulator processes a message, THE Flow_Simulator SHALL invoke the Flow_Engine with a Simulation_Session as the conversation context, SHALL persist node position and context data only to the Simulation_Session record, and SHALL NOT write to the WhatsAppConversation table.
2. THE Flow_Simulator SHALL NOT trigger the durable outbox (WhatsAppOutboundMessage) or send messages to the Meta WhatsApp API; instead THE Flow_Simulator SHALL return the rendered bot response synchronously to the calling endpoint.
3. WHEN a simulation session is reset, THE Flow_Simulator SHALL delete the Simulation_Session record and all associated SimulatorMessage records for that session without modifying any WhatsAppConversation, WhatsAppOutboundMessage, Booking, or BookingIntent rows.
4. THE Flow_Simulator backend SHALL accept a specific flow id and version to simulate, allowing testing of both draft and published flows without requiring publication.
5. IF the requested flow id does not exist or the requested version is not found for that flow, THEN THE Flow_Simulator SHALL reject the simulation request with an error indicating the flow or version was not found and SHALL NOT create a Simulation_Session.
6. WHEN a simulation reaches a booking node, THE Flow_Simulator SHALL skip the actual BookingIntent creation and booking finalization, and SHALL instead return a simulated booking confirmation response without persisting any Booking or BookingIntent records.

### Requirement 11: Backward Compatibility

**User Story:** As a system operator, I want the new admin flow builder changes to preserve backward compatibility with existing flows and conversations, so that no existing customer interactions are disrupted.

#### Acceptance Criteria

1. THE Flow_Service SHALL continue to support existing flows that use the `isActive` boolean field for activation status, and SHALL treat a flow with `isActive: true` as the single active flow for its business throughout the migration.
2. WHILE the global cutover flag is disabled, THE Engine_Router SHALL fall back to the Legacy_Router when the Flow_Engine fails to process a message, so that every routable conversation reaches an engine.
3. THE Template_Resolver SHALL resolve both old-format variables (`{{businessName}}`, `{{serviceTerm}}`, `{{servicePluralTerm}}`) and new-format variables (`{{business.name}}`, `{{business.category}}`, etc.) to the same values.
4. THE Flow_Engine SHALL process inbound messages through the existing durable inbound queue and SHALL enqueue outbound messages through the existing outbound outbox without changes to their table schemas or processing semantics.
5. IF an existing conversation is mid-flight on the Legacy_Router (its state is one of AWAITING_ROUTING_CODE, SERVICE_SELECTION, TIME_SELECTION, or CONFIRMATION and it has no pinned flowId), THEN THE Engine_Router SHALL continue routing that conversation to the Legacy_Router until it completes or reaches the 24-hour timeout, regardless of new flow activations or cutover flag changes.
6. WHEN the Flow_Engine reads a conversation whose contextData was written by the Legacy_Router, THE Flow_Engine SHALL interpret the legacy context fields without data loss and SHALL NOT require those conversations to be migrated before processing.
7. WHEN a business activates a new flow version, THE Flow_Engine SHALL continue executing in-progress conversations on their originally pinned flow version and SHALL only assign the new version to conversations that start after the activation completes.

### Requirement 12: Question Choice Serialization

**User Story:** As a platform admin, I want question node choices to support structured data with ids and descriptions, so that the flow engine can match interactive replies reliably.

#### Acceptance Criteria

1. THE Flow_Editor SHALL serialize question choices as an array of objects with a required `id` (string, 1–256 characters), a required `title` (string, 1–24 characters), and an optional `description` (string, 1–72 characters), with a maximum of 10 choices per question node.
2. WHEN the question handler renders choices, THE Flow_Engine SHALL use the `id` field for interactive reply matching and the `title` field as the display label in the outbound WhatsApp interactive message.
3. THE Flow_Engine SHALL maintain backward compatibility with existing flows that store choices as plain string arrays by treating each string as both `id` and `title` with `description` absent.
4. IF a question node's choices array contains duplicate `id` values, THEN THE Flow_Editor SHALL reject the save and SHALL report that choice ids must be unique within a single question node.
5. WHEN a question node has 3 or fewer choices, THE Flow_Engine SHALL render them as button-style interactive replies; WHEN a question node has more than 3 choices, THE Flow_Engine SHALL render them as a list-style interactive message.
