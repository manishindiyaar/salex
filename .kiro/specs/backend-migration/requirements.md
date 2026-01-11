# Requirements Document

## Introduction

This specification covers the migration from the legacy NestJS backend (`apps/api(deprecated)`) to a modern Express.js + Supabase architecture within the SALEX-APP monorepo. The system enables salon owners (Merchants) to manage their business through a mobile app while customers book services frictionlessly via WhatsApp. The architecture implements hybrid authentication, strict availability checking with concurrency support, financial snapshots for booking integrity, and stateless WhatsApp conversation management.

## Glossary

- **Shared_Types_Package**: The `@salex/shared-types` package providing TypeScript types, Prisma client, and Zod validation schemas
- **Express_API**: The new Express.js backend application at `apps/api`
- **Prisma_Client**: The generated database client from Prisma schema
- **Zod_Schema**: Runtime validation schemas derived from Prisma models
- **Booking_Item**: A pivot table entry linking a Booking to a Service with frozen price/name snapshots
- **Routing_Code**: A unique 4-digit identifier for WhatsApp business discovery (e.g., "5555")
- **Customer**: A WhatsApp user who books services (identified by phone number, no app required)
- **User**: An authenticated merchant/salon owner (authenticated via OTP)
- **Availability_Engine**: The system that prevents double-bookings using time overlap logic and maxConcurrentBookings
- **Price_Snapshot**: Frozen price captured at booking creation time, immutable regardless of future price changes
- **Conversation_State**: The current step in a WhatsApp booking flow (GREETING, SERVICE_SELECTION, TIME_SELECTION, etc.)
- **Context_Data**: JSON field storing temporary booking selections during multi-step WhatsApp flows
- **Custom_JWT**: A JWT signed with Supabase Project Secret containing user ID for RLS policy enforcement

## Requirements

### Requirement 1: Shared Types Package Initialization

**User Story:** As a developer, I want a centralized shared-types package with Prisma and Zod integration, so that I can use type-safe database access and runtime validation across all applications.

#### Acceptance Criteria

1. THE Shared_Types_Package SHALL be named `@salex/shared-types` with proper package.json configuration
2. THE Shared_Types_Package SHALL include a `build` script that runs `prisma generate && tsc`
3. THE Shared_Types_Package SHALL include a `db:push` script that runs `prisma db push`
4. THE Shared_Types_Package SHALL export compiled JavaScript from `dist/index.js` and TypeScript declarations from `dist/index.d.ts`
5. THE Shared_Types_Package SHALL have `zod` and `@prisma/client` as dependencies
6. THE Shared_Types_Package SHALL have `prisma`, `typescript`, and `zod-prisma-types` as devDependencies
7. THE Shared_Types_Package SHALL export Prisma client singleton for database access
8. THE Prisma datasource SHALL use `DATABASE_URL` (Connection Pooler, port 6543) for runtime queries
9. THE Prisma datasource SHALL use `DIRECT_URL` (Direct Connection, port 5432) for migrations and schema changes

### Requirement 2: Supabase Cloud Database Configuration

**User Story:** As a developer, I want Prisma configured for Supabase Cloud with proper connection pooling, so that the serverless backend can handle concurrent connections without exhausting the database pool.

#### Acceptance Criteria

1. THE Prisma schema datasource SHALL include both `url` and `directUrl` properties
2. THE `DATABASE_URL` environment variable SHALL point to the Supabase Connection Pooler (port 6543) with `pgbouncer=true&connection_limit=1`
3. THE `DIRECT_URL` environment variable SHALL point to the Supabase Direct Connection (port 5432) for migrations
4. WHEN running `prisma db push` or `prisma migrate`, THE Prisma_Client SHALL use the DIRECT_URL connection
5. WHEN running application queries, THE Prisma_Client SHALL use the DATABASE_URL (pooled) connection
6. THE Express_API SHALL require `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET` environment variables
7. THE `SUPABASE_JWT_SECRET` SHALL be used for signing Custom JWTs for RLS policy enforcement

