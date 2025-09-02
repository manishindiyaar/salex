# Salex Project Guide for Claude



Right Now I am Just Brain Storming Do not make any Edits and do not change any file you are only allowed to read the files that's it.

This document contains essential context for working on the Salex codebase. You MUST adhere to these guidelines.


## Core Files & Directories
- **PRD:** `docs/prd/` (sharded)
- **Architecture:** `docs/architecture/` (sharded)
- **Backend App:** `apps/api/`
- **Frontend App:** `apps/MerchantApp/`
- **Shared Types:** `packages/shared-types/src/index.ts` (Single Source of Truth for data models)
- **WhatsApp Core Logic:** `apps/api/src/modules/whatsapp/whatsapp.service.ts` (use whatsapp-nestjs-refactorer agent for doing this)
- **API Client (Frontend):** `apps/MerchantAppExpo/src/services/apiClient.ts`





## Critical Coding Standards
- **Type Safety:** Always import shared types from the `shared-types` package. Never define duplicate types.
- **Database Access:** All backend database logic MUST be in a NestJS service and use the injected `PrismaService`. Controllers must not access the database directly.
