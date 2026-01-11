# Implementation Plan: Backend Migration

## Overview

This implementation plan covers the migration from the legacy NestJS backend to a modern Express.js + Supabase Cloud architecture. The plan follows an incremental approach, starting with proper monorepo structure and Supabase Cloud database configuration, then building the shared-types package, followed by the Express API layer by layer.

## Tasks

- [x] 1. Initialize Salex Monorepo Foundation
  - [x] 1.1 Create root monorepo configuration
    - Create root package.json with npm workspaces configuration
    - Create turbo.json with pipeline config (build, lint, test, dev)
    - Create .gitignore for Node/Env ignores
    - Configure workspaces: ["packages/*", "apps/*"]
    - _Requirements: 1.1_
    - **COMPLETED**: Updated existing turbo.json with db:generate and db:studio tasks

  - [x] 1.2 Set up packages/shared-types structure
    - Create packages/shared-types/package.json with name "@salex/shared-types"
    - Create packages/shared-types/tsconfig.json with strict mode
    - Create packages/shared-types/prisma/ directory
    - Create packages/shared-types/src/ directory
    - Add dependencies: @prisma/client, zod
    - Add devDependencies: prisma, typescript
    - Configure build script: "prisma generate && tsc"
    - Configure db:push script: "prisma db push"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
    - **COMPLETED**: Updated package.json to @salex/shared-types with Prisma and Zod

  - [x] 1.3 Set up apps/api structure
    - Create apps/api/package.json with Express dependencies
    - Create apps/api/tsconfig.json with strict mode
    - Create apps/api/.env.example with all required variables
    - Create apps/api/src/ directory structure:
      - src/app.ts (Express app setup)
      - src/server.ts (Entry point, port listening)
      - src/config/ (Env config with Zod validation)
      - src/controllers/ (HTTP layer)
      - src/services/ (Business logic layer)
      - src/middlewares/ (Auth, error handling, logging)
      - src/routes/ (Route definitions)
      - src/utils/ (Shared utilities, logger)
    - Add @salex/shared-types as workspace dependency
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
    - **COMPLETED**: Created full Express.js API structure with all directories

- [x] 2. Configure Supabase Cloud and Prisma schema
  - [x] 2.1 Set up Supabase Cloud environment variables
    - Create packages/shared-types/.env with DATABASE_URL (Connection Pooler, port 6543)
    - Create packages/shared-types/.env with DIRECT_URL (Direct Connection, port 5432)
    - Verify connection pooler uses `pgbouncer=true&connection_limit=1`
    - _Requirements: 2.1, 2.2, 2.3_
    - **COMPLETED**: Created .env.example with proper Supabase Cloud configuration

  - [x] 2.2 Create comprehensive Prisma schema
    - Configure datasource with `url` (DATABASE_URL) and `directUrl` (DIRECT_URL)
    - Define User model with id (cuid), phone (unique), role (OWNER default), timestamps
    - Define Customer model with phoneNumber (unique), name, isBlocked, timestamps
    - Define Business model with routingCode (unique VarChar 4), maxConcurrentBookings, hoursOfOperation (JSON)
    - Define Service model with price (Decimal 10,2), durationMinutes, isActive, unique [businessId, name]
    - Define Booking model with status enum, scheduledAt, endAt, totalPrice, paymentMode
    - Define BookingItem pivot with nameSnapshot, priceSnapshot
    - Define WhatsAppConversation with state, contextData (JSON), lastMessageAt
    - Define WhatsAppMessage with direction, messageType, content (JSON)
    - Define CustomerSession and SimulatorMessage for dev tools
    - Define enums: BookingStatus, PaymentMode
    - Add indexes on Business.routingCode and Booking[businessId, scheduledAt]
    - _Requirements: 1.8, 1.9, 2.4, 2.5, 3.1-3.13_
    - **COMPLETED**: Created comprehensive schema.prisma with all models

  - [x] 2.3 Create Prisma client singleton and exports
    - Create packages/shared-types/src/db.ts with singleton Prisma instance
    - Create packages/shared-types/src/index.ts exporting PrismaClient and types
    - _Requirements: 1.7_
    - **COMPLETED**: Created db.ts singleton and updated index.ts exports

  - [x] 2.4 Generate Prisma client and push schema to Supabase Cloud
    - Run prisma generate to create client
    - Run prisma db push to sync with Supabase Cloud (uses DIRECT_URL)
    - Verify tables created in Supabase dashboard
    - _Requirements: 2.4, 2.5_
    - **COMPLETED**: Schema pushed to Supabase Cloud successfully

