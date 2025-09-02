







Salex UI/UX Specification
Version: 1.0
Date: August 3, 2025
Author: Sally (UX Expert)

1. Introduction
This document defines the user experience goals, information architecture, user flows, and visual design specifications for the Salex merchant app's user interface. It serves as the foundation for visual design and frontend development, ensuring a cohesive and user-centered experience.

Overall UX Goals & Principles
Target User Personas

Primary (The Merchant): Small to medium-sized salon owners in Tier 1 & 2 Indian cities. Persona: Rajesh. He is tech-savvy enough for WhatsApp/UPI but values simplicity and reliability above all to reduce the chaos in his salon.

Secondary (The Merchant's Staff): Employees who need a hyper-efficient way to manage the day's schedule and add walk-in customers.

Usability Goals

Ease of Learning: A new merchant should be able to complete the entire onboarding process in under 10 minutes.

Efficiency of Use: A staff member must be able to add a walk-in booking via "Duty Mode" in three taps or fewer.

Memorability: The interface should be so intuitive that a merchant can use it effectively even if they only open it a few times a day.

Error Prevention: The design will use clear confirmations before any destructive actions, like cancelling a booking.

Design Principles

Simplicity is King: Every screen and interaction will be stripped to its essential elements. If a feature requires a manual, it has failed.

Modular by Design: The UI architecture must be built to load different "modules" (e.g., the "Salon Module") to easily support future business verticals.

Delight in the Details: Use smooth, purposeful animations and micro-interactions to make the app feel responsive and professional.

Clarity over Cleverness: Prioritize clear, unambiguous layouts and labels over novel but potentially confusing design patterns.

Change Log
Date

Version

Description

Author

August 3, 2025

1.0

Initial draft based on brainstorming session.

Sally (UX Expert)

2. Information Architecture (IA)
Site Map / Screen Inventory
This diagram shows a high-level inventory of all the screens planned for the V1 "Salon Module" and how they relate to each other.

graph TD
    A[App Start] --> B{Is User Authenticated?};
    B -->|No| C[Auth Flow];
    B -->|Yes| D[Main App];

    subgraph Auth Flow
        C --> C1[Welcome Screen];
        C1 --> C2[Phone Number Input];
        C2 --> C3[OTP Verification];
        C3 --> C4[Business Type Selection];
        C4 --> C5[Onboarding Multi-step Form];
    end

    subgraph Main App
        D --> E[Tab Navigator];
        E --> F[Bookings Tab];
        E --> G[Catalog Tab];
        E --> H[Profile Tab];
    end

    subgraph Bookings Tab
        F --> F1[Booking Dashboard];
        F1 --> F2[Booking Details];
        F1 --> F3["Duty Mode" / Add Walk-in];
    end

    subgraph Catalog Tab
        G --> G1[Service List];
        G1 --> G2[Add/Edit Service Form];
    end

    subgraph Profile Tab
        H --> H1[Business Snapshot Screen];
    end

Navigation Structure
Primary Navigation: The main navigation will be a bottom tab navigator with three clear icons and labels. The tabs are ordered by importance:

Bookings: The default screen upon opening the app.

Catalog: For managing the salon's services.

Profile: For viewing business analytics and settings.

Secondary Navigation: Within each tab, we will use a stack navigator. When a user navigates deeper, the new screen will slide in from the right and a back arrow will appear in the header.

3. User Flows
First-Time User Onboarding
User Goal: For a new merchant to sign up, create his salon profile, and configure his services and hours.

Entry Points: Launching the app for the first time.

Success Criteria: The merchant's Business profile is fully created, and they land on the main 'Bookings' dashboard.

Flow Diagram
graph TD
    A[Start: User Opens App] --> B[Welcome Screen];
    B --> C{Authenticated?};
    C -->|No| D[Enter Phone Number];
    D --> E[Verify OTP];
    E --> F{New User?};
    F -->|Yes| G[Select Business Type Screen];
    C -->|Yes| H[Main App Dashboard];
    F -->|No| H;
    
    G -- Selects "Saloon" --> I[Onboarding Step 1: Business Details];
    I --> J[Onboarding Step 2: Add Services];
    J --> K[Onboarding Step 3: Set Hours];
    K --> L[Onboarding Complete!];
    L --> H;

Managing a New Booking Request
User Goal: For a merchant to be promptly notified of a new booking request and to be able to Accept or Deny it quickly.

Entry Points: Receiving a push notification or opening the app.

Success Criteria: The booking status is updated, the customer is notified, and the dashboard reflects the change.

Flow Diagram
graph TD
    A[Start: New Booking Request Arrives] --> B{System Sends Notification};
    B -- Push Notification / SMS --> C[Merchant is Alerted];
    C --> D[Merchant Opens App];
    D --> E[Booking Dashboard Displays "Pending" Card];
    E --> F[Merchant Taps on Request Card];
    F --> G{Decision Point};
    G -- Taps "Accept" --> H[Update Status to CONFIRMED];
    G -- Taps "Deny" --> I[Update Status to CANCELLED];
    
    H --> J[Send "Booking Confirmed" WhatsApp to Customer];
    I --> K[Send "Booking Denied" WhatsApp to Customer];

    J --> L[UI Animates Card to "Confirmed" State];
    K --> M[UI Removes Card from Pending List];
    L --> N[End];
    M --> N;

Adding a Walk-in Customer (Duty Mode)
User Goal: For a busy merchant to add a walk-in customer to the schedule in two or three taps.

Entry Points: Tapping the 'Duty Mode' toggle on the main Booking Dashboard.

Success Criteria: A new Booking record is created with CONFIRMED status and appears instantly on the dashboard.

Flow Diagram
graph TD
    A[Start: Merchant on Booking Dashboard] --> B[Taps "Duty Mode" Toggle];
    B --> C[UI Switches to Simplified View];
    C --> D[Merchant Taps Large "+" Icon];
    D --> E[Modal Appears: "Select Service"];
    E -- Tap 1: Selects a service --> F[Modal Updates: "Select Time"];
    F --> G["Displays Next Available Slot(s)"];
    G -- Tap 2: Taps "Book Now" --> H[System Creates Confirmed Booking];
    H --> I[New Booking Appears on Dashboard];
    I --> J[End];

4. Wireframes & Mockups
Primary Design Files
Primary Design Files: [Link to Figma project - To Be Created]

Key Screen Layouts
Screen: Booking Dashboard (Default "Home" Tab)
Purpose: To give the merchant an at-a-glance view of their day and allow them to manage new booking requests instantly.

Key Elements:

Header: Contains the screen title "Today's Bookings - Aug 3, 2025" and a "Duty Mode" toggle switch on the right.

Pending Requests Section: A clearly labeled section at the top of the list for any new, PENDING booking cards. These cards will have a highlighted, attention-grabbing style.

Confirmed Bookings List: A chronological, scrollable list of all CONFIRMED bookings for the day.

Component: The list will be composed of our "Living Booking Card" components.

Floating Action Button (+): Visible only in "Duty Mode" for adding walk-ins.

Screen: Onboarding (Step 1 of 3)
Purpose: To capture the salon's essential information in a clean, welcoming way.

Key Elements:

Progress Indicator: A visual step indicator at the top showing the user is on Step 1 of 3.

Header: A large, friendly title: "Tell us about your Salon".

Input Field: For "Salon Name".

Input Field: For "Address".

Input Field: For "Contact Phone Number".

Primary Button: A full-width "Next" button at the bottom.

Screen: Business Snapshot (Profile Tab)
Purpose: To provide the merchant with a simple, powerful overview of their business performance.

Key Elements:

Header: Displays the Salon's name.

Time Period Toggle: A segmented control with three options: [Today] [This Week] [This Month].

Metric Cards: Two large, clear display cards side-by-side for "Total Bookings" and "Total Revenue".

Insight List 1: A simple list titled "Top Services" showing the top 3 most booked services for the selected period.

Insight List 2: A simple list titled "Top Customers" showing the 3 most frequent customers.

5. Component Library / Design System
Design System Approach
We will adopt a "Styled System" approach. We will use the pre-built components from React Native Paper as our foundation and customize them using a central theme file to infuse them with the unique Salex brand aesthetic.

Core Components
Themed Button: The primary call-to-action button with contained and outlined variants and default, pressed, loading, and disabled states.

Living Booking Card: A stateful component with PENDING, CONFIRMED, and ARCHIVED variants that change its appearance and available actions.

Titled Input Field: A styled text input for all forms with default, focused, error, and disabled states.

6. Branding & Style Guide
Visual Identity
The brand identity for Salex is modern, premium, clean, and trustworthy. The UI will be dark-themed, using generous whitespace and a strong typographic hierarchy.

Color Palette
Color Type

Hex Code

Usage

Primary/Accent

Gradient: #FF416C -> #FF4B2B

Primary buttons, active indicators, highlights

Background

#121212

Main app background

Surface

#1E1E1E

Card backgrounds, modals

Primary Text

#FFFFFF

Headings and primary content

Secondary Text

#B3B3B3

Subtitles, descriptions

Success

#2ECC71

Confirmation messages

Error

#E74C3C

Error messages, destructive actions

Typography
Primary (Headings): Playfair Display (Google Font)

Secondary (Body/UI): Inter (Google Font)

Iconography
Icon Library: Material Community Icons (outline style).

Spacing & Layout
Grid System: An 8px grid system will be used for all spacing (margins, padding).

7. Accessibility Requirements
Compliance Target: WCAG 2.1 Level AA.

Key Requirements:

Color Contrast: Minimum 4.5:1 for all text and interactive elements.

Screen Reader Support: All controls and images must have descriptive accessibilityLabels.

Touch Targets: Minimum touch target size of 44x44 points.

8. Responsiveness Strategy
The app will be designed with a fluid, single-column layout that adapts to various phone sizes. For V1, tablet layouts will maintain the single-column structure with increased margins for readability.

9. Animation & Micro-interactions
Animations will be purposeful and performant (60 FPS). Key animations include:

State transitions on the "Living Booking Card".

Smooth slide-in/out for bottom sheet modals.

Graceful fade-in for new items appearing in lists.

10. Performance Considerations
App Start Time: Target < 3 seconds.

Interaction Response: Target < 100ms.

Strategies: We will use Optimistic UI, Skeleton Screens, and List Virtualization to ensure the app feels fast and responsive.








Salex: Detailed UI Instructions for the Main App Dashboard
This document provides a component-by-component breakdown of the Main App Dashboard (the "Bookings" tab), translating the high-level wireframes and design principles into actionable instructions for a production-grade UI.

1. Screen Overview
Purpose: To serve as the merchant's daily command center.

Primary Goal: To allow merchants to understand their schedule at a glance and manage incoming booking requests with maximum speed and minimum effort.

Key Components: The screen is composed of three main parts: the Header, the Booking List Area, and the Bottom Tab Bar.

2. Header Component
The header provides context and access to high-level screen functions.

Left Side: Screen Title & Date

Title Text: "Today's Bookings"

Title Typography: H1 (Playfair Display, 34px, Bold, #FFFFFF).

Date Text: Directly below the title, display the current date (e.g., "Monday, 4 August 2025").

Date Typography: Small (Inter, 14px, Regular, #B3B3B3).

Right Side: "Duty Mode" Toggle

Component: A standard Switch toggle component.

Styling: When "On," the switch's track should be filled with our primary red gradient. When "Off," it should use a neutral grey.

Interaction: Toggling this switch triggers the UI changes for Duty Mode (see section 6).

3. Booking List Area
This is the main content area of the screen.

Structure: A vertical, scrollable list (implemented with FlatList for performance).

Section 1: "New Requests"

Visibility: This section is only visible if there are one or more bookings with a PENDING status.

Header: A simple text label "New Requests" above the first pending card. Typography: H3 (Playfair Display, 20px, Semi-Bold, #FFFFFF).

Content: Contains all PENDING "Living Booking Cards". This section does not scroll independently; it is part of the main list.

Section 2: "Today's Schedule"

Header: A text label "Today's Schedule".

Content: Contains all CONFIRMED and ARCHIVED bookings for the day, sorted chronologically by bookingTime.

4. The 'Living Booking Card' Component (Detailed Specification)
This is the most critical component of the UI.

General Layout & Style:

Container: A card with a Surface background color (#1E1E1E).

Spacing: md (16px) of internal padding on all sides.

Shape: Rounded corners (e.g., 12px border radius).

Content Structure (Top to Bottom):

Top Row:

Customer Name: Aligned to the left. Typography: H3 (Playfair Display, 20px, Semi-Bold, #FFFFFF).

Booking Time: Aligned to the right. Typography: Body (Inter, 16px, Regular, #B3B3B3).

Middle Row:

Service Name: Aligned to the left. Typography: Body (Inter, 16px, Regular, #FFFFFF).

Bottom Row:

Price: Aligned to the left (e.g., "₹200"). Typography: Body (Inter, 16px, Regular, #FFFFFF).

State 1: PENDING Variant

Visuals: The card has a 2px border using the primary red gradient. This border should have a subtle, slow pulsing animation to continuously draw the eye.

Actions: Two buttons are displayed at the bottom of the card.

Deny button (on the left): Outlined style.

Accept button (on the right): Contained style, filled with the red gradient.

State 2: CONFIRMED Variant

Visuals: A standard card with no border.

Actions: The buttons transition to show:

Mark as Done button (on the left): Outlined style.

Request Payment button (on the right): Contained style.

State 3: ARCHIVED (COMPLETED or CANCELLED) Variant

Visuals: The entire card's content (text and icons) has its opacity reduced to 60%.

Actions: No action buttons are visible.

5. Empty State
Condition: This UI is shown when there are no PENDING, CONFIRMED, or ARCHIVED bookings for the current day.

Layout: All content is centered vertically and horizontally in the list area.

Visuals:

An icon from Material Community Icons (e.g., calendar-check-outline), sized large (e.g., 64px) and colored with our secondary text color (#B3B3B3).

Text below the icon: "No bookings for today."

Typography: H2 (Playfair Display, 24px, Bold, #B3B3B3).

6. Duty Mode Interaction
Activation: When the "Duty Mode" toggle in the header is switched ON:

The main bottom tab bar animates away by sliding down off the screen.

A Floating Action Button (FAB) with a + icon animates into view in the bottom-right corner. It should fade in and scale up slightly.

FAB Styling: The FAB's background must be our primary red gradient.

Deactivation: When the toggle is switched OFF, the reverse animations occur: the FAB animates out, and the tab bar slides back into view.