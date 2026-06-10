# Agent Operating Rules

This repository uses a protected CI/CD flow. Agents must follow it exactly.

## Branch Model

Long-lived branches:

```text
develop -> staging -> main
```

Meaning:

- `develop`: reviewed development integration.
- `staging`: deployed testing environment for end-to-end QA.
- `main`: production for real users.

## Required PR Flow

Never push directly to `develop`, `staging`, or `main`.

All work must move through pull requests:

```text
feature branch -> PR to develop
develop -> PR to staging
staging -> PR to main
```

When opening a PR:

- `base` is where the code is going.
- `compare` is where the code is coming from.

Examples:

```text
feature/my-change -> develop
base: develop
compare: feature/my-change

develop -> staging
base: staging
compare: develop

staging -> main
base: main
compare: staging
```

## Local Hook Guardrails

Husky hooks are installed for local safety.

Pre-commit:

```bash
pnpm db:check-migration
pnpm exec lint-staged
```

Pre-push:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

The pre-push hook blocks direct pushes to:

```text
develop
staging
main
```

There is an emergency skip for expensive local checks:

```bash
SALEX_SKIP_PRE_PUSH_CHECKS=1 git push origin feature/my-branch
```

This does not bypass protected branch blocking. Do not use it for production-bound work unless CI will run full validation and the user explicitly approves.

## CI/CD Behavior

GitHub Actions workflow: `.github/workflows/ci-cd.yml`.

Pull requests into `develop`, `staging`, or `main` run:

```bash
pnpm install --frozen-lockfile
pnpm db:check-migration -- --ci <base-branch>
pnpm --filter @salex/shared-types exec prisma validate
pnpm lint
pnpm type-check
pnpm exec turbo run test -- --passWithNoTests
pnpm build
```

Push to `develop`:

- runs validation,
- applies committed Prisma migrations to the shared non-production database,
- does not deploy the API,
- does not use the `staging` GitHub environment because that environment is restricted to the `staging` branch.

Push to `staging`:

- runs validation,
- applies committed Prisma migrations to the shared non-production database,
- deploys `salex-api-staging` on Railway,
- requires the `staging` GitHub environment.

Push to `main`:

- runs validation,
- applies committed Prisma migrations to production,
- deploys `salex-api-production` on Railway,
- requires the `production` GitHub environment and production approval.

## Required GitHub Secrets

Repository Actions secrets:

```text
STAGING_DATABASE_URL
STAGING_DIRECT_URL
PRODUCTION_DATABASE_URL
PRODUCTION_DIRECT_URL
RAILWAY_STAGING_TOKEN
RAILWAY_PRODUCTION_TOKEN
```

If a Railway token is missing, CI must fail the deployment job. It must not silently skip deployment.

## Database Rules

- Never use `pnpm db:push` for shared, staging, or production databases.
- Every `schema.prisma` change must include a Prisma migration.
- Local migration creation:

```bash
pnpm db:migrate -- --name describe_your_change
```

- CI/staging/production migration application:

```bash
pnpm db:migrate:deploy
```

## Revamp Baseline Docs

Before planning or implementing the next Salex platform revamp work, read these source-of-truth docs:

- `docs/salex-salon-premium-app-master-plan.md`
- `docs/whatsapp/shared-number-webview-booking-plan.md`
- `docs/whatsapp/14-whatsapp-crm-sso-integration.md`

Supporting context:

- `docs/salon-merchant-app-revamp-prd.md`
- `docs/salon-merchant-app-premium-user-story.md`
- `docs/whatsapp/13-meta-platform-strategy-2026.md`

Core product rule:

```text
Booking engine first. Business operations around it. WhatsApp as the customer channel.
```

Do not start new revamp implementation by copying external CRM/database/auth architecture. Salex API and Salex PostgreSQL remain the source of truth.

## Before Reporting Work Complete

For code changes, run the relevant checks. For broad changes, run:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

For documentation-only changes, say that tests were not run because no runtime code changed.

## More Detail

Read:

- `docs/developer-onboarding-git-cicd.md`
- `docs/git-workflow.md`
- `docs/deployment-pipeline.md`
- `docs/README.md`
