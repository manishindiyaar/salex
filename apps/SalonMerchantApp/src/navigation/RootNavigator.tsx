import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/config';
import OnboardingNavigator from './OnboardingNavigator';
import TabNavigator from './TabNavigator';
import ResourceManagementScreen from '../screens/main/ResourceManagementScreen';
import StaffManagementScreen from '../screens/main/StaffManagementScreen';
import LedgerScreen from '../screens/main/LedgerScreen';

type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  MainTabs: undefined;
  ResourceManagement: undefined;
  StaffManagement: undefined;
  Ledger: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Main stack with tabs and management screens
const MainStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen 
        name="ResourceManagement" 
        component={ResourceManagementScreen}
        options={{
          headerShown: true,
          headerTitle: 'Resources',
          headerStyle: { backgroundColor: Colors.BACKGROUND },
          headerTintColor: Colors.TEXT,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen 
        name="StaffManagement" 
        component={StaffManagementScreen}
        options={{
          headerShown: true,
          headerTitle: 'Staff',
          headerStyle: { backgroundColor: Colors.BACKGROUND },
          headerTintColor: Colors.TEXT,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen 
        name="Ledger" 
        component={LedgerScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const RootNavigator: React.FC = () => {
  const { isOnboarded, isLoadingAuth } = useAuth();

  // Show loading screen while checking onboarding status
  if (isLoadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isOnboarded ? (
        <Stack.Screen name="Main" component={MainStack} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.BACKGROUND,
  },
});

export default RootNavigator;