# 6. Components

## Component List

#### React Native Merchant App

* **Responsibility:** Provides the primary interface for salon owners to manage their business. This includes onboarding, viewing/managing bookings, configuring services, and seeing basic analytics.
* **Key Interfaces:**
    * Renders the UI for the merchant.
    * Initiates authentication flows with Clerk.
    * Makes authenticated API calls to the Backend API.
* **Dependencies:** Clerk (for Auth), Backend API (for Data).
* **Technology Stack:** React Native, TypeScript, React Native Paper, Zustand.

#### Backend API (NestJS)

* **Responsibility:** Acts as the central engine for all business logic, data persistence, and coordination. It serves the merchant app and processes incoming WhatsApp messages.
* **Key Interfaces:**
    * Exposes the secure REST API for the merchant app.
    * Provides the webhook endpoint for the WhatsApp Cloud API.
* **Dependencies:** Supabase DB (via Prisma), Clerk (for JWT validation), WhatsApp Adapter, Notification Service.
* **Technology Stack:** NestJS, TypeScript, Prisma, Vercel Serverless Functions.

#### WhatsApp Adapter

* **Responsibility:** A specialized component within the backend dedicated to handling all interactions with the WhatsApp platform. It manages the conversational state of end-users.
* **Key Interfaces:**
    * `POST /webhooks/whatsapp`: Listens for incoming messages from Meta.
    * `sendMessage(to, message)`: An internal interface for sending replies.
* **Dependencies:** Redis (for session state), Supabase DB (to fetch salon/service info), WhatsApp Cloud API.
* **Technology Stack:** NestJS Module, `ioredis` library.

#### Notification Service

* **Responsibility:** Manages the multi-layered notification system described in the PRD. It ensures merchants are reliably notified of new bookings.
* **Key Interfaces:**
    * `sendBookingNotification(booking)`: An internal interface that orchestrates the "Push, wait 60s, then SMS fallback" logic.
* **Dependencies:** Firebase Cloud Messaging (FCM) and an SMS Gateway (e.g., Twilio).
* **Technology Stack:** NestJS Module, provider-specific SDKs (e.g., `firebase-admin`, `twilio`).

## Component Diagrams

This diagram shows how these logical components interact within the system.

```mermaid
graph TD
    subgraph "Merchant Device"
        MerchantApp[React Native Merchant App]
    end
    
    subgraph "Salex Backend (Vercel)"
        BackendAPI[Backend API]
        WhatsAppAdapter[WhatsApp Adapter]
        NotificationService[Notification Service]
    end

    subgraph "Database"
        DB[(Supabase DB)]
        Cache[(Redis)]
    end
    
    subgraph "External Services"
        Clerk[Clerk Auth]
        WhatsAppAPI[WhatsApp Cloud API]
        PushSvc[FCM]
        SmsSvc[SMS Gateway]
    end

    MerchantApp -- "Authenticates" --> Clerk
    MerchantApp -- "API Calls (JWT)" --> BackendAPI
    BackendAPI -- "Validates JWT" --> Clerk
    
    BackendAPI -- "Uses" --> WhatsAppAdapter
    BackendAPI -- "Uses" --> NotificationService
    
    WhatsAppAPI -- "Webhook" --> WhatsAppAdapter
    WhatsAppAdapter -- "Manages Session" --> Cache
    WhatsAppAdapter -- "Gets Data" --> DB
    
    NotificationService -- "Sends Push" --> PushSvc
    NotificationService -- "Sends SMS" --> SmsSvc
    PushSvc --> MerchantApp
    SmsSvc --> MerchantApp

    BackendAPI -- "Reads/Writes Data (Prisma)" --> DB