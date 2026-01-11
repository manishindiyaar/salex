# Design Document: Admin Dashboard, Subscription System & Multi-Niche Architecture

## Overview

This design document outlines the architecture for the Salex Admin Dashboard, Subscription Management System, and Multi-Niche Feature Module architecture. The system enables platform operators to manage businesses, enforce subscription tiers, and dynamically configure features based on business category.

### Key Design Principles

1. **Modular Architecture**: Feature modules as discrete building blocks that can be enabled/disabled per business
2. **Configuration-Driven**: Niche templates stored in database, not hardcoded
3. **Separation of Concerns**: Admin Dashboard as separate React web app, sharing Express backend
4. **Graceful Degradation**: Features degrade gracefully when subscription expires

### System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SALEX PLATFORM (Extended)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │  Merchant App   │    │   Express API   │    │   Supabase PostgreSQL   │ │
│  │  (React Native) │◄──►│   (Node.js)     │◄──►│   + Prisma ORM          │ │
│  └─────────────────┘    └────────┬────────┘    └─────────────────────────┘ │
│                                  │                                          │
│  ┌─────────────────┐             │                                          │
│  │ Admin Dashboard │◄────────────┘                                          │
│  │ (React + Vite)  │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Architecture

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ADMIN DASHBOARD                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  apps/admin-dashboard/                                                      │
│  ├── src/                                                                   │
│  │   ├── pages/                                                             │
│  │   │   ├── LoginPage.tsx          # Admin authentication                  │
│  │   │   ├── DashboardPage.tsx      # Platform overview & stats             │
│  │   │   ├── BusinessesPage.tsx     # Business list with search/filter      │
│  │   │   ├── BusinessDetailPage.tsx # Single business management            │
│  │   │   ├── PaymentsPage.tsx       # Payment recording & history           │
│  │   │   ├── NicheTemplatesPage.tsx # Niche template configuration          │
│  │   │   ├── AuditLogPage.tsx       # Audit log viewer                      │
│  │   │   └── SystemHealthPage.tsx   # System health monitoring              │
│  │   ├── components/                                                        │
│  │   │   ├── BusinessTable.tsx      # Sortable business list                │
│  │   │   ├── BusinessStatusToggle.tsx # Active/Inactive toggle              │
│  │   │   ├── PaymentRecordForm.tsx  # Manual payment entry                  │
│  │   │   ├── SubscriptionCard.tsx   # Subscription status display           │
│  │   │   ├── ModuleToggleGrid.tsx   # Feature module toggles                │
│  │   │   └── HealthIndicator.tsx    # Service health status                 │
│  │   ├── services/                                                          │
│  │   │   ├── adminApi.ts            # Admin API client                      │
│  │   │   └── authService.ts         # Supabase admin auth                   │
│  │   └── hooks/                                                             │
│  │       ├── useAdminAuth.ts        # Admin authentication hook             │
│  │       └── useBusinesses.ts       # Business data fetching                │
│  ├── package.json                                                           │
│  └── vite.config.ts                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXPRESS API (Extended)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  apps/api/src/                                                              │
│  ├── routes/                                                                │
│  │   └── admin.routes.ts            # Admin-only endpoints                  │
│  ├── controllers/                                                           │
│  │   ├── admin-auth.controller.ts   # Admin login/logout                    │
│  │   ├── admin-business.controller.ts # Business management                 │
│  │   ├── admin-payment.controller.ts  # Payment recording                   │
│  │   ├── admin-template.controller.ts # Niche template CRUD                 │
│  │   └── admin-health.controller.ts   # System health                       │
│  ├── services/                                                              │
│  │   ├── feature-access.service.ts  # Plan & module access control          │
│  │   ├── subscription.service.ts    # Subscription state management         │
│  │   ├── niche-template.service.ts  # Template configuration                │
│  │   └── audit-log.service.ts       # Action logging                        │
│  └── middlewares/                                                           │
│      └── admin-auth.middleware.ts   # Admin JWT verification                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Feature Access Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FEATURE ACCESS DECISION FLOW                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Request to access feature                                                  │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Is business     │──NO──► Return: "Business inactive"                     │
│  │ isActive=true?  │                                                        │
│  └────────┬────────┘                                                        │
│           │ YES                                                             │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Is subscription │──NO──► Return: "Subscription expired"                  │
│  │ TRIAL or ACTIVE?│                                                        │
│  └────────┬────────┘                                                        │
│           │ YES                                                             │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Does plan       │──NO──► Return: "Upgrade to {plan} for this feature"    │
│  │ include feature?│                                                        │
│  └────────┬────────┘                                                        │
│           │ YES                                                             │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Is module       │──NO──► Return: "Feature not enabled for business"      │
│  │ enabled?        │                                                        │
│  └────────┬────────┘                                                        │
│           │ YES                                                             │
│           ▼                                                                 │
│       GRANT ACCESS                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Admin API Endpoints

