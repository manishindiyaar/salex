

# 4. Data Models

*Models are designed to be modular via a generic `Business` entity.*

## User (Merchant)

**Purpose:** Represents the business owner who uses the React Native merchant app. This user is managed by Clerk, and this table stores application-specific data linked to their Clerk ID.

**TypeScript Interface**
```typescript
export interface User {
  id: string; // From Clerk
  phone: string;
  email?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
Relationships

A User can own one Business.

Business (New Generic Model)
Purpose: The central, generic entity for any merchant on the platform.

TypeScript Interface

TypeScript

export interface Business {
  id: string; // Unique ID for the business
  name: string;
  ownerId: string; // Foreign key to User.id
  businessType: 'SALON' | 'GENERAL_STORE' | 'FOOD_VENDOR';
  address?: string | null;
  phone: string;
  hoursOfOperation: any; 
  createdAt: Date;
  updatedAt: Date;
}
Relationships

A Business belongs to one User.

A Business has one specific detail record (e.g., one Salon record).

Salon (Revised)
Purpose: Stores details specific to salons. It now links directly to the Business entity.

TypeScript Interface

TypeScript

export interface Salon {
  id: string; // Same as Business.id (Primary Key & Foreign Key)
  createdAt: Date;
  updatedAt: Date;
}
Relationships

A Salon has a one-to-one relationship with a Business.

Service (Revised)
Purpose: Now linked to the generic Business ID.

TypeScript Interface

TypeScript

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  businessId: string; // Changed from salonId
  createdAt: Date;
  updatedAt: Date;
}
Relationships

A Service belongs to one Business.

Customer (Revised)
Purpose: lastVisitedSalonId is now lastVisitedBusinessId.

TypeScript Interface

TypeScript

export interface Customer {
  id: string;
  phone: string; // Unique
  name?: string | null;
  lastVisitedBusinessId?: string | null; // Changed from salonId
  createdAt: Date;
  updatedAt: Date;
}
Booking (Revised)
Purpose: Now linked to the generic Business ID.

TypeScript Interface

TypeScript

export interface Booking {
  id: string;
  bookingTime: Date;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED_BY_USER' | 'CANCELLED_BY_SALON' | 'COMPLETED';
  businessId: string; // Changed from salonId
  customerId: string;
  serviceId: string;
  createdAt: Date;
  updatedAt: Date;
}
Relationships

A Booking belongs to one Business.

