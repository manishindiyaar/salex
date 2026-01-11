# Design Document: Backend Migration

## Overview

This design document describes the architecture for migrating from the legacy NestJS backend to a modern Express.js + Supabase stack. The system enables:

1. **Merchant Authentication**: Hybrid OTP system with Twilio (production) and mock (development) modes, minting Custom JWTs signed with Supabase Project Secret for RLS enforcement
2. **Business Management**: Routing code generation for WhatsApp discovery, capacity configuration (maxConcurrentBookings)
3. **Strict Availability Engine**: Prevents double-bookings using time overlap queries and concurrency limits
4. **Financial Integrity**: Price snapshots frozen at booking creation, immutable regardless of future price changes
5. **Stateless WhatsApp Flows**: Conversation state stored in database, enabling horizontal API scaling
6. **Real-time Notifications**: Supabase Realtime via Postgres WAL (no Node.js socket emission required)

The architecture creates two primary artifacts:
- **@salex/shared-types** - Centralized Prisma schema, generated client, Zod validation schemas, and TypeScript types
- **apps/api** - Express.js backend with RESTful endpoints, Custom JWT authentication, and proper error handling

## Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        MA[Merchant App<br/>React Native]
        WA[WhatsApp<br/>Customer Interface]
    end
    
    subgraph "API Layer - apps/api"
        WH[Webhook Handler<br/>Signature Verification]
        R[Routes] --> AM[Auth Middleware<br/>JWT Validation]
        AM --> VM[Validation Middleware<br/>Zod Schemas]
        VM --> C[Controllers]
        C --> S[Services]
    end
    
    subgraph "packages/shared-types"
        PS[Prisma Schema] --> PC[Prisma Client]
        PS --> ZS[Zod Schemas]
        PC --> TS[TypeScript Types]
        ZS --> TS
    end
    
    subgraph "Data Layer"
        DB[(Supabase PostgreSQL)]
        RT[Supabase Realtime<br/>Postgres WAL]
    end
    
    subgraph "External Services"
        TW[Twilio Verify<br/>OTP SMS]
        META[Meta WhatsApp<br/>Cloud API]
    end
    
    MA --> R
    WA --> META
    META --> WH
    WH --> S
    S --> PC
    PC --> DB
    DB --> RT
    RT -.->|RLS Filtered| MA
    S --> TW
    S --> META
    TS --> C
    TS --> MA
    ZS --> VM
```

### Hybrid Authentication Flow

```mermaid
sequenceDiagram
    participant App as Merchant App
    participant API as Express API
    participant Twilio as Twilio Verify
    participant DB as Supabase DB
    
    App->>API: POST /v1/auth/otp/request {phone}
    
    alt Production Mode
        API->>Twilio: Send OTP SMS
        Twilio-->>API: Success
    else Development Mode
        API->>API: Log OTP to console
    end
    
    API-->>App: {success: true}
    
    App->>API: POST /v1/auth/otp/verify {phone, otp}
    API->>API: Verify OTP (Twilio or mock)
    API->>DB: prisma.user.upsert({phone})
    DB-->>API: User record
    
    Note over API: Mint Custom JWT<br/>signed with Supabase Secret<br/>payload: {sub: user.id}
    
    API-->>App: {token: "eyJ...", user: {...}}
```

### Request Flow with RLS

```mermaid
sequenceDiagram
    participant Client
    participant Router
    participant AuthMiddleware
    participant ValidationMiddleware
    participant Controller
    participant Service
    participant Prisma
    participant Database
    participant Realtime

    Client->>Router: HTTP Request + JWT
    Router->>AuthMiddleware: Check Custom JWT
    AuthMiddleware->>AuthMiddleware: Verify with Supabase Secret
    AuthMiddleware->>AuthMiddleware: Extract sub (user.id)
    AuthMiddleware->>ValidationMiddleware: Pass user context
    ValidationMiddleware->>ValidationMiddleware: Zod parse body
    ValidationMiddleware->>Controller: Validated request
    Controller->>Service: Business logic call
    Service->>Prisma: Database operation
    Prisma->>Database: SQL query
    Database-->>Prisma: Result
    Database->>Realtime: Postgres WAL event
    Realtime-->>Client: RLS-filtered push (if subscribed)
    Prisma-->>Service: Typed result
    Service-->>Controller: Domain object
    Controller-->>Client: JSON response
