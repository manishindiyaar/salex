/**
 * ExpiredAlert Component
 * 
 * Shows subscription expired alert with contact information.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';

interface ExpiredAlertProps {
  onContactSupport?: () => void;
}

export const ExpiredAlert: React.FC<ExpiredAlertProps> = ({
  onContactSupport,
}) => {
  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      Linking.openURL('https://wa.me/919876543210?text=Hi, my subscription has expired and I need help');
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:+919876543210');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="x-circle" size={32} color={Colors.ERROR} />
      </View>

      <Text style={styles.title}>Subscription Expired</Text>
      <Text style={styles.description}>
        Your subscription has expired. Some features are now limited. Please renew to continue using all features.
      </Text>

      <View style={styles.limitedFeatures}>
        <Text style={styles.limitedTitle}>Limited Access:</Text>
        <View style={styles.limitedItem}>
          <Icon name="x" size={14} color={Colors.ERROR} />
          <Text style={styles.limitedText}>WhatsApp bookings disabled</Text>
        </View>
        <View style={styles.limitedItem}>
          <Icon name="x" size={14} color={Colors.ERROR} />
          <Text style={styles.limitedText}>New bookings restricted</Text>
        </View>
        <View style={styles.limitedItem}>
          <Icon name="check" size={14} color={Colors.SUCCESS} />
          <Text style={styles.limitedText}>View existing data</Text>
        </View>
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Contact us to renew:</Text>
        
        <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
          <Icon name="message-circle" size={18} color={Colors.TEXT} />
          <Text style={styles.contactButtonText}>WhatsApp Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Icon name="phone" size={18} color={Colors.SALEX_GREEN} />
          <Text style={styles.callButtonText}>Call +91 98765 43210</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.ERROR + '10',
    borderRadius: BorderRadius.LG,
    padding: Spacing.XL,
    borderWidth: 1,
    borderColor: Colors.ERROR + '30',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.ERROR + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  title: {
    ...Typography.H3,
    color: Colors.ERROR,
    marginBottom: Spacing.SM,
  },
  description: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.LG,
  },
  limitedFeatures: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    width: '100%',
    marginBottom: Spacing.LG,
  },
  limitedTitle: {
    ...Typography.Body2,
    color: Colors.TEXT,
    fontWeight: '600',
    marginBottom: Spacing.SM,
  },
  limitedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  limitedText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  contactSection: {
    width: '100%',
  },
  contactTitle: {
    ...Typography.Body2,
    color: Colors.TEXT,
    fontWeight: '600',
    marginBottom: Spacing.MD,
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.SALEX_GREEN,
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    gap: Spacing.SM,
    marginBottom: Spacing.SM,
  },
  contactButtonText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.SURFACE,
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: Colors.SALEX_GREEN,
    gap: Spacing.SM,
  },
  callButtonText: {
    ...Typography.Body1,
    color: Colors.SALEX_GREEN,
    fontWeight: '600',
  },
});

export default ExpiredAlert;
