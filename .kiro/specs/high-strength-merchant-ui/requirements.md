# Requirements Document

## Introduction

This specification covers the redesign of the Salex Merchant App to implement the "High-Strength" UI paradigm - a tool-based interface optimized for Indian salon owners. The design prioritizes tactical speed, high contrast, and physical-feeling interactions. This spec also ensures proper frontend-backend synchronization with the new Express.js API endpoints.

The core transformation involves:
1. Converting the current 5-tab navigation to a focused 3-tab system (Home, Catalogue, My Account)
2. Implementing the "High-Strength" visual language with massive calculator-style fonts for critical data
3. Adding real-time WhatsApp booking integration with swipe-to-action gestures
4. Implementing the "Chai-Break" emergency stop functionality
5. Creating the physical reconcile checkout flow

## Glossary

- **High_Strength_UI**: A design paradigm using massive, bold numeric fonts (Calculator Style) for critical data inputs and displays, with standard typography for information
- **Chai_Break**: An emergency toggle that instantly stops accepting new WhatsApp booking requests
- **Revenue_Burst**: A celebratory animation triggered when daily revenue milestones are hit
- **Swipe_Action**: Gesture-based interaction where SWIPE UP accepts and SWIPE DOWN denies WhatsApp requests
- **Physical_Reconcile**: Checkout flow where merchants drag the total amount into CASH or BANK icons to finalize payment
- **Floating_Request_Card**: Real-time notification card that slides in when a new WhatsApp booking request arrives
- **Impact_Zone_Input**: Large preset buttons (HAIRCUT, SHAVE, COMBO, OTHER) for quick slot creation
- **Merchant_App**: The React Native mobile application for salon owners
- **Backend_API**: The Express.js REST API at `/api/v1/*` endpoints
- **Supabase_Realtime**: WebSocket-based real-time data synchronization for PENDING bookings

## Requirements

### Requirement 1: Three-Tab Navigation System

**User Story:** As a salon owner, I want a simplified navigation with only 3 tabs, so that I can quickly access the most important features without distraction.

#### Acceptance Criteria

1. THE Merchant_App SHALL display exactly 3 bottom navigation tabs: Home, Catalogue, and My Account
2. WHEN the user taps the Home tab, THE Merchant_App SHALL navigate to the Command Center dashboard
3. WHEN the user taps the Catalogue tab, THE Merchant_App SHALL navigate to the Service Menu screen
4. WHEN the user taps the My Account tab, THE Merchant_App SHALL navigate to the History and Data screen
5. THE Merchant_App SHALL remove the current Bookings and QR Code tabs from the bottom navigation

### Requirement 2: High-Strength Theme Implementation

**User Story:** As a salon owner working in varying lighting conditions, I want high-contrast visuals with massive fonts for important numbers, so that I can read critical data at a glance.

#### Acceptance Criteria

