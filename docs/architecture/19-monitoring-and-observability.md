# 19. Monitoring and Observability

## Monitoring Stack

Our monitoring stack combines platform-provided tools with a dedicated application monitoring service for a comprehensive view.

* **Frontend Monitoring (React Native App):**
    * **Tool:** **Sentry**
    * **Purpose:** Sentry's SDK for React Native will provide Real User Monitoring (RUM), capturing performance data (app start time, screen load times), UI hangs, and crash reports directly from merchant devices.

* **Backend Monitoring (NestJS on Vercel):**
    * **Tools:** **Vercel Monitoring** & **Sentry**
    * **Purpose:** Vercel provides essential infrastructure-level monitoring out of the box (function invocations, execution duration, error rates, cold starts). Sentry's APM (Application Performance Monitoring) will give us deeper, code-level insights into transaction performance and bottlenecks within our NestJS application.

* **Database Monitoring (Supabase):**
    * **Tool:** **Supabase Dashboard**
    * **Purpose:** The Supabase dashboard provides real-time monitoring of our PostgreSQL database, including CPU usage, active connections, and, most importantly, tools to identify and analyze slow-running queries.

* **Centralized Error Tracking:**
    * **Tool:** **Sentry**
    * **Purpose:** Sentry will be our single pane of glass for all application errors, aggregating issues from both the frontend and backend. We will configure alerts in Sentry to notify the development team of new or high-frequency errors in real-time.

## Key Metrics

We will actively monitor the following metrics to measure the health and success of the platform.

* **Frontend Metrics:**
    * **Crash Rate:** The percentage of user sessions that end in a crash. (Target: < 0.5%)
    * **App Start Time (TTI):** Time from app launch until it is interactive. (Target: < 2 seconds)
    * **UI Performance:** Tracking UI hangs and slow/frozen frames to ensure a smooth user experience.
    * **Client-side API Error Rate:** Percentage of API calls from the app that fail.

* **Backend Metrics:**
    * **API Error Rate:** Percentage of server requests that result in a 5xx error. (Target: < 0.1%)
    * **API Latency (p95):** 95% of API requests should complete in under 200ms.
    * **Function Invocations:** Tracking request volume to understand usage patterns and scale.
    * **Cold Start Duration:** Monitoring the impact of cold starts on serverless function performance.

* **Business & Database Metrics:**
    * **Daily Active Bookings:** The "North Star Metric" defined in the PRD.
    * **Notification Delivery Success Rate:** (FCM + SMS) - Critical for reliability. (Target: > 99.5%)
    * **Database Health:** Monitoring CPU, memory, and slow query logs in the Supabase dashboard.