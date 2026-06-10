# Shared Number Webview Booking Plan

Document status: Planning reference  
Audience: Product, engineering, coding agents, and future implementers  
Prepared on: 2026-06-10  
Implementation status: Not started

## 1. Why This Plan Exists

Most Salex customers will use the shared Salex WhatsApp number.

The goal is to make shared-number booking feel as smooth as the metro ticket booking experience:

```text
Open WhatsApp
Tap once
Select details in a fast webview
Confirm
Receive ticket/booking message
```

For Salex, the same idea becomes:

```text
Open WhatsApp
Tap Book Now
Select service/date/time in webview
Confirm
Receive WhatsApp booking confirmation
Owner sees booking in merchant app
```

The important rule is:

```text
WhatsApp creates identity and context.
Webview gives fast UI.
Salex backend remains the source of truth.
```

The webview must not become a separate booking system. It is only a better customer interface around the existing shared-number WhatsApp booking architecture.

## 2. Recommended Customer Flow: Individual Salon QR

This is the preferred flow when a customer scans a specific salon QR code.

```text
Customer scans Glow Studio QR
↓
WhatsApp opens Salex shared number
↓
Prefilled message appears:
BOOK_1557
↓
Customer taps Send
↓
Salex webhook receives BOOK_1557
↓
Salex maps routing code 1557 -> Glow Studio businessId
↓
Salex creates/updates WhatsAppConversation
↓
Salex creates WebBookingSession
↓
Bot replies:
"Book appointment at Glow Studio"
[Book Now]
↓
Customer taps Book Now
↓
Booking webview opens inside WhatsApp
↓
Webview already knows:
businessId = Glow Studio
customerPhone = WhatsApp number
conversationId = active WhatsApp conversation
↓
Customer selects service/date/time
↓
Customer confirms
↓
Backend re-checks availability
↓
Booking is created in Salex DB
↓
Customer gets WhatsApp confirmation
↓
Owner sees booking in merchant app
```

This is safer than opening the webview directly from QR because the first WhatsApp message gives Salex the verified customer phone and the correct salon context.

## 3. Recommended Customer Flow: Generic Shared Number

This is the flow when the customer starts from the shared Salex number without a specific salon QR.

```text
Customer messages Salex shared number:
"Hi"
↓
Bot replies:
"Find a salon near you"
[Search Salon]
↓
Customer taps Search Salon
↓
Webview opens inside WhatsApp
↓
Customer searches salon by name, area, or service
↓
Customer selects salon
↓
Customer selects service/date/time
↓
Customer confirms
↓
Backend re-checks availability
↓
Booking is created in Salex DB
↓
Customer receives WhatsApp confirmation
↓
Owner sees booking in merchant app
```

Use this path when the customer does not already have a salon routing code.

## 4. Why Booking Will Not Break

Booking does not break because WhatsApp remains the identity anchor.

The system has four different responsibilities:

```text
WhatsAppConversation = conversation and routing state
WebBookingSession = temporary webview UI session
BookingIntent = short-lived slot hold
Booking = final source of truth
```

The webview should never be treated as the source of truth.

If the webview fails, closes, expires, or cannot load, the customer can still continue in WhatsApp chat.

## 5. Webview UX

The webview should feel fast, focused, and mobile-first.

It should not ask the customer to log in or download an app.

### 5.1 Individual Salon Booking Webview

If the salon is already known from QR/routing code, skip salon search.

Screens:

```text
1. Salon landing
2. Service selection
3. Date/time selection
4. Review and confirm
5. Success
```

Salon landing should show:

```text
Salon name
Area/address
Open/closed status
Popular services
```

Service selection should show:

```text
Service name
Duration
Price
```

Date/time selection should show:

```text
Today
Tomorrow
Next 7 days
Available slot chips
```

Review screen should show:

```text
Salon
Service
Date/time
Price
Customer WhatsApp number
Confirm button
```

Success screen should show:

```text
Booking confirmed or pending owner approval
Return to WhatsApp button
```

### 5.2 Generic Salon Search Webview

If the salon is not known yet, start with search.

Search inputs:

```text
Salon name
Area
Service
Routing code
```

Salon result should show:

```text
Salon name
Area
Category
Open/closed status
Top services or starting price
```

After salon selection, the webview continues into the same service/date/time booking journey.

## 6. Session Architecture

Create a short-lived `WebBookingSession`.

Suggested data shape:

```text
WebBookingSession
- id
- tokenHash
- conversationId
- businessId
- customerPhone
- source
  - QR
  - WHATSAPP_SEARCH
  - DIRECT_LINK
- status
  - STARTED
  - HOLDING
  - CONFIRMED
  - EXPIRED
  - CANCELLED
- selectedServiceId
- selectedDate
- selectedSlot
- bookingIntentId
- bookingId
- expiresAt
- createdAt
- updatedAt
```

The public URL should be opaque:

