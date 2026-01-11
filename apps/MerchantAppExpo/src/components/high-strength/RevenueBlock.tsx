/**
 * RevenueBlock Component
 * 
 * Displays "Today's Earnings" with massive Calculator-style font.
 * Shows revenue in Salex Green for maximum visibility.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/config';
import { CalculatorText } from './CalculatorText';

export interface RevenueBlockProps {
  /** Today's total revenue in rupees */
  todayRevenue: number;
  /** Number of bookings completed today */
  todayBookings?: number;
  /** Whether to animate the revenue number */
  animated?: boolean;
  /** Callback when block is tapped */
  onPress?: () => void;
  /** Test ID for testing */
  testID?: string;
}

export const RevenueBlock: React.FC<RevenueBlockProps> = ({
  todayRevenue,
  todayBookings = 0,
  animated = true,
  onPress,
  testID,
}) => {
  // Ensure todayRevenue is always a valid number
  const safeRevenue = typeof todayRevenue === 'number' && !isNaN(todayRevenue) ? todayRevenue : 0;
  const safeBookings = typeof todayBookings === 'number' && !isNaN(todayBookings) ? todayBookings : 0;

  const content = (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="trending-up" size={20} color={Colors.PRIMARY} />
          <Text style={styles.title}>TODAY'S EARNINGS</Text>
        </View>
        {onPress && (
          <Icon name="chevron-right" size={20} color={Colors.TEXT_TERTIARY} />
        )}
      </View>

      <View style={styles.revenueContainer}>
        <CalculatorText
          value={safeRevenue}
          prefix="₹"
          size="lg"
          color={Colors.PRIMARY}
          animated={animated}
          testID={`${testID}-amount`}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Icon name="calendar" size={14} color={Colors.TEXT_SECONDARY} />
          <Text style={styles.statText}>
            {safeBookings} booking{safeBookings !== 1 ? 's' : ''} today
          </Text>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    borderWidth: 1,
    borderColor: Colors.PRIMARY + '30',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  title: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '600',
    letterSpacing: 1,
  },
  revenueContainer: {
    alignItems: 'flex-start',
    marginVertical: Spacing.SM,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.SM,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  statText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
});

export default RevenueBlock;
