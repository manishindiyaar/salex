Salex Fullstack Architecture Document
Version: 1.0
Date: July 28, 2025
Author: Winston (Architect)

1. Introduction
This document outlines the complete fullstack architecture for Salex, including backend systems, the React Native merchant application, and their integration via the WhatsApp Business API. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for a modern fullstack application where these concerns are tightly integrated.

Starter Template or Existing Project
This is a greenfield project based on the standard outputs of the create-react-native-app and nest new CLI tools, adapted for a monorepo environment. No specific third-party starter template will be used.

Change Log
Date	Version	Description	Author
July 28, 2025	1.0	Initial draft of the fullstack architecture	Winston (Architect)

Export to Sheets
2. High Level Architecture
Technical Summary
The SalonPro system will be architected as a serverless, mobile-first application following the aggregator model described in the PRD. The core components are a React Native Merchant App, a NestJS Backend composed of serverless functions, and a central integration with the WhatsApp Cloud API. Authentication will be managed by Clerk, while Prisma will serve as the ORM for our Supabase PostgreSQL database. The architecture prioritizes reliability and scalability by leveraging managed platforms, ensuring a robust and maintainable system.

Platform and Infrastructure Choice
Platform: Vercel for Hosting, Supabase for Database & Storage
Key Services: Vercel Serverless Functions, Supabase PostgreSQL, Supabase Storage, Clerk for Authentication
Deployment Host and Regions: Vercel Global Edge Network, Supabase (Mumbai, ap-south-1)

Repository Structure
Structure: Monorepo
Monorepo Tool: Turborepo
Package Organization: apps for deployable applications (merchant-app, backend) and packages for shared code (ui-kit, shared-types, config).

High Level Architecture Diagram
Code snippet

graph TD
    subgraph "End Users"
        M[Merchant on React Native App]
        C[Customer on WhatsApp]
    end

    subgraph "Salex Platform (Vercel & Supabase)"
        subgraph "Vercel Hosting"
            B[API Backend (NestJS Serverless w/ Prisma)]
        end
        subgraph "Supabase Services"
            DB[(Supabase DB - PostgreSQL)]
            Store[(Supabase Storage)]
        end
    end

    subgraph "Third-Party Services"
        W[WhatsApp Cloud API]
        CLK[Clerk Authentication]
        SMS[SMS Gateway]
    end

    M -- "1. Authenticates with" --> CLK
    M -- "2. API Calls with Clerk JWT" --> B
    
    B -- "3. Validates JWT with" --> CLK
    B -- "4. Syncs User Data" --> DB
    
    C -- "Sends Msg" --> W
    W -- "Webhook" --> B
    B -- "Reply via API" --> W
    
    B -- "Reads/Writes Data" --> DB
    B -- "Stores Files" --> Store
    B -- "Push Fallback" --> SMS
Architectural Patterns
Serverless Architecture: Backend built as serverless functions on Vercel.

Component-Based UI: React Native app composed of reusable components.

Repository Pattern (Backend): Using Prisma to abstract data access from the core business logic.

API Gateway Pattern: The NestJS backend serves as a single, unified entry point for the merchant app, with endpoints protected by Clerk middleware.