```

## Components and Interfaces

### Shared Types Package Structure

```
packages/shared-types/
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma
└── src/
    ├── index.ts              # Main export barrel
    ├── prisma.ts             # Re-export Prisma client
    ├── schemas/
    │   ├── index.ts          # Schema exports
    │   ├── user.schema.ts
    │   ├── customer.schema.ts
    │   ├── business.schema.ts
    │   ├── service.schema.ts
    │   ├── booking.schema.ts
    │   └── conversation.schema.ts
    └── types/
        ├── index.ts          # Type exports
        ├── api.types.ts      # API request/response types
        └── domain.types.ts   # Domain model types
```

### Express API Structure

```
apps/api/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Express app setup
│   ├── config/
│   │   └── index.ts          # Environment configuration
│   ├── middleware/
│   │   ├── auth.middleware.ts      # Custom JWT validation
│   │   ├── validation.middleware.ts # Zod validation
│   │   ├── webhook.middleware.ts   # WhatsApp signature verification
│   │   ├── simulator.middleware.ts # Simulator mode detection
│   │   └── error.middleware.ts     # Global error handler
│   ├── routes/
│   │   ├── index.ts          # Route aggregator
│   │   ├── health.routes.ts
│   │   ├── auth.routes.ts    # OTP request/verify
│   │   ├── business.routes.ts
│   │   ├── service.routes.ts
│   │   ├── booking.routes.ts
│   │   ├── conversation.routes.ts
│   │   ├── webhook.routes.ts       # WhatsApp webhooks (production)
│   │   └── simulator.routes.ts     # WhatsApp simulator (development)
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── business.controller.ts
│   │   ├── service.controller.ts
│   │   ├── booking.controller.ts
│   │   ├── conversation.controller.ts
│   │   ├── webhook.controller.ts
│   │   └── simulator.controller.ts
│   └── services/
│       ├── auth.service.ts         # OTP + JWT minting
│       ├── business.service.ts
│       ├── service.service.ts
│       ├── booking.service.ts      # Availability engine
│       ├── conversation.service.ts # State machine
│       ├── routing-code.service.ts
│       ├── whatsapp.service.ts     # Meta API client
│       ├── simulator-message.service.ts  # Simulator message storage
│       └── webhook-enhancer.service.ts   # Simulator webhook creation
└── tests/
    ├── unit/
    ├── property/
    └── integration/
```

### WhatsApp Simulator Architecture

The simulator allows end-to-end testing of the booking flow without using the actual WhatsApp Cloud API.

```mermaid
graph TB
    subgraph "WhatsApp Mock UI"
        UI[Browser UI<br/>WhatsappMockUI/]
        UI -->|POST /send| SIM
        UI -->|GET /poll| SIM
    end
    
    subgraph "Simulator Layer"
        SIM[Simulator Controller<br/>/api/v1/whatsapp-simulator]
        SIM -->|Create webhook payload| WE[Webhook Enhancer Service]
        WE -->|Same format as Meta| CONV
        SIM -->|Store messages| SMS[Simulator Message Store]
    end
    
    subgraph "Shared Conversation Logic"
        CONV[Conversation Service<br/>State Machine]
        CONV -->|Update state| DB[(Database)]
        CONV -->|Create booking| BOOK[Booking Service]
    end
    
    subgraph "Production Path"
        META[Meta WhatsApp API] -->|POST /webhooks/whatsapp| WH[Webhook Controller]
        WH -->|Verify signature| CONV
        CONV -->|Send response| META
    end
    
    SMS -->|Poll responses| UI
