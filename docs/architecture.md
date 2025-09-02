# Salex Frontend-Backend Integration Architecture Document

## Introduction

This document outlines the complete full-stack architecture for **Salex Frontend-Backend Integration**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern full-stack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

**Existing Project - Brownfield Integration**

This is a mature brownfield project with established architecture:
- React Native frontend with complete UI/UX implementation
- NestJS backend with tested API endpoints and Firebase integration
- Monorepo structure with shared types package
- Firebase authentication system already configured
- Comprehensive data models and business logic

**Key Constraints:**
- Must maintain existing UI/UX without breaking changes
- All backend endpoints are tested and stable
- Firebase project and configuration already established
- React Native app structure and components already implemented

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-05 | 1.0 | Initial architecture for frontend-backend integration | Winston (Architect) |

## High Level Architecture

### Technical Summary

The Salex platform uses a modern mobile-first architecture with React Native frontend connected to a NestJS backend through RESTful APIs. The integration project will replace mock data services with real API calls, implement Firebase authentication persistence, and establish secure communication patterns. The backend leverages Firebase Admin SDK for authentication, Prisma ORM for database operations, and Redis for session management, while the frontend uses React Navigation, AsyncStorage for persistence, and centralized API client services.

### Platform and Infrastructure Choice

**Platform:** Existing Infrastructure (Mobile + Cloud)
**Key Services:** 
- Mobile: React Native with iOS/Android deployment
- Backend: NestJS on Node.js runtime
- Database: PostgreSQL with Prisma ORM
- Authentication: Firebase Authentication
- Caching: Redis/Upstash
- Storage: Local mobile storage + Supabase Database.

**Deployment Host and Regions:** To be determined (likely cloud platform for backend, app stores for mobile)

### Repository Structure

**Structure:** Monorepo (already established)
**Monorepo Tool:** npm/pnpm workspaces
**Package Organization:** 
- `apps/api/` - NestJS backend application
- `apps/MerchantApp/` - React Native frontend application
- `packages/shared-types/` - Shared TypeScript interfaces and types
- Additional packages for configuration and utilities

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Mobile App"
        RN[React Native App]
        AS[AsyncStorage]
        FC[Firebase Auth Client]
    end
    
    subgraph "API Layer"
        API[NestJS API Server]
        FA[Firebase Admin]
        AG[Auth Guards]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        REDIS[(Redis Cache)]
        PRISMA[Prisma ORM]
    end
    
    subgraph "External Services"
        FB[Firebase Auth]
        WA[WhatsApp API]
    end
    
    RN <--> API
    RN --> AS
    RN <--> FC
    FC <--> FB
    API --> FA
    FA <--> FB
    API --> AG
    API <--> PRISMA
    PRISMA <--> DB
    API <--> REDIS
    API <--> WA
    
    classDef mobile fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef external fill:#fff3e0
    
    class RN,AS,FC mobile
    class API,FA,AG api
    class DB,REDIS,PRISMA data  
    class FB,WA external