### Requirement 3: Prisma Schema Definition

**User Story:** As a developer, I want a comprehensive Prisma schema that supports multi-service bookings, hybrid authentication, price snapshots, and WhatsApp conversation state, so that the database accurately models the business domain.

#### Acceptance Criteria

1. THE Prisma_Client SHALL define a `User` model with id (cuid), phone (unique), role (OWNER default), timestamps, and relation to businesses
2. THE Prisma_Client SHALL define a `Customer` model with id (cuid), phoneNumber (unique), optional name, isBlocked flag (default false), timestamps, and relations to bookings, WhatsApp conversations, and legacy sessions
3. THE Prisma_Client SHALL define a `Business` model with id (cuid), ownerId, name, phoneNumber, optional unique routingCode (VarChar 4), hoursOfOperation (JSON), maxConcurrentBookings (default 1), timestamps, and relations to owner, services, bookings, and conversations
4. THE Prisma_Client SHALL define a `Service` model with id (cuid), businessId, name (VarChar 100), optional description (VarChar 500), price (Decimal 10,2), durationMinutes (default 30), isActive flag (default true), timestamps, unique constraint on [businessId, name], and relations to business and booking items
5. THE Prisma_Client SHALL define a `Booking` model with id (cuid), businessId, optional customerId (for walk-ins), status enum (default PENDING), scheduledAt, endAt, totalPrice (Decimal 10,2 default 0), optional paymentMode, optional notes, timestamps, and relations to business, customer, and items
6. THE Prisma_Client SHALL define a `BookingItem` pivot model with id (cuid), bookingId, serviceId, nameSnapshot, priceSnapshot (Decimal 10,2), and relations to booking and service
7. THE Prisma_Client SHALL define a `WhatsAppConversation` model with id (cuid), customerPhone, optional businessId, state (default "GREETING"), contextData (JSON), lastMessageAt, timestamps, unique constraint on [customerPhone, businessId], and relations to customer, business, and messages
8. THE Prisma_Client SHALL define a `WhatsAppMessage` model with id (cuid), conversationId, optional unique whatsappMessageId, direction, messageType, content (JSON), status (default "sent"), timestamp, and relation to conversation
9. THE Prisma_Client SHALL define `BookingStatus` enum with values: PENDING, CONFIRMED, REJECTED, CANCELLED_BY_USER, CANCELLED_BY_SALON, COMPLETED
10. THE Prisma_Client SHALL define `PaymentMode` enum with values: CASH, UPI, OTHER
11. WHEN the schema is pushed to the database, THE Prisma_Client SHALL create indexes on Business.routingCode and Booking[businessId, scheduledAt] for query performance
12. THE Prisma_Client SHALL define `CustomerSession` model for legacy dev tools with customerPhone, optional businessId, currentState, sessionData (JSON), lastMessageAt, expiresAt, and relation to SimulatorMessage
13. THE Prisma_Client SHALL define `SimulatorMessage` model for dev tools with sessionId, unique messageId, fromPhone, toPhone, messageType, content (JSON), timestamp, isFromCustomer, delivered, read flags

### Requirement 3: Zod Validation Schemas

**User Story:** As a developer, I want Zod schemas that mirror the Prisma models, so that I can validate API request payloads at runtime.

#### Acceptance Criteria

1. THE Shared_Types_Package SHALL export Zod schemas for User creation and update operations
2. THE Shared_Types_Package SHALL export Zod schemas for Customer creation and update operations
3. THE Shared_Types_Package SHALL export Zod schemas for Business creation and update operations with routingCode validation (4 digits)
4. THE Shared_Types_Package SHALL export Zod schemas for Service creation and update operations with price validation
5. THE Shared_Types_Package SHALL export Zod schemas for Booking creation with multi-service support (array of service IDs)
6. THE Shared_Types_Package SHALL export Zod schemas for BookingItem with snapshot fields
7. WHEN a Zod schema validates input, THE Shared_Types_Package SHALL return typed output matching the Prisma model structure
8. WHEN parsing a configuration file, THE Shared_Types_Package SHALL validate it against the specified schema (round-trip property)
9. THE Shared_Types_Package SHALL export a pretty printer for Zod validation errors