- [x] 3. Create Zod validation schemas
  - [x] 3.1 Implement core Zod schemas
    - Create packages/shared-types/src/schemas/user.schema.ts (OTP request/verify)
    - Create packages/shared-types/src/schemas/customer.schema.ts
    - Create packages/shared-types/src/schemas/business.schema.ts (routingCode 4 digits regex)
    - Create packages/shared-types/src/schemas/service.schema.ts (price positive)
    - Create packages/shared-types/src/schemas/booking.schema.ts (serviceIds array)
    - Create packages/shared-types/src/schemas/conversation.schema.ts
    - Create packages/shared-types/src/schemas/index.ts barrel export
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
    - **COMPLETED**: Created all Zod schemas with proper validation

  - [ ]* 3.2 Write property test for Zod schema round-trip
    - **Property 1: Zod Schema Round-Trip Consistency**
    - **Validates: Requirements 4.7, 4.8**

  - [ ]* 3.3 Write property test for Zod validation correctness
    - **Property 2: Zod Schema Validation Correctness**
    - **Validates: Requirements 4.3, 4.4, 4.5**

  - [x] 3.4 Create Zod error pretty printer utility
    - Create packages/shared-types/src/utils/format-zod-errors.ts
    - Export formatZodErrors function
    - _Requirements: 4.9_
    - **COMPLETED**: Created format-zod-errors.ts with formatZodErrors, getZodErrorMessages, getFirstZodError

- [x] 4. Checkpoint - Foundation complete
  - Verify monorepo structure is correct ✓
  - Ensure prisma generate succeeds ✓
  - Ensure prisma db push creates tables in Supabase Cloud ✓
  - Ensure all Zod schemas export correctly ✓
  - Verify apps/api can import from @salex/shared-types ✓
  - Ask the user if questions arise
  - **STATUS**: Foundation complete! All Phase 1 tasks done. Ready for Phase 2 (Express API configuration)

- [x] 5. Set up Express API base configuration
  - [x] 5.1 Create configuration module with Zod validation
    - Create apps/api/src/config/index.ts
    - Implement AppConfig interface with all environment variables
    - Validate required env vars: DATABASE_URL, SUPABASE_URL, SUPABASE_JWT_SECRET
    - Support development/production/test modes
    - _Requirements: 5.4_
    - **COMPLETED**: Created config/index.ts with Zod validation

  - [x] 5.2 Create Express app setup
    - Create apps/api/src/app.ts with Express configuration
    - Configure JSON body parser, CORS, Helmet middleware
    - Set up /api/v1 route prefix
    - Create health check endpoint at GET /health
    - _Requirements: 5.5, 5.6_
    - **COMPLETED**: Created app.ts with all middleware

  - [x] 5.3 Create server entry point
    - Create apps/api/src/server.ts
    - Import app from app.ts
    - Start server on configured port
    - Add graceful shutdown handling
    - _Requirements: 5.1_
    - **COMPLETED**: Created server.ts with graceful shutdown

