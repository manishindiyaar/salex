# Admin Dashboard - Quick Reference

## Starting Development

```bash
# From root
pnpm dev:admin

# Or from admin-dashboard directory
cd apps/admin-dashboard
pnpm dev
```

Dashboard: `http://localhost:5173`
Backend API: `http://localhost:3000`

## Project Structure at a Glance

```
src/
├── components/      # UI components (Button, Card, Table, etc.)
├── pages/          # Page components (Dashboard, Businesses, etc.)
├── services/       # API client (apiClient.ts)
├── store/          # Zustand stores (authStore, businessStore)
├── theme/          # Design system (colors, typography)
├── App.tsx         # Main app with routing
├── main.tsx        # Entry point
└── index.css       # Global styles
```

## Common Tasks

### Add a New Page

1. Create component in `src/pages/NewPage.tsx`
2. Export from `src/pages/index.ts`
3. Add route in `src/App.tsx`
4. Add menu item in `src/components/Layout.tsx`

```typescript
// src/pages/NewPage.tsx
export const NewPage: React.FC = () => {
  return <div>Page content</div>;
};
```

### Add a New Component

1. Create in `src/components/NewComponent.tsx`
2. Export from `src/components/index.ts`

```typescript
// src/components/NewComponent.tsx
export const NewComponent: React.FC = () => {
  return <div>Component</div>;
};
```

### Use API Client

```typescript
import { apiClient } from '@/services/apiClient';

// In component or store
const data = await apiClient.listBusinesses({ page: 1, limit: 10 });
```

### Use Zustand Store

```typescript
import { useAuthStore } from '@/store/authStore';

export const MyComponent = () => {
  const { user, logout } = useAuthStore();
  return <button onClick={logout}>Logout</button>;
};
```

### Add Loading State

```typescript
const [isLoading, setIsLoading] = useState(false);

<Button isLoading={isLoading}>Save</Button>
```

### Show Error Alert

```typescript
import { Alert } from '@/components';

<Alert type="error" title="Error" message="Something went wrong" />
```

## Tailwind Classes Reference

### Colors
```
bg-salex-black          text-salex-white
bg-salex-black-light    text-salex-secondary
bg-salex-green          text-salex-tertiary
bg-salex-blue
bg-salex-amber
bg-salex-red
```

### Typography
```
text-salex-xs           font-salex-normal
text-salex-sm           font-salex-medium
text-salex-base         font-salex-bold
text-salex-lg           font-salex-calc
text-salex-xl
text-salex-2xl
```

### Spacing
```
p-salex-xs              gap-salex-xs
p-salex-sm              gap-salex-sm
p-salex-md              gap-salex-md
p-salex-lg              gap-salex-lg
p-salex-xl              gap-salex-xl
p-salex-xxl             gap-salex-xxl
```

### Border Radius
```
rounded-salex-sm        (6px)
rounded-salex-md        (10px)
rounded-salex-lg        (14px)
rounded-salex-xl        (20px)
```

## Component Usage Examples

### Button
```typescript
<Button variant="primary" size="md">Click me</Button>
<Button variant="secondary" isLoading={true}>Loading</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Cancel</Button>
```

### Card
```typescript
<Card>
  <CardHeader title="Title" subtitle="Subtitle" />
  <CardBody>Content here</CardBody>
  <CardFooter>Footer content</CardFooter>
</Card>
```

### Input
```typescript
<Input 
  label="Email" 
  type="email" 
  placeholder="user@example.com"
  error={errors.email}
/>
```

### Table
```typescript
<Table 
  columns={columns} 
  data={data} 
  isLoading={isLoading}
  onRowClick={(row) => console.log(row)}
/>
```

### Badge
```typescript
<Badge label="Active" variant="success" size="md" />
<Badge label="Pending" variant="warning" size="sm" />
<Badge label="Error" variant="error" />
```

### Modal
```typescript
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  footer={<Button>Save</Button>}
>
  Modal content
</Modal>
```

### Alert
```typescript
<Alert type="success" title="Success" message="Operation completed" />
<Alert type="error" title="Error" message="Something went wrong" />
<Alert type="warning" title="Warning" message="Be careful" />
<Alert type="info" title="Info" message="FYI" />
```

## API Endpoints

### Auth
```
POST   /admin/auth/login
POST   /admin/auth/logout
GET    /admin/auth/me
```

### Businesses
```
GET    /admin/businesses
GET    /admin/businesses/:id
POST   /admin/businesses/:id/toggle
PATCH  /admin/businesses/:id/plan
GET    /admin/businesses/:id/payments
GET    /admin/businesses/:id/modules
PATCH  /admin/businesses/:id/modules
```

### Payments
```
POST   /admin/payments
GET    /admin/payments
GET    /admin/payments/analytics
```

### Templates
```
GET    /admin/templates
GET    /admin/templates/:id
POST   /admin/templates
PATCH  /admin/templates/:id
DELETE /admin/templates/:id
```

### Health
```
GET    /admin/health
GET    /admin/stats
```

### Export
```
GET    /admin/export/businesses
GET    /admin/export/payments
```

## Debugging

### Check API Calls
Open browser DevTools → Network tab → Filter by XHR

### Check State
```typescript
import { useAuthStore } from '@/store/authStore';

// In component
const state = useAuthStore();
console.log(state);
```

### Check Errors
Look for red Alert components or check browser console

## Performance Tips

1. Use `useCallback` for event handlers
2. Memoize expensive computations
3. Lazy load pages with React.lazy()
4. Use pagination for large lists
5. Debounce search inputs

## Common Errors

### "Cannot find module '@/...'"
- Check path alias in `vite.config.ts`
- Restart dev server

### "API returns 401"
- Token expired or invalid
- Check localStorage for token
- Login again

### "Tailwind classes not working"
- Restart dev server
- Check class name spelling
- Verify in `tailwind.config.js`

### "Component not rendering"
- Check if component is exported
- Check if route is added
- Check browser console for errors

## Build & Deploy

### Build for Production
```bash
pnpm build
```

Output: `dist/` directory

### Preview Production Build
```bash
pnpm preview
```

### Deploy to Vercel
```bash
vercel
```

### Deploy to Netlify
```bash
netlify deploy --prod --dir=dist
```

## Environment Variables

Create `.env` file:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

For production:
```env
VITE_API_URL=https://api.salex.com/api/v1
```

## Useful Commands

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm lint --fix

# Build
pnpm build

# Preview build
pnpm preview

# Clean
rm -rf node_modules dist
pnpm install
```

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [Axios](https://axios-http.com)
- [React Router](https://reactrouter.com)
- [Lucide Icons](https://lucide.dev)

## Getting Help

1. Check README.md for overview
2. Check SETUP.md for detailed setup
3. Check component source code for examples
4. Check browser console for errors
5. Check network tab for API issues

## Next Steps

- [ ] Add more pages (audit logs, users, etc.)
- [ ] Add charts and analytics
- [ ] Add form validation
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Setup CI/CD
- [ ] Deploy to production