### Requirement 4: Express API Project Structure

**User Story:** As a developer, I want a well-organized Express.js API project, so that I can build and maintain the backend efficiently.

#### Acceptance Criteria

1. THE Express_API SHALL be located at `apps/api` within the monorepo
2. THE Express_API SHALL use TypeScript with strict mode enabled
3. THE Express_API SHALL import types and Prisma client from `@salex/shared-types`
4. THE Express_API SHALL use environment variables via a configuration module (never direct process.env access)
5. THE Express_API SHALL include a health check endpoint at `GET /health`
6. THE Express_API SHALL follow RESTful conventions with `/api/v1/` prefix for all routes
7. THE Express_API SHALL integrate with Turborepo build system

### Requirement 5: Hybrid Authentication System

**User Story:** As a merchant, I want to authenticate via OTP so that I can securely access my business data, and as a developer, I want a bypass for testing without incurring SMS costs.

#### Acceptance Criteria

1. WHEN a merchant requests OTP via POST /v1/auth/otp/request, THE Express_API SHALL send SMS via Twilio Verify API in production
2. WHEN NODE_ENV is development or phone is whitelisted, THE Express_API SHALL log OTP to console and bypass Twilio
3. WHEN a merchant verifies OTP via POST /v1/auth/otp/verify, THE Express_API SHALL validate the code (via Twilio or mock logic)
4. WHEN OTP verification succeeds, THE Express_API SHALL perform prisma.user.upsert to create or retrieve the merchant record
5. WHEN OTP verification succeeds, THE Express_API SHALL mint a Custom_JWT signed with Supabase Project Secret
6. THE Custom_JWT payload SHALL include `sub: user.id` (UUID from Postgres) for RLS policy enforcement
7. WHEN a request includes a valid Custom_JWT, THE Express_API SHALL extract and validate the user identity
8. WHEN a request lacks valid authentication, THE Express_API SHALL return 401 Unauthorized
9. THE Express_API SHALL provide middleware for protecting routes requiring authentication
10. THE Express_API SHALL support WhatsApp-based customer identification (phone number upsert) for booking endpoints

### Requirement 6: Business Management Endpoints

**User Story:** As a merchant, I want API endpoints to manage my business profile including routing code for WhatsApp discovery, so that customers can find and book with me.

#### Acceptance Criteria

1. WHEN a merchant creates a business via POST /v1/businesses, THE Express_API SHALL validate the request using Zod schemas and create the business record
2. WHEN a merchant requests their business via GET /v1/businesses/me, THE Express_API SHALL return the business with related services
3. WHEN a merchant updates their business via PATCH /v1/businesses/:id, THE Express_API SHALL validate partial updates and persist changes
4. WHEN a business is created without a routing code, THE Express_API SHALL generate a unique 4-digit routing code
5. IF a routing code collision occurs (unique constraint violation), THEN THE Express_API SHALL retry with a new code up to 3 times
6. WHEN a merchant attempts to claim an existing routing code, THE Express_API SHALL return 409 Conflict with message "Routing code taken"
7. WHEN a merchant sets maxConcurrentBookings, THE Express_API SHALL validate it is a positive integer (representing staff/chairs capacity)
8. THE Express_API SHALL support business lookup by routing code for WhatsApp routing (GET /v1/businesses/routing/:code)

### Requirement 7: Service Catalog Endpoints

**User Story:** As a merchant, I want API endpoints to manage my service catalog, so that customers can see what I offer.

#### Acceptance Criteria

