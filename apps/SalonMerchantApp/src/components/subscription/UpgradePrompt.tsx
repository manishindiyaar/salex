/**
 * UpgradePrompt Component
 * 
 * Displays when a feature is restricted by plan.
 * Task 20: Feature Gating
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';

interface UpgradePromptProps {
  visible: boolean;
  featureName: string;
  currentPlan: 'BASIC' | 'PRO' | 'CUSTOM';
  suggestedPlan: 'PRO' | 'CUSTOM';
  onClose: () => void;
  onUpgrade?: () => void;
}

const PLAN_COMPARISON = {
  BASIC: {
    name: 'Basic',
    price: 'Free',
    features: [
      'Walk-in bookings',
      'Resource management',
      'Staff management',
      'Basic analytics',
    ],
  },
  PRO: {
    name: 'Pro',
    price: '₹999/month',
    features: [
      'Everything in Basic',
      'WhatsApp booking',
      'Customer history',
      'Automated reminders',
      'Advanced analytics',
    ],
  },
  CUSTOM: {
    name: 'Custom',
    price: 'Contact us',
    features: [
      'Everything in Pro',
      'Own WhatsApp number',
      'Website widget',
      'Custom branding',
      'API access',
    ],
  },
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  featureName,
  currentPlan,
  suggestedPlan,
  onClose,
  onUpgrade,
}) => {
  const suggested = PLAN_COMPARISON[suggestedPlan];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="x" size={24} color={Colors.TEXT} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="lock" size={40} color={Colors.SALEX_GREEN} />
          </View>

          <Text style={styles.title}>Upgrade to Unlock</Text>
          <Text style={styles.subtitle}>
            {featureName} is available on the {suggested.name} plan
          </Text>

          {/* Plan Card */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planBadge}>
                <Icon name="star" size={16} color={Colors.SALEX_GREEN} />
                <Text style={styles.planName}>{suggested.name}</Text>
              </View>
              <Text style={styles.planPrice}>{suggested.price}</Text>
            </View>

            <View style={styles.featuresList}>
              {suggested.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Icon name="check" size={16} color={Colors.SALEX_GREEN} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Current Plan Info */}
          <View style={styles.currentPlanInfo}>
            <Text style={styles.currentPlanLabel}>
              Your current plan: <Text style={styles.currentPlanName}>{PLAN_COMPARISON[currentPlan].name}</Text>
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={onUpgrade || onClose}
          >
            <Text style={styles.upgradeButtonText}>
              {onUpgrade ? `Upgrade to ${suggested.name}` : 'Contact Support to Upgrade'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterButton} onPress={onClose}>
            <Text style={styles.laterButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.LG,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.XL,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.SALEX_GREEN + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  title: {
    ...Typography.H2,
    color: Colors.TEXT,
    marginBottom: Spacing.SM,
  },
  subtitle: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: Spacing.XL,
  },
  planCard: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.SALEX_GREEN,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.LG,
    paddingBottom: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  planName: {
    ...Typography.H3,
    color: Colors.TEXT,
  },
  planPrice: {
    ...Typography.H4,
    color: Colors.SALEX_GREEN,
  },
  featuresList: {
    gap: Spacing.SM,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  featureText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  currentPlanInfo: {
    marginTop: Spacing.LG,
  },
  currentPlanLabel: {
    ...Typography.Body2,
    color: Colors.TEXT_TERTIARY,
  },
  currentPlanName: {
    color: Colors.TEXT,
    fontWeight: '600',
  },
  footer: {
    padding: Spacing.LG,
    gap: Spacing.MD,
  },
  upgradeButton: {
    backgroundColor: Colors.SALEX_GREEN,
    paddingVertical: Spacing.LG,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  upgradeButtonText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '700',
  },
  laterButton: {
    paddingVertical: Spacing.MD,
    alignItems: 'center',
  },
  laterButtonText: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
  },
});

export default UpgradePrompt;
