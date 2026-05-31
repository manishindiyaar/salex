# Requirements Document

## Introduction

Salex currently runs WhatsApp bookings through a hardcoded state machine in `conversation.service.ts`. A single switch-case drives every conversation through the same linear path (GREETING → AWAITING_ROUTING_CODE → SERVICE_SELECTION → TIME_SELECTION → CONFIRMATION → COMPLETED), every business shares one WhatsApp number, time-slot generation fires roughly 200-350 database queries per interaction, and any new booking workflow requires a code change and a redeploy.

This feature replaces that hardcoded machine with a dynamic, database-driven, node-based **Flow_Engine**. Each business owns a versioned **Flow_Definition**: a JSON graph of typed nodes (message, question, service_picker, staff_picker, time_picker, confirmation, booking) connected by conditional edges. The engine executes a definition at runtime using a two-phase render/process node lifecycle, so a business owner can change their booking conversation by editing the graph instead of editing code. A built-in **Default_Flow** reproduces the current legacy booking path so existing businesses see no behavioral change until they customize their own flow.

The existing infrastructure is preserved and reused: bulk in-memory availability calculation, the durable inbound queue and outbound outbox, the per-customer processing lock, message deduplication, booking idempotency through the Booking_Hold, conversation timeouts, identity records, the audit trail, strict multi-tenant isolation, and observability. Businesses can still connect their own dedicated WhatsApp numbers (their own Meta App) in addition to the shared Salex number, and a visual **Flow_Editor** in the admin dashboard (built with React Flow / `@xyflow/react`) lets owners design their own flows.

The migration follows a Strangler Fig pattern: an **Engine_Router** sends flagged businesses (or those with an active custom flow) to the Flow_Engine while everyone else stays on the **Legacy_Router**, a routing fallback guarantees every conversation reaches an engine, and a global cutover routes everyone to the Flow_Engine using the Default_Flow once parity is verified. Backward compatibility of in-flight conversations, booking idempotency, conversation timeouts, identity records, the audit trail, and the durable inbound/outbound queue must be preserved throughout.

This document defines WHAT the system must do and WHY. Implementation details (schema field types, engine pseudocode, handler signatures, and code) belong to the design phase.

## Glossary

- **Salex_Platform**: The overall Salex system, comprising the Flow_Engine, the Engine_Router, the Legacy_Router, the Webhook_Gateway, the Flow_Editor, and the supporting services.
- **Flow_Engine**: The dynamic, database-driven graph runner that loads a business's Flow_Definition and executes the conversation node by node, replacing the hardcoded switch-case state machine.
- **Flow_Definition**: A versioned, per-business record describing a conversation as a graph. It carries a name, a version number, an active indicator, an entry node identifier, and the node-and-edge graph definition.
- **Default_Flow**: A built-in Flow_Definition that reproduces the legacy booking sequence (greeting, service selection, time selection, confirmation, booking). It is used for any business that has no active custom Flow_Definition.
- **Node**: A single step in a Flow_Definition with a type that governs how it renders and how it processes the customer's reply. Supported types are message, question, service_picker, staff_picker, time_picker, confirmation, and booking.
- **Message_Node**: A node of type message that presents static text and auto-advances without waiting for customer input.
- **Edge**: A directed connection from a source node to a destination node. An edge may carry a condition.
- **Conditional_Edge**: An edge whose condition (a field, an operator from eq, neq, contains, gt, lt, and a value) must evaluate true against Context_Data for the edge to be taken.
- **Fallback_Edge**: An edge with no condition, taken from its source node when no Conditional_Edge matches. A source node may have at most one Fallback_Edge.
- **Current_Node**: The node a conversation is currently positioned on, tracked as a node identifier (a string) rather than a fixed state enumeration.
- **Context_Data**: A JSON object on a conversation that accumulates routing state, customer responses, and selected values (service, time, booking hold id) across the run.
- **Template_Resolver**: The component that resolves node message templates and service terminology (clinic, salon, or generic) for the resolved business.
- **Availability_Service**: The service that computes effective capacity and bookable time slots for a business in bulk.
- **Effective_Capacity**: The maximum number of concurrent bookings for a business at a given time, defined as the minimum of active resources and active staff.
- **Booking_Hold**: A short-lived idempotent reservation (the existing BookingIntent) that holds a slot for a bounded window before confirmation.
- **Webhook_Gateway**: The single inbound webhook endpoint that verifies the Meta verify-token handshake, validates the inbound signature, resolves the owning business from the inbound `phone_number_id`, and forwards the message into the durable pipeline.
- **WhatsApp_Channel**: A record linking a business to a WhatsApp number, with a mode of SHARED or DEDICATED and a unique `phone_number_id`.
- **Engine_Router**: The component that decides, per conversation, whether the Flow_Engine or the Legacy_Router handles a message, and that falls back to the other engine on failure.
- **Legacy_Router**: The retained shared-number entry path that prompts an unrouted customer for a 4-character routing code before binding the conversation to a business; during migration it also serves businesses not yet moved to the Flow_Engine.
- **Flow_Editor**: The authenticated, visual graph editor in the admin dashboard (built with React Flow / `@xyflow/react`) that lets a business owner create, view, update, delete, version, and activate Flow_Definitions for their own business.
- **Admin_Dashboard**: The authenticated Salex admin web application where business owners manage their business, including the Flow_Editor and channel settings.
- **Business_Owner**: A merchant who configures flows and channels for their business.
- **Customer**: An end user who books through WhatsApp.
- **Platform_Admin**: A Salex operator who manages migration, segmentation, and platform-wide configuration.
- **Developer_Integrator**: A developer who connects a business's own dedicated Meta App and registers the callback URL and verify token.

