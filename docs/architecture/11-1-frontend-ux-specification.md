# 11.1 Frontend UX Specification

**Version:** 1.0  
**Date:** August 4, 2025  
**Author:** Sally (UX Expert)  

This document defines the comprehensive user experience goals, information architecture, user flows, and visual design specifications for the Salex merchant app's user interface.

## 1. UX Goals & Design Principles

### Target User Personas

**Primary (The Merchant):** Small to medium-sized salon owners in Tier 1 & 2 Indian cities  
- **Persona:** Rajesh - tech-savvy enough for WhatsApp/UPI but values simplicity and reliability above all
- **Goal:** Reduce chaos in salon operations through intuitive technology

**Secondary (The Merchant's Staff):** Employees who need hyper-efficient schedule management  
- **Goal:** Add walk-in customers via "Duty Mode" in three taps or fewer

### Usability Goals

- **Ease of Learning:** Complete onboarding in under 10 minutes
- **Efficiency of Use:** Add walk-in booking in ≤3 taps via "Duty Mode"
- **Memorability:** Intuitive interface usable even with infrequent access
- **Error Prevention:** Clear confirmations before destructive actions

### Design Principles

1. **Simplicity is King:** Strip to essential elements - no feature should require a manual
2. **Modular by Design:** UI architecture supports different business modules (starting with "Salon Module")
3. **Delight in the Details:** Smooth, purposeful animations and micro-interactions
4. **Clarity over Cleverness:** Prioritize clear layouts over novel but confusing patterns

## 2. Information Architecture

### Site Map & Screen Inventory

```
App Start
├── Auth Flow (if not authenticated)
│   ├── Welcome Screen
│   ├── Phone Number Input
│   ├── OTP Verification
│   ├── Business Type Selection
│   └── Onboarding Multi-step Form
│       ├── Step 1: Business Details
│       ├── Step 2: Add Services
│       └── Step 3: Set Hours
└── Main App (authenticated)
    └── Tab Navigator
        ├── Bookings Tab (default)
        │   ├── Booking Dashboard
        │   ├── Booking Details
        │   └── "Duty Mode" / Add Walk-in
        ├── Catalog Tab
        │   ├── Service List
        │   └── Add/Edit Service Form
        └── Profile Tab
            └── Business Snapshot Screen
```

### Navigation Structure

**Primary Navigation:** Bottom tab navigator with three tabs (ordered by importance):
1. **Bookings** (default) - Today's bookings and requests
2. **Catalog** - Service management
3. **Profile** - Business analytics and settings

**Secondary Navigation:** Stack navigator within tabs - screens slide in from right with back arrow

## 3. Key User Flows

### 3.1 First-Time User Onboarding

**Goal:** New merchant signs up, creates salon profile, configures services and hours  
**Entry Point:** First app launch  
**Success Criteria:** Complete business profile created, lands on Bookings dashboard

```
Start: User Opens App
↓
Welcome Screen
↓
Enter Phone Number → Verify OTP
↓
[New User Branch]
Select Business Type Screen → Selects "Salon"
↓
Onboarding Step 1: Business Details
↓  
Onboarding Step 2: Add Services
↓
Onboarding Step 3: Set Hours
↓
Onboarding Complete! → Main App Dashboard
```

### 3.2 Managing New Booking Request

**Goal:** Promptly handle booking requests with Accept/Deny actions  
**Entry Point:** Push notification or app launch  
**Success Criteria:** Booking status updated, customer notified, dashboard reflects change

```
New Booking Request Arrives
↓
System Sends Notification → Merchant Alerted
↓
Merchant Opens App → Booking Dashboard Shows "Pending" Card
↓
Merchant Taps Request Card
↓
Decision Point: [Accept] or [Deny]
├── Accept → Update to CONFIRMED → Send Confirmation WhatsApp → Animate to "Confirmed" State
└── Deny → Update to CANCELLED → Send Denial WhatsApp → Remove from Pending List
```

### 3.3 Adding Walk-in Customer (Duty Mode)

**Goal:** Add walk-in customer in 2-3 taps  
**Entry Point:** "Duty Mode" toggle on Booking Dashboard  
**Success Criteria:** New CONFIRMED booking created and visible on dashboard

```
Booking Dashboard
↓
Tap "Duty Mode" Toggle → UI Switches to Simplified View
↓
Tap Large "+" Icon → Modal: "Select Service"
↓
Tap 1: Select Service → Modal Updates: "Select Time" → Shows Next Available Slots
↓
Tap 2: Tap "Book Now" → System Creates Confirmed Booking → New Booking Appears on Dashboard
```

## 4. Screen Specifications

### 4.1 Booking Dashboard (Default Home Tab)

**Purpose:** At-a-glance view of the day with instant booking request management

**Key Elements:**
- **Header:** "Today's Bookings - [Date]" + "Duty Mode" toggle (right)
- **Pending Requests Section:** Highlighted attention-grabbing cards for PENDING bookings
- **Confirmed Bookings List:** Chronological scrollable list of CONFIRMED bookings
- **Floating Action Button (+):** Visible only in "Duty Mode" for adding walk-ins

### 4.2 Onboarding (Step 1 of 3)

**Purpose:** Capture salon's essential information cleanly

**Key Elements:**
- **Progress Indicator:** Visual step indicator (Step 1 of 3)
- **Header:** "Tell us about your Salon"
- **Input Fields:** Salon Name, Address, Contact Phone Number
- **Primary Button:** Full-width "Next" button

### 4.3 Business Snapshot (Profile Tab)

**Purpose:** Simple, powerful business performance overview

**Key Elements:**
- **Header:** Salon's name
- **Time Period Toggle:** [Today] [This Week] [This Month]
- **Metric Cards:** Side-by-side "Total Bookings" and "Total Revenue"
- **Insight List 1:** "Top Services" (top 3 most booked)
- **Insight List 2:** "Top Customers" (3 most frequent)

## 5. Component Library & Design System

### Design System Approach
**Styled System** using React Native Paper as foundation, customized with central Salex theme

### Core Components

**Themed Button**
- Variants: contained, outlined
- States: default, pressed, loading, disabled

**Living Booking Card**
- Variants: PENDING, CONFIRMED, ARCHIVED
- Dynamic appearance and actions based on state

**Titled Input Field**
- States: default, focused, error, disabled
- Consistent styling across all forms

## 6. Visual Design & Branding

### Brand Identity
Modern, premium, clean, trustworthy with dark theme and generous whitespace

### Color Palette

| Color Type | Value | Usage |
|------------|-------|-------|
| Primary/Accent | Gradient: #FF416C → #FF4B2B | Primary buttons, active indicators, highlights |
| Background | #121212 | Main app background |
| Surface | #1E1E1E | Card backgrounds, modals |
| Primary Text | #FFFFFF | Headings and primary content |
| Secondary Text | #B3B3B3 | Subtitles, descriptions |
| Success | #2ECC71 | Confirmation messages |
| Error | #E74C3C | Error messages, destructive actions |

### Typography
- **Primary (Headings):** Playfair Display (Google Font)
- **Secondary (Body/UI):** Inter (Google Font)

### Iconography
- **Icon Library:** Material Community Icons (outline style)

### Spacing & Layout
- **Grid System:** 8px grid system for all spacing (margins, padding)

## 7. Accessibility Requirements

- **Compliance Target:** WCAG 2.1 Level AA
- **Color Contrast:** Minimum 4.5:1 for all text and interactive elements
- **Screen Reader Support:** All controls and images have descriptive accessibilityLabels
- **Touch Targets:** Minimum 44x44 points

## 8. Responsiveness Strategy

Fluid, single-column layout adapting to various phone sizes. V1 tablet layouts maintain single-column with increased margins.

## 9. Animation & Micro-interactions

**Performance Target:** 60 FPS for all animations

**Key Animations:**
- State transitions on "Living Booking Card"
- Smooth slide-in/out for bottom sheet modals
- Graceful fade-in for new list items

## 10. Performance Considerations

**Targets:**
- App Start Time: < 3 seconds
- Interaction Response: < 100ms

**Strategies:**
- Optimistic UI updates
- Skeleton screens during loading
- List virtualization for long lists

## 11. Implementation Notes

### Integration with Existing Architecture
- Aligns with React Native Paper components in `docs/architecture/11-frontend-architecture.md`
- Leverages Zustand state management for booking and business stores
- Utilizes React Navigation v6 routing architecture
- Integrates with Clerk authentication flow

### Next Steps
1. Create high-fidelity mockups in Figma based on this specification
2. Update component library with Living Booking Card and Themed Button specifications
3. Implement design system theme file with color palette and typography
4. Begin development of core screens following atomic design pattern