import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, ScrollView } from 'react-native';

const HARD_CODED_PHONE = '+919801441675';

const TestOtpScreen: React.FC = () => {
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Auth Disabled - This screen is not functional in development mode');

  // Step 1: Send OTP (Disabled)
  const handleSendOtp = async () => {
    Alert.alert('Auth Disabled', 'Firebase authentication is disabled in development mode');
    setStatus('Auth Disabled - Firebase OTP is not functional in development mode');
  };

  // Step 2: Verify OTP (Disabled)
  const handleVerifyOtp = async () => {
    Alert.alert('Auth Disabled', 'Firebase authentication is disabled in development mode');
  };

  const handleCopyToken = async () => {
    Alert.alert('Auth Disabled', 'Token functionality is disabled in development mode');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quick OTP Test (DISABLED)</Text>
      <Text style={styles.subtitle}>Authentication is disabled in development mode</Text>

      <TouchableOpacity style={[styles.button, styles.buttonDisabled]} onPress={handleSendOtp} disabled={true}>
        <Text style={styles.buttonText}>Send OTP (Disabled)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonDisabled]}
        onPress={handleVerifyOtp}
        disabled={true}
      >
        <Text style={styles.buttonText}>Verify Code (Disabled)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.secondaryButton, styles.buttonDisabled]} onPress={handleCopyToken} disabled={true}>
        <Text style={styles.secondaryButtonText}>Copy ID Token (Disabled)</Text>
      </TouchableOpacity>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      {lastToken ? (
        <View style={styles.tokenBox}>
          <Text style={styles.tokenLabel}>Last ID Token (truncated)</Text>
          <Text style={styles.tokenText}>{lastToken.slice(0, 32)}...</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0A84FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#E5E5EA',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  statusBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
  },
  statusLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  statusText: {
    color: '#333',
  },
  tokenBox: {
    marginTop: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
  },
  tokenLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  tokenText: {
    color: '#333',
  },
});

export default TestOtpScreen;
