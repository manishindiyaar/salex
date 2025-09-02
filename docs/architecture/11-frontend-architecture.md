# 11. Frontend Architecture

> **📋 UX Specification:** For detailed UI/UX requirements, user flows, and design specifications, see [11.1 Frontend UX Specification](./11-1-frontend-ux-specification.md)

## React Native CLI Architecture

The Salex mobile app is built using **React Native CLI** (not Expo) for maximum flexibility and native platform access. This enables "write once, run anywhere" development while maintaining full control over native dependencies.

### Platform Support
- **iOS:** iPhone and iPad via iOS Simulator and physical devices
- **Android:** Android phones and tablets via Android Emulator and physical devices
- **Deployment:** App Store (iOS) and Google Play Store (Android)

## Component Architecture

We follow a pattern inspired by Atomic Design to ensure our components are reusable, composable, and easy to manage across both platforms.

**Component Organization**
The `src/components/` directory is organized by complexity:

```plaintext
apps/MerchantApp/
└── src/
    └── components/
        ├── atoms/         # The smallest building blocks (Button, Input, Icon)
        ├── molecules/     # Combinations of atoms (e.g., a search bar with an icon and input)
        └── organisms/     # Complex components that form sections of a screen (e.g., BookingList)

## React Native Paper UI Framework

We use **React Native Paper** as our primary UI component library, customized with the Salex design system for consistent branding across both platforms. The components are themed using our gradient red primary color (#FF416C → #FF4B2B) and dark theme palette.

**Component Template**
All components are functional components using TypeScript:

```typescript
// src/components/atoms/PrimaryButton.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

type PrimaryButtonProps = React.ComponentProps<typeof Button>;

export const PrimaryButton = (props: PrimaryButtonProps) => {
  return (
    <Button
      {...props}
      mode="contained"
      style={[styles.button, props.style]}
      labelStyle={styles.label}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

## Design System Implementation

**Theme Configuration**
The Salex design system is implemented through a central theme file that customizes React Native Paper:

```typescript
// src/theme/index.ts
import { MD3DarkTheme } from 'react-native-paper';

export const salexTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF416C',
    secondary: '#FF4B2B',
    background: '#121212',
    surface: '#1E1E1E',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B3B3B3',
    error: '#E74C3C',
    success: '#2ECC71',
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    headlineSmall: { fontFamily: 'Playfair Display', fontSize: 24 },
    bodyMedium: { fontFamily: 'Inter', fontSize: 16 },
  },
};
```

**Core Components**
- **Living Booking Card:** Stateful component with PENDING/CONFIRMED/ARCHIVED variants
- **Themed Button:** Primary CTA with gradient styling and multiple states
- **Titled Input Field:** Consistent form inputs with validation states

## State Management Architecture
We use **Zustand** for its simplicity and power. State is organized into "slices," with each slice managing a specific domain.

**State Structure**
```plaintext
apps/MerchantApp/
└── src/
    └── store/
        ├── bookingStore.ts   # Manages state for bookings
        ├── businessStore.ts  # Manages state for the merchant's business profile
        └── index.ts          # Exports all stores
```
State Management Patterns

Slices: Each file in store/ will define a state slice with its own state and actions.

Selectors: Components will use selectors to subscribe to only the pieces of state they need, preventing unnecessary re-renders.

Async Actions: Async operations (like API calls) will be handled within store actions.

## Routing Architecture
We use **React Navigation v6** to manage all navigation within the app across both iOS and Android platforms, following the UX-defined navigation structure.

**Route Organization**
```plaintext
apps/MerchantApp/
└── src/
    └── navigation/
        ├── AppStack.tsx         # Main tab navigator (Bookings, Catalog, Profile)
        ├── AuthStack.tsx        # Authentication flow screens
        ├── OnboardingStack.tsx  # Business setup flow (3 steps)
        └── RootNavigator.tsx    # Root navigator, switches between stacks
```

**Tab Navigation Structure**
The main app uses a bottom tab navigator with three tabs (ordered by priority):
1. **Bookings Tab (default):** Today's bookings, booking details, duty mode
2. **Catalog Tab:** Service management and editing
3. **Profile Tab:** Business analytics and settings
Protected Route Pattern
The RootNavigator will use the authentication status from firebase to decide which stack of screens to show.


## Frontend Services Layer
All communication with the backend API is handled in a dedicated service layer, abstracting the data-fetching logic from the UI components.

**API Client Setup**
We use **Axios** to create a single, configured client instance with an interceptor to automatically add the firebase JWT to every request:

```typescript
// src/services/apiClient.ts
import axios from 'axios';
import { getAuth } from 'firebase/auth';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // Backend API URL
});

// Interceptor to add the auth token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await getAuth().currentUser?.getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```
**Service Example**
```typescript
// src/services/bookingService.ts
import apiClient from './apiClient';
import type { Booking } from 'shared-types'; // Importing from our shared package

export const getBookings = async (businessId: string): Promise<Booking[]> => {
  const response = await apiClient.get(`/businesses/${businessId}/bookings`);
  return response.data;
};
```

## Development & Deployment Architecture

### Development Environment
```bash
# Start Metro bundler
cd apps/MerchantApp && npm start

# Run on iOS simulator
npx react-native run-ios

# Run on Android emulator  
npx react-native run-android

# Run on physical devices
npx react-native run-ios --device="iPhone Name"
npx react-native run-android --device
```

### Cross-Platform Compatibility
- **React Native Paper:** Ensures consistent UI across platforms
- **React Navigation:** Handles navigation patterns for both iOS and Android
- **Platform-specific code:** Uses `Platform.select()` when needed
- **Shared business logic:** Maximum code reuse between platforms

### Production Deployment Pipeline
```plaintext
Development (Simulators) → 
Beta Testing (TestFlight/APK) → 
Production (App Stores)

iOS Flow:
Metro Bundler → iOS Simulator → Physical iPhone → 
Xcode Archive → App Store Connect → TestFlight → App Store

Android Flow:  
Metro Bundler → Android Emulator → Physical Android → 
Release APK/AAB → Google Play Console → Beta Track → Play Store
```

### Dependencies & Build System
- **React Native CLI:** v12.3.6 (Standard toolchain)
- **Metro:** JavaScript bundler for React Native
- **Xcode:** iOS builds and App Store deployment
- **Android Studio:** Android builds and Play Store deployment
- **CocoaPods:** iOS dependency management
- **Gradle:** Android build system        