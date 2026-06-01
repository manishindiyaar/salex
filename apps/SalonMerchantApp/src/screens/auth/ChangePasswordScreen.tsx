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
import { useOnboardingStore } from '../../store/onboardingStore';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type ChangePasswordScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'ChangePassword'>;

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ route, navigation }) => {
  const { currentPassword } = route.params;
  const { setUserPhone, updateBusinessDraft } = useOnboardingStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authService.changePassword(currentPassword, newPassword);
      if (result.success) {
        const business = await getBusinessMe();
        setUserPhone(business.phoneNumber);
        updateBusinessDraft({
          businessId: business.id,
          name: business.name,
          phone: business.phoneNumber,
        });
        navigation.replace('BusinessIdentity', { businessId: business.id });
      } else {
        setError(result.message || 'Failed to change password.');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setError('Connection failure. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || newPassword.length < 8 || confirmPassword.length < 8;

  return (
    <PremiumScreen scrollable>
      <View style={styles.content}>
        <View style={styles.brandContainer}>
          <BrandMark size={48} />
        </View>

        <Text style={[styles.title, Typography.heroHeadline]}>
          Create a new password
        </Text>

        <Text style={[styles.subtitle, Typography.body]}>
          This keeps the temporary admin password from being reused.
        </Text>

        <View style={styles.formContainer}>
          <FloatingLabelInput
            label="New Password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setError(null);
            }}
            placeholder="Minimum 8 characters"
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
            error={error || undefined}
          />
          <FloatingLabelInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError(null);
            }}
            placeholder="Re-enter new password"
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View style={styles.actionContainer}>
          <PremiumButton
            title={loading ? 'SAVING...' : 'SAVE PASSWORD'}
            variant="filled"
            disabled={disabled}
            loading={loading}
            onPress={handleChangePassword}
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
  },
});

export default ChangePasswordScreen;
