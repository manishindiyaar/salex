# Design Document: Admin Dashboard Fixes

## Overview

This design document addresses multiple issues in the Admin Dashboard and its integration with the Merchant App. The fixes include correcting API parameter naming, aligning response structures, implementing proper audit logging, and enforcing business deactivation in the Merchant App.

## Architecture

The system follows a three-tier architecture:

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Admin Dashboard   │     │     API Server      │     │    Merchant App     │
│   (React + Vite)    │────▶│   (Express.js)      │◀────│   (React Native)    │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │   PostgreSQL DB     │
                            │   (Supabase)        │
                            └─────────────────────┘
```

### Issue Analysis

| Issue | Root Cause | Fix Location |
|-------|------------|--------------|
| Dashboard stats failing | API response structure mismatch | Admin Dashboard apiClient |
| Plan change not working | Frontend sends `planId`, API expects `plan` | Admin Dashboard apiClient |
| Toggle not reflecting in Merchant App | Merchant App doesn't check `isActive` | Merchant App TabNavigator |
| Templates page blank | API response structure mismatch | Admin Dashboard TemplatesPage |
| System Health failing | API response structure mismatch | Admin Dashboard SystemHealthPage |
| Audit Logs showing 0 | Audit logging not triggered on actions | API controllers |

## Components and Interfaces

### 1. Admin Dashboard API Client Fix

The `changeSubscriptionPlan` method sends `planId` but the API expects `plan`:

```typescript
// Current (broken)
async changeSubscriptionPlan(id: string, planId: string) {
  const response = await this.client.patch(`/admin/businesses/${id}/plan`, { planId });
  return response.data;
}

// Fixed
async changeSubscriptionPlan(id: string, plan: string, reason: string) {
  const response = await this.client.patch(`/admin/businesses/${id}/plan`, { plan, reason });
  return response.data;
}
```

### 2. Admin Business Controller - Audit Logging

The `toggleBusinessStatus` method needs to call the audit log service:

```typescript
// Add audit logging to toggleBusinessStatus
await auditLogService.logBusinessStatusChange(
  req.admin.adminId,
  id,
  business.isActive,
  newStatus,
  reason
);
```

### 3. Merchant App - Deactivation Enforcement

Add a wrapper component that checks `isActive` status and shows the suspension banner:

```typescript
// BusinessStatusWrapper component
const BusinessStatusWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { business } = useBusinessStore();
  
  if (business && !business.isActive) {
    return <AccountSuspendedScreen />;
  }
  
  return <>{children}</>;
};
```

### 4. Templates Page - Response Structure Fix

The frontend expects `response.data` to be an array, but API returns `{ templates: [...] }`:

```typescript
// Current (broken)
setTemplates(response.data);

// Fixed
setTemplates(response.data.templates || []);
```

### 5. System Health Page - Response Structure Fix

The frontend expects a specific structure that doesn't match the API response:

```typescript
// API returns
{
  success: true,
  data: {
    overall: { status: 'healthy', timestamp: '...' },
    services: { database: {...}, supabase: {...}, ... }
  }
}

// Frontend expects
{
  overall: 'healthy',
  services: [{ name: 'Database', status: 'healthy', ... }]
}
```

## Data Models

### Business Model (existing)
```typescript
interface Business {
  id: string;
  name: string;
  isActive: boolean;  // Admin toggle for deactivation
  // ... other fields
}
```

### Subscription Model (existing)
```typescript
interface Subscription {
  id: string;
  businessId: string;
  plan: 'BASIC' | 'PRO' | 'CUSTOM';
  status: 'TRIAL' | 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'CANCELLED';
  // ... other fields
}
```

### AuditLog Model (existing)
```typescript
interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  reason?: string;
  createdAt: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Plan Change Parameter Correctness
*For any* plan change request from the Admin Dashboard, the API call SHALL include a `plan` parameter (not `planId`) with a value of BASIC, PRO, or CUSTOM.
**Validates: Requirements 2.1, 2.6**

### Property 2: Admin Action Audit Logging
*For any* admin action that modifies business data (toggle status, change plan, record payment), the API_Server SHALL create an audit log entry containing the admin ID, action type, entity ID, and changes made.
**Validates: Requirements 2.3, 3.2, 7.5**

### Property 3: Deactivated Business Feature Blocking
*For any* business with `isActive=false`, the Merchant_App SHALL display the AccountSuspendedBanner and prevent access to booking creation features.
**Validates: Requirements 4.1, 4.2, 4.4**

### Property 4: Business Reactivation Restores Access
*For any* business that transitions from `isActive=false` to `isActive=true`, the Merchant_App SHALL remove the suspension banner and restore normal feature access.
**Validates: Requirements 4.5**

## Error Handling

### API Error Responses
All API endpoints return consistent error responses:
```typescript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable error message'
  }
}
```

### Frontend Error Display
- All pages display errors using the `Alert` component
- Errors are dismissible with an `onClose` handler
- Loading states show a spinner to indicate pending operations

### Specific Error Cases
| Error | Code | Message |
|-------|------|---------|
| Invalid plan value | VALIDATION_ERROR | Plan must be BASIC, PRO, or CUSTOM |
| Business not found | NOT_FOUND | Business not found |
| Unauthorized | UNAUTHORIZED | Admin authentication required |
| Missing reason | VALIDATION_ERROR | Reason is required for plan changes |

## Testing Strategy

### Unit Tests
- Test API client methods send correct parameters
- Test response parsing handles various structures
- Test error handling displays appropriate messages

### Property-Based Tests
- Test that all admin actions create audit logs
- Test that deactivated businesses show suspension banner
- Test that plan changes validate input correctly

### Integration Tests
- Test full flow: Admin changes plan → API updates DB → Merchant App reflects change
- Test full flow: Admin deactivates business → Merchant App shows suspension
- Test full flow: Admin action → Audit log created → Audit page displays entry

### Test Configuration
- Use Vitest for Admin Dashboard tests
- Use Jest for API tests
- Minimum 100 iterations for property-based tests
- Tag format: **Feature: admin-dashboard-fixes, Property {number}: {property_text}**
