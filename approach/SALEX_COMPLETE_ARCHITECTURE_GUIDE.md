# Salex Platform - Complete Architecture & Flow Guide

> **Comprehensive documentation covering UI rendering, API calls, category-based access control, and admin dashboard integration**
> Last Updated: January 11, 2026

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Data Flow Architecture](#2-data-flow-architecture)
3. [Category-Based Dynamic UI System](#3-category-based-dynamic-ui-system)
4. [API Layer & Services](#4-api-layer--services)
5. [Feature Access Control](#5-feature-access-control)
6. [Admin Dashboard Integration](#6-admin-dashboard-integration)
7. [Merchant App Deep Dive](#7-merchant-app-deep-dive)
8. [File Reference Index](#8-file-reference-index)

---

## 1. Platform Overview

Salex is a multi-tenant business management platform with three main components:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SALEX PLATFORM                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐        │
│  │  Merchant App    │   │   Backend API    │   │ Admin Dashboard  │        │
│  │  (React Native)  │   │   (Express.js)   │   │    (React)       │        │
│  │                  │   │                  │   │                  │        │
│  │  • Bookings      │   │  • Auth          │   │  • Businesses    │        │
│  │  • Services      │   │  • Bookings      │   │  • Payments      │        │
│  │  • Staff/Res     │   │  • Services      │   │  • Modules       │        │
│  │  • Dashboard     │   │  • Admin APIs    │   │  • Templates     │        │
│  └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘        │
│           │                      │                      │                   │
│           └──────────────────────┼──────────────────────┘                   │
│                                  │                                          │
│                    ┌─────────────▼─────────────┐                            │
│                    │   Supabase PostgreSQL     │                            │
│                    │   (Prisma ORM)            │                            │
│                    └───────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Applications

| App | Location | Tech Stack | Purpose |
|-----|----------|------------|---------|
| Merchant App | `apps/MerchantAppExpo/` | React Native + Expo | Mobile app for salon owners |
| Backend API | `apps/api/` | Express.js + Prisma | REST API server |
| Admin Dashboard | `apps/admin-dashboard/` | React + Vite + Tailwind | Platform admin panel |
| Shared Types | `packages/shared-types/` | Prisma + Zod | Database client & validation |

---

## 2. Data Flow Architecture

### 2.1 Complete Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              COMPLETE DATA FLOW                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │           MERCHANT APP                   │
                    │        (React Native/Expo)               │
                    ├─────────────────────────────────────────┤
                    │                                         │
                    │  ┌─────────────┐    ┌─────────────┐    │
                    │  │ AuthContext │───▶│ AuthStore   │    │
                    │  │ (Provider)  │    │ (Zustand)   │    │
                    │  └─────────────┘    └──────┬──────┘    │
                    │                            │           │
                    │  ┌─────────────────────────▼────────┐  │
                    │  │         API CLIENT               │  │
                    │  │  (Axios + JWT Interceptor)       │  │
                    │  │  src/services/apiClient.ts       │  │
                    │  └─────────────┬────────────────────┘  │
                    │                │                       │
                    └────────────────┼───────────────────────┘
                                     │
                                     │ HTTP + Bearer Token
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │            BACKEND API                   │
                    │          (Express.js)                    │
                    ├─────────────────────────────────────────┤
                    │                                         │
                    │  ┌─────────────────────────────────┐   │
                    │  │      AUTH MIDDLEWARE            │   │
                    │  │  src/middlewares/auth.middleware│   │
                    │  │                                 │   │
                    │  │  • Validates JWT token          │   │
                    │  │  • Extracts user context        │   │
                    │  │  • Attaches to req.user         │   │
                    │  └──────────────┬──────────────────┘   │
                    │                 │                      │
                    │  ┌──────────────▼──────────────────┐   │
                    │  │       CONTROLLERS               │   │
                    │  │  src/controllers/               │   │
                    │  │                                 │   │
                    │  │  • booking.controller.ts        │   │
                    │  │  • service.controller.ts        │   │
                    │  │  • business.controller.ts       │   │
                    │  └──────────────┬──────────────────┘   │
                    │                 │                      │
                    │  ┌──────────────▼──────────────────┐   │
                    │  │         SERVICES                │   │
                    │  │  src/services/                  │   │
                    │  │                                 │   │
                    │  │  • feature-access.service.ts    │   │
                    │  │  • booking.service.ts           │   │
                    │  └──────────────┬──────────────────┘   │
                    │                 │                      │
                    └─────────────────┼──────────────────────┘
                                      │
                                      │ Prisma Client
                                      ▼
                    ┌─────────────────────────────────────────┐
                    │         SUPABASE POSTGRESQL             │
                    │  packages/shared-types/prisma/          │
                    │  schema.prisma                          │
                    └─────────────────────────────────────────┘
```


### 2.2 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              MERCHANT AUTHENTICATION FLOW                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    MERCHANT APP                    BACKEND API                      DATABASE
    ────────────                    ───────────                      ────────

    PhoneAuthScreen.tsx
    ┌─────────────────┐
    │ Enter phone     │
    │ +91 9876543210  │
    └────────┬────────┘
             │
             │ authService.sendOtp(phone)
             ▼
    ┌─────────────────┐         ┌─────────────────────────┐
    │ apiClient.post  │────────▶│ POST /v1/auth/otp/send  │
    │ '/auth/otp/send'│         │                         │
    └─────────────────┘         │ auth.controller.ts      │
                                │ → otp.service.ts        │
                                │ → twilio.service.ts     │
                                └───────────┬─────────────┘
                                            │
                                            │ Send SMS via Twilio
                                            ▼
                                ┌─────────────────────────┐
                                │ OTP sent to phone       │
                                └─────────────────────────┘

    OtpVerificationScreen.tsx
    ┌─────────────────┐
    │ Enter OTP       │
    │ 123456          │
    └────────┬────────┘
             │
             │ authService.verifyOtp(phone, otp)
             ▼
    ┌─────────────────┐         ┌─────────────────────────┐
    │ apiClient.post  │────────▶│ POST /v1/auth/otp/verify│
    │ '/auth/otp/verify'        │                         │
    └─────────────────┘         │ auth.controller.ts      │
                                │ → auth.service.ts       │
                                │ → token.service.ts      │
                                └───────────┬─────────────┘
                                            │
                                            │ 1. Verify OTP
                                            │ 2. Find/Create User
                                            │ 3. Mint JWT
                                            ▼
                                ┌─────────────────────────┐
                                │ Return:                 │
                                │ { token, user, business }│
                                └───────────┬─────────────┘
                                            │
             ┌──────────────────────────────┘
             ▼
    ┌─────────────────┐
    │ authStore       │
    │ .setAuth(data)  │
    │                 │
    │ • Store token   │
    │ • Store user    │
    │ • Persist to    │
    │   AsyncStorage  │
    └─────────────────┘
```

### 2.3 Booking Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         BOOKING CREATION FLOW                                            │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    MERCHANT APP                    BACKEND API                      DATABASE
    ────────────                    ───────────                      ────────

    HomeScreen.tsx
    ┌─────────────────┐
    │ Press FAB (+)   │
    └────────┬────────┘
             │
             │ Opens SlotCreatorDrawer
             ▼
    ┌─────────────────────┐
    │ SlotCreatorDrawer   │
    │                     │
    │ • Select service(s) │
    │ • Select time       │
    │ • Select staff      │
    │ • Select resource   │
    │ • Enter customer    │
    └──────────┬──────────┘
               │
               │ handleCreateBooking()
               ▼
    ┌─────────────────────┐
    │ 1. Check business   │
    │    suspension       │
    │                     │
    │ if (!business.isActive) {
    │   showAlert("Account suspended")
    │   return
    │ }                   │
    └──────────┬──────────┘
               │
               │ bookingStore.createBooking(data)
               ▼
    ┌─────────────────────┐         ┌─────────────────────────┐
    │ apiClient.post      │────────▶│ POST /v1/bookings       │
    │ '/bookings'         │         │                         │
    └─────────────────────┘         │ booking.controller.ts   │
                                    └───────────┬─────────────┘
                                                │
                                    ┌───────────▼─────────────┐
                                    │ 1. Validate request     │
                                    │ 2. Check business active│
                                    │ 3. Check feature access │
                                    │ 4. Check availability   │
                                    │ 5. Create booking       │
                                    └───────────┬─────────────┘
                                                │
                                                │ prisma.booking.create()
                                                ▼
                                    ┌─────────────────────────┐
                                    │ Booking Table           │
                                    │ + BookingItem Table     │
                                    └─────────────────────────┘
```

---

## 3. Category-Based Dynamic UI System

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        CATEGORY-BASED DYNAMIC UI SYSTEM                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │           BUSINESS CATEGORY             │
                    │  (Stored in Database: Business.category)│
                    │                                         │
                    │  • SALON                                │
                    │  • BEAUTY_PARLOR                        │
                    │  • SPA                                  │
                    │  • CLINIC                               │
                    │  • FITNESS                              │
                    │  • OTHER                                │
                    └──────────────────┬──────────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │         TEMPLATE LOADER                 │
                    │  src/categories/registry/TemplateLoader │
                    │                                         │
                    │  • Loads template based on category     │
                    │  • Caches templates for performance     │
                    │  • Validates template structure         │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────────┐
                    │                  │                      │
                    ▼                  ▼                      ▼
        ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
        │  salon.template   │ │ clinic.template   │ │   spa.template    │
        │       .ts         │ │       .ts         │ │       .ts         │
        │                   │ │                   │ │                   │
        │ • terminology     │ │ • terminology     │ │ • terminology     │
        │ • modules         │ │ • modules         │ │ • modules         │
        │ • services        │ │ • services        │ │ • services        │
        │ • theme colors    │ │ • theme colors    │ │ • theme colors    │
        └───────────────────┘ └───────────────────┘ └───────────────────┘
```

### 3.2 Template File Structure

**Location:** `apps/MerchantAppExpo/src/categories/templates/`

```typescript
// salon.template.ts - Complete Structure
export const salonTemplate: NicheTemplate = {
  id: 'salon-template-v1',
  code: BusinessCategory.SALON,
  displayName: 'Hair Salon',
  icon: '💄',
  
  // TERMINOLOGY - How entities are named in UI
  terminology: {
    customer: {
      singular: 'client',
      plural: 'clients',
      variations: {
        formal: 'valued client',
        casual: 'customer',
      },
    },
    staff: {
      singular: 'stylist',
      plural: 'stylists',
      variations: {
        senior: 'senior stylist',
        junior: 'junior stylist',
      },
    },
    resource: {
      singular: 'station',
      plural: 'stations',
      variations: {
        chair: 'styling chair',
        wash: 'wash station',
      },
    },
    appointment: {
      singular: 'appointment',
      plural: 'appointments',
    },
  },
  
  // MODULES - Features available for this category
  modules: [
    {
      code: 'hair-services',
      name: 'Hair Services',
      enabledByDefault: true,
    },
    {
      code: 'color-services',
      name: 'Color Services',
      enabledByDefault: true,
    },
  ],
  
  // DEFAULT SERVICES
  services: [
    {
      name: 'Haircut & Style',
      basePrice: 800,
      duration: 60,
    },
    {
      name: 'Hair Coloring',
      basePrice: 2000,
      duration: 120,
    },
  ],
  
  // THEME CUSTOMIZATION
  customizations: {
    ui: {
      theme: {
        colors: {
          primary: '#E91E63',
          secondary: '#F8BBD9',
          accent: '#AD1457',
        },
      },
    },
  },
};
```


### 3.3 Using Category Context in Components

**Location:** `apps/MerchantAppExpo/src/categories/core/context/CategoryContext.tsx`

```typescript
// CategoryProvider wraps the app
export const CategoryProvider: React.FC<CategoryProviderProps> = ({
  businessId,
  children,
  fallbackCategory = BusinessCategory.SALON,
}) => {
  const [category, setCategory] = useState<BusinessCategory>(fallbackCategory);
  const [template, setTemplate] = useState<NicheTemplate | null>(null);
  const [terminology, setTerminology] = useState<TerminologyConfig | null>(null);

  // Load category data when category changes
  const loadCategoryData = useCallback(async (targetCategory: BusinessCategory) => {
    const instance = await categoryFactory.createCategoryInstance(targetCategory);
    setTemplate(instance.template);
    setTerminology(instance.getTerminology());
  }, []);

  // Helper function to get terminology
  const getTerm = useCallback((key: string): string => {
    const termEntry = terminology?.[key];
    return termEntry?.singular || key;
  }, [terminology]);

  return (
    <CategoryContext.Provider value={{ category, template, getTerm }}>
      {children}
    </CategoryContext.Provider>
  );
};
```

**Usage in Components:**

```typescript
// Example: StaffManagementScreen.tsx
import { useCategoryContext } from '../categories/core/context/CategoryContext';

const StaffManagementScreen: React.FC = () => {
  const { getTerm, getPluralTerm } = useCategoryContext();
  
  return (
    <View>
      {/* Shows "Stylists" for SALON, "Practitioners" for CLINIC */}
      <Text style={styles.title}>{getPluralTerm('staff')}</Text>
      
      {/* Shows "Add Stylist" for SALON, "Add Practitioner" for CLINIC */}
      <Button title={`Add ${getTerm('staff')}`} onPress={handleAdd} />
    </View>
  );
};
```

### 3.4 Category Comparison Table

| Feature | SALON | CLINIC | SPA | FITNESS |
|---------|-------|--------|-----|---------|
| **Customer Term** | client | patient | guest | member |
| **Staff Term** | stylist | practitioner | therapist | trainer |
| **Resource Term** | station | room | treatment room | studio |
| **Appointment Term** | appointment | consultation | session | session |
| **Primary Color** | #E91E63 | #2196F3 | #4CAF50 | #FF5722 |
| **Walk-ins** | Yes | No | Yes | No |
| **Medical Records** | No | Yes | No | No |

---

## 4. API Layer & Services

### 4.1 Merchant App API Client

**Location:** `apps/MerchantAppExpo/src/services/apiClient.ts`

```typescript
class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT_MS,
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // REQUEST: Inject JWT token from auth store
    this.client.interceptors.request.use(async (config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // RESPONSE: Handle 401 (unauthorized)
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().clearAuth();
        }
        return Promise.reject(this.normalizeError(error));
      }
    );
  }
}

export const apiClient = APIClient.instance;
```

### 4.2 API Endpoints Reference

```
AUTHENTICATION
POST   /v1/auth/otp/send          # Send OTP to phone
POST   /v1/auth/otp/verify        # Verify OTP & get JWT
GET    /v1/auth/me                # Get current user

BUSINESS
GET    /v1/business/me            # Get merchant's business
PATCH  /v1/business/:id           # Update business details
PATCH  /v1/business/:id/hours     # Update hours of operation

SERVICES
GET    /v1/services/business/:id  # List services for business
POST   /v1/services               # Create new service
PATCH  /v1/services/:id           # Update service
DELETE /v1/services/:id           # Delete service

BOOKINGS
GET    /v1/bookings/business/:id  # List bookings for business
POST   /v1/bookings               # Create booking
PATCH  /v1/bookings/:id/status    # Update booking status
POST   /v1/bookings/:id/complete  # Complete with payment

STAFF
GET    /v1/staff/business/:id     # List staff for business
POST   /v1/staff                  # Create staff member
PATCH  /v1/staff/:id              # Update staff
DELETE /v1/staff/:id              # Delete staff

RESOURCES
GET    /v1/resources/business/:id # List resources for business
POST   /v1/resources              # Create resource
PATCH  /v1/resources/:id          # Update resource
DELETE /v1/resources/:id          # Delete resource

AVAILABILITY
GET    /v1/availability/:businessId/slots # Get available slots
POST   /v1/availability/check     # Check specific slot availability

TEMPLATES (Merchant)
GET    /v1/templates/:category    # Get template for category
```

### 4.3 Service Layer Pattern

**Example: Booking Service**

**Location:** `apps/api/src/services/booking.service.ts`

```typescript
class BookingService {
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const { businessId, customerId, serviceIds, scheduledAt } = input;

    // 1. Validate business exists and is active
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { subscription: true },
    });
    
    if (!business?.isActive) {
      throw new BusinessRuleError('Business account is suspended');
    }

    // 2. Check feature access (subscription-based)
    const canBook = await featureAccessService.canAccessFeature(
      businessId, 
      'walk_in_booking'
    );
    if (!canBook.allowed) {
      throw new ForbiddenError(canBook.reason);
    }

    // 3. Check availability
    const isAvailable = await availabilityService.checkSlotAvailability({
      businessId,
      resourceId: input.resourceId,
      staffId: input.staffId,
      startTime: scheduledAt,
    });
    
    if (!isAvailable) {
      throw new ConflictError('Time slot is not available');
    }

    // 4. Create booking
    const booking = await prisma.booking.create({
      data: {
        businessId,
        customerId,
        resourceId: input.resourceId,
        staffId: input.staffId,
        scheduledAt,
        status: 'PENDING',
        items: {
          create: serviceIds.map(serviceId => ({
            serviceId,
          })),
        },
      },
    });

    return booking;
  }
}
```


---

## 5. Feature Access Control

### 5.1 Plan-Based Feature Matrix

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
```

### 5.2 Feature Access Check Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         FEATURE ACCESS CHECK FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    canAccessFeature(businessId, 'whatsapp_booking')
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────────────────────┐
    │ 1. CHECK BUSINESS EXISTS & IS ACTIVE                                            │
    │                                                                                 │
    │    const business = await prisma.business.findUnique({                          │
    │      where: { id: businessId },                                                 │
    │      include: { subscription: true, moduleConfigs: true }                       │
    │    });                                                                          │
    │                                                                                 │
    │    if (!business.isActive) {                                                    │
    │      return { allowed: false, reason: 'Business account is suspended' };        │
    │    }                                                                            │
    └─────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────────────────────┐
    │ 2. CHECK SUBSCRIPTION STATUS                                                    │
    │                                                                                 │
    │    if (subscription.status !== 'TRIAL' && subscription.status !== 'ACTIVE') {   │
    │      return { allowed: false, reason: 'Subscription is expired' };              │
    │    }                                                                            │
    └─────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────────────────────┐
    │ 3. CHECK FEATURE IN PLAN                                                        │
    │                                                                                 │
    │    const planFeatures = PLAN_FEATURES[subscription.plan];                       │
    │    if (!planFeatures.includes('whatsapp_booking')) {                            │
    │      return {                                                                   │
    │        allowed: false,                                                          │
    │        reason: 'Feature not available in BASIC plan',                           │
    │        suggestedPlan: 'PRO'                                                     │
    │      };                                                                         │
    │    }                                                                            │
    └─────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────────────────────┐
    │ 4. CHECK MODULE ENABLED (Optional per-business toggle)                          │
    │                                                                                 │
    │    const moduleConfig = business.moduleConfigs.find(                            │
    │      c => c.moduleCode === 'appointment_booking'                                │
    │    );                                                                           │
    │    if (moduleConfig && !moduleConfig.isEnabled) {                               │
    │      return { allowed: false, reason: 'Module is disabled for this business' }; │
    │    }                                                                            │
    └─────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────────────────────┐
    │ 5. ACCESS GRANTED                                                               │
    │                                                                                 │
    │    return { allowed: true };                                                    │
    └─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Frontend Feature Gating

**Location:** `apps/MerchantAppExpo/src/hooks/useFeatureAccess.ts`

```typescript
export const useFeatureAccess = () => {
  const { business } = useBusinessStore();
  
  const canAccess = useCallback((feature: string): boolean => {
    if (!business?.isActive) return false;
    if (!business?.subscription) return false;
    
    const plan = business.subscription.plan;
    return PLAN_FEATURES[plan]?.includes(feature) ?? false;
  }, [business]);
  
  return { canAccess };
};

// Usage in component
const MyComponent = () => {
  const { canAccess } = useFeatureAccess();
  
  if (!canAccess('whatsapp_booking')) {
    return <UpgradePrompt feature="WhatsApp Booking" requiredPlan="PRO" />;
  }
  
  return <WhatsAppBookingFeature />;
};
```

---

## 6. Admin Dashboard Integration

### 6.1 Admin Dashboard Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD ARCHITECTURE                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ADMIN DASHBOARD (React)                    BACKEND API
    ───────────────────────                    ───────────

    ┌─────────────────────┐
    │     LoginPage       │
    │  (Email/Password)   │
    └──────────┬──────────┘
               │
               │ POST /v1/admin/auth/login
               ▼
    ┌─────────────────────┐         ┌─────────────────────────┐
    │   authStore.ts      │────────▶│ admin-auth.controller   │
    │   • setToken()      │         │ • Verify credentials    │
    │   • fetchMe()       │         │ • Generate JWT          │
    └──────────┬──────────┘         └─────────────────────────┘
               │
               ▼
    ┌─────────────────────┐
    │   Layout.tsx        │
    │   (Sidebar Nav)     │
    │                     │
    │   • Dashboard       │
    │   • Businesses      │
    │   • Payments        │
    │   • Templates       │
    │   • System Health   │
    │   • Audit Log       │
    └─────────────────────┘
```

### 6.2 Admin API Client

**Location:** `apps/admin-dashboard/src/services/apiClient.ts`

```typescript
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Business Management
  async listBusinesses(params?: { page?: number; search?: string }) {
    return this.client.get('/v1/admin/businesses', { params });
  }

  async toggleBusinessStatus(id: string, reason?: string) {
    return this.client.post(`/v1/admin/businesses/${id}/toggle`, { reason });
  }

  async changeSubscriptionPlan(id: string, plan: string, reason?: string) {
    return this.client.patch(`/v1/admin/businesses/${id}/plan`, { plan, reason });
  }

  // Payment Management
  async recordPayment(data: RecordPaymentInput) {
    return this.client.post('/v1/admin/payments', data);
  }

  // System Health
  async getSystemHealth() {
    return this.client.get('/v1/admin/health/system');
  }

  async getPlatformStats() {
    return this.client.get('/v1/admin/health/stats');
  }
}
```


### 6.3 Toggle Business Status Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    TOGGLE BUSINESS STATUS FLOW                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ADMIN DASHBOARD                 BACKEND API                         DATABASE
    ───────────────                 ───────────                         ────────

    BusinessesPage.tsx
    ┌─────────────────┐
    │ Click "Deactivate"│
    │ button           │
    └────────┬────────┘
             │
             │ apiClient.toggleBusinessStatus(id, reason)
             ▼
    ┌─────────────────┐         ┌─────────────────────────┐
    │ POST /v1/admin/ │────────▶│ admin-business.controller│
    │ businesses/:id/ │         │ toggleBusinessStatus()  │
    │ toggle          │         └───────────┬─────────────┘
    └─────────────────┘                     │
                                            │ 1. Toggle isActive
                                            │ 2. Log to AuditLog
                                            ▼
                                ┌─────────────────────────┐
                                │ Business Table          │
                                │ isActive: false         │
                                └─────────────────────────┘
                                            │
                                            ▼
                                ┌─────────────────────────┐
                                │ AuditLog Table          │
                                │ • adminId               │
                                │ • action: TOGGLE_STATUS │
                                │ • entityId: businessId  │
                                │ • changes: {from, to}   │
                                └─────────────────────────┘

    EFFECT ON MERCHANT APP:
    ───────────────────────
    When business.isActive = false:
    
    1. TabNavigator shows AccountSuspendedScreen
    2. All booking operations blocked with alert
    3. API calls return 403 Forbidden
    4. WhatsApp booking disabled
```

### 6.4 Admin Role Permissions

```typescript
enum AdminRole {
  SUPPORT    // Read-only access
  ADMIN      // Can modify businesses, record payments
  SUPER_ADMIN // Full access including admin user management
}

// Role hierarchy check
const roleHierarchy: Record<AdminRole, number> = {
  SUPPORT: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

// Middleware usage
@requireAdminRole('ADMIN')  // Requires ADMIN or SUPER_ADMIN
async toggleBusinessStatus(req, res) { ... }
```

### 6.5 Admin Dashboard Pages

| Page | Route | Purpose | Key Actions |
|------|-------|---------|-------------|
| Dashboard | `/` | Platform overview | View stats, quick actions |
| Businesses | `/businesses` | Business list | Search, filter, toggle status |
| Business Detail | `/businesses/:id` | Individual business | Edit plan, modules, view details |
| Payments | `/payments` | Payment tracking | Record payments, view history |
| Templates | `/templates` | Niche templates | CRUD templates |
| System Health | `/system-health` | Monitoring | View API/DB health |
| Audit Log | `/audit-log` | Admin actions | View action history |

---

## 7. Merchant App Deep Dive

### 7.1 Navigation Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         MERCHANT APP NAVIGATION                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    RootNavigator.tsx
    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                     │
    │  ┌─────────────────┐                                                               │
    │  │ Check Auth      │                                                               │
    │  │ (authStore)     │                                                               │
    │  └────────┬────────┘                                                               │
    │           │                                                                        │
    │      ┌────┴────┐                                                                   │
    │      │         │                                                                   │
    │      ▼         ▼                                                                   │
    │  NOT LOGGED IN    LOGGED IN                                                        │
    │      │              │                                                              │
    │      ▼              ▼                                                              │
    │  ┌─────────┐   ┌─────────────────┐                                                │
    │  │ Auth    │   │ Check Onboarding│                                                │
    │  │ Stack   │   │ (business.      │                                                │
    │  │         │   │  onboardingCompleted)                                            │
    │  │ • Welcome│   └────────┬────────┘                                                │
    │  │ • Phone │        ┌────┴────┐                                                   │
    │  │ • OTP   │        │         │                                                   │
    │  └─────────┘        ▼         ▼                                                   │
    │              NOT COMPLETE    COMPLETE                                              │
    │                    │              │                                                │
    │                    ▼              ▼                                                │
    │              ┌─────────┐   ┌─────────────────┐                                     │
    │              │Onboarding│   │ TabNavigator    │                                     │
    │              │Navigator │   │                 │                                     │
    │              │          │   │ Check isActive  │                                     │
    │              │ • Business│   │ ┌─────────────┐│                                     │
    │              │   Type   │   │ │ isActive?   ││                                     │
    │              │ • Details│   │ └──────┬──────┘│                                     │
    │              │ • Services│   │   ┌────┴────┐  │                                     │
    │              │ • Staff  │   │   │         │  │                                     │
    │              │ • Resources│  │   ▼         ▼  │                                     │
    │              │ • Review │   │  YES        NO │                                     │
    │              └─────────┘   │   │          │  │                                     │
    │                            │   ▼          ▼  │                                     │
    │                            │ ┌────┐  ┌──────┐│                                     │
    │                            │ │Tabs│  │Suspend││                                     │
    │                            │ │    │  │Screen ││                                     │
    │                            │ └────┘  └──────┘│                                     │
    │                            └─────────────────┘                                     │
    │                                                                                     │
    └─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Tab Navigator Screens

```
TabNavigator.tsx
├── Home (HomeScreen.tsx)
│   ├── Today's bookings timeline
│   ├── Quick stats (revenue, bookings)
│   ├── FAB for new booking (SlotCreatorDrawer)
│   └── Floating request cards
│
├── Bookings (BookingsScreen.tsx)
│   ├── All bookings list
│   ├── Filter by status/date
│   └── Booking detail drawer
│
├── Services (ServicesScreen.tsx)
│   ├── Service catalog
│   ├── Add/edit services
│   └── Pricing management
│
├── Staff (StaffManagementScreen.tsx)
│   ├── Staff list
│   ├── Add/edit staff
│   └── Resource linking
│
└── Profile (ProfileScreen.tsx)
    ├── Business info
    ├── Subscription status
    ├── Settings
    └── Logout
```


### 7.3 State Management (Zustand Stores)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         ZUSTAND STORES                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    src/store/
    │
    ├── authStore.ts
    │   ├── token: string | null
    │   ├── user: User | null
    │   ├── isAuthenticated: boolean
    │   ├── setAuth(token, user)
    │   ├── clearAuth()
    │   └── rehydrate() // Load from AsyncStorage
    │
    ├── businessStore.ts
    │   ├── business: Business | null
    │   ├── isLoading: boolean
    │   ├── fetchBusiness()
    │   ├── updateBusiness(data)
    │   └── isSuspended() // Check isActive
    │
    ├── bookingStore.ts
    │   ├── bookings: Booking[]
    │   ├── todayBookings: Booking[]
    │   ├── isLoading: boolean
    │   ├── fetchBookings(businessId)
    │   ├── createBooking(data)
    │   ├── updateBookingStatus(id, status)
    │   └── completeBooking(id, paymentData)
    │
    ├── serviceStore.ts
    │   ├── services: Service[]
    │   ├── fetchServices(businessId)
    │   ├── createService(data)
    │   ├── updateService(id, data)
    │   └── deleteService(id)
    │
    ├── staffStore.ts
    │   ├── staff: Staff[]
    │   ├── fetchStaff(businessId)
    │   ├── createStaff(data)
    │   ├── updateStaff(id, data)
    │   └── deleteStaff(id)
    │
    ├── resourceStore.ts
    │   ├── resources: Resource[]
    │   ├── fetchResources(businessId)
    │   ├── createResource(data)
    │   └── updateResource(id, data)
    │
    └── onboardingStore.ts
        ├── currentStep: number
        ├── businessDraft: Partial<Business>
        ├── setStep(step)
        ├── updateDraft(data)
        └── submitOnboarding()
```

### 7.4 Theme Configuration

**Location:** `apps/MerchantAppExpo/src/theme/config.ts`

```typescript
export const Colors = {
  // Primary palette
  primary: '#6366F1',      // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutrals
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  
  // Status colors
  statusPending: '#F59E0B',
  statusConfirmed: '#3B82F6',
  statusInProgress: '#8B5CF6',
  statusCompleted: '#10B981',
  statusCancelled: '#EF4444',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '600' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 14, fontWeight: '400' },
};
```

---

## 8. File Reference Index

### 8.1 Merchant App Files

```
apps/MerchantAppExpo/
├── App.tsx                           # Entry point with providers
├── src/
│   ├── config/index.ts               # API URL, environment config
│   │
│   ├── services/
│   │   ├── apiClient.ts              # Axios client with JWT
│   │   ├── authService.ts            # OTP authentication
│   │   ├── bookingService.ts         # Booking operations
│   │   ├── businessService.ts        # Business CRUD
│   │   ├── staffService.ts           # Staff management
│   │   ├── resourceService.ts        # Resource management
│   │   └── templateService.ts        # Category templates
│   │
│   ├── store/
│   │   ├── authStore.ts              # Auth state + token
│   │   ├── businessStore.ts          # Business data
│   │   ├── bookingStore.ts           # Bookings list
│   │   ├── serviceStore.ts           # Services list
│   │   ├── staffStore.ts             # Staff list
│   │   ├── resourceStore.ts          # Resources list
│   │   └── onboardingStore.ts        # Onboarding wizard state
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── PhoneAuthScreen.tsx   # Phone number input
│   │   │   └── OtpVerificationScreen.tsx # OTP verification
│   │   ├── onboarding/
│   │   │   ├── BusinessTypeScreen.tsx # Category selection
│   │   │   ├── BusinessDetailsScreen.tsx
│   │   │   ├── StaffSetupScreen.tsx
│   │   │   └── ResourceSetupScreen.tsx
│   │   ├── main/
│   │   │   ├── HomeScreen.tsx        # Dashboard with timeline
│   │   │   ├── BookingsScreen.tsx    # Bookings list
│   │   │   ├── ServicesScreen.tsx    # Service catalog
│   │   │   ├── StaffManagementScreen.tsx
│   │   │   ├── ResourceManagementScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   ├── AccountSuspendedScreen.tsx # Shown when isActive=false
│   │   └── WelcomeScreen.tsx
│   │
│   ├── components/
│   │   ├── high-strength/            # Core booking components
│   │   │   ├── SlotCreatorDrawer.tsx # New booking drawer
│   │   │   ├── BookingDetailDrawer.tsx
│   │   │   ├── CheckoutDrawer.tsx
│   │   │   └── TimelineSlot.tsx
│   │   ├── booking/
│   │   │   ├── BookingCard.tsx
│   │   │   ├── QuickBookButton.tsx
│   │   │   └── ResourceStaffSelector.tsx
│   │   ├── subscription/
│   │   │   ├── SubscriptionCard.tsx
│   │   │   ├── UpgradePrompt.tsx
│   │   │   └── AccountSuspendedBanner.tsx
│   │   └── ui/                       # Generic UI components
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx         # Auth flow routing
│   │   ├── TabNavigator.tsx          # Main tabs + suspension check
│   │   └── OnboardingNavigator.tsx
│   │
│   ├── categories/                   # Category-based UI system
│   │   ├── core/context/CategoryContext.tsx
│   │   ├── registry/TemplateLoader.ts
│   │   └── templates/*.template.ts
│   │
│   ├── hooks/
│   │   ├── useFeatureAccess.ts       # Plan-based feature gating
│   │   ├── useCategoryConfig.ts      # Category terminology
│   │   └── useHaptics.ts
│   │
│   └── theme/config.ts               # Colors, spacing, typography
```

### 8.2 Backend API Files

```
apps/api/
├── src/
│   ├── app.ts                        # Express app setup
│   ├── server.ts                     # Server entry point
│   ├── config/index.ts               # Environment config (Zod)
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts        # OTP login
│   │   ├── business.controller.ts    # Business CRUD
│   │   ├── booking.controller.ts     # Booking operations
│   │   ├── service.controller.ts     # Service CRUD
│   │   ├── staff.controller.ts       # Staff CRUD
│   │   ├── resource.controller.ts    # Resource CRUD
│   │   ├── availability.controller.ts
│   │   ├── template.controller.ts    # Category templates
│   │   ├── simulator.controller.ts   # WhatsApp simulator
│   │   │
│   │   ├── admin-auth.controller.ts
│   │   ├── admin-business.controller.ts
│   │   ├── admin-module.controller.ts
│   │   ├── admin-payment.controller.ts
│   │   ├── admin-template.controller.ts
│   │   ├── admin-health.controller.ts
│   │   ├── admin-audit.controller.ts
│   │   └── admin-export.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── otp.service.ts
│   │   ├── token.service.ts
│   │   ├── twilio.service.ts
│   │   ├── booking.service.ts
│   │   ├── availability.service.ts
│   │   ├── auto-assignment.service.ts
│   │   ├── business.service.ts
│   │   ├── feature-access.service.ts # Plan/module gating
│   │   ├── subscription.service.ts
│   │   ├── niche-template.service.ts
│   │   ├── audit-log.service.ts
│   │   ├── routing.service.ts        # WhatsApp routing
│   │   └── conversation.service.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts        # Merchant JWT validation
│   │   ├── admin-auth.middleware.ts  # Admin JWT validation
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   │
│   └── routes/                       # Route definitions
│       ├── auth.routes.ts
│       ├── business.routes.ts
│       ├── booking.routes.ts
│       ├── admin-*.routes.ts
│       └── ...
```

### 8.3 Admin Dashboard Files

```
apps/admin-dashboard/
├── src/
│   ├── App.tsx                       # Routes + Layout
│   ├── main.tsx                      # Entry point
│   │
│   ├── services/apiClient.ts         # Admin API client
│   │
│   ├── store/
│   │   ├── authStore.ts              # Admin auth state
│   │   └── businessStore.ts          # Business list state
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── BusinessesPage.tsx
│   │   ├── BusinessDetailPage.tsx
│   │   ├── PaymentsPage.tsx
│   │   ├── TemplatesPage.tsx
│   │   ├── SystemHealthPage.tsx
│   │   ├── AuditLogPage.tsx
│   │   └── AnalyticsPage.tsx
│   │
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   └── Alert.tsx
│   │
│   └── theme/
│       ├── colors.ts
│       └── typography.ts
```

### 8.4 Shared Types

```
packages/shared-types/
├── src/
│   ├── index.ts                      # Main exports
│   ├── db.ts                         # Prisma client singleton
│   └── schemas/
│       ├── user.schema.ts
│       ├── business.schema.ts
│       ├── booking.schema.ts
│       ├── service.schema.ts
│       ├── staff.schema.ts
│       ├── resource.schema.ts
│       ├── availability.schema.ts
│       ├── customer.schema.ts
│       └── conversation.schema.ts
│
└── prisma/
    └── schema.prisma                 # Database schema
```

---

## Quick Reference: Key Code Snippets

### Check Business Suspension (Frontend)

```typescript
// In TabNavigator.tsx
const { business } = useBusinessStore();

if (!business?.isActive) {
  return <AccountSuspendedScreen />;
}
```

### Check Feature Access (Backend)

```typescript
// In any controller
const result = await featureAccessService.canAccessFeature(
  businessId,
  'whatsapp_booking'
);

if (!result.allowed) {
  throw new ForbiddenError(result.reason);
}
```

### Use Category Terminology

```typescript
// In any component
const { getTerm, getPluralTerm } = useCategoryContext();

// Returns "stylist" for SALON, "practitioner" for CLINIC
const staffLabel = getTerm('staff');
```

### Admin Toggle Business

```typescript
// In admin dashboard
await apiClient.toggleBusinessStatus(businessId, 'Payment overdue');
// Business.isActive is now toggled
// Audit log entry created
```

---

*Last Updated: January 11, 2026*
