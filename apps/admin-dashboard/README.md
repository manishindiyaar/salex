# Salex Admin Dashboard

Admin dashboard for managing Salex platform - businesses, subscriptions, payments, and analytics.

## Features

- **Authentication**: JWT-based admin login with role-based access control
- **Business Management**: View, search, and manage all businesses
- **Subscription Management**: Change subscription plans and manage billing
- **Payment Management**: Record and track payments
- **Analytics**: Platform-wide statistics and insights
- **Audit Logging**: Track all admin actions

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (matching merchant app design system)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Routing**: React Router v6

## Design System

The admin dashboard uses the same design system as the merchant app:

- **Colors**: Deep Black (#000000), Salex Green (#00FF00), Blue (#00AAFF), Amber (#FFB800), Red (#FF3333)
- **Typography**: System fonts with weights 400, 600, 700, 900
- **Components**: Reusable UI components (Button, Card, Input, Table, Badge, Modal, Alert)
- **Spacing**: Consistent spacing scale (4px, 8px, 12px, 16px, 24px, 32px)

## Getting Started

### Installation

```bash
cd apps/admin-dashboard
pnpm install
```

### Environment Setup

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Development

```bash
pnpm dev
```

The dashboard will be available at `http://localhost:5173`

### Build

```bash
pnpm build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Table.tsx
│   ├── Badge.tsx
│   ├── Layout.tsx
│   ├── Modal.tsx
│   ├── Alert.tsx
│   └── index.ts
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── BusinessesPage.tsx
│   ├── PaymentsPage.tsx
│   └── index.ts
├── services/           # API client
│   ├── apiClient.ts
│   └── index.ts
├── store/             # Zustand stores
│   ├── authStore.ts
│   ├── businessStore.ts
│   └── index.ts
├── theme/             # Design system
│   ├── colors.ts
│   └── typography.ts
├── App.tsx            # Main app component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## API Integration

The dashboard connects to the backend API at `/api/v1/admin/*` endpoints:

- **Auth**: `/admin/auth/login`, `/admin/auth/logout`, `/admin/auth/me`
- **Businesses**: `/admin/businesses`, `/admin/businesses/:id`, `/admin/businesses/:id/toggle`, `/admin/businesses/:id/plan`
- **Payments**: `/admin/payments`, `/admin/payments/analytics`
- **Templates**: `/admin/templates`
- **Health**: `/admin/health`, `/admin/stats`

## Authentication

Admin users are authenticated via JWT tokens signed with the Supabase secret. Tokens are stored in localStorage and automatically included in all API requests.

Role-based access control:
- **SUPPORT**: Read-only access to businesses and payments
- **ADMIN**: Can manage businesses, subscriptions, and payments
- **SUPER_ADMIN**: Full access including template and module management

## State Management

Uses Zustand for state management:

- `useAuthStore`: Authentication state and user info
- `useBusinessStore`: Business list and details

## Styling

All components use Tailwind CSS with custom Salex theme configuration. The theme matches the merchant app exactly for consistency.

Custom Tailwind classes:
- `text-salex-*`: Font sizes (xs, sm, base, lg, xl, 2xl)
- `font-salex-*`: Font weights (normal, medium, bold, calc)
- `bg-salex-*`: Background colors
- `text-salex-*`: Text colors
- `border-salex-*`: Border colors
- `rounded-salex-*`: Border radius (sm, md, lg, xl)
- `p-salex-*`: Padding (xs, sm, md, lg, xl, xxl)
- `gap-salex-*`: Gap spacing

## Development Guidelines

1. **Components**: Keep components small and focused
2. **State**: Use Zustand stores for global state
3. **API**: Use `apiClient` singleton for all HTTP requests
4. **Styling**: Use Tailwind classes, follow design system
5. **Types**: Use TypeScript for type safety
6. **Error Handling**: Show user-friendly error messages via Alert component

## Next Steps

- [ ] Add template management pages
- [ ] Add analytics and reporting pages
- [ ] Add audit log viewer
- [ ] Add data export functionality
- [ ] Add user management pages
- [ ] Add system health monitoring page
- [ ] Add form validation
- [ ] Add loading states and skeletons
- [ ] Add error boundaries
- [ ] Add unit and integration tests
