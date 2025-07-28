# 11. Frontend Architecture

## Component Architecture

We will follow a pattern inspired by Atomic Design to ensure our components are reusable, composable, and easy to manage.

**Component Organization**
The `src/components/` directory will be organized by complexity:

```plaintext
apps/merchant-app/
└── src/
    └── components/
        ├── atoms/         # The smallest building blocks (Button, Input, Icon)
        ├── molecules/     # Combinations of atoms (e.g., a search bar with an icon and input)
        └── organisms/     # Complex components that form sections of a screen (e.g., BookingList)

Component Template
All components will be functional components using TypeScript. Here is a basic template for an atom component:

TypeScript

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
State Management Architecture
We will use Zustand for its simplicity and power. State will be organized into "slices," with each slice managing a specific domain.

State Structure

Plaintext

apps/merchant-app/
└── src/
    └── store/
        ├── bookingStore.ts   # Manages state for bookings
        ├── businessStore.ts  # Manages state for the merchant's business profile
        └── index.ts          # Exports all stores
State Management Patterns

Slices: Each file in store/ will define a state slice with its own state and actions.

Selectors: Components will use selectors to subscribe to only the pieces of state they need, preventing unnecessary re-renders.

Async Actions: Async operations (like API calls) will be handled within store actions.

Routing Architecture
We will use React Navigation to manage all navigation within the app.

Route Organization

Plaintext

apps/merchant-app/
└── src/
    └── navigation/
        ├── AppStack.tsx      # Screens visible after login (e.g., Dashboard)
        ├── AuthStack.tsx     # Screens for login and sign-up
        └── RootNavigator.tsx # Main navigator, switches between stacks
Protected Route Pattern
The RootNavigator will use the authentication status from Clerk to decide which stack of screens to show.

TypeScript

// src/navigation/RootNavigator.tsx
import React from 'react';
import { useAuth } from '@clerk/clerk-react-native';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';

export const RootNavigator = () => {
  const { isLoaded, isSignedIn } = useAuth();

  // You can render a loading indicator here while Clerk is loading
  if (!isLoaded) {
    return null; 
  }

  return isSignedIn ? <AppStack /> : <AuthStack />;
};
Frontend Services Layer
All communication with the backend API will be handled in a dedicated service layer, abstracting the data-fetching logic from the UI components.

API Client Setup
We will use Axios to create a single, configured client instance with an interceptor to automatically add the Clerk JWT to every request.

TypeScript

// src/services/apiClient.ts
import axios from 'axios';
import { Clerk } from '@clerk/clerk-react-native';

const apiClient = axios.create({
  baseURL: 'YOUR_API_BASE_URL', // To be loaded from environment variables
});

// Interceptor to add the auth token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await Clerk.session?.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
Service Example

TypeScript

// src/services/bookingService.ts
import apiClient from './apiClient';
import type { Booking } from 'shared-types'; // Importing from our shared package

export const getBookings = async (businessId: string): Promise<Booking[]> => {
  const response = await apiClient.get(`/businesses/${businessId}/bookings`);
  return response.data;
};        