```typescript
// Admin Authentication
POST   /v1/admin/auth/login           // Admin email/password login
POST   /v1/admin/auth/logout          // Admin logout
GET    /v1/admin/auth/me              // Get current admin user

// Business Management
GET    /v1/admin/businesses           // List all businesses (paginated)
GET    /v1/admin/businesses/:id       // Get business details
POST   /v1/admin/businesses/:id/toggle // Toggle business active status
PATCH  /v1/admin/businesses/:id/plan  // Change subscription plan
GET    /v1/admin/businesses/:id/modules // Get business modules
PATCH  /v1/admin/businesses/:id/modules // Update business modules

// Payment Management
POST   /v1/admin/payments             // Record manual payment
GET    /v1/admin/payments             // List all payments (paginated)
GET    /v1/admin/businesses/:id/payments // Get business payment history

// Niche Templates
GET    /v1/admin/templates            // List all niche templates
GET    /v1/admin/templates/:code      // Get template by code
POST   /v1/admin/templates            // Create niche template
PATCH  /v1/admin/templates/:code      // Update niche template
DELETE /v1/admin/templates/:code      // Delete niche template

// Platform Stats & Health
GET    /v1/admin/stats                // Platform-wide statistics
GET    /v1/admin/health               // System health check
GET    /v1/admin/audit-logs           // Audit log viewer

// Data Export
GET    /v1/admin/export/businesses    // Export businesses to CSV
GET    /v1/admin/export/payments      // Export payments to CSV
```

### Feature Access Service Interface

```typescript
interface FeatureAccessService {
  /**
   * Check if a business can access a specific feature
   * @returns { allowed: boolean, reason?: string }
   */
  canAccessFeature(businessId: string, featureCode: string): Promise<FeatureAccessResult>;
  
  /**
   * Get all features available to a business
   */
  getAvailableFeatures(businessId: string): Promise<string[]>;
  
  /**
   * Check if a business has an active subscription
   */
  hasActiveSubscription(businessId: string): Promise<boolean>;
}

interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  suggestedPlan?: SubscriptionPlan;
}
```

### Subscription Service Interface

```typescript
interface SubscriptionService {
  /**
   * Create trial subscription for new business
   */
  createTrialSubscription(businessId: string): Promise<Subscription>;
  
  /**
   * Record payment and activate subscription
   */
  recordPayment(subscriptionId: string, payment: PaymentInput): Promise<PaymentRecord>;
  
  /**
   * Transition subscription to new status
   */
  transitionStatus(subscriptionId: string, newStatus: SubscriptionStatus): Promise<Subscription>;
  
  /**
   * Check and process expired subscriptions (cron job)
   */
  processExpiredSubscriptions(): Promise<void>;
}
```

### Niche Template Service Interface

```typescript
interface NicheTemplateService {
  /**
   * Get template by category code
   */
  getTemplate(code: BusinessCategory): Promise<NicheTemplate>;
  
  /**
   * Apply template defaults to a business
   */
  applyTemplate(businessId: string, templateCode: BusinessCategory): Promise<void>;
  
  /**
   * Get terminology for a business category
   */
  getTerminology(category: BusinessCategory): Promise<TerminologyConfig>;
  
  /**
   * Get message templates for WhatsApp
   */
  getMessageTemplates(category: BusinessCategory): Promise<MessageTemplates>;
}
```

## Data Models

### New Prisma Models

