# 13. Development Workflow

## Local Development Setup

**Prerequisites**
Before starting, developers must have the following tools installed:

### Backend Development
* Node.js (v20.11.0 or later)
* pnpm (as the package manager for the monorepo)
* Git
* Docker (for running Supabase/PostgreSQL and Redis locally)
* Supabase CLI
* Vercel CLI

### React Native Development
* **macOS Requirements:**
  * Xcode (latest version from App Store)
  * Xcode Command Line Tools: `xcode-select --install`
  * CocoaPods: `brew install cocoapods`
  * React Native CLI: `npm install -g @react-native-community/cli`

* **Android Requirements:**
  * Android Studio (with Android SDK)
  * Android SDK Platform-tools
  * Android Emulator or physical device
  * Environment variables: `ANDROID_HOME`, `PATH` updates

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

# 6. Set up React Native dependencies
cd apps/MerchantApp
npm install
cd ios && pod install && cd ..
cd ../..
```

## Development Commands

### Backend Development
```bash
# Start only the backend API
pnpm dev:api

# Run backend tests
pnpm test:api

# Lint backend code
pnpm lint:api
```

### React Native Development
```bash
# Navigate to React Native app
cd apps/MerchantApp

# Start Metro bundler
npm start

# Run on iOS simulator (separate terminal)
npx react-native run-ios

# Run on Android emulator (separate terminal)
npx react-native run-android

# Run on specific iOS device
npx react-native run-ios --simulator="iPhone 15 Pro"

# Run on physical devices
npx react-native run-ios --device="iPhone Name"
npx react-native run-android --device

# List available devices
npx react-native run-ios --list-devices
npx react-native run-android --list-devices

# Clean builds
npx react-native clean
```

### Cross-Platform Testing Workflow
```bash
# Two-terminal approach (recommended)
# Terminal 1: Start Metro bundler
cd apps/MerchantApp && npm start

# Terminal 2: Choose platform
npx react-native run-ios     # For iOS
# OR
npx react-native run-android # For Android
```
## Environment Configuration
The root .env file contains all secrets and configuration variables. The application code accesses these variables.

**Required Environment Variables (.env.example)**
```bash
# Supabase (from 'supabase status' command)
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Redis
REDIS_URL="redis://localhost:6379"

# Clerk (from your Clerk development instance)
CLERK_SECRET_KEY="..."
# For React Native CLI (not Expo), use standard key
CLERK_PUBLISHABLE_KEY="..."

# Twilio (for SMS fallback)
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="..."

# WhatsApp
WHATSAPP_API_TOKEN="..."
WHATSAPP_PHONE_NUMBER_ID="..."

# FCM (Firebase Cloud Messaging)
FCM_SERVER_KEY="..."

# React Native specific
API_BASE_URL="http://localhost:3000"
```

## Production Deployment Workflow

### App Store Preparation
```bash
# iOS Production Build
cd apps/MerchantApp/ios
xcodebuild -workspace MerchantApp.xcworkspace -scheme MerchantApp -configuration Release archive

# Android Production Build  
cd apps/MerchantApp/android
./gradlew assembleRelease
# Creates: android/app/build/outputs/apk/release/app-release.apk
```

### Deployment Pipeline
```plaintext
Development → Testing → Production

1. Development Phase:
   ├── iOS Simulator testing
   ├── Android Emulator testing
   └── Physical device testing

2. Beta Testing Phase:
   ├── iOS: TestFlight distribution
   ├── Android: Direct APK or Play Console beta
   └── User acceptance testing

3. Production Phase:
   ├── iOS: App Store Connect → App Store (1-7 days)
   ├── Android: Google Play Console → Play Store (1-3 days)
   └── Public distribution
```

### Required Accounts & Setup
| Platform | Account Required | Cost | Timeline |
|----------|------------------|------|----------|
| iOS | Apple Developer Program | $99/year | Immediate |
| Android | Google Play Console | $25 one-time | Immediate |
| Backend | Vercel/Railway/etc | Varies | Immediate |

### Troubleshooting Commands
```bash
# React Native Debug Commands
npx @react-native-community/cli doctor  # Check setup
npx react-native start --reset-cache    # Clear Metro cache
npx react-native clean                  # Clean builds

# iOS Specific
cd ios && pod install && cd ..          # Update iOS dependencies
rm -rf ios/build                        # Clean iOS build

# Android Specific  
cd android && ./gradlew clean && cd ..  # Clean Android build
adb devices                             # Check connected devices
adb kill-server && adb start-server    # Restart ADB

# Device Testing
xcrun simctl list devices               # List iOS simulators
emulator -list-avds                     # List Android emulators
```

### Code Quality & Testing
```bash
# Run all tests
pnpm test

# Lint all code
pnpm lint

# Type checking
pnpm type-check

# React Native specific testing
cd apps/MerchantApp
npm test                               # Run Jest tests
npx react-native run-ios --configuration Release  # Test release build
```