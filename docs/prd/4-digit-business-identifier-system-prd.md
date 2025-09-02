# 4-Digit Business Identifier System Product Requirements Document (PRD)

## 1. Goals and Background Context

### Goals

* Enable customer discovery of businesses via intuitive 4-digit codes (e.g., "BOOK_AT_S1234")
* Establish the foundational routing system for WhatsApp-based smart booking workflows
* Provide business owners with simple, memorable identifiers that customers can easily share and remember
* Create a scalable infrastructure for regional business identification that supports 5,000+ businesses
* Lay the groundwork for seamless WhatsApp integration where customers can initiate bookings via "S1234" messages

### Background Context

The current Salex platform successfully manages salon appointments through a comprehensive backend system with mobile app integration. However, customer acquisition and initial booking initiation still require complex discovery mechanisms. The 4-digit business identifier system addresses this gap by creating a simple, memorable way for customers to find and book with specific businesses.

This system serves as the critical foundation for the planned WhatsApp smart routing functionality, where customers will be able to initiate bookings by simply sending "S1234" or "BOOK_AT_S1234" to a WhatsApp number. This enhancement transforms the booking experience from app-dependent discovery to instant, memorable access - aligning with our core goal of "three clicks or less" booking via WhatsApp.

The regional scope approach (non-global) allows for efficient code reuse across different geographic markets while maintaining manageable namespace sizes for initial rollout.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-08-02 | 1.0 | Initial PRD for 4-digit business identifier system | Claude (PM Agent) |

## 2. Requirements

### Functional Requirements

**FR1**: Business owners must be able to set a 4-digit numeric routing code (format: 1000-9999) for their business through the merchant mobile app.

**FR2**: The system must enforce one-time-only code assignment - once set, a business cannot change its routing code.

**FR3**: The system must validate code uniqueness within regional scope and prevent duplicate assignments.

**FR4**: When a preferred code is unavailable, the system must provide intelligent suggestions using multiple algorithms (similar numbers, lucky numbers, business-relevant patterns).

**FR5**: Customers must be able to discover businesses by entering a 4-digit code through a lookup API endpoint.

**FR6**: The system must maintain a routing_code field in the Business database model for persistent storage.

**FR7**: The routing code assignment interface must include clear messaging about the permanent nature of the selection.

**FR8**: The system must support efficient searching of businesses by routing code for customer discovery workflows.

**FR9**: The system must validate routing code format (exactly 4 digits, numeric only, within 1000-9999 range).

**FR10**: The system must provide business owners with preview of how their code will appear in customer-facing contexts (e.g., "S1234").

### Non-Functional Requirements

**NFR1**: Routing code lookup queries must complete within 200ms for real-time customer discovery.

**NFR2**: The system must support 5,000 concurrent business routing codes within regional scope.

**NFR3**: Code assignment API must have 99.9% availability to prevent business setup interruptions.

**NFR4**: The routing code database field must be properly indexed for fast lookup performance.

**NFR5**: All routing code operations must be logged for audit and troubleshooting purposes.

**NFR6**: The suggestion algorithm must provide alternatives within 3 seconds of detecting unavailable codes.

## 3. User Interface Design Goals

### Overall UX Vision

The routing code assignment experience should feel like claiming a personalized phone number - simple, permanent, and valuable. The interface emphasizes the significance and permanence of the choice while providing helpful guidance and alternatives.

### Key Interaction Paradigms

- **One-Time Setup Flow**: Clear, wizard-style progression through code selection process
- **Real-Time Validation**: Immediate feedback on code availability as user types
- **Smart Suggestions**: Contextual alternatives presented when preferred codes are unavailable
- **Confirmation Patterns**: Multiple confirmation steps for permanent decisions

### Core Screens and Views

- **Routing Code Setup Screen**: Primary interface for code selection with real-time validation
- **Code Suggestion Screen**: Alternative options when preferred code is taken
- **Confirmation Screen**: Final review and permanent assignment confirmation
- **Business Profile Integration**: Display of assigned routing code in business profile settings

### Accessibility: WCAG AA

Standard mobile accessibility compliance with proper focus management, screen reader support, and color contrast ratios.

### Branding

Follow existing Salex mobile app design patterns with React Native Paper components. Use accent colors to highlight the special nature of routing code assignment.

### Target Device and Platforms: Mobile Only

React Native implementation targeting both iOS and Android platforms through the existing MerchantApp structure.

## 4. Technical Assumptions

### Repository Structure: Monorepo