```

### Architectural Patterns

- **Mobile-First Architecture:** React Native providing cross-platform mobile experience with native performance - _Rationale:_ Primary user base consists of mobile-first business owners needing on-the-go access
- **RESTful API Design:** Standard HTTP methods with JSON payloads for frontend-backend communication - _Rationale:_ Simple, well-understood pattern that integrates easily with existing NestJS controllers
- **Repository Pattern:** Abstract data access through Prisma ORM and service layers - _Rationale:_ Provides clean separation between business logic and data persistence, enables testing
- **Token-Based Authentication:** Firebase JWT tokens for stateless authentication - _Rationale:_ Scalable, secure authentication that works across mobile and web platforms
- **Context Provider Pattern:** React Context for global state management in mobile app - _Rationale:_ Simple state management suitable for mobile app scope without complexity of Redux
- **Service Layer Pattern:** Centralized API client services on frontend - _Rationale:_ Encapsulates HTTP logic, provides consistent error handling and request/response patterns

## Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.0.4 | Type-safe mobile development | Prevents runtime errors, better IDE support |
| Frontend Framework | React Native | 0.80.2 | Cross-platform mobile app | Single codebase for iOS/Android, native performance |
| UI Component Library | React Native Paper | ^5.12.3 | Material Design components | Consistent UI/UX, accessibility support |
| State Management | React Context + AsyncStorage | Built-in | Global state and persistence | Simple, built-in solution adequate for mobile scope |
| Backend Language | TypeScript | ^5.5.4 | Type-safe server development | Shared types with frontend, better maintainability |
| Backend Framework | NestJS | ^10.3.10 | Enterprise Node.js framework | Decorator-based architecture, built-in dependency injection |
| API Style | REST | Built-in | HTTP-based API communication | Simple, widely supported, works well with mobile |
| Database | PostgreSQL | Latest | Primary data storage | ACID compliance, excellent Prisma support |
| Cache | Redis/Upstash | ^1.35.3 | Session and data caching | High-performance caching for mobile responsiveness |
| File Storage | Local/AsyncStorage | Built-in | Mobile data persistence | Built-in React Native storage solution |
| Authentication | Firebase Auth | ^22.4.0 | Phone number authentication | SMS-based auth ideal for business users |
| Frontend Testing | Jest | ^29.6.3 | Unit and integration testing | Standard React Native testing framework |
| Backend Testing | Jest + Supertest | ^29.5.0 | API endpoint testing | Comprehensive testing for NestJS applications |
| E2E Testing | TBD | TBD | End-to-end workflow testing | To be implemented post-integration |
| Build Tool | React Native CLI | 19.1.1 | Mobile app building | Standard React Native build toolchain |
| Bundler | Metro | ^0.80.2 | JavaScript bundling for RN | React Native's default bundler |
| IaC Tool | TBD | TBD | Infrastructure as code | To be determined based on deployment platform |
| CI/CD | TBD | TBD | Continuous integration | To be implemented for production deployment |
| Monitoring | TBD | TBD | Application monitoring | To be implemented for production monitoring |
| Logging | Console/TBD | Built-in | Application logging | Basic logging, to be enhanced for production |
| CSS Framework | StyleSheet API | Built-in | React Native styling | Built-in styling system for mobile apps |

## Data Models

Based on the comprehensive shared types package, the core data models are already well-defined:

### User
**Purpose:** Represents authenticated business owners and system users

**Key Attributes:**
- id: string - Unique user identifier
- firebaseUid: string - Firebase authentication identifier  
- phoneNumber: string - Primary contact and login method
- createdAt: Date - Account creation timestamp
- updatedAt: Date - Last modification timestamp

```typescript
interface User {
  id: string;
  firebaseUid: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- One-to-Many with Business (user owns businesses)

### Business
**Purpose:** Core entity representing merchant businesses using the platform

**Key Attributes:**
- id: string - Unique business identifier
- ownerId: string - Reference to owning user
- name: string - Business display name
- businessType: BusinessType - Categorization (SALON, etc.)
- phoneNumber: string - Business contact number
- address: string - Physical location
- routingCode: string - 4-digit customer discovery code
- hoursOfOperation: BusinessHours - Operating schedule

```typescript
interface Business {
  id: string;
  ownerId: string;
  name: string;
  businessType: BusinessType;
  phoneNumber: string;
  address: string;
  hoursOfOperation?: BusinessHours;
  routingCode?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Many-to-One with User (business belongs to user)
- One-to-Many with Service (business offers services)
- One-to-Many with Booking (business receives bookings)

### Service
**Purpose:** Represents services offered by businesses (haircuts, treatments, etc.)

**Key Attributes:**
- id: string - Unique service identifier
- businessId: string - Reference to owning business
- name: string - Service name/description
- price: number - Service cost
- durationMinutes: number - Time required for service
- description: string - Optional detailed description

```typescript
interface Service {
  id: string;
  businessId: string;
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Many-to-One with Business (service belongs to business)
- One-to-Many with Booking (service can be booked)

### Booking
**Purpose:** Represents customer appointments and reservations

**Key Attributes:**
- id: string - Unique booking identifier
- businessId: string - Reference to business
- customerId: string - Reference to customer
- serviceId: string - Reference to booked service
- status: BookingStatus - Current booking state
- scheduledAt: Date - Appointment date/time
- notes: string - Optional booking notes

```typescript
interface Booking {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  status: BookingStatus;
  scheduledAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Many-to-One with Business (booking belongs to business)
- Many-to-One with Customer (booking belongs to customer)
- Many-to-One with Service (booking is for a service)

## API Specification

The API follows RESTful conventions with the existing NestJS endpoints:

```yaml
openapi: 3.0.0
info:
  title: Salex Business Management API
  version: 1.0.0
  description: Mobile-first business management platform API
servers:
  - url: http://localhost:3000/api/v1
    description: Development server

paths:
  # Authentication
  /auth/firebase/verify:
    post:
      summary: Verify Firebase ID token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                idToken:
                  type: string
      responses:
        200:
          description: Token verified successfully

  # Business Management
  /business:
    post:
      summary: Create new business
      security:
        - FirebaseAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateBusinessRequest'
    get:
      summary: Get user's businesses
      security:
        - FirebaseAuth: []

  /business/me:
    get:
      summary: Get current user's business profile
      security:
        - FirebaseAuth: []

  /business/{businessId}/services:
    get:
      summary: Get business services
      parameters:
        - name: businessId
          in: path
          required: true
          schema:
            type: string

  # Service Management
  /services:
    post:
      summary: Create new service
      security:
        - FirebaseAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateServiceRequest'

  # Booking Management
  /businesses/{businessId}/bookings:
    get:
      summary: Get business bookings
      security:
        - FirebaseAuth: []
      parameters:
        - name: businessId
          in: path
          required: true
          schema:
            type: string
    post:
      summary: Create new booking
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateBookingRequest'

  # Analytics
  /{businessId}/analytics/daily:
    get:
      summary: Get daily analytics
      security:
        - FirebaseAuth: []
      parameters:
        - name: businessId
          in: path
          required: true
          schema:
            type: string

components:
  securitySchemes:
    FirebaseAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    CreateBusinessRequest:
      type: object
      required: [name, businessType, phoneNumber, address]
      properties:
        name:
          type: string
        businessType:
          type: string
          enum: [SALON]
        phoneNumber:
          type: string
        address:
          type: string
    
