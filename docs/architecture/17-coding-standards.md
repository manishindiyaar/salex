# 17. Coding Standards

## Critical Fullstack Rules

These rules are non-negotiable and will be enforced through code reviews and automated checks.

* **Type Sharing:** All shared data types (e.g., `Booking`, `Business`) **must** be defined once in the `packages/shared-types` package. They must never be duplicated or redefined in the `api` or `merchant-app` applications.
* **Environment Variables:**
    * **Backend:** Environment variables must only be accessed through NestJS's built-in `ConfigService`. Never use `process.env` directly in services or controllers.
    * **Frontend:** Environment variables for the React Native app must be prefixed with `EXPO_PUBLIC_` to be exposed to the client.
* **Database Access:** All database interactions from the backend **must** go through a service that injects the `PrismaService`. Controllers are forbidden from interacting with the Prisma client directly. This enforces our Repository Pattern.
* **Authentication:** All backend API endpoints that handle sensitive data or require a logged-in user **must** be protected by the `@UseGuards(ClerkAuthGuard)` decorator.
* **API Calls (Frontend):** All API calls from the React Native app **must** use the singleton `apiClient` instance from `src/services/apiClient.ts`. Do not use `fetch` or `axios` directly in components or screens.
* **State Management (Frontend):** State in Zustand stores **must** be treated as immutable. State can only be updated by calling the actions defined within the store.

## Naming Conventions

Consistency in naming is key to a readable and maintainable codebase.

| Element | Frontend | Backend | Example |
| :--- | :--- | :--- | :--- |
| **Components** | PascalCase | N/A | `BookingListItem.tsx` |
| **Hooks** | camelCase (`use...`) | N/A | `useBookings.ts` |
| **API Routes** | N/A | kebab-case | `/api/v1/business-profile` |
| **DB Tables** | N/A | snake\_case (auto-mapped) | `booking_status` |
| **Prisma Models**| N/A | PascalCase | `model BookingStatus {}` |
| **Service Files**| PascalCase | PascalCase | `BookingService.ts` |
| **Controller Files**| N/A | PascalCase | `BookingsController.ts` |
| **Test Files** | N/A | N/A | `*.test.ts` or `*.spec.ts`|