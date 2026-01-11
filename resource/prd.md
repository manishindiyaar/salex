SalonPro: Product Requirements Document (PRD)
Version: 1.0

Date: July 27, 2025

Author/Architect: Principal Software Architect

Status: Finalized for V1 Development

1. Introduction & Vision (The "Why")
Vision: To become the default "Operating System for small Indian businesses," starting with the salon industry. We are not just building a booking app; we are building a scalable engine to empower millions of SMBs in India by solving their core operational challenges through the simplicity of WhatsApp.

Product Overview: SalonPro is a WhatsApp-based appointment booking and queue management system designed for the Indian salon market. It provides a frictionless experience for customers to book appointments and a powerful, simple-to-use dashboard for salon owners to manage their business, all powered by a single, central WhatsApp number.

2. Problem Statement (The Pain Point)
Local salons in India, despite being a high-value service industry, operate in chaos. The primary pain points we are solving are:

For Salon Owners:

Queue & Appointment Chaos: Managing walk-ins and phone calls leads to long waiting times and a poor customer experience.

Missed Revenue: Inability to efficiently manage bookings results in lost customers during peak hours.

No Business Insight: Lack of simple tools to track daily bookings, revenue, and customer data.

High Cost of Solutions: Existing software is complex, expensive, and requires significant training.

For End Customers:

Uncertain Waiting Times: Customers face unpredictable waits of 30-90 minutes.

Booking Friction: Booking an appointment requires a phone call, which is often unanswered during busy hours.

3. Target Audience (The "Who")
Primary User (The Merchant): Small to medium-sized salon owners in Tier 1 & Tier 2 Indian cities.

Persona (Rajesh): Owns a 2-4 seater salon, is tech-savvy enough to use WhatsApp and UPI, but does not have legal business documents or a credit card for business use. His primary goal is to increase daily customers and reduce chaos.

Secondary User (The Customer): The salon's clientele.

Persona (Anjali): A working professional or student who values their time. They prefer digital, asynchronous communication (like WhatsApp) over phone calls and expect a quick, seamless booking experience.

4. Core Product Principles (The Guiding Stars)
These principles will guide every technical and product decision we make.

Simplicity is King: The system must be usable by someone with only basic smartphone skills. If it needs a training manual, we have failed.

Reliability Over Features: A booking that is missed is a customer lost forever. The system must be robust and work reliably even on patchy Indian networks. We will prioritize a notification that always arrives over a fancy but unreliable feature.

Build Once, Scale Everywhere: The core engine must be business-agnostic. Every feature should be designed with the question, "How will this work for a general store or a clinic?"

Frictionless for the End Customer: The booking process for the end customer must be 3 clicks or less. No app downloads. No complex forms.

5. High-Level System Architecture (The "How")
We will adopt the "Aggregator Model" using a central, verified WhatsApp Business number. This architecture solves the critical business verification and billing challenges posed by our target market.

graph TD
    subgraph User & Merchant
        Customer[End Customer]
        SalonOwner[Salon Owner]
    end

    subgraph Platform
        WhatsApp_API[Official WhatsApp Cloud API]
        Our_Backend[SalonPro Backend Engine (Node.js/NestJS)]
        Merchant_App[Merchant App (React Native)]
        DB[(MongoDB)]
        Cache[(Redis)]
    end

    Customer -- 1. Sends Msg --> WhatsApp_API
    WhatsApp_API -- 2. Webhook --> Our_Backend
    Our_Backend -- 3. Sends Reply via --> WhatsApp_API
    
    SalonOwner -- Interacts with --> Merchant_App
    Merchant_App -- API Calls --> Our_Backend
    Our_Backend -- Real-time Sync --> Merchant_App
    
    Our_Backend -- Reads/Writes --> DB
    Our_Backend -- Caches Data in --> Cache


Central Number: All communication flows through a single, SalonPro-branded WhatsApp number.

