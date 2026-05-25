/**
 * Phone Auth Screen
 * 
 * Real OTP authentication flow:
 * 1. User enters phone number
 * 2. Backend sends OTP (in dev mode, use "123456")
 * 3. User enters OTP
 * 4. Backend verifies and returns JWT token
 * 5. Navigate to business onboarding
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../theme/config';
import Icon from '@expo/vector-icons/Feather';
import { authService } from '../../services/authService';
import { AUTH_CONFIG } from '../../config';
import { useOnboardingStore } from '../../store/onboardingStore';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type OnboardingStackParamList = {
  Welcome: undefined;
  PhoneAuth: undefined;
  OtpVerification: { phoneNumber: string };
  TestOtp: undefined;
  BusinessIdentity: { businessId: string };
  ContactLocation: undefined;
  ServicesPricing: undefined;
  BusinessHours: undefined;
  ReviewComplete: undefined;
};

type PhoneAuthScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'PhoneAuth'>;

const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({ navigation }) => {
  const { setUserPhone } = useOnboardingStore();
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request OTP from backend
  async function handleRequestOtp() {
    if (!phone || !phone.startsWith('+')) {
      setError('Please enter phone number with country code (e.g., +919876543210)');
      return;
    }

    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await authService.requestOtp(phone);
      
      if (result.success) {
        setShowOtpScreen(true);
        // In dev mode, show hint about magic OTP
        if (__DEV__) {
          console.log('💡 Dev mode: Use OTP "123456"');
        }
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('OTP request error:', err);
      setError('Failed to send OTP. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // Verify OTP with backend
  async function handleVerifyOtp() {
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await authService.verifyOtp(phone, otp);
      
      if (result.success && result.user) {
        console.log('✅ Auth successful, navigating to onboarding');
        setUserPhone(phone); // Store E.164 phone for business creation
        navigation.navigate('BusinessIdentity', { businessId: result.user.id });
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Format phone number input
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (cleaned && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return cleaned;
  };

  // Phone number entry screen
  if (!showOtpScreen) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.iconContainer}>
              <Icon name="smartphone" size={32} color={Colors.primary} />
            </View>
            
            <Text style={styles.title}>Enter your phone number</Text>
            <Text style={styles.subtitle}>
              We'll send you a verification code to confirm your number
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                value={phone}
                onChangeText={(text) => {
                  setPhone(formatPhoneNumber(text));
                  setError(null);
                }}
                placeholder="+91 98765 43210"
                placeholderTextColor="#666"
                style={styles.input}
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!loading}
              />
              <Text style={styles.helperText}>
                Include country code (e.g., +91 for India)
              </Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color="#FF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                (!phone.startsWith('+') || phone.length < 10 || loading) && styles.buttonDisabled
              ]}
              onPress={handleRequestOtp}
              disabled={!phone.startsWith('+') || phone.length < 10 || loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </Text>
            </TouchableOpacity>

            {__DEV__ && (
              <Text style={styles.devHint}>
                💡 Dev mode: Backend accepts magic OTP "123456"
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // OTP verification screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              setShowOtpScreen(false);
              setOtp('');
              setError(null);
            }} 
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.iconContainer}>
            <Icon name="shield" size={32} color={Colors.primary} />
          </View>
          
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to {phone}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Verification Code</Text>
            <TextInput
              value={otp}
              onChangeText={(text) => {
                setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                setError(null);
              }}
              placeholder="123456"
              placeholderTextColor="#666"
              style={[styles.input, styles.otpInput]}
              keyboardType="number-pad"
              autoCapitalize="none"
              maxLength={6}
              textAlign="center"
              editable={!loading}
            />
            <Text style={styles.helperText}>
              Enter the 6-digit code from your SMS
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={16} color="#FF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              (otp.length < 6 || loading) && styles.buttonDisabled
            ]}
            onPress={handleVerifyOtp}
            disabled={otp.length < 6 || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              setOtp('');
              setError(null);
              handleRequestOtp();
            }}
            disabled={loading}
          >
            <Text style={styles.linkButtonText}>Didn't receive code? Resend</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <Text style={styles.devHint}>
              💡 Dev mode: Use OTP "{AUTH_CONFIG.DEV_MAGIC_OTP}"
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.MD,
    paddingBottom: Spacing.LG,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.XL,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.MD,
  },
  subtitle: {
    fontSize: 16,
    color: '#A6A6A6',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.XXL,
  },
  inputContainer: {
    marginBottom: Spacing.LG,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.SM,
  },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.LG,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    fontSize: 18,
    color: Colors.text,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  otpInput: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 8,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    color: '#777777',
    marginTop: Spacing.SM,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.LG,
    paddingHorizontal: Spacing.MD,
  },
  errorText: {
    fontSize: 14,
    color: '#FF4444',
    marginLeft: Spacing.SM,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.LG,
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.XL,
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.MD,
  },
  linkButtonText: {
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
  },
  devHint: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: Spacing.XL,
    fontStyle: 'italic',
  },
});

export default PhoneAuthScreen;
