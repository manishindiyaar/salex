# Rebook

Minimal monorepo for the Rebook merchant apps, admin dashboard, shared types, and API.

## Apps

- `apps/api` - Express API.
- `apps/admin-dashboard` - Vite admin dashboard.
- `apps/SalonMerchantApp` - Expo merchant app for salons.
- `apps/ClinicMerchantApp` - Expo merchant app for clinics.
- `packages/shared-types` - Prisma client and shared Zod schemas.

## Setup

```sh
pnpm install
```

Copy the API environment template before running the backend:

```sh
cp apps/api/.env.example apps/api/.env
```

## Development

```sh
pnpm dev:api
pnpm dev:admin
pnpm dev:app
pnpm dev:clinic
```

## Quality

```sh
pnpm build
pnpm test
pnpm lint
```

## Database

```sh
pnpm db:generate
pnpm db:push
pnpm db:studio
```

Generated output such as `dist`, `.turbo`, logs, and TypeScript build info should stay out of git.
