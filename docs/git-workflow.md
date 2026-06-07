# Git Workflow and Local Guardrails

Salex uses three protected long-lived branches:

```text
develop -> staging -> main
```

## Branch Purpose

| Branch | Purpose |
| --- | --- |
| `develop` | Daily integration branch for reviewed feature work. |
| `staging` | Deployed testing environment for end-to-end validation. |
| `main` | Production branch for real users. |

## Required Flow

Do not push directly to `develop`, `staging`, or `main`.

Use this sequence:

```text
feature branch -> PR to develop
develop -> PR to staging
staging -> PR to main
```

## How to Create Each PR

### Feature branch to develop

Start from the latest `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-change
```

After making changes:

```bash
git add .
git commit -m "Describe the change"
git push origin feature/my-change
```

Open a GitHub pull request:

```text
base: develop
compare: feature/my-change
```

Merge only after the `Validate` status check passes and the PR is reviewed.

### Develop to staging

When `develop` is ready for deployed QA, open a GitHub pull request:

```text
base: staging
compare: develop
```

After merge, GitHub Actions applies non-production migrations and deploys the staging API.

Test staging end-to-end before production promotion:

- API health,
- Railway logs,
- Redis/BullMQ workers,
- WhatsApp webhook,
- booking flow,
- merchant app owner approval,
- admin dashboard,
- database migration behavior.

### Staging to main

Only after staging is verified, open a GitHub pull request:

```text
base: main
compare: staging
```

After merge, GitHub Actions applies production migrations and deploys the production API. Production deployment requires approval through the GitHub `production` environment.

Before a feature branch is pushed, local hooks run the same core checks expected by CI:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

## Local Git Hooks

Hooks are managed by Husky.

### Pre-commit

`.husky/pre-commit` runs:

```bash
pnpm db:check-migration
pnpm exec lint-staged
```

This blocks commits when the Prisma schema changed without a staged migration.

### Pre-push

`.husky/pre-push` blocks direct pushes to:

```text
develop
staging
main
```

It then runs:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

This prevents agents or humans from pushing code that fails local validation.

There is an emergency escape hatch for expensive local checks:

```bash
SALEX_SKIP_PRE_PUSH_CHECKS=1 git push origin feature/my-branch
```

This does not bypass protected branch blocking. Direct pushes to `develop`, `staging`, and `main` remain blocked.

Use the escape hatch only when CI will still run the full validation, and never for production-bound emergency work without review.

## GitHub Protection Rules

GitHub branch protection should require:

- pull request before merge,
- required status check: `Validate`,
- branch up to date before merge,
- at least one approval,
- stale approvals dismissed after new commits.

Environment protection:

- `staging` environment deploys only from `staging`.
- `production` environment deploys only from `main`.
- `production` requires a reviewer before deployment.

## CI/CD Summary

Workflow file: `.github/workflows/ci-cd.yml`.

Pull requests into `develop`, `staging`, and `main` run the `Validate` job:

```bash
pnpm install --frozen-lockfile
pnpm db:check-migration -- --ci <base-branch>
pnpm --filter @salex/shared-types exec prisma validate
pnpm lint
pnpm type-check
pnpm exec turbo run test -- --passWithNoTests
pnpm build
```

Push behavior:

| Push branch | Migration target | Deployment |
| --- | --- | --- |
| `develop` | Shared non-production DB | No API deploy |
| `staging` | Shared non-production DB | Railway `salex-api-staging` |
| `main` | Production DB | Railway `salex-api-production` |

