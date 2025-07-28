# 8. Core Workflows

## WhatsApp Booking Flow (Happy Path)

This diagram illustrates the sequence of events from when a customer sends their first message to when a booking is confirmed and the merchant is notified. It shows how our backend interacts with WhatsApp, Redis (for session management), our database, and the notification service in real-time.

```mermaid
sequenceDiagram
    participant Customer
    participant WhatsApp
    participant Backend (WA Adapter)
    participant Redis
    participant DB (Supabase)
    participant NotificationSvc

    Customer->>WhatsApp: Sends initial message (e.g., "BOOK_AT_S123")
    WhatsApp->>Backend (WA Adapter): Webhook: Incoming message
    Backend (WA Adapter)->>Redis: SET session for Customer phone # w/ salonId & state='AWAITING_SERVICE'
    Backend (WA Adapter)->>DB (Supabase): Fetch services for salonId='S123'
    DB (Supabase)-->>Backend (WA Adapter): Return services list
    Backend (WA Adapter)->>WhatsApp: Send message w/ service buttons
    WhatsApp-->>Customer: Display service options
    
    Customer->>WhatsApp: Clicks a service button
    WhatsApp->>Backend (WA Adapter): Webhook: User selected a service
    Backend (WA Adapter)->>Redis: GET session for Customer to verify state
    Redis-->>Backend (WA Adapter): Return current session
    Backend (WA Adapter)->>Redis: UPDATE session state to 'AWAITING_TIMESLOT'
    Backend (WA Adapter)->>DB (Supabase): Fetch available timeslots
    DB (Supabase)-->>Backend (WA Adapter): Return available timeslots
    Backend (WA Adapter)->>WhatsApp: Send message w/ time slot buttons
    WhatsApp-->>Customer: Display time slot options
    
    Customer->>WhatsApp: Clicks a time slot button
    WhatsApp->>Backend (WA Adapter): Webhook: User selected a time slot
    Backend (WA Adapter)->>DB (Supabase): Create Booking record
    activate DB (Supabase)
    DB (Supabase)-->>Backend (WA Adapter): Booking confirmed
    deactivate DB (Supabase)
    
    Backend (WA Adapter)->>Redis: DELETE session for Customer
    Backend (WA Adapter)->>WhatsApp: Send "✅ Your booking is confirmed!" message
    WhatsApp-->>Customer: Display confirmation
    
    Backend (WA Adapter)->>NotificationSvc: Trigger new booking alert for merchant
    NotificationSvc->>...: (Starts FCM + SMS fallback flow)



    Merchant Onboarding and User Sync
This diagram illustrates how a new merchant signs up via the React Native app, how their identity is created in Clerk, and how their user record is synced to our local database to be associated with their business.

Code snippet

sequenceDiagram
    participant Merchant
    participant RN_App as React Native App
    participant Clerk
    participant Backend_API as Backend API
    participant DB as DB (Supabase)

    %% --- Sign-up Flow (Same as before) ---
    Merchant->>RN_App: Opens app and starts sign-up
    RN_App->>Clerk: Renders Clerk Sign-Up UI
    Merchant->>Clerk: Completes sign-up flow (e.g., with phone/OTP)
    Clerk-->>RN_App: Returns JWT (Session Token)
    RN_App->>RN_App: Securely stores JWT
    
    %% --- NEW: Business Type Selection ---
    RN_App->>Merchant: Displays "Who are you?" screen
    Merchant->>RN_App: Selects "Saloon" button
    
    %% --- Dynamic Onboarding Form ---
    RN_App->>Merchant: Shows multi-step form specific to Salons
    Merchant->>RN_App: Fills out and submits salon details
    
    %% --- Backend Logic with Business Type ---
    RN_App->>Backend_API: POST /api/v1/businesses (JWT, business details, businessType: 'SALON')
    
    Backend_API->>Clerk: Validate JWT
    Clerk-->>Backend_API: Validation Success (returns userId)

    Backend_API->>DB: Find or Create User record with clerkUserId
    DB-->>Backend_API: User record available

    Backend_API->>DB: 1. Create Business record (with businessType='SALON')
    Backend_API->>DB: 2. Create Salon details record (linked to Business)
    DB-->>Backend_API: Business and Salon records created
    
    Backend_API-->>RN_App: 201 Created (returns new Business object)
    RN_App->>Merchant: Navigates to the main dashboard
Multi-Layered Notification Flow
This diagram illustrates the sequence that begins immediately after a booking is confirmed in the database. It shows how our Notification Service attempts to deliver a real-time push notification and automatically triggers an SMS fallback if the first attempt is not successful within 60 seconds.

Code snippet

sequenceDiagram
    participant BookingSvc as Backend (Booking Service)
    participant NotificationSvc as Backend (Notification Svc)
    participant FCM as Firebase Cloud Messaging
    participant MerchantApp as React Native App
    participant SmsGateway as SMS Gateway (Twilio)

    BookingSvc->>NotificationSvc: newBooking(bookingDetails)
    
    NotificationSvc->>FCM: Send high-priority push notification payload
    FCM-->>MerchantApp: Delivers push notification
    MerchantApp-->>MerchantApp: Plays loud, custom alert sound
    
    par
        NotificationSvc->>NotificationSvc: Start 60-second timer for SMS fallback
    and
        MerchantApp->>Backend_API as Backend API: (Optional) Send ACK: POST /notifications/ack
        Backend_API as Backend API->>NotificationSvc: Acknowledged, cancel SMS
        NotificationSvc->>NotificationSvc: Cancel timer
    end

    alt After 60 seconds, if no ACK received
        NotificationSvc->>SmsGateway: Send SMS message with booking details
        SmsGateway-->>MerchantApp: Delivers SMS to merchant's phone
    end