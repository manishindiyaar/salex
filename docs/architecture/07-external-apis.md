# 7. External APIs

## WhatsApp Cloud API

* **Purpose:** To send and receive messages from customers. This is the core interface for the end-user booking flow.
* **Documentation:** [https://developers.facebook.com/docs/whatsapp/cloud-api](https://developers.facebook.com/docs/whatsapp/cloud-api)
* **Base URL(s):** `https://graph.facebook.com/v22.0/`
* **Authentication:** Permanent API Access Token sent as a Bearer Token.
* **Rate Limits:** Tiered limits apply. Starts at 250 messages per second.
* **Key Endpoints Used:**
    * `POST /{phoneNumberId}/messages` - Used by our backend to send template-based messages (e.g., booking confirmations, service lists) to users.
    * Our backend will also expose a webhook (`POST /webhooks/whatsapp`) to *receive* incoming messages from users.
* **Integration Notes:** Our WhatsApp Adapter component will be solely responsible for interacting with this API. We must implement webhook signature verification to ensure incoming requests are genuinely from Meta.

## Clerk API

* **Purpose:** To handle all user authentication (sign-up, sign-in) for merchants and to validate session tokens (JWTs) on our backend.
* **Documentation:** [https://clerk.com/docs](https://clerk.com/docs)
* **Base URL(s):** `https://api.clerk.dev/`
* **Authentication:** Secret Key for backend-to-backend API calls.
* **Key Endpoints Used:**
    * This integration is primarily SDK-based.
    * **Frontend:** The React Native app will use Clerk's SDK (`@clerk/clerk-react-native`) for its sign-in UI components.
    * **Backend:** The NestJS backend will use Clerk's Node.js SDK (`@clerk/clerk-sdk-node`) as middleware to validate the JWT from the `Authorization` header on every secured API call.
* **Integration Notes:** We will also configure a webhook from Clerk to our backend to sync new user sign-ups into our own `User` table in the Supabase database.

## Firebase Cloud Messaging (FCM) API

* **Purpose:** To send high-priority push notifications to the React Native merchant app for new bookings.
* **Documentation:** [https://firebase.google.com/docs/cloud-messaging](https://firebase.google.com/docs/cloud-messaging)
* **Base URL(s):** `https://fcm.googleapis.com/`
* **Authentication:** Server Key or OAuth 2.0 access token.
* **Key Endpoints Used:**
    * `POST /v1/projects/{projectId}/messages:send` - Used by our Notification Service to push the alert payload to a specific merchant's device.
* **Integration Notes:** The integration will be managed by the `react-native-firebase` library in the app and the `firebase-admin` SDK in our backend Notification Service.

## Twilio API (for SMS Fallback)

* **Purpose:** To send an SMS notification to the merchant if a push notification is not acknowledged within 60 seconds, ensuring maximum reliability.
* **Documentation:** [https://www.twilio.com/docs/sms/api](https://www.twilio.com/docs/sms/api)
* **Base URL(s):** `https://api.twilio.com/`
* **Authentication:** Account SID and Auth Token.
* **Rate Limits:** Varies by number type and destination.
* **Key Endpoints Used:**
    * `POST /2010-04-01/Accounts/{accountSid}/Messages.json` - Used by our Notification Service to send the fallback SMS.
* **Integration Notes:** This is a critical part of our "Reliability Over Features" principle. The Notification Service will contain the logic to trigger this API call if an FCM push is unsuccessful or unacknowledged.