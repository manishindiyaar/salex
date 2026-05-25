import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';

import { Button, GradientView } from '@components/index';
import { Colors, Spacing, Typography, BorderRadius, OnboardingConfig } from '../../theme/config';
import { useOnboardingStore } from '@store/onboardingStore';
import { authService } from '@services/authService';

interface OtpVerificationScreenProps {
  route: {
    params: {
      phoneNumber: string;
    };
  };
  navigation: {
    navigate: (screen: string, params?: any) => void;
    replace: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({ route, navigation }) => {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(OnboardingConfig.OTP_TIMEOUT_SECONDS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { updateAuthStep, setUserPhone } = useOnboardingStore();
  const inputRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (otp.every(digit => digit !== '')) {
      handleVerifyOTP();
    }
  }, [otp]);

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput && nextInput.focus) {
        nextInput.focus();
      }
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { user } = await authService.verifyOtp(phoneNumber, otpCode);
      updateAuthStep('auth_complete');
      setUserPhone(phoneNumber); // Store phone for business creation

      // Salon build:  go straight to identity
      navigation.replace('BusinessIdentity', { businessId: user.id });
    } catch (error) {
      setError('Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setError('');

    try {
      await authService.requestOtp(phoneNumber);
      setCountdown(OnboardingConfig.OTP_TIMEOUT_SECONDS);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your number.');
    } catch (error) {
      setError('Failed to resend OTP. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.BACKGROUND} />
      <GradientView variant="dark" style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color={Colors.TEXT} />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Icon name="shield-check" size={32} color={Colors.PRIMARY} />
            </View>

            <Text style={styles.title}>Verify your number</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={styles.phoneHighlight}>{phoneNumber}</Text>
            </Text>
          </View>

          {/* OTP Input Section */}
          <View style={styles.content}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                    error && styles.otpInputError,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOTPChange(value, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  placeholder="●"
                  placeholderTextColor={Colors.TEXT_TERTIARY}
                  selectionColor={Colors.PRIMARY}
                />
              ))}
            </View>

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color={Colors.ERROR} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Icon name="info" size={16} color={Colors.PRIMARY} />
              <Text style={styles.helpText}>
                For testing: Any 6-digit code will work
              </Text>
            </View>

            {/* Resend Button */}
            <TouchableOpacity
              style={[
                styles.resendButton,
                countdown > 0 && styles.resendButtonDisabled,
              ]}
              onPress={handleResendOTP}
              disabled={countdown > 0 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.PRIMARY} size="small" />
              ) : (
                <>
                  <Icon
                    name="rotate-cw"
                    size={16}
                    color={countdown > 0 ? Colors.TEXT_TERTIARY : Colors.PRIMARY}
                  />
                  <Text style={[
                    styles.resendButtonText,
                    countdown > 0 && styles.resendButtonTextDisabled,
                  ]}>
                    {countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend OTP'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom Action */}
          <View style={styles.footer}>
            <Button
              title="Verify & Continue"
              onPress={handleVerifyOTP}
              loading={isLoading}
              disabled={otp.join('').length !== 6}
              size="large"
              fullWidth
            />
          </View>
        </KeyboardAvoidingView>
      </GradientView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  gradient: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.XL,
    paddingBottom: Spacing.LG,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.XL,
    left: Spacing.LG,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.SM,
    backgroundColor: Colors.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.ROUND,
    backgroundColor: Colors.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.XL,
    marginBottom: Spacing.LG,
  },
  title: {
    ...Typography.H2,
    color: Colors.TEXT,
    textAlign: 'center',
    marginBottom: Spacing.SM,
  },
  subtitle: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneHighlight: {
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
    justifyContent: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.XL,
    paddingHorizontal: Spacing.SM,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: Colors.BORDER,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.MD,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.TEXT,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: Colors.PRIMARY,
    backgroundColor: Colors.PRIMARY + '10',
  },
  otpInputError: {
    borderColor: Colors.ERROR,
    backgroundColor: Colors.ERROR + '10',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ERROR + '15',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    marginTop: Spacing.MD,
  },
  errorText: {
    ...Typography.Body2,
    color: Colors.ERROR,
    marginLeft: Spacing.XS,
    flex: 1,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY + '15',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    marginTop: Spacing.LG,
  },
  helpText: {
    ...Typography.Body2,
    color: Colors.PRIMARY,
    marginLeft: Spacing.XS,
    flex: 1,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.SURFACE,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.SM,
    marginTop: Spacing.XL,
    alignSelf: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    ...Typography.Body1,
    color: Colors.PRIMARY,
    marginLeft: Spacing.XS,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: Colors.TEXT_TERTIARY,
  },
  footer: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XL,
  },
});

export default OtpVerificationScreen;