## Requirements

### Requirement 1: Per-Business Versioned Flow Definitions

**User Story:** As a business owner, I want my WhatsApp booking conversation defined as data that I can version, so that I can change my booking experience without a code change or redeploy and without breaking customers who are mid-booking.

#### Acceptance Criteria

1. THE Flow_Engine SHALL store each business's conversation as a Flow_Definition that records a name, a version number, an active indicator, an entry node identifier, and a node-and-edge graph definition, in place of the hardcoded switch-case state machine.
2. WHEN a business owner saves a change to a flow, THE Flow_Engine SHALL persist it as a new version equal to the business's previous highest version plus one and SHALL retain all previously saved versions.
3. THE Flow_Engine SHALL maintain at most one active Flow_Definition per business.
4. IF a business has no active Flow_Definition, THEN THE Flow_Engine SHALL conduct the conversation using the Default_Flow.
5. THE Flow_Engine SHALL associate each Flow_Definition with exactly one business and SHALL prevent one business's Flow_Definition from being used for another business.

### Requirement 2: Node-Based Flow Structure

**User Story:** As a business owner, I want my flow built from typed nodes and conditional connections, so that I can model branching booking conversations with reusable building blocks.

#### Acceptance Criteria

1. THE Flow_Definition SHALL represent a conversation as a graph of typed nodes connected by directed edges.
2. THE Flow_Definition SHALL designate exactly one node as the entry node, and that entry node SHALL reference a node that exists in the definition.
3. THE Flow_Definition SHALL support nodes of type message, question, service_picker, staff_picker, time_picker, confirmation, and booking.
4. THE Flow_Definition SHALL support Conditional_Edges whose conditions use exactly one of the operators eq, neq, contains, gt, or lt.
5. WHERE an edge carries no condition, THE Flow_Engine SHALL treat that edge as the Fallback_Edge for its source node.
6. THE Flow_Definition SHALL allow at most one Fallback_Edge per source node.

### Requirement 3: Two-Phase Node Lifecycle

**User Story:** As a business owner, I want each node to first show its prompt and then handle the reply, so that after a customer answers, the next node's prompt appears immediately and correctly in the same exchange.

#### Acceptance Criteria

1. WHEN a node is reached, THE Flow_Engine SHALL render that node into an outbound message presented to the customer.
2. WHEN a customer reply is received for the Current_Node, THE Flow_Engine SHALL process the reply and determine whether the node is complete.
3. WHEN the Flow_Engine transitions a conversation to a destination node, THE Flow_Engine SHALL persist the destination node as the Current_Node and render its message as a single atomic operation, so that the persisted Current_Node always equals the node whose rendered message is returned.
4. IF rendering the destination node fails after a transition is computed, THEN THE Flow_Engine SHALL leave the persisted Current_Node unchanged and SHALL NOT record a partial advance.
5. WHEN a node completes, THE Flow_Engine SHALL merge the node's context updates into Context_Data before evaluating the next transition.

### Requirement 4: Conditional Transitions and Auto-Advance

**User Story:** As a business owner, I want transitions chosen by the customer's answers and static messages to flow through automatically, so that customers reach the right next step without unnecessary pauses.

#### Acceptance Criteria

