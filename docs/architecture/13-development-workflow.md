# 13. Development Workflow

## Local Development Setup

**Prerequisites**
Before starting, developers must have the following tools installed:
* Node.js (v20.11.0 or later)
* pnpm (as the package manager for the monorepo)
* Git
* Docker (for running Supabase/PostgreSQL and Redis locally)
* Supabase CLI
* Vercel CLI

**Initial Setup**
To set up the project for the first time, run these commands from your terminal:

```bash
# 1. Clone the repository
git clone <repository_url>
cd salex

# 2. Install all dependencies using pnpm
pnpm install

# 3. Set up local Supabase environment
supabase init
supabase start

# 4. Set up environment variables
# Copy the example file to create your own local .env file at the root
cp .env.example .env

# Now, open the new .env file and fill in the required keys from Supabase (local),
# Clerk (development), Twilio, etc.

# 5. Push the database schema to your local Supabase instance
pnpm db:push
Development Commands
The following scripts will be available in the root package.json:

Bash

# Start all applications (api and merchant-app) in development mode
pnpm dev

# Start only the backend API
pnpm dev:api

# Start only the React Native merchant app
pnpm dev:app

# Run all tests across the monorepo
pnpm test

# Lint all code to check for style issues
pnpm lint
Environment Configuration
The root .env file will contain all secrets and configuration variables. The application code will access these variables.

Required Environment Variables (.env.example)

Bash

# Supabase (from 'supabase status' command)
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Redis
REDIS_URL="redis://localhost:6379"

# Clerk (from your Clerk development instance)
CLERK_SECRET_KEY="..."
# For React Native / Expo, the key must be prefixed
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="..."

# Twilio (for SMS fallback)
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="..."

# WhatsApp
WHATSAPP_API_TOKEN="..."
WHATSAPP_PHONE_NUMBER_ID="..."

# FCM (Firebase Cloud Messaging)
FCM_SERVER_KEY="..."