Continue using the existing turbo/pnpm monorepo structure with shared-types package for cross-platform type consistency.

### Service Architecture

Extend the existing NestJS monolith with new routing code management modules. This enhancement integrates with existing business management services rather than requiring separate microservices.

### Testing Requirements

Full testing pyramid implementation:
- Unit tests for routing code validation and suggestion algorithms
- Integration tests for API endpoints and database operations
- E2E tests for mobile app routing code assignment flow
- Manual testing scripts for edge cases and user experience validation

### Additional Technical Assumptions and Requests

- **Database Migration Strategy**: Implement schema migration to add routing_code field to existing Business table
- **Regional Scope Implementation**: Use environment configuration to define regional code namespaces
- **Algorithm Performance**: Implement efficient suggestion algorithms that can generate alternatives within 100ms
- **Caching Strategy**: Implement Redis caching for frequently accessed routing code lookups
- **Integration Points**: Design API endpoints to support future WhatsApp webhook integration

## 5. Epic List

**Epic 1: Core Routing Code Infrastructure**: Establish database schema, validation logic, and foundational API endpoints for routing code management.

**Epic 2: Business Code Assignment Experience**: Create mobile app interface for business owners to select and assign routing codes with intelligent suggestions.

**Epic 3: Customer Discovery & Lookup System**: Implement customer-facing APIs and infrastructure for business discovery via routing codes.

## 6. Epic 1: Core Routing Code Infrastructure

**Epic Goal**: Establish the foundational technical infrastructure for 4-digit business routing codes, including database schema updates, validation logic, and core API endpoints that will support both business assignment and customer discovery workflows.

### Story 1.8: Database Schema Enhancement for Routing Codes

**As a** system administrator, **I want** the Business database model to include routing code storage capabilities, **so that** businesses can be uniquely identified by 4-digit codes.

#### Acceptance Criteria
1. A new `routing_code` field is added to the Business table as an optional varchar(4) field
2. A unique constraint is applied to the routing_code field to prevent duplicates
3. A database index is created on routing_code for fast lookup performance
4. The shared-types package is updated with routing code field in Business interface
5. Database migration script successfully updates existing businesses with null routing_code values
6. All existing API endpoints continue to function without breaking changes

### Story 1.9: Routing Code Validation Service

**As a** backend developer, **I want** centralized routing code validation logic, **so that** all code assignments follow consistent business rules.

#### Acceptance Criteria
1. A RoutingCodeService is created within the business module for validation operations
2. Code format validation enforces exactly 4 numeric digits within 1000-9999 range
3. Uniqueness validation checks against existing business routing codes in the database
4. Regional scope validation is implemented (configurable via environment variables)
5. Invalid format attempts return specific error messages for user guidance
6. Duplicate code attempts return availability status with suggested alternatives
7. All validation functions include comprehensive unit test coverage

### Story 1.10: Routing Code Assignment API Endpoint

**As a** business owner, **I want** to assign a routing code to my business via API, **so that** customers can discover my business using the 4-digit identifier.

#### Acceptance Criteria
1. A new `PUT /api/v1/businesses/{businessId}/routing-code` endpoint is implemented
2. The endpoint is protected with ClerkAuthGuard authentication
3. Business ownership validation ensures only owners can set their routing codes
4. One-time assignment enforcement prevents code changes after initial assignment
5. Successful assignment returns updated business profile with routing code
6. Error responses provide clear guidance for validation failures
7. The endpoint logs all assignment attempts for audit purposes

## 7. Epic 2: Business Code Assignment Experience

**Epic Goal**: Create an intuitive mobile app experience for business owners to select, validate, and permanently assign their 4-digit routing codes, including smart suggestion algorithms and clear confirmation workflows.

### Story 1.11: Routing Code Selection Interface

**As a** business owner, **I want** to select my preferred 4-digit routing code through the mobile app, **so that** customers can easily find and book with my business.

#### Acceptance Criteria
1. A new "Routing Code Setup" screen is accessible from business profile settings
2. The interface displays a 4-digit input field with real-time format validation
3. Code availability is checked immediately as the user types (debounced)
4. Visual feedback clearly indicates available vs. unavailable codes
5. The interface explains the permanent nature of routing code assignment
6. Clear examples show how the code will appear to customers (e.g., "S1234")
7. The interface prevents submission of invalid or unavailable codes

### Story 1.12: Smart Code Suggestion Algorithm

**As a** business owner, **I want** intelligent alternative suggestions when my preferred code is taken, **so that** I can quickly find an acceptable routing code.