```

### Simulator Message Flow

```mermaid
sequenceDiagram
    participant UI as Mock UI
    participant SIM as Simulator Controller
    participant WE as Webhook Enhancer
    participant CONV as Conversation Service
    participant DB as Database
    participant SMS as Message Store

    UI->>SIM: POST /send {customerPhone, message}
    SIM->>WE: createSimulatorWebhookPayload()
    Note over WE: Creates WhatsApp Cloud API<br/>format webhook payload
    WE-->>SIM: WhatsAppWebhookPayload
    
    SIM->>CONV: processMessage(webhookPayload)
    CONV->>DB: upsert Customer
    CONV->>DB: upsert Conversation
    CONV->>CONV: State machine logic
    CONV->>DB: Update state + contextData
    CONV-->>SIM: Response message
    
    SIM->>SMS: storeOutgoingResponse()
    SMS->>DB: Insert SimulatorMessage
    SIM-->>UI: {success: true, messageId}
    
    UI->>SIM: GET /poll?customerPhone=X&since=Y
    SIM->>SMS: getMessagesSince(phone, since)
    SMS->>DB: Query SimulatorMessage
    SMS-->>SIM: Messages[]
    SIM-->>UI: {data: messages}
```

### Key Interfaces

```typescript
// Configuration interface
interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  
  // Supabase Cloud Configuration
  databaseUrl: string;           // Connection Pooler (port 6543) for runtime
  directUrl: string;             // Direct Connection (port 5432) for migrations
  supabaseUrl: string;           // https://YOUR-REF.supabase.co
  supabaseAnonKey: string;       // Public anon key
  supabaseServiceRoleKey: string; // Service role key (server-side only)
  supabaseJwtSecret: string;     // For signing Custom JWTs (RLS enforcement)
  
  // Twilio Configuration (OTP)
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioVerifyServiceSid: string;
  devPhoneWhitelist: string[];    // Phones that bypass Twilio in dev
  
  // WhatsApp Configuration
  whatsappAppSecret: string;      // For webhook signature verification
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
}

// Authenticated request context
interface AuthContext {
  userId: string;   // UUID from Postgres (sub claim)
  phone: string;
  role: string;
}

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

// API error structure
interface ApiError {
  code: string;           // Machine-readable error code
  message: string;        // Human-readable message
  details?: Record<string, string[]>;  // Field-level errors
  correlationId: string;  // UUID for log correlation
}

// WhatsApp webhook payload (simplified)
interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: 'whatsapp';
        metadata: { phone_number_id: string };
        contacts?: Array<{ wa_id: string; profile: { name: string } }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: 'text' | 'interactive' | 'button';
          text?: { body: string };
        }>;
      };
    }>;
  }>;
}
```

### Supabase Cloud Connection Configuration

```
# Environment Variables (.env)

# 1. RUNTIME: Connection Pooler (Transaction Mode)
# Format: postgres://[user]:[password]@aws-0-[region].pooler.supabase.com:6543/[db_name]?pgbouncer=true&connection_limit=1
DATABASE_URL="postgres://postgres.YOUR-REF:YOUR-PASSWORD@aws-0-YOUR-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 2. MIGRATIONS: Direct Connection (Session Mode)
# Format: postgres://[user]:[password]@db.YOUR-REF.supabase.co:5432/[db_name]
DIRECT_URL="postgres://postgres.YOUR-REF:YOUR-PASSWORD@db.YOUR-REF.supabase.co:5432/postgres"

