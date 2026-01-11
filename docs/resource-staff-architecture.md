# Resource & Staff Feature Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SALEX PLATFORM                               │
│                                                                       │
│  ┌────────────────────┐                    ┌────────────────────┐   │
│  │  WhatsApp Customer │                    │  Merchant Mobile   │   │
│  │                    │                    │  App (React Native)│   │
│  │  - Send messages   │                    │                    │   │
│  │  - Book services   │                    │  - Manage resources│   │
│  │  - Get confirmations│                   │  - Manage staff    │   │
│  └─────────┬──────────┘                    │  - View bookings   │   │
│            │                                │  - Check capacity  │   │
│            │ WhatsApp                       └─────────┬──────────┘   │
│            │ Cloud API                                │              │
│            │                                          │ HTTPS/REST   │
│            ▼                                          │ (JWT Auth)   │
│  ┌─────────────────────────────────────────────────┐ │              │
│  │         EXPRESS.JS BACKEND API                   │◄┘              │
│  │                                                   │                │
│  │  ┌──────────────────────────────────────────┐   │                │
│  │  │         CONTROLLERS                       │   │                │
│  │  │  - resourceController                     │   │                │
│  │  │  - staffController                        │   │                │
│  │  │  - availabilityController                 │   │                │
│  │  │  - bookingController                      │   │                │
│  │  └────────────────┬─────────────────────────┘   │                │
│  │                   │                              │                │
│  │  ┌────────────────▼─────────────────────────┐   │                │
│  │  │         SERVICES (Business Logic)        │   │                │
│  │  │                                           │   │                │
│  │  │  ┌─────────────────────────────────┐    │   │                │
│  │  │  │  resourceService                 │    │   │                │
│  │  │  │  - CRUD operations               │    │   │                │
│  │  │  │  - Utilization tracking          │    │   │                │
│  │  │  │  - Deactivation protection       │    │   │                │
│  │  │  └─────────────────────────────────┘    │   │                │
│  │  │                                           │   │                │
│  │  │  ┌─────────────────────────────────┐    │   │                │
│  │  │  │  staffService                    │    │   │                │
│  │  │  │  - CRUD operations               │    │   │                │
│  │  │  │  - Resource linking              │    │   │                │
│  │  │  │  - Utilization tracking          │    │   │                │
│  │  │  └─────────────────────────────────┘    │   │                │
│  │  │                                           │   │                │
│  │  │  ┌─────────────────────────────────┐    │   │                │
│  │  │  │  availabilityService             │    │   │                │
│  │  │  │  - Check slot availability       │    │   │                │
│  │  │  │  - Get available resources       │    │   │                │
│  │  │  │  - Get available staff           │    │   │                │
│  │  │  │  - Calculate capacity            │    │   │                │
│  │  │  └─────────────────────────────────┘    │   │                │
│  │  │                                           │   │                │
│  │  │  ┌─────────────────────────────────┐    │   │                │
│  │  │  │  autoAssignmentService           │    │   │                │
│  │  │  │  - Find best assignment          │    │   │                │
│  │  │  │  - Load balancing                │    │   │                │
│  │  │  │  - Linked pair preference        │    │   │                │
│  │  │  │  - Race condition prevention     │    │   │                │
│  │  │  └─────────────────────────────────┘    │   │                │
│  │  │                                           │   │                │
│  │  └────────────────┬─────────────────────────┘   │                │
│  │                   │                              │                │
│  │  ┌────────────────▼─────────────────────────┐   │                │
│  │  │         PRISMA ORM                       │   │                │
│  │  │  - Type-safe queries                     │   │                │
│  │  │  - Transaction management                │   │                │
│  │  │  - Migration handling                    │   │                │
│  │  └────────────────┬─────────────────────────┘   │                │
│  └───────────────────┼──────────────────────────────┘                │
│                      │                                               │
│                      ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              SUPABASE POSTGRESQL                              │   │
│  │                                                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │   │
│  │  │   Resource   │  │    Staff     │  │ResourceStaff │       │   │
│  │  │              │  │              │  │    Link      │       │   │
│  │  │ - id         │  │ - id         │  │              │       │   │
│  │  │ - businessId │  │ - businessId │  │ - resourceId │       │   │
│  │  │ - name       │  │ - name       │  │ - staffId    │       │   │
│  │  │ - isActive   │  │ - phone      │  │ - isPrimary  │       │   │
│  │  │ - displayOrder│ │ - isActive   │  │              │       │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────────┘       │   │
│  │         │                  │                                  │   │
│  │         └──────────┬───────┘                                  │   │
│  │                    │                                          │   │
│  │         ┌──────────▼───────────┐                             │   │
│  │         │      Booking         │                             │   │
│  │         │                      │                             │   │
│  │         │ - id                 │                             │   │
│  │         │ - businessId         │                             │   │
│  │         │ - customerId         │                             │   │
│  │         │ - resourceId  (NEW)  │                             │   │
│  │         │ - staffId     (NEW)  │                             │   │
│  │         │ - scheduledAt        │                             │   │
│  │         │ - endAt              │                             │   │
│  │         │ - status             │                             │   │
│  │         └──────────────────────┘                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Creating a Booking

