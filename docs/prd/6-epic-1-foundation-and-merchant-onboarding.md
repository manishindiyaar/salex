# Epic 1: Foundation & Merchant Onboarding

**Expanded Goal:** To establish the complete technical foundation for the Salex platform, including the monorepo structure, local development environment, and CI/CD pipeline. This epic will deliver the full, end-to-end onboarding experience, allowing a new salon owner to sign up, create their business profile, and fully configure their services and hours. At the end of this epic, a merchant can be fully set up and ready to receive bookings, but the customer-facing booking functionality will not yet be enabled.

---

## Story 1.1: Project Scaffolding & Setup

**As a** developer, **I want** the monorepo structure with all required configurations and dependencies installed, **so that** I have a clean and consistent foundation to start building features.

**Acceptance Criteria:**
1.  The `salon-pro` monorepo is created and initialized with Git.
2.  Turborepo is configured at the root.
3.  The `apps/api` (NestJS) and `apps/merchant-app` (React Native) workspaces are created.
4.  The `packages/shared-types`, `packages/eslint-config-custom`, and `packages/typescript-config` workspaces are created.
5.  Running `pnpm install` at the root successfully installs all dependencies for all workspaces.
6.  A basic "hello world" or default screen runs for both the API and the merchant app.

---

## Story 1.2: Local Development Environment

**As a** developer, **I want** to set up and run the full application stack locally, **so that** I can develop and test features in an environment that mirrors production.

**Acceptance Criteria:**
1.  The `supabase` CLI is configured in the project.
2.  Running `supabase start` successfully launches local PostgreSQL and other services.
3.  The root `.env.example` file is populated with all necessary keys for local development.
4.  After filling the `.env` file, `pnpm db:push` successfully syncs the Prisma schema with the local database.
5.  Running `pnpm dev` successfully starts both the backend API and the merchant app development server.

---

## Story 1.3: User Sign-Up & Authentication

**As a** new merchant, **I want** to sign up for a Salex account using my phone number and an OTP, **so that** I can securely access the merchant platform.

**Acceptance Criteria:**
1.  The merchant app displays the Clerk sign-up/sign-in UI on launch.
2.  A user can successfully complete the sign-up flow provided by Clerk.
3.  Upon successful sign-up, a user record is created in the Clerk system.
4.  The app receives and securely stores a JWT session token.
5.  The first authenticated API call to our backend successfully triggers the creation of a corresponding `User` record in our local Supabase database, linked to the Clerk User ID.

---

## Story 1.4: Business Type Selection & Profile Creation

**As a** new merchant, **I want** to select my business type ("Saloon") and create a basic business profile, **so that** my business is registered on the Salex platform.

**Acceptance Criteria:**
1.  Immediately after the first successful login, the user is presented with the "Who are you?" screen.
2.  Tapping the "Saloon" option proceeds to the business creation form.
3.  The user can enter their salon's name, phone number, and address.
4.  Submitting the form successfully creates a `Business` record (with `businessType: 'SALON'`) and a corresponding `Salon` details record in the database.
5.  The new `Business` record is correctly associated with the logged-in `User`.

---

## Story 1.5: Manage Business Hours

**As a** salon owner, **I want** to set and update my weekly business hours in the app, **so that** the system knows when my salon is open for bookings.

**Acceptance Criteria:**
1.  There is a screen in the onboarding flow (and later in settings) to manage business hours.
2.  The user can specify an open time and close time for each day of the week.
3.  The user can mark certain days as "closed".
4.  Saving the hours updates the `hoursOfOperation` JSONB field for the correct `Business` record in the database.

---

## Story 1.6: Manage Services

**As a** salon owner, **I want** to add, edit, and view the services my salon offers, including name, price, and duration, **so that** customers can see and book my offerings.

**Acceptance Criteria:**
1.  There is a screen in the onboarding flow (and later in settings) to manage services.
2.  The user can view a list of all their existing services.
3.  The user can add a new service by providing a name, price, and duration in minutes.
4.  The user can edit the details of an existing service.
5.  All created/updated services are correctly stored in the `Service` table and associated with the correct `Business`.

## Rationale

This epic is heavily focused on foundational "enabler" stories (1.1, 1.2) that, while not delivering direct value to a merchant, are essential prerequisites for all future development. Stories 1.3 through 1.6 then build the complete, sequential onboarding flow. Once this epic is complete, we will have a fully functional onboarding system and a platform that is ready for the core booking functionality to be built in the next epic.