```prisma
// ============================================
// SUBSCRIPTION & PAYMENT MODELS
// ============================================

enum SubscriptionPlan {
  BASIC
  PRO
  CUSTOM
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  GRACE
  EXPIRED
  CANCELLED
}

model Subscription {
  id                 String             @id @default(cuid())
  businessId         String             @unique
  plan               SubscriptionPlan   @default(BASIC)
  status             SubscriptionStatus @default(TRIAL)
  trialEndsAt        DateTime?
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelledAt        DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  business Business        @relation(fields: [businessId], references: [id])
  payments PaymentRecord[]

  @@index([status])
  @@index([currentPeriodEnd])
}

model PaymentRecord {
  id             String   @id @default(cuid())
  subscriptionId String
  amount         Decimal  @db.Decimal(10, 2)
  currency       String   @default("INR")
  paymentMethod  String   // "gpay" | "upi" | "bank_transfer"
  transactionRef String?
  periodStart    DateTime
  periodEnd      DateTime
  notes          String?
  recordedBy     String?  // Admin user ID
  createdAt      DateTime @default(now())

  subscription Subscription @relation(fields: [subscriptionId], references: [id])

  @@index([subscriptionId])
  @@index([createdAt])
}

// ============================================
// ADMIN USER MODEL
// ============================================

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  SUPPORT
}

model AdminUser {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  role      AdminRole @default(SUPPORT)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  auditLogs AuditLog[]
}

// ============================================
// NICHE TEMPLATE & MODULE MODELS
// ============================================

model NicheTemplate {
  id               String   @id @default(cuid())
  code             String   @unique  // "SALON", "CLINIC", etc.
  displayName      String
  icon             String
  terminology      Json     // TerminologyConfig
  enabledModules   String[] // ["appointment_booking", "walk_in_queue"]
  defaultServices  Json     // Array of default services
  defaultHours     Json     // { open: "09:00", close: "21:00" }
  messageTemplates Json     // WhatsApp message templates
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model FeatureModule {
  id          String   @id @default(cuid())
  code        String   @unique  // "appointment_booking", "walk_in_queue"
  name        String
  description String?
  plans       String[] // ["BASIC", "PRO", "CUSTOM"]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model BusinessModuleConfig {
  id         String   @id @default(cuid())
  businessId String
  moduleCode String
  isEnabled  Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id])

  @@unique([businessId, moduleCode])
}

// ============================================
// AUDIT LOG MODEL
// ============================================

model AuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String   // "TOGGLE_BUSINESS", "RECORD_PAYMENT", etc.
  entityType String   // "Business", "Subscription", "NicheTemplate"
  entityId   String
  changes    Json     // { previousValue, newValue }
  reason     String?
  createdAt  DateTime @default(now())

  admin AdminUser @relation(fields: [adminId], references: [id])

  @@index([adminId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

### Business Model Updates

```prisma
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
  isActive              Boolean          @default(true)   // NEW
  onboardingCompleted   Boolean          @default(false)
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  // Relations
  owner         User                   @relation(fields: [ownerId], references: [id])
  subscription  Subscription?          // NEW
  moduleConfigs BusinessModuleConfig[] // NEW
  services      Service[]
  bookings      Booking[]
  resources     Resource[]
  staff         Staff[]
  conversations WhatsAppConversation[]
  sessions      CustomerSession[]

  @@index([routingCode])
  @@index([category])
  @@index([isActive])
}

enum BusinessCategory {
  SALON
  BEAUTY_PARLOR
  SPA
  CLINIC
  FITNESS
  OTHER
}
```

### TypeScript Interfaces

```typescript
// Terminology configuration for dynamic UI
interface TerminologyConfig {
  resource: string;        // "Chair" | "Room" | "Station"
  resourcePlural: string;  // "Chairs" | "Rooms" | "Stations"
  staff: string;           // "Stylist" | "Doctor" | "Therapist"
  staffPlural: string;     // "Stylists" | "Doctors" | "Therapists"
  service: string;         // "Service" | "Treatment" | "Procedure"
  servicePlural: string;   // "Services" | "Treatments" | "Procedures"
  booking: string;         // "Booking" | "Appointment"
  bookingPlural: string;   // "Bookings" | "Appointments"
  customer: string;        // "Customer" | "Patient" | "Client"
  customerPlural: string;  // "Customers" | "Patients" | "Clients"
}

// WhatsApp message templates
interface MessageTemplates {
  welcome: string;
  serviceList: string;
  bookingConfirmation: string;
  reminder: string;
  cancellation: string;
}

// Plan feature matrix
const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  BASIC: [
    'walk_in_booking',
    'service_management',
    'resource_management',
    'staff_management',
    'basic_analytics',
  ],
  PRO: [
    'walk_in_booking',
    'service_management',
    'resource_management',
    'staff_management',
    'basic_analytics',
    'whatsapp_booking',
    'customer_history',
    'automated_reminders',
    'advanced_analytics',
  ],
  CUSTOM: [
    'walk_in_booking',
    'service_management',
    'resource_management',
    'staff_management',
    'basic_analytics',
    'whatsapp_booking',
    'customer_history',
    'automated_reminders',
    'advanced_analytics',
    'own_whatsapp_number',
    'website_widget',
    'custom_branding',
    'api_access',
  ],
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Admin Authentication Security