```text
https://book.salex.in/wbs/session_token
```

Do not expose raw values in the URL:

```text
customerPhone
businessId
conversationId
```

Recommended TTLs:

```text
Web booking session: 15 minutes
Slot hold: 5 minutes
WhatsApp conversation context: existing 24-hour window
```

## 7. Backend Data Flow

```text
Inbound WhatsApp message
↓
Resolve routing code or detect generic search path
↓
Create/update WhatsAppConversation
↓
Create WebBookingSession
↓
Send WhatsApp CTA URL button
↓
Customer opens webview
↓
Webview loads session bootstrap
↓
Customer selects service/date/time
↓
Backend checks availability
↓
Backend creates BookingIntent hold
↓
Customer confirms
↓
Backend re-checks availability
↓
Backend creates Booking
↓
BookingIntent marked CONFIRMED
↓
WhatsAppConversation state set COMPLETED
↓
Outbound WhatsApp confirmation queued
```

Important rule:

```text
The webview should not directly create final bookings without a final availability re-check.
```

## 8. APIs Needed

These are planning-level API contracts. Exact paths can be adjusted during implementation, but the behavior should remain the same.

### 8.1 Create Web Booking Session

```text
POST /api/v1/whatsapp/web-booking-sessions
```

Used internally by the WhatsApp worker after routing code resolution or salon search start.

Input:

```text
conversationId
businessId optional
customerPhone
source
```

Output:

```text
sessionId
publicUrl
expiresAt
```

### 8.2 Load Session Bootstrap

```text
GET /api/v1/public/web-booking-sessions/:token
```

Returns safe webview bootstrap data:

```text
session status
business summary if selected
customer phone masked
current selections
expiresAt
```

### 8.3 Search Salons

```text
GET /api/v1/public/web-booking-sessions/:token/businesses/search?q=...
```

Used only for generic shared-number search.

Returns:

```text
businessId
name
area/address summary
category
open/closed status
```

### 8.4 Select Salon

```text
POST /api/v1/public/web-booking-sessions/:token/select-business
```

Used only when the session starts without a business.

Input:

```text
businessId
```

Behavior:

```text
Stores selected businessId on WebBookingSession
Updates WhatsAppConversation context
```

### 8.5 List Services

```text
GET /api/v1/public/web-booking-sessions/:token/services
```

Returns active bookable services for the selected business:

```text
serviceId
name
duration
price
description optional
```

### 8.6 List Slots

```text
GET /api/v1/public/web-booking-sessions/:token/slots?serviceId=...&date=...
```

Returns available slots using the existing availability service.

Rules:

```text
Respect business hours
Respect 7-day booking window
Use 30-minute start intervals
Hide unavailable slots
```

### 8.7 Hold Slot

```text
POST /api/v1/public/web-booking-sessions/:token/hold
```

Input:

```text
serviceId
slotStart
```

Behavior:

```text
Check availability
Expire previous pending hold for this session
Create or refresh BookingIntent
Set WebBookingSession status = HOLDING
Return hold expiry
```

### 8.8 Confirm Booking

```text
POST /api/v1/public/web-booking-sessions/:token/confirm
```

Behavior:

```text
Load valid BookingIntent
Re-check availability
Create Booking
Mark BookingIntent CONFIRMED
Mark WebBookingSession CONFIRMED
Update WhatsAppConversation context/state
Queue WhatsApp confirmation
Return booking summary
```

### 8.9 Cancel Session

```text
POST /api/v1/public/web-booking-sessions/:token/cancel
```

Behavior:

```text
Cancel session
Expire pending hold
Return WhatsApp restart link
```

## 9. WhatsApp Messages

Use WhatsApp interactive CTA URL button messages for opening the webview.

Example for known salon:

```text
Glow Studio is ready for booking.

Tap below to choose service and time.

[Book Now]
```

Example for generic search:

```text
Find a salon near you.

Search by salon name, area, or service.

[Search Salon]
```

Fallback text:

```text
If the button does not open, reply BOOK and we will continue here in chat.
```

After successful booking:

```text
Your appointment is confirmed.

Salon: Glow Studio
Service: Haircut
Time: 10 Jun, 5:30 PM

See you soon.
```

If owner approval is required:

```text
Your booking request has been sent to Glow Studio.
We will confirm once the salon accepts it.
```

## 10. Failure Handling

### Customer Closes Webview

If no booking is confirmed after a few minutes:

```text
Your booking is not finished.

[Continue Booking]
```

### Session Expires

Show in webview:

```text
Booking session expired.
Please restart from WhatsApp.

[Restart on WhatsApp]
```

### Slot Taken Before Confirmation

Show:

```text
That slot was just booked.
Please choose another time.
```

Then refresh slots.

### Duplicate Confirm

Use `BookingIntent` idempotency.

If booking already exists:

```text
Return existing booking instead of creating duplicate.
```

### Webview Cannot Open

