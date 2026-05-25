import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { PremiumScreen } from '../../components/premium/PremiumScreen';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { BrandMark } from '../../components/premium/BrandMark';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/premium';
import { useOnboardingStore } from '../../store/onboardingStore';
import { authService } from '../../services/authService';

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
  const [countdown, setCountdown] = useState(60);
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

  // Automatically submit once all 6 digits are typed
  useEffect(() => {
    if (otp.every(digit => digit !== '')) {
      handleVerifyOTP();
    }
  }, [otp]);

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    // Keep only numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length > 1) {
      // Handle paste
      const digits = numericValue.slice(0, 6).split('');
      const pastedOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        if (digits[i]) pastedOtp[i] = digits[i];
      }
      setOtp(pastedOtp);
      setError('');
      // Focus last input
      const lastIndex = Math.min(digits.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    newOtp[index] = numericValue;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Clear previous box and focus it
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
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
      const result = await authService.verifyOtp(phoneNumber, otpCode);
      if (result.success && result.user) {
        updateAuthStep('auth_complete');
        setUserPhone(phoneNumber); // Store phone for business creation
        navigation.replace('BusinessIdentity', { businessId: result.user.id });
      } else {
        setError(result.message || 'Invalid verification code');
      }
    } catch (err) {
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
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend OTP. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <PremiumScreen showBackButton onBackPress={() => navigation.goBack()} scrollable>
      <View style={styles.content}>
        {/* Top Logo */}
        <View style={styles.brandContainer}>
          <BrandMark size={48} />
        </View>

        {/* Editorial displays */}
        <Text style={[styles.title, Typography.heroHeadline]}>
          Enter the code
        </Text>
        
        <Text style={[styles.subtitle, Typography.body]}>
          We sent a 6-digit verification code to your mobile number{' '}
          <Text style={{ color: Colors.primaryInk, fontFamily: 'Inter-Medium' }}>
            {phoneNumber}
          </Text>
        </Text>

        {/* OTP boxes grid */}
        <View style={styles.otpGrid}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpCell,
                Typography.inputText,
                {
                  borderColor: error ? Colors.error : digit ? Colors.primaryInk : Colors.mutedBorder,
                  borderWidth: digit || error ? 1.5 : 1,
                  backgroundColor: digit ? Colors.selectedSurface : Colors.white,
                },
              ]}
              value={digit}
              onChangeText={(val) => handleOTPChange(val, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={2} // Allow 2 to handle pastes
              textAlign="center"
              editable={!isLoading}
              selectTextOnFocus
              accessibilityLabel={`Digit ${index + 1}`}
            />
          ))}
        </View>

        {/* Error hint */}
        {error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={16} color={Colors.error} />
            <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {/* Resend status indicator */}
        <View style={styles.resendContainer}>
          {countdown > 0 ? (
            <Text style={[styles.resendText, Typography.caption]}>
              Resend code in {formatTime(countdown)}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
              <Text style={[styles.resendActionText, Typography.caption]}>
                Resend code
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Verify Action */}
        <View style={styles.actionContainer}>
          <PremiumButton
            title={isLoading ? 'VERIFYING...' : 'VERIFY CODE'}
            variant="filled"
            disabled={!isOtpComplete || isLoading}
            loading={isLoading}
            onPress={handleVerifyOTP}
          />
        </View>
      </View>
    </PremiumScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: Spacing.xl,
  },
  otpCell: {
    width: 46,
    height: 56,
    borderRadius: BorderRadius.sm,
    fontSize: 22,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  errorText: {
    ...Typography.caption,
  },
  resendContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  resendText: {
    color: Colors.secondaryText,
  },
  resendActionText: {
    color: Colors.primaryInk,
    fontFamily: 'Inter-Medium',
    textDecorationLine: 'underline',
  },
  actionContainer: {
    width: '100%',
    marginTop: Spacing.xl,
  },
});

export default OtpVerificationScreen;