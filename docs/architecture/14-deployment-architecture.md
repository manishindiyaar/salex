# 14. Deployment Architecture

## Deployment Strategy

Our deployment strategy separates the backend API from the mobile merchant app, as they have different release cycles.

* **Backend Deployment (to Vercel):**
    * The NestJS API, located in `apps/api`, will be deployed as serverless functions to Vercel.
    * Deployment will be continuous. Every push to the `main` branch will automatically trigger a new production deployment.
    * Every pull request will generate a unique "preview" URL, allowing us to test backend changes in isolation before they are merged.

* **Frontend Deployment (to App Stores):**
    * The React Native app is not "deployed" in the same way as a website. It is compiled into native binaries (`.apk` for Android, `.ipa` for iOS) and submitted to the app stores.
    * We will use **Expo Application Services (EAS)** to manage this entire process. EAS Build will handle the native compilation in the cloud, and EAS Submit will manage the submission to the Google Play Store and Apple App Store.

## CI/CD Pipeline

We will use **GitHub Actions** to automate our entire workflow. The pipeline will be defined in a file like `.github/workflows/main.yml`.

```yaml
name: CI/CD Pipeline for Salex

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  lint_and_test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Setup Node.js and pnpm
        # Assumes a composite action or manual setup steps
        run: |
          npm install -g pnpm
          pnpm install
      - name: Linting
        run: pnpm lint
      - name: Run all tests
        run: pnpm test

  deploy_backend:
    needs: lint_and_test
    if: github.ref == 'refs/heads/main' # Only run on push to main
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Setup Node.js and pnpm
        run: |
          npm install -g pnpm
          pnpm install
      - name: Deploy to Vercel
        run: pnpm vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}

  build_and_submit_app:
    # This job is triggered manually for releases
    on: workflow_dispatch 
    needs: lint_and_test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Setup Node.js and pnpm
        run: |
          npm install -g pnpm
          pnpm install
      - name: Setup EAS CLI
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Build and Submit to App Stores
        run: eas build --platform all --profile production --non-interactive --auto-submit



Environments
We will maintain three distinct environments to ensure a safe and predictable release process.

Environment |  Frontend URL | Backend URL | Purpose
Development | Local Machine (Expo Go) | Localhost / Local Supabase | Local development and testing by the dev team.
Staging/Preview | EAS Build (Internal Dist.) | *-vercel.app (Preview URL) | Testing pull requests in a production-like cloud env.
Production | Google Play / Apple App Store | api.salex.app (Custom Domain) | The live environment for all merchants.        