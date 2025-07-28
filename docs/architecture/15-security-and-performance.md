# 15. Security and Performance

## Security Requirements

Security is a multi-layered concern, spanning our frontend app, backend API, and authentication provider.

* **Frontend Security:**
    * **Secure Storage:** The JWT from Clerk must be stored securely on the device. We will use `expo-secure-store`, which leverages the native Keychain on iOS and Keystore on Android. Standard `AsyncStorage` is not secure enough and will not be used for tokens.
    * **Secrets Management:** The Clerk Publishable Key will be managed via environment variables (`.env`) and not hardcoded into the application source code.
    * **Deep Linking:** The app's deep link configuration must be carefully implemented to prevent malicious apps from intercepting data.

* **Backend Security:**
    * **Input Validation:** All data coming into the API from any client, including our own app, must be rigorously validated. We will use NestJS's built-in `ValidationPipe` with `class-validator` decorators on our DTOs (Data Transfer Objects).
    * **Rate Limiting:** To prevent abuse, we will implement rate limiting on the API (e.g., 100 requests per minute per IP) using a library like `nestjs-throttler`.
    * **CORS Policy:** The backend deployment on Vercel will be configured with a strict Cross-Origin Resource Sharing (CORS) policy. It will only accept requests from approved domains, not from `*`.
    * **Webhook Security:** The `POST /webhooks/whatsapp` endpoint will be a public endpoint, but it **must** validate the `X-Hub-Signature-256` header to ensure the request is legitimately from Meta and not a fraudulent actor.

* **Authentication Security:**
    * **JWT Validation:** Our `ClerkAuthGuard` will be applied to all sensitive endpoints, ensuring every request is properly authenticated and authorized.
    * **Password Policy:** All password strength policies, multi-factor authentication (MFA), and session management rules will be configured directly in the Clerk dashboard. We will leverage Clerk's expertise for these critical features.

## Performance Optimization

* **Frontend Performance:**
    * **Startup Time:** The app's Time to Interactive (TTI) is critical. We will optimize this by lazy-loading screens and components where possible.
    * **Render Optimization:** We will use standard React patterns (`React.memo`, `useCallback`) to prevent unnecessary component re-renders, especially on the booking dashboard which will receive real-time updates.
    * **Asset Optimization:** All bundled assets (images, custom sound files) will be compressed and optimized to keep the app binary size reasonable.

* **Backend Performance:**
    * **Response Time Target:** We will aim for a p95 (95th percentile) API response time of under **200ms** for all standard operations.
    * **Database Optimization:** All database queries will be made through Prisma. We will leverage its query optimization capabilities and ensure the indexes we defined in the schema are used effectively. We will monitor for slow queries in the Supabase dashboard.
    * **Caching Strategy:** The high-traffic WhatsApp bot interaction will use **Redis** for session management to avoid costly database lookups on every message, which is a critical performance optimization.