# 3. SUPABASE API KEYS
SUPABASE_URL="https://YOUR-REF.supabase.co"
SUPABASE_ANON_KEY="YOUR-ANON-KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR-SERVICE-ROLE-KEY"
SUPABASE_JWT_SECRET="YOUR-JWT-SECRET"  # Critical for Custom JWT signing
```

```prisma
// packages/shared-types/prisma/schema.prisma

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Uses Pooled Connection (Runtime)
  directUrl = env("DIRECT_URL")     // Uses Direct Connection (Migrations)
}
```

## Data Models

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Business : owns
    Business ||--o{ Service : offers
    Business ||--o{ Booking : receives
    Business ||--o{ WhatsAppConversation : has
    Business ||--o{ CustomerSession : has
    Customer ||--o{ Booking : makes
    Customer ||--o{ WhatsAppConversation : participates
    Customer ||--o{ CustomerSession : has
    Booking ||--o{ BookingItem : contains
    Service ||--o{ BookingItem : referenced_in
    WhatsAppConversation ||--o{ WhatsAppMessage : contains
    CustomerSession ||--o{ SimulatorMessage : contains

    User {
        string id PK "cuid"
        string phone UK "Source of Truth"
        string role "OWNER default"
        datetime createdAt
        datetime updatedAt
    }

    Customer {
        string id PK "cuid"
        string phoneNumber UK "WhatsApp wa_id"
        string name "From WhatsApp Profile"
        boolean isBlocked "Anti-Chaos"
        datetime createdAt
        datetime updatedAt
    }

    Business {
        string id PK "cuid"
        string ownerId FK
        string name
        string phoneNumber
        string routingCode UK "4-digit VarChar"
        json hoursOfOperation
        int maxConcurrentBookings "Chairs/Staff capacity"
        datetime createdAt
        datetime updatedAt
    }

    Service {
        string id PK "cuid"
        string businessId FK
        string name "VarChar 100"
        string description "VarChar 500"
        decimal price "Decimal 10,2"
        int durationMinutes "Default 30"
        boolean isActive "Soft delete"
        datetime createdAt
        datetime updatedAt
    }

    Booking {
        string id PK "cuid"
        string businessId FK
        string customerId FK "Nullable for walk-ins"
        BookingStatus status "PENDING default"
        datetime scheduledAt "Time Physics Start"
        datetime endAt "Time Physics End"
        decimal totalPrice "Decimal 10,2"
        PaymentMode paymentMode "CASH/UPI/OTHER"
        string notes
        datetime createdAt
        datetime updatedAt
    }

    BookingItem {
        string id PK "cuid"
        string bookingId FK
        string serviceId FK
        string nameSnapshot "Immutable History"
        decimal priceSnapshot "Frozen Price"
    }

    WhatsAppConversation {
        string id PK "cuid"
        string customerPhone FK
        string businessId FK "Nullable until routed"
        string state "State Machine"
        json contextData "Persistent RAM"
        datetime lastMessageAt "24hr window check"
        datetime createdAt
        datetime updatedAt
    }

    WhatsAppMessage {
        string id PK "cuid"
        string conversationId FK
        string whatsappMessageId UK
        string direction "inbound/outbound"
        string messageType "text/interactive/button"
        json content
        string status "sent/delivered/read"
        datetime createdAt
    }
```

### Availability Engine: The Overlap Query

The availability engine prevents double-bookings using time overlap logic and concurrency limits.

```typescript
// The SQL Logic for Strict Availability Check
async function checkAvailability(
  businessId: string,
  requestedStart: Date,
  requestedEnd: Date
): Promise<{ available: boolean; currentCount: number; maxCapacity: number }> {
  // Get business capacity
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { maxConcurrentBookings: true }
  });
  
  // Count overlapping bookings using the overlap formula:
  // (existing.start < requested.end) AND (existing.end > requested.start)
  const overlappingCount = await prisma.booking.count({
    where: {
      businessId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      AND: [
        { scheduledAt: { lt: requestedEnd } },   // existing starts before requested ends
        { endAt: { gt: requestedStart } }        // existing ends after requested starts
      ]
    }
  });
  
  return {
    available: overlappingCount < business.maxConcurrentBookings,
    currentCount: overlappingCount,
    maxCapacity: business.maxConcurrentBookings
  };
}
```

### WhatsApp Conversation State Machine

```mermaid
stateDiagram-v2
    [*] --> GREETING: New conversation
    GREETING --> AWAITING_ROUTING_CODE: "Hi" received
    AWAITING_ROUTING_CODE --> SERVICE_SELECTION: Valid routing code (e.g., "5555")
    AWAITING_ROUTING_CODE --> AWAITING_ROUTING_CODE: Invalid code
    SERVICE_SELECTION --> TIME_SELECTION: Service(s) selected (e.g., "1, 2")
    TIME_SELECTION --> CONFIRMATION: Valid time slot available
    TIME_SELECTION --> TIME_SELECTION: Slot unavailable, retry
    CONFIRMATION --> COMPLETED: Booking created
    CONFIRMATION --> SERVICE_SELECTION: User cancels
    
    note right of GREETING: Reset after 24hr inactivity
    note right of SERVICE_SELECTION: contextData stores selections
    note right of TIME_SELECTION: Availability engine checks capacity
```

