
# Technology Stack & Build System

## Build System

* **Monorepo**: Turborepo with pnpm workspace
* **Package Manager**: pnpm (>=8.0.0)
* **Node Version**: >=20.11.0
* **Git Hooks**: Husky with lint-staged for pre-commit checks

## Tech Stack

### Frontend (React Native)

* **Framework**: Expo (~53.0.20) with React Native 0.79.5
* **Language**: TypeScript 5.8.3
* **Navigation**: React Navigation 6.x (stack, bottom tabs)
* **State Management**: Zustand 4.5.4
* **Storage**: AsyncStorage for persistence
* **UI Library**: React Native Paper 5.12.3
* **Authentication**: Custom Hybrid Auth (OTP) + Supabase Client (RLS Access)
* **Realtime**: Supabase Realtime (WebSocket) via `@supabase/supabase-js`

### Backend (Express.js)

* **Framework**: Express.js (v4.x/5.x)
* **Runtime**: Node.js
* **Database**: Supabase PostgreSQL
* **ORM**: Prisma ORM (via `@salex/shared-types`)
* **Authentication**: Custom JWT Minting (signed with Supabase Secret)
* **Validation**: Zod (for env vars & request bodies)
* **External APIs**: WhatsApp Cloud API (Meta)

### Shared Packages

* **`@salex/shared-types`**:
* Centralized TypeScript Interfaces (DTOs)
* **Prisma Client** (Database Singleton)
* Zod Schemas (Shared Validation)


* **Config**: ESLint and TypeScript configurations in `packages/`

## Common Commands

### Development

```bash
# Start all services (Turbo pipeline)
pnpm dev

# Start specific apps
pnpm dev:api          # Express Backend (apps/api)
pnpm dev:app          # Mobile App (MerchantAppExpo)

# Mobile app specific
cd apps/MerchantAppExpo
pnpm start            # Expo dev server
pnpm ios              # iOS simulator
pnpm android          # Android emulator

```

### Build & Test

```bash
pnpm build            # Build all packages (ordered: shared -> api -> app)
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm clean            # Clean build artifacts

```

### Database Operations (Run inside `packages/shared-types`)

```bash
pnpm db:push          # Push schema changes to Supabase
pnpm db:generate      # Generate Prisma Client (updates API types automatically)
pnpm db:studio        # Open Prisma Studio to view data

```

## Environment Setup

* **Backend (`apps/api/.env`)**:
* Managed via `dotenv` and validated with **Zod** on startup.
* Required: `DATABASE_URL`, `SUPABASE_JWT_SECRET`, `WHATSAPP_TOKEN`.


* **Frontend (`apps/MerchantAppExpo/.env`)**:
* Prefix with `EXPO_PUBLIC_` for client-side variables (e.g., `EXPO_PUBLIC_SUPABASE_URL`).


* **Database**:
* Connection handled exclusively via `packages/shared-types`.
* Security enforced via **RLS Policies** in Postgres.