import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, Theme as NavigationTheme } from '@react-navigation/native';
import { Provider as PaperProvider, MD3LightTheme as PaperDefaultTheme } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import ToastHost from './src/components/ToastHost';
import { Colors } from './src/theme/config';
import Icon from '@expo/vector-icons/MaterialIcons';

// Expo Google Fonts loading support
import { useFonts } from 'expo-font';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { NotoSerifDevanagari_400Regular } from '@expo-google-fonts/noto-serif-devanagari';
import { NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari';

type PaperTheme = typeof PaperDefaultTheme;

/**
 * NOTE:
 * - Migrated to Expo for better developer experience
 * - Firebase Phone Authentication integrated
 * - Salon-first build: category system replaced with static salonConfig.ts
 */
export default function App() {
  const [fontsLoaded] = useFonts({
    'InstrumentSerif-Regular': InstrumentSerif_400Regular,
    'InstrumentSerif-Italic': InstrumentSerif_400Regular_Italic,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'SpaceMono-Bold': SpaceMono_700Bold,
    'NotoSerifDevanagari-Regular': NotoSerifDevanagari_400Regular,
    'NotoSansDevanagari-Regular': NotoSansDevanagari_400Regular,
  });

  // Ensure vector icon font is loaded (no-op after first mount)
  // Some environments require explicit loadFont to render icons consistently.
  Icon.loadFont();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FCFCFA', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#03031F" />
      </View>
    );
  }

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
            <NavigationContainer theme={navigationTheme}>
              <RootNavigator />
            </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
      <ToastHost />
    </SafeAreaProvider>
  );
}