    CreateServiceRequest:
      type: object
      required: [name, price, durationMinutes]
      properties:
        name:
          type: string
        price:
          type: number
        durationMinutes:
          type: number
        description:
          type: string
```

## Components

### Frontend Components

#### AuthService
**Responsibility:** Handles Firebase authentication, token management, and session persistence

**Key Interfaces:**
- `signInWithPhoneNumber(phoneNumber: string): Promise<ConfirmationResult>`
- `verifyOTP(confirmation: ConfirmationResult, otp: string): Promise<UserCredential>`
- `getCurrentUser(): User | null`
- `signOut(): Promise<void>`

**Dependencies:** Firebase Auth Client, AsyncStorage

**Technology Stack:** React Native Firebase, AsyncStorage for token persistence

#### APIClient  
**Responsibility:** Centralized HTTP client for all backend communication with auth headers and error handling

**Key Interfaces:**
- `get<T>(endpoint: string): Promise<ApiResponse<T>>`
- `post<T>(endpoint: string, data: any): Promise<ApiResponse<T>>`
- `put<T>(endpoint: string, data: any): Promise<ApiResponse<T>>`
- `delete<T>(endpoint: string): Promise<ApiResponse<T>>`

**Dependencies:** AuthService for tokens, shared-types for request/response types

**Technology Stack:** Axios with interceptors, TypeScript for type safety

#### BusinessService
**Responsibility:** Business-specific API operations including CRUD, hours management, and analytics

**Key Interfaces:**
- `createBusiness(data: CreateBusinessRequest): Promise<Business>`
- `getMyBusiness(): Promise<Business>`
- `updateBusinessHours(businessId: string, hours: BusinessHours): Promise<void>`
- `getDailyAnalytics(businessId: string): Promise<DailyAnalytics>`

**Dependencies:** APIClient, shared-types

**Technology Stack:** TypeScript service classes with error handling

#### ServiceManagementService
**Responsibility:** Service CRUD operations and business service management

**Key Interfaces:**
- `createService(data: CreateServiceRequest): Promise<Service>`
- `getBusinessServices(businessId?: string): Promise<BusinessServicesResponse>`
- `updateService(serviceId: string, data: UpdateServiceRequest): Promise<Service>`
- `deleteService(serviceId: string): Promise<void>`

**Dependencies:** APIClient, shared-types

**Technology Stack:** TypeScript service classes with optimistic updates

### Backend Components

#### FirebaseAuthGuard
**Responsibility:** Validates Firebase JWT tokens and protects API endpoints

**Key Interfaces:**
- `canActivate(context: ExecutionContext): Promise<boolean>`
- `validateUser(idToken: string): Promise<AuthTokenPayload>`

**Dependencies:** Firebase Admin SDK

**Technology Stack:** NestJS Guards, Firebase Admin for token verification

#### BusinessController & BusinessService
**Responsibility:** Business entity management, routing codes, and business operations

**Key Interfaces:**
- `createBusiness(@Body() data: CreateBusinessRequest): Promise<Business>`
- `getMyBusiness(@Request() req: AuthenticatedRequest): Promise<Business>`
- `updateBusinessHours(@Param('businessId') id: string, @Body() hours: BusinessHours): Promise<void>`

**Dependencies:** PrismaService, FirebaseAuthGuard, shared-types

**Technology Stack:** NestJS Controllers/Services, Prisma ORM, PostgreSQL

#### ServiceController & ServiceService  
**Responsibility:** Service management, pricing, and service-related operations

**Key Interfaces:**
- `createService(@Body() data: CreateServiceRequest): Promise<ServiceResponse>`
- `getBusinessServices(@Query() businessId: string): Promise<BusinessServicesResponse>`
- `updateService(@Param('serviceId') id: string, @Body() data: UpdateServiceRequest): Promise<ServiceResponse>`

**Dependencies:** PrismaService, FirebaseAuthGuard, shared-types

**Technology Stack:** NestJS Controllers/Services, Prisma ORM, PostgreSQL

#### BookingController & BookingService
**Responsibility:** Booking lifecycle management, scheduling, and customer interactions

**Key Interfaces:**
- `createBooking(@Body() data: CreateBookingRequest): Promise<BookingResponse>`
- `getBusinessBookings(@Param('businessId') id: string): Promise<BookingResponse[]>`
- `updateBookingStatus(@Param('bookingId') id: string, @Body() status: BookingStatus): Promise<BookingResponse>`

**Dependencies:** PrismaService, CustomerService, ServiceService, shared-types

**Technology Stack:** NestJS Controllers/Services, Prisma ORM, PostgreSQL

### Component Diagrams

```mermaid
graph TB
    subgraph "Frontend Services"
        AS[AuthService]
        AC[APIClient]
        BS[BusinessService]
        SS[ServiceService]
        BKS[BookingService]
    end
    
    subgraph "Backend Controllers"
        BC[BusinessController]
        SC[ServiceController]
        BKC[BookingController]
        AUTH[AuthController]
    end
    
    subgraph "Backend Services"
        BSV[BusinessService]
        SSV[ServiceService]
        BKSV[BookingService]
        PS[PrismaService]
    end
    
    subgraph "Guards & Middleware"
        FAG[FirebaseAuthGuard]
        FAD[FirebaseAdmin]
    end
    
    AS --> AC
    BS --> AC
    SS --> AC
    BKS --> AC
    
    AC --> BC
    AC --> SC
    AC --> BKC
    AC --> AUTH
    
    BC --> BSV
    SC --> SSV
    BKC --> BKSV
    
    BSV --> PS
    SSV --> PS
    BKSV --> PS
    
    BC --> FAG
    SC --> FAG  
    BKC --> FAG
    
    FAG --> FAD
    
    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef auth fill:#fff3e0
    
    class AS,AC,BS,SS,BKS frontend
    class BC,SC,BKC,AUTH,BSV,SSV,BKSV backend
    class PS data
    class FAG,FAD auth
```

## External APIs

### Firebase Authentication API
- **Purpose:** Phone number verification and JWT token generation
- **Documentation:** https://firebase.google.com/docs/auth/web/phone-auth
- **Base URL(s):** https://identitytoolkit.googleapis.com/v1/
- **Authentication:** Firebase project configuration and service account
- **Rate Limits:** Standard Firebase limits (10 requests per second per project)

**Key Endpoints Used:**
- `POST /accounts:sendVerificationCode` - Send SMS verification code
- `POST /accounts:signInWithPhoneNumber` - Verify code and authenticate

**Integration Notes:** Already configured in React Native app, backend uses Firebase Admin SDK for token verification

### WhatsApp Business Cloud API (Future Integration)
- **Purpose:** Customer communication and booking notifications via WhatsApp
- **Documentation:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Base URL(s):** https://graph.facebook.com/v18.0/
- **Authentication:** WhatsApp Business Account token
- **Rate Limits:** 1000 messages per 24 hours (varies by verification status)

**Key Endpoints Used:**
- `POST /{phone-number-id}/messages` - Send messages to customers
- `GET /{phone-number-id}` - Get phone number information

**Integration Notes:** Currently implemented as simulator, real integration planned for future phases

## Core Workflows

Key system workflows illustrated with sequence diagrams:

### User Authentication Flow
```mermaid
sequenceDiagram
    participant App as React Native App
    participant AS as AuthService  
    participant FC as Firebase Client
    participant FB as Firebase Auth
    participant API as NestJS API
    participant FA as Firebase Admin
    