1. WHEN a merchant creates a service, THE Express_API SHALL validate the request and create the service linked to their business
2. WHEN a merchant lists services, THE Express_API SHALL return all active services for their business
3. WHEN a merchant updates a service, THE Express_API SHALL validate and persist the changes
4. WHEN a merchant deactivates a service, THE Express_API SHALL set isActive to false (soft delete)
5. THE Express_API SHALL prevent service deletion if active bookings reference it

### Requirement 8: Booking Management with Strict Availability

**User Story:** As a merchant, I want API endpoints to manage bookings with strict availability checking, so that double-bookings are prevented and I can handle customer appointments efficiently.

#### Acceptance Criteria

1. WHEN a booking is created via POST /v1/bookings, THE Express_API SHALL accept an array of service IDs for multi-service bookings (combos)
2. WHEN a booking is created, THE Express_API SHALL create BookingItem records with frozen nameSnapshot and priceSnapshot from current service data
3. WHEN a booking is created, THE Express_API SHALL calculate totalPrice as sum of all BookingItem priceSnapshots
4. WHEN a booking is created, THE Express_API SHALL calculate endAt as scheduledAt plus sum of all service durationMinutes
5. WHEN checking availability, THE Express_API SHALL count overlapping bookings using: `(existing.scheduledAt < requested.endAt AND existing.endAt > requested.scheduledAt)`
6. WHEN overlapping booking count >= business.maxConcurrentBookings, THE Express_API SHALL reject with 409 Conflict
7. WHEN a booking status changes via PATCH /v1/bookings/:id/status, THE Express_API SHALL validate the transition is allowed per state machine
8. THE Express_API SHALL support walk-in bookings with null customerId
9. WHEN a merchant confirms a booking, THE Express_API SHALL update status to CONFIRMED
10. WHEN a booking is PENDING for more than 15 minutes, THE Express_API SHALL support auto-rejection (via cron or on-access check)
11. WHEN a merchant completes checkout via POST /v1/bookings/:id/checkout, THE Express_API SHALL accept modified items array and paymentMode
12. THE Express_API SHALL support manual future bookings with source field to distinguish from WhatsApp bookings

### Requirement 9: WhatsApp Conversation State Management

**User Story:** As a system, I want to track WhatsApp conversation state in the database, so that the chatbot can maintain context across messages without storing state in Node.js memory (stateless API).

#### Acceptance Criteria

1. WHEN a WhatsApp message arrives, THE Express_API SHALL lookup or create a Customer record by phoneNumber (upsert)
2. WHEN a WhatsApp message arrives, THE Express_API SHALL lookup or create a WhatsAppConversation record by customerPhone
3. WHEN a conversation state changes, THE Express_API SHALL update the state field (GREETING, SERVICE_SELECTION, TIME_SELECTION, CONFIRMATION, etc.)
4. WHEN multi-service selections are made, THE Express_API SHALL store them in contextData JSON field (not create booking yet)
5. THE Express_API SHALL support conversation lookup by routing code to associate with a business
6. WHEN a valid routing code is provided, THE Express_API SHALL update conversation.businessId to the matching business
7. WHEN a conversation is inactive for 24 hours (lastMessageAt check), THE Express_API SHALL reset state to "GREETING"
8. WHEN business.isAcceptingOrders is false, THE Express_API SHALL immediately respond with "Shop Closed" template and terminate flow
9. THE Express_API SHALL store WhatsAppMessage records for audit trail with direction, messageType, content, and status

### Requirement 10: WhatsApp Simulator for Development Testing

**User Story:** As a developer, I want a WhatsApp simulator that mimics the real WhatsApp Cloud API webhook format, so that I can test the complete booking flow end-to-end without using the actual WhatsApp API.

#### Acceptance Criteria