1. WHEN evaluating the next node from the Current_Node, THE Flow_Engine SHALL select the destination of the first Conditional_Edge, in definition order, whose condition evaluates true against Context_Data.
2. IF no Conditional_Edge matches, THEN THE Flow_Engine SHALL select the destination of the source node's Fallback_Edge.
3. WHEN a transition reaches a Message_Node, THE Flow_Engine SHALL render that node and automatically advance to its next node without waiting for customer input.
4. IF auto-advancing detects a cycle among Message_Nodes, THEN THE Flow_Engine SHALL stop advancing and SHALL treat the condition as a dead-end.
5. IF neither a matching Conditional_Edge nor a Fallback_Edge exists for the Current_Node, THEN THE Flow_Engine SHALL return a message informing the customer that the conversation cannot continue.

### Requirement 5: Dynamic Conversation State and Version Pinning

**User Story:** As a business owner, I want in-progress conversations to keep running on the flow version they started on while new conversations pick up my newly activated version, so that publishing a change never breaks a customer who is mid-booking.

#### Acceptance Criteria

1. THE Flow_Engine SHALL track a conversation's position as a Current_Node identifier rather than a fixed booking state enumeration.
2. WHEN a conversation begins a flow run, THE Flow_Engine SHALL pin the conversation to the flow identifier and flow version that are active for that business at that time.
3. WHILE a conversation is in progress, THE Flow_Engine SHALL load and execute the flow version pinned to that conversation regardless of later activations.
4. WHEN a business activates a new flow version, THE Flow_Engine SHALL pin conversations that start after the activation completes to the newly activated version.
5. WHEN a node completes, THE Flow_Engine SHALL accumulate the customer's responses and selected values in Context_Data so that values captured by earlier nodes remain available to later nodes.

### Requirement 6: High-Performance Availability Calculation

**User Story:** As a platform admin, I want time-slot generation to read availability data in bulk instead of querying per slot, so that a single customer interaction no longer saturates the database.

#### Acceptance Criteria

1. WHEN evaluating bookable time slots for a search range, THE Availability_Service SHALL retrieve effective capacity, overlapping bookings, active staff, and active resources for that range in a single bulk retrieval that uses a bounded set of queries that does not grow with the number of candidate slots.
2. THE Availability_Service SHALL determine each candidate slot's availability in memory from the bulk-retrieved data rather than issuing per-slot database queries.
3. THE Availability_Service SHALL compute Effective_Capacity as the minimum of the count of active resources and the count of active staff for the business.
4. WHEN counting bookings that conflict with a candidate slot, THE Availability_Service SHALL count a booking as overlapping when its scheduled start is before the slot end and its end is after the slot start.
5. THE Availability_Service SHALL treat a candidate slot as bookable only WHILE the count of overlapping bookings is less than the Effective_Capacity for that slot.
6. THE Availability_Service SHALL produce the same bookable or unbookable determination for a given slot as the current slot-by-slot calculation produces for that slot.

### Requirement 7: Dedicated Channel Routing

**User Story:** As a business owner, I want to connect my own dedicated WhatsApp number, so that customers reach my business directly without entering a routing code and are handed straight to my flow.

#### Acceptance Criteria

1. WHEN an inbound message arrives, THE Webhook_Gateway SHALL resolve the owning business by matching the message's `phone_number_id` to a registered WhatsApp_Channel.
2. WHERE the resolved WhatsApp_Channel is a DEDICATED channel bound to a business, THE Flow_Engine SHALL route the conversation directly to that business's flow without prompting for a routing code.
3. WHEN an inbound message whose signature has validated arrives with a `phone_number_id` that matches no registered DEDICATED WhatsApp_Channel, THE Webhook_Gateway SHALL route the message to the Legacy_Router shared-number path rather than rejecting or discarding the message, and SHALL record the unmatched `phone_number_id` for observability.
4. WHILE a WhatsApp_Channel is in DEDICATED mode, THE Flow_Engine SHALL NOT prompt the customer for a routing code.
5. WHEN sending an outbound message for a business on a dedicated channel, THE Flow_Engine SHALL send it from that business's own `phone_number_id`.

### Requirement 8: Shared-Number Routing and Verification Handshake

**User Story:** As a customer messaging the shared Salex number, I want to enter a short code to reach a specific business; and as a developer integrating a dedicated Meta App, I want to retrieve the verification token, so that I can register my callback URL.

#### Acceptance Criteria

