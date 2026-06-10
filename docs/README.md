# Salex Documentation

Start here when onboarding a developer or coding agent.

## Core Process Docs

| Document | Purpose |
| --- | --- |
| [Beginner Developer Onboarding](./developer-onboarding-git-cicd.md) | Step-by-step guide for juniors: feature branches, PRs, reviews, CI/CD, staging, and production promotion. |
| [Git Workflow](./git-workflow.md) | Branch model, PR flow, local hooks, and protected branch rules. |
| [Deployment Pipeline](./deployment-pipeline.md) | GitHub Actions, Railway deployment flow, environments, and required secrets. |
| [WhatsApp Documentation](./whatsapp/README.md) | WhatsApp booking architecture, flow engine, Redis/BullMQ, Meta platform strategy. |

## Revamp Baseline Docs

These are the current planning source of truth for the next major Salex build. New developers and coding agents should read them before designing schema, APIs, or UI.

| Document | Purpose |
| --- | --- |
| [Salon Premium App Master Plan](./salex-salon-premium-app-master-plan.md) | Final product direction for the premium salon operating app, tab structure, modules, and phased implementation. |
| [Shared Number Webview Booking Plan](./whatsapp/shared-number-webview-booking-plan.md) | Shared Salex WhatsApp number booking architecture, webview session flow, routing, and shared/dedicated channel resolution. |
| [WhatsApp CRM Subdomain SSO](./whatsapp/14-whatsapp-crm-sso-integration.md) | Premium dedicated-number CRM positioning, wacrm fork strategy, SSO, phone/password fallback, and CRM bootstrap. |

Supporting product context:

| Document | Purpose |
| --- | --- |
| [Salon Merchant App Revamp PRD](./salon-merchant-app-revamp-prd.md) | Frame-by-frame product analysis from `tremoora_ref/`, current app gap mapping, and the revamp roadmap. |
| [Premium Salon App User Story](./salon-merchant-app-premium-user-story.md) | Narrative end-to-end owner journey for implementing the premium salon operating app without overwhelming users. |
| [Meta Platform Strategy 2026](./whatsapp/13-meta-platform-strategy-2026.md) | Meta platform updates, dedicated/multi-partner direction, billing, account model, and AI strategy. |

## Required Code Promotion Flow

```text
feature branch -> develop -> staging -> main
```

Developers and agents must not push directly to `develop`, `staging`, or `main`.

Use pull requests:

```text
base: develop   compare: feature/my-change
base: staging   compare: develop
base: main      compare: staging
```

Staging must be deployed and tested end-to-end before promotion to `main`.
