# Salex WhatsApp Booking Engine: Node-Based Migration & Scalability Guide

This document is a comprehensive technical specification for migrating the hardcoded WhatsApp state machine to a dynamic, database-driven, node-based flow engine. It highlights the architectural decisions (ADRs) made, details the gap analysis between the current and target systems, and provides step-by-step instructions for implementation and safe cutover.

---

## 1. Context & Architectural Decisions (ADRs)

### ADR 1: JSON Schema Columns vs. Relational Nodes
* **Decision**: Store the visual editor flow graph as a JSONB payload (`definition`) inside the `WhatsAppFlow` model, and keep conversation variables in a unified JSON `contextData` column in `WhatsAppConversation`.
* **Rationale**: Defining relational tables for individual graph nodes, connections, options, and conditional branches would require dozens of tables, complex SQL joins, and migration scripts whenever a new node parameter is added. A JSONB document is highly flexible, parses naturally into TypeScript interfaces, matches visual editors like `React Flow` perfectly, and speeds up database retrieval.

### ADR 2: Two-Phase Engine Execution (Render/Process Split)
* **Decision**: Decouple node actions into a `render` phase (generating the prompt layout) and a `process` phase (handling customer input).
* **Rationale**: Chatbot sessions are stateful interactions. If we process a customer’s reply (e.g. selection of a service), update the state to the next node (e.g. pick a staff member), we must immediately display the options for the *new* node. Splitting the lifecycle allows the engine to transition the state and then immediately render the next node's prompt within the same request-response cycle. It also makes input validation simple—if validation fails during `process`, the engine re-renders the current node with an error banner prefix.

### ADR 3: In-Memory Bulk Availability Filtering
* **Decision**: Fetch all capacity rules and bookings for the search range in a single query, and check slot availability in-memory rather than querying slot-by-slot in database loops.
* **Rationale**: The N+1 query loop in the current time-slot generation system executes 200–350 SQL queries for a single user interaction, leading to database CPU saturation. Moving the logic to CPU memory cuts database operations down to 2–4 queries, reducing latency by over 95%.

### ADR 4: Unified Webhook Gateway Routing
* **Decision**: Maintain a single webhook endpoint (`POST /api/v1/webhooks/whatsapp`) and use the webhook payload’s `phone_number_id` to resolve the `businessId` dynamically from the database.
* **Rationale**: Bypasses the need to create, configure, and maintain custom subdomains or callback endpoints for each business. Whether a business uses a shared channel or registers their own dedicated Meta Developer App (Scenario 2), they configure their app to point to our single endpoint, and our routing controller matches it instantly.

---

## 2. Gap Analysis: Present vs. Needed

| Feature Component | Present (Legacy Codebase) | Needed (Flow Engine Target) |
| :--- | :--- | :--- |
| **Conversational Flows** | Hardcoded switch-case in `conversation.service.ts`; same linear sequence for everyone. | Dynamic graph runner in `FlowEngine`; loads customizable flow definitions from database. |
| **State Definitions** | Fixed enums (`GREETING`, `SERVICE_SELECTION`, etc.) in `conversation.schema.ts`. | Dynamic string identifiers (`currentNodeId`) allowing custom states/nodes. |
| **UI Copy & Texts** | Hardcoded strings in English. Hardcoded category checks for service terminology overrides. | Dynamic message templates inside node configuration; resolved via `TemplateResolver`. |
| **Time-slot Generation** | N+1 loops executing database checks for every candidate hour (`9 AM - 7 PM`). | Optimized `AvailabilityService` fetching database parameters in bulk and checking slots in-memory. |
| **Database Models** | `WhatsAppConversation` tracks state enums and standard context items. | `WhatsAppFlow` model added. `WhatsAppConversation` schema modified to hold `flowId` and `flowVersion`. |
| **Dedicated Channels** | Inbound controller parses webhook metadata but only triggers the hardcoded service. | Inbound controller resolves `businessId` by phone ID and forwards directly to `FlowEngine` (skipping routing gate). |
| **Configuration Interface** | None. Configured in code. | Visual Flow Editor built using `@xyflow/react` (React Flow) on the Admin Dashboard. |

---

## 3. Database Schema Modifications

