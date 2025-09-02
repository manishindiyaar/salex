# 10. Unified Project Structure

This is the actual directory structure for the Salex monorepo, optimized for React Native CLI and full-stack TypeScript development.

```plaintext
salex/
├── .git/
├── .vscode/                 # VS Code editor settings
├── apps/                    # Contains our deployable applications
│   ├── api/                 # The NestJS backend application
│   │   ├── src/
│   │   │   ├── modules/     # Feature modules (e.g., bookings, businesses)
│   │   │   │   ├── auth/    # Authentication & user management
│   │   │   │   ├── business/ # Business profile management
│   │   │   │   ├── service/ # Service management
│   │   │   │   ├── timeslots/ # Available booking time slots
│   │   │   │   ├── analytics/ # Business analytics & reporting
│   │   │   │   └── whatsapp/  # The core WhatsApp logic
│   │   │   │       ├── whatsapp.controller.ts
│   │   │   │       └── whatsapp.service.ts
│   │   │   ├── core/        # Core services (e.g., PrismaService, Logger)
│   │   │   └── main.ts      # Main application entry point
│   │   ├── prisma/          # Database schema and migrations
│   │   │   └── schema.prisma
│   │   ├── test/            # Integration tests
│   │   ├── .env.example
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── MerchantApp/         # React Native CLI application (Standard structure)
│       ├── android/         # Android platform files (auto-generated)
│       │   ├── app/
│       │   ├── build.gradle
│       │   └── ...
│       ├── ios/             # iOS platform files (auto-generated)
│       │   ├── MerchantApp.xcodeproj/
│       │   ├── MerchantApp.xcworkspace/
│       │   ├── Podfile
│       │   └── ...
│       ├── src/             # Application source code
│       │   ├── components/  # Reusable UI components
│       │   │   ├── atoms/   # Basic components (Button, Input)
│       │   │   ├── molecules/ # Component combinations
│       │   │   └── organisms/ # Complex sections
│       │   ├── screens/     # Screen components
│       │   ├── navigation/  # React Navigation setup
│       │   ├── services/    # API client services
│       │   │   └── apiClient.ts # Axios client with Clerk auth
│       │   ├── store/       # Zustand state management
│       │   ├── types/       # TypeScript type definitions
│       │   ├── utils/       # Helper functions
│       │   └── assets/      # Fonts, images, icons
│       ├── __tests__/       # Jest tests
│       ├── App.tsx          # Main app component
│       ├── index.js         # Entry point
│       ├── package.json     # RN dependencies
│       ├── metro.config.js  # Metro bundler config
│       ├── babel.config.js  # Babel configuration
│       ├── react-native.config.js # RN platform config
│       └── tsconfig.json    # TypeScript config
├── packages/                # Contains shared code and configuration
│   ├── shared-types/        # CRITICAL: Our shared data model interfaces
│   │   ├── src/
│   │   │   └── index.ts     # Exports User, Business, Booking interfaces, etc.
│   │   └── package.json
│   ├── eslint-config-custom/  # Shared ESLint configuration for all apps
│   └── typescript-config/   # Shared tsconfig.json for all apps
├── docs/                    # All documentation
│   ├── prd/                 # Product Requirements (sharded)
│   ├── architecture/        # Architecture documents (sharded)
│   └── stories/             # User stories and development tasks
├── approach/                # Development approach documentation
│   ├── react-native-setup-guide.md # Complete RN setup guide
│   └── changelog-*.md       # Implementation changelogs
├── curl-test/               # API testing scripts
│   ├── postman-collection-v2.json # Postman collection
│   └── *.test.js           # Node.js test scripts
├── supabase/               # Supabase configuration
├── .gitignore
├── package.json            # Root package.json with pnpm workspaces
├── pnpm-workspace.yaml     # pnpm workspace configuration
├── turbo.json              # Turborepo configuration
├── CLAUDE.MD               # Claude development guidelines
└── README.md
```

## Key Structure Changes

### React Native CLI Structure
- **Standard Structure:** `apps/MerchantApp/` follows React Native CLI conventions
- **Platform Files:** `android/` and `ios/` folders with native build configurations
- **Cross-Platform:** Same codebase runs on both iOS and Android

### Development Commands
```bash
# Backend development
pnpm dev:api                 # Start NestJS API server

# React Native development
cd apps/MerchantApp
npm start                    # Start Metro bundler
npx react-native run-ios    # Run on iOS simulator
npx react-native run-android # Run on Android emulator

# Physical device testing
npx react-native run-ios --device="iPhone Name"
npx react-native run-android --device
```

### Production Deployment Structure
```plaintext
Development → Testing → Production
├── Simulators/Emulators (Local testing)
├── Physical Devices (Beta testing)
└── App Stores (Production)
    ├── iOS App Store (Apple Developer Account required)
    └── Google Play Store (Google Play Console required)
```

### Monorepo Benefits
- **Shared Types:** Single source of truth in `packages/shared-types/`
- **Code Reuse:** Common utilities and configurations
- **Synchronized Development:** Backend and frontend developed together
- **Type Safety:** Full TypeScript coverage across all packages