- [x] 6. Implement authentication system
  - [x] 6.1 Create auth service with hybrid OTP
    - Create apps/api/src/services/auth.service.ts
    - Implement OTP request with Twilio Verify API (production)
    - Implement mock OTP for development (console log, magic code 123456)
    - Implement phone whitelist check for dev bypass
    - Implement OTP verification logic
    - _Requirements: 6.1, 6.2_
    - **COMPLETED**: Created auth.service.ts, otp.service.ts, twilio.service.ts

  - [x] 6.2 Implement Custom JWT minting
    - Create JWT with payload {sub: user.id}
    - Sign with SUPABASE_JWT_SECRET
    - Implement user upsert on successful verification
    - Return token and user data
    - _Requirements: 6.3, 6.4, 6.5, 6.6_
    - **COMPLETED**: Created token.service.ts with Supabase RLS-compatible JWT

  - [x] 6.3 Create auth middleware for JWT validation
    - Create apps/api/src/middlewares/auth.middleware.ts
    - Extract Bearer token from Authorization header
    - Verify JWT signature with SUPABASE_JWT_SECRET
    - Extract userId from sub claim
    - Attach AuthContext to request
    - Return 401 for invalid/missing tokens
    - _Requirements: 6.7, 6.8, 6.9_
    - **COMPLETED**: Created auth.middleware.ts with authMiddleware and optionalAuthMiddleware

  - [ ]* 6.4 Write property test for authentication behavior
    - **Property 3: Hybrid Authentication Behavior**
    - **Property 4: Authentication Middleware Behavior**
    - **Validates: Requirements 6.1-6.8**

  - [x] 6.5 Create auth routes and controller
    - Create apps/api/src/controllers/auth.controller.ts
    - Create apps/api/src/routes/auth.routes.ts
    - POST /v1/auth/otp/request
    - POST /v1/auth/otp/verify
    - _Requirements: 6.1, 6.3_
    - **COMPLETED**: Created auth.controller.ts and auth.routes.ts with all endpoints

- [x] 7. Checkpoint - Authentication complete
  - Test OTP flow in development mode
  - Verify JWT contains correct sub claim
  - Ensure protected routes return 401 without token
  - Ask the user if questions arise

- [x] 8. Implement business management
  - [x] 8.1 Create routing code service
    - Create apps/api/src/services/routing-code.service.ts
    - Generate random 4-digit codes
    - Check uniqueness against database
    - Implement retry logic (up to 3 attempts)
    - _Requirements: 7.4, 7.5_

  - [x] 8.2 Create business service
    - Create apps/api/src/services/business.service.ts
    - Implement create with optional routing code generation
    - Implement getByOwnerId with services relation
    - Implement update with partial validation
    - Implement getByRoutingCode for WhatsApp routing
    - Handle unique constraint violations (409 Conflict)
    - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.7, 7.8_

  - [ ]* 8.3 Write property test for routing code uniqueness
    - **Property 5: Routing Code Generation Uniqueness**
    - **Property 6: Routing Code Collision Handling**
    - **Validates: Requirements 7.4, 7.5, 7.6**

  - [x] 8.4 Create business routes and controller
    - Create apps/api/src/controllers/business.controller.ts
    - Create apps/api/src/routes/business.routes.ts
    - POST /v1/businesses (protected)
    - GET /v1/businesses/me (protected)
    - PATCH /v1/businesses/:id (protected)
    - GET /v1/businesses/routing/:code (public for WhatsApp)
    - _Requirements: 7.1, 7.2, 7.3, 7.8_

  - [ ]* 8.5 Write property test for business retrieval
    - **Property 7: Business Retrieval Includes Services**
    - **Validates: Requirements 7.2**

