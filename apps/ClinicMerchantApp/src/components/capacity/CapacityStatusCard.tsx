/**
 * CapacityStatusCard Component
 * 
 * Displays current booking capacity status.
 * Shows warnings when resources and staff counts don't match.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, IconButton } from 'react-native-paper';
import { useResourceStore } from '../../store/resourceStore';
import { useStaffStore } from '../../store/staffStore';
import { Colors } from '../../theme/config';

interface CapacityStatusCardProps {
  businessId: string;
  onManagePress?: () => void;
}

export const CapacityStatusCard: React.FC<CapacityStatusCardProps> = ({
  businessId,
  onManagePress,
}) => {
  const { items: resources, listByBusiness: loadResources } = useResourceStore();
  const { items: staff, listByBusiness: loadStaff } = useStaffStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadResources(businessId),
        loadStaff(businessId),
      ]);
      setLoading(false);
    };
    loadData();
  }, [businessId]);

  const activeResources = resources.filter((r) => r.isActive);
  const activeStaff = staff.filter((s) => s.isActive);
  const capacity = Math.min(activeResources.length, activeStaff.length);
  const hasCapacityMismatch = activeResources.length !== activeStaff.length;
  const hasZeroCapacity = capacity === 0;

  if (loading) {
    return null;
  }

  // Don't show if capacity is good and no mismatch
  if (!hasZeroCapacity && !hasCapacityMismatch) {
    return null;
  }

  return (
    <Card style={[styles.card, hasZeroCapacity && styles.errorCard]}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium" style={styles.title}>
              {hasZeroCapacity ? '⚠️ No Capacity' : '⚠️ Capacity Warning'}
            </Text>
          </View>
          {onManagePress && (
            <IconButton
              icon="cog"
              size={20}
              onPress={onManagePress}
            />
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Resources
            </Text>
            <Text variant="headlineSmall" style={styles.statValue}>
              {activeResources.length}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Staff
            </Text>
            <Text variant="headlineSmall" style={styles.statValue}>
              {activeStaff.length}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Capacity
            </Text>
            <Text
              variant="headlineSmall"
              style={[
                styles.statValue,
                hasZeroCapacity ? styles.errorText : styles.warningText,
              ]}
            >
              {capacity}
            </Text>
          </View>
        </View>

        {hasZeroCapacity ? (
          <Text variant="bodySmall" style={styles.message}>
            You need at least 1 resource and 1 staff member to accept bookings.
          </Text>
        ) : hasCapacityMismatch ? (
          <Text variant="bodySmall" style={styles.message}>
            Your capacity is limited by the lower count. Add more{' '}
            {activeResources.length < activeStaff.length ? 'resources' : 'staff'} to increase capacity.
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.WARNING,
    backgroundColor: '#FFF3CD',
  },
  errorCard: {
    borderColor: Colors.ERROR,
    backgroundColor: '#FFE5E5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: Colors.TEXT_SECONDARY,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '700',
  },
  warningText: {
    color: Colors.WARNING,
  },
  errorText: {
    color: Colors.ERROR,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.BORDER,
    marginHorizontal: 8,
  },
  message: {
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 8,
  },
});