3. Tech Stack
Category	Technology	Version	Purpose	Rationale
Frontend Language	TypeScript	5.5.x	Primary language for the app	Provides strong type-safety, preventing common errors and improving code quality.                   
Frontend Framework	React Native	0.74.x	Core framework for the mobile merchant app	Enables cross-platform (iOS/Android) development from a single codebase.
UI Component Lib	React Native Paper	5.12.x	UI components for the merchant app	Provides a high-quality, customizable Material Design component library.
State Management	Zustand	4.5.x	Global state management for the app	A simple, fast, and scalable state management solution with minimal boilerplate.
Backend Language	TypeScript	5.5.x	Primary language for the backend	Ensures type-safety and consistency with the frontend codebase.
Backend Framework	NestJS	10.3.x	Core framework for the backend API	A robust, scalable Node.js framework with excellent support for TypeScript and DI.
API Style	REST API	N/A	Communication between app and backend	A well-understood, standard approach for client-server communication.
ORM	Prisma	5.15.x	Object-Relational Mapper for the database	Provides a type-safe database client that simplifies data access and mutations.
Database	PostgreSQL	16.3	Primary data store	A powerful, reliable, and battle-tested open-source relational database.
Cache	Redis	7.2.x	Session storage and caching	High-performance in-memory cache for managing WhatsApp conversation state.
File Storage	Supabase Storage	N/A	Storing files like QR codes, profile pics	A simple S3-compatible object storage solution, integrated with our platform.
Authentication	Clerk	5.1.x	User authentication and management	A dedicated, secure service for handling all aspects of user authentication.
Frontend Testing	Jest & RNTL	29.7.x	Unit and component testing	Industry-standard for testing React Native applications.
Backend Testing	Jest & Supertest	29.7.x	Unit and e2e API testing	Jest is the default for NestJS; Supertest allows for robust API endpoint testing.
E2E Testing	Maestro	1.37.x	End-to-end testing for the mobile app	A modern, simple, and reliable framework for mobile E2E testing.
Monorepo Tool	Turborepo	2.0.x	Manages the monorepo build system	Provides high-performance build caching and task orchestration.
IaC Tool	Vercel CLI	34.2.x	Infrastructure as Code	Manages Vercel deployments and configurations from the command line.
CI/CD	GitHub Actions	N/A	Continuous integration and deployment	Tightly integrated with GitHub for automated builds, tests, and deployments.
Error Tracking	Sentry	N/A	Error monitoring for app and backend	Provides real-time error tracking and performance monitoring.
Logging	Pino	9.2.x	High-performance logging for the backend	A fast and structured logger that is well-suited for serverless environments.

Export to Sheets
4. Data Models
Models are designed to be modular via a generic Business entity.

User (Merchant): Represents the business owner, linked to a Clerk ID.

Business: The central, generic entity for any merchant. Has a businessType.

Salon: Stores details specific to SALON type businesses.

Service: Represents a service offered by a Business.

Customer: Represents an end-customer from WhatsApp.

Booking: The core transactional model linking a Customer, Service, and Business.

5. API Specification
A salon-specific REST API is defined using OpenAPI 3.0. Future business verticals will have their own purpose-built APIs.

Authentication: All sensitive endpoints are secured using a global bearerAuth scheme for Clerk JWTs.

Core Resources:

GET /businesses/me: Fetches the current merchant's business profile.

PUT /businesses/{businessId}: Updates business details.

GET /businesses/{businessId}/bookings: Retrieves bookings for the salon.

PATCH /bookings/{bookingId}/cancel: Cancels a specific booking.

GET | POST /businesses/{businessId}/services: Manages the salon's services.

6. Components
React Native Merchant App: The UI for salon owners.

Backend API (NestJS): The core business logic engine.

WhatsApp Adapter: A dedicated module within the backend for handling all WhatsApp interactions and state management via Redis.

Notification Service: Manages multi-layered notifications (FCM + SMS fallback) to ensure reliability.

7. External APIs
WhatsApp Cloud API: For sending and receiving customer messages.

Clerk API: For user authentication and JWT validation (SDK-based).

Firebase Cloud Messaging (FCM) API: For sending push notifications.

Twilio API: For sending fallback SMS notifications.

8. Core Workflows
Sequence diagrams have been defined for:

WhatsApp Booking Flow: Details the end-to-end customer interaction, including session management with Redis.

Merchant Onboarding: Shows the sign-up flow with Clerk, business type selection, and user sync to our database.

Multi-Layered Notification Flow: Illustrates the Push-then-SMS fallback logic for maximum reliability.

9. Database Schema
A concrete SQL DDL schema for PostgreSQL has been defined, including:

Custom ENUM types for business_type and booking_status.

Tables for User, Business, Salon, Customer, Service, and Booking.

Foreign key constraints (REFERENCES) and ON DELETE policies to ensure relational integrity.

Performance-critical INDEXES on foreign keys and frequently queried columns.

10. Unified Project Structure
A monorepo structure managed by Turborepo is defined, with:

apps/: For the api (NestJS) and merchant-app (React Native) applications.

packages/: For shared code, including shared-types for data models and eslint-config-custom for consistent tooling.

11. Frontend Architecture
Component Structure: A pattern based on Atomic Design (atoms, molecules, organisms).

State Management: Zustand, organized into domain-specific "slices".

Routing: React Navigation, with a RootNavigator that switches between AuthStack and AppStack based on Clerk's authentication state.

