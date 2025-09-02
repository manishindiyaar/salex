import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import TestOtpScreen from '../screens/auth/TestOtpScreen';
import BusinessTypeScreen from '../screens/onboarding/BusinessTypeScreen';
import BusinessIdentityScreen from '../screens/onboarding/BusinessIdentityScreen';
import ContactLocationScreen from '../screens/onboarding/ContactLocationScreen';
import ServicesPricingScreen from '../screens/onboarding/ServicesPricingScreen';
import BusinessHoursScreen from '../screens/onboarding/BusinessHoursScreen';
import ReviewCompleteScreen from '../screens/onboarding/ReviewCompleteScreen';

type OnboardingStackParamList = {
  Welcome: undefined;
  PhoneAuth: undefined;
  OtpVerification: { phoneNumber: string };
  TestOtp: undefined; // Dev-only
  BusinessType: { userId: string };
  BusinessIdentity: { businessType: string; businessId: string };
  ContactLocation: undefined;
  ServicesPricing: undefined;
  BusinessHours: undefined;
  ReviewComplete: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="BusinessType" component={BusinessTypeScreen} />
      <Stack.Screen name="BusinessIdentity" component={BusinessIdentityScreen} />
      <Stack.Screen name="ContactLocation" component={ContactLocationScreen} />
      <Stack.Screen name="ServicesPricing" component={ServicesPricingScreen} />
      <Stack.Screen name="BusinessHours" component={BusinessHoursScreen} />
      <Stack.Screen name="ReviewComplete" component={ReviewCompleteScreen} />
      {/* Dev-only quick test route for OTP */}
      <Stack.Screen name="TestOtp" component={TestOtpScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