### Zod Schema Examples

```typescript
// OTP Request schema
const otpRequestSchema = z.object({
  phone: z.string().regex(/^\+\d{10,15}$/, 'Invalid phone format'),
});

// OTP Verify schema
const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+\d{10,15}$/),
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

// Business creation schema
const createBusinessSchema = z.object({
  name: z.string().min(1).max(100),
  phoneNumber: z.string().regex(/^\+\d{10,15}$/),
  routingCode: z.string().length(4).regex(/^\d{4}$/).optional(),
  maxConcurrentBookings: z.number().int().min(1).max(10).default(1),
  hoursOfOperation: z.record(z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
    closed: z.boolean().optional(),
  })).optional(),
});

// Service creation schema
const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive().multipleOf(0.01),
  durationMinutes: z.number().int().min(5).max(480).default(30),
});

// Booking creation with multi-service support (combos)
const createBookingSchema = z.object({
  businessId: z.string().cuid(),
  customerId: z.string().cuid().optional(), // Optional for walk-ins
  serviceIds: z.array(z.string().cuid()).min(1).max(10),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

// Checkout schema (dynamic item modification)
const checkoutSchema = z.object({
  items: z.array(z.object({
    serviceId: z.string().cuid(),
    quantity: z.number().int().min(1).default(1),
  })).min(1),
  paymentMode: z.enum(['CASH', 'UPI', 'OTHER']),
});

// Booking status transition validation
const bookingStatusTransitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
  CONFIRMED: ['COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
  REJECTED: [],
  CANCELLED_BY_USER: [],
  CANCELLED_BY_SALON: [],
  COMPLETED: [],
};

// WhatsApp conversation context schema
const conversationContextSchema = z.object({
  selectedServiceIds: z.array(z.string().cuid()).optional(),
  totalDuration: z.number().int().optional(),
  totalPrice: z.number().optional(),
  requestedTime: z.string().datetime().optional(),
});
```

### Booking Creation Flow with Snapshots and Availability Check

```mermaid
sequenceDiagram
    participant Client
    participant BookingService
    participant AvailabilityEngine
    participant ServiceService
    participant Prisma

    Client->>BookingService: createBooking(serviceIds, scheduledAt)
    BookingService->>ServiceService: getServices(serviceIds)
    ServiceService->>Prisma: findMany(serviceIds)
    Prisma-->>ServiceService: Service[]
    ServiceService-->>BookingService: Service[]
    
    BookingService->>BookingService: Calculate totalDuration (sum of durations)
    BookingService->>BookingService: Calculate endAt = scheduledAt + totalDuration
    BookingService->>BookingService: Calculate totalPrice (sum of prices)
    
    BookingService->>AvailabilityEngine: checkAvailability(businessId, scheduledAt, endAt)
    AvailabilityEngine->>Prisma: COUNT overlapping bookings
    Note over Prisma: WHERE scheduledAt < endAt<br/>AND endAt > scheduledAt<br/>AND status IN (PENDING, CONFIRMED)
    Prisma-->>AvailabilityEngine: overlappingCount
    AvailabilityEngine->>AvailabilityEngine: overlappingCount < maxConcurrentBookings?
    
    alt Slot Available
        AvailabilityEngine-->>BookingService: {available: true}
        BookingService->>Prisma: transaction
        Note over Prisma: 1. Create Booking (status: PENDING)
        Note over Prisma: 2. Create BookingItems with snapshots
        Prisma-->>BookingService: Booking with items
        BookingService-->>Client: {success: true, booking}
    else Slot Unavailable
        AvailabilityEngine-->>BookingService: {available: false, currentCount, maxCapacity}
        BookingService-->>Client: 409 Conflict "Slot unavailable"
    end
```

