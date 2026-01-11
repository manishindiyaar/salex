# Backend Migration Guide: Prisma + Supabase Cloud Setup

A beginner-friendly guide explaining how we set up the Salex backend with a monorepo structure, shared types package, and Supabase Cloud database.

---

## What We Built

```
salex/
├── apps/
│   ├── api/                    # NEW Express.js backend
│   └── api(deprecated)/        # OLD NestJS backend (renamed to avoid conflicts)
├── packages/
│   └── shared-types/           # Shared Prisma + Zod definitions
│       ├── prisma/
│       │   └── schema.prisma   # Database schema
│       ├── src/
│       │   ├── schemas/        # Zod validation schemas
│       │   ├── utils/          # Helper utilities
│       │   ├── db.ts           # Prisma client singleton
│       │   └── index.ts        # Main exports
│       └── .env                # Database credentials
```

---

## Step 1: Understanding the Monorepo Structure

We use **Turborepo** with **pnpm workspaces** to manage multiple packages in one repository.

### Why a Monorepo?
- Share code between frontend and backend
- Single source of truth for types
- Run commands across all packages with one command

### Key Files
- `pnpm-workspace.yaml` - Defines which folders are packages
- `turbo.json` - Defines build pipelines and task dependencies

---

## Step 2: Creating the Shared Types Package

The `@salex/shared-types` package contains:
1. **Prisma schema** - Database models
2. **Zod schemas** - Runtime validation
3. **TypeScript types** - Auto-generated from Prisma

### Package Structure

```
packages/shared-types/
├── package.json              # Package config with name "@salex/shared-types"
├── tsconfig.json             # TypeScript config
├── prisma/
│   └── schema.prisma         # Database schema definition
├── src/
│   ├── db.ts                 # Prisma client singleton
│   ├── index.ts              # Main exports barrel
│   ├── schemas/              # Zod validation schemas
│   │   ├── user.schema.ts
│   │   ├── customer.schema.ts
│   │   ├── business.schema.ts
│   │   ├── service.schema.ts
│   │   ├── booking.schema.ts
│   │   ├── conversation.schema.ts
│   │   └── index.ts
│   └── utils/
│       └── format-zod-errors.ts
└── .env                      # Database credentials (NOT committed to git)
```

### package.json Scripts

```json
{
  "name": "@salex/shared-types",
  "scripts": {
    "build": "prisma generate && tsc",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  }
}
```

---

## Step 3: Setting Up Supabase Cloud

### Why Supabase Cloud vs Local?
- **Local**: Good for offline development, but data doesn't persist across machines
- **Cloud**: Real database, accessible from anywhere, production-ready

### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to **Project Settings** → **Database**
3. Find two connection strings:

#### Connection Pooler (for runtime queries)
- Port: `6543`
- Used by your app when running
- Handles connection pooling automatically

#### Direct Connection (for migrations)
- Port: `5432`
- Used by Prisma for schema changes
- Direct database access

### Environment Variables

Create `packages/shared-types/.env`:

```bash
# Connection Pooler - Used for runtime queries
DATABASE_URL="postgresql://postgres.YOUR-PROJECT-REF:YOUR-PASSWORD@aws-0-YOUR-REGION.pooler.supabase.com:6543/postgres"

# Direct Connection - Used for migrations and schema changes
DIRECT_URL="postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT-REF.supabase.co:5432/postgres"
```

**Important**: Never commit `.env` files to git! Add them to `.gitignore`.

---

## Step 4: Writing the Prisma Schema

The schema defines your database structure. Located at `packages/shared-types/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Connection Pooler for runtime
  directUrl = env("DIRECT_URL")     // Direct Connection for migrations
}

// Example model
model User {
  id        String   @id @default(cuid())
  phone     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  businesses Business[]
}

model Business {
  id          String  @id @default(cuid())
  ownerId     String
  name        String
  routingCode String? @unique @db.VarChar(4)
  
  owner    User      @relation(fields: [ownerId], references: [id])
  services Service[]
}
```

### Key Concepts

- `@id` - Primary key
- `@unique` - Unique constraint
- `@default(cuid())` - Auto-generate unique ID
- `@default(now())` - Auto-set timestamp
- `@updatedAt` - Auto-update on changes
- `@relation` - Define foreign key relationships

---

## Step 5: Syncing Schema to Supabase Cloud

### Command: `pnpm db:push`

This command:
1. Reads your `schema.prisma` file
2. Connects to Supabase using `DIRECT_URL`
3. Creates/updates tables to match your schema
4. Generates the Prisma client

