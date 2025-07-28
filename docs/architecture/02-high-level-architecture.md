# 2. High Level Architecture

## Technical Summary

The Salex system will be architected as a serverless, mobile-first application following the aggregator model described in the PRD. The core components are a **React Native Merchant App**, a **NestJS Backend** composed of serverless functions, and a central integration with the **WhatsApp Cloud API**. Authentication will be managed by **Clerk**, while **Prisma** will serve as the ORM for our **Supabase PostgreSQL** database. The architecture prioritizes reliability and scalability by leveraging managed platforms, ensuring a robust and maintainable system.

## Platform and Infrastructure Choice

**Platform:** Vercel for Hosting, Supabase for Database & Storage
**Key Services:** Vercel Serverless Functions, Supabase PostgreSQL, Supabase Storage, **Clerk** for Authentication
**Deployment Host and Regions:** Vercel Global Edge Network, Supabase (Mumbai, `ap-south-1`)

## Repository Structure

**Structure:** Monorepo
**Monorepo Tool:** Turborepo
**Package Organization:** `apps` for deployable applications (merchant-app, backend) and `packages` for shared code (ui-kit, shared-types, config).

## High Level Architecture Diagram

```mermaid
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