### Dynamic Checkout Flow (Revenue Fix)

```mermaid
sequenceDiagram
    participant MerchantApp
    participant API
    participant BookingService
    participant Prisma

    MerchantApp->>API: POST /v1/bookings/:id/checkout
    Note over MerchantApp: {items: [{serviceId: "massage"}, {serviceId: "shampoo"}],<br/>paymentMode: "UPI"}
    
    API->>BookingService: checkout(bookingId, items, paymentMode)
    BookingService->>Prisma: Get current booking with items
    Prisma-->>BookingService: Booking + BookingItems
    
    BookingService->>Prisma: transaction
    Note over Prisma: 1. Delete old BookingItems
    Note over Prisma: 2. Create new BookingItems with fresh snapshots
    Note over Prisma: 3. Update Booking.totalPrice
    Note over Prisma: 4. Set Booking.paymentMode = UPI
    Note over Prisma: 5. Set Booking.status = COMPLETED
    
    Prisma-->>BookingService: Updated Booking
    BookingService-->>API: {success: true, booking}
    API-->>MerchantApp: Checkout complete
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Zod Schema Round-Trip Consistency

*For any* valid domain object (Business, Service, Booking, etc.), serializing it to JSON and then parsing it through the corresponding Zod schema SHALL produce an equivalent object.

**Validates: Requirements 3.7, 3.8**

### Property 2: Zod Schema Validation Correctness

*For any* input to a Zod schema:
- If the input conforms to the schema constraints (e.g., routingCode is exactly 4 digits, price is positive, serviceIds is non-empty array of CUIDs), parsing SHALL succeed
- If the input violates any constraint, parsing SHALL fail with descriptive errors

**Validates: Requirements 3.3, 3.4, 3.5**

### Property 3: Hybrid Authentication Behavior

*For any* OTP verification request:
- In production mode with valid Twilio verification, the system SHALL mint a Custom JWT with `sub: user.id`
- In development mode with whitelisted phone, the system SHALL accept magic OTP and mint the same JWT
- The JWT SHALL be signed with Supabase Project Secret for RLS enforcement

**Validates: Requirements 5.1, 5.2, 5.5, 5.6**

### Property 4: Authentication Middleware Behavior

*For any* request to a protected endpoint:
- If the request includes a valid Custom JWT signed with Supabase Secret, the middleware SHALL extract user identity and allow the request to proceed
- If the request lacks valid authentication or has invalid signature, the middleware SHALL return 401 Unauthorized

**Validates: Requirements 5.7, 5.8**

### Property 5: Routing Code Generation Uniqueness

*For any* business created without a routing code, the system SHALL generate a unique 4-digit routing code that does not collide with any existing routing code in the database.

**Validates: Requirements 6.4, 6.5**

### Property 6: Routing Code Collision Handling

*For any* business creation attempt with an existing routing code, the system SHALL return 409 Conflict with message "Routing code taken".

**Validates: Requirements 6.6**

### Property 7: Business Retrieval Includes Services

*For any* business retrieval request, the response SHALL include all services associated with that business.

**Validates: Requirements 6.2**

### Property 8: Service Listing Active Filter

*For any* service listing request for a business, the response SHALL contain only services where isActive is true.

**Validates: Requirements 7.2**

### Property 9: Service Soft Delete Invariant

*For any* service deactivation request, after the operation completes, the service's isActive field SHALL be false, and the service record SHALL still exist in the database.

**Validates: Requirements 7.4**

### Property 10: Service Deletion Protection

*For any* service that has at least one booking with status in [PENDING, CONFIRMED], deletion SHALL fail with an appropriate error.

**Validates: Requirements 7.5**

### Property 11: Booking Creation Invariants (Price Snapshots)

*For any* booking created with a set of service IDs:
1. The booking SHALL have one BookingItem per service ID
2. Each BookingItem's nameSnapshot SHALL equal the service's name at creation time
3. Each BookingItem's priceSnapshot SHALL equal the service's price at creation time
4. The booking's totalPrice SHALL equal the sum of all BookingItem priceSnapshots
5. The booking's endAt SHALL equal scheduledAt plus the sum of all service durations

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 12: Strict Availability Engine (Overlap Detection)

*For any* booking creation request where the time range [scheduledAt, endAt] overlaps with N existing bookings (status PENDING or CONFIRMED) for the same business:
- Overlap is defined as: `(existing.scheduledAt < requested.endAt) AND (existing.endAt > requested.scheduledAt)`
- If N >= business.maxConcurrentBookings, the creation SHALL fail with 409 Conflict

**Validates: Requirements 8.5, 8.6**

### Property 13: Booking Status Transition Validity

*For any* booking status update request, the transition SHALL only succeed if the new status is in the allowed transitions from the current status:
- PENDING → [CONFIRMED, REJECTED, CANCELLED_BY_USER, CANCELLED_BY_SALON]
- CONFIRMED → [COMPLETED, CANCELLED_BY_USER, CANCELLED_BY_SALON]
- All terminal states → [] (no transitions allowed)

**Validates: Requirements 8.7**

### Property 14: Walk-In Booking Support

*For any* booking creation request with customerId set to null or undefined, the booking SHALL be created successfully with a null customer reference.

**Validates: Requirements 8.8**

### Property 15: Customer Upsert Behavior

*For any* WhatsApp message from a phone number, after processing:
- If no Customer existed for that phoneNumber, a new Customer SHALL be created
- If a Customer existed, it SHALL be retrieved (not duplicated)

**Validates: Requirements 9.1**

### Property 16: Conversation Upsert Behavior

*For any* WhatsApp message from a phone number, after processing:
- If no WhatsAppConversation existed for that customerPhone, a new conversation SHALL be created with state "GREETING"
- If a conversation existed, it SHALL be retrieved (not duplicated)

**Validates: Requirements 9.2**

### Property 17: Conversation State Persistence

*For any* conversation state update with new state and contextData, after the update completes, querying the conversation SHALL return the updated state and contextData values.

**Validates: Requirements 9.3, 9.4**

### Property 18: Conversation Routing Code Association

*For any* conversation where a valid routing code is provided, the conversation's businessId SHALL reference the business with that routing code.

**Validates: Requirements 9.5, 9.6**

### Property 19: Conversation Timeout Reset

*For any* conversation where lastMessageAt is more than 24 hours in the past, when accessed, the state SHALL be reset to "GREETING".

**Validates: Requirements 9.7**

### Property 20: WhatsApp Webhook Signature Verification

*For any* incoming webhook request:
- If X-Hub-Signature-256 header matches HMAC-SHA256 of payload with App Secret, processing SHALL proceed
- If signature verification fails, the request SHALL be dropped immediately (no processing)

**Validates: Requirements 11.2, 11.3**

### Property 21: Simulator Webhook Payload Format

*For any* message sent through the simulator:
- The generated webhook payload SHALL match the WhatsApp Cloud API format exactly
- The payload SHALL contain entry[0].changes[0].value.messages[0] with from, id, timestamp, type, and text fields
- Processing through the conversation service SHALL produce identical results as production webhooks

**Validates: Requirements 10.2, 10.3**

### Property 22: Simulator Message Polling

*For any* simulator poll request with a customerPhone and since timestamp:
- The response SHALL contain only messages sent after the since timestamp
- Messages SHALL be ordered by timestamp ascending
- Each message SHALL contain id, content, timestamp, and delivered status

**Validates: Requirements 10.4**

### Property 23: Dynamic Checkout Invariants

*For any* checkout operation:
1. The final BookingItems SHALL reflect the items array from the checkout request
2. The totalPrice SHALL be recalculated from the final items
3. The paymentMode SHALL be set to the provided value
4. The status SHALL be set to COMPLETED

**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

### Property 24: Error Response Consistency

*For any* error condition:
- Zod validation failures SHALL return 400 with field-level error details
- Non-existent resource requests SHALL return 404 with resource identifier
- Database unique constraint violations SHALL return 409 Conflict
- Business rule violations SHALL return 422 Unprocessable Entity
- Unexpected errors SHALL return 500 without exposing internal details

All error responses SHALL include a correlationId for debugging.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6**

## Error Handling

### Error Response Structure

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: {             // Field-level errors for validation
      [field: string]: string[];
    };
    correlationId: string;  // UUID for log correlation
  };
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Zod schema validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Resource conflict (e.g., booking overlap) |
| `UNPROCESSABLE` | 422 | Business rule violation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Middleware Implementation

```typescript
// Global error handler
const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || randomUUID();
  
  // Log with correlation ID
  logger.error({ correlationId, error: err });
  
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: formatZodErrors(err),
        correlationId,
      },
    });
  }
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: err.message,
        correlationId,
      },
    });
  }
  
  // Default: don't expose internal details
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      correlationId,
    },
  });
};
```

## Testing Strategy

### Dual Testing Approach

This project uses both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property tests**: Verify universal properties across randomly generated inputs

### Property-Based Testing Configuration

- **Library**: fast-check for TypeScript
- **Minimum iterations**: 100 per property test
- **Tag format**: `Feature: backend-migration, Property N: [property description]`

### Test Structure

```
tests/
├── unit/
│   ├── schemas/           # Zod schema unit tests
│   ├── services/          # Business logic unit tests
│   └── middleware/        # Middleware unit tests
├── property/
│   ├── schema.property.ts # Properties 1, 2
│   ├── auth.property.ts   # Property 3
│   ├── booking.property.ts # Properties 9, 10, 11, 12
│   └── conversation.property.ts # Properties 13, 14, 15, 16
└── integration/
    ├── business.integration.ts
    ├── service.integration.ts
    ├── booking.integration.ts
    └── conversation.integration.ts