    App->>AS: signInWithPhoneNumber(phone)
    AS->>FC: signInWithPhoneNumber(phone)
    FC->>FB: Send SMS verification
    FB-->>FC: Confirmation result
    FC-->>AS: ConfirmationResult
    AS-->>App: ConfirmationResult
    
    App->>AS: verifyOTP(confirmation, otp)
    AS->>FC: confirm(otp)
    FC->>FB: Verify OTP
    FB-->>FC: UserCredential + idToken
    FC-->>AS: UserCredential
    AS->>AS: Store token in AsyncStorage
    AS-->>App: Authentication success
    
    App->>API: API call with Bearer token
    API->>FA: Verify idToken
    FA->>FB: Validate token
    FB-->>FA: Token payload
    FA-->>API: Authenticated user
    API-->>App: Protected resource response
```

### Business Onboarding Flow
```mermaid
sequenceDiagram
    participant App as React Native App
    participant BS as BusinessService
    participant API as NestJS API
    participant BC as BusinessController
    participant BSV as BusinessService
    participant PS as PrismaService
    participant DB as PostgreSQL
    
    App->>BS: createBusiness(businessData)
    BS->>API: POST /api/v1/business
    API->>BC: createBusiness()
    BC->>BSV: create(businessData)
    BSV->>PS: business.create()
    PS->>DB: INSERT business
    DB-->>PS: Business record
    PS-->>BSV: Business entity
    BSV-->>BC: Business response
    BC-->>API: Business response
    API-->>BS: Business response
    BS-->>App: Business created
    
    Note over App: Update UI with real business data
    Note over App: Navigate to main app screens
```

### Service Management Flow
```mermaid
sequenceDiagram
    participant App as React Native App
    participant SS as ServiceService
    participant API as NestJS API
    participant SC as ServiceController
    participant SSV as ServiceService
    participant PS as PrismaService
    participant DB as PostgreSQL
    
    App->>SS: getBusinessServices()
    SS->>API: GET /api/v1/services
    API->>SC: getBusinessServices()
    SC->>SSV: findByBusinessId()
    SSV->>PS: service.findMany()
    PS->>DB: SELECT services
    DB-->>PS: Service records
    PS-->>SSV: Service entities
    SSV-->>SC: Services response
    SC-->>API: Services response
    API-->>SS: Services response
    SS-->>App: Display services
    
    App->>SS: createService(serviceData)
    SS->>API: POST /api/v1/services
    API->>SC: createService()
    SC->>SSV: create(serviceData)
    SSV->>PS: service.create()
    PS->>DB: INSERT service
    DB-->>PS: Service record
    PS-->>SSV: Service entity
    SSV-->>SC: Service response
    SC-->>API: Service response
    API-->>SS: Service response
    SS-->>App: Service created + UI update
```

## Database Schema

The database schema is managed through Prisma ORM with the following structure:

```sql
-- Users table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL UNIQUE,
    "phoneNumber" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Businesses table
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL DEFAULT 'SALON',
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "hoursOfOperation" JSONB,
    "routingCode" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Business_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Services table
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Customers table
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- Bookings table
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Booking_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Enums
CREATE TYPE "BusinessType" AS ENUM ('SALON');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON', 'COMPLETED');

-- Indexes for performance
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");
CREATE INDEX "Business_routingCode_idx" ON "Business"("routingCode");
CREATE INDEX "Service_businessId_idx" ON "Service"("businessId");
CREATE INDEX "Booking_businessId_idx" ON "Booking"("businessId");
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");
CREATE INDEX "Booking_scheduledAt_idx" ON "Booking"("scheduledAt");
```

## Frontend Architecture

### Component Architecture

#### Component Organization
```
src/
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── GradientView.tsx
│   ├── booking/                # Booking-specific components
│   │   └── BookingCard.tsx
│   └── index.ts                # Component exports
├── screens/                    # Screen components
│   ├── auth/                   # Authentication screens
│   ├── onboarding/            # Business setup screens
│   └── main/                  # Main app screens
├── navigation/                 # Navigation configuration
├── services/                   # API client services
├── context/                    # React Context providers
├── store/                      # State management
└── theme/                      # Styling and theme
```

#### Component Template
```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { businessService } from '../services/businessService';
import { Business } from 'shared-types';

interface BusinessProfileProps {
  businessId: string;
  onUpdate?: (business: Business) => void;
}

export const BusinessProfile: React.FC<BusinessProfileProps> = ({ 
  businessId, 
  onUpdate 
}) => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        setLoading(true);
        const result = await businessService.getBusiness(businessId);
        setBusiness(result);
        onUpdate?.(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load business');
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      loadBusiness();
    }
  }, [businessId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!business) return <EmptyState />;