To track flow configurations and active customer states, update [schema.prisma](file:///Users/manny/Desktop/Mega_Projects/salex_app/salex/packages/shared-types/prisma/schema.prisma) with the following models:

```prisma
model WhatsAppFlow {
  id           String   @id @default(uuid())
  businessId   String   @unique
  business     Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name         String
  description  String?
  version      Int      @default(1)
  isActive     Boolean  @default(false)
  entryNodeId  String
  definition   Json                      // FlowDefinition JSON payload
  createdBy    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([businessId])
}

// Modify existing WhatsAppConversation
model WhatsAppConversation {
  id            String   @id @default(cuid())
  customerPhone String
  businessId    String?
  state         String   @default("GREETING") // Serves as the currentNodeId in the graph
  contextData   Json     @default("{}")       // Accumulates selected values and custom responses
  flowId        String?                       // Pointer to active custom flow (null = default)
  flowVersion   Int?                          // Locked version of the flow definition
  // ... existing fields
}
```

---

## 4. High-Performance Availability Calculations

### The Solution: Bulk In-Memory Filtering
Implement a bulk lookup query in [availability.service.ts](file:///Users/manny/Desktop/Mega_Projects/salex_app/salex/apps/api/src/services/availability.service.ts) to gather all conflict parameters at once:

```typescript
export interface BulkAvailabilityParams {
  businessId: string;
  start: Date;
  end: Date;
}

class AvailabilityService {
  async getBulkAvailabilityData(businessId: string, start: Date, end: Date) {
    const [capacity, bookings, activeStaff, activeResources] = await Promise.all([
      this.getEffectiveCapacity(businessId),
      prisma.booking.findMany({
        where: {
          businessId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          scheduledAt: { lt: end },
          endAt: { gt: start }
        },
        select: {
          id: true,
          scheduledAt: true,
          endAt: true,
          resourceId: true,
          staffId: true
        }
      }),
      prisma.staff.findMany({ where: { businessId, isActive: true }, select: { id: true } }),
      prisma.resource.findMany({ where: { businessId, isActive: true }, select: { id: true } })
    ]);

    return {
      maxCapacity: capacity.effectiveCapacity,
      bookings,
      staffIds: activeStaff.map(s => s.id),
      resourceIds: activeResources.map(r => r.id)
    };
  }
}
```

Implement the filter in-memory inside the `time_picker` handler (reducing DB queries to exactly **4 operations**):
```typescript
// For each candidate slot, evaluate conflicts in CPU memory
const overlappingBookings = bulkData.bookings.filter(b => 
  b.scheduledAt < slotEnd && b.endAt > slotStart
);

const isSlotAvailable = overlappingBookings.length < bulkData.maxCapacity;
```

---

## 5. Flow Engine Runtime Architecture

### A. Graph Type Interfaces
Define these types in a central file (`types.ts` in the flow-engine service):
```typescript
export type NodeType =
  | "message"          // Static text message (auto-advances)
  | "question"         // Text/Choice question, waits for answer
  | "service_picker"   // Lists catalog services, waits for choice
  | "staff_picker"     // Lists available staff, waits for choice
  | "time_picker"      // Lists slots using optimized bulk engine, waits for choice
  | "confirmation"     // Asks for confirmation
  | "booking";         // Finalizes booking intent

export interface FlowNode {
  id: string;
  type: NodeType;
  config: Record<string, any>;
}

export interface EdgeCondition {
  field: string;
  operator: "eq" | "neq" | "contains" | "gt" | "lt";
  value: any;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  condition?: EdgeCondition; // Null represents the fallback edge
}

export interface FlowDefinition {
  entryNodeId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}
```

### B. The Two-Phase Node Lifecycle Pattern
To resolve prompt rendering bugs, every handler must implement both a **presentation** (`render`) phase and an **input validation** (`process`) phase:

```typescript
export interface NodeResult {
  complete: boolean;
  contextUpdates?: Record<string, any>;
  errorMessage?: string;
}

export interface NodeHandler {
  // Phase 1: Render the WhatsApp message payload (Text/Buttons/Lists) to show the user
  render: (
    config: Record<string, any>,
    context: Record<string, any>,
    businessId: string
  ) => Promise<InteractiveMessage>;

  // Phase 2: Process the user's incoming response
  process: (
    incomingMessage: string,
    interactiveReply: any,
    config: Record<string, any>,
    context: Record<string, any>,
    businessId: string
  ) => Promise<NodeResult>;
}
```

### C. Core Engine Execution Loop Pseudocode
Here is the core logic flow to implement in `FlowEngine.processMessage()`:

```typescript
async processMessage(
  businessId: string,
  customerPhone: string,
  incomingMessage: string,
  interactiveReply?: any
): Promise<InteractiveMessage> {
  // 1. Resolve and load flow definition
  const flow = await this.getFlowForBusiness(businessId);
  const session = await this.getOrCreateConversationSession(customerPhone, businessId, flow);

  let currentNodeId = session.state;
  let context = session.contextData;

  // 2. If starting fresh, render the entry node immediately
  if (currentNodeId === "GREETING" && !incomingMessage && !interactiveReply) {
    const entryNode = flow.nodes.find(n => n.id === flow.entryNodeId)!;
    session.state = entryNode.id;
    await this.saveSessionState(session.id, entryNode.id, context);
    return handlerMap[entryNode.type].render(entryNode.config, context, businessId);
  }

  // 3. Retrieve handler for the active node
  let currentNode = flow.nodes.find(n => n.id === currentNodeId)!;
  const handler = handlerMap[currentNode.type];

  // 4. Process incoming message response
  const result = await handler.process(incomingMessage, interactiveReply, currentNode.config, context, businessId);

  // 5. Update context
  if (result.contextUpdates) {
    context = { ...context, ...result.contextUpdates };
  }

  if (result.complete) {
    // 6. Transition to next node
    const nextNodeId = this.resolveNextNode(flow.edges, currentNodeId, context);
    let nextNode = flow.nodes.find(n => n.id === nextNodeId)!;

    // Handle cascading auto-advance nodes (e.g. static "message" nodes) in a loop
    while (this.isAutoAdvance(nextNode.type)) {
      const msgHandler = handlerMap[nextNode.type];
      const renderedMsg = await msgHandler.render(nextNode.config, context, businessId);
      
      // Store static message in context or aggregate it
      const nextTransition = this.resolveNextNode(flow.edges, nextNode.id, context);
      nextNode = flow.nodes.find(n => n.id === nextTransition)!;
    }

    // Save transition state
    await this.saveSessionState(session.id, nextNode.id, context);

    // Render the prompt for the newly reached node
    return handlerMap[nextNode.type].render(nextNode.config, context, businessId);
  } else {
    // If validation failed, re-render current node with error prompt
    await this.saveSessionState(session.id, currentNodeId, context);
    const regularRender = await handler.render(currentNode.config, context, businessId);
    if (result.errorMessage) {
      regularRender.body.text = `⚠️ ${result.errorMessage}\n\n${regularRender.body.text}`;
    }
    return regularRender;
  }
}
```

---

## 6. Scenario 2: Dedicated Channel & Independent Meta App Integration

In this scenario, a business connects their own dedicated number running on their own Meta App configuration.

### A. Webhook Controller Mapping
When a message hits the global webhook `POST /api/v1/webhooks/whatsapp`, map the transaction dynamically:
```typescript
// Extract Meta Metadata
const phoneNumberId = payload.entry[0].changes[0].value.metadata.phone_number_id;

// Match against registered WhatsApp channels
const channel = await prisma.whatsAppChannel.findUnique({
  where: { phoneNumberId }
});

if (channel?.businessId) {
  // Bypasses routing selection, routes straight to the business flow engine
  return flowEngine.processMessage(channel.businessId, customerPhone, messageText, interactiveReply);
} else {
  // Bypasses to shared Salex router (prompts for business S1234 routing code)
  return legacyRouter.processMessage(customerPhone, messageText, interactiveReply);
}
```

### B. Webhook Verification Handshake
Explain to the business how to register your verification endpoint in *their* Meta App dashboard:
1. **Callback URL**: `https://api.salex.app/api/v1/webhooks/whatsapp`
2. **Verify Token**: Expose the verification token (configured via `process.env.WHATSAPP_VERIFY_TOKEN`) in the Admin panel so the developer can copy-paste it.
3. The verification `GET` controller will automatically match their handshake request because it checks the token globally:
   ```typescript
   if (verifyToken === config.whatsappVerifyToken) {
     res.status(200).send(challenge);
   }
   ```

---

## 7. Migration Plan (Strangler Fig Pattern)

To launch this changes safely without disrupting ongoing bookings in production, complete implementation in these phases:

```
Phase 1: Extract Utilities ➔ Phase 2: Implement Flow Engine ➔ Phase 3: Parallel Feature Flag Routing ➔ Phase 4: Full Cutover & Legacy Code Cleanup
```

### Phase 1: Decoupling (Days 1-3)
* Move database queries out of `conversation.service.ts`.
* Re-factor `AvailabilityService` to support the bulk query method (`getBulkAvailabilityData`).
* Make sure `schema.prisma` is migrated (`prisma db push`) with the new JSON configuration column `whatsappSettings` on `Business` and the `WhatsAppFlow` model.

### Phase 2: Flow Engine Setup (Days 4-7)
* Implement `flow-engine.service.ts` and the `NodeHandler` interfaces.
* Create the hardcoded `DEFAULT_FLOW` structure matching the current default onboarding path.
* Add comprehensive unit tests mapping legacy inputs to the new engine inputs, validating that rendering output matches byte-for-byte.

### Phase 3: Segmented Routing (Days 8-10)
* Add a database toggle flag or check for the presence of an active `WhatsAppFlow` model.
* Route only flagged businesses (or your own internal test sandbox channels) to the new engine. Keep all production traffic running on the old state-machine handlers.

### Phase 4: Cleanup & Deprecation (Days 11-12)
* Switch the global feature flag to route all businesses through the `FlowEngine` utilizing `DEFAULT_FLOW`.
* Once verified, delete the legacy routing switch cases, state handlers, and deprecated helper variables from `conversation.service.ts`.
* Maintain `conversation.service.ts` solely as a sanitization and controller-routing proxy.