- [x] 9. Implement service catalog
  - [x] 9.1 Create service service
    - Create apps/api/src/services/service.service.ts
    - Implement create with business ownership validation
    - Implement list with isActive filter
    - Implement update with validation
    - Implement soft delete (set isActive = false)
    - Implement deletion protection (check active bookings)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 9.2 Write property tests for service operations
    - **Property 8: Service Listing Active Filter**
    - **Property 9: Service Soft Delete Invariant**
    - **Property 10: Service Deletion Protection**
    - **Validates: Requirements 8.2, 8.4, 8.5**

  - [x] 9.3 Create service routes and controller
    - Create apps/api/src/controllers/service.controller.ts
    - Create apps/api/src/routes/service.routes.ts
    - POST /v1/businesses/:businessId/services (protected)
    - GET /v1/businesses/:businessId/services (protected)
    - PATCH /v1/services/:id (protected)
    - DELETE /v1/services/:id (protected, soft delete)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 10. Checkpoint - Business and service management complete
  - Test business creation with auto-generated routing code
  - Test service CRUD operations
  - Verify soft delete behavior
  - Ask the user if questions arise

- [x] 11. Implement booking system with availability engine
  - [x] 11.1 Create availability engine
    - Create apps/api/src/services/availability.service.ts
    - Implement overlap detection query
    - Use formula: (existing.scheduledAt < requested.endAt) AND (existing.endAt > requested.scheduledAt)
    - Count overlapping PENDING and CONFIRMED bookings
    - Compare against maxConcurrentBookings
    - _Requirements: 9.5, 9.6_
    - **COMPLETED**: Created availability.service.ts with checkAvailability and getOverlappingBookings

  - [x] 11.2 Create booking service
    - Create apps/api/src/services/booking.service.ts
    - Implement create with multi-service support
    - Calculate endAt from scheduledAt + sum of durations
    - Calculate totalPrice from sum of service prices
    - Create BookingItems with nameSnapshot and priceSnapshot
    - Integrate availability check before creation
    - Support walk-in bookings (null customerId)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.8_
    - **COMPLETED**: Created booking.service.ts with create, getById, listByBusinessId, updateStatus, checkout

  - [ ]* 11.3 Write property test for booking creation invariants
    - **Property 11: Booking Creation Invariants (Price Snapshots)**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [ ]* 11.4 Write property test for availability engine
    - **Property 12: Strict Availability Engine (Overlap Detection)**
    - **Validates: Requirements 9.5, 9.6**

  - [x] 11.5 Implement booking status transitions
    - Define valid transitions state machine
    - Validate transition before update
    - Return 422 for invalid transitions
    - _Requirements: 9.7_
    - **COMPLETED**: Status transitions validated in updateStatus method

  - [ ]* 11.6 Write property test for status transitions
    - **Property 13: Booking Status Transition Validity**
    - **Validates: Requirements 9.7**

  - [x] 11.7 Implement checkout flow
    - Accept modified items array
    - Delete old BookingItems, create new ones with fresh snapshots
    - Recalculate totalPrice
    - Set paymentMode and status = COMPLETED
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
    - **COMPLETED**: Checkout method with item modification and price recalculation

  - [ ]* 11.8 Write property test for checkout invariants
    - **Property 23: Dynamic Checkout Invariants**
    - **Validates: Requirements 15.1-15.5**

  - [x] 11.9 Create booking routes and controller
    - Create apps/api/src/controllers/booking.controller.ts
    - Create apps/api/src/routes/booking.routes.ts
    - POST /v1/bookings (protected)
    - GET /v1/bookings (protected, filtered by businessId)
    - PATCH /v1/bookings/:id/status (protected)
    - POST /v1/bookings/:id/checkout (protected)
    - _Requirements: 9.1, 9.7, 15.1_
    - **COMPLETED**: Created controller and routes with all endpoints

- [x] 12. Checkpoint - Booking system complete
  - Test multi-service booking creation
  - Verify price snapshots are frozen
  - Test availability rejection with concurrent bookings
  - Test checkout flow with item modification
  - Ask the user if questions arise

