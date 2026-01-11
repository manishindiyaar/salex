/**
 * TrialBanner Component
 * 
 * Shows trial days remaining with upgrade CTA.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';

interface TrialBannerProps {
  daysRemaining: number;
  onUpgrade?: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  daysRemaining,
  onUpgrade,
}) => {
  const isUrgent = daysRemaining <= 3;
  const backgroundColor = isUrgent ? Colors.WARNING + '15' : Colors.INFO + '15';
  const textColor = isUrgent ? Colors.WARNING : Colors.INFO;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: textColor + '20' }]}>
          <Icon name="clock" size={20} color={textColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: textColor }]}>
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left in trial
          </Text>
          <Text style={styles.subtitle}>
            Upgrade to Pro for WhatsApp booking
          </Text>
        </View>
      </View>
      {onUpgrade && (
        <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
          <Text style={styles.upgradeText}>Upgrade</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.MD,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.Body1,
    fontWeight: '600',
  },
  subtitle: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: Colors.SALEX_GREEN,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
  },
  upgradeText: {
    ...Typography.Body2,
    color: Colors.TEXT,
    fontWeight: '600',
  },
});

export default TrialBanner;
