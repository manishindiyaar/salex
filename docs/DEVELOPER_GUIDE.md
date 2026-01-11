# Salex Platform - Developer Guide

> **Comprehensive Architecture & API Documentation**  
> Last Updated: January 11, 2026

This guide provides a complete technical breakdown of the Salex platform architecture, designed to onboard new developers quickly and give them full understanding of the system.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Directory Structure](#2-project-directory-structure)
3. [Tech Stack](#3-tech-stack)
4. [Database Architecture](#4-database-architecture)
5. [Core Database Schemas](#5-core-database-schemas)
6. [API Routes Reference](#6-api-routes-reference)
7. [Authentication](#7-authentication)
8. [Complete cURL Examples](#8-complete-curl-examples)
9. [User Flow & Story](#9-user-flow--story)
10. [Getting Started](#10-getting-started)

---

## 1. Project Overview

**Salex** is a multi-tenant service business management platform targeting salons, spas, clinics, and fitness centers in India. The platform enables:

- **Merchants** to manage bookings, services, staff, and resources via a mobile app
- **Customers** to book appointments via WhatsApp (no app required)
- **Admins** to manage businesses, subscriptions, and payments via a web dashboard

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SALEX PLATFORM                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Merchant App   │    │   Express API   │    │   Supabase PostgreSQL   │  │
│  │  (React Native) │◄──►│   (Node.js)     │◄──►│   + Prisma ORM          │  │
│  │  Expo ~53.0.20  │    │   Port 3000     │    │   + RLS Policies        │  │
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

---

## 2. Project Directory Structure

```
salex/
├── apps/
│   ├── MerchantAppExpo/           # React Native merchant mobile app
│   │   ├── src/
│   │   │   ├── components/        # Reusable UI components
│   │   │   ├── screens/           # App screens
│   │   │   ├── services/          # API client
│   │   │   ├── store/             # Zustand state management
│   │   │   └── categories/        # Multi-niche category system
│   │   └── App.tsx                # Main entry point
│   │
│   ├── api/                       # Express.js backend API
│   │   ├── src/
│   │   │   ├── controllers/       # Route handlers (18 files)
│   │   │   ├── routes/            # Route definitions (19 files)
│   │   │   ├── services/          # Business logic (21 files)
│   │   │   ├── middlewares/       # Auth & error handling
│   │   │   ├── utils/             # Helpers, logger, errors
│   │   │   ├── app.ts             # Express app setup
│   │   │   └── server.ts          # Server entry point
│   │   └── scripts/               # DB scripts, admin creation
│   │
│   └── admin-dashboard/           # React web admin panel
│       ├── src/
│       │   ├── components/        # UI components
│       │   ├── pages/             # Dashboard pages
│       │   ├── services/          # API client (axios)
│       │   └── store/             # Zustand state
│       └── index.html
│
├── packages/
│   ├── shared-types/              # Prisma client + TypeScript types
│   │   └── prisma/
│   │       └── schema.prisma      # Database schema (457 lines)
│   ├── eslint-config-custom/      # Shared ESLint configuration
│   └── typescript-config/         # Shared TypeScript configuration
│
├── docs/                          # Documentation
├── approach/                      # Architecture guides
├── curl-test/                     # API testing scripts
├── WhatsappMockUI/                # WhatsApp simulator for dev
├── package.json                   # Root package manager (pnpm)
├── turbo.json                     # Turborepo configuration
└── pnpm-workspace.yaml            # Workspace definition
```

---

## 3. Tech Stack

### Backend API (`apps/api/`)

| Technology | Purpose |
|------------|---------|
| **Node.js 20+** | Runtime environment |
| **Express.js 4.21** | Web framework for REST API |
| **Prisma ORM** | Database access and migrations |
| **PostgreSQL (Supabase)** | Cloud database with connection pooling |
| **JSON Web Tokens** | Authentication tokens |
| **Zod** | Request validation |
| **Twilio** | SMS OTP delivery |
| **Pino** | Structured logging |

### Merchant App (`apps/MerchantAppExpo/`)

| Technology | Purpose |
|------------|---------|
| **React Native 0.79.5** | Cross-platform mobile framework |
| **Expo SDK 53** | Development toolchain |
| **React Navigation 6** | Screen navigation |
| **Zustand** | State management |
| **React Native Paper** | Material Design components |


### Admin Dashboard (`apps/admin-dashboard/`)

| Technology | Purpose |
|------------|---------|
| **React 18** | Frontend framework |
| **Vite 5** | Build tool and dev server |
| **Tailwind CSS 3.4** | Utility-first styling |
| **React Router 6** | Client-side routing |
| **Zustand** | State management |
| **Axios** | HTTP client |
| **Lucide React** | Icon library |

### DevOps & Tooling

| Technology | Purpose |
|------------|---------|
| **Turborepo** | Monorepo build orchestration |
| **pnpm** | Package manager |
| **TypeScript 5.5** | Type safety across all apps |
| **ESLint** | Code linting |
| **Husky** | Git hooks |

---

## 4. Database Architecture

### Database: Supabase PostgreSQL

The platform uses **Supabase Cloud PostgreSQL** with:
- **Connection Pooler** (port 6543) for runtime queries
- **Direct Connection** (port 5432) for migrations
- **Row Level Security** (RLS) for multi-tenant isolation

### Entity Relationship Overview

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │   Business   │       │ Subscription │
│  (Merchant)  │──1:N──│   (Salon)    │──1:1──│   (Plan)     │
└──────────────┘       └──────────────┘       └──────────────┘
                              │
         ┌────────┬───────────┼───────────┬────────┐
         │        │           │           │        │
         ▼        ▼           ▼           ▼        ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Service │ │Resource │ │  Staff  │ │ Booking │ │Customer │
    │(Haircut)│ │ (Chair) │ │(Stylist)│ │(Appt)   │ │(WhatsApp│
    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## 5. Core Database Schemas

### Key Enums

```prisma
enum UserRole { OWNER, STAFF }
enum BookingStatus { PENDING, CONFIRMED, REJECTED, CANCELLED_BY_USER, CANCELLED_BY_SALON, COMPLETED }
enum SubscriptionPlan { BASIC, PRO, CUSTOM }
enum SubscriptionStatus { TRIAL, ACTIVE, GRACE, EXPIRED, CANCELLED }
enum BusinessCategory { SALON, BEAUTY_PARLOR, SPA, CLINIC, FITNESS, OTHER }
enum AdminRole { SUPER_ADMIN, ADMIN, SUPPORT }
```

### Core Models

#### User (Merchant)
```prisma
model User {
  id        String   @id @default(cuid())
  phone     String   @unique          // E.164 format: +919876543210
  role      UserRole @default(OWNER)
  businesses Business[]
}
```

#### Business
```prisma
model Business {
  id                    String           @id @default(cuid())
  ownerId               String
  name                  String           // "Glamour Salon"
  phoneNumber           String
  routingCode           String?          @unique @db.VarChar(4)  // "ABC1"
  category              BusinessCategory @default(SALON)
  hoursOfOperation      Json?            // { open: "09:00", close: "21:00" }
  maxConcurrentBookings Int              @default(1)
  isAcceptingOrders     Boolean          @default(true)
  isActive              Boolean          @default(true)   // Admin toggle
  onboardingCompleted   Boolean          @default(false)
  
  subscription  Subscription?
  moduleConfigs BusinessModuleConfig[]
  services      Service[]
  bookings      Booking[]
  resources     Resource[]
  staff         Staff[]
}
```

#### Subscription
```prisma
model Subscription {
  id                 String             @id @default(cuid())
  businessId         String             @unique
  plan               SubscriptionPlan   @default(BASIC)    // BASIC|PRO|CUSTOM
  status             SubscriptionStatus @default(TRIAL)    // TRIAL|ACTIVE|GRACE|EXPIRED
  trialEndsAt        DateTime?
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  
  payments PaymentRecord[]
}
```

#### Service
```prisma
model Service {
  id              String   @id @default(cuid())
  businessId      String
  name            String   @db.VarChar(100)   // "Haircut & Style"
  description     String?  @db.VarChar(500)
  price           Decimal  @db.Decimal(10, 2) // 800.00
  durationMinutes Int      @default(30)
  isActive        Boolean  @default(true)
}
```

#### Booking
```prisma
model Booking {
  id          String        @id @default(cuid())
  businessId  String
  customerId  String?
  resourceId  String?       // Assigned chair/room
  staffId     String?       // Assigned stylist
  status      BookingStatus @default(PENDING)
  scheduledAt DateTime      // Start time
  endAt       DateTime      // End time
  totalPrice  Decimal       @default(0)
  paymentMode PaymentMode?  // CASH|UPI|OTHER
  notes       String?
  source      String?       // "whatsapp"|"manual"|"walk-in"
  
  items BookingItem[]       // Multi-service support
}
```

#### Customer (WhatsApp User)
```prisma
model Customer {
  id          String   @id @default(cuid())
  phoneNumber String   @unique     // WhatsApp number
  name        String?
  isBlocked   Boolean  @default(false)
  
  bookings      Booking[]
  conversations WhatsAppConversation[]
}
```

---

## 6. API Routes Reference

**Base URL**: `http://localhost:3000`

### Authentication Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/otp/request` | Request OTP for phone | Public |
| POST | `/api/v1/auth/otp/verify` | Verify OTP, get JWT | Public |
| GET | `/api/v1/auth/me` | Get current user | Protected |
| POST | `/api/v1/auth/refresh` | Refresh JWT token | Protected |

### Business Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/businesses` | Create new business | Protected |
| GET | `/api/v1/businesses/me` | Get current user's business | Protected |
| PATCH | `/api/v1/businesses/:id` | Update business | Protected |
| GET | `/api/v1/businesses/routing/:code` | Lookup by routing code | Public |

### Service Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/businesses/:businessId/services` | Create service | Protected |
| GET | `/api/v1/businesses/:businessId/services` | List services | Protected |
| GET | `/api/v1/services/:id` | Get service by ID | Protected |
| PATCH | `/api/v1/services/:id` | Update service | Protected |
| DELETE | `/api/v1/services/:id` | Soft delete service | Protected |

### Resource Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/businesses/:businessId/resources` | Create resource | Protected |
| POST | `/api/v1/businesses/:businessId/resources/bulk` | Bulk create | Protected |
| GET | `/api/v1/businesses/:businessId/resources` | List resources | Protected |
| PATCH | `/api/v1/businesses/:businessId/resources/:id` | Update resource | Protected |
| POST | `/api/v1/businesses/:businessId/resources/:id/deactivate` | Deactivate | Protected |
| POST | `/api/v1/businesses/:businessId/resources/:id/reactivate` | Reactivate | Protected |

### Staff Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/businesses/:businessId/staff` | Create staff | Protected |
| GET | `/api/v1/businesses/:businessId/staff` | List staff | Protected |
| PATCH | `/api/v1/businesses/:businessId/staff/:id` | Update staff | Protected |
| POST | `/api/v1/businesses/:businessId/staff/:id/link-resource` | Link to resource | Protected |
| DELETE | `/api/v1/businesses/:businessId/staff/:id/link-resource/:resourceId` | Unlink | Protected |

### Booking Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/bookings` | Create booking | Protected |
| GET | `/api/v1/bookings?businessId=xxx` | List bookings | Protected |
| GET | `/api/v1/bookings/:id` | Get booking | Protected |
| PATCH | `/api/v1/bookings/:id/status` | Update status | Protected |
| POST | `/api/v1/bookings/:id/checkout` | Complete booking | Protected |
| PATCH | `/api/v1/bookings/:id/allocation` | Reassign resource/staff | Protected |
| POST | `/api/v1/bookings/check-availability` | Check slot availability | Protected |

### Admin Routes (Dashboard)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/admin/auth/login` | Admin login | Public |
| GET | `/api/v1/admin/auth/me` | Get admin user | Admin |
| GET | `/api/v1/admin/businesses` | List all businesses | Admin |
| GET | `/api/v1/admin/businesses/:id` | Business details | Admin |
| POST | `/api/v1/admin/businesses/:id/toggle` | Toggle active status | Admin |
| PATCH | `/api/v1/admin/businesses/:id/plan` | Change plan | Admin |
| GET | `/api/v1/admin/payments` | List payments | Admin |
| POST | `/api/v1/admin/payments` | Record payment | Admin |
| GET | `/api/v1/admin/health/stats` | Platform statistics | Admin |

---

## 7. Authentication

### Merchant Authentication (Phone OTP)

The merchant app uses a two-step phone OTP authentication flow:

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Merchant    │         │   API        │         │   Twilio     │
│  App         │         │   Server     │         │   SMS        │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │  POST /auth/otp/request│                        │
       │  { phone: "+91..." }   │                        │
       │───────────────────────►│                        │
       │                        │   Send OTP SMS         │
       │                        │───────────────────────►│
       │                        │                        │
       │   { success: true }    │                        │
       │◄───────────────────────│                        │
       │                        │                        │
       │  POST /auth/otp/verify │                        │
       │  { phone, code }       │                        │
       │───────────────────────►│                        │
       │                        │                        │
       │   { token: "eyJ..." }  │                        │
       │◄───────────────────────│                        │
       │                        │                        │
```

### JWT Token Structure

```json
{
  "sub": "user-cuid-here",
  "phone": "+919876543210",
  "role": "merchant",
  "iat": 1705000000,
  "exp": 1705086400
}
```

### Protected Route Header

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Admin Authentication

Admin users authenticate with email/password (bcrypt hashed) and receive a separate JWT with admin role claims.

---

## 8. Complete cURL Examples

### Authentication

```bash
# Request OTP
curl -X POST http://localhost:3000/api/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Verify OTP
curl -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "code": "123456"}'

# Get Current User
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Business Management

```bash
# Create Business
curl -X POST http://localhost:3000/api/v1/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Glamour Salon",
    "phoneNumber": "+919876543210",
    "category": "SALON"
  }'

# Get My Business
curl -X GET http://localhost:3000/api/v1/businesses/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Service Operations

```bash
# Create Service
curl -X POST http://localhost:3000/api/v1/businesses/BUSINESS_ID/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Haircut & Style",
    "price": 800,
    "durationMinutes": 60,
    "description": "Professional haircut with styling"
  }'

# List Services
curl -X GET http://localhost:3000/api/v1/businesses/BUSINESS_ID/services \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Resource Management

```bash
# Bulk Create Resources (Chairs)
curl -X POST http://localhost:3000/api/v1/businesses/BUSINESS_ID/resources/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"count": 5, "prefix": "Chair"}'
```

### Booking Operations

```bash
# Create Booking
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "businessId": "BUSINESS_ID",
    "serviceIds": ["SERVICE_ID"],
    "scheduledAt": "2026-01-12T14:00:00.000Z",
    "source": "manual"
  }'

# List Today's Bookings
curl -X GET "http://localhost:3000/api/v1/bookings?businessId=BUSINESS_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Admin Operations

```bash
# Admin Login
curl -X POST http://localhost:3000/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@salex.in", "password": "admin123"}'

# Toggle Business Status
curl -X POST http://localhost:3000/api/v1/admin/businesses/BUSINESS_ID/toggle \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false, "reason": "Payment overdue"}'
```

---

## 9. User Flow & Story

### User Story: Priya Opens a Salon

**Persona**: Priya Sharma, 32, salon owner in Pune, India

#### Day 1: Onboarding

1. Priya downloads the **Salex Merchant App** from Play Store
2. She enters her phone number `+919876543210` and receives an OTP
3. After verification, she creates her business profile:
   - Business Name: "Glamour Beauty Salon"
   - Category: SALON
   - Hours: 10 AM - 8 PM
4. The app generates her unique routing code: `GBS1`
5. She completes the 10-step onboarding wizard:
   - Adds 3 services (Haircut ₹500, Hair Color ₹2000, Facial ₹800)
   - Creates 4 chair resources (Chair 1-4)
   - Adds 2 staff members (Priya, Anita)
   - Links staff to their preferred chairs

#### Day 2-7: Trial Period (BASIC Plan)

6. Priya manages walk-in customers through the app
7. She can view bookings, assign chairs, and track daily revenue
8. At trial end, she receives a WhatsApp message to upgrade

#### Day 8: Upgrade to PRO Plan

9. Priya pays ₹999 via GPay
10. Salex admin verifies and activates her PRO plan
11. WhatsApp booking is now enabled

#### Ongoing: Customer Books via WhatsApp

```
Customer: Hi, I want to book an appointment
(Message to Salex WhatsApp number)

Bot: Welcome! Please enter your salon code
Customer: 3232

Bot: Welcome to Glamour Beauty Salon! 💇‍♀️
Please select a service:
[1] Haircut - ₹500 (30 min)
[2] Hair Color - ₹2000 (120 min)
[3] Facial - ₹800 (45 min)

Customer: 1

Bot: Great! Select a time slot for tomorrow:
[1] 10:00 AM - Chair 1 with Priya
[2] 10:30 AM - Chair 2 with Anita
[3] 11:00 AM - Chair 1 with Priya

Customer: 2

Bot: ✅ Booking Confirmed!
Haircut at Glamour Beauty Salon
📅 Tomorrow at 10:30 AM
💇 With Anita at Chair 2
💰 ₹500

You'll receive a reminder 1 hour before.
```

12. Priya sees the booking appear in her Merchant App instantly
13. She can confirm, reschedule, or cancel from the app
14. After the appointment, she marks it complete and records payment

### Complete System Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE SYSTEM WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MERCHANT JOURNEY                          CUSTOMER JOURNEY                  │
│  ──────────────────                        ─────────────────                 │
│                                                                              │
│  📱 Download App                           📱 Open WhatsApp                  │
│       ↓                                         ↓                            │
│  🔐 Phone OTP Login                        💬 Message Salex Number           │
│       ↓                                         ↓                            │
│  🏪 Create Business                        🔢 Enter Routing Code             │
│       ↓                                         ↓                            │
│  ✂️ Add Services                           📋 Select Service                 │
│       ↓                                         ↓                            │
│  🪑 Setup Resources                        📅 Choose Time Slot               │
│       ↓                                         ↓                            │
│  👥 Add Staff                              ✅ Booking Confirmed               │
│       ↓                                         ↓                            │
│  📅 View Bookings ◄────────────────────────── Notification                  │
│       ↓                                         ↓                            │
│  ✅ Complete & Checkout                    🏃 Arrive at Salon                │
│       ↓                                         ↓                            │
│  💰 Record Payment                         💇 Service Delivered              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Getting Started

### Prerequisites

- Node.js 20.11.0+
- pnpm 8.0.0+
- PostgreSQL (via Supabase)

### Installation

```bash
# Clone repository
git clone https://github.com/manishindiyaar/salex.git


# Install dependencies
pnpm install

# Setup environment variables
cp apps/api/.env.example apps/api/.env
# Edit .env with your Supabase and Twilio credentials

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Create admin user
cd apps/api && pnpm create-admin
```

### Running Development Servers

```bash


# Run only API
pnpm dev:api

# Run only Admin Dashboard
cd apps/admin-dashboard && npm run dev

# Run Merchant App (in separate terminal)
cd apps/MerchantAppExpo && npm start
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase connection pooler URL |
| `DIRECT_URL` | Supabase direct connection URL |
| `SUPABASE_JWT_SECRET` | JWT signing secret |
| `TWILIO_ACCOUNT_SID` | Twilio SMS service |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | SMS sender number |

---

## Summary

Salex is a production-ready, multi-tenant SaaS platform built with modern technologies. The monorepo architecture ensures code sharing and consistent tooling across all applications. The Express.js API provides a comprehensive REST interface for all platform operations, while the PostgreSQL database with Prisma ORM ensures type-safe data access. The WhatsApp integration enables customers to book appointments without downloading any app, making it accessible to all demographics in India.

**Key Strengths:**
- Type-safe full stack with TypeScript
- Multi-niche support (Salon, Spa, Clinic, Fitness)
- Subscription-based monetization
- WhatsApp-first customer experience
- Comprehensive admin controls

For questions, contact the development team or refer to the detailed architecture guide at `approach/SALEX_PLATFORM_ARCHITECTURE_AND_SCALING_GUIDE.md`.