- [x] 13. Implement WhatsApp conversation management
  - [x] 13.1 Create conversation service
    - Create apps/api/src/services/conversation.service.ts
    - Implement customer upsert by phoneNumber
    - Implement conversation upsert by customerPhone
    - Implement state update with contextData
    - Implement routing code association
    - Implement 24-hour timeout reset
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
    - **COMPLETED**: Full state machine with GREETING → AWAITING_ROUTING_CODE → SERVICE_SELECTION → TIME_SELECTION → CONFIRMATION → COMPLETED

  - [ ]* 13.2 Write property tests for conversation management
    - **Property 15: Customer Upsert Behavior**
    - **Property 16: Conversation Upsert Behavior**
    - **Property 17: Conversation State Persistence**
    - **Property 18: Conversation Routing Code Association**
    - **Property 19: Conversation Timeout Reset**
    - **Validates: Requirements 10.1-10.7**

  - [x] 13.3 Create WhatsApp message storage
    - Store inbound and outbound messages in WhatsAppMessage table
    - Track message status (sent, delivered, read)
    - _Requirements: 10.9_
    - **COMPLETED**: Messages stored via simulator-message.service.ts

- [x] 14. Implement WhatsApp Simulator for Development Testing
  - [x] 14.1 Create simulator message store service
    - Create apps/api/src/services/simulator-message.service.ts
    - Store messages in CustomerSession and SimulatorMessage tables
    - Implement getMessagesSince(customerPhone, since) for polling
    - Implement storeOutgoingResponse for bot replies
    - _Requirements: 11.5_
    - **COMPLETED**: Full message storage with polling support

  - [x] 14.2 Create webhook enhancer service
    - Create apps/api/src/services/webhook-enhancer.service.ts
    - Implement createSimulatorWebhookPayload() matching WhatsApp Cloud API format
    - Include entry[0].changes[0].value.messages[0] structure
    - Generate proper message IDs and timestamps
    - _Requirements: 11.2, 11.3_
    - **COMPLETED**: Full WhatsApp Cloud API format support

  - [ ]* 14.3 Write property test for simulator webhook format
    - **Property 21: Simulator Webhook Payload Format**
    - **Validates: Requirements 11.2, 11.3**

  - [x] 14.4 Create simulator controller and routes
    - Create apps/api/src/controllers/simulator.controller.ts
    - Create apps/api/src/routes/simulator.routes.ts
    - POST /v1/whatsapp-simulator/send - Send customer message
    - POST /v1/whatsapp-simulator/send-interactive - Send interactive reply
    - GET /v1/whatsapp-simulator/poll - Poll for bot responses
    - GET /v1/whatsapp-simulator/businesses/search/:code - Find business by routing code
    - GET /v1/whatsapp-simulator/conversations/:customerPhone - Debug conversation state
    - GET /v1/whatsapp-simulator/health - Simulator health check
    - POST /simulate-webhooks/whatsapp - Legacy webhook for Mock UI
    - _Requirements: 11.1, 11.4, 11.6, 11.7, 11.8_
    - **COMPLETED**: All endpoints implemented and tested

  - [ ]* 14.5 Write property test for simulator polling
    - **Property 22: Simulator Message Polling**
    - **Validates: Requirements 11.4**

  - [x] 14.6 Create simulator middleware
    - Simulator mode detection via isSimulatorMode() config helper
    - Routes to simulator message store
    - _Requirements: 11.9_
    - **COMPLETED**: Integrated into config and controller

- [ ] 15. Implement WhatsApp webhook handling (Production)
  - [ ] 15.1 Create webhook middleware for signature verification
    - Create apps/api/src/middlewares/webhook.middleware.ts
    - Extract X-Hub-Signature-256 header
    - Compute HMAC-SHA256 of raw body with App Secret
    - Compare signatures (timing-safe)
    - Drop request if verification fails
    - _Requirements: 12.2, 12.3_

  - [ ]* 15.2 Write property test for webhook signature verification
    - **Property 20: WhatsApp Webhook Signature Verification**
    - **Validates: Requirements 12.2, 12.3**

  - [ ] 15.3 Create webhook controller and routes
    - Create apps/api/src/controllers/webhook.controller.ts
    - Create apps/api/src/routes/webhook.routes.ts
    - Handle GET for Meta verification challenge
    - Handle POST for incoming messages
    - Extract wa_id (customer phone) from payload
    - Route to conversation service
    - _Requirements: 12.1, 12.4, 12.6_

  - [ ] 15.4 Create WhatsApp API client service
    - Create apps/api/src/services/whatsapp.service.ts
    - Implement sendTextMessage for free text
    - Implement sendTemplateMessage for 24hr+ window
    - Check lastMessageAt to determine message type
    - _Requirements: 12.5_

