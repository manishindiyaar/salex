/**
 * GatedChaiBreakToggle Component
 * 
 * Wrapper around ChaiBreakToggle that gates WhatsApp booking features for BASIC plan users.
 * Task 20.3: Gate WhatsApp booking features for BASIC plan
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { ChaiBreakToggle, ChaiBreakToggleProps } from './ChaiBreakToggle';
import { UpgradePrompt } from '../subscription/UpgradePrompt';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useBusinessStore } from '../../store/businessStore';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/config';

export interface GatedChaiBreakToggleProps extends ChaiBreakToggleProps {
  /** Override to show upgrade prompt instead of toggle */
  showUpgradePrompt?: boolean;
}

export const GatedChaiBreakToggle: React.FC<GatedChaiBreakToggleProps> = ({
  showUpgradePrompt = false,
  ...toggleProps
}) => {
  const { business } = useBusinessStore();
  const featureAccess = useFeatureAccess('whatsapp_booking');
  const [showUpgrade, setShowUpgrade] = useState(false);

  // If feature is allowed or still loading, show normal toggle
  if (featureAccess.loading || featureAccess.allowed) {
    return <ChaiBreakToggle {...toggleProps} />;
  }

  // If explicitly requested to show upgrade prompt or feature is not allowed
  if (showUpgradePrompt || !featureAccess.allowed) {
    return (
      <View style={styles.container}>
        <View style={styles.gatedContainer}>
          <View style={styles.iconContainer}>
            <Icon name="lock" size={24} color={Colors.TEXT_SECONDARY} />
          </View>
          
          <Text style={styles.gatedTitle}>WhatsApp Booking</Text>
          <Text style={styles.gatedSubtitle}>
            Upgrade to Pro to accept WhatsApp bookings
          </Text>
          
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setShowUpgrade(true)}
          >
            <Icon name="star" size={16} color={Colors.SALEX_GREEN} />
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        </View>

        <UpgradePrompt
          visible={showUpgrade}
          featureName="WhatsApp Booking"
          currentPlan={(business as any)?.subscription?.plan || 'BASIC'}
          suggestedPlan={featureAccess.suggestedPlan === 'BASIC' ? 'PRO' : featureAccess.suggestedPlan || 'PRO'}
          onClose={() => setShowUpgrade(false)}
        />
      </View>
    );
  }

  // Fallback: show disabled toggle
  return (
    <ChaiBreakToggle
      {...toggleProps}
      disabled={true}
      isActive={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.LG,
  },
  gatedContainer: {
    alignItems: 'center',
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.XL,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    borderStyle: 'dashed',
    minWidth: 200,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.TEXT_SECONDARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  gatedTitle: {
    ...Typography.H4,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  gatedSubtitle: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.SALEX_GREEN + '20',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    gap: Spacing.SM,
  },
  upgradeButtonText: {
    ...Typography.Body2,
    color: Colors.SALEX_GREEN,
    fontWeight: '600',
  },
});

export default GatedChaiBreakToggle;