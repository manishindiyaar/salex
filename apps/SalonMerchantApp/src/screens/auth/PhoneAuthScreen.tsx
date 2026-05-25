import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BrandMark } from '../../components/premium/BrandMark';
import { PremiumScreen } from '../../components/premium/PremiumScreen';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { FloatingLabelInput } from '../../components/premium/FloatingLabelInput';
import { Colors, Spacing, Typography } from '../../theme/premium';
import { authService } from '../../services/authService';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type PhoneAuthScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'PhoneAuth'>;

const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize and clean Indian phone number to E.164 (+91xxxxxxxxxx)
  const getFullPhoneNumber = () => {
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return `+91${cleaned}`;
  };

  const validatePhone = (num: string) => {
    const cleaned = num.replace(/[^\d]/g, '');
    return cleaned.length === 10;
  };

  async function handleSendOtp() {
    const normalizedPhone = getFullPhoneNumber();
    
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await authService.requestOtp(normalizedPhone);
      
      if (result.success) {
        if (__DEV__) {
          console.log('💡 Dev mode: Use OTP "123456"');
        }
        // Navigate to separate OtpVerification Screen
        navigation.navigate('OtpVerification', { phoneNumber: normalizedPhone });
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('OTP request error:', err);
      setError('Connection failure. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  const isButtonDisabled = !validatePhone(phone) || loading;

  return (
    <PremiumScreen showBackButton onBackPress={() => navigation.goBack()} scrollable>
      <View style={styles.content}>
        {/* Brand pause/mark */}
        <View style={styles.brandContainer}>
          <BrandMark size={48} />
        </View>

        {/* Editorial displays */}
        <Text style={[styles.title, Typography.heroHeadline]}>
          Let’s get started
        </Text>
        
        <Text style={[styles.subtitle, Typography.body]}>
          Enter your phone number to sign in or create your salon merchant account.
        </Text>

        {/* Input box */}
        <View style={styles.formContainer}>
          <FloatingLabelInput
            label="Phone Number"
            prefix="+91 "
            value={phone}
            onChangeText={(text) => {
              setPhone(text.replace(/[^\d]/g, '').slice(0, 10));
              setError(null);
            }}
            placeholder="98765 43210"
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
            error={error || undefined}
          />
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <PremiumButton
            title={loading ? 'SENDING...' : 'SEND OTP'}
            variant="filled"
            disabled={isButtonDisabled}
            loading={loading}
            onPress={handleSendOtp}
          />
          
          {__DEV__ && (
            <Text style={[styles.devHint, Typography.caption]}>
              💡 Dev mode: Use magic OTP "123456"
            </Text>
          )}
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
  formContainer: {
    width: '100%',
    marginVertical: Spacing.xl,
  },
  actionContainer: {
    width: '100%',
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  devHint: {
    marginTop: Spacing.lg,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default PhoneAuthScreen;