1. WHEN an inbound message arrives on the shared number and is not yet bound to a business, THE Legacy_Router SHALL prompt the customer for a 4-character routing code.
2. WHEN a customer supplies a valid routing code on the shared number, THE Legacy_Router SHALL bind the conversation to the matching business.
3. WHEN a verification request is received at the webhook endpoint, THE Webhook_Gateway SHALL respond successfully only IF the supplied verify token equals the platform's configured verify token.
4. THE Admin_Dashboard SHALL expose the configured webhook verify token to authorized business owners so that a Developer_Integrator can register their dedicated Meta App callback.
5. IF an inbound message payload's `x-hub-signature-256` signature does not validate against the configured signing secret, THEN THE Webhook_Gateway SHALL reject the payload.

### Requirement 9: Default Flow Parity

**User Story:** As a business owner, I want the built-in default flow to behave exactly like the current bot, so that customers see no change until I choose to customize my flow.

#### Acceptance Criteria

1. THE Default_Flow SHALL reproduce the legacy booking sequence of greeting, service selection, time selection, confirmation, and booking.
2. WHEN a customer books through the Default_Flow, THE Flow_Engine SHALL produce a booking outcome equivalent to the one the legacy state machine produces for the same inputs.
3. WHERE a business category indicates a clinic, THE Template_Resolver SHALL use clinic terminology for service-related wording; WHERE the category indicates a salon, THE Template_Resolver SHALL use salon terminology; and WHERE the category is neither clinic nor salon, THE Template_Resolver SHALL use generic service terminology applicable to any business type.
4. THE Default_Flow SHALL finalize bookings through the existing booking finalization path, including resource and staff assignment.

### Requirement 10: Visual Flow Editor

**User Story:** As a business owner, I want a visual editor in the admin dashboard to design my booking flow, so that I can configure nodes, message text, and branching without writing code or hand-editing JSON.

#### Acceptance Criteria

1. THE Flow_Editor SHALL allow an authorized business owner to create, view, update, and delete Flow_Definitions for the owner's own business from within the Admin_Dashboard.
2. THE Flow_Editor SHALL allow a business owner to configure nodes, their message text, and Conditional_Edges using a visual graph editor.
3. WHEN a business owner saves a flow, THE Flow_Editor SHALL persist the flow as a new version.
4. THE Flow_Editor SHALL allow a business owner to activate or deactivate a Flow_Definition for their business.
5. THE Flow_Editor SHALL display only Flow_Definitions belonging to the business owner's own business.
6. IF a flow being saved references an entry node or an edge endpoint that does not exist among the flow's nodes, THEN THE Flow_Editor SHALL reject the save and SHALL report the offending node or edge identifier.

### Requirement 11: Segmented Migration and Cutover

**User Story:** As a platform admin, I want to send only selected businesses to the Flow_Engine while everyone else stays on the legacy router, so that I can verify parity before a full cutover.

#### Acceptance Criteria

1. WHERE a business is flagged for the Flow_Engine or has an active Flow_Definition, THE Engine_Router SHALL route that business's conversations to the Flow_Engine.
2. WHERE a business is neither flagged for the Flow_Engine nor has an active Flow_Definition, THE Engine_Router SHALL route that business's conversations to the Legacy_Router.
3. WHEN the Platform_Admin enables the global cutover, THE Engine_Router SHALL route all conversations to the Flow_Engine, using the Default_Flow where a business has no active Flow_Definition.
4. IF the selected engine fails while processing a message, THEN THE Engine_Router SHALL fall back to the other engine so that every routable conversation reaches an engine.
5. THE Engine_Router SHALL record, for each routed conversation, which engine handled it so that parity between the Flow_Engine and the Legacy_Router can be verified.

### Requirement 12: Input Validation and Error Recovery

**User Story:** As a customer, I want clear feedback when my input is not valid and a chance to fix it, so that I am not stuck or silently dropped during booking.

#### Acceptance Criteria

1. IF a customer reply fails validation for the Current_Node, THEN THE Flow_Engine SHALL re-render the Current_Node prefixed with an error banner describing the problem.
2. WHEN re-rendering the Current_Node after a validation failure, THE Flow_Engine SHALL keep the conversation on the same Current_Node.
3. IF a customer attempts to book with a business that has no available services, THEN THE Flow_Engine SHALL inform the customer that no services are available and SHALL NOT advance to time selection.
4. IF a business is inactive or not accepting orders when a customer attempts to book, THEN THE Flow_Engine SHALL inform the customer that booking is unavailable and SHALL NOT create a Booking_Hold.

### Requirement 13: Booking Integrity Under Concurrency

**User Story:** As a customer, I want my chosen slot to be honored or to be told clearly if it was just taken, so that I never end up with a double-booked or lost reservation.