```bash
# From project root
pnpm db:push

# Or from shared-types folder
cd packages/shared-types
pnpm db:push
```

### What Happens Behind the Scenes

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  schema.prisma  │ --> │  prisma db push  │ --> │  Supabase Cloud │
│  (your models)  │     │  (uses DIRECT_URL)│     │  (creates tables)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Verify in Supabase Dashboard

1. Go to your Supabase project
2. Click **Table Editor** in the sidebar
3. You should see all your tables created!

---

## Step 6: Creating the Prisma Client Singleton

To avoid creating multiple database connections, we use a singleton pattern.

`packages/shared-types/src/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Why Singleton?
- In development, hot reload creates new instances
- Each instance = new database connection
- Too many connections = database errors
- Singleton reuses the same connection

---

## Step 7: Creating Zod Validation Schemas

Zod validates data at runtime. Example:

`packages/shared-types/src/schemas/business.schema.ts`:

```typescript
import { z } from 'zod';

// Routing code must be exactly 4 digits
const routingCodeSchema = z.string().regex(/^\d{4}$/, 'Must be 4 digits');

export const createBusinessSchema = z.object({
  name: z.string().min(1).max(100),
  phoneNumber: z.string().min(10).max(15),
  routingCode: routingCodeSchema.optional(),
});

export const updateBusinessSchema = createBusinessSchema.partial();

// TypeScript types auto-generated from Zod
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
```

### Why Both Prisma and Zod?
- **Prisma**: Database-level validation (constraints)
- **Zod**: Application-level validation (before hitting database)
- Zod catches errors early with better error messages

---

## Step 8: Exporting Everything

`packages/shared-types/src/index.ts`:

```typescript
// Database client
export { prisma } from './db';

// Re-export Prisma types
export * from '@prisma/client';

// Zod schemas
export * from './schemas';

// Utilities
export * from './utils/format-zod-errors';
```

Now other packages can import:

```typescript
import { prisma, createBusinessSchema, Business } from '@salex/shared-types';
```

---

## Step 9: Using in the API

The `apps/api` package imports from `@salex/shared-types`:

`apps/api/package.json`:
```json
{
  "dependencies": {
    "@salex/shared-types": "workspace:*"
  }
}
```

Usage in API code:
```typescript
import { prisma, createBusinessSchema } from '@salex/shared-types';

// Validate input
const validated = createBusinessSchema.parse(req.body);

// Query database
const business = await prisma.business.create({
  data: validated
});
```

---

## Common Commands Reference

```bash
# Install all dependencies
pnpm install

# Generate Prisma client (after schema changes)
pnpm db:generate

# Push schema to database (creates/updates tables)
pnpm db:push

# Open Prisma Studio (visual database browser)
pnpm db:studio

# Build all packages
pnpm build

# Build specific package
pnpm --filter @salex/shared-types build
pnpm --filter api build
```

---

## Troubleshooting

### "Can't reach database server"
- Check your `.env` file has correct credentials
- Verify Supabase project is running
- Check if your IP is allowed in Supabase settings

### "Package not found: @salex/shared-types"
- Run `pnpm install` from project root
- Check `pnpm-workspace.yaml` includes `packages/*`

### "Multiple Prisma clients"
- Make sure you're using the singleton from `db.ts`
- Don't create `new PrismaClient()` directly

### "Schema out of sync"
- Run `pnpm db:push` to sync schema
- Run `pnpm db:generate` to regenerate client

---

## Migration from Supabase Local to Cloud

If you were using Supabase local (Docker), here's how to migrate:

1. **Export local data** (optional):
   ```bash
   # From local Supabase
   pg_dump -h localhost -p 54322 -U postgres > backup.sql
   ```

2. **Update environment variables**:
   - Replace local URLs with Supabase Cloud URLs
   - Local: `postgresql://postgres:postgres@localhost:54322/postgres`
   - Cloud: `postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres`

3. **Push schema to cloud**:
   ```bash
   pnpm db:push
   ```

4. **Import data** (if you exported):
   ```bash
   psql -h db.xxx.supabase.co -p 5432 -U postgres < backup.sql
   ```

---

## Summary

1. **Monorepo** = Multiple packages in one repo
2. **shared-types** = Central place for database + validation
3. **Prisma** = Database ORM (schema → tables)
4. **Zod** = Runtime validation (input → validated data)
5. **Supabase Cloud** = Hosted PostgreSQL database
6. **Two URLs** = Pooler (runtime) + Direct (migrations)

The key insight: Define your data models once in Prisma, validate with Zod, and share across all apps!
