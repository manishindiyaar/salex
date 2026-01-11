# Multi-Niche Scaling & Multi-Resource Configuration Guide

A comprehensive guide for scaling Salex from salons to other service niches (beauty parlors, spas, clinics, etc.) and implementing multi-seat/resource booking capabilities.

---

## Table of Contents

1. [Current Architecture Overview](#current-architecture-overview)
2. [Understanding the Current System](#understanding-the-current-system)
3. [Multi-Niche Scaling Strategy](#multi-niche-scaling-strategy)
4. [Multi-Seat/Resource Configuration](#multi-seatresource-configuration)
5. [Implementation Plan](#implementation-plan)
6. [Database Schema Changes](#database-schema-changes)
7. [API Changes](#api-changes)
8. [Mobile App Configuration Flow](#mobile-app-configuration-flow)
9. [Migration Strategy](#migration-strategy)

---

## Current Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        SALEX PLATFORM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  Merchant App   │    │   Express API   │    │  Supabase   │ │
│  │  (React Native) │◄──►│   (Node.js)     │◄──►│  PostgreSQL │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│                                │                               │
│                                ▼                               │
│                    ┌─────────────────────┐                     │
│                    │   WhatsApp Cloud    │                     │
│                    │       API           │                     │
│                    └─────────────────────┘                     │
│                                │                               │
│                                ▼                               │
│                    ┌─────────────────────┐                     │
│                    │     Customers       │                     │
│                    │   (via WhatsApp)    │                     │
│                    └─────────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Current Database Schema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │  Business   │     │   Service   │
│  (Merchant) │────►│   (Salon)   │────►│  (Haircut)  │
└─────────────┘     └─────────────┘     └─────────────┘
                          │                    │
                          │                    │
                          ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Booking   │────►│ BookingItem │
                    │             │     │ (Snapshot)  │
                    └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  Customer   │
                    │ (WhatsApp)  │
                    └─────────────┘
```

### Current API Endpoints

| Module | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| **Auth** | `/api/v1/auth/otp/send` | POST | Send OTP |
| | `/api/v1/auth/otp/verify` | POST | Verify OTP & get JWT |
| **Business** | `/api/v1/businesses` | POST | Create business |
| | `/api/v1/businesses/me` | GET | Get my business |
| | `/api/v1/businesses/:id` | PATCH | Update business |
| | `/api/v1/businesses/routing/:code` | GET | Public lookup |
| **Services** | `/api/v1/businesses/:id/services` | POST | Create service |
| | `/api/v1/businesses/:id/services` | GET | List services |
| | `/api/v1/services/:id` | PATCH | Update service |
| | `/api/v1/services/:id` | DELETE | Soft delete |
| **Bookings** | `/api/v1/bookings` | POST | Create booking |
| | `/api/v1/bookings` | GET | List bookings |
| | `/api/v1/bookings/:id` | GET | Get booking |
| | `/api/v1/bookings/:id/status` | PATCH | Update status |
| | `/api/v1/bookings/:id/checkout` | POST | Checkout |
| | `/api/v1/bookings/check-availability` | POST | Check slot |

---

## Understanding the Current System

### How Availability Works Today

The current system uses a simple **concurrent booking limit** (`maxConcurrentBookings`) at the business level:

```typescript
// Business model
model Business {
  maxConcurrentBookings Int @default(1)  // e.g., 1 chair = 1 concurrent booking
}

// Availability check
const overlappingCount = await prisma.booking.count({
  where: {
    businessId,
    status: { in: ['PENDING', 'CONFIRMED'] },
    AND: [
      { scheduledAt: { lt: requestedEnd } },   // existing starts before requested ends
      { endAt: { gt: requestedStart } },       // existing ends after requested starts
    ],
  },
});

const available = overlappingCount < business.maxConcurrentBookings;
```

**Visual Example:**
```
Business: maxConcurrentBookings = 2 (2 chairs)

Timeline:
  2:00 PM ─────────────────────────────────────── 4:00 PM
           │ Booking A │
           2:00 ────── 3:00
                    │ Booking B │
                    2:30 ────── 3:30

Request: 2:45 PM - 3:15 PM
  → Overlaps with BOTH A and B
  → currentCount = 2, maxCapacity = 2
  → available = FALSE (slot full!)
```

### Current Limitations

1. **No Resource Differentiation**: All "seats" are treated as identical
2. **No Staff Assignment**: Can't assign specific staff to bookings
3. **No Resource-Specific Services**: Can't say "only Chair 1 does hair coloring"
4. **Single Business Type**: No niche-specific configurations
5. **No Equipment Tracking**: Can't track which equipment is needed

---

## Multi-Niche Scaling Strategy

### The Core Insight

The current system is **already niche-agnostic** at its core! The key entities work for any service business:

| Entity | Salon | Beauty Parlor | Spa | Clinic |
|--------|-------|---------------|-----|--------|
| Business | Salon | Parlor | Spa | Clinic |
| Service | Haircut | Facial | Massage | Consultation |
| Booking | Appointment | Appointment | Session | Visit |
| Customer | Client | Client | Guest | Patient |

### What Needs to Change for Multi-Niche

1. **Business Type/Category** - To customize UI and features
2. **Niche-Specific Terminology** - "Chair" vs "Bed" vs "Room"
3. **Niche-Specific Service Templates** - Pre-built service catalogs
4. **Niche-Specific Hours** - Different default operating hours

### Proposed Solution: Business Categories

```typescript
// New enum for business types
enum BusinessCategory {
  SALON           // Hair salon, barber shop
  BEAUTY_PARLOR   // Beauty parlor, makeup studio
  SPA             // Spa, wellness center
  CLINIC          // Medical clinic, dental
  FITNESS         // Gym, yoga studio
  OTHER           // Generic service business
}

// Business model with category
model Business {
  id                    String           @id @default(cuid())
  category              BusinessCategory @default(SALON)
  // ... existing fields
}
```

### Category-Specific Configuration

```typescript
// Configuration per category (stored in code, not DB)
const CATEGORY_CONFIG = {
  SALON: {
    resourceName: 'Chair',
    resourceNamePlural: 'Chairs',
    defaultServices: ['Haircut', 'Beard Trim', 'Hair Coloring', 'Shampoo'],
    defaultHours: { open: '09:00', close: '21:00' },
    icon: 'scissors',
  },
  BEAUTY_PARLOR: {
    resourceName: 'Station',
    resourceNamePlural: 'Stations',
    defaultServices: ['Facial', 'Threading', 'Waxing', 'Makeup'],
    defaultHours: { open: '10:00', close: '20:00' },
    icon: 'sparkles',
  },
  SPA: {
    resourceName: 'Room',
    resourceNamePlural: 'Rooms',
    defaultServices: ['Swedish Massage', 'Deep Tissue', 'Aromatherapy'],
    defaultHours: { open: '10:00', close: '22:00' },
    icon: 'leaf',
  },
  CLINIC: {
    resourceName: 'Room',
    resourceNamePlural: 'Rooms',
    defaultServices: ['Consultation', 'Follow-up', 'Procedure'],
    defaultHours: { open: '09:00', close: '18:00' },
    icon: 'medical',
  },
};
```

---

## Multi-Seat/Resource Configuration

### The Problem

Currently, `maxConcurrentBookings = 2` means "2 things can happen at once" but doesn't track:
- **Which** chair/room is being used
- **Who** (staff) is performing the service
- **What equipment** is needed

### Solution: Resource Model

Introduce a **Resource** entity that represents bookable units (chairs, rooms, beds, etc.):

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Business   │────►│  Resource   │────►│   Booking   │
│             │     │ (Chair 1)   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │    Staff    │
                    │  (Optional) │
                    └─────────────┘
```

### Resource Types

```typescript
enum ResourceType {
  CHAIR       // Salon chair, barber chair
  BED         // Spa bed, massage table
  ROOM        // Treatment room, consultation room
  STATION     // Beauty station, makeup station
  EQUIPMENT   // Specific equipment (laser machine, etc.)
  GENERIC     // Generic resource
}
```

### How It Works

**Scenario: Salon with 3 Chairs**

```
Business: "Classic Cuts"
├── Resource: "Chair 1" (type: CHAIR)
├── Resource: "Chair 2" (type: CHAIR)
└── Resource: "Chair 3" (type: CHAIR)

Timeline for 2:00 PM - 3:00 PM:
┌─────────────┬─────────────┬─────────────┐
│   Chair 1   │   Chair 2   │   Chair 3   │
├─────────────┼─────────────┼─────────────┤
│  Booking A  │  Booking B  │   (FREE)    │
│  (Haircut)  │  (Coloring) │             │
└─────────────┴─────────────┴─────────────┘

New booking request for 2:30 PM?
→ Check each resource for availability
→ Chair 3 is free → Assign to Chair 3
→ Booking created!
```

**Scenario: Spa with 2 Massage Rooms + 1 Facial Room**

```
Business: "Zen Spa"
├── Resource: "Massage Room 1" (type: ROOM, services: [Massage])
├── Resource: "Massage Room 2" (type: ROOM, services: [Massage])
└── Resource: "Facial Room" (type: ROOM, services: [Facial])

Customer wants a Massage at 3:00 PM?
→ Only check Massage Room 1 & 2 (not Facial Room)
→ Massage Room 1 is booked, Massage Room 2 is free
→ Assign to Massage Room 2
```

---

## Implementation Plan

### Phase 1: Add Business Category (Low Effort)

**Goal**: Allow businesses to identify their niche for UI customization.

**Changes**:
1. Add `category` field to Business model
2. Add category selection in onboarding
3. Use category for UI terminology

**Effort**: 1-2 days

### Phase 2: Add Resource Model (Medium Effort)

**Goal**: Enable multi-seat/resource booking.

**Changes**:
1. Create Resource model
2. Update Booking to reference Resource
3. Update availability engine
4. Add resource management UI

**Effort**: 3-5 days

### Phase 3: Add Staff Assignment (Optional)

**Goal**: Track which staff member performs each service.

**Changes**:
1. Create Staff model
2. Link Staff to Resources (optional)
3. Link Staff to Bookings
4. Add staff management UI

**Effort**: 3-5 days

### Phase 4: Resource-Service Mapping (Optional)

**Goal**: Restrict which services can be performed on which resources.

**Changes**:
1. Create ResourceService junction table
2. Update availability to check service compatibility
3. Add UI for mapping services to resources

**Effort**: 2-3 days

---

## Database Schema Changes

### Phase 1: Business Category

```prisma
enum BusinessCategory {
  SALON
  BEAUTY_PARLOR
  SPA
  CLINIC
  FITNESS
  OTHER
}

model Business {
  id                    String           @id @default(cuid())
  ownerId               String
  name                  String
  phoneNumber           String
  routingCode           String?          @unique @db.VarChar(4)
  category              BusinessCategory @default(SALON)  // NEW
  hoursOfOperation      Json?
  maxConcurrentBookings Int              @default(1)
  isAcceptingOrders     Boolean          @default(true)
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  // Relations
  owner     User       @relation(fields: [ownerId], references: [id])
  services  Service[]
  bookings  Booking[]
  resources Resource[] // NEW (Phase 2)
}
```

### Phase 2: Resource Model

```prisma
enum ResourceType {
  CHAIR
  BED
  ROOM
  STATION
  EQUIPMENT
  GENERIC
}

model Resource {
  id          String       @id @default(cuid())
  businessId  String
  name        String       @db.VarChar(50)  // "Chair 1", "Room A"
  type        ResourceType @default(GENERIC)
  description String?      @db.VarChar(200)
  isActive    Boolean      @default(true)
  sortOrder   Int          @default(0)      // For display ordering
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  business Business  @relation(fields: [businessId], references: [id])
  bookings Booking[]
  staff    Staff?    @relation(fields: [staffId], references: [id])  // Optional
  staffId  String?

  // Optional: Service restrictions
  allowedServices ResourceService[]

  @@unique([businessId, name])
  @@index([businessId, isActive])
}

// Updated Booking model
model Booking {
  id          String        @id @default(cuid())
  businessId  String
  resourceId  String?       // NEW - Optional for backward compatibility
  customerId  String?
  status      BookingStatus @default(PENDING)
  scheduledAt DateTime
  endAt       DateTime
  totalPrice  Decimal       @default(0) @db.Decimal(10, 2)
  paymentMode PaymentMode?
  notes       String?
  source      String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  business Business      @relation(fields: [businessId], references: [id])
  resource Resource?     @relation(fields: [resourceId], references: [id])  // NEW
  customer Customer?     @relation(fields: [customerId], references: [id])
  items    BookingItem[]

  @@index([businessId, scheduledAt])
  @@index([resourceId, scheduledAt])  // NEW
}
```

### Phase 3: Staff Model (Optional)

```prisma
model Staff {
  id          String   @id @default(cuid())
  businessId  String
  name        String   @db.VarChar(100)
  phone       String?
  role        String?  @db.VarChar(50)  // "Stylist", "Therapist"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  business  Business   @relation(fields: [businessId], references: [id])
  resources Resource[]
  bookings  Booking[]

  @@unique([businessId, phone])
}

// Update Booking to include staff
model Booking {
  // ... existing fields
  staffId  String?
  staff    Staff?  @relation(fields: [staffId], references: [id])
}
```

### Phase 4: Resource-Service Mapping (Optional)

```prisma
// Junction table for which services can be performed on which resources
model ResourceService {
  id         String   @id @default(cuid())
  resourceId String
  serviceId  String
  createdAt  DateTime @default(now())

  resource Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  service  Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@unique([resourceId, serviceId])
}
```

---

## API Changes

### Phase 1: Business Category

**Update Business Creation:**
```typescript
// POST /api/v1/businesses
{
  "name": "Zen Spa",
  "phoneNumber": "+919801441675",
  "category": "SPA"  // NEW
}
```

**Response includes category config:**
```typescript
{
  "success": true,
  "data": {
    "business": {
      "id": "...",
      "name": "Zen Spa",
      "category": "SPA",
      "categoryConfig": {
        "resourceName": "Room",
        "resourceNamePlural": "Rooms",
        "icon": "leaf"
      }
    }
  }
}
```

### Phase 2: Resource Management

**New Endpoints:**
```
POST   /api/v1/businesses/:businessId/resources     - Create resource
GET    /api/v1/businesses/:businessId/resources     - List resources
PATCH  /api/v1/resources/:id                        - Update resource
DELETE /api/v1/resources/:id                        - Delete resource
```

**Create Resource:**
```typescript
// POST /api/v1/businesses/:businessId/resources
{
  "name": "Chair 1",
  "type": "CHAIR",
  "description": "Near window"
}
```

**Updated Booking Creation:**
```typescript
// POST /api/v1/bookings
{
  "businessId": "...",
  "resourceId": "...",  // NEW - Optional, auto-assigned if not provided
  "serviceIds": ["..."],
  "scheduledAt": "2026-01-03T15:00:00.000Z"
}
```

**Updated Availability Check:**
```typescript
// POST /api/v1/bookings/check-availability
{
  "businessId": "...",
  "scheduledAt": "2026-01-03T15:00:00.000Z",
  "durationMinutes": 30,
  "serviceIds": ["..."]  // NEW - To check resource compatibility
}

// Response
{
  "success": true,
  "data": {
    "available": true,
    "availableResources": [
      { "id": "res1", "name": "Chair 1" },
      { "id": "res2", "name": "Chair 2" }
    ],
    "suggestedResource": { "id": "res1", "name": "Chair 1" }
  }
}
```

---

## Mobile App Configuration Flow

### Onboarding Flow (Updated)

```
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS SETUP WIZARD                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Business Type                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  What type of business do you run?                      │   │
│  │                                                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │  💇‍♂️    │  │  💄    │  │  🧖‍♀️    │  │  🏥    │   │   │
│  │  │ Salon   │  │ Parlor  │  │  Spa    │  │ Clinic  │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 2: Basic Info                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Business Name: [Classic Cuts                    ]      │   │
│  │  Phone Number:  [+91 98014 41675                 ]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 3: Resources (Chairs/Rooms)                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  How many chairs do you have?                           │   │
│  │                                                         │   │
│  │         ┌───┐                                           │   │
│  │    [-]  │ 3 │  [+]                                      │   │
│  │         └───┘                                           │   │
│  │                                                         │   │
│  │  Chair Names (optional):                                │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ Chair 1: [Main Chair        ]                   │   │   │
│  │  │ Chair 2: [Window Chair      ]                   │   │   │
│  │  │ Chair 3: [Back Chair        ]                   │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 4: Services                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Add your services:                                     │   │
│  │                                                         │   │
│  │  Suggested for Salons:                                  │   │
│  │  [✓] Haircut - ₹200 - 30 min                           │   │
│  │  [✓] Beard Trim - ₹100 - 15 min                        │   │
│  │  [ ] Hair Coloring - ₹500 - 60 min                     │   │
│  │  [ ] Shampoo - ₹50 - 10 min                            │   │
│  │                                                         │   │
│  │  [+ Add Custom Service]                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Resource Management Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Settings          MANAGE CHAIRS                    [+ Add]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🪑 Chair 1 - Main Chair                          [⋮]   │   │
│  │     Status: Active                                      │   │
│  │     Today's bookings: 5                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🪑 Chair 2 - Window Chair                        [⋮]   │   │
│  │     Status: Active                                      │   │
│  │     Today's bookings: 3                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🪑 Chair 3 - Back Chair                          [⋮]   │   │
│  │     Status: Inactive (on break)                         │   │
│  │     Today's bookings: 0                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Timeline View with Resources

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Dashboard         TODAY'S SCHEDULE                  [📅]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Time    │ Chair 1      │ Chair 2      │ Chair 3              │
│  ────────┼──────────────┼──────────────┼──────────────────────│
│  9:00 AM │              │              │                      │
│  ────────┼──────────────┼──────────────┼──────────────────────│
│  9:30 AM │ ┌──────────┐ │              │                      │
│          │ │ Haircut  │ │              │                      │
│  10:00AM │ │ Raj      │ │ ┌──────────┐ │                      │
│          │ └──────────┘ │ │ Coloring │ │                      │
│  10:30AM │              │ │ Priya    │ │ ┌──────────┐         │
│          │              │ │          │ │ │ Beard    │         │
│  11:00AM │ ┌──────────┐ │ └──────────┘ │ │ Amit     │         │
│          │ │ Haircut  │ │              │ └──────────┘         │
│  11:30AM │ │ Vikram   │ │              │                      │
│          │ └──────────┘ │              │                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Migration Strategy

### For Existing Businesses

When migrating existing businesses to the new resource model:

1. **Auto-create resources** based on `maxConcurrentBookings`:
   ```typescript
   // Migration script
   for (const business of existingBusinesses) {
     for (let i = 1; i <= business.maxConcurrentBookings; i++) {
       await prisma.resource.create({
         data: {
           businessId: business.id,
           name: `${getCategoryConfig(business.category).resourceName} ${i}`,
           type: getResourceType(business.category),
           isActive: true,
           sortOrder: i,
         },
       });
     }
   }
   ```

2. **Existing bookings** remain valid (resourceId is optional)

3. **New bookings** get auto-assigned to available resources

### Backward Compatibility

The system maintains backward compatibility:

- `resourceId` on Booking is **optional**
- If no resources exist, fall back to `maxConcurrentBookings` logic
- Existing API contracts remain unchanged
- New fields are additive, not breaking

---

## Summary

### What Changes for Different Niches?

| Aspect | Salon | Beauty Parlor | Spa | Clinic |
|--------|-------|---------------|-----|--------|
| Resource Name | Chair | Station | Room | Room |
| Default Services | Haircut, Beard | Facial, Threading | Massage | Consultation |
| Typical Resources | 2-5 chairs | 3-6 stations | 2-4 rooms | 2-3 rooms |
| Staff Assignment | Optional | Optional | Common | Required |

### Implementation Priority

1. **Phase 1 (Must Have)**: Business Category - 1-2 days
2. **Phase 2 (Must Have)**: Resource Model - 3-5 days
3. **Phase 3 (Nice to Have)**: Staff Assignment - 3-5 days
4. **Phase 4 (Future)**: Resource-Service Mapping - 2-3 days

### Key Benefits

1. **Scalability**: Same codebase serves salons, spas, clinics
2. **Flexibility**: Merchants configure their own resource setup
3. **Visibility**: See which chair/room is booked when
4. **Efficiency**: Auto-assign resources to optimize utilization
5. **Future-Ready**: Foundation for staff scheduling, equipment tracking

---

## Next Steps

1. Review this document and provide feedback
2. Decide on implementation phases
3. Create a spec for Phase 1 (Business Category)
4. Create a spec for Phase 2 (Resource Model)
5. Begin implementation

