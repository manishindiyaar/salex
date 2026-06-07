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
RAILWAY_STAGING_TOKEN
RAILWAY_PRODUCTION_TOKEN
```

`STAGING_DATABASE_URL` and `STAGING_DIRECT_URL` are used by both `develop` and `staging`.

## Pipeline Behavior

Pull requests into `develop`, `staging`, or `main` run the `Validate` job:

```txt
pnpm install --frozen-lockfile
pnpm db:check-migration -- --ci <base-branch>
pnpm --filter @salex/shared-types exec prisma validate
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Pushes to `develop` run validation and apply committed Prisma migrations to the shared non-production DB.

Pushes to `staging` run validation, apply committed Prisma migrations to the shared non-production DB, then redeploy the Railway staging API service `salex-api-staging`.

Pushes to `main` run validation, apply committed Prisma migrations to the production DB, then redeploy the Railway production API service `salex-api-production`.

If `RAILWAY_STAGING_TOKEN` or `RAILWAY_PRODUCTION_TOKEN` is missing, the deployment job must fail. It must not silently skip deployment.

## GitHub Environments

Only these environments should exist:

```txt
staging
production
```

`staging`:

- deployment branches restricted to `staging`;
- required reviewers optional.

The non-production migration job does not attach to the `staging` GitHub environment. It must run for both `develop` and `staging` pushes, while the `staging` environment itself is branch-restricted to `staging` for actual deployments.

`production`:

- deployment branches restricted to `main`;
- required reviewer enabled;
- administrator bypass should be disabled for real production discipline.

## Pull Request Promotion

Use GitHub pull requests in this order:

```txt
feature branch -> develop
develop -> staging
staging -> main
```

In GitHub PR terms:

```txt
base: develop
compare: feature/my-change

base: staging
compare: develop

base: main
compare: staging
```

Do not merge `staging -> main` until staging has been deployed and tested end-to-end.

## Database Rules

```txt
Never run db:push.
Every schema.prisma change must include a migration file.
Local development creates migrations with pnpm db:migrate -- --name <change_name>.
CI/staging/production only apply committed migrations with pnpm db:migrate:deploy.
```