  return (
    <View style={styles.container}>
      {/* Component implementation */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
```

### State Management Architecture

#### State Structure
```typescript
// Auth Context State
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Business Context State
interface BusinessState {
  currentBusiness: Business | null;
  services: Service[];
  bookings: Booking[];
  analytics: DailyAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

// Onboarding State (Zustand store)
interface OnboardingState {
  step: number;
  businessData: Partial<Business>;
  services: CreateServiceRequest[];
  businessHours: BusinessHours;
  isComplete: boolean;
}
```

#### State Management Patterns
- **Context API for Global State:** Authentication, current business, user preferences
- **Local Component State:** Form inputs, UI state, temporary data
- **AsyncStorage for Persistence:** Authentication tokens, user preferences, offline data
- **Zustand for Complex Flows:** Onboarding wizard state, multi-step forms

### Routing Architecture

#### Route Organization
```
Navigation Structure:
├── AuthNavigator
│   ├── WelcomeScreen
│   ├── PhoneAuthScreen
│   └── OtpVerificationScreen
├── OnboardingNavigator
│   ├── BusinessTypeScreen
│   ├── BusinessIdentityScreen
│   ├── ContactLocationScreen
│   ├── ServicesPricingScreen
│   ├── BusinessHoursScreen
│   └── ReviewCompleteScreen
└── MainTabNavigator
    ├── DashboardScreen
    ├── BookingsScreen
    ├── ServicesScreen
    └── ProfileScreen
```

#### Protected Route Pattern
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isOnboarded, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### Frontend Services Layer

#### API Client Setup
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from 'shared-types';

class APIClient {
  private client: AxiosInstance;
  private baseURL = __DEV__ ? 'http://localhost:3000/api/v1' : 'https://api.salex.app/api/v1';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('firebase_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to auth
          await AsyncStorage.removeItem('firebase_token');
          // Navigate to auth screen
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(endpoint, config);
    return response.data;
  }

  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(endpoint, data, config);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(endpoint, data, config);
    return response.data;
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(endpoint, config);
    return response.data;
  }
}

export const apiClient = new APIClient();
```

#### Service Example
```typescript
import { apiClient } from './apiClient';
import { 
  Business, 
  CreateBusinessRequest, 
  BusinessServicesResponse,
  DailyAnalytics,
  ApiResponse 
} from 'shared-types';

class BusinessService {
  async createBusiness(data: CreateBusinessRequest): Promise<Business> {
    const response = await apiClient.post<Business>('/business', data);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create business');
    }
    return response.data;
  }

  async getMyBusiness(): Promise<Business> {
    const response = await apiClient.get<Business>('/business/me');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get business');
    }
    return response.data;
  }

  async getBusinessServices(businessId?: string): Promise<BusinessServicesResponse> {
    const endpoint = businessId ? `/business/${businessId}/services` : '/services';
    const response = await apiClient.get<BusinessServicesResponse>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get services');
    }
    return response.data;
  }

  async getDailyAnalytics(businessId: string): Promise<DailyAnalytics> {
    const response = await apiClient.get<DailyAnalytics>(`/${businessId}/analytics/daily`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get analytics');
    }
    return response.data;
  }
}

export const businessService = new BusinessService();
```

## Backend Architecture

### Service Architecture

The backend uses traditional NestJS server architecture with the following organization:

#### Controller Organization
```
src/
├── modules/
│   ├── auth/                   # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── firebase-admin.service.ts
│   │   ├── firebase-auth.guard.ts
│   │   └── dto/
│   ├── business/               # Business management module
│   │   ├── business.controller.ts
│   │   ├── business.service.ts
│   │   ├── business.module.ts
│   │   └── dto/
│   ├── service/                # Service management module
│   │   ├── service.controller.ts
│   │   ├── service.service.ts
│   │   ├── service.module.ts
│   │   └── dto/
│   └── booking/                # Booking management module
│       ├── booking.controller.ts
│       ├── booking.service.ts
│       ├── booking.module.ts
│       └── dto/
├── core/                       # Core services
│   ├── prisma.service.ts
│   └── redis.service.ts
└── main.ts                     # Application bootstrap
```

#### Controller Template
```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request 
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { BusinessService } from './business.service';
import { 
  Business, 
  CreateBusinessRequest, 
  UpdateBusinessRequest,
  ApiResponse,
  AuthenticatedRequest 
} from 'shared-types';

@Controller('api/v1/business')
@UseGuards(FirebaseAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  async createBusiness(
    @Body() createBusinessDto: CreateBusinessRequest,
    @Request() req: AuthenticatedRequest
  ): Promise<ApiResponse<Business>> {
    try {
      const business = await this.businessService.create(createBusinessDto, req.user.uid);
      return {
        success: true,
        data: business,
        message: 'Business created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create business'
      };
    }
  }

  @Get('me')
  async getMyBusiness(
    @Request() req: AuthenticatedRequest
  ): Promise<ApiResponse<Business>> {
    try {
      const business = await this.businessService.findByOwnerId(req.user.uid);
      return {
        success: true,
        data: business,
        message: 'Business retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get business'
      };
    }
  }
}
```

### Database Architecture

#### Schema Design
The schema is already well-defined in Prisma with proper relationships and indexes.

#### Data Access Layer
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma.service';
import { Business, CreateBusinessRequest } from 'shared-types';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateBusinessRequest, ownerId: string): Promise<Business> {
    return this.prisma.business.create({
      data: {
        ...data,
        ownerId,
      },
      include: {
        owner: true,
        services: true,
      },
    });
  }

  async findByOwnerId(ownerId: string): Promise<Business | null> {
    return this.prisma.business.findFirst({
      where: { ownerId },
      include: {
        services: true,
      },
    });
  }

  async findById(id: string): Promise<Business | null> {
    return this.prisma.business.findUnique({
      where: { id },
      include: {
        services: true,
        bookings: {
          include: {
            customer: true,
            service: true,
          },
        },
      },
    });
  }

  async updateBusinessHours(businessId: string, hours: any): Promise<Business> {
    return this.prisma.business.update({
      where: { id: businessId },
      data: { hoursOfOperation: hours },
    });
  }
}
```

### Authentication and Authorization

#### Auth Flow
```mermaid
sequenceDiagram
    participant Client as React Native
    participant Guard as FirebaseAuthGuard
    participant Admin as FirebaseAdmin
    participant FB as Firebase Auth
    participant DB as Database
    
    Client->>Guard: API Request + Bearer Token
    Guard->>Admin: verifyIdToken(token)
    Admin->>FB: Validate token
    FB-->>Admin: Token payload
    Admin-->>Guard: Decoded token
    Guard->>DB: Find or create user
    DB-->>Guard: User record
    Guard-->>Client: Allow request with user context
```

#### Middleware/Guards
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { PrismaService } from '../core/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authorization token provided');
    }

    try {
      const decodedToken = await this.firebaseAdmin.verifyIdToken(token);
      
      // Find or create user in database
      let user = await this.prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid }
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            firebaseUid: decodedToken.uid,
            phoneNumber: decodedToken.phone_number || '',
          }
        });
      }

      request.user = {
        uid: decodedToken.uid,
        phoneNumber: decodedToken.phone_number,
        email: decodedToken.email,
        dbUser: user,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

## Unified Project Structure

The project already has an excellent monorepo structure:

```
salex/
├── .github/                    # CI/CD workflows (to be added)
├── apps/                       # Application packages
│   ├── MerchantApp/            # React Native frontend
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── screens/        # Screen components
│   │   │   ├── navigation/     # Navigation setup
│   │   │   ├── services/       # API client services (TO REPLACE MOCKS)
│   │   │   ├── context/        # React Context providers
│   │   │   ├── store/          # State management
│   │   │   └── theme/          # Styling and themes
│   │   ├── android/            # Android-specific code
│   │   ├── ios/                # iOS-specific code
│   │   └── package.json
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── modules/        # Feature modules
│       │   ├── core/           # Core services (Prisma, Redis)
│       │   └── main.ts         # App bootstrap
│       ├── prisma/             # Database schema
│       ├── test/               # Backend tests
│       └── package.json
├── packages/                   # Shared packages
│   ├── shared-types/           # TypeScript interfaces (COMPLETE)
│   │   ├── src/
│   │   │   ├── types/          # Type definitions  
│   │   │   └── index.ts        # Exports
│   │   └── package.json
│   ├── eslint-config-custom/   # Shared ESLint config
│   └── typescript-config/      # Shared TypeScript config
├── docs/                       # Documentation
│   ├── brief.md               # Project brief
│   ├── architecture.md        # This document
│   └── stories/               # User stories
├── curl-test/                  # API testing scripts
├── .env.example                # Environment template
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # Workspace configuration
└── turbo.json                  # Turborepo configuration
```

## Development Workflow

### Local Development Setup

#### Prerequisites
```bash
# Node.js and package manager
node --version  # >= 18
pnpm --version  # >= 8.0

# React Native development
npx react-native doctor

# Database
# PostgreSQL running locally or cloud instance
# Redis running locally or cloud instance
```

#### Initial Setup
```bash
# Clone repository and install dependencies
git clone https://github.com/manishindiyaar/salex.git 
cd salex
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
cd apps/api
pnpm db:push
pnpm db:generate

# Create test business data (optional)
pnpm create-test-business
```

#### Development Commands
```bash
# Start all services (from root)
pnpm dev

# Start frontend only
cd apps/MerchantApp
pnpm start
pnpm ios     # or pnpm android

# Start backend only  
cd apps/api
pnpm dev

# Run tests
pnpm test                    # All tests
pnpm test:frontend          # Frontend tests
pnpm test:backend           # Backend tests
```

### Environment Configuration

#### Required Environment Variables
```bash
# Frontend (.env.local)
API_BASE_URL=http://localhost:3000/api/v1


DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Supabase
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"


# Backend (.env)
DATABASE_URL=postgresql://username:password@localhost:5432/salex_db

UPSTASH_REDIS_REST_URL="https://polished-woodcock-7249.upstash.io"
UPSTASH_REDIS_REST_TOKEN="ARxRAAIjcDE1NmUwM2FiYjliMTg0MTA3YjRmYzUxNDMxYjg2NTc3ZXAxMA"


FIREBASE_PROJECT_ID=otpphonevef
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@otpphonevef.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUwwrTj/fcEs5b\nKYDfcchyDNHaugDr5cAp7SxTDgOhhmoHKyLa5Frvp7hsqucHbVRGzMG2sjTm/OOk\nNUcfqo9VhIca3JcbxcytmHoofx93DV0KAmJ/WVVgGejS8wxcDNhFS0TNylUJDGzP\nR/APbjZXWRq+JBzx2nfhqXlTQW2T533iaL8GdqiQpueVVz/E/UqDu1O8ukufULc7\n6ee0j5do5niq8EGPYzQ+S7PUUVA2HTzAD65sKet3b4usdJ0u1w6/bRaLFsyo3NUq\nLcPWXxzinIMbFj868r7OjCZEiCmAkUkqBxk/jDxR7d8inNw1riSnyOCHMvOqpK/S\n4A8fpCD/AgMBAAECggEADyIeY4TyftNRnTdbBMmtlbsmtBWV2jGZ1QGbLP8qr/MF\nGKRvUr16YGCAJC6Vxzf2DiEjSDDtxV5IfNYTTIPPtSf7iiQVlXKgx9o4GihMnyWy\nr/MSeXdrtK2zG0oRX3zEZ01ew/p3yPB6ztWRlC9lKxpZ5htgea1t6H2q9QqK1kG4\nNYHDKOg9Gqj9UPY/Cqp/x2UUKyt28VDOut9lGvT9ueAUNI9D///N8TTlMRw8yUei\nlPIq2LnW6IJ3WwNLinN1H3c1F7IYvgzAEHMIiod9sRceLObSzcUQmW6b2RzoY2ID\nFtOYOXQqpAp82A4vFsBcJDSc2Y9UeJh8I3X2rf3ciQKBgQD4P5NVF9lQ9QkslzTS\ncqy4iUFu2M6SBTEOeEKx5a/4GZK4FVR2kzyeqR2z+co5txIATrWen8Po428fm5ly\nxAwsDkb64Pz/QlBGhy1hbiPod4z4IzcCMdVnwHhhYx49q2HMrZp85Y+Zdhk3v0dx\nR5ArX6t21lwfPeqyqi1uMvk/iQKBgQDbZ8xl6ey5uW5yh/mfcGFLt3vsLkW6tmSG\nGeUamrlAh2Gyb3g68rcvvJ6kRxOu+Zj8prDe9GxmkIVw2EhI4hMLK7Ujft62yzbL\n6ghSEMzVwz3vFSSyxklkNT/vZvzToBze4WF8sEvgqE+C+Z12TTze+O/M6wPOTjHO\nl28nedTyRwKBgQC1f23NeelFulEhy88vye2j4Z34WAT3V1pddOl2PTLhlnjho56k\nLtPUQFraGdeTSNidZu58cdx/KcE1/8I52UH499tHUzVFvwsH9Y7lO+x+6uEjDkQK\nk7qt51dcBGa4udOAHLDlfcT2cxTO4Edwd9zdCU5ITUL/CHrOc4NRnW0D2QKBgEoQ\nSPxiMeokAXeiFQ7QVdfEcY2xtRIpPdfS5/bKIhz5Vm5wmIp1oob3yim0YJ2hXhZz\ngqNQqUMaKCGGsSgBQOJ1d6kqy62y/aVqNDLXvv2t8btCTOgYbW/pVdLP1iruErDe\nLhV0QbjtuCGDd7cWraSrLe/jqZ474S5XCkuuIcdDAoGBANrdRlAEIVqcYm9Cb+Vk\nQqfIbCbsdUq0J63sZUZbbK/gfWiEENSbIMpzMP1g41MNlmIZPrQU8k8eAOwflnqq\nyIOwye4FBE0atEcbHSL2TvoQ1d+ZYucJa5FHpz9kcTEo50fiY7NcR1tZ4tC/CNRX\n8u3N9dqBQgdA889O0xugoe1Z\n-----END PRIVATE KEY-----\n"
# Shared
NODE_ENV=development
PORT=3000
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** App Store (iOS) and Google Play Store (Android)
- **Build Command:** `react-native bundle` + native builds
- **Output Directory:** Platform-specific bundles
- **CDN/Edge:** Not applicable for mobile apps

**Backend Deployment:**
- **Platform:** Cloud platform (AWS, GCP, or Azure)
- **Build Command:** `nest build`
- **Deployment Method:** Container-based deployment or serverless

### CI/CD Pipeline
```yaml
name: Salex CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
      
      - name: Run linting
        run: pnpm lint

  build-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build backend
        run: |
          cd apps/api
          pnpm build

  build-mobile:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build iOS
        run: |
          cd apps/MerchantApp
          cd ios && pod install && cd ..
          npx react-native build-ios --mode=Release

  deploy-staging:
    needs: [build-backend, build-mobile]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: echo "Deploy to staging environment"

  deploy-production:
    needs: [build-backend, build-mobile]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: echo "Deploy to production environment"
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | localhost:8081 | localhost:3000 | Local development |
| Staging | TestFlight/Internal | staging-api.salex.app | Pre-production testing |
| Production | App Store/Play Store | api.salex.app | Live environment |

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: Not applicable for mobile apps, but secure coding practices enforced
- XSS Prevention: Input sanitization and validation on all user inputs
- Secure Storage: Firebase tokens stored in secure AsyncStorage with encryption

**Backend Security:**
- Input Validation: class-validator decorators on all DTOs for request validation
- Rate Limiting: @nestjs/throttler configured for API endpoints
- CORS Policy: Configured for mobile app origins and development environments

**Authentication Security:**
- Token Storage: Firebase tokens in secure AsyncStorage with automatic refresh
- Session Management: Stateless JWT tokens with proper expiration handling
- Password Policy: Phone-based authentication eliminates password complexity requirements

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: <50MB for release builds
- Loading Strategy: Lazy loading for screens, eager loading for critical components
- Caching Strategy: AsyncStorage for user data, memory cache for frequently accessed data

**Backend Performance:**
- Response Time Target: <500ms for API endpoints
- Database Optimization: Proper indexing on frequently queried fields, connection pooling
- Caching Strategy: Redis caching for session data and frequently accessed business information

## Testing Strategy

### Testing Pyramid
```
              E2E Tests
             /          \
       Integration Tests
          /              \
     Frontend Unit    Backend Unit
```

### Test Organization

#### Frontend Tests
```
__tests__/
├── components/
│   ├── ui/
│   │   ├── Button.test.tsx
│   │   └── Card.test.tsx
│   └── booking/
│       └── BookingCard.test.tsx
├── screens/
│   ├── auth/
│   │   └── PhoneAuthScreen.test.tsx
│   └── main/
│       └── DashboardScreen.test.tsx
├── services/
│   ├── authService.test.ts
│   └── businessService.test.ts
└── navigation/
    └── AppNavigator.test.tsx
```

#### Backend Tests
```
test/
├── unit/
│   ├── business/
│   │   ├── business.controller.spec.ts
│   │   └── business.service.spec.ts
│   └── service/
│       ├── service.controller.spec.ts
│       └── service.service.spec.ts
├── integration/
│   ├── auth.integration.spec.ts
│   ├── business.integration.spec.ts
│   └── service.integration.spec.ts
└── e2e/
    └── app.e2e-spec.ts
```

#### E2E Tests
```
e2e/
├── auth/
│   ├── phone-auth.e2e.ts
│   └── token-refresh.e2e.ts
├── onboarding/
│   └── business-setup.e2e.ts
└── main-flows/
    ├── service-management.e2e.ts
    └── booking-flow.e2e.ts
```

### Test Examples

#### Frontend Component Test
```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BusinessProfile } from '../BusinessProfile';
import { businessService } from '../../services/businessService';

jest.mock('../../services/businessService');
const mockBusinessService = businessService as jest.Mocked<typeof businessService>;

describe('BusinessProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load and display business data', async () => {
    const mockBusiness = {
      id: '1',
      name: 'Test Salon',
      businessType: 'SALON',
      phoneNumber: '+1234567890',
      address: '123 Test St',
    };

    mockBusinessService.getBusiness.mockResolvedValue(mockBusiness);

    const { getByText, queryByTestId } = render(
      <BusinessProfile businessId="1" />
    );

    expect(queryByTestId('loading-spinner')).toBeTruthy();

    await waitFor(() => {
      expect(getByText('Test Salon')).toBeTruthy();
      expect(getByText('+1234567890')).toBeTruthy();
    });

    expect(mockBusinessService.getBusiness).toHaveBeenCalledWith('1');
  });