1. THE Merchant_App SHALL use Deep Black (#000000) as the primary background color
2. THE Merchant_App SHALL use High-Vis White (#FFFFFF) as the primary text color
3. THE Merchant_App SHALL use Salex Green (#00FF00) for success states and money-related actions
4. THE Merchant_App SHALL use Muted Red for "Closed" or inactive states
5. WHEN displaying revenue amounts or prices, THE Merchant_App SHALL use a massive condensed bold font (Calculator Style) with minimum 48pt size
6. WHEN displaying standard information text, THE Merchant_App SHALL use aligned, professional typography

### Requirement 3: Home Tab - Command Center

**User Story:** As a salon owner, I want a command center dashboard showing today's earnings and schedule, so that I can monitor my business at a glance.

#### Acceptance Criteria

1. THE Merchant_App SHALL display a "Today's Earnings" revenue block at the top of the Home screen
2. THE Merchant_App SHALL display the revenue amount in High_Strength_UI calculator-style font
3. THE Merchant_App SHALL display a Chai_Break toggle widget prominently below the revenue block
4. WHEN the Chai_Break toggle is OFF, THE Merchant_App SHALL dim the background to muted red
5. WHEN the Chai_Break toggle is ON, THE Merchant_App SHALL display normal background colors
6. THE Merchant_App SHALL display today's appointment cards in a scrollable list below the Chai_Break widget
7. WHEN displaying appointment cards, THE Merchant_App SHALL show time in a high-contrast box on the left, customer/service in center, and status pulse on right
8. THE Merchant_App SHALL display a Floating Action Button (+) for creating manual booking slots

### Requirement 4: Real-Time WhatsApp Booking Requests

**User Story:** As a salon owner, I want to receive and respond to WhatsApp booking requests in real-time, so that I can quickly accept or deny customer appointments.

#### Acceptance Criteria

1. WHEN a new WhatsApp booking request arrives, THE Merchant_App SHALL display a Floating_Request_Card that slides in from the top
2. THE Merchant_App SHALL receive PENDING booking notifications via Supabase_Realtime within 500ms of the WhatsApp commit
3. WHEN the merchant performs a SWIPE UP gesture on the Floating_Request_Card, THE Merchant_App SHALL accept the booking with heavy haptic feedback and animate the card flying off the top
4. WHEN the merchant performs a SWIPE DOWN gesture on the Floating_Request_Card, THE Merchant_App SHALL deny the booking and animate the card dropping off the bottom
5. IF a PENDING booking is not accepted within 15 minutes, THEN THE Backend_API SHALL automatically reject it to free up the chair
6. THE Merchant_App SHALL call the Backend_API endpoint `POST /api/v1/bookings/{bookingId}/confirm` when accepting a booking
7. THE Merchant_App SHALL call the Backend_API endpoint `PUT /api/v1/bookings/{bookingId}/cancel` when denying a booking

### Requirement 5: Catalogue Tab - Service Menu

**User Story:** As a salon owner, I want to manage my service catalogue with easy price editing, so that I can keep my offerings up to date.

#### Acceptance Criteria

1. THE Merchant_App SHALL display services as large, editable cards on the Catalogue screen
2. WHEN the merchant taps to edit a service price, THE Merchant_App SHALL display the price input in High_Strength_UI calculator-style font
3. THE Merchant_App SHALL provide an "Is Active" toggle on each service card
4. THE Merchant_App SHALL call the Backend_API endpoint `PUT /api/v1/services/{serviceId}` when updating a service
5. THE Merchant_App SHALL call the Backend_API endpoint `GET /api/v1/businesses/{businessId}/services` to fetch the service list
6. THE Merchant_App SHALL call the Backend_API endpoint `POST /api/v1/businesses/{businessId}/services` when creating a new service

### Requirement 6: My Account Tab - History and Data

**User Story:** As a salon owner, I want to view my revenue history and booking records, so that I can track my business performance over time.

#### Acceptance Criteria

1. THE Merchant_App SHALL display weekly and monthly revenue summaries on the My Account screen
2. THE Merchant_App SHALL display a historical bookings list showing payment modes with CASH and UPI icons
3. THE Merchant_App SHALL provide a "Share Report" capability for exporting data
4. THE Merchant_App SHALL call the Backend_API endpoint `GET /api/v1/businesses/{businessId}/bookings` to fetch booking history

### Requirement 7: Manual Slot Creation with Impact Zone Presets

**User Story:** As a salon owner, I want to quickly create manual booking slots for phone-in customers, so that walk-ins and phone bookings are tracked in the system.

#### Acceptance Criteria

1. WHEN the merchant taps the Floating Action Button (+), THE Merchant_App SHALL open a slot creator drawer
2. THE Merchant_App SHALL display 4 massive Impact_Zone_Input preset buttons: HAIRCUT, SHAVE, COMBO, OTHER
3. WHEN the merchant taps a preset button, THE Merchant_App SHALL instantly display the corresponding price in High_Strength_UI calculator-style font
4. THE Merchant_App SHALL call the Backend_API endpoint `POST /api/v1/bookings` to create the manual booking slot
5. THE Backend_API SHALL respect manually blocked slots in availability calculations

### Requirement 8: Physical Reconcile Checkout

**User Story:** As a salon owner, I want to record payments by physically dragging the total into payment icons, so that checkout feels tactile and intentional.

#### Acceptance Criteria

1. WHEN the merchant initiates checkout for a completed booking, THE Merchant_App SHALL open a checkout drawer
2. THE Merchant_App SHALL display the total amount in High_Strength_UI calculator-style font in the checkout drawer
3. THE Merchant_App SHALL display CASH and BANK target icons at the bottom of the checkout drawer
4. WHEN the merchant drags the total amount into the CASH icon, THE Merchant_App SHALL record the payment as cash with heavy haptic feedback
5. WHEN the merchant drags the total amount into the BANK icon, THE Merchant_App SHALL record the payment as UPI/bank transfer with heavy haptic feedback
6. THE Merchant_App SHALL call the Backend_API endpoint `POST /api/v1/bookings/{bookingId}/complete` with payment method when finalizing checkout

### Requirement 9: Revenue Burst Celebration

**User Story:** As a salon owner, I want to see a celebratory animation when I hit revenue milestones, so that I feel motivated and rewarded.

#### Acceptance Criteria

1. WHEN the daily revenue reaches a milestone (configurable threshold), THE Merchant_App SHALL trigger a Revenue_Burst animation
2. THE Revenue_Burst animation SHALL display the revenue number growing to fill the screen in Salex Green (#00FF00)
3. THE Revenue_Burst animation SHALL include heavy haptic feedback
4. THE Revenue_Burst animation SHALL last approximately 2 seconds before returning to normal view

### Requirement 10: Chai-Break Emergency Stop

**User Story:** As a salon owner, I want an emergency stop button to instantly pause accepting new bookings, so that I can take breaks without missing or double-booking customers.

#### Acceptance Criteria

1. THE Merchant_App SHALL display a massive, physical-style Chai_Break toggle on the Home screen
2. WHEN the merchant toggles Chai_Break to OFF, THE Merchant_App SHALL immediately stop displaying new WhatsApp booking requests
3. WHEN the merchant toggles Chai_Break to OFF, THE Merchant_App SHALL dim the entire dashboard background to muted red
4. WHEN the merchant toggles Chai_Break to ON, THE Merchant_App SHALL resume displaying new WhatsApp booking requests
5. THE Merchant_App SHALL persist the Chai_Break state locally and sync with Backend_API

### Requirement 11: Backend API Synchronization

**User Story:** As a developer, I want the frontend to properly sync with the new Express.js backend endpoints, so that all data flows correctly between the app and server.

#### Acceptance Criteria

1. THE Merchant_App SHALL use the base URL `http://localhost:3000/api/v1` in development mode
2. THE Merchant_App SHALL call `GET /api/v1/businesses/me` to fetch the current merchant's business profile
3. THE Merchant_App SHALL call `PUT /api/v1/businesses/{businessId}` to update business details
4. THE Merchant_App SHALL call `GET /api/v1/businesses/{businessId}/services` to list services
5. THE Merchant_App SHALL call `POST /api/v1/businesses/{businessId}/services` to create services
6. THE Merchant_App SHALL call `PUT /api/v1/services/{serviceId}` to update services
7. THE Merchant_App SHALL call `DELETE /api/v1/services/{serviceId}` to delete services
8. THE Merchant_App SHALL call `GET /api/v1/businesses/{businessId}/bookings` to list bookings
9. THE Merchant_App SHALL call `POST /api/v1/bookings/{bookingId}/confirm` to confirm bookings
10. THE Merchant_App SHALL call `PUT /api/v1/bookings/{bookingId}/cancel` to cancel bookings
11. THE Merchant_App SHALL call `POST /api/v1/bookings/{bookingId}/complete` to complete bookings with payment info
12. THE Merchant_App SHALL handle API response format `{success: boolean, data: T, message: string}` correctly

### Requirement 12: Haptic Feedback System

**User Story:** As a salon owner, I want physical-feeling feedback when I interact with the app, so that actions feel intentional and confirmed.

#### Acceptance Criteria

1. WHEN the merchant performs a swipe action on booking requests, THE Merchant_App SHALL trigger heavy haptic feedback
2. WHEN the merchant completes a checkout drag action, THE Merchant_App SHALL trigger heavy haptic feedback
3. WHEN the merchant toggles the Chai_Break switch, THE Merchant_App SHALL trigger medium haptic feedback
4. WHEN the Revenue_Burst animation triggers, THE Merchant_App SHALL trigger heavy haptic feedback
5. WHEN the merchant taps Impact_Zone_Input preset buttons, THE Merchant_App SHALL trigger light haptic feedback
