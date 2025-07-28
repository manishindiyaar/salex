# Epic 3: V1 Enhancements & Intelligence

**Expanded Goal:** To build upon the core booking system by introducing intelligent features that enhance the experience for both merchants and their customers. This epic will deliver a basic analytics view for merchants, a streamlined "Duty Mode" for efficiently managing walk-in customers, and a "smart welcome back" feature to expedite the booking process for returning customers.

---

## Story 3.1: Display Daily Analytics

**As a** salon owner, **I want** to see my total bookings and total revenue for the day at a glance, **so that** I can quickly understand my daily business performance.

**Acceptance Criteria:**
1.  A new "Analytics" or "Report" tab is available in the merchant app's main navigation.
2.  The screen makes an authenticated call to a new API endpoint (e.g., `GET /api/v1/businesses/{id}/analytics/daily`).
3.  The API calculates the total number of bookings with a status of `CONFIRMED` or `COMPLETED` for the current calendar day.
4.  The API calculates the sum of the `price` for all `CONFIRMED` or `COMPLETED` bookings for the current calendar day.
5.  The screen clearly displays two metrics: "Today's Bookings" and "Today's Revenue".
6.  The calculations must be based on the salon's local timezone.

---

## Story 3.2: Implement "Duty Mode" for Staff

**As a** salon owner or staff member, **I want** to activate a simplified "Duty Mode," **so that** I can focus only on the schedule and quickly add walk-in customers.

**Acceptance Criteria:**
1.  A clear toggle or button is present on the main booking dashboard to enter and exit "Duty Mode".
2.  When "Duty Mode" is active, the UI is simplified, hiding non-essential navigation like "Settings" or "Analytics".
3.  A large, prominent "+" icon is displayed on the screen in Duty Mode.
4.  Tapping the "+" icon initiates the streamlined "Add Walk-in" flow (defined in Story 3.3).

---

## Story 3.3: Streamlined Walk-in Booking Form

**As a** salon owner or staff member, **I want** to add a walk-in booking using a minimal, two-tap process, **so that** I can add them to the queue without interrupting my work with other customers.

**Acceptance Criteria:**
1.  The "Add Walk-in" screen, launched from Duty Mode, is optimized for speed.
2.  **Tap 1:** The user is presented with a list of the salon's existing `Services`. Tapping a service selects it.
3.  **Tap 2:** The user is presented with the next available time slot and a "Book Now" button. Tapping "Book Now" confirms the appointment.
4.  Upon confirmation, a new `Customer` record is created on the backend (e.g., with a placeholder name like "Walk-in Customer").
5.  A new `Booking` record is created with the status `CONFIRMED` (as it's a walk-in).
6.  The new booking instantly appears on the booking dashboard.

---

## Story 3.4: "Smart Welcome Back" for Returning Customers

**As a** returning customer, **I want** the WhatsApp bot to recognize me and offer to re-book at my last-visited salon, **so that** I can make a new appointment much faster.

**Acceptance Criteria:**
1.  When a user sends any message to the Salex WhatsApp number, the backend first checks if a `Customer` record exists for their phone number.
2.  If the `Customer` record has a `lastVisitedBusinessId`, the first message from the bot is: "Welcome back to Salex! Book again with `{Salon Name}`?" followed by "[Yes]" and "[No, find another]" buttons.
3.  If the customer taps "[Yes]", the booking flow for that salon begins immediately at the service selection step.
4.  If the customer taps "[No, find another]" or is a new user, the standard flow (asking for a salon code) begins.
5.  After every successful booking, the `lastVisitedBusinessId` on the `Customer` record is updated to the ID of the salon they just booked with.

## Rationale

This epic rounds out our V1 feature set. These stories are built directly on top of the core functionality established in Epic 2. The Daily Analytics feature provides immediate, tangible value and demonstrates the benefit of digitization to the merchant. The Duty Mode and Walk-in flow address a key operational need for any service business, making the app a practical tool for the entire staff. Finally, the Smart Welcome Back feature is a crucial enhancement that reduces friction for repeat customers, encouraging loyalty and continued use of the platform.