*For any* request to an admin API endpoint without a valid JWT token, the API SHALL return a 401 Unauthorized response.

**Validates: Requirements 1.5**

### Property 2: Admin Authorization Enforcement

*For any* request to an admin API endpoint from a non-admin user (regular merchant), the API SHALL return a 403 Forbidden response.

**Validates: Requirements 1.6**

### Property 3: Business Search Completeness

*For any* search query against the business list, all returned businesses SHALL match the query against at least one of: business name, phone number, or routing code.

**Validates: Requirements 2.2**

### Property 4: Business Filter Accuracy

*For any* filter applied to the business list (by plan or status), all returned businesses SHALL match the filter criteria exactly.

**Validates: Requirements 2.3**

### Property 5: Business Status Toggle Persistence

*For any* business status toggle action, the database SHALL reflect the new isActive value, and the change SHALL be logged in the audit log with adminId, businessId, previousStatus, newStatus, and timestamp.

**Validates: Requirements 3.1, 3.7, 14.1**

### Property 6: Inactive Business Booking Restriction

*For any* business with isActive=false, all attempts to create new bookings SHALL be rejected, while existing bookings SHALL remain unchanged.

**Validates: Requirements 3.2, 3.4**

### Property 7: Subscription State Machine Transitions

*For any* subscription, the following state transitions SHALL be enforced:
- TRIAL → ACTIVE (on payment) or EXPIRED (on trial expiry)
- ACTIVE → GRACE (on period end) or CANCELLED (on cancellation)
- GRACE → ACTIVE (on payment) or EXPIRED (on grace expiry)
- EXPIRED → ACTIVE (on payment)

**Validates: Requirements 4.2, 4.3, 4.4, 4.6**

### Property 8: Feature Access Control Matrix

*For any* feature access check, the Feature_Access_Service SHALL:
1. Deny access if business.isActive is false
2. Deny access if subscription.status is not TRIAL or ACTIVE
3. Deny access if the feature is not included in the subscription plan
4. Deny access if the feature module is disabled for the business
5. Return a clear reason for any denial

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 9: Payment Recording Side Effects

*For any* payment recorded through the admin dashboard, the system SHALL:
1. Create a PaymentRecord with all required fields
2. Update subscription.status to ACTIVE
3. Set subscription.currentPeriodEnd to periodStart + 30 days
4. Log the action in the audit log

**Validates: Requirements 6.1, 6.2, 6.3, 14.2**

### Property 10: Revenue Calculation Accuracy

*For any* date range filter applied to platform revenue, the total SHALL equal the sum of all PaymentRecord.amount values where createdAt falls within the specified range.

**Validates: Requirements 6.5**

### Property 11: Niche Template Application

*For any* business that selects a category during onboarding, the system SHALL apply the corresponding niche template's:
- Default services (pre-populated in service setup)
- Default hours (pre-filled in hours setup)
- Enabled modules (stored in BusinessModuleConfig)

**Validates: Requirements 7.5, 10.4, 10.5, 8.2**

### Property 12: Terminology Substitution Consistency

*For any* business with a specific category, all UI components in the Merchant App SHALL display terminology from the category's TerminologyConfig consistently across onboarding, dashboard, and management screens.

**Validates: Requirements 9.1, 9.2, 9.3, 9.5, 10.2, 10.3**

### Property 13: WhatsApp Message Customization

*For any* WhatsApp message sent to a customer, the message content SHALL:
1. Use the business's niche template message templates
2. Apply terminology appropriate to the business category
3. Substitute all placeholders with actual business/booking data

**Validates: Requirements 11.1, 11.2, 11.3, 11.5**

### Property 14: Trial Days Calculation

*For any* subscription with status TRIAL, the displayed "days remaining" SHALL equal the ceiling of (trialEndsAt - currentTime) in days, with a minimum of 0.

**Validates: Requirements 12.2**

### Property 15: Health Endpoint Completeness

*For any* call to /v1/admin/health, the response SHALL include status for all dependent services: API Server, Database, WhatsApp API, and Supabase.

**Validates: Requirements 13.5**

### Property 16: Audit Log Completeness

