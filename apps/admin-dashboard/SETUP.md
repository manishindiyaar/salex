# Admin Dashboard Setup Guide

## Quick Start

### 1. Install Dependencies

From the root of the monorepo:

```bash
pnpm install
```

This will install dependencies for all packages including the admin dashboard.

### 2. Environment Configuration

Create `.env` file in `apps/admin-dashboard/`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 3. Start Development Server

From the root:

```bash
pnpm dev:admin
```

Or from the admin-dashboard directory:

```bash
cd apps/admin-dashboard
pnpm dev
```

The dashboard will be available at `http://localhost:5173`

### 4. Backend API Setup

Ensure the backend API is running:

```bash
pnpm dev:api
```

The API should be running on `http://localhost:3000`

## Admin User Setup

To access the admin dashboard, you need admin credentials. These are created in the database.

### Create Admin User (via Prisma Studio)

1. Open Prisma Studio:
```bash
cd packages/shared-types
pnpm db:studio
```

2. Navigate to the `AdminUser` table

3. Create a new record with:
   - `email`: admin@salex.com
   - `password`: (hashed password - use bcrypt)
   - `name`: Admin User
   - `role`: SUPER_ADMIN
   - `isActive`: true

### Or via API

Use the backend API to create an admin user (if endpoint is available).

## Development Workflow

### File Structure

```
apps/admin-dashboard/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API client
│   ├── store/          # Zustand stores
│   ├── theme/          # Design system
│   ├── App.tsx         # Main app
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add menu item in `src/components/Layout.tsx`

Example:

```typescript
// src/pages/TemplatesPage.tsx
export const TemplatesPage: React.FC = () => {
  return (
    <div>
      {/* Page content */}
    </div>
  );
};
```

Then add to App.tsx:

```typescript
<Route
  path="/templates"
  element={
    <ProtectedRoute>
      <TemplatesPage />
    </ProtectedRoute>
  }
/>
```

### Adding New Components

1. Create component in `src/components/`
2. Export from `src/components/index.ts`

Example:

```typescript
// src/components/Pagination.tsx
export const Pagination: React.FC<PaginationProps> = ({ ... }) => {
  // Component implementation
};
```

### Using API Client

```typescript
import { apiClient } from '@/services/apiClient';

// In a component or store
const response = await apiClient.listBusinesses({
  page: 1,
  limit: 10,
  search: 'salon',
});
```

### Using Zustand Store

```typescript
import { useAuthStore } from '@/store/authStore';

export const MyComponent: React.FC = () => {
  const { user, logout } = useAuthStore();
  
  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

## Styling

### Tailwind Classes

The dashboard uses custom Tailwind classes matching the merchant app:

```typescript
// Colors
bg-salex-black          // #000000
bg-salex-black-light    // #0A0A0A
bg-salex-green          // #00FF00
text-salex-white        // #FFFFFF
text-salex-secondary    // #888888

// Typography
text-salex-xs           // 12px
text-salex-base         // 16px
text-salex-2xl          // 34px
font-salex-bold         // 700
font-salex-calc         // 900

// Spacing
p-salex-md              // 12px
gap-salex-lg            // 16px
mb-salex-xl             // 24px

// Border radius
rounded-salex-md        // 10px
rounded-salex-lg        // 14px
```

### Custom Components

Use the provided components for consistency:

```typescript
import { Button, Card, Input, Table, Badge, Modal, Alert } from '@/components';

<Button variant="primary" size="md">Click me</Button>
<Card>
  <CardHeader title="Title" />
  <CardBody>Content</CardBody>
</Card>
<Input label="Email" type="email" />
<Badge label="Active" variant="success" />
```

## API Integration

### Authentication Flow

1. User enters credentials on login page
2. API returns JWT token
3. Token stored in localStorage
4. Token automatically included in all requests
5. On 401 response, user redirected to login

### Error Handling

All API errors are caught and displayed via Alert component:

```typescript
try {
  await apiClient.listBusinesses();
} catch (error: any) {
  const message = error.response?.data?.message || 'An error occurred';
  // Display error to user
}
```

## Building for Production

```bash
pnpm build
```

This will:
1. Run TypeScript type checking
2. Build with Vite
3. Output to `dist/` directory

## Deployment

The built dashboard can be deployed to any static hosting:

- Vercel
- Netlify
- AWS S3 + CloudFront
- Docker container

### Docker Example

```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Troubleshooting

### Port Already in Use

If port 5173 is already in use:

```bash
pnpm dev -- --port 5174
```

### API Connection Issues

Check that:
1. Backend API is running on `http://localhost:3000`
2. VITE_API_URL is correctly set in `.env`
3. CORS is enabled on backend

### Build Errors

Clear cache and rebuild:

```bash
rm -rf node_modules dist
pnpm install
pnpm build
```

## Next Steps

- [ ] Implement template management pages
- [ ] Implement analytics dashboard
- [ ] Implement audit log viewer
- [ ] Add form validation
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Setup CI/CD pipeline
