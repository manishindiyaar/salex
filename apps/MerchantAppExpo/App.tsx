import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, Text } from 'react-native';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, Theme as NavigationTheme } from '@react-navigation/native';
import { Provider as PaperProvider, MD3LightTheme as PaperDefaultTheme } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import ToastHost from './src/components/ToastHost';
import { Colors } from './src/theme/config';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Firebase is automatically initialized by Expo plugins

type PaperTheme = typeof PaperDefaultTheme;

/**
 * NOTE:
 * - Migrated to Expo for better developer experience
 * - Firebase Phone Authentication integrated
 * - All existing screens and components preserved
 * - Category-based dynamic UI system integrated
 */
export default function App() {
  // Ensure vector icon font is loaded (no-op after first mount)
  // Some environments require explicit loadFont to render icons consistently.
  Icon.loadFont();

  // Bridge our token colors into Paper + Navigation themes
  const paperTheme: PaperTheme = {
    ...PaperDefaultTheme,
    colors: {
      ...PaperDefaultTheme.colors,
      primary: Colors.primary,
      secondary: Colors.secondary,
      background: Colors.background,
      surface: Colors.surface,
      onSurface: Colors.text,
      outline: '#E5E7EB',
      error: Colors.error,
    },
  };

  const navigationTheme: NavigationTheme = {
    ...NavigationDefaultTheme,
    colors: {
      ...NavigationDefaultTheme.colors,
      primary: Colors.primary,
      background: Colors.background,
      card: Colors.surface,
      text: Colors.text,
      border: '#E5E7EB',
      notification: Colors.secondary,
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          {/* Temporarily disable CategoryProvider to test app loading */}
          {/* <CategoryProvider businessId="default" fallbackCategory="SALON"> */}
            <NavigationContainer theme={navigationTheme}>
              <RootNavigator />
            </NavigationContainer>
          {/* </CategoryProvider> */}
        </AuthProvider>
      </PaperProvider>
      <ToastHost />
    </SafeAreaProvider>
  );
}
