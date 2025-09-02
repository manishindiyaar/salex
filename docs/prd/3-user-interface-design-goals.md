# 3. User Interface Design Goals

> **📋 Detailed UX Specification:** For comprehensive user flows, wireframes, and design system specifications, see [Frontend UX Specification](../architecture/11-1-frontend-ux-specification.md)

## Overall UX Vision

The **Salex** Merchant App must be exceptionally simple, intuitive, and reliable. The design philosophy is "Clarity over cleverness." A new user, like our persona Rajesh, should be able to understand and use the core functionality of the app within minutes, without any training or manuals. The interface will be clean and uncluttered, focusing the merchant's attention on the most critical task at hand: managing today's bookings. Every interaction should provide immediate and clear feedback.

## Quantified Usability Goals

- **Ease of Learning:** Complete onboarding process in under 10 minutes
- **Efficiency of Use:** Add walk-in booking via "Duty Mode" in ≤3 taps  
- **Memorability:** Intuitive interface usable even with infrequent access
- **Error Prevention:** Clear confirmations before destructive actions (booking cancellations)

## Key Interaction Paradigms

* **Business-Specific UI Modules:** The app will be architected to present a completely different user interface based on the merchant's selected `businessType`. For V1, it will load the "Salon Module," but the underlying structure will support entirely different UIs for future verticals like "Food Vendor."
* **Task-Oriented Dashboard:** The default home screen will be the list of today's bookings.
* **Simple Tab Navigation:** A bottom tab bar will provide access to the main sections of the app.
* **"Duty Mode" for Staff:** A dedicated mode will provide a hyper-simplified UI for high-frequency tasks like adding walk-in customers.

## Core Screens and Views

The V1 "Salon Module" will be composed of these essential screens:

* **Business Type Selection Screen:** The first screen after sign-up, where the user selects "Saloon."
* **Onboarding Flow:** A guided, multi-step process for setting up a salon profile.
* **Booking Dashboard:** The main screen with tabs for "Today" and "Upcoming" bookings.
* **"Duty Mode" / Walk-in Screen:** A simplified view of the dashboard with a large "+" button to quickly add walk-in appointments.
* **Services Management Screen:** A list of the merchant's services, with options to add/edit.
* **Daily Analytics Screen:** A simple screen showing total bookings and revenue for the day.

## Accessibility: WCAG AA

We will proceed with **WCAG AA** as our baseline accessibility target to ensure the app is usable by a wide audience.

## Branding & Visual Design

The brand identity is **Salex**. The visual design will be clean and professional, incorporating a **gradient red** (#FF416C → #FF4B2B) as the primary brand color.

### Design System Specifications
- **Theme:** Dark theme with gradient red accents
- **Background:** #121212 (main) / #1E1E1E (surfaces)
- **Typography:** Playfair Display (headings) / Inter (body text)
- **Grid System:** 8px spacing grid for consistent layouts
- **Accessibility:** WCAG 2.1 Level AA compliance target

### Core Components
- **Living Booking Card:** Dynamic component with PENDING/CONFIRMED/ARCHIVED states
- **Themed Button:** Gradient red primary actions with multiple states
- **Titled Input Field:** Consistent form styling with validation states

## Target Device and Platforms: Mobile Only

The V1 Merchant App will be **Mobile Only**, built with React Native to support both **iOS and Android**.