*For any* admin action (toggle business, record payment, modify template, override module), the system SHALL create an AuditLog entry with adminId, action type, entityType, entityId, changes, and timestamp.

**Validates: Requirements 14.1, 14.2, 14.3, 14.4**

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Error codes
const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Business errors
  BUSINESS_NOT_FOUND: 'BUSINESS_NOT_FOUND',
  BUSINESS_INACTIVE: 'BUSINESS_INACTIVE',
  
  // Subscription errors
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  
  // Payment errors
  INVALID_PAYMENT_AMOUNT: 'INVALID_PAYMENT_AMOUNT',
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
  
  // Template errors
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  TEMPLATE_CODE_EXISTS: 'TEMPLATE_CODE_EXISTS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};
```

### Error Handling Strategy

1. **Authentication Errors**: Return 401 with clear message, redirect to login
2. **Authorization Errors**: Return 403 with role requirements
3. **Not Found Errors**: Return 404 with entity type and ID
4. **Validation Errors**: Return 400 with field-level error details
5. **Business Logic Errors**: Return 422 with explanation and suggested action
6. **Server Errors**: Return 500, log full error, return generic message to client

## Testing Strategy

### Dual Testing Approach

This system requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs using randomized testing

### Property-Based Testing Configuration

- **Library**: fast-check (TypeScript)
- **Minimum iterations**: 100 per property test
- **Tag format**: `Feature: admin-subscription-multiniche, Property {number}: {property_text}`

### Test Categories

#### 1. Feature Access Service Tests

```typescript
// Property test: Feature access respects business active status
// Feature: admin-subscription-multiniche, Property 8: Feature Access Control Matrix
describe('FeatureAccessService', () => {
  it.prop([fc.string(), fc.string()])('denies access for inactive businesses', 
    async (businessId, featureCode) => {
      // Setup: Create inactive business
      // Assert: canAccessFeature returns { allowed: false, reason: 'Business inactive' }
    }
  );
});
```

#### 2. Subscription State Machine Tests

```typescript
// Property test: Subscription transitions follow state machine
// Feature: admin-subscription-multiniche, Property 7: Subscription State Machine Transitions
describe('SubscriptionService', () => {
  it.prop([fc.constantFrom('TRIAL', 'ACTIVE', 'GRACE', 'EXPIRED')])
    ('enforces valid state transitions', async (currentStatus) => {
      // Assert: Only valid transitions are allowed
    }
  );
});
```

#### 3. Admin API Security Tests

```typescript
// Property test: Admin endpoints reject unauthenticated requests
// Feature: admin-subscription-multiniche, Property 1: Admin Authentication Security
describe('Admin API Security', () => {
  it.prop([fc.constantFrom(...ADMIN_ENDPOINTS)])
    ('returns 401 for unauthenticated requests', async (endpoint) => {
      // Assert: Request without token returns 401
    }
  );
});
```

#### 4. Business Search Tests

```typescript
// Property test: Search returns matching businesses
// Feature: admin-subscription-multiniche, Property 3: Business Search Completeness
describe('Business Search', () => {
  it.prop([fc.string({ minLength: 1 })])
    ('returns businesses matching query', async (query) => {
      // Assert: All returned businesses match query in name, phone, or routingCode
    }
  );
});
```

### Unit Test Examples

```typescript
// Unit test: Specific subscription transition
describe('Subscription transitions', () => {
  it('transitions from TRIAL to ACTIVE on payment', async () => {
    const subscription = await createTrialSubscription(businessId);
    await recordPayment(subscription.id, { amount: 500 });
    expect(subscription.status).toBe('ACTIVE');
  });
  
  it('transitions from TRIAL to EXPIRED after 7 days', async () => {
    const subscription = await createTrialSubscription(businessId);
    await advanceTime(8 * 24 * 60 * 60 * 1000); // 8 days
    await processExpiredSubscriptions();
    expect(subscription.status).toBe('EXPIRED');
  });
});

// Unit test: Terminology substitution
describe('Terminology', () => {
  it('returns "Rooms" for CLINIC category', () => {
    const terminology = getTerminology('CLINIC');
    expect(terminology.resource).toBe('Room');
    expect(terminology.resourcePlural).toBe('Rooms');
  });
});
```

### Integration Test Scenarios

1. **Full onboarding flow with template application**
2. **Payment recording and subscription activation**
3. **Business toggle and WhatsApp routing**
4. **Admin authentication and authorization**
5. **Audit log creation for all admin actions**
