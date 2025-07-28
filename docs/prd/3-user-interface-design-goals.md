# 3. User Interface Design Goals

## Overall UX Vision

The **Salex** Merchant App must be exceptionally simple, intuitive, and reliable. The design philosophy is "Clarity over cleverness." A new user, like our persona Rajesh, should be able to understand and use the core functionality of the app within minutes, without any training or manuals. The interface will be clean and uncluttered, focusing the merchant's attention on the most critical task at hand: managing today's bookings. Every interaction should provide immediate and clear feedback.

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

## Branding

The brand identity is **Salex**. The visual design will be clean and professional, incorporating a **solid, material-style gradient red** as the primary brand color.

## Target Device and Platforms: Mobile Only

The V1 Merchant App will be **Mobile Only**, built with React Native to support both **iOS and Android**.