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
import { useAuth } from '../../context/AuthContext';
import { useOnboardingStore } from '../../store/onboardingStore';

interface PhoneAuthScreenProps {
  navigation: {
    goBack: () => void;
    replace: (screen: string, params?: any) => void;
  };
}

const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({ navigation }) => {
  const { completeOnboarding } = useAuth();
  const { setUserPhone, updateBusinessDraft } = useOnboardingStore();
  const [phone, setPhone] = useState('+91');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizePhone = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '');
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  };

  const isValidPhone = /^\+\d{10,15}$/.test(phone.trim());

  async function handleLogin() {
    const normalizedPhone = normalizePhone(phone);

    if (!/^\+\d{10,15}$/.test(normalizedPhone)) {
      setError('Enter phone number with country code, e.g. +919876543210');
      return;
    }

    if (!password.trim()) {
      setError('Enter your password');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await authService.loginWithPassword(normalizedPhone, password);
      if (result.success && result.user) {
        setUserPhone(normalizedPhone);
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
    } catch (err) {
      console.error('Password login error:', err);
      setError('Connection failure. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.iconContainer}>
            <Icon name="lock" size={32} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Sign in to your clinic</Text>
          <Text style={styles.subtitle}>
            Use your phone number and password.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              value={phone}
              onChangeText={(text) => {
                setPhone(normalizePhone(text));
                setError(null);
              }}
              placeholder="+91 98765 43210"
              placeholderTextColor="#666"
              style={styles.input}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              placeholder="Password"
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
            style={[styles.button, (!isValidPhone || !password.trim() || loading) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!isValidPhone || !password.trim() || loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
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
    marginBottom: Spacing.LG,
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

export default PhoneAuthScreen;
