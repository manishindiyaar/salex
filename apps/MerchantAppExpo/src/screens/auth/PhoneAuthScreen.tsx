import React, { useState, useEffect } from 'react';
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
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../../context/AuthContext';
import { AUTH_CONFIG } from '../../config';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type OnboardingStackParamList = {
  Welcome: undefined;
  PhoneAuth: undefined;
  OtpVerification: { phoneNumber: string };
  TestOtp: undefined;
  BusinessType: { userId: string };
  BusinessIdentity: { businessType: string; businessId: string };
  ContactLocation: undefined;
  ServicesPricing: undefined;
  BusinessHours: undefined;
  ReviewComplete: undefined;
};

type PhoneAuthScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'PhoneAuth'>;

const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({ navigation }) => {
  const { completeOnboarding } = useAuth();
  
  // Simple mock state for UI (no Firebase)
  const [confirm, setConfirm] = useState<boolean>(false);
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Preset phone number when auth is disabled (but still show the flow)
  useEffect(() => {
    if (!AUTH_CONFIG.ENABLE_AUTH) {
      console.log('🔧 Auth disabled - presetting phone number for test');
      setPhone('+1234567890');
    }
  }, []);

  // Mock phone number handler
  async function handleSignInWithPhoneNumber(phoneNumber: string) {
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      Alert.alert('Error', 'Please enter phone number in E.164 format (e.g., +1234567890)');
      return;
    }

    try {
      setLoading(true);
      
      if (!AUTH_CONFIG.ENABLE_AUTH) {
        // Mock delay for auth disabled mode
        await new Promise(resolve => setTimeout(resolve, 800));
        setConfirm(true);
        console.log('🔧 Auth disabled - proceeding to OTP screen with preset code');
      } else {
        // Real Firebase auth would go here
        await new Promise(resolve => setTimeout(resolve, 1000));
        setConfirm(true);
        Alert.alert('OTP Sent', `Verification code sent to ${phoneNumber}`);
      }
    } catch (error: any) {
      console.error('Phone auth error:', error);
      Alert.alert('Error', 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }

  // Preset OTP code when auth is disabled
  useEffect(() => {
    if (!AUTH_CONFIG.ENABLE_AUTH && confirm) {
      console.log('🔧 Auth disabled - presetting OTP code');
      setCode('123456');
    }
  }, [confirm]);

  // Mock code confirmation
  async function confirmCode() {
    if (!confirm) return;
    
    try {
      setLoading(true);
      
      if (!AUTH_CONFIG.ENABLE_AUTH) {
        // Mock delay for auth disabled mode
        await new Promise(resolve => setTimeout(resolve, 600));
        console.log('🔧 Auth disabled - proceeding to business onboarding');
        console.log('📍 Current navigation state:', navigation.getState?.());
        try {
          navigation.navigate('BusinessType', { userId: 'test-user-id' });
        } catch (navError) {
          console.error('❌ Navigation error:', navError);
          // Fallback: use replace instead
          navigation.replace('BusinessType', { userId: 'test-user-id' });
        }
      } else {
        // Real Firebase OTP verification would go here
        await new Promise(resolve => setTimeout(resolve, 800));
        completeOnboarding();
        Alert.alert('Success', 'Phone number verified successfully!');
      }
    } catch (error: any) {
      console.error('Code verification error:', error);
      Alert.alert('Error', 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (cleaned && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return cleaned;
  };

  // Handle Google Sign-In (Disabled)
  async function handleGoogleSignIn() {
    Alert.alert('Google Sign-In Disabled', 'Google Sign-In is disabled in development mode');
  }

  if (!confirm) {
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
                onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                placeholder="+1 (555) 123-4567"
                style={styles.input}
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!loading}
              />
              <Text style={styles.helperText}>
                Enter your phone number including country code
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!phone.startsWith('+') || phone.length < 10 || loading) && styles.buttonDisabled
              ]}
              onPress={() => handleSignInWithPhoneNumber(phone)}
              disabled={!phone.startsWith('+') || phone.length < 10 || loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </Text>
            </TouchableOpacity>

            {AUTH_CONFIG.ENABLE_AUTH && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[styles.googleButton, loading && styles.buttonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Icon name="chrome" size={20} color="#4285F4" />
                  <Text style={styles.googleButtonText}>
                    {loading ? 'Signing in...' : 'Continue with Google'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setConfirm(false)} style={styles.backButton}>
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
              value={code}
              onChangeText={setCode}
              placeholder="123456"
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

          <TouchableOpacity
            style={[
              styles.button,
              (code.length < 4 || loading) && styles.buttonDisabled
            ]}
            onPress={confirmCode}
            disabled={code.length < 4 || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setConfirm(false)}
          >
            <Text style={styles.linkButtonText}>Didn't receive code? Try again</Text>
          </TouchableOpacity>
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
    marginBottom: Spacing.XL,
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
    fontSize: 16,
    color: Colors.text,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    color: '#777777',
    marginTop: Spacing.SM,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.XL,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    fontSize: 14,
    color: '#A6A6A6',
    marginHorizontal: Spacing.MD,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.LG,
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.XL,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.SM,
  },
});

export default PhoneAuthScreen;
