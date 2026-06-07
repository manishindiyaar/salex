# Salex Documentation

Start here when onboarding a developer or coding agent.

## Core Process Docs

| Document | Purpose |
| --- | --- |
| [Git Workflow](./git-workflow.md) | Branch model, PR flow, local hooks, and protected branch rules. |
| [Deployment Pipeline](./deployment-pipeline.md) | GitHub Actions, Railway deployment flow, environments, and required secrets. |
| [WhatsApp Documentation](./whatsapp/README.md) | WhatsApp booking architecture, flow engine, Redis/BullMQ, Meta platform strategy. |

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

