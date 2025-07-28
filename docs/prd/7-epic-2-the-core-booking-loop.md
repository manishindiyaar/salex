# Epic 2: The Core Booking Loop

**Expanded Goal:** To deliver the complete, end-to-end booking experience that forms the core value proposition of Salex. This epic connects the customer on WhatsApp with the merchant on their app. Once complete, the system will be fully functional for a salon to manage its entire appointment schedule through our platform, from receiving the booking request to marking it as complete.

---

## Story 2.1: Generate & Display Business QR Code

**As a** salon owner, **I want** to view and share a unique QR code for my business from the app, **so that** my customers can easily scan it to start a booking.

**Acceptance Criteria:**
1.  A new screen or section in the merchant app is available to display the business QR code.
2.  The backend generates a unique QR code upon business creation.
3.  The QR code, when scanned, opens WhatsApp and pre-fills the chat with the text `BOOK_AT_{businessId}` (e.g., `BOOK_AT_bus_123abc`).
4.  The merchant has an option to share or save the QR code image from the app.

---

## Story 2.2: Customer Initiates Booking & Receives Confirmation

**As a** customer, **I want** to book an appointment via a WhatsApp conversational flow and receive confirmation that my request has been sent, **so that** I know the salon has my request.

**Acceptance Criteria:**
1.  The backend's WhatsApp webhook correctly receives and processes the customer's service and time slot selections via a button-driven flow.
2.  Upon the customer's final selection, a new `Booking` record is created in the database with the initial status `PENDING`.
3.  A final message is sent to the customer: "Your request has been sent to the salon! You will receive another message once they confirm."
4.  The customer's conversation session in Redis is cleared.

---

## Story 2.3: Real-time Booking Request Notification

**As a** salon owner, **I want** to receive an immediate, loud push notification on my app whenever a customer requests a new booking, **so that** I can accept or deny it promptly.

**Acceptance Criteria:**
1.  Immediately after a `Booking` is created with `PENDING` status, the backend's Notification Service is triggered.
2.  A high-priority FCM push notification is sent to the correct merchant's device(s). The message text clearly indicates it's a new request that needs action.
3.  When the notification is received, the merchant app plays the custom, loud alert sound.
4.  The multi-layered notification system is active: if the push is not acknowledged, an SMS is sent as a fallback.

---

## Story 2.4: Merchant Manages Booking Requests

**As a** salon owner, **I want** to see pending booking requests on my dashboard and be able to `Accept` or `Deny` them, **so that** I have full control over my schedule.

**Acceptance Criteria:**
1.  The main "Bookings" dashboard in the merchant app has a clear section or tab for "Pending Requests".
2.  Each pending booking is displayed as a card with `Accept` and `Deny` buttons.
3.  Tapping `Accept` updates the booking status to `CONFIRMED`.
4.  Tapping `Deny` updates the booking status to `CANCELLED_BY_SALON`.
5.  After an action is taken, the booking card moves from the "Pending" section to the main "Today's Bookings" list.

---

## Story 2.5: Customer Receives Booking Status Update

**As a** customer, **I want** to receive a final WhatsApp message confirming or denying my booking request, **so that** I have a definitive answer.

**Acceptance Criteria:**
1.  When a merchant `Accepts` a booking, a pre-approved "Booking Confirmed" template message is sent to the customer via WhatsApp.
2.  When a merchant `Denies` a booking, a pre-approved "Booking Denied" template message is sent to the customer via WhatsApp.

---

## Story 2.6: Mark Booking as Complete & Request Payment

**As a** salon owner, **I want** to mark a booking as `Done` after the service is complete and then request payment, **so that** I can manage the customer lifecycle and my revenue.

**Acceptance Criteria:**
1.  On the booking details screen for a `CONFIRMED` appointment, there is a "Mark as Done" button.
2.  Tapping "Mark as Done" updates the booking status to `COMPLETED`.
3.  Once a booking is `COMPLETED`, the UI displays a "Request Payment" button.
4.  Tapping "Request Payment" triggers a pre-approved "Payment Reminder" template message to be sent to the customer via WhatsApp, containing the booking total and the salon's payment information (e.g., UPI ID).

## Rationale

This epic represents the absolute core of the Salex product. The stories are sequenced to logically build the entire user journey, now incorporating the merchant approval step. This flow gives the merchant complete control over their schedule while keeping the customer informed at every step, delivering on our promise of a reliable and transparent system.