  it('should handle loading errors gracefully', async () => {
    mockBusinessService.getBusiness.mockRejectedValue(new Error('Network error'));

    const { getByText } = render(<BusinessProfile businessId="1" />);

    await waitFor(() => {
      expect(getByText('Network error')).toBeTruthy();
    });
  });
});
```

#### Backend API Test
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma.service';

describe('BusinessController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterEach(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('/api/v1/business (POST)', () => {
    it('should create a new business', () => {
      return request(app.getHttpServer())
        .post('/api/v1/business')
        .set('Authorization', 'Bearer valid-firebase-token')
        .send({
          name: 'Test Salon',
          businessType: 'SALON',
          phoneNumber: '+1234567890',
          address: '123 Test St',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('Test Salon');
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/business')
        .send({
          name: 'Test Salon',
          businessType: 'SALON',
          phoneNumber: '+1234567890',
          address: '123 Test St',
        })
        .expect(401);
    });
  });
});
```

#### E2E Test
```typescript
import { by, device, element, expect } from 'detox';

describe('Business Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete business onboarding successfully', async () => {
    // Navigate through auth flow
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('send-otp-button')).tap();
    
    await element(by.id('otp-input')).typeText('123456');
    await element(by.id('verify-otp-button')).tap();

    // Business type selection
    await expect(element(by.text('Select Business Type'))).toBeVisible();
    await element(by.id('salon-option')).tap();
    await element(by.id('continue-button')).tap();

    // Business identity
    await element(by.id('business-name-input')).typeText('Test Salon');
    await element(by.id('business-phone-input')).typeText('+1234567890');
    await element(by.id('continue-button')).tap();

    // Complete onboarding
    await element(by.id('complete-onboarding-button')).tap();

    // Verify main app navigation
    await expect(element(by.text('Dashboard'))).toBeVisible();
    await expect(element(by.text('Test Salon'))).toBeVisible();
  });
});
```

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always import types from 'shared-types' package, never duplicate type definitions between frontend and backend
- **API Calls:** Never make direct HTTP calls from components - always use the centralized service layer (businessService, serviceService, etc.)
- **Environment Variables:** Access environment variables only through config objects, never use process.env directly in components or services
- **Error Handling:** All API routes must return standardized ApiResponse<T> format with success/error fields
- **State Updates:** Never mutate React state directly - use proper setState patterns and Context API
- **Authentication:** All protected API endpoints must use FirebaseAuthGuard, never implement custom auth checks
- **Database Access:** All database operations must go through Prisma service layer, never use raw SQL in controllers
- **File Organization:** Follow established module structure - components in components/, screens in screens/, services in services/

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `BusinessProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| Services | camelCase | PascalCase classes | `businessService`, `BusinessService` |  
| API Routes | - | kebab-case | `/api/v1/business-profile` |
| Database Tables | - | PascalCase | `Business`, `Service` |
| Screen Components | PascalCase + 'Screen' | - | `DashboardScreen.tsx` |
| Context Providers | PascalCase + 'Provider' | - | `AuthProvider.tsx` |

## Error Handling Strategy

### Error Flow
```mermaid
sequenceDiagram
    participant Component as React Component
    participant Service as API Service
    participant Client as API Client
    participant Backend as NestJS API
    participant Guard as Error Handler
    
    Component->>Service: Call service method
    Service->>Client: HTTP request
    Client->>Backend: API call
    Backend->>Guard: Process request
    Guard-->>Backend: Error occurs
    Backend-->>Client: ApiResponse with error
    Client-->>Service: Throw formatted error
    Service-->>Component: Catch and handle error
    Component->>Component: Update UI with error state
