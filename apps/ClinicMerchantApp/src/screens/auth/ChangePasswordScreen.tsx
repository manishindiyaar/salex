import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { Colors, Spacing, BorderRadius } from '../../theme/config';
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.form}>
          <View style={styles.iconContainer}>
            <Icon name="key" size={32} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Create a new password</Text>
          <Text style={styles.subtitle}>This keeps the temporary admin password from being reused.</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setError(null);
              }}
              placeholder="Minimum 8 characters"
              placeholderTextColor="#666"
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(null);
              }}
              placeholder="Re-enter new password"
              placeholderTextColor="#666"
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, (newPassword.length < 8 || confirmPassword.length < 8 || loading) && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={newPassword.length < 8 || confirmPassword.length < 8 || loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Password'}</Text>
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
    color: Colors.muted,
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
    borderColor: Colors.BORDER,
    borderRadius: BorderRadius.LG,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    fontSize: 18,
    color: Colors.text,
    backgroundColor: Colors.surface,
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
    color: Colors.error,
    marginLeft: Spacing.SM,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.LG,
    paddingVertical: Spacing.LG,
    paddingHorizontal: Spacing.XL,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.DISABLED,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});

export default ChangePasswordScreen;