1. THE Express_API SHALL provide a simulator endpoint at POST /v1/whatsapp-simulator/send that accepts customer messages
2. WHEN a simulator message is sent, THE Express_API SHALL create a webhook payload matching the WhatsApp Cloud API format
3. THE Express_API SHALL process simulator messages through the same conversation service as real webhooks
4. THE Express_API SHALL provide a polling endpoint at GET /v1/whatsapp-simulator/poll to retrieve bot responses
5. THE Express_API SHALL store simulator messages in CustomerSession and SimulatorMessage tables for dev tools
6. THE Express_API SHALL provide GET /v1/whatsapp-simulator/businesses/search/:code to find businesses by routing code
7. THE Express_API SHALL provide GET /v1/whatsapp-simulator/conversations/:customerPhone to debug conversation state
8. THE Express_API SHALL provide GET /v1/whatsapp-simulator/health to check simulator status
9. WHEN x-simulator-mode header is present, THE Express_API SHALL bypass actual WhatsApp API calls and use simulator storage

### Requirement 11: WhatsApp Webhook Security and Processing

**User Story:** As a system, I want to securely receive and process WhatsApp webhook events, so that customer messages are handled reliably.

#### Acceptance Criteria

1. WHEN Meta sends a webhook verification request (GET), THE Express_API SHALL respond with the hub.challenge if hub.verify_token matches
2. WHEN Meta sends a message webhook (POST), THE Express_API SHALL verify X-Hub-Signature-256 header using App Secret
3. IF webhook signature verification fails, THEN THE Express_API SHALL drop the request immediately (no processing)
4. WHEN a valid webhook arrives, THE Express_API SHALL extract wa_id (customer phone) from the payload
5. WHEN sending messages outside 24-hour window (lastMessageAt > 24 hours), THE Express_API SHALL use Template Message API instead of Free Text API
6. THE Express_API SHALL support webhook endpoint at POST /v1/webhooks/whatsapp

### Requirement 12: Error Handling and Validation

**User Story:** As a developer, I want consistent error handling with correlation IDs, so that API consumers receive predictable error responses and issues can be debugged.

#### Acceptance Criteria

1. WHEN a Zod validation fails, THE Express_API SHALL return 400 Bad Request with detailed field errors
2. WHEN a resource is not found, THE Express_API SHALL return 404 Not Found with resource identifier
3. WHEN a database unique constraint violation occurs (e.g., routing code), THE Express_API SHALL return 409 Conflict with context
4. WHEN a business rule violation occurs (e.g., invalid status transition), THE Express_API SHALL return 422 Unprocessable Entity
5. IF an unexpected error occurs, THEN THE Express_API SHALL return 500 Internal Server Error without exposing internals
6. THE Express_API SHALL include correlationId in all error responses for log correlation
7. THE Express_API SHALL log all errors with correlationId, timestamp, and stack trace (in non-production)


### Requirement 13: Supabase Realtime Integration

**User Story:** As a merchant, I want to receive real-time booking notifications without refreshing the app, so that I can respond to customer requests immediately.

#### Acceptance Criteria

1. THE Express_API SHALL NOT emit socket events directly; Supabase Realtime handles this via Postgres WAL
2. WHEN a booking is inserted/updated, Supabase SHALL detect the change and push to subscribed clients
3. THE Custom_JWT with `sub: user.id` SHALL enable RLS policies to filter notifications to business owners only
4. THE Mobile App SHALL subscribe to Supabase Realtime channel for bookings table filtered by businessId
5. WHEN a new PENDING booking arrives, THE Mobile App SHALL display a notification card without manual refresh

### Requirement 14: Dynamic Checkout and Revenue Tracking

**User Story:** As a merchant, I want to modify booking items at checkout and track payment method, so that I can handle real-world service changes and reconcile revenue.

#### Acceptance Criteria

1. WHEN a merchant initiates checkout via POST /v1/bookings/:id/checkout, THE Express_API SHALL accept modified items array
2. THE Express_API SHALL allow removing original services and adding new services/products at checkout
3. THE Express_API SHALL recalculate totalPrice based on final items
4. THE Express_API SHALL accept paymentMode (CASH, UPI, OTHER) at checkout
5. WHEN checkout completes, THE Express_API SHALL set booking status to COMPLETED
6. THE Express_API SHALL preserve BookingItem snapshots for financial audit trail