```
┌──────────────┐
│   Customer   │
│  (WhatsApp)  │
└──────┬───────┘
       │
       │ 1. "Book haircut at 2pm"
       ▼
┌──────────────────────┐
│  WhatsApp Webhook    │
│  Handler             │
└──────┬───────────────┘
       │
       │ 2. Parse message
       ▼
┌──────────────────────┐
│  Conversation        │
│  Service             │
└──────┬───────────────┘
       │
       │ 3. Check availability
       ▼
┌──────────────────────────────────────────────────────────┐
│  Availability Service                                     │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 1. Get all active resources                      │    │
│  │ 2. Get all active staff                          │    │
│  │ 3. Find booked resources in time slot            │    │
│  │ 4. Find booked staff in time slot                │    │
│  │ 5. Calculate available resources                 │    │
│  │ 6. Calculate available staff                     │    │
│  │ 7. Return availability + suggestions             │    │
│  └─────────────────────────────────────────────────┘    │
└──────┬───────────────────────────────────────────────────┘
       │
       │ 4. Available: true
       │    Suggested: Chair 3 + Priya
       ▼
┌──────────────────────────────────────────────────────────┐
│  Auto-Assignment Service                                  │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Priority Logic:                                  │    │
│  │ 1. Customer preference (if any)                  │    │
│  │ 2. Linked pairs (staff + their resource)         │    │
│  │ 3. Load balancing (lowest utilization)           │    │
│  │                                                   │    │
│  │ Race Condition Prevention:                       │    │
│  │ - Use Serializable transaction                   │    │
│  │ - Re-check availability within transaction       │    │
│  │ - Lock rows during allocation                    │    │
│  └─────────────────────────────────────────────────┘    │
└──────┬───────────────────────────────────────────────────┘
       │
       │ 5. Allocate: Chair 3 + Priya
       ▼
┌──────────────────────┐
│  Booking Service     │
│                      │
│  CREATE BOOKING:     │
│  - resourceId: Chair3│
│  - staffId: Priya    │
│  - scheduledAt: 2pm  │
│  - status: CONFIRMED │
└──────┬───────────────┘
       │
       │ 6. Booking created
       ▼
┌──────────────────────┐
│  WhatsApp Service    │
│                      │
│  Send confirmation:  │
│  "✅ Booked!         │
│   Chair 3 with Priya │
│   at 2:00 PM"        │
└──────┬───────────────┘
       │
       │ 7. Confirmation message
       ▼
┌──────────────┐
│   Customer   │
│  (WhatsApp)  │
└──────────────┘
```

