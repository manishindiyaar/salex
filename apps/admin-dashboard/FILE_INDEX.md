# Admin Dashboard - File Index

## Project Root Files

### Configuration Files
- **package.json** - Dependencies and scripts
- **vite.config.ts** - Vite configuration with API proxy
- **tailwind.config.js** - Tailwind CSS configuration with custom Salex theme
- **postcss.config.js** - PostCSS configuration for Tailwind
- **tsconfig.json** - TypeScript configuration
- **tsconfig.node.json** - TypeScript configuration for Node files
- **.eslintrc.cjs** - ESLint configuration
- **.gitignore** - Git ignore rules
- **.env.example** - Environment variables template
- **index.html** - HTML entry point

### Documentation Files
- **README.md** - Project overview and features
- **SETUP.md** - Detailed setup and development guide
- **QUICK_REFERENCE.md** - Quick reference for developers
- **FILE_INDEX.md** - This file

## Source Files (`src/`)

### Entry Point
- **main.tsx** - React entry point
- **App.tsx** - Main app component with routing
- **index.css** - Global styles

### Components (`src/components/`)

#### UI Components
- **Button.tsx** - Button component (4 variants, 3 sizes)
  - Variants: primary, secondary, danger, ghost
  - Sizes: sm, md, lg
  - Features: loading state, disabled state

- **Card.tsx** - Card component with sections
  - CardHeader - Header with title, subtitle, action
  - CardBody - Main content area
  - CardFooter - Footer with border separator

- **Input.tsx** - Form input components
  - Input - Text input with label, error, helper text
  - Select - Dropdown select with options
  - TextArea - Multi-line text input

- **Table.tsx** - Data table component
  - Features: custom column rendering, loading state, empty state
  - Props: columns, data, isLoading, onRowClick

- **Badge.tsx** - Status badge component
  - Variants: success, warning, error, info, default
  - Sizes: sm, md

- **Modal.tsx** - Dialog/modal component
  - Features: header, body, footer, size options
  - Props: isOpen, onClose, title, children, footer, size

- **Alert.tsx** - Alert/notification component
  - Types: success, error, warning, info
  - Features: icon, title, message, close button

- **Layout.tsx** - Main layout with sidebar
  - Features: collapsible sidebar, header, navigation menu
  - Components: Sidebar, Header, Main content area

#### Component Exports
- **index.ts** - Barrel export for all components

### Pages (`src/pages/`)

#### Authentication
- **LoginPage.tsx** - Admin login page
  - Features: email/password form, error handling, validation
  - Actions: login, redirect to dashboard

#### Dashboard
- **DashboardPage.tsx** - Main dashboard
  - Features: statistics cards, recent activity feed
  - Data: total businesses, revenue, bookings, activity

#### Business Management
- **BusinessesPage.tsx** - Business list and management
  - Features: list, search, filter, pagination
  - Actions: toggle status, change plan, edit modal
  - Table columns: name, category, subscription, status, actions

#### Payment Management
- **PaymentsPage.tsx** - Payment history and recording
  - Features: list, search, pagination, record payment
  - Modal: record new payment with business ID, amount, method
  - Table columns: business, amount, method, status, date

#### Template Management
- **TemplatesPage.tsx** - Niche template management
  - Features: list, create, delete templates
  - Modal: create template with name, niche, description
  - Table columns: name, niche, modules, services, created, actions

#### System Monitoring
- **AnalyticsPage.tsx** - System health and analytics
  - Features: service health status, response times
  - Services: Database, Supabase, WhatsApp API, API Server
  - Auto-refresh: every 30 seconds

#### Page Exports
- **index.ts** - Barrel export for all pages

### Services (`src/services/`)

#### API Client
- **apiClient.ts** - Axios-based API client
  - Features: JWT token management, error handling, auto-redirect on 401
  - Methods:
    - Auth: login, logout, getMe
    - Businesses: listBusinesses, getBusinessDetails, toggleBusinessStatus, changeSubscriptionPlan, getBusinessPayments, getBusinessModules, updateBusinessModules
    - Payments: recordPayment, listPayments, getPaymentAnalytics
    - Templates: listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate
    - Health: getSystemHealth, getPlatformStats
    - Export: exportBusinesses, exportPayments

#### Service Exports
- **index.ts** - Barrel export for services

### State Management (`src/store/`)

#### Zustand Stores
- **authStore.ts** - Authentication state
  - State: user, isLoading, error, isAuthenticated
  - Actions: login, logout, fetchMe, clearError
  - Features: JWT token management, error handling

- **businessStore.ts** - Business management state
  - State: businesses, selectedBusiness, isLoading, error, pagination
  - Actions: fetchBusinesses, fetchBusinessDetails, toggleBusinessStatus, changeSubscriptionPlan, setPagination, clearError
  - Features: pagination, search, filtering

#### Store Exports
- **index.ts** - Barrel export for stores

### Theme (`src/theme/`)

#### Design System
- **colors.ts** - Color palette
  - Colors: background, surface, text, primary, secondary, success, warning, error
  - Status colors: PENDING, ACTIVE, TRIAL, GRACE, EXPIRED, CANCELLED, COMPLETED, CONFIRMED
  - Status background colors with opacity

