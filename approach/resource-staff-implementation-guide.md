# Resource & Staff Management Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture Context](#architecture-context)
3. [Database Schema Design](#database-schema-design)
4. [Backend API Implementation](#backend-api-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Testing with cURL](#testing-with-curl)
7. [Integration Flow](#integration-flow)

---

## Overview

This guide documents the complete implementation of the Resource & Staff Management feature for Salex. This feature enables salon owners to:
- Manage physical resources (chairs, beds, stations)
- Manage staff members who perform services
- Link staff to specific resources
- Track utilization and capacity
- Auto-assign resources and staff to bookings

**Target Audience**: Junior developers who need to understand the full implementation from database to UI.

---

## Architecture Context

### How This Fits Into Salex's Existing Architecture

Salex uses a **monorepo architecture** with the following structure:

```
salex/
├── apps/
│   ├── MerchantAppExpo/     # React Native merchant app
│   └── api/                  # Express.js backend (NEW)
├── packages/
│   └── shared-types/         # Shared TypeScript types + Prisma
```

**Before this feature**:
- Bookings were simple: just customer + service + time
- No concept of physical capacity or staff allocation
- Manual booking management only

**After this feature**:
- Bookings are allocated to specific resources and staff
- System tracks capacity and prevents overbooking
- Auto-assignment intelligently distributes workload
- Merchants can see utilization metrics

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Database** | Supabase PostgreSQL | Data storage with RLS |
| **ORM** | Prisma | Type-safe database access |
| **Backend** | Express.js + Node.js | REST API endpoints |
| **Validation** | Zod | Request/response validation |
| **Frontend** | React Native (Expo) | Mobile merchant app |
| **State** | Zustand | Client-side state management |
| **Types** | TypeScript | End-to-end type safety |

---

## Database Schema Design

### Why We Added These Tables

#### Problem Statement
Salons have **physical constraints**:
- Limited number of chairs/stations (resources)
- Limited number of staff members
- Staff may prefer specific stations
- Need to prevent double-booking

#### Solution: Three New Tables

### 1. Resource Table
**Purpose**: Represents physical bookable assets (chairs, beds, rooms, stations)

```prisma
model Resource {
  id           String   @id @default(cuid())
  businessId   String
  name         String   @db.VarChar(100)
  description  String?  @db.VarChar(500)
  isActive     Boolean  @default(true)
  displayOrder Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  business   Business            @relation(fields: [businessId], references: [id])
  bookings   Booking[]
  staffLinks ResourceStaffLink[]

  @@unique([businessId, name])
  @@index([businessId, isActive])
}
```

**Key Design Decisions**:
- **Soft Delete**: `isActive` flag instead of hard delete (preserves history)
- **Unique Constraint**: `businessId + name` prevents duplicate names per business
- **Display Order**: Allows merchants to customize ordering in UI
- **Optional Description**: For notes like "Window seat" or "VIP room"

### 2. Staff Table
**Purpose**: Represents staff members who perform services

```prisma
model Staff {
  id         String   @id @default(cuid())
  businessId String
  name       String   @db.VarChar(100)
  phone      String?  @db.VarChar(20)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  business      Business            @relation(fields: [businessId], references: [id])
  bookings      Booking[]
  resourceLinks ResourceStaffLink[]

  @@unique([businessId, name])
  @@index([businessId, isActive])
}
```

**Key Design Decisions**:
- **Optional Phone**: Not all staff need phone numbers
- **Soft Delete**: Same as resources
- **Unique Constraint**: Prevents duplicate staff names per business

### 3. ResourceStaffLink Table (Junction Table)
**Purpose**: Links staff to their preferred/assigned resources

```prisma
model ResourceStaffLink {
  id         String   @id @default(cuid())
  resourceId String
  staffId    String
  isPrimary  Boolean  @default(false)
  createdAt  DateTime @default(now())

  resource Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  staff    Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@unique([resourceId, staffId])
}
```

**Key Design Decisions**:
- **Many-to-Many**: Staff can work at multiple stations, stations can have multiple staff
- **isPrimary**: Marks the staff member's preferred station
- **Cascade Delete**: If resource or staff is deleted, links are automatically removed
- **Unique Constraint**: Prevents duplicate links

### 4. Updated Booking Table
**Added Fields**:
```prisma
model Booking {
  // ... existing fields ...
  resourceId  String?  // NEW: Which chair/station
  staffId     String?  // NEW: Which staff member
  
  resource Resource? @relation(fields: [resourceId], references: [id])
  staff    Staff?    @relation(fields: [staffId], references: [id])
}
```

**Why Optional?**:
- Backwards compatibility with existing bookings
- Walk-in bookings might not need pre-assignment
- Allows gradual migration

### Database Migration Process

```bash
# 1. Update schema.prisma with new models
cd packages/shared-types

# 2. Generate migration
pnpm db:push

# 3. Generate Prisma Client (updates TypeScript types)
pnpm db:generate
```

**What Happens**:
1. Prisma creates SQL migration files
2. Applies changes to Supabase database
3. Regenerates TypeScript types
4. Both backend and frontend get updated types automatically

---

## Backend API Implementation

### Step 1: Create Zod Validation Schemas

**Location**: `packages/shared-types/src/schemas/resource.schema.ts`

**Why Zod?**
- Runtime validation (catches bad data before it hits database)
- Auto-generates TypeScript types
- Shared between frontend and backend

**Example Schema**:
```typescript
export const createResourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().min(0).default(0),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
```

**Benefits**:
- `name` is optional (auto-generated if not provided)
- `description` is optional (not all resources need it)
- `displayOrder` has a default value
- TypeScript type is auto-generated from schema

### Step 2: Create Service Layer

**Location**: `apps/api/src/services/resource.service.ts`

**Service Pattern**: Business logic lives in services, not controllers

**Key Methods**:

#### 1. Create Resource
```typescript
async create(businessId: string, ownerId: string, data: CreateResourceInput): Promise<Resource>
```

**Logic Flow**:
1. Verify business exists and user owns it
2. Auto-generate name if not provided (`Chair 1`, `Chair 2`, etc.)
3. Check for duplicate names
4. Create resource in database
5. Log the action
6. Return created resource

**Why Auto-Generate Names?**
- Faster onboarding (merchants don't need to think of names)
- Consistent naming convention
- Can always be changed later

#### 2. Bulk Create Resources
```typescript
async createBulk(businessId: string, ownerId: string, data: BulkCreateResourceInput): Promise<Resource[]>
```

**Use Case**: Salon has 5 chairs, create them all at once

**Logic Flow**:
1. Verify ownership
2. Get current count of resources
3. Use transaction to create multiple resources atomically
4. Generate sequential names (`Chair 1`, `Chair 2`, ...)
5. Return all created resources

**Why Transaction?**
- All-or-nothing: either all resources are created or none
- Prevents partial failures
- Maintains data consistency

#### 3. List Resources with Stats
```typescript
async list(businessId: string, ownerId: string, includeInactive = false): Promise<ResourceWithStats[]>
```

**Returns Enhanced Data**:
```typescript
{
  id: "clx123...",
  name: "Chair 1",
  isActive: true,
  utilizationPercent: 65,      // NEW: How busy is this resource?
  activeBookingsCount: 3        // NEW: Current bookings
}
```

**Utilization Calculation**:
```typescript
// Get completed bookings in last 7 days
const completedBookings = await prisma.booking.findMany({
  where: {
    resourceId: resource.id,
    status: 'COMPLETED',
    scheduledAt: { gte: weekAgo },
  },
});

// Calculate total booked minutes
const bookedMinutes = completedBookings.reduce((sum, booking) => {
  const duration = (booking.endAt - booking.scheduledAt) / 60000;
  return sum + duration;
}, 0);

// Calculate percentage (7 days = 10,080 minutes)
const utilizationPercent = (bookedMinutes / 10080) * 100;
```

**Why This Matters**:
- Merchants can see which resources are underutilized
- Helps with capacity planning
- Identifies popular stations

#### 4. Deactivate with Protection
```typescript
async deactivate(id: string, businessId: string, ownerId: string): Promise<Resource>
```

**Safety Check**:
```typescript
// Check for active bookings
const activeBookings = await prisma.booking.count({
  where: {
    resourceId: id,
    status: { in: ['PENDING', 'CONFIRMED'] },
  },
});

if (activeBookings > 0) {
  throw new ConflictError(
    `Cannot deactivate resource with ${activeBookings} active booking(s)`
  );
}
```

**Why This Protection?**
- Prevents breaking existing bookings
- Forces merchant to reassign bookings first
- Maintains data integrity

### Step 3: Create Controllers

**Location**: `apps/api/src/controllers/resource.controller.ts`

**Controller Pattern**: Thin layer that handles HTTP concerns

**Example Controller Method**:
```typescript
async create(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Extract data from request
    const { businessId } = req.params;
    const ownerId = req.user!.id;  // From auth middleware
    
    // 2. Validate input with Zod
    const data = createResourceSchema.parse(req.body);
    
    // 3. Call service
    const resource = await resourceService.create(businessId, ownerId, data);
    
    // 4. Return response
    res.status(201).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    next(error);  // Pass to error middleware
  }
}
```

**Responsibilities**:
- Extract request data
- Validate input
- Call service
- Format response
- Handle errors

**What Controllers DON'T Do**:
- Business logic (that's in services)
- Database queries (that's in services)
- Complex calculations (that's in services)

### Step 4: Create Routes

**Location**: `apps/api/src/routes/resource.routes.ts`

```typescript
const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authMiddleware);

// Resource CRUD
router.post('/', resourceController.create);
router.post('/bulk', resourceController.createBulk);
router.get('/', resourceController.list);
router.get('/:id', resourceController.getById);
router.patch('/:id', resourceController.update);

// Activation management
router.post('/:id/deactivate', resourceController.deactivate);
router.post('/:id/reactivate', resourceController.reactivate);
```

**Route Structure**:
- Base: `/v1/businesses/:businessId/resources`
- Nested under business (resources belong to businesses)
- RESTful conventions (POST = create, GET = read, PATCH = update)

### Step 5: Register Routes in App

**Location**: `apps/api/src/app.ts`

```typescript
import resourceRoutes from './routes/resource.routes';
import staffRoutes from './routes/staff.routes';

// Register routes
app.use('/v1/businesses/:businessId/resources', resourceRoutes);
app.use('/v1/businesses/:businessId/staff', staffRoutes);
```

### Step 6: Auto-Assignment Service

**Location**: `apps/api/src/services/auto-assignment.service.ts`

**Purpose**: Intelligently assign resources and staff to bookings

**Key Algorithm**:

```typescript
async findBestAssignment(
  businessId: string,
  scheduledAt: Date,
  endAt: Date,
  preferences?: AssignmentPreferences
): Promise<AssignmentResult>
```

**Assignment Priority**:
1. **Customer Preference**: If customer requested specific staff
2. **Linked Pairs**: Staff + their preferred resource
3. **Load Balancing**: Lowest utilization first
4. **Manual Override**: Merchant can manually select

**Example Logic**:
```typescript
// 1. Get availability
const availability = await availabilityService.getAvailability(
  businessId, scheduledAt, endAt
);

// 2. Check for customer preference
if (preferences?.customerPreferredStaffId) {
  const staff = availability.availableStaff.find(
    s => s.id === preferences.customerPreferredStaffId
  );
  if (staff) {
    // Find their linked resource
    const linkedResource = availability.availableResources.find(
      r => staff.linkedResourceIds.includes(r.id)
    );
    return { staff, resource: linkedResource || availability.availableResources[0] };
  }
}

// 3. Find linked pairs
for (const resource of availability.availableResources) {
  const linkedStaff = availability.availableStaff.find(
    s => s.linkedResourceIds.includes(resource.id)
  );
  if (linkedStaff) {
    return { resource, staff: linkedStaff, reason: 'linked_pair_available' };
  }
}

// 4. Fallback to lowest utilization
return {
  resource: availability.availableResources[0],  // Already sorted by utilization
  staff: availability.availableStaff[0],
  reason: 'lowest_utilization'
};
```

**Race Condition Prevention**:
```typescript
// Use Serializable transaction isolation
await prisma.$transaction(async (tx) => {
  // Re-check availability within transaction
  // Allocate resource and staff
  // Update booking
}, {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 10000
});
```

**Why Serializable?**
- Prevents two bookings from grabbing the same resource simultaneously
- Database handles locking automatically
- Retries on conflict

---

## Testing with cURL

### Prerequisites

```bash
# 1. Start the API server
cd apps/api
pnpm dev

# 2. Get authentication token
# (Assuming you have a valid JWT token)
export TOKEN="your-jwt-token-here"
export BUSINESS_ID="your-business-id-here"
```

### Test 1: Create a Single Resource

```bash
curl -X POST http://localhost:3000/v1/businesses/$BUSINESS_ID/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Chair 1",
    "description": "Window seat with good lighting"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "clx123abc...",
    "businessId": "clx456def...",
    "name": "Chair 1",
    "description": "Window seat with good lighting",
    "isActive": true,
    "displayOrder": 0,
    "createdAt": "2026-01-09T10:30:00.000Z",
    "updatedAt": "2026-01-09T10:30:00.000Z"
  }
}
```

### Test 2: Bulk Create Resources

```bash
curl -X POST http://localhost:3000/v1/businesses/$BUSINESS_ID/resources/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "count": 5,
    "prefix": "Chair"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    { "id": "clx1...", "name": "Chair 1", ... },
    { "id": "clx2...", "name": "Chair 2", ... },
    { "id": "clx3...", "name": "Chair 3", ... },
    { "id": "clx4...", "name": "Chair 4", ... },
    { "id": "clx5...", "name": "Chair 5", ... }
  ]
}
```

### Test 3: List Resources with Stats

```bash
curl -X GET "http://localhost:3000/v1/businesses/$BUSINESS_ID/resources" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123...",
      "name": "Chair 1",
      "isActive": true,
      "displayOrder": 0,
      "utilizationPercent": 65,
      "activeBookingsCount": 3
    },
    {
      "id": "clx456...",
      "name": "Chair 2",
      "isActive": true,
      "displayOrder": 1,
      "utilizationPercent": 42,
      "activeBookingsCount": 1
    }
  ]
}
```

### Test 4: Create Staff Member

```bash
curl -X POST http://localhost:3000/v1/businesses/$BUSINESS_ID/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Priya Sharma",
    "phone": "+919876543210"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "clx789ghi...",
    "businessId": "clx456def...",
    "name": "Priya Sharma",
    "phone": "+919876543210",
    "isActive": true,
    "createdAt": "2026-01-09T10:35:00.000Z",
    "updatedAt": "2026-01-09T10:35:00.000Z"
  }
}
```

### Test 5: Link Staff to Resource

```bash
export STAFF_ID="clx789ghi..."
export RESOURCE_ID="clx123abc..."

curl -X POST http://localhost:3000/v1/businesses/$BUSINESS_ID/staff/$STAFF_ID/link-resource \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "resourceId": "'$RESOURCE_ID'",
    "isPrimary": true
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "clxlink123...",
    "staffId": "clx789ghi...",
    "resourceId": "clx123abc...",
    "isPrimary": true,
    "createdAt": "2026-01-09T10:40:00.000Z"
  }
}
```

### Test 6: Check Availability

```bash
curl -X POST http://localhost:3000/v1/businesses/$BUSINESS_ID/availability/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "scheduledAt": "2026-01-10T14:00:00.000Z",
    "durationMinutes": 60
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "available": true,
    "availableResources": [
      {
        "id": "clx123...",
        "name": "Chair 1",
        "utilizationPercent": 65,
        "isLinkedStaffAvailable": true
      },
      {
        "id": "clx456...",
        "name": "Chair 2",
        "utilizationPercent": 42,
        "isLinkedStaffAvailable": false
      }
    ],
    "availableStaff": [
      {
        "id": "clx789...",
        "name": "Priya Sharma",
        "utilizationPercent": 58,
        "linkedResourceIds": ["clx123..."]
      }
    ],
    "suggestedAssignment": {
      "resourceId": "clx123...",
      "resourceName": "Chair 1",
      "staffId": "clx789...",
      "staffName": "Priya Sharma",
      "reason": "linked_pair_available"
    },
    "effectiveCapacity": 5,
    "currentUtilization": 60
  }
}
```

### Test 7: Deactivate Resource (Should Fail with Active Bookings)

```bash
curl -X POST http://localhost:3000/v1/businesses/$BUSINESS_ID/resources/$RESOURCE_ID/deactivate \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Cannot deactivate resource with 3 active booking(s). Complete or reassign bookings first."
  }
}
```

### Test 8: Update Resource

```bash
curl -X PATCH http://localhost:3000/v1/businesses/$BUSINESS_ID/resources/$RESOURCE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "VIP Chair 1",
    "description": "Premium station with massage chair"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "clx123abc...",
    "name": "VIP Chair 1",
    "description": "Premium station with massage chair",
    "isActive": true,
    "displayOrder": 0,
    "updatedAt": "2026-01-09T10:50:00.000Z"
  }
}
```

---

## Frontend Implementation

### Architecture Overview

**Frontend Stack**:
- **React Native** (Expo) - Cross-platform mobile app
- **Zustand** - State management
- **React Navigation** - Screen navigation
- **TypeScript** - Type safety

**Component Structure**:
```
src/
├── screens/
│   └── main/
│       ├── ResourceManagementScreen.tsx
│       └── StaffManagementScreen.tsx
├── components/
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx
│   │   ├── ResourceSetupStep.tsx
│   │   └── StaffSetupStep.tsx
│   ├── booking/
│   │   ├── ResourceStaffSelector.tsx
│   │   └── QuickBookButton.tsx
│   └── capacity/
│       └── CapacityStatusCard.tsx
├── services/
│   ├── resourceService.ts
│   └── staffService.ts
└── store/
    ├── resourceStore.ts
    └── staffStore.ts
```

### Step 1: Create API Service Layer

**Location**: `apps/MerchantAppExpo/src/services/resourceService.ts`

**Purpose**: Centralized API calls with type safety

```typescript
import { apiClient } from './apiClient';
import { Resource, CreateResourceInput } from '@salex/shared-types';

class ResourceService {
  async createOne(businessId: string, data: CreateResourceInput): Promise<Resource> {
    const response = await apiClient.post(
      `/v1/businesses/${businessId}/resources`,
      data
    );
    return response.data.data;
  }

  async createBulk(businessId: string, count: number, prefix: string): Promise<Resource[]> {
    const response = await apiClient.post(
      `/v1/businesses/${businessId}/resources/bulk`,
      { count, prefix }
    );
    return response.data.data;
  }

  async list(businessId: string): Promise<ResourceWithStats[]> {
    const response = await apiClient.get(
      `/v1/businesses/${businessId}/resources`
    );
    return response.data.data;
  }

  async update(businessId: string, id: string, data: UpdateResourceInput): Promise<Resource> {
    const response = await apiClient.patch(
      `/v1/businesses/${businessId}/resources/${id}`,
      data
    );
    return response.data.data;
  }

  async deactivate(businessId: string, id: string): Promise<Resource> {
    const response = await apiClient.post(
      `/v1/businesses/${businessId}/resources/${id}/deactivate`
    );
    return response.data.data;
  }
}

export const resourceService = new ResourceService();
```

**Benefits**:
- Single source of truth for API calls
- Type-safe requests and responses
- Easy to mock for testing
- Centralized error handling

### Step 2: Create Zustand Store

**Location**: `apps/MerchantAppExpo/src/store/resourceStore.ts`

**Purpose**: Client-side state management

```typescript
import { create } from 'zustand';
import { resourceService } from '../services/resourceService';

interface ResourceStore {
  resources: ResourceWithStats[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchResources: (businessId: string) => Promise<void>;
  createResource: (businessId: string, data: CreateResourceInput) => Promise<void>;
  updateResource: (businessId: string, id: string, data: UpdateResourceInput) => Promise<void>;
  deactivateResource: (businessId: string, id: string) => Promise<void>;
}

export const useResourceStore = create<ResourceStore>((set, get) => ({
  resources: [],
  loading: false,
  error: null,

  fetchResources: async (businessId: string) => {
    set({ loading: true, error: null });
    try {
      const resources = await resourceService.list(businessId);
      set({ resources, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createResource: async (businessId: string, data: CreateResourceInput) => {
    set({ loading: true, error: null });
    try {
      const newResource = await resourceService.createOne(businessId, data);
      set(state => ({
        resources: [...state.resources, newResource],
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateResource: async (businessId: string, id: string, data: UpdateResourceInput) => {
    set({ loading: true, error: null });
    try {
      const updated = await resourceService.update(businessId, id, data);
      set(state => ({
        resources: state.resources.map(r => r.id === id ? { ...r, ...updated } : r),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deactivateResource: async (businessId: string, id: string) => {
    set({ loading: true, error: null });
    try {
      await resourceService.deactivate(businessId, id);
      set(state => ({
        resources: state.resources.map(r => 
          r.id === id ? { ...r, isActive: false } : r
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
```

**Why Zustand?**
- Simpler than Redux (less boilerplate)
- Built-in TypeScript support
- No context providers needed
- Easy to use with React hooks

### Step 3: Create Management Screen

**Location**: `apps/MerchantAppExpo/src/screens/main/ResourceManagementScreen.tsx`

**Key Features**:
- List all resources with stats
- Create new resources (single or bulk)
- Edit resource details
- Deactivate resources
- Visual utilization indicators

**Example Component**:
```typescript
export const ResourceManagementScreen = () => {
  const { resources, loading, fetchResources, createResource } = useResourceStore();
  const { businessId } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchResources(businessId);
  }, [businessId]);

  const handleCreate = async (data: CreateResourceInput) => {
    try {
      await createResource(businessId, data);
      setShowCreateModal(false);
      Alert.alert('Success', 'Resource created successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={resources}
        renderItem={({ item }) => (
          <ResourceCard
            resource={item}
            onEdit={() => handleEdit(item)}
            onDeactivate={() => handleDeactivate(item.id)}
          />
        )}
        ListEmptyComponent={<EmptyState />}
      />
      
      <FAB
        icon="plus"
        onPress={() => setShowCreateModal(true)}
      />
      
      <CreateResourceModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />
    </View>
  );
};
```

### Step 4: Create Onboarding Wizard

**Location**: `apps/MerchantAppExpo/src/components/onboarding/OnboardingWizard.tsx`

**Purpose**: Guide new merchants through initial setup

**Flow**:
1. **Welcome** - Explain what resources and staff are
2. **Resource Setup** - Create chairs/stations
3. **Staff Setup** - Add staff members
4. **Link Resources** - Connect staff to preferred stations
5. **Review** - Confirm setup
6. **Complete** - Mark onboarding as done

**Example Step Component**:
```typescript
export const ResourceSetupStep = ({ onNext }: { onNext: () => void }) => {
  const [count, setCount] = useState(3);
  const { createBulkResources } = useResourceStore();
  const { businessId } = useAuthStore();

  const handleCreate = async () => {
    try {
      await createBulkResources(businessId, count, 'Chair');
      onNext();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.step}>
      <Text style={styles.title}>How many chairs/stations do you have?</Text>
      
      <Slider
        value={count}
        onValueChange={setCount}
        minimumValue={1}
        maximumValue={20}
        step={1}
      />
      
      <Text style={styles.count}>{count} chairs</Text>
      
      <Button onPress={handleCreate}>
        Create {count} Chairs
      </Button>
    </View>
  );
};
```

### Step 5: Create Booking Components

**Location**: `apps/MerchantAppExpo/src/components/booking/ResourceStaffSelector.tsx`

**Purpose**: Select resource and staff when creating/editing bookings

```typescript
export const ResourceStaffSelector = ({
  scheduledAt,
  endAt,
  onSelect,
}: {
  scheduledAt: Date;
  endAt: Date;
  onSelect: (resourceId: string, staffId: string) => void;
}) => {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const { businessId } = useAuthStore();

  useEffect(() => {
    checkAvailability();
  }, [scheduledAt, endAt]);

  const checkAvailability = async () => {
    const result = await availabilityService.check(businessId, scheduledAt, endAt);
    setAvailability(result);
  };

  if (!availability?.available) {
    return (
      <View style={styles.unavailable}>
        <Text>No availability for this time slot</Text>
        {availability?.alternatives && (
          <AlternativeSlots slots={availability.alternatives} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.selector}>
      <Text style={styles.label}>Select Resource</Text>
      <FlatList
        data={availability.availableResources}
        renderItem={({ item }) => (
          <ResourceOption
            resource={item}
            selected={selectedResourceId === item.id}
            onPress={() => setSelectedResourceId(item.id)}
          />
        )}
      />

      <Text style={styles.label}>Select Staff</Text>
      <FlatList
        data={availability.availableStaff}
        renderItem={({ item }) => (
          <StaffOption
            staff={item}
            selected={selectedStaffId === item.id}
            onPress={() => setSelectedStaffId(item.id)}
          />
        )}
      />

      {availability.suggestedAssignment && (
        <SuggestedPair
          suggestion={availability.suggestedAssignment}
          onAccept={() => {
            onSelect(
              availability.suggestedAssignment.resourceId,
              availability.suggestedAssignment.staffId
            );
          }}
        />
      )}
    </View>
  );
};
```

### Step 6: Create Capacity Dashboard

**Location**: `apps/MerchantAppExpo/src/components/capacity/CapacityStatusCard.tsx`

**Purpose**: Show real-time capacity status

```typescript
export const CapacityStatusCard = () => {
  const { resources } = useResourceStore();
  const { staff } = useStaffStore();
  const { businessId } = useAuthStore();
  const [capacity, setCapacity] = useState<CapacityInfo | null>(null);

  useEffect(() => {
    fetchCapacity();
  }, [businessId]);

  const fetchCapacity = async () => {
    const info = await availabilityService.getCapacityInfo(businessId);
    setCapacity(info);
  };

  const getStatusColor = () => {
    if (capacity?.warning === 'zero_capacity') return Colors.ERROR;
    if (capacity?.warning) return Colors.WARNING;
    return Colors.SUCCESS;
  };

  return (
    <Card style={[styles.card, { borderLeftColor: getStatusColor() }]}>
      <Text style={styles.title}>Current Capacity</Text>
      
      <View style={styles.stats}>
        <StatItem
          label="Active Resources"
          value={capacity?.activeResources || 0}
          icon="chair"
        />
        <StatItem
          label="Active Staff"
          value={capacity?.activeStaff || 0}
          icon="account"
        />
        <StatItem
          label="Effective Capacity"
          value={capacity?.effectiveCapacity || 0}
          icon="gauge"
        />
      </View>

      {capacity?.warning && (
        <Alert severity="warning">
          {capacity.warningMessage}
        </Alert>
      )}
    </Card>
  );
};
```

---

## Integration Flow

### Complete User Journey

#### 1. Merchant Onboarding (First Time Setup)

```
User opens app → Login → Onboarding Wizard
  ↓
Step 1: Create Resources
  - User selects number of chairs (e.g., 5)
  - Frontend calls: POST /v1/businesses/:id/resources/bulk
  - Backend creates: Chair 1, Chair 2, Chair 3, Chair 4, Chair 5
  ↓
Step 2: Add Staff
  - User enters staff names
  - Frontend calls: POST /v1/businesses/:id/staff (for each)
  - Backend creates staff records
  ↓
Step 3: Link Staff to Resources
  - User drags staff to preferred chairs
  - Frontend calls: POST /v1/businesses/:id/staff/:id/link-resource
  - Backend creates ResourceStaffLink records
  ↓
Step 4: Review & Complete
  - Frontend calls: PATCH /v1/businesses/:id { onboardingCompleted: true }
  - User proceeds to dashboard
```

#### 2. Creating a Booking (WhatsApp Customer)

```
Customer sends WhatsApp message → Backend receives webhook
  ↓
Backend: Parse message → Identify business → Get services
  ↓
Customer selects service → Backend calculates duration
  ↓
Customer selects time slot
  ↓
Backend: Check availability
  - GET /v1/businesses/:id/availability/check
  - Returns available resources and staff
  - Suggests best assignment (linked pair or lowest utilization)
  ↓
Backend: Create booking
  - POST /v1/businesses/:id/bookings
  - Auto-assigns resource and staff using autoAssignmentService
  - Uses Serializable transaction to prevent race conditions
  ↓
Backend: Send confirmation to customer via WhatsApp
  - "Booking confirmed! Chair 3 with Priya at 2:00 PM"
```

#### 3. Manual Booking (Merchant App)

```
Merchant opens app → Bookings screen → "New Booking" button
  ↓
Select customer (or create new)
  ↓
Select service(s)
  ↓
Select date and time
  ↓
Frontend: Check availability
  - POST /v1/businesses/:id/availability/check
  - Shows available resources and staff
  - Highlights suggested assignment
  ↓
Merchant can:
  - Accept suggestion (one tap)
  - Manually select resource and staff
  ↓
Frontend: Create booking
  - POST /v1/businesses/:id/bookings
  - Includes selected resourceId and staffId
  ↓
Backend: Validate and create
  - Verify resource and staff are still available
  - Create booking record
  - Return confirmation
  ↓
Frontend: Show success message
  - Update local state
  - Refresh booking list
```

#### 4. Viewing Dashboard (Merchant App)

```
Merchant opens dashboard
  ↓
Frontend: Fetch data in parallel
  - GET /v1/businesses/:id/resources (with stats)
  - GET /v1/businesses/:id/staff (with stats)
  - GET /v1/businesses/:id/bookings?status=CONFIRMED
  - GET /v1/businesses/:id/availability/capacity
  ↓
Frontend: Display cards
  - Capacity Status Card (shows warnings if any)
  - Resource Utilization Chart
  - Staff Workload Chart
  - Today's Bookings Timeline
  ↓
Real-time updates (optional future enhancement)
  - WebSocket connection to Supabase Realtime
  - Listen for booking changes
  - Update UI automatically
```

### Data Flow Diagram

```
┌─────────────────┐
│  React Native   │
│  Merchant App   │
└────────┬────────┘
         │
         │ HTTP/REST
         │ (JWT Auth)
         ▼
┌─────────────────┐
│   Express.js    │
│   Backend API   │
└────────┬────────┘
         │
         │ Prisma ORM
         │
         ▼
┌─────────────────┐
│   Supabase      │
│   PostgreSQL    │
└─────────────────┘

Type Flow:
┌─────────────────┐
│ Prisma Schema   │
│  (schema.prisma)│
└────────┬────────┘
         │
         │ prisma generate
         ▼
┌─────────────────┐
│ Prisma Client   │
│ (TypeScript)    │
└────────┬────────┘
         │
         │ import
         ▼
┌─────────────────┐
│  Zod Schemas    │
│ (validation)    │
└────────┬────────┘
         │
         │ export
         ▼
┌─────────────────┐
│ shared-types    │
│   package       │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│   Backend    │  │   Frontend   │
│   Services   │  │   Services   │
└──────────────┘  └──────────────┘
```

---

## Key Design Patterns

### 1. Service Layer Pattern
**Separation of Concerns**:
- Controllers handle HTTP
- Services handle business logic
- Prisma handles database

**Benefits**:
- Easy to test (mock services)
- Reusable logic
- Clear responsibilities

### 2. Repository Pattern (via Prisma)
**Abstraction**:
- Services don't write raw SQL
- Prisma provides type-safe queries
- Easy to switch databases

### 3. DTO Pattern (Data Transfer Objects)
**Type Safety**:
- Zod schemas validate input
- TypeScript types ensure correctness
- Shared between frontend and backend

### 4. Optimistic Updates (Frontend)
**Better UX**:
```typescript
// Update UI immediately
set(state => ({
  resources: [...state.resources, newResource]
}));

// Then sync with backend
try {
  await resourceService.create(data);
} catch (error) {
  // Rollback on error
  set(state => ({
    resources: state.resources.filter(r => r.id !== newResource.id)
  }));
}
```

### 5. Transaction Pattern (Race Condition Prevention)
**Concurrency Control**:
```typescript
await prisma.$transaction(async (tx) => {
  // All operations are atomic
  // Either all succeed or all fail
  // Serializable isolation prevents conflicts
}, {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable
});
```

**Why This Matters**:
- Two customers book same slot simultaneously
- Database ensures only one succeeds
- Other gets clear error message

---

## Common Pitfalls & Solutions

### Pitfall 1: Not Checking Availability Before Booking
**Problem**: Creating booking without checking if resource/staff are available

**Solution**: Always call availability check first
```typescript
// ❌ Bad
await bookingService.create({ resourceId, staffId, ... });

// ✅ Good
const availability = await availabilityService.check(scheduledAt, endAt);
if (!availability.available) {
  throw new Error('Slot not available');
}
await bookingService.create({ resourceId, staffId, ... });
```

### Pitfall 2: Forgetting Soft Delete
**Problem**: Hard deleting resources breaks historical bookings

**Solution**: Use `isActive` flag
```typescript
// ❌ Bad
await prisma.resource.delete({ where: { id } });

// ✅ Good
await prisma.resource.update({
  where: { id },
  data: { isActive: false }
});
```

### Pitfall 3: Not Handling Race Conditions
**Problem**: Two requests book same resource simultaneously

**Solution**: Use Serializable transactions
```typescript
await prisma.$transaction(async (tx) => {
  // Re-check availability within transaction
  // Allocate resource
}, {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable
});
```

### Pitfall 4: Ignoring Utilization Metrics
**Problem**: Not tracking which resources are underused

**Solution**: Calculate and display utilization
```typescript
const utilizationPercent = (bookedMinutes / totalMinutes) * 100;
```

### Pitfall 5: Poor Error Messages
**Problem**: Generic errors don't help users

**Solution**: Specific, actionable messages
```typescript
// ❌ Bad
throw new Error('Cannot deactivate');

// ✅ Good
throw new ConflictError(
  `Cannot deactivate resource with ${activeBookings} active booking(s). ` +
  'Complete or reassign bookings first.'
);
```

---

## Performance Considerations

### 1. Database Indexes
```prisma
model Resource {
  @@index([businessId, isActive])  // Fast filtering
}

model Booking {
  @@index([businessId, scheduledAt])  // Fast date queries
  @@index([resourceId, scheduledAt])  // Fast availability checks
  @@index([staffId, scheduledAt])     // Fast staff queries
}
```

### 2. Batch Operations
```typescript
// ❌ Bad: N+1 queries
for (const resource of resources) {
  await prisma.booking.count({ where: { resourceId: resource.id } });
}

// ✅ Good: Single query
const bookingCounts = await prisma.booking.groupBy({
  by: ['resourceId'],
  _count: true,
  where: { resourceId: { in: resourceIds } }
});
```

### 3. Caching (Future Enhancement)
```typescript
// Cache capacity info for 5 minutes
const capacity = await redis.get(`capacity:${businessId}`);
if (!capacity) {
  const fresh = await calculateCapacity(businessId);
  await redis.setex(`capacity:${businessId}`, 300, JSON.stringify(fresh));
  return fresh;
}
return JSON.parse(capacity);
```

---

## Testing Strategy

### 1. Unit Tests (Services)
```typescript
describe('ResourceService', () => {
  it('should create resource with auto-generated name', async () => {
    const resource = await resourceService.create(businessId, ownerId, {});
    expect(resource.name).toBe('Chair 1');
  });

  it('should prevent deactivation with active bookings', async () => {
    // Create resource with active booking
    await expect(
      resourceService.deactivate(resourceId, businessId, ownerId)
    ).rejects.toThrow('Cannot deactivate resource');
  });
});
```

### 2. Integration Tests (API)
```typescript
describe('POST /v1/businesses/:id/resources', () => {
  it('should create resource and return 201', async () => {
    const response = await request(app)
      .post(`/v1/businesses/${businessId}/resources`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Chair' })
      .expect(201);

    expect(response.body.data.name).toBe('Test Chair');
  });

  it('should reject duplicate names', async () => {
    await request(app)
      .post(`/v1/businesses/${businessId}/resources`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Chair 1' })
      .expect(409);
  });
});
```

### 3. E2E Tests (Frontend)
```typescript
describe('Resource Management', () => {
  it('should create resource via UI', async () => {
    await element(by.id('add-resource-button')).tap();
    await element(by.id('resource-name-input')).typeText('VIP Chair');
    await element(by.id('create-button')).tap();
    
    await expect(element(by.text('VIP Chair'))).toBeVisible();
  });
});
```

---

## Deployment Checklist

### Backend Deployment
- [ ] Run database migrations (`pnpm db:push`)
- [ ] Generate Prisma Client (`pnpm db:generate`)
- [ ] Set environment variables (DATABASE_URL, JWT_SECRET)
- [ ] Build backend (`pnpm build`)
- [ ] Start server (`pnpm start`)
- [ ] Verify health endpoint (`GET /health`)

### Frontend Deployment
- [ ] Update API base URL in config
- [ ] Build app (`eas build`)
- [ ] Test on physical devices
- [ ] Submit to app stores

### Database Setup
- [ ] Create Supabase project
- [ ] Enable connection pooler
- [ ] Set up RLS policies
- [ ] Create indexes
- [ ] Backup strategy

---

## Monitoring & Observability

### Key Metrics to Track

1. **Capacity Metrics**
   - Average utilization per resource
   - Average utilization per staff
   - Peak booking times
   - Idle resources

2. **Performance Metrics**
   - API response times
   - Database query times
   - Transaction success rate
   - Error rates

3. **Business Metrics**
   - Bookings per day
   - Revenue per resource
   - Staff productivity
   - Customer preferences

### Logging Strategy
```typescript
logger.info({
  resourceId,
  businessId,
  action: 'resource_created',
  metadata: { name, displayOrder }
}, 'Resource created');
```

**What to Log**:
- All CRUD operations
- Availability checks
- Assignment decisions
- Errors and exceptions
- Performance bottlenecks

---

## Future Enhancements

### 1. Real-time Updates
- WebSocket connection for live booking updates
- Push notifications for merchants
- Live capacity dashboard

### 2. Advanced Scheduling
- Recurring bookings
- Block scheduling (lunch breaks, cleaning)
- Multi-resource bookings (spa packages)

### 3. Analytics Dashboard
- Resource utilization trends
- Staff performance metrics
- Revenue forecasting
- Customer behavior analysis

### 4. Smart Assignment
- Machine learning for preference prediction
- Customer-staff matching based on history
- Dynamic pricing based on demand

### 5. Mobile Optimization
- Offline mode with sync
- Background sync
- Push notifications
- Biometric authentication

---

## Conclusion

This implementation provides a solid foundation for resource and staff management in Salex. The architecture is:

✅ **Scalable**: Can handle thousands of bookings
✅ **Type-safe**: End-to-end TypeScript
✅ **Maintainable**: Clear separation of concerns
✅ **Testable**: Services are easily mockable
✅ **Performant**: Optimized queries and indexes
✅ **Reliable**: Transaction-based concurrency control

### Next Steps for Junior Developers

1. **Understand the Flow**: Follow a booking from WhatsApp to database
2. **Read the Code**: Start with services, then controllers, then frontend
3. **Test Locally**: Use cURL to test API endpoints
4. **Make Changes**: Try adding a new field or endpoint
5. **Ask Questions**: Don't hesitate to ask for clarification

### Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

**Document Version**: 1.0  
**Last Updated**: January 9, 2026  
**Author**: Kiro AI Assistant  
**Maintained By**: Salex Development Team
