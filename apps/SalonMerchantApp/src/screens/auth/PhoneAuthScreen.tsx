import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { BrandMark } from '../../components/premium/BrandMark';
import { PremiumScreen } from '../../components/premium/PremiumScreen';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { FloatingLabelInput } from '../../components/premium/FloatingLabelInput';
import { Colors, Spacing, Typography } from '../../theme/premium';
import { authService } from '../../services/authService';
import { getBusinessMe } from '../../services/businessService';
import { useAuth } from '../../context/AuthContext';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type PhoneAuthScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'PhoneAuth'>;

const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({ navigation }) => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { completeOnboarding } = useAuth();
  const { setUserPhone, updateBusinessDraft } = useOnboardingStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    clearAuth();
  }, [clearAuth]);

  const getLocalPhoneNumber = (value: string) => {
    let cleaned = value.replace(/[^\d]/g, '');
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return cleaned.slice(0, 10);
  };

  // Normalize and clean Indian phone number to E.164 (+91xxxxxxxxxx)
  const getFullPhoneNumber = () => {
    return `+91${getLocalPhoneNumber(phone)}`;
  };

  const validatePhone = (num: string) => {
    const cleaned = getLocalPhoneNumber(num);
    return cleaned.length === 10;
  };

  async function handleLogin() {
    const normalizedPhone = getFullPhoneNumber();
    
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await authService.loginWithPassword(normalizedPhone, password);
      
      if (result.success && result.user) {
        if (result.user.mustChangePassword) {
          navigation.replace('ChangePassword', { currentPassword: password });
          return;
        }

        const business = await getBusinessMe();
        setUserPhone(business.phoneNumber);
        updateBusinessDraft({
          businessId: business.id,
          name: business.name,
          phone: business.phoneNumber,
        });

        if (business.onboardingCompleted === true) {
          completeOnboarding();
        } else {
          navigation.replace('BusinessIdentity', { businessId: business.id });
        }
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Password login error:', err);
      setError('Connection failure. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  const isButtonDisabled = !validatePhone(phone) || !password.trim() || loading;

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
          Enter your phone number and password.
        </Text>

        {/* Input box */}
        <View style={styles.formContainer}>
          <FloatingLabelInput
            label="Phone Number"
            prefix="+91 "
            value={phone}
            onChangeText={(text) => {
              setPhone(getLocalPhoneNumber(text));
              setError(null);
            }}
            placeholder="98765 43210"
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
            error={error || undefined}
          />
          <FloatingLabelInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <PremiumButton
            title={loading ? 'SIGNING IN...' : 'SIGN IN'}
            variant="filled"
            disabled={isButtonDisabled}
            loading={loading}
            onPress={handleLogin}
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
  formContainer: {
    width: '100%',
    marginVertical: Spacing.xl,
  },
  actionContainer: {
    width: '100%',
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
});

export default PhoneAuthScreen;
