# Project Structure & Organization

## Monorepo Layout
```
salex/
├── apps/                           # Deployable applications
│   ├── MerchantAppExpo/           # React Native merchant app
│   └── api(deprecated)/           # Legacy NestJS backend
├── packages/                      # Shared code packages
│   ├── shared-types/              # TypeScript type definitions
│   ├── eslint-config-custom/      # ESLint configuration
│   └── typescript-config/         # TypeScript configurations
├── docs/                          # Project documentation
│   ├── architecture/              # Technical architecture docs
│   ├── prd/                       # Product requirements
│   └── stories/                   # User stories
├── curl-test/                     # API testing scripts
├── bmad-core/                     # Agent workflow definitions
└── WhatsappMockUI/               # WhatsApp simulator UI
```

## Key Directories

### `/apps/MerchantAppExpo/` - React Native App
```
src/
├── components/        # Reusable UI components
├── screens/          # Screen components
├── navigation/       # Navigation configuration
├── services/         # API clients and external services
├── store/           # Zustand state management
├── context/         # React context providers
├── config/          # App configuration
└── theme/           # UI theme and styling
```

### `/packages/shared-types/` - Type Definitions
- **Purpose**: Single source of truth for TypeScript types
- **Usage**: Imported by both frontend and backend
- **Critical Rule**: Never duplicate types across apps

### `/docs/` - Documentation Structure
- **architecture/**: Technical specifications and design decisions
- **prd/**: Product requirements and user stories
- **stories/**: Detailed user story specifications

### `/curl-test/` - API Testing
- Comprehensive test scripts for all backend endpoints
- Environment-specific test configurations
- Integration test suites for complete user flows

## Naming Conventions

### File Naming
- **Components**: PascalCase (`BookingCard.tsx`)
- **Screens**: PascalCase (`BusinessOnboarding.tsx`)
- **Services**: camelCase (`apiClient.ts`)
- **Hooks**: camelCase with `use` prefix (`useBookings.ts`)
- **Types**: PascalCase (`BusinessProfile.ts`)

### Directory Structure Rules
- Group by feature/domain when possible
- Keep shared utilities in dedicated directories
- Separate concerns (UI, business logic, data)
- Use index files for clean imports

## Import Patterns
```typescript
// Shared types (always from package)
import { Business, Booking } from 'shared-types';

// Relative imports for local files
import { BookingCard } from '../components/BookingCard';

// Absolute imports for services
import { apiClient } from '@/services/apiClient';
```

## Critical Architecture Rules
- **Type Sharing**: All shared types must be in `packages/shared-types`
- **API Client**: Use singleton `apiClient` for all HTTP requests
- **State Management**: Zustand stores with immutable updates only
- **Database Access**: Backend services must use PrismaService injection
- **Authentication**: All protected endpoints use `@UseGuards(ClerkAuthGuard)`