#### Acceptance Criteria

1. WHEN a customer selects a time slot, THE Flow_Engine SHALL create a Booking_Hold that reserves the slot idempotently for a bounded holding window.
2. IF a Booking_Hold has expired when the customer confirms, THEN THE Flow_Engine SHALL inform the customer that the hold expired and SHALL prompt the customer to choose a time again.
3. IF the selected slot's overlapping bookings have reached Effective_Capacity between slot selection and confirmation, THEN THE Flow_Engine SHALL re-validate availability at confirmation, SHALL inform the customer that the slot is no longer available, and SHALL NOT finalize the booking.
4. WHEN a confirmed booking is finalized, THE Flow_Engine SHALL finalize the booking idempotently through the existing Booking_Hold and booking finalization path.
5. WHEN the same booking confirmation is processed more than once with the same idempotency key, THE Flow_Engine SHALL finalize at most one booking.

### Requirement 14: Conversation Lifecycle and Timeout

**User Story:** As a customer, I want a fresh start if I return after a long gap, so that I am not stranded in a stale half-finished conversation.

#### Acceptance Criteria

1. WHEN a customer sends a message more than 24 hours after their last message, THE Flow_Engine SHALL reset the conversation to its flow's entry node and start a new booking interaction.
2. WHEN a conversation's booking finalizes successfully, THE Flow_Engine SHALL mark the conversation interaction as complete.
3. THE Flow_Engine SHALL maintain one active conversation per combination of customer phone number and business.
4. IF the flow version pinned to an in-progress conversation cannot be loaded or fails validation, THEN THE Flow_Engine SHALL reset the conversation to the entry node of the business's active flow and SHALL inform the customer that the conversation is restarting.

### Requirement 15: Backward Compatibility and Durable Processing

**User Story:** As a platform admin, I want existing data and the durable message pipeline to keep working through the migration, so that no inbound message, booking, or customer record is lost.

#### Acceptance Criteria

1. THE Flow_Engine SHALL process inbound messages through the existing durable inbound queue, deduplicating by the WhatsApp message identifier.
2. THE Flow_Engine SHALL enqueue outbound messages through the existing outbound outbox with retry and backoff.
3. WHILE processing a message for a customer, THE Flow_Engine SHALL hold the existing per-customer processing lock so that concurrent messages for the same customer are serialized; and IF the lock cannot be acquired, THEN THE Flow_Engine SHALL leave the message in the inbound queue for a later processing attempt rather than processing it concurrently.
4. WHEN a customer books, THE Flow_Engine SHALL preserve the existing customer and per-business customer identity records.
5. THE Flow_Engine SHALL preserve the existing booking audit trail for bookings created through the Flow_Engine.
6. WHEN the migration introduces new conversation fields, THE Flow_Engine SHALL continue to operate on conversations that predate those fields without data loss.

### Requirement 16: Multi-Tenant Isolation and Endpoint Security

**User Story:** As a platform admin, I want strict tenant isolation and no new unauthenticated surfaces beyond the protected webhook, so that one business can never read or affect another business's data and the platform stays secure.

#### Acceptance Criteria

1. THE Salex_Platform SHALL scope every flow, conversation, availability, and booking operation to a single resolved business.
2. THE Salex_Platform SHALL prevent a business's flows, conversations, availability data, and bookings from being exposed to or modified by any other business.
3. THE Flow_Editor SHALL require an authenticated and authorized business owner session for every flow management operation.
4. THE Salex_Platform SHALL NOT introduce any new endpoint that performs flow management or returns business data without authentication and authorization, except the webhook endpoints, which are protected by verify-token and signature validation.
5. WHEN a flow management request targets a business other than the requester's own, THE Flow_Editor SHALL deny the request.

### Requirement 17: Observability

**User Story:** As a platform admin, I want node transitions, routing decisions, and engine errors logged with enough detail to diagnose issues, so that I can support businesses and verify the migration without leaking secrets.

#### Acceptance Criteria

1. WHEN the Flow_Engine transitions a conversation between nodes, THE Flow_Engine SHALL log the conversation identifier, the source node, and the destination node.
2. IF the Flow_Engine encounters a missing node, an unmatched transition, or a handler error, THEN THE Flow_Engine SHALL log the error with the conversation identifier and the node identifier.
3. WHEN the Engine_Router routes a message, THE Engine_Router SHALL log the resolved business identifier and which engine was chosen to handle the conversation.
4. THE Salex_Platform SHALL exclude message-body secrets and signing tokens from logged output.