```

### Error Response Format
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Frontend Error Handling
```typescript
// Global error boundary for React components
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Report to crash analytics service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackScreen error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Service-level error handling
export const handleApiError = (error: any): never => {
  if (error.response?.data?.error) {
    throw new Error(error.response.data.error);
  } else if (error.message) {
    throw new Error(error.message);
  } else {
    throw new Error('An unexpected error occurred');
  }
};
```

### Backend Error Handling
```typescript
// Global exception filter for NestJS
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    const responseBody = {
      success: false,
      error: message,
      message: 'Request failed',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(responseBody);
  }
}

// Service-level error handling
@Injectable()
export class BusinessService {
  async findById(id: string): Promise<Business> {
    try {
      const business = await this.prisma.business.findUnique({
        where: { id },
      });

      if (!business) {
        throw new NotFoundException(`Business with ID ${id} not found`);
      }

      return business;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve business');
    }
  }
}
```

## Monitoring and Observability

### Monitoring Stack
- **Frontend Monitoring:** React Native crash reporting (Crashlytics), performance monitoring
- **Backend Monitoring:** Application performance monitoring (APM), health check endpoints
- **Error Tracking:** Centralized error logging and alerting system
- **Performance Monitoring:** API response time tracking, database query performance

### Key Metrics

**Frontend Metrics:**
- App crash rate and crash-free sessions
- API response times from mobile perspective
- User engagement and screen analytics
- Authentication success/failure rates

**Backend Metrics:**
- Request rate and response times
- Error rate by endpoint
- Database connection pool utilization
- Firebase authentication metrics

## Checklist Results Report

Before finalizing this architecture document, I recommend executing the architect checklist to validate all design decisions. The architecture document provides comprehensive coverage of:

✅ **Complete Tech Stack Definition** - All technologies specified with versions and rationale  
✅ **Data Model Alignment** - Existing shared-types package provides excellent type coverage  
✅ **API Specification** - RESTful API design mapped to existing NestJS endpoints  
✅ **Security Architecture** - Firebase authentication with proper guard implementation  
✅ **Error Handling Strategy** - Unified error handling across frontend and backend  
✅ **Performance Considerations** - Mobile-first optimizations and caching strategies  
✅ **Testing Strategy** - Comprehensive testing pyramid with examples  
✅ **Development Workflow** - Clear setup and development commands  

**Ready for Implementation:** This architecture document provides the complete technical foundation for transforming the Salex application from mock data to production-ready frontend-backend integration.

---

*This architecture document serves as the single source of truth for the Salex Frontend-Backend Integration project. All development work should adhere to the patterns, standards, and decisions outlined here.*