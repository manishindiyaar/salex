# 10. Unified Project Structure

This is the proposed directory structure for the Salex monorepo. It is optimized for Turborepo and a full-stack TypeScript environment.

```plaintext
salex/
├── .git/
├── .vscode/                 # VS Code editor settings
├── apps/                    # Contains our deployable applications
│   ├── api/                 # The NestJS backend application
│   │   ├── src/
│   │   │   ├── modules/     # Feature modules (e.g., bookings, businesses)
│   │   │   │   └── whatsapp/  # The core WhatsApp logic
│   │   │   │       ├── whatsapp.controller.ts
│   │   │   │       └── whatsapp.service.ts
│   │   │   ├── core/        # Core services (e.g., PrismaService, Logger)
│   │   │   └── main.ts      # Main application entry point
│   │   ├── test/
│   │   ├── .env.example
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── merchant-app/        # The React Native application
│       ├── src/
│       │   ├── components/  # Reusable UI components
│       │   ├── screens/     # Top-level screen components
│       │   ├── navigation/  # React Navigation setup
│       │   ├── services/    # API client services
│       │   ├── store/       # Zustand state management stores
│       │   └── assets/      # Fonts, images, and our custom sound file
│       ├── android/
│       ├── ios/
│       └── package.json
├── packages/                # Contains shared code and configuration
│   ├── shared-types/        # CRITICAL: Our shared data model interfaces
│   │   ├── src/
│   │   │   └── index.ts     # Exports User, Business, Booking interfaces, etc.
│   │   └── package.json
│   ├── eslint-config-custom/  # Shared ESLint configuration for all apps
│   └── typescript-config/   # Shared tsconfig.json for all apps
├── docs/                    # All BMad-generated documents (PRD, Arch, etc.)
│   ├── prd.md
│   └── architecture.md
├── .gitignore
├── package.json             # Root package.json with workspaces config
├── README.md
└── turbo.json               # Turborepo configuration