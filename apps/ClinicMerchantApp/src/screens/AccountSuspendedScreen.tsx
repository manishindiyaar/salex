import React from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/config';

interface AccountSuspendedScreenProps {
  businessName?: string;
}

export const AccountSuspendedScreen: React.FC<AccountSuspendedScreenProps> = ({ 
  businessName = 'Your Business' 
}) => {
  const handleContactAdmin = async () => {
    const adminPhone = '+919876543210'; // Replace with actual admin WhatsApp number
    const message = `Hello, my business account "${businessName}" has been suspended. Please help me understand why and how to reactivate it.`;
    const whatsappUrl = `whatsapp://send?phone=${adminPhone}&text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          'WhatsApp Not Available',
          `Please contact admin at ${adminPhone} or email support@salex.com`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Please contact admin at ${adminPhone} or email support@salex.com`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠️</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Account Suspended</Text>

        {/* Message */}
        <Text style={styles.message}>
          Your business account "{businessName}" has been temporarily suspended.
        </Text>

        <Text style={styles.submessage}>
          This may be due to policy violations, payment issues, or administrative review. 
          Please contact our support team for assistance.
        </Text>

        {/* Contact Button */}
        <Button
          mode="contained"
          onPress={handleContactAdmin}
          style={styles.contactButton}
          contentStyle={styles.contactButtonContent}
          labelStyle={styles.contactButtonLabel}
        >
          Contact Admin via WhatsApp
        </Button>

        {/* Additional Info */}
        <Text style={styles.additionalInfo}>
          Your account data is safe and will be restored once the issue is resolved.
        </Text>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  icon: {
    fontSize: 80,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  submessage: {
    fontSize: 16,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  contactButton: {
    backgroundColor: Colors.primary,
    marginBottom: 24,
    borderRadius: 10,
  },
  contactButtonContent: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  contactButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
  additionalInfo: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});