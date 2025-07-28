# 9. Database Schema

This SQL script defines the tables, types, relationships, and indexes for the Salex PostgreSQL database managed by Supabase.

```sql
-- Create custom ENUM types for better data integrity
CREATE TYPE "business_type" AS ENUM ('SALON', 'GENERAL_STORE', 'FOOD_VENDOR');
CREATE TYPE "booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON', 'COMPLETED');

-- Table for Users (Merchants), linked from Clerk
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY, -- Corresponds to the Clerk User ID
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generic table for all businesses
CREATE TABLE "Business" (
    "id" TEXT NOT NULL PRIMARY KEY, -- e.g., CUID like 'bus_123abc'
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "businessType" "business_type" NOT NULL,
    "address" TEXT,
    "phone" TEXT NOT NULL,
    "hoursOfOperation" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Specific details for Salon-type businesses
CREATE TABLE "Salon" (
    "id" TEXT NOT NULL PRIMARY KEY REFERENCES "Business"(id) ON DELETE CASCADE,
    -- This table can hold salon-specific fields in the future
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for end-customers (from WhatsApp)
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "lastVisitedBusinessId" TEXT REFERENCES "Business"(id) ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for services or items offered by a business
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" NUMERIC(10, 2) NOT NULL, -- Using NUMERIC for currency is best practice
    "durationMinutes" INTEGER NOT NULL,
    "businessId" TEXT NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The core table for bookings/appointments
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingTime" TIMESTAMPTZ NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'PENDING',
    "businessId" TEXT NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
    "customerId" TEXT NOT NULL REFERENCES "Customer"(id) ON DELETE CASCADE,
    "serviceId" TEXT NOT NULL REFERENCES "Service"(id) ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === INDEXES FOR PERFORMANCE ===
-- Create indexes on foreign keys and frequently queried columns
CREATE INDEX "idx_business_ownerId" ON "Business"("ownerId");
CREATE INDEX "idx_customer_phone" ON "Customer"("phone");
CREATE INDEX "idx_service_businessId" ON "Service"("businessId");
CREATE INDEX "idx_booking_businessId" ON "Booking"("businessId");
CREATE INDEX "idx_booking_customerId" ON "Booking"("customerId");
CREATE INDEX "idx_booking_bookingTime" ON "Booking"("bookingTime");