Bot Logic: The backend identifies the target salon based on a unique code (delivered via a dynamic QR code) or user search.

Merchant App: The salon owner manages everything exclusively through the dedicated merchant app. There will be no direct WhatsApp access for the merchant.

6. Feature Requirements: V1 (The "What")
P0 - Critical (Must-have for Launch)
Feature

Description

User Story

Salon Onboarding

A simple, guided flow in the merchant app for a salon to set up their profile.

As a salon owner, I want to set up my salon's profile, services, pricing, and hours in under 10 minutes so I can start taking bookings.

Dynamic QR Code

Generate a unique QR code for each salon that pre-fills the chat with their unique code.

As a salon owner, I want a unique QR code for my salon so my customers can instantly start a booking chat without searching.

WhatsApp Booking Flow

A button-driven conversational flow on WhatsApp for customers to book appointments.(…and config value should be directly from Merchant App where they have setted their Items and all the details while onboarding)

As a customer, I want to book an appointment by selecting a service and a time slot in a few simple taps.

Real-time Booking Notification

The merchant app receives an instant notification with a distinct sound when a new booking is made.

As a salon owner, I want to receive an immediate, unmissable notification on my app whenever a new booking is confirmed.

Booking Dashboard

A simple screen in the merchant app showing a list of today's and upcoming bookings.

As a salon owner, I want to see all my appointments for the day in a clean list so I can manage my schedule.

Multi-layered Notifications

A robust notification system (Push + SMS fallback) to ensure the salon owner never misses a booking.

As an architect, I need the system to send an SMS if a push notification is not acknowledged within 60 seconds.

P1 - Important (Should have)
Feature

Description

User Story

Smart Welcome Back

The bot recognizes returning customers and offers to re-book at their last-visited salon.

As a returning customer, I want the bot to remember me and make re-booking faster.

Booking Cancellation

Ability for both the customer (via WhatsApp) and the salon (via app) to cancel a booking.

As a user, I want a simple way to cancel my appointment if my plans change.

Basic Analytics

The merchant app shows simple metrics: total bookings today, total revenue today.

As a salon owner, I want to see my daily earnings and booking count at a glance.

7. Non-Functional Requirements (The "How Well")
Performance: The WhatsApp bot's response time for any interaction must be under 2 seconds.

Reliability: The system must have an uptime of 99.9%. The notification delivery success rate must be >99.5% (achieved via the multi-layered strategy).

Scalability: The architecture must be ableto handle 5,000 active businesses and 1.5 million end-users without a major redesign.

Security: All API endpoints must be authenticated. Customer PII (Personally Identifiable Information) must be handled securely.

Data Integrity: A booking, once confirmed, can never be lost. The system must use database transactions to ensure data consistency.

8. Success Metrics (Did it Work?)
We will track the following KPIs to measure the success of V1:

Activation Rate: % of downloaded merchant apps that complete onboarding. (Target: >80%)

Merchant Retention: Monthly churn rate of paying salons. (Target: <5%)

Core Task Success Rate: % of customers who start a booking flow and complete it successfully. (Target: >90%)

Daily Active Bookings: The total number of bookings made through the platform per day. (Our North Star Metric)

9. Future Roadmap (The "What's Next")
V1.1: Introduce a "Pro" plan for verified businesses, offering them individual numbers (as a premium, managed service).

V2.0: Adapt the BusinessEngine to launch our second vertical: General/Kirana Stores, focusing on item ordering and delivery slots.

V3.0: Introduce advanced features like automated customer feedback, loyalty programs, and promotional broadcast tools (with strict quality control).

10. Out of Scope for V1
To ensure a fast and focused launch, the following will NOT be built in V1:

Individual WhatsApp numbers for each salon.

Complex NLP or free-form text understanding for the bot.

Advanced analytics dashboard with historical data and trends.

Payment processing integration. (Payments will be handled offline by the salon).

Staff-specific scheduling or roster management.