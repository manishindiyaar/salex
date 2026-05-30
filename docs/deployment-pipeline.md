# Salex Deployment Pipeline

## Branches

```txt
feature/* -> develop -> staging -> main
```

## Environments

`develop` and `staging` use the same non-production database.

```txt
develop
  Purpose: integration branch
  Database: shared staging/non-production Supabase DB
  Backend deploy: none

staging
  Purpose: internal QA and release candidate testing
  Database: shared staging/non-production Supabase DB
  Backend deploy: Railway staging service

main
  Purpose: production
  Database: production Supabase DB
  Backend deploy: Railway production service
```

## GitHub Secrets

Add these secrets in GitHub repository settings.

```txt
STAGING_DATABASE_URL
STAGING_DIRECT_URL
PRODUCTION_DATABASE_URL
PRODUCTION_DIRECT_URL
RAILWAY_STAGING_DEPLOY_HOOK_URL
RAILWAY_PRODUCTION_DEPLOY_HOOK_URL
```

`STAGING_DATABASE_URL` and `STAGING_DIRECT_URL` are used by both `develop` and `staging`.

## Pipeline Behavior

Pull requests into `develop`, `staging`, or `main` run:

```txt
pnpm install --frozen-lockfile
pnpm db:check-migration -- --ci <base-branch>
pnpm --filter @salex/shared-types exec prisma validate
pnpm lint
pnpm test
pnpm build
```

Pushes to `develop` run validation and apply committed Prisma migrations to the shared non-production DB.

Pushes to `staging` run validation, apply committed Prisma migrations to the shared non-production DB, then trigger the Railway staging deploy hook.

Pushes to `main` run validation, apply committed Prisma migrations to the production DB, then trigger the Railway production deploy hook.

## Database Rules

```txt
Never run db:push.
Every schema.prisma change must include a migration file.
Local development creates migrations with pnpm db:migrate -- --name <change_name>.
CI/staging/production only apply committed migrations with pnpm db:migrate:deploy.
```