- [ ] 16. Checkpoint - WhatsApp integration complete
  - Test simulator end-to-end flow with WhatsappMockUI/
  - Test conversation state machine transitions
  - Verify simulator produces same results as production webhook format
  - Ask the user if questions arise

- [ ] 17. Implement global error handling
  - [ ] 17.1 Create custom error classes
    - Create apps/api/src/utils/errors.ts
    - NotFoundError, ConflictError, BusinessRuleError, UnauthorizedError

  - [ ] 17.2 Create error middleware
    - Create apps/api/src/middlewares/error.middleware.ts
    - Handle ZodError → 400 with field details
    - Handle NotFoundError → 404 with resource identifier
    - Handle PrismaClientKnownRequestError (unique constraint) → 409
    - Handle BusinessRuleError → 422
    - Handle unknown errors → 500 without internals
    - Generate and include correlationId in all responses
    - Log errors with correlationId
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [ ]* 17.3 Write property test for error response consistency
    - **Property 24: Error Response Consistency**
    - **Validates: Requirements 13.1-13.6**

- [ ] 18. Integration testing and wiring
  - [ ] 18.1 Wire all routes together
    - Update apps/api/src/routes/index.ts
    - Aggregate all routes (auth, business, service, booking, simulator, webhook)
    - Apply auth middleware to protected routes
    - Apply validation middleware with Zod schemas
    - Apply error middleware globally

  - [ ] 18.2 Create integration test setup
    - Configure test database
    - Set up transaction rollback for isolation
    - Create test fixtures for common entities

  - [ ]* 18.3 Write integration tests for complete flows
    - Test merchant onboarding flow (OTP → business creation → service setup)
    - Test WhatsApp booking flow via simulator (greeting → routing → service selection → time → confirmation)
    - Test checkout flow with item modification
    - Test availability rejection scenarios

- [ ] 19. Final checkpoint - Backend migration complete
  - Run full test suite (unit + property + integration)
  - Verify all endpoints respond correctly
  - Test with WhatsApp Mock UI end-to-end
  - Test with MerchantAppExpo frontend
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases

**Supabase Cloud Configuration:**
- DATABASE_URL uses Connection Pooler (port 6543) with `pgbouncer=true&connection_limit=1` for runtime queries
- DIRECT_URL uses Direct Connection (port 5432) for migrations and schema changes
- Prisma automatically uses DIRECT_URL for `prisma db push` and `prisma migrate`
- SUPABASE_JWT_SECRET is used for signing Custom JWTs for RLS policy enforcement

**Availability Engine:**
- Uses the overlap formula: `(existing.start < requested.end) AND (existing.end > requested.start)`
- Counts overlapping PENDING and CONFIRMED bookings against maxConcurrentBookings

**Price Snapshots:**
- Immutable once created - preserve the price at booking time regardless of future price changes
- Stored in BookingItem.priceSnapshot and BookingItem.nameSnapshot

**WhatsApp Simulator:**
- Task 13 implements the simulator for end-to-end testing without the actual WhatsApp API
- Creates webhook payloads matching the WhatsApp Cloud API format exactly
- The conversation service processes simulator messages identically to production webhooks
- Test with the existing WhatsappMockUI/ browser interface
- Stores messages in CustomerSession and SimulatorMessage tables

**Production WhatsApp:**
- When ready for production, the same conversation service handles real WhatsApp webhooks
- Webhook signature verification using X-Hub-Signature-256 header
- 24-hour message window handling (Template vs Free Text API)
