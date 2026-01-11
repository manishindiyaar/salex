/**
 * GraceBanner Component
 * 
 * Shows grace period warning with payment instructions.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';

interface GraceBannerProps {
  daysRemaining: number;
  onContactSupport?: () => void;
}

export const GraceBanner: React.FC<GraceBannerProps> = ({
  daysRemaining,
  onContactSupport,
}) => {
  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      // Default: open WhatsApp support
      Linking.openURL('https://wa.me/919876543210?text=Hi, I need help with my subscription payment');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Icon name="alert-triangle" size={24} color={Colors.WARNING} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Payment Required</Text>
          <Text style={styles.subtitle}>
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} grace period remaining
          </Text>
        </View>
      </View>

      <Text style={styles.description}>
        Your subscription payment is overdue. Please make a payment to continue using all features.
      </Text>

      <View style={styles.paymentInfo}>
        <Text style={styles.paymentTitle}>Payment Options:</Text>
        <View style={styles.paymentOption}>
          <Icon name="smartphone" size={16} color={Colors.TEXT_SECONDARY} />
          <Text style={styles.paymentText}>UPI: salex@upi</Text>
        </View>
        <View style={styles.paymentOption}>
          <Icon name="credit-card" size={16} color={Colors.TEXT_SECONDARY} />
          <Text style={styles.paymentText}>Contact support for other options</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
        <Icon name="message-circle" size={18} color={Colors.TEXT} />
        <Text style={styles.supportText}>Contact Support</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WARNING + '10',
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    borderWidth: 1,
    borderColor: Colors.WARNING + '30',
    marginBottom: Spacing.MD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.WARNING + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.H4,
    color: Colors.WARNING,
  },
  subtitle: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
    marginTop: 2,
  },
  description: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.MD,
    lineHeight: 20,
  },
  paymentInfo: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  paymentTitle: {
    ...Typography.Body2,
    color: Colors.TEXT,
    fontWeight: '600',
    marginBottom: Spacing.SM,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  paymentText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.WARNING,
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    gap: Spacing.SM,
  },
  supportText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
  },
});

export default GraceBanner;