API Layer: A centralized Axios client with an interceptor to automatically attach the Clerk JWT to all requests.

12. Backend Architecture
Structure: A modular design in NestJS, with features like whatsapp, bookings, and notifications in their own modules.

Data Access: A centralized PrismaService implements the Repository Pattern for consistent and testable database interactions.

Security: A reusable ClerkAuthGuard in NestJS to protect all sensitive endpoints.

13. Development Workflow
Local Setup: A complete guide for local setup using pnpm, Docker, and the Supabase CLI.

Commands: Standardized pnpm scripts (dev, test, lint) for a consistent developer experience.

Environment Variables: A clear list of all required keys for the .env file.

14. Deployment Architecture
Backend: Continuous deployment of the NestJS API to Vercel Serverless Functions, triggered by pushes to the main branch.

Frontend: Native binaries for the React Native app will be built and submitted to app stores using Expo Application Services (EAS).

CI/CD: A GitHub Actions pipeline is defined to automate linting, testing, and deployment.

15. Security and Performance
Security: A multi-layered strategy including secure token storage on mobile (expo-secure-store), backend input validation (class-validator), rate limiting, and mandatory webhook signature validation.

Performance: Defined targets (p95 latency < 200ms) and strategies, including Redis caching for WhatsApp sessions and render optimization for the React Native app.

16. Testing Strategy
Pyramid Model: A strategy emphasizing many unit tests (Jest, RNTL), fewer integration tests (Supertest), and a small number of critical E2E tests (Maestro).

Examples: Concrete code examples are provided for each type of test.

17. Coding Standards
A set of critical, non-negotiable rules for AI and human developers, focusing on type sharing, environment variable access, and enforcement of architectural patterns.

18. Error Handling Strategy
A centralized strategy using a GlobalExceptionFilter in the backend and an Error Boundary and Axios interceptor in the frontend to ensure errors are handled gracefully and reported to Sentry.

19. Monitoring and Observability
A 360-degree strategy using Vercel and Supabase for infrastructure monitoring and Sentry for application-level performance monitoring (APM) and error tracking for both frontend and backend.

As requested, I will now run the final validation and present the checklist report.

20. Checklist Results Report
I have conducted a thorough validation of the architecture document against the Architect Solution Validation Checklist. The architecture is comprehensive, robust, and well-aligned with the project's requirements as stated in the PRD.

Project Type: Full-stack Application (Backend API + React Native UI)

Overall Architecture Readiness: High

Section Analysis & Status
Category	Status	Notes
1. Requirements Alignment	✅ PASS	The architecture directly supports all V1 functional and non-functional requirements.
2. Architecture Fundamentals	✅ PASS	The design is modular, with clear separation of concerns and well-defined components.
3. Technical Stack & Decisions	✅ PASS	The tech stack is modern, consistent, and well-justified.
4. Frontend Design & Implementation	✅ PASS	A clear, scalable structure for the React Native app has been defined.
5. Resilience & Operational Readiness	✅ PASS	Error handling, notifications, and monitoring provide a strong foundation for reliability.
6. Security & Compliance	✅ PASS	Security has been addressed at every layer of the stack.
7. Implementation Guidance	✅ PASS	The document provides actionable guidance for developers (human and AI).
8. Dependency Management	✅ PASS	External APIs and their integration patterns are clearly defined.
9. AI Agent Implementation Suitability	✅ PASS	The modularity and clear patterns make this architecture highly suitable for AI agents.
10. Accessibility Implementation	⚠️ PARTIAL	The PRD did not specify accessibility targets. While standard libraries help, a dedicated effort is needed.

Export to Sheets
Key Findings & Recommendations
The architecture is exceptionally solid and ready for development. Only one area requires further definition:

Recommendation 1 (Medium Priority):

Issue: While the architecture is sound, we have not yet defined specific accessibility targets (e.g., WCAG 2.1 AA compliance).

Action: Before significant UI development begins, I recommend a brief consultation with the UX Expert (*agent ux-expert) to define these targets. This will ensure the merchant app is usable by the widest possible audience and will prevent costly rework later.

Final Decision
The Salex Fullstack Architecture Document is complete and approved for development. The design is robust, scalable, and directly aligned with all business and technical goals outlined in the PRD.