## Component Interaction: Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT NATIVE APP                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              SCREENS                                │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  ResourceManagementScreen                 │     │    │
│  │  │  - List resources with stats              │     │    │
│  │  │  - Create/edit/deactivate                 │     │    │
│  │  │  - Visual utilization indicators          │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  StaffManagementScreen                    │     │    │
│  │  │  - List staff with stats                  │     │    │
│  │  │  - Create/edit/deactivate                 │     │    │
│  │  │  - Link to resources                      │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  BookingsScreen                           │     │    │
│  │  │  - Timeline view                          │     │    │
│  │  │  - Resource/staff selector                │     │    │
│  │  │  - Availability checker                   │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                         │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │              ZUSTAND STORES                         │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  resourceStore                            │     │    │
│  │  │  - resources: ResourceWithStats[]         │     │    │
│  │  │  - fetchResources()                       │     │    │
│  │  │  - createResource()                       │     │    │
│  │  │  - updateResource()                       │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  staffStore                               │     │    │
│  │  │  - staff: StaffWithStats[]                │     │    │
│  │  │  - fetchStaff()                           │     │    │
│  │  │  - createStaff()                          │     │    │
│  │  │  - linkToResource()                       │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                         │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │              SERVICES                               │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  resourceService                          │     │    │
│  │  │  - createOne()                            │     │    │
│  │  │  - createBulk()                           │     │    │
│  │  │  - list()                                 │     │    │
│  │  │  - update()                               │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  staffService                             │     │    │
│  │  │  - create()                               │     │    │
│  │  │  - list()                                 │     │    │
│  │  │  - linkToResource()                       │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  apiClient (Axios)                        │     │    │
│  │  │  - JWT token injection                    │     │    │
│  │  │  - Error handling                         │     │    │
│  │  │  - Request/response interceptors          │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────┬───────────────────────────────────┘    │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    │ HTTPS/REST
                    │ (JWT Auth)
                    ▼
            ┌───────────────┐
            │  Backend API  │
            └───────────────┘
```

## Database Schema Relationships

```
┌─────────────────┐
│    Business     │
│                 │
│ - id            │
│ - ownerId       │
│ - name          │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴────┬────────────┬────────────┐
    │         │            │            │
    ▼         ▼            ▼            ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Resource│ │ Staff  │ │Service │ │Booking │
│        │ │        │ │        │ │        │
│- id    │ │- id    │ │- id    │ │- id    │
│- name  │ │- name  │ │- name  │ │- status│
└───┬────┘ └───┬────┘ └────────┘ └───┬────┘
    │          │                      │
    │          │                      │
    │    N:M   │                      │
    │  ┌───────┴────────┐             │
    │  │                │             │
    └──┤ResourceStaff   │             │
       │Link            │             │
       │                │             │
       │- resourceId    │             │
       │- staffId       │             │
       │- isPrimary     │             │
       └────────────────┘             │
                                      │
       ┌──────────────────────────────┤
       │                              │
       ▼                              ▼
┌──────────────┐              ┌──────────────┐
│  Resource    │              │    Staff     │
│  (FK)        │              │    (FK)      │
└──────────────┘              └──────────────┘
```

## Auto-Assignment Algorithm Flow

```
START: New booking request
  │
  ▼
┌─────────────────────────────────────┐
│ Get all active resources            │
│ Get all active staff                │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Find bookings in time slot          │
│ - Status: PENDING or CONFIRMED      │
│ - Time overlaps with requested slot │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Filter out booked resources         │
│ Filter out booked staff             │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Calculate utilization for each      │
│ - Last 7 days booking history       │
│ - Sort by lowest utilization first  │
└─────────────┬───────────────────────┘
              │
              ▼
        ┌─────┴─────┐
        │ Customer  │
        │ Preference?│
        └─────┬─────┘
              │
        ┌─────┴─────┐
        │    YES    │
        └─────┬─────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Find preferred staff                │
│ Find their linked resource          │
│ Return: Staff + Linked Resource     │
│ Reason: "customer_preference"       │
└─────────────────────────────────────┘
              │
        ┌─────┴─────┐
        │     NO    │
        └─────┬─────┘
              │
              ▼
        ┌─────┴─────┐
        │  Linked   │
        │  Pairs?   │
        └─────┬─────┘
              │
        ┌─────┴─────┐
        │    YES    │
        └─────┬─────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Find resource with linked staff     │
