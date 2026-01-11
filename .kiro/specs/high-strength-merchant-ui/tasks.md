# Implementation Plan: High-Strength Merchant UI

## Overview

This implementation plan transforms the existing Salex Merchant App into the "High-Strength" UI paradigm. We'll patch existing code and add new components while ensuring proper backend synchronization with the Express.js API.

## Tasks

- [x] 1. Update Theme Configuration for High-Strength Design
  - [x] 1.1 Update color palette in theme/config.ts to High-Strength colors
    - Change BACKGROUND to #000000 (Deep Black)
    - Change TEXT to #FFFFFF (High-Vis White)
    - Add SALEX_GREEN #00FF00 for money/success
    - Add MUTED_RED #331111 for closed states
    - Add status colors (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.2 Add Calculator Typography configuration
    - Create CalculatorTypography object with sizes (sm: 32pt, md: 48pt, lg: 64pt, xl: 96pt)
    - Use system condensed bold font
    - _Requirements: 2.5_

- [x] 2. Create High-Strength UI Components
  - [x] 2.1 Create CalculatorText component
    - Implement massive bold number display
    - Support size variants (sm, md, lg, xl)
    - Support prefix (₹) and suffix (min)
    - Support animated count-up
    - _Requirements: 2.5, 3.2_

  - [x] 2.2 Create ChaiBreakToggle component
    - Implement massive physical-style toggle switch
    - Handle isActive state with visual feedback
    - Trigger medium haptic on toggle
    - _Requirements: 3.3, 10.1, 12.3_

  - [x] 2.3 Create RevenueBlock component
    - Display "Today's Earnings" with CalculatorText
    - Show revenue in Salex Green
    - _Requirements: 3.1, 3.2_

  - [x] 2.4 Create TimelineSlot component for appointment display
    - Show time, phone number, service, price
    - Color-coded background based on status
    - Progress bar for IN_PROGRESS bookings
    - Tap to expand for details
    - _Requirements: 3.6, 3.7_

  - [x] 2.5 Create FloatingRequestCard component
    - Swipeable card for WhatsApp booking requests
    - Swipe up to accept, swipe down to deny
    - Heavy haptic feedback on threshold
    - Spring animation on release
    - _Requirements: 4.1, 4.3, 4.4, 12.1_

  - [x] 2.6 Create ImpactZonePresets component
    - 4 massive preset buttons (HAIRCUT, SHAVE, COMBO, OTHER)
    - Light haptic on tap
    - Show price in CalculatorText on selection
    - _Requirements: 7.2, 7.3, 12.5_

  - [x] 2.7 Create CheckoutDrawer component
    - Display total in 96pt CalculatorText
    - Draggable amount with physics
    - CASH and BANK drop targets
    - Heavy haptic on successful drop
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 12.2_

  - [x] 2.8 Create RevenueBurst component
    - Full-screen celebration animation
    - 128pt green number
    - Heavy haptic feedback
    - 2-second duration
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 3. Create Haptic Feedback Hook
  - [x] 3.1 Create useHaptics hook
    - Implement light, medium, heavy haptic functions
    - Use expo-haptics or react-native-haptic-feedback
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 4. Update Navigation to 3-Tab System
  - [x] 4.1 Modify TabNavigator.tsx
    - Remove Bookings and QrCode tabs
    - Keep only Home, Catalogue (rename from Services), My Account (rename from Profile)
    - Update tab icons and labels
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [-] 5. Rebuild Home Screen (Command Center)
  - [x] 5.1 Redesign HomeScreen.tsx (formerly DashboardScreen)
    - Add RevenueBlock at top
    - Add ChaiBreakToggle below revenue
    - Replace appointment cards with TimelineSlot list
    - Add FloatingActionButton for manual slots
    - Implement muted red background when Chai-Break is OFF
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ] 5.2 Integrate FloatingRequestCard for real-time bookings
    - Subscribe to Supabase Realtime for PENDING bookings
    - Show FloatingRequestCard when new request arrives
    - Handle swipe accept/deny actions
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.3 Create SlotCreatorDrawer for manual bookings
    - Open on FAB tap
    - Include ImpactZonePresets
    - Customer phone input (optional)
    - Book Now button
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 6. Rebuild Catalogue Screen (Service Menu)
  - [ ] 6.1 Redesign ServicesScreen.tsx as CatalogueScreen
    - Large editable service cards
    - Is Active toggle on each card
    - Calculator-style price input when editing
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 7. Rebuild My Account Screen (History)
  - [ ] 7.1 Redesign ProfileScreen.tsx as MyAccountScreen
    - Weekly/Monthly revenue summaries
    - Historical bookings list with payment icons (CASH/UPI)
    - Share Report button
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 8. Update API Services for Backend Sync
  - [x] 8.1 Update businessService.ts
    - Ensure GET /businesses/me extracts data.business correctly
    - Handle response format {success, data: {business}, message}
    - _Requirements: 11.2, 11.3, 11.12_

  - [x] 8.2 Update serviceService.ts
    - Ensure GET /businesses/{businessId}/services extracts data.services
    - Ensure POST /businesses/{businessId}/services works correctly
    - Ensure PUT /services/{serviceId} works correctly
    - Ensure DELETE /services/{serviceId} works correctly
    - _Requirements: 11.4, 11.5, 11.6, 11.7_

  - [x] 8.3 Update bookingService.ts
    - Ensure GET /businesses/{businessId}/bookings extracts data.bookings
    - Add confirmBooking function for POST /bookings/{bookingId}/confirm
    - Update cancelBooking to use PUT /bookings/{bookingId}/cancel
    - Add completeBooking function for POST /bookings/{bookingId}/checkout with payment method
    - _Requirements: 11.8, 11.9, 11.10, 11.11, 11.12_

  - [x] 8.4 Implement Real OTP Authentication
    - Create authStore.ts with JWT token persistence
    - Rewrite authService.ts to call backend OTP endpoints
    - Update apiClient.ts to inject JWT token from auth store
    - Update PhoneAuthScreen.tsx to use real auth flow
    - Update AuthContext.tsx to use auth store
    - _Requirements: Backend auth integration_

