# 2. Requirements

## Functional

1.  **FR1:** The system shall provide a merchant app allowing salon owners to set up and manage their profile, including services, pricing, and business hours.
2.  **FR2:** The system shall generate a unique, scannable QR code for each salon that pre-fills a WhatsApp chat with the salon's unique code.
3.  **FR3:** The system shall provide a button-driven conversational flow within WhatsApp for customers to book appointments by selecting a service and a time slot.
4.  **FR4:** The services and prices presented in the WhatsApp booking flow must be dynamically populated from the configuration set by the merchant in their app.
5.  **FR5:** The merchant app shall receive an instant push notification with a distinct, loud sound when a new booking is made.
6.  **FR6:** The merchant app shall feature a dashboard displaying a list of today's and upcoming bookings.
7.  **FR7:** The system shall identify returning customers by their WhatsApp phone number and offer an expedited re-booking process.
8.  **FR8:** The system shall allow a customer to cancel their booking through the WhatsApp interface.
9.  **FR9:** The system shall allow a merchant to cancel a customer's booking from within the merchant app.
10. **FR10:** The merchant app shall display a basic analytics summary of total bookings and total revenue for the current day.
11. **FR11:** The app shall provide a "Duty Mode" that displays a simplified view of the booking dashboard and a prominent button for adding walk-in customer appointments in two taps.
12. **FR12:** The system shall support a booking lifecycle where new bookings are `PENDING` merchant approval. Merchants can `Accept` (moving to `CONFIRMED`), `Deny` (moving to `CANCELLED`), or mark as `Done` (moving to `COMPLETED`).
13. **FR13:** Merchants shall be able to trigger a "Payment Reminder" which sends a WhatsApp message to the customer with payment details.

## Non-Functional

1.  **NFR1 (Performance):** The median response time for any WhatsApp bot interaction must be under 2 seconds.
2.  **NFR2 (Reliability):** The end-to-end system shall maintain an uptime of 99.9%.
3.  **NFR3 (Reliability):** The notification delivery success rate, including the push and SMS fallback mechanism, must exceed 99.5%.
4.  **NFR4 (Scalability):** The V1 architecture must be capable of supporting 5,000 active businesses and 1.5 million end-users without requiring a fundamental redesign.
5.  **NFR5 (Security):** All API endpoints exposed to the merchant app must require authentication.
6.  **NFR6 (Security):** All Customer Personally Identifiable Information (PII) must be stored and transmitted securely, following industry best practices.
7.  **NFR7 (Data Integrity):** All database operations related to creating or modifying a booking must be performed within a transaction to prevent data loss.
8.  **NFR8 (Notifications):** The system shall trigger an SMS notification to the merchant if a push notification for a new booking is not acknowledged within 60 seconds.
9.  **NFR9 (Usability):** The merchant onboarding flow within the app must be completable in under 10 minutes.