│ Return: Resource + Linked Staff     │
│ Reason: "linked_pair_available"     │
└─────────────────────────────────────┘
              │
        ┌─────┴─────┐
        │     NO    │
        └─────┬─────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Select lowest utilization resource  │
│ Select lowest utilization staff     │
│ Return: Resource + Staff            │
│ Reason: "lowest_utilization"        │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ START SERIALIZABLE TRANSACTION      │
│ - Re-check availability             │
│ - Lock booking rows                 │
│ - Create booking with assignment    │
│ - COMMIT                            │
└─────────────────────────────────────┘
              │
              ▼
            END
```

## Capacity Calculation Logic

```
┌─────────────────────────────────────┐
│ Get Capacity Info                   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Count active resources              │
│ activeResources = 5                 │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Count active staff                  │
│ activeStaff = 3                     │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Calculate effective capacity        │
│ effectiveCapacity = min(resources,  │
│                         staff)      │
│ = min(5, 3) = 3                     │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Check for warnings                  │
│                                     │
│ IF effectiveCapacity == 0:          │
│   warning = "zero_capacity"         │
│                                     │
│ ELSE IF staff < resources:          │
│   warning = "staff_shortage"        │
│   message = "You have 5 chairs but  │
│             only 3 staff"           │
│                                     │
│ ELSE IF resources < staff:          │
│   warning = "resource_shortage"     │
│   message = "You have 3 staff but   │
│             only 2 active chairs"   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Return capacity info                │
│ {                                   │
│   activeResources: 5,               │
│   activeStaff: 3,                   │
│   effectiveCapacity: 3,             │
│   warning: "staff_shortage",        │
│   warningMessage: "..."             │
│ }                                   │
└─────────────────────────────────────┘
```

## Type Safety Flow

```
┌─────────────────────────────────────┐
│  Prisma Schema (schema.prisma)      │
│                                     │
│  model Resource {                   │
│    id           String              │
│    businessId   String              │
│    name         String              │
│    isActive     Boolean             │
│  }                                  │
└─────────────┬───────────────────────┘
              │
              │ prisma generate
              ▼
┌─────────────────────────────────────┐
│  Prisma Client (Auto-generated)     │
│                                     │
│  type Resource = {                  │
│    id: string;                      │
│    businessId: string;              │
│    name: string;                    │
│    isActive: boolean;               │
│  }                                  │
└─────────────┬───────────────────────┘
              │
              │ export
              ▼
┌─────────────────────────────────────┐
│  Zod Schemas (Validation)           │
│                                     │
│  const createResourceSchema =       │
│    z.object({                       │
│      name: z.string().min(1),       │
│      description: z.string().opt(), │
│    });                              │
│                                     │
│  type CreateResourceInput =         │
│    z.infer<typeof schema>;          │
└─────────────┬───────────────────────┘
              │
              │ export from shared-types
              ▼
┌─────────────────────────────────────┐
│  Backend Service                    │
│                                     │
│  async create(                      │
│    data: CreateResourceInput        │
│  ): Promise<Resource> {             │
│    return prisma.resource.create({  │
│      data                           │
│    });                              │
│  }                                  │
└─────────────┬───────────────────────┘
              │
              │ import from shared-types
              ▼
┌─────────────────────────────────────┐
│  Frontend Service                   │
│                                     │
│  async createOne(                   │
│    data: CreateResourceInput        │
│  ): Promise<Resource> {             │
│    const response = await           │
│      apiClient.post('/resources',   │
│        data);                       │
│    return response.data.data;       │
│  }                                  │
└─────────────────────────────────────┘

Result: End-to-end type safety!
- Frontend knows exact shape of request
- Backend validates at runtime
- Database enforces schema
- No type mismatches possible
```

---

**Document Version**: 1.0  
**Last Updated**: January 9, 2026  
**Purpose**: Visual reference for system architecture
