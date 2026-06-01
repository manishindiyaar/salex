import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import TestOtpScreen from '../screens/auth/TestOtpScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';
import BusinessIdentityScreen from '../screens/onboarding/BusinessIdentityScreen';
import ContactLocationScreen from '../screens/onboarding/ContactLocationScreen';
import ServicesPricingScreen from '../screens/onboarding/ServicesPricingScreen';
import ResourceSetupScreen from '../screens/onboarding/ResourceSetupScreen';
import StaffSetupScreen from '../screens/onboarding/StaffSetupScreen';
import BusinessHoursScreen from '../screens/onboarding/BusinessHoursScreen';
import ReviewCompleteScreen from '../screens/onboarding/ReviewCompleteScreen';

// BusinessTypeScreen removed — category is always SALON in this build.
// For Spa / Clinic builds, swap the clinicConfig.ts via Expo build profiles.

export type OnboardingStackParamList = {
  Welcome: undefined;
  PhoneAuth: undefined;
  OtpVerification: { phoneNumber: string };
  ChangePassword: { currentPassword: string };
  TestOtp: undefined;
  BusinessIdentity: { businessId: string };
  ContactLocation: undefined;
  ServicesPricing: undefined;
  ResourceSetup: undefined;
  StaffSetup: undefined;
  BusinessHours: undefined;
  ReviewComplete: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();
type OnboardingScreen<RouteName extends keyof OnboardingStackParamList> =
  React.ComponentType<NativeStackScreenProps<OnboardingStackParamList, RouteName>>;

const OtpVerification = OtpVerificationScreen as unknown as OnboardingScreen<'OtpVerification'>;
const BusinessIdentity = BusinessIdentityScreen as unknown as OnboardingScreen<'BusinessIdentity'>;

const OnboardingNavigator: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const initialRouteName = isAuthenticated && !user?.mustChangePassword ? 'BusinessIdentity' : 'Welcome';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerification} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      {/* OTP → directly to BusinessIdentity, no type selection needed */}
      <Stack.Screen
        name="BusinessIdentity"
        component={BusinessIdentity}
        initialParams={{ businessId: user?.id ?? '' }}
      />
      <Stack.Screen name="ContactLocation" component={ContactLocationScreen} />
      <Stack.Screen name="ServicesPricing" component={ServicesPricingScreen} />
      <Stack.Screen name="ResourceSetup" component={ResourceSetupScreen} />
      <Stack.Screen name="StaffSetup" component={StaffSetupScreen} />
      <Stack.Screen name="BusinessHours" component={BusinessHoursScreen} />
      <Stack.Screen name="ReviewComplete" component={ReviewCompleteScreen} />
      {/* Dev-only quick test route for OTP */}
      <Stack.Screen name="TestOtp" component={TestOtpScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