```

### Property Test Examples

```typescript
// Property 9: Booking Creation Invariants
describe('Feature: backend-migration, Property 9: Booking creation invariants', () => {
  it('should create BookingItems with correct snapshots', () => {
    fc.assert(
      fc.property(
        arbitraryServices(1, 5),
        arbitraryScheduledAt(),
        (services, scheduledAt) => {
          const booking = createBooking(services.map(s => s.id), scheduledAt);
          
          // Invariant 1: One BookingItem per service
          expect(booking.items.length).toBe(services.length);
          
          // Invariant 2-3: Snapshots match service at creation
          for (let i = 0; i < services.length; i++) {
            expect(booking.items[i].nameSnapshot).toBe(services[i].name);
            expect(booking.items[i].priceSnapshot).toBe(services[i].price);
          }
          
          // Invariant 4: totalPrice is sum of snapshots
          const expectedTotal = booking.items.reduce(
            (sum, item) => sum + item.priceSnapshot, 0
          );
          expect(booking.totalPrice).toBe(expectedTotal);
          
          // Invariant 5: endAt is scheduledAt + sum of durations
          const totalDuration = services.reduce(
            (sum, s) => sum + s.durationMinutes, 0
          );
          const expectedEnd = addMinutes(scheduledAt, totalDuration);
          expect(booking.endAt).toEqual(expectedEnd);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 11: Booking Status Transitions
describe('Feature: backend-migration, Property 11: Booking status transitions', () => {
  const validTransitions = {
    PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
    CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
    REJECTED: [],
    CANCELLED_BY_USER: [],
    CANCELLED_BY_SALON: [],
    COMPLETED: [],
    NO_SHOW: [],
  };

  it('should only allow valid status transitions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(validTransitions)),
        fc.constantFrom(...Object.keys(validTransitions)),
        (fromStatus, toStatus) => {
          const isValid = validTransitions[fromStatus].includes(toStatus);
          const result = attemptStatusTransition(fromStatus, toStatus);
          
          if (isValid) {
            expect(result.success).toBe(true);
          } else {
            expect(result.success).toBe(false);
            expect(result.error.code).toBe('UNPROCESSABLE');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Test Strategy

Integration tests verify end-to-end flows with a real database:

1. **Setup**: Use a test database with migrations applied
2. **Isolation**: Each test runs in a transaction that's rolled back
3. **Coverage**: Test complete request/response cycles through Express routes