Customer can continue with the existing chat-based booking flow.

Fallback:

```text
Reply BOOK to continue in chat.
```

### Message Delay Or Retry

Use existing conversation version / stale-message guard.

If an old outbound message is delayed, do not let it move the customer backward.

## 11. Shared And Dedicated Channel Resolution

Shared-number and dedicated-number booking should use the same booking engine after `businessId` is known.

The difference is only how the business is resolved.

```text
Shared number:
routingCode -> businessId

Dedicated number:
phoneNumberId -> WhatsAppChannel -> businessId
```

Do not check this on every outbound message:

```text
Does this business have a connected dedicated number?
```

That would slow down the 90% shared-number path for the 10% premium dedicated-number path.

Instead, resolve the WhatsApp channel once when the conversation/session starts.

Inbound shared-number fast path:

```text
if inbound phoneNumberId == SALEX_SHARED_PHONE_NUMBER_ID:
  channelMode = SHARED
  use platform shared number
  skip WhatsAppChannel DB lookup
```

Inbound dedicated-number path:

```text
if inbound phoneNumberId != SALEX_SHARED_PHONE_NUMBER_ID:
  lookup WhatsAppChannel by phoneNumberId
  if CONNECTED:
    businessId = channel.businessId
    channelMode = DEDICATED
    whatsAppChannelId = channel.id
```

Store the resolved channel context on the conversation/session:

```text
conversation.channelMode = SHARED | DEDICATED
conversation.phoneNumberId
conversation.whatsAppChannelId optional
webBookingSession.channelMode
webBookingSession.phoneNumberId
```

Outbound sending should ask:

```text
Which channel did this conversation come from?
```

Not:

```text
Does this business have a dedicated number right now?
```

Outbound shared-number path:

```text
channelMode == SHARED
↓
use platform WHATSAPP_PHONE_NUMBER_ID
use platform WHATSAPP_ACCESS_TOKEN
no per-message DB lookup
```

Outbound dedicated-number path:

```text
channelMode == DEDICATED
↓
use whatsAppChannelId / phoneNumberId from session
load channel credentials from Redis cache
decrypt only on cache miss
send from salon's own number
```

Recommended Redis keys:

```text
whatsapp:channel:phoneNumberId:{phoneNumberId}
whatsapp:channel:business:{businessId}
whatsapp:channel:creds:{whatsAppChannelId}
```

This keeps shared-number booking fast while still supporting premium dedicated numbers.

Final rule:

```text
Inbound decides channel once.
Conversation stores channel context.
WebBookingSession copies channel context.
Outbound uses stored channel context.
Shared path uses env config directly.
Dedicated path uses cached dedicated credentials.
```

## 12. Redis And Scale

Use Redis for fast temporary session operations.

Suggested Redis keys:

```text
webbooking:session:{tokenHash}
webbooking:lock:{sessionId}
webbooking:hold:{bookingIntentId}
```

Use DB for durable business records:

```text
WhatsAppConversation
BookingIntent
Booking
WhatsAppMessage
```

Do not write to DB for every small webview UI click.

Write durable events only for:

```text
Session created
Salon selected
Hold created
Booking confirmed
Session expired/cancelled
```

This keeps the shared-number booking path scalable.

## 13. Security Rules

The webview URL must use an opaque token.

Do not expose:

```text
phone number
businessId
conversationId
bookingIntentId
```

Security requirements:

```text
Token is random and unguessable
Token expires quickly
Token is scoped to one session
Confirm endpoint is idempotent
Availability is re-checked server-side
Rate limit session APIs by token/IP/customerPhone
Do not trust client-side price or duration
Use service price/duration snapshots from DB
```

## 14. What Not To Do

Avoid:

```text
QR directly opens webview without WhatsApp context
Webview creates booking without customerPhone
Static slots without final availability check
Long-lived public booking tokens
Raw phone/businessId in URL
Separate booking model for webview
Custom booking flow per salon
Writing DB records for every UI click
```

## 15. Final Recommendation

Build shared-number booking like this:

```text
Salon QR
↓
WhatsApp routing message
↓
Book Now button
↓
Webview booking
↓
WhatsApp confirmation
```

This gives Salex:

```text
Metro-style fast UX
Verified WhatsApp phone context
No Meta QR limit
No routing breakage
Chat fallback
Scalable Redis-backed sessions
Same Booking source of truth
```

## 16. Useful References

- [Meta Interactive CTA URL Button Messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/interactive-cta-url-messages/)
- [Meta Sending Interactive Messages](https://developers.facebook.com/docs/whatsapp/guides/interactive-messages/)
- [Salex Master Premium App Plan](../salex-salon-premium-app-master-plan.md)
- [Booking Flow UX](./05-booking-flow-ux.md)
- [Engine Router And State Machine](./03-engine-router-state-machine.md)
- [Navigation And Session Management](./06-navigation-session.md)
