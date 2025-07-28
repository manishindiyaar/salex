# 3. Tech Stack

## Technology Stack Table

This table serves as the single source of truth for the entire project. All development must adhere to these specified technologies and versions.

| Category | Technology | Version | Purpose | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Language** | TypeScript | 5.5.x | Primary language for the app | Provides strong type-safety, preventing common errors and improving code quality. |
| **Frontend Framework**| React Native | 0.74.x | Core framework for the mobile merchant app | Enables cross-platform (iOS/Android) development from a single codebase. |
| **UI Component Lib** | React Native Paper| 5.12.x | UI components for the merchant app | Provides a high-quality, customizable Material Design component library. |
| **State Management**| Zustand | 4.5.x | Global state management for the app | A simple, fast, and scalable state management solution with minimal boilerplate. |
| **Backend Language** | TypeScript | 5.5.x | Primary language for the backend | Ensures type-safety and consistency with the frontend codebase. |
| **Backend Framework**| NestJS | 10.3.x | Core framework for the backend API | A robust, scalable Node.js framework with excellent support for TypeScript and DI. |
| **API Style** | REST API | N/A | Communication between app and backend | A well-understood, standard approach for client-server communication. |
| **ORM** | Prisma | 5.15.x | Object-Relational Mapper for the database | Provides a type-safe database client that simplifies data access and mutations. |
| **Database** | PostgreSQL | 16.3 | Primary data store | A powerful, reliable, and battle-tested open-source relational database. |
| **Cache** | Redis | 7.2.x | Session storage and caching | High-performance in-memory cache for managing WhatsApp conversation state. |
| **File Storage** | Supabase Storage | N/A | Storing files like QR codes, profile pics | A simple S3-compatible object storage solution, integrated with our platform. |
| **Authentication** | Clerk | 5.1.x | User authentication and management | A dedicated, secure service for handling all aspects of user authentication. |
| **Frontend Testing**| Jest & RNTL | 29.7.x | Unit and component testing | Industry-standard for testing React Native applications. |
| **Backend Testing** | Jest & Supertest | 29.7.x | Unit and e2e API testing | Jest is the default for NestJS; Supertest allows for robust API endpoint testing. |
| **E2E Testing** | Maestro | 1.37.x | End-to-end testing for the mobile app | A modern, simple, and reliable framework for mobile E2E testing. |
| **Monorepo Tool** | Turborepo | 2.0.x | Manages the monorepo build system | Provides high-performance build caching and task orchestration. |
| **IaC Tool** | Vercel CLI | 34.2.x | Infrastructure as Code | Manages Vercel deployments and configurations from the command line. |
| **CI/CD** | GitHub Actions | N/A | Continuous integration and deployment | Tightly integrated with GitHub for automated builds, tests, and deployments. |
| **Error Tracking** | Sentry | N/A | Error monitoring for app and backend | Provides real-time error tracking and performance monitoring. |
| **Logging** | Pino | 9.2.x | High-performance logging for the backend | A fast and structured logger that is well-suited for serverless environments. |