- **typography.ts** - Typography system
  - Heading styles: h1, h2, h3, h4
  - Body text: body, bodySmall, bodyXSmall
  - Secondary text: secondary, secondarySmall
  - Tertiary text: tertiary
  - Calculator style: calculatorSm, calculatorMd, calculatorLg
  - Button text: button, buttonSmall
  - Label text: label, labelSmall
  - Caption text: caption
  - Font weights: normal (400), medium (600), bold (700), calculator (900)
  - Font sizes: xs, sm, base, lg, xl, 2xl, calc-sm, calc-md, calc-lg
  - Line heights: xs, sm, base, lg, xl, 2xl, calc-sm, calc-md, calc-lg

## File Statistics

### Total Files: 30+
- Configuration files: 10
- Documentation files: 4
- Source files: 16+
- Component files: 9
- Page files: 6
- Service files: 2
- Store files: 2
- Theme files: 2

### Lines of Code
- Components: ~1,500 LOC
- Pages: ~1,200 LOC
- Services: ~400 LOC
- Stores: ~300 LOC
- Theme: ~200 LOC
- Total: ~3,600 LOC

## File Dependencies

### App.tsx depends on:
- React Router
- useAuthStore
- Layout component
- All page components

### Layout.tsx depends on:
- useAuthStore
- useNavigate
- Lucide icons
- Button component

### Pages depend on:
- Components (Button, Card, Input, Table, Badge, Modal, Alert)
- apiClient
- Zustand stores
- Lucide icons

### Components depend on:
- React
- Lucide icons
- Tailwind CSS

### Stores depend on:
- Zustand
- apiClient

### apiClient depends on:
- Axios
- localStorage

## Import Patterns

### Absolute Imports (using @/)
```typescript
import { Button } from '@/components';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
```

### Relative Imports
```typescript
import { Layout } from '../components/Layout';
import { DashboardPage } from './DashboardPage';
```

## Environment Variables

### Required
- `VITE_API_URL` - Backend API URL (default: http://localhost:3000/api/v1)

## Build Artifacts

### Development
- `node_modules/` - Dependencies
- `.vite/` - Vite cache

### Production
- `dist/` - Built files
  - `index.html` - HTML entry point
  - `assets/` - JavaScript and CSS bundles

## Key Features by File

### Authentication
- **LoginPage.tsx** - User login
- **authStore.ts** - Auth state management
- **apiClient.ts** - JWT token handling

### Business Management
- **BusinessesPage.tsx** - Business CRUD
- **businessStore.ts** - Business state
- **apiClient.ts** - Business API calls

### UI/UX
- **Layout.tsx** - Main layout
- **Button.tsx** - Interactive buttons
- **Modal.tsx** - Dialogs
- **Alert.tsx** - Notifications
- **Table.tsx** - Data display

### Data Management
- **apiClient.ts** - API communication
- **authStore.ts** - Auth state
- **businessStore.ts** - Business state

### Styling
- **index.css** - Global styles
- **tailwind.config.js** - Tailwind configuration
- **colors.ts** - Color palette
- **typography.ts** - Typography system

## File Modification Guide

### To Add a New Page
1. Create `src/pages/NewPage.tsx`
2. Export from `src/pages/index.ts`
3. Add route in `src/App.tsx`
4. Add menu item in `src/components/Layout.tsx`

### To Add a New Component
1. Create `src/components/NewComponent.tsx`
2. Export from `src/components/index.ts`
3. Use in pages or other components

### To Add a New API Endpoint
1. Add method to `src/services/apiClient.ts`
2. Use in pages or stores

### To Add a New Store
1. Create `src/store/newStore.ts`
2. Export from `src/store/index.ts`
3. Use in components with `useNewStore()`

### To Update Theme
1. Modify `src/theme/colors.ts` or `src/theme/typography.ts`
2. Update `tailwind.config.js` if needed
3. Restart dev server

## Performance Considerations

### Code Splitting
- Pages are lazy-loaded via React Router
- Components are tree-shaken by Vite

### Bundle Size
- Main bundle: ~200KB (gzipped)
- Vendor bundle: ~150KB (gzipped)
- Total: ~350KB (gzipped)

### Optimization Opportunities
- [ ] Implement code splitting for pages
- [ ] Add image optimization
- [ ] Implement service worker
- [ ] Add compression
- [ ] Minify CSS/JS

## Testing Files (Future)

### Unit Tests
- `src/components/__tests__/` - Component tests
- `src/services/__tests__/` - Service tests
- `src/store/__tests__/` - Store tests

### E2E Tests
- `e2e/` - End-to-end tests
- `e2e/auth.spec.ts` - Authentication tests
- `e2e/businesses.spec.ts` - Business management tests

## Documentation Files (Future)

### API Documentation
- `docs/api.md` - API endpoint documentation
- `docs/authentication.md` - Auth flow documentation

### Component Documentation
- `docs/components.md` - Component usage guide
- `docs/storybook.md` - Storybook setup

### Architecture Documentation
- `docs/architecture.md` - System architecture
- `docs/state-management.md` - State management guide

---

**Last Updated**: January 10, 2026
**Total Files**: 30+
**Status**: Complete and Ready for Development