- [ ] 9. Update Zustand Stores
  - [ ] 9.1 Update bookingStore.ts
    - Add confirm action
    - Add complete action with payment method
    - Add pendingRequests state for real-time bookings
    - _Requirements: 4.6, 4.7, 8.6_

  - [ ] 9.2 Create chaiBreakStore.ts
    - Manage isActive state
    - Persist to AsyncStorage
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

  - [ ] 9.3 Create revenueStore.ts
    - Track daily, weekly, monthly totals
    - Track milestone threshold
    - Trigger Revenue Burst on milestone
    - _Requirements: 9.1_

- [ ] 10. Implement Real-time Booking Subscription
  - [ ] 10.1 Create useRealtimeBookings hook
    - Subscribe to Supabase Realtime for business bookings
    - Filter for PENDING status
    - Update pendingRequests in store
    - _Requirements: 4.2_

- [ ] 11. Checkpoint - Verify Core UI Components
  - Ensure all High-Strength components render correctly
  - Verify theme colors are applied
  - Test haptic feedback on device
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Integration Testing
  - [ ] 12.1 Test booking accept flow
    - WhatsApp request → FloatingRequestCard → Swipe up → API call → UI update
    - _Requirements: 4.3, 4.6_

  - [ ] 12.2 Test checkout flow
    - Select completed booking → CheckoutDrawer → Drag to CASH/BANK → API call
    - _Requirements: 8.4, 8.5, 8.6_

  - [ ] 12.3 Test service management flow
    - View catalogue → Edit service → Save → API call → List refresh
    - _Requirements: 5.4, 5.5, 5.6_

  - [ ] 12.4 Test Chai-Break flow
    - Toggle OFF → Background dims → Requests hidden → Toggle ON → Resume
    - _Requirements: 10.2, 10.3, 10.4_

- [ ] 13. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all screens match High-Strength design
  - Verify backend sync works correctly

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Existing code will be patched rather than rewritten where possible
- Backend API response format is `{success: boolean, data: {entity}, message: string}`
