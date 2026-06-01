/**
 * SubscriptionCard Component
 * 
 * Displays current subscription plan, status, and billing info.
 */

import React from 'react';
import type { ComponentProps } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';

type FeatherIconName = ComponentProps<typeof Icon>['name'];

export interface SubscriptionInfo {
  plan: 'BASIC' | 'PRO' | 'CUSTOM';
  status: 'TRIAL' | 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'CANCELLED';
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  daysRemaining?: number;
}

interface SubscriptionCardProps {
  subscription: SubscriptionInfo;
  onUpgrade?: () => void;
}

const PLAN_DETAILS: Record<SubscriptionInfo['plan'], {
  name: string;
  icon: FeatherIconName;
  color: string;
  features: string[];
}> = {
  BASIC: {
    name: 'Basic',
    icon: 'box',
    color: Colors.TEXT_SECONDARY,
    features: ['Walk-in bookings', 'Resource management', 'Staff management'],
  },
  PRO: {
    name: 'Pro',
    icon: 'star',
    color: Colors.SALEX_GREEN,
    features: ['WhatsApp booking', 'Customer history', 'Advanced analytics'],
  },
  CUSTOM: {
    name: 'Custom',
    icon: 'award',
    color: '#FFD700',
    features: ['Own WhatsApp number', 'API access', 'Custom branding'],
  },
};

const STATUS_LABELS = {
  TRIAL: { label: 'Trial', color: Colors.INFO },
  ACTIVE: { label: 'Active', color: Colors.SUCCESS },
  GRACE: { label: 'Grace Period', color: Colors.WARNING },
  EXPIRED: { label: 'Expired', color: Colors.ERROR },
  CANCELLED: { label: 'Cancelled', color: Colors.TEXT_TERTIARY },
};

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onUpgrade,
}) => {
  const planInfo = PLAN_DETAILS[subscription.plan];
  const statusInfo = STATUS_LABELS[subscription.status];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Plan Header */}
      <View style={styles.header}>
        <View style={[styles.planIcon, { backgroundColor: planInfo.color + '20' }]}>
          <Icon name={planInfo.icon} size={24} color={planInfo.color} />
        </View>
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{planInfo.name} Plan</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        {subscription.plan !== 'CUSTOM' && onUpgrade && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeText}>Upgrade</Text>
            <Icon name="arrow-up-right" size={14} color={Colors.SALEX_GREEN} />
          </TouchableOpacity>
        )}
      </View>

      {/* Billing Info */}
      <View style={styles.billingSection}>
        {subscription.status === 'TRIAL' && subscription.trialEndsAt && (
          <View style={styles.billingRow}>
            <Icon name="clock" size={16} color={Colors.TEXT_SECONDARY} />
            <Text style={styles.billingLabel}>Trial ends</Text>
            <Text style={styles.billingValue}>{formatDate(subscription.trialEndsAt)}</Text>
          </View>
        )}
        
        {subscription.status === 'ACTIVE' && subscription.currentPeriodEnd && (
          <View style={styles.billingRow}>
            <Icon name="calendar" size={16} color={Colors.TEXT_SECONDARY} />
            <Text style={styles.billingLabel}>Next billing</Text>
            <Text style={styles.billingValue}>{formatDate(subscription.currentPeriodEnd)}</Text>
          </View>
        )}

        {subscription.daysRemaining !== undefined && subscription.daysRemaining <= 7 && (
          <View style={styles.billingRow}>
            <Icon name="alert-circle" size={16} color={Colors.WARNING} />
            <Text style={[styles.billingLabel, { color: Colors.WARNING }]}>
              {subscription.daysRemaining} days remaining
            </Text>
          </View>
        )}
      </View>

      {/* Features Preview */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>Included Features</Text>
        <View style={styles.featuresList}>
          {planInfo.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Icon name="check" size={14} color={Colors.SALEX_GREEN} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.MD,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    ...Typography.H3,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: BorderRadius.SM,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.XS,
  },
  statusText: {
    ...Typography.Caption,
    fontWeight: '600',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.SALEX_GREEN + '15',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    gap: 4,
  },
  upgradeText: {
    ...Typography.Body2,
    color: Colors.SALEX_GREEN,
    fontWeight: '600',
  },
  billingSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
    paddingTop: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  billingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  billingLabel: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginLeft: Spacing.SM,
    flex: 1,
  },
  billingValue: {
    ...Typography.Body2,
    color: Colors.TEXT,
    fontWeight: '600',
  },
  featuresSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
    paddingTop: Spacing.MD,
  },
  featuresTitle: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.SM,
  },
  featuresList: {
    gap: Spacing.XS,
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
});

export default SubscriptionCard;
