# Salex

Salex is a WhatsApp-first appointment and salon operations platform. The core product is the booking engine: business operations sit around it, and WhatsApp is the customer channel.

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
pnpm type-check
```

## Database

```sh
pnpm db:migrate -- --name describe_your_change
pnpm db:migrate:status
pnpm db:migrate:deploy
pnpm db:generate
pnpm db:studio
```

Use Prisma migrations for every schema change, including local development.
Do not use `db:push`; it is disabled so schema changes must be committed with
their matching `packages/shared-types/prisma/migrations/*/migration.sql` file.

Local workflow:

```sh
# 1. Edit packages/shared-types/prisma/schema.prisma
# 2. Generate and apply a migration locally
pnpm db:migrate -- --name add_booking_notes
# 3. Commit both schema.prisma and the new migration folder
```

Staging and production should only apply committed migrations:

```sh
pnpm db:migrate:deploy
```

## Architecture

- [Documentation index](docs/README.md)
- [Developer onboarding and CI/CD](docs/developer-onboarding-git-cicd.md)
- [Git workflow](docs/git-workflow.md)
- [Deployment pipeline](docs/deployment-pipeline.md)
- [WhatsApp documentation](docs/whatsapp/README.md)

## Revamp Baseline

Read these before starting the next major platform build:

- [Salon premium app master plan](docs/salex-salon-premium-app-master-plan.md)
- [Shared number webview booking plan](docs/whatsapp/shared-number-webview-booking-plan.md)
- [WhatsApp CRM subdomain SSO plan](docs/whatsapp/14-whatsapp-crm-sso-integration.md)

Generated output such as `dist`, `.turbo`, logs, and TypeScript build info should stay out of git.
