/**
 * AccountSuspendedBanner Component
 * 
 * Prominent banner for inactive/suspended businesses.
 * Task 23: Inactive Business Handling
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';

interface AccountSuspendedBannerProps {
  onContactSupport?: () => void;
}

export const AccountSuspendedBanner: React.FC<AccountSuspendedBannerProps> = ({
  onContactSupport,
}) => {
  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      Linking.openURL('https://wa.me/919876543210?text=Hi, my business account has been suspended. Please help.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="alert-octagon" size={28} color={Colors.ERROR} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Account Suspended</Text>
        <Text style={styles.description}>
          Your business account has been temporarily suspended. New bookings are disabled.
        </Text>
      </View>

      <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
        <Icon name="message-circle" size={16} color={Colors.TEXT} />
        <Text style={styles.contactText}>Contact Support</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.ERROR,
    padding: Spacing.MD,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '700',
  },
  description: {
    ...Typography.Caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    gap: Spacing.XS,
  },
  contactText: {
    ...Typography.Caption,
    color: Colors.TEXT,
    fontWeight: '600',
  },
});

export default AccountSuspendedBanner;