#### Acceptance Criteria
1. When a preferred code is unavailable, the system presents 5-8 alternative suggestions
2. Suggestion algorithms include: similar numeric patterns, sequential variants, and lucky number patterns
3. All suggested codes are verified as available before presentation
4. Suggestions are generated and displayed within 3 seconds of unavailability detection
5. Business owners can easily select from suggestions or try a different custom code
6. The suggestion system logs selection patterns for algorithm improvement
7. Fallback suggestions ensure business owners always have available options

### Story 1.13: Routing Code Confirmation and Assignment

**As a** business owner, **I want** to confirm my routing code selection with clear understanding of permanence, **so that** I make an informed decision about my business identifier.

#### Acceptance Criteria
1. A confirmation screen clearly displays the selected routing code and its permanence
2. The confirmation includes preview of customer-facing format ("Book at S1234")
3. Multiple confirmation steps prevent accidental assignment
4. Clear warning text explains that the code cannot be changed after assignment
5. Successful assignment updates the business profile and returns to main settings
6. Assignment failure provides clear error messages and returns to selection interface
7. The business profile displays the assigned routing code prominently after assignment

## 8. Epic 3: Customer Discovery & Lookup System

**Epic Goal**: Implement customer-facing APIs and infrastructure that enable business discovery via 4-digit routing codes, establishing the foundation for WhatsApp smart routing and customer booking initiation workflows.

### Story 1.14: Business Lookup API Implementation

**As a** customer or external system, **I want** to discover businesses by their routing codes, **so that** I can initiate booking processes with the correct business.

#### Acceptance Criteria
1. A new `GET /api/v1/businesses/lookup/{routingCode}` endpoint is implemented
2. The endpoint returns business profile information for valid routing codes
3. Invalid or non-existent routing codes return appropriate 404 responses
4. Response includes essential business information: name, address, services overview
5. The endpoint supports high-performance lookup with proper caching
6. Rate limiting protects against abuse while allowing legitimate customer usage
7. Response format is optimized for future WhatsApp webhook integration

### Story 1.15: Routing Code Discovery Validation

**As a** system administrator, **I want** comprehensive validation of the routing code discovery system, **so that** customer lookup requests are handled reliably and efficiently.

#### Acceptance Criteria
1. Load testing confirms the system handles 1000+ concurrent lookup requests
2. Response times consistently stay under 200ms for routing code lookups
3. Error handling gracefully manages invalid codes, system errors, and edge cases
4. Lookup analytics track usage patterns and popular routing codes
5. Database performance monitoring confirms index efficiency for code queries
6. Integration tests validate end-to-end lookup workflows
7. Documentation provides clear API specifications for future WhatsApp integration

## 9. Checklist Results Report

### Product Manager Checklist Validation

**✅ Requirements Completeness**
- All functional requirements (FR1-FR10) clearly define system behavior
- Non-functional requirements (NFR1-NFR6) specify performance and reliability criteria
- Technical assumptions provide clear architectural guidance

**✅ Story Quality and Sequencing**
- Stories follow logical sequence: infrastructure → business interface → customer discovery
- Each story delivers vertical functionality slice with clear acceptance criteria
- Dependencies are properly identified and resolved in sequence

**✅ User Experience Consideration**
- Mobile-first design approach aligns with existing app architecture
- One-time assignment pattern creates appropriate user commitment
- Smart suggestions reduce friction when preferred codes are unavailable

**✅ Technical Feasibility**
- Database schema changes are non-breaking and backward compatible
- API endpoints follow existing authentication and authorization patterns
- Performance requirements are achievable within current infrastructure

**✅ Business Value Alignment**
- System enables WhatsApp smart routing foundation as specified
- Regional scope approach supports planned expansion strategy
- Memorable identifiers improve customer discovery and retention

## 10. Next Steps

### UX Expert Prompt

"Please create detailed UI/UX specifications for the 4-digit routing code assignment flow within the existing Salex MerchantApp. Focus on the permanent nature of the selection, real-time validation feedback, and smart suggestion presentation. Use React Native Paper components and follow established design patterns from the current business management screens."

### Architect Prompt

"Please design the technical architecture for the 4-digit business identifier system outlined in this PRD. Include database schema changes, API endpoint specifications, validation service architecture, and integration points for future WhatsApp webhook connectivity. Ensure compatibility with the existing NestJS/Prisma/PostgreSQL stack and maintain current performance characteristics."