# Salex Platform Architecture & Scaling Guide

> **Master Reference Document for Platform Evolution**
> Last Updated: January 11, 2026

## Executive Summary

This document provides a comprehensive analysis of the Salex platform architecture, subscription model strategy, admin dashboard requirements, and multi-niche scaling approach. It serves as the master reference for platform evolution from a single-niche salon booking system to a multi-vertical service business platform.

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Admin Dashboard Requirements](#2-admin-dashboard-requirements)
3. [Subscription Model Design](#3-subscription-model-design)
4. [WhatsApp Integration Architecture](#4-whatsapp-integration-architecture)
5. [Multi-Niche Scaling Strategy](#5-multi-niche-scaling-strategy)
6. [Payment Strategy](#6-payment-strategy)
7. [Database Schema](#7-database-schema)
8. [Implementation Phases](#8-implementation-phases)
9. [Technical Considerations](#9-technical-considerations)

---

## 1. Current Architecture Analysis

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SALEX PLATFORM                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Merchant App   │    │   Express API   │    │   Supabase PostgreSQL   │  │
│  │  (React Native) │◄──►│   (Node.js)     │◄──►│   + Prisma ORM          │  │
│  │  Expo ~53.0.20  │    │   Express 4.x   │    │   + RLS Policies        │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│                                │                                            │
│  ┌─────────────────┐           │                                            │
│  │ Admin Dashboard │           │                                            │
│  │  (React + Vite) │◄──────────┤                                            │
│  │  Tailwind CSS   │           │                                            │
│  └─────────────────┘           │                                            │
│                                ▼                                            │
│                    ┌─────────────────────┐                                  │
│                    │   WhatsApp Cloud    │                                  │
│                    │   API (Meta)        │                                  │
│                    │   [Centralized #]   │                                  │
│                    └─────────────────────┘                                  │
│                                │                                            │
│                                ▼                                            │
│                    ┌─────────────────────┐                                  │
│                    │     Customers       │                                  │
│                    │   (via WhatsApp)    │                                  │
│                    └─────────────────────┘                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```


### 1.2 Monorepo Structure

```
salex/
├── apps/
│   ├── MerchantAppExpo/           # React Native merchant app (Expo)
│   ├── api/                       # Express.js backend API
│   └── admin-dashboard/           # React web admin panel
│
├── packages/
│   ├── shared-types/              # Prisma client + TypeScript types
│   ├── eslint-config-custom/      # Shared ESLint config
│   └── typescript-config/         # Shared TypeScript config
│
├── docs/                          # Documentation
├── approach/                      # Architecture guides
├── curl-test/                     # API testing scripts
└── WhatsappMockUI/               # WhatsApp simulator
```

### 1.3 Current Database Schema

**Core Models:**
- `User` - Merchant/salon owner (OTP authenticated)
- `Business` - Business entity with routing code, category, subscription
- `Service` - Services offered with pricing and duration
- `Customer` - WhatsApp customers (no app needed)
- `Booking` - Appointments with multi-service support
- `Resource` - Physical assets (chairs, beds, rooms)
- `Staff` - Staff members who perform services
- `ResourceStaffLink` - Staff-resource associations
- `Subscription` - Business subscription (plan, status, billing)
- `BusinessModuleConfig` - Feature module toggles per business
- `AdminUser` - Admin dashboard users
- `AuditLog` - Admin action audit trail
- `PaymentRecord` - Manual payment tracking

**WhatsApp Models:**
- `WhatsAppConversation` - Conversation state machine
- `WhatsAppMessage` - Message audit trail
- `CustomerSession` - Simulator sessions
- `SimulatorMessage` - Dev tool messages

### 1.4 Current Capabilities

| Feature | Status | Notes |
|---------|--------|-------|
| Merchant Authentication | ✅ Done | Phone OTP + Supabase JWT |
| Business Onboarding | ✅ Done | 10-step wizard with resource/staff setup |
| Service Management | ✅ Done | CRUD with pricing |
| Resource Management | ✅ Done | Chairs/stations with utilization tracking |
| Staff Management | ✅ Done | Staff with resource linking |
| Walk-in Bookings | ✅ Done | Manual booking via merchant app |
| WhatsApp Booking | 🔄 In Progress | Centralized number routing |
| Admin Dashboard | ✅ Done | Business management, payments, templates |
| Subscription Model | ✅ Done | BASIC/PRO/CUSTOM plans |
| Category-Based UI | ✅ Done | Dynamic terminology per business type |
| Feature Access Control | ✅ Done | Plan + module based gating |
| Analytics | 🔄 Basic | Platform stats in admin dashboard |

---

## 2. Admin Dashboard Requirements

### 2.1 Purpose

The Admin Dashboard is a web-based control panel for Salex operators to:
- Monitor all businesses on the platform
- Toggle business status based on payment
- Access developer tools and system health
- Manage subscription plans and features
- Configure niche templates

### 2.2 Admin Dashboard Tech Stack

| Component | Technology | Location |
|-----------|------------|----------|
| Frontend | React 18 + Vite | `apps/admin-dashboard/` |
| UI Library | Tailwind CSS | Custom components |
| State | Zustand | `src/store/` |
| API Client | Axios | `src/services/apiClient.ts` |
| Routing | React Router v6 | `src/App.tsx` |


### 2.3 Admin Dashboard Pages

| Page | Route | Purpose |
|------|-------|---------|
| Login | `/login` | Admin authentication |
| Dashboard | `/` | Platform overview, stats |
| Businesses | `/businesses` | List/manage all businesses |
| Business Detail | `/businesses/:id` | Individual business management |
| Payments | `/payments` | Payment tracking |
| Templates | `/templates` | Niche template management |
| Analytics | `/analytics` | Platform-wide analytics |
| System Health | `/system-health` | API/DB health monitoring |
| Audit Log | `/audit-log` | Admin action history |

### 2.4 Admin API Endpoints

```
AUTHENTICATION
POST   /v1/admin/auth/login           # Admin login (email/password)
GET    /v1/admin/auth/me              # Get current admin user

BUSINESS MANAGEMENT
GET    /v1/admin/businesses           # List all businesses (paginated)
GET    /v1/admin/businesses/:id       # Get business details
POST   /v1/admin/businesses/:id/toggle # Toggle business active status
PATCH  /v1/admin/businesses/:id/plan  # Change subscription plan

MODULE MANAGEMENT
GET    /v1/admin/businesses/:id/modules    # Get business modules
PATCH  /v1/admin/businesses/:id/modules    # Update module configs

PAYMENT TRACKING
GET    /v1/admin/payments             # List all payments
POST   /v1/admin/payments             # Record manual payment

TEMPLATE MANAGEMENT
GET    /v1/admin/templates            # List niche templates
POST   /v1/admin/templates            # Create template
PATCH  /v1/admin/templates/:id        # Update template
DELETE /v1/admin/templates/:id        # Delete template

SYSTEM HEALTH
GET    /v1/admin/health/stats         # Platform statistics
GET    /v1/admin/health/system        # System health check

AUDIT LOG
GET    /v1/admin/audit-logs           # List audit logs

DATA EXPORT
GET    /v1/admin/export/businesses    # Export business data
GET    /v1/admin/export/bookings      # Export booking data
```

### 2.5 Business Status Toggle Logic

```typescript
// When business is toggled OFF (isActive = false):
// 1. Set isActive = false in database
// 2. WhatsApp routing returns "Business temporarily unavailable"
// 3. Merchant app shows AccountSuspendedScreen
// 4. All booking operations blocked (frontend + backend validation)
// 5. Existing bookings remain (not cancelled)

// When business is toggled ON (isActive = true):
// 1. Set isActive = true in database
// 2. WhatsApp routing resumes normal flow
// 3. Merchant app functions normally
// 4. New bookings allowed
```

---

## 3. Subscription Model Design

### 3.1 Plan Tiers

#### Basic Plan - ₹500/month
**Target**: Small salons who want digital management without customer-facing booking

| Feature | Included |
|---------|----------|
| Walk-in Booking Management | ✅ |
| Service Catalog | ✅ |
| Resource Management | ✅ |
| Staff Management | ✅ |
| Basic Analytics | ✅ |
| WhatsApp Customer Booking | ❌ |
| Own WhatsApp Number | ❌ |
| Website Integration | ❌ |

#### Pro Plan - ₹1,500/month
**Target**: Growing salons who want customer self-service booking

| Feature | Included |
|---------|----------|
| All Basic Features | ✅ |
| WhatsApp Customer Booking | ✅ (via Salex number) |
| Advanced Analytics | ✅ |
| Customer History | ✅ |
| Automated Reminders | ✅ |
| Own WhatsApp Number | ❌ |
| Website Integration | ❌ |

#### Custom Plan - ₹3,000+/month
**Target**: Established businesses wanting full branding control

| Feature | Included |
|---------|----------|
| All Pro Features | ✅ |
| Own WhatsApp Business Number | ✅ |
| Website Booking Widget | ✅ |
| Custom Branding | ✅ |
| Priority Support | ✅ |
| API Access | ✅ |


### 3.2 Feature Access Matrix

```
┌─────────────────────────────────┬─────────┬─────────┬─────────┐
│ Feature                         │ Basic   │ Pro     │ Custom  │
├─────────────────────────────────┼─────────┼─────────┼─────────┤
│ Merchant App Access             │ ✅      │ ✅      │ ✅      │
│ Walk-in Booking                 │ ✅      │ ✅      │ ✅      │
│ Service Management              │ ✅      │ ✅      │ ✅      │
│ Resource Management             │ ✅      │ ✅      │ ✅      │
│ Staff Management                │ ✅      │ ✅      │ ✅      │
│ Basic Analytics                 │ ✅      │ ✅      │ ✅      │
├─────────────────────────────────┼─────────┼─────────┼─────────┤
│ WhatsApp Booking (Centralized)  │ ❌      │ ✅      │ ✅      │
│ Customer History                │ ❌      │ ✅      │ ✅      │
│ Automated Reminders             │ ❌      │ ✅      │ ✅      │
│ Advanced Analytics              │ ❌      │ ✅      │ ✅      │
├─────────────────────────────────┼─────────┼─────────┼─────────┤
│ Own WhatsApp Number             │ ❌      │ ❌      │ ✅      │
│ Website Booking Widget          │ ❌      │ ❌      │ ✅      │
│ Custom Branding                 │ ❌      │ ❌      │ ✅      │
│ API Access                      │ ❌      │ ❌      │ ✅      │
│ Priority Support                │ ❌      │ ❌      │ ✅      │
└─────────────────────────────────┴─────────┴─────────┴─────────┘
```

### 3.3 Plan Enforcement Implementation

**Location:** `apps/api/src/services/feature-access.service.ts`

```typescript
const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  BASIC: [
    'walk_in_booking',
    'service_management',
    'resource_management',
    'staff_management',
    'basic_analytics',
  ],
  PRO: [
    // All BASIC features plus:
    'whatsapp_booking',
    'customer_history',
    'automated_reminders',
    'advanced_analytics',
  ],
  CUSTOM: [
    // All PRO features plus:
    'own_whatsapp_number',
    'website_widget',
    'custom_branding',
    'api_access',
  ],
};

// Feature check flow:
// 1. Check business.isActive (admin toggle)
// 2. Check subscription.status (TRIAL/ACTIVE/GRACE/EXPIRED)
// 3. Check plan includes feature
// 4. Check BusinessModuleConfig.isEnabled (per-business toggle)
```

### 3.4 Subscription State Machine

```
┌─────────────┐     Payment      ┌─────────────┐
│   TRIAL     │ ───────────────► │   ACTIVE    │
│  (7 days)   │                  │             │
└─────────────┘                  └─────────────┘
      │                                │
      │ No payment                     │ Payment due
      ▼                                ▼
┌─────────────┐                  ┌─────────────┐
│  EXPIRED    │ ◄─────────────── │   GRACE     │
│             │   No payment     │  (7 days)   │
└─────────────┘   within grace   └─────────────┘
      │                                │
      │ Payment                        │ Payment
      ▼                                ▼
┌─────────────┐                  ┌─────────────┐
│   ACTIVE    │ ◄─────────────── │   ACTIVE    │
└─────────────┘                  └─────────────┘
```

---

## 4. WhatsApp Integration Architecture

### 4.1 Centralized Number Architecture (Current)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CENTRALIZED WHATSAPP ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Customer                    Salex Platform                    Business     │
│  ┌─────────┐                ┌─────────────┐                  ┌─────────┐   │
│  │ WhatsApp│ ──message──►   │ Salex       │                  │ Salon A │   │
│  │ User    │                │ WhatsApp #  │                  │ Code:ABC│   │
│  └─────────┘                │ +91-XXX-XXX │                  └─────────┘   │
│                             └──────┬──────┘                  ┌─────────┐   │
│                                    │                         │ Salon B │   │
│                                    │ Routing                 │ Code:XYZ│   │
│                                    ▼                         └─────────┘   │
│                             ┌─────────────┐                                │
│                             │ Express API │                                │
│                             │ Webhook     │                                │
│                             └─────────────┘                                │
│                                                                             │
│  Flow:                                                                      │
│  1. Customer messages Salex number                                          │
│  2. Customer provides routing code (ABC)                                    │
│  3. System routes to correct business                                       │
│  4. Booking flow continues with that business                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```


### 4.2 WhatsApp Routing Decision Tree

```
Customer sends message to Salex WhatsApp
                │
                ▼
        ┌───────────────┐
        │ Has routing   │
        │ code in msg?  │
        └───────┬───────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
       YES              NO
        │               │
        ▼               ▼
┌───────────────┐ ┌───────────────┐
│ Find business │ │ Check if      │
│ by code       │ │ returning     │
└───────┬───────┘ │ customer      │
        │         └───────┬───────┘
        ▼                 │
┌───────────────┐         │
│ Business      │    ┌────┴────┐
│ found?        │    │         │
└───────┬───────┘    ▼         ▼
        │           YES        NO
   ┌────┴────┐       │         │
   │         │       ▼         ▼
   ▼         ▼  ┌─────────┐ ┌─────────┐
  YES        NO │ Resume  │ │ "Please │
   │         │  │ convo   │ │ enter   │
   │         │  └─────────┘ │ code"   │
   │         ▼              └─────────┘
   │    ┌─────────┐
   │    │ "Code   │
   │    │ invalid"│
   │    └─────────┘
   ▼
┌───────────────┐
│ Business      │
│ isActive?     │
└───────┬───────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
  YES        NO
   │         │
   ▼         ▼
┌─────────┐ ┌─────────────────┐
│ Check   │ │ "Business       │
│ plan    │ │ temporarily     │
│ access  │ │ unavailable"    │
└────┬────┘ └─────────────────┘
     │
     ▼
┌───────────────┐
│ Has WhatsApp  │
│ booking?      │
└───────┬───────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
  YES        NO
   │         │
   ▼         ▼
┌─────────┐ ┌─────────────────┐
│ Start   │ │ "Please call    │
│ booking │ │ business at     │
│ flow    │ │ +91-XXX-XXX"    │
└─────────┘ └─────────────────┘
```

---

## 5. Multi-Niche Scaling Strategy

### 5.1 Business Categories

```typescript
enum BusinessCategory {
  SALON
  BEAUTY_PARLOR
  SPA
  CLINIC
  FITNESS
  OTHER
}
```

### 5.2 Category Configuration System

**Location:** `apps/MerchantAppExpo/src/categories/`

```
categories/
├── index.ts                    # Main exports
├── setup.ts                    # Category system initialization
├── core/
│   ├── context/
│   │   ├── CategoryContext.tsx # React Context Provider
│   │   └── CategoryHooks.ts    # useTerm, useModule hooks
│   ├── components/
│   │   ├── SmartText.tsx       # Auto-translates terminology
│   │   ├── SmartButton.tsx     # Category-aware buttons
│   │   └── ConditionalFeature.tsx # Module-gated components
│   └── types/
│       ├── CategoryTypes.ts    # Core type definitions
│       └── TemplateTypes.ts    # Template structure types
├── registry/
│   ├── CategoryRegistry.ts     # Category registration
│   ├── CategoryFactory.ts      # Instance creation
│   ├── TemplateLoader.ts       # Template loading & caching
│   └── index.ts
└── templates/
    ├── index.ts
    ├── salon.template.ts       # Salon configuration
    ├── clinic.template.ts      # Clinic configuration
    ├── spa.template.ts         # Spa configuration
    ├── fitness.template.ts     # Fitness configuration
    └── beauty-parlor.template.ts
```

### 5.3 Category Terminology Mapping

| Category | Customer | Staff | Resource | Appointment |
|----------|----------|-------|----------|-------------|
| SALON | client | stylist | station/chair | appointment |
| BEAUTY_PARLOR | client | beautician | station | appointment |
| SPA | guest | therapist | room | session |
| CLINIC | patient | practitioner | room | consultation |
| FITNESS | member | trainer | studio | session |
| OTHER | customer | staff | resource | booking |

### 5.4 Template Structure

```typescript
// Example: salon.template.ts
export const salonTemplate: NicheTemplate = {
  id: 'salon-template-v1',
  code: BusinessCategory.SALON,
  displayName: 'Hair Salon',
  icon: '💄',
  
  terminology: {
    customer: { singular: 'client', plural: 'clients' },
    staff: { singular: 'stylist', plural: 'stylists' },
    resource: { singular: 'station', plural: 'stations' },
    appointment: { singular: 'appointment', plural: 'appointments' },
  },
  
  modules: [
    { code: 'hair-services', name: 'Hair Services', enabledByDefault: true },
    { code: 'color-services', name: 'Color Services', enabledByDefault: true },
  ],
  
  services: [
    { name: 'Haircut & Style', basePrice: 800, duration: 60 },
    { name: 'Hair Coloring', basePrice: 2000, duration: 120 },
  ],
  
  customizations: {
    ui: {
      theme: {
        colors: { primary: '#E91E63', secondary: '#F8BBD9' },
      },
    },
  },
};
```


---

## 6. Payment Strategy

### 6.1 Phase 1: Manual Collection (Current)

**Approach**: No payment integration - manual GPay/UPI collection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MANUAL PAYMENT COLLECTION FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Merchant signs up → 7-day free trial                                    │
│                                                                             │
│  2. Trial ends → Admin sends WhatsApp message:                              │
│     "Your Salex trial has ended. To continue using the platform,            │
│      please pay ₹500 to our GPay: +91-XXXX-XXXX"                           │
│                                                                             │
│  3. Merchant pays via GPay/UPI                                              │
│                                                                             │
│  4. Admin manually verifies payment                                         │
│                                                                             │
│  5. Admin updates subscription in Admin Dashboard:                          │
│     - Sets plan to BASIC/PRO/CUSTOM                                         │
│     - Sets nextBillingDate to +30 days                                      │
│     - Sets status to ACTIVE                                                 │
│                                                                             │
│  6. Merchant receives confirmation                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why Manual First?**
- Faster to market (no payment gateway integration)
- Lower transaction fees (GPay is free)
- Personal touch with early customers
- Validate business model before investing in automation

### 6.2 Admin Payment Recording

**Location:** `apps/admin-dashboard/src/pages/PaymentsPage.tsx`

Admin can record payments with:
- Business selection
- Amount
- Payment method (GPay/UPI/Bank Transfer)
- Transaction reference
- Period (start/end dates)
- Notes

### 6.3 Phase 2: Automated Payments (Future)

**When to Implement**: After 50+ paying customers

**Options:**
1. **Razorpay Subscriptions** - Most popular in India
2. **Stripe** - Better for international expansion
3. **PhonePe Business** - UPI-native solution

---

## 7. Database Schema

### 7.1 Core Models

**Location:** `packages/shared-types/prisma/schema.prisma`

```prisma
// Business with subscription and category
model Business {
  id                    String           @id @default(cuid())
  ownerId               String
  name                  String
  phoneNumber           String
  routingCode           String?          @unique @db.VarChar(4)
  category              BusinessCategory @default(SALON)
  hoursOfOperation      Json?
  maxConcurrentBookings Int              @default(1)
  isAcceptingOrders     Boolean          @default(true)
  isActive              Boolean          @default(true)  // Admin toggle
  onboardingCompleted   Boolean          @default(false)
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  owner         User                   @relation(fields: [ownerId], references: [id])
  subscription  Subscription?
  moduleConfigs BusinessModuleConfig[]
  services      Service[]
  bookings      Booking[]
  resources     Resource[]
  staff         Staff[]
}

// Subscription tracking
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
}

// Module configuration per business
model BusinessModuleConfig {
  id         String   @id @default(cuid())
  businessId String
  moduleCode String
  isEnabled  Boolean  @default(true)
  settings   Json?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id])
  
  @@unique([businessId, moduleCode])
}

// Admin users
model AdminUser {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String    // Hashed
  name      String
  role      AdminRole @default(SUPPORT)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

// Audit logging
model AuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String
  entityType String
  entityId   String
  changes    Json?
  ipAddress  String?
  createdAt  DateTime @default(now())
}

// Enums
enum BusinessCategory {
  SALON
  BEAUTY_PARLOR
  SPA
  CLINIC
  FITNESS
  OTHER
}

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

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  SUPPORT
}
```


---

## 8. Implementation Phases

### 8.1 Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION ROADMAP                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1: Foundation ✅ COMPLETE                                            │
│  ├── Business isActive toggle                                               │
│  ├── Subscription model (database)                                          │
│  ├── Basic Admin Dashboard (React web)                                      │
│  └── Manual payment tracking                                                │
│                                                                             │
│  Phase 2: Plan Enforcement ✅ COMPLETE                                      │
│  ├── Feature flag system                                                    │
│  ├── Plan-based access control                                              │
│  ├── WhatsApp routing with plan check                                       │
│  └── Merchant app plan display                                              │
│                                                                             │
│  Phase 3: Multi-Niche ✅ COMPLETE                                           │
│  ├── Business category selection                                            │
│  ├── Dynamic terminology in app                                             │
│  ├── Category-specific service templates                                    │
│  └── WhatsApp message customization                                         │
│                                                                             │
│  Phase 4: Advanced Features (PLANNED)                                       │
│  ├── Own WhatsApp number (Custom plan)                                      │
│  ├── Website booking widget                                                 │
│  ├── Advanced analytics                                                     │
│  └── Automated payment integration                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Merchant App | ✅ Running | All screens functional |
| Backend API | ✅ Running | Express.js with all endpoints |
| Admin Dashboard | ✅ Running | Business/payment management |
| Category System | ✅ Complete | 6 business types supported |
| Subscription System | ✅ Complete | BASIC/PRO/CUSTOM plans |
| Feature Access | ✅ Complete | Plan + module gating |
| WhatsApp Integration | 🔄 In Progress | Simulator working |

---

## 9. Technical Considerations

### 9.1 Security

#### Merchant Authentication
```typescript
// Phone OTP + Supabase JWT
// Location: apps/api/src/services/auth.service.ts

// Flow:
// 1. Send OTP via Twilio
// 2. Verify OTP
// 3. Create/find user in database
// 4. Mint JWT signed with Supabase secret
// 5. Return token to merchant app
```

#### Admin Authentication
```typescript
// Email/Password with bcrypt
// Location: apps/api/src/controllers/admin-auth.controller.ts

// Flow:
// 1. Verify email/password
// 2. Check AdminUser.isActive
// 3. Generate JWT with admin role
// 4. Return token to admin dashboard
```

#### Middleware Stack
```typescript
// Merchant routes: auth.middleware.ts
// - Validates JWT from Authorization header
// - Extracts user context
// - Attaches to req.user

// Admin routes: admin-auth.middleware.ts
// - Validates admin JWT
// - Checks admin role permissions
// - Attaches to req.admin
```

### 9.2 Performance

#### Database Connection Pooling
```
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=10"
```

#### Caching Strategy (Future)
- Redis for session data
- In-memory cache for category templates
- CDN for static assets

### 9.3 Monitoring

#### Key Metrics
- Total businesses (active/inactive)
- Subscription distribution (TRIAL/ACTIVE/EXPIRED)
- Daily bookings
- WhatsApp message volume
- API response times

#### Health Endpoints
```
GET /v1/health              # Basic health check
GET /v1/admin/health/stats  # Platform statistics
GET /v1/admin/health/system # System health (DB, external APIs)
```

### 9.4 Scalability Path

```
Phase 1 (0-100 businesses): Single server, Supabase free tier
Phase 2 (100-500 businesses): PM2 cluster, Supabase Pro
Phase 3 (500-2000 businesses): Load balancer, Redis cache
Phase 4 (2000+ businesses): Kubernetes, microservices
```

---

## 10. File Reference Index

### 10.1 Merchant App Key Files

```
apps/MerchantAppExpo/
├── App.tsx                           # Entry point
├── src/
│   ├── config/index.ts               # API URL, environment config
│   ├── services/
│   │   ├── apiClient.ts              # Axios client with JWT
│   │   ├── authService.ts            # OTP authentication
│   │   ├── bookingService.ts         # Booking operations
│   │   ├── businessService.ts        # Business CRUD
│   │   ├── staffService.ts           # Staff management
│   │   └── resourceService.ts        # Resource management
│   ├── store/
│   │   ├── authStore.ts              # Auth state + token
│   │   ├── businessStore.ts          # Business data
│   │   ├── bookingStore.ts           # Bookings list
│   │   ├── serviceStore.ts           # Services list
│   │   ├── staffStore.ts             # Staff list
│   │   └── resourceStore.ts          # Resources list
│   ├── screens/
│   │   ├── auth/                     # Login screens
│   │   ├── onboarding/               # Business setup wizard
│   │   ├── main/                     # Tab screens
│   │   └── AccountSuspendedScreen.tsx # Shown when isActive=false
│   ├── navigation/
│   │   ├── RootNavigator.tsx         # Auth flow routing
│   │   ├── TabNavigator.tsx          # Main tabs + suspension check
│   │   └── OnboardingNavigator.tsx   # Onboarding flow
│   └── theme/config.ts               # Colors, spacing, typography
```

### 10.2 Backend API Key Files

```
apps/api/
├── src/
│   ├── app.ts                        # Express app setup
│   ├── server.ts                     # Server entry point
│   ├── config/index.ts               # Environment config (Zod validated)
│   ├── controllers/
│   │   ├── auth.controller.ts        # OTP login
│   │   ├── business.controller.ts    # Business CRUD
│   │   ├── booking.controller.ts     # Booking operations
│   │   ├── admin-*.controller.ts     # Admin endpoints
│   │   └── simulator.controller.ts   # WhatsApp simulator
│   ├── services/
│   │   ├── auth.service.ts           # Authentication logic
│   │   ├── booking.service.ts        # Booking business logic
│   │   ├── feature-access.service.ts # Plan/module gating
│   │   ├── subscription.service.ts   # Subscription management
│   │   └── audit-log.service.ts      # Admin action logging
│   ├── middlewares/
│   │   ├── auth.middleware.ts        # Merchant JWT validation
│   │   ├── admin-auth.middleware.ts  # Admin JWT validation
│   │   └── error.middleware.ts       # Error handling
│   └── routes/                       # Route definitions
```

### 10.3 Admin Dashboard Key Files

```
apps/admin-dashboard/
├── src/
│   ├── App.tsx                       # Routes + Layout
│   ├── main.tsx                      # Entry point
│   ├── services/apiClient.ts         # Admin API client
│   ├── store/
│   │   ├── authStore.ts              # Admin auth state
│   │   └── businessStore.ts          # Business list state
│   ├── pages/
│   │   ├── LoginPage.tsx             # Admin login
│   │   ├── DashboardPage.tsx         # Platform overview
│   │   ├── BusinessesPage.tsx        # Business list
│   │   ├── BusinessDetailPage.tsx    # Individual business
│   │   ├── PaymentsPage.tsx          # Payment tracking
│   │   ├── TemplatesPage.tsx         # Niche templates
│   │   ├── SystemHealthPage.tsx      # System monitoring
│   │   └── AuditLogPage.tsx          # Admin actions log
│   └── components/                   # Reusable UI components
```

### 10.4 Shared Types

```
packages/shared-types/
├── src/
│   ├── index.ts                      # Main exports
│   ├── db.ts                         # Prisma client singleton
│   └── schemas/                      # Zod validation schemas
└── prisma/
    └── schema.prisma                 # Database schema
```

---

## Appendix

### A. Environment Variables

**Backend (`apps/api/.env`):**
```
DATABASE_URL=postgresql://...
SUPABASE_JWT_SECRET=your-jwt-secret
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

**Merchant App (`apps/MerchantAppExpo/.env`):**
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

**Admin Dashboard (`apps/admin-dashboard/.env`):**
```
VITE_API_URL=http://localhost:3000
```

### B. Common Commands

```bash
# Development
pnpm dev              # Start all services
pnpm dev:api          # Start backend only
pnpm dev:app          # Start merchant app only

# Database
cd packages/shared-types
pnpm db:push          # Push schema changes
pnpm db:generate      # Generate Prisma client
pnpm db:studio        # Open Prisma Studio

# Admin user creation
cd apps/api
npx ts-node scripts/create-admin.ts
```

---

**Document Version**: 2.0  
**Last Updated**: January 11, 2026  
**Status**: Current
