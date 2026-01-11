/**
 * ReviewStep Component
 * 
 * Final step of onboarding wizard.
 * Shows summary of configuration and completes onboarding.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { useResourceStore } from '../../store/resourceStore';
import { useStaffStore } from '../../store/staffStore';
import { Colors } from '../../theme/config';
import apiClient from '../../services/apiClient';

interface ReviewStepProps {
  businessId: string;
  onComplete: () => void;
  onBack: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  businessId,
  onComplete,
  onBack,
}) => {
  const { items: resources, listByBusiness: loadResources } = useResourceStore();
  const { items: staff, listByBusiness: loadStaff } = useStaffStore();
  const [completing, setCompleting] = useState(false);
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

  const handleComplete = async () => {
    try {
      setCompleting(true);
      
      // Mark onboarding as complete
      await apiClient.put(`/businesses/${businessId}`, {
        onboardingCompleted: true,
      });

      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading your configuration...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="bodyLarge" style={styles.description}>
        Review your setup and complete onboarding.
      </Text>

      {/* Resources Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Resources
          </Text>
          <Text variant="bodyLarge" style={styles.count}>
            {activeResources.length} {activeResources.length === 1 ? 'resource' : 'resources'}
          </Text>
          {activeResources.length > 0 && (
            <Text variant="bodySmall" style={styles.itemList}>
              {activeResources.map((r) => r.name).join(', ')}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Staff Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Staff
          </Text>
          <Text variant="bodyLarge" style={styles.count}>
            {activeStaff.length} {activeStaff.length === 1 ? 'staff member' : 'staff members'}
          </Text>
          {activeStaff.length > 0 && (
            <Text variant="bodySmall" style={styles.itemList}>
              {activeStaff.map((s) => s.name).join(', ')}
            </Text>
          )}
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Capacity Summary */}
      <Card style={[styles.card, hasCapacityMismatch && styles.warningCard]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Booking Capacity
          </Text>
          <Text variant="headlineMedium" style={styles.capacityNumber}>
            {capacity}
          </Text>
          <Text variant="bodySmall" style={styles.capacityDescription}>
            concurrent bookings
          </Text>

          {hasCapacityMismatch && (
            <View style={styles.warningBox}>
              <Text variant="bodySmall" style={styles.warningText}>
                ⚠️ Your capacity is limited by the lower count. Consider adding more{' '}
                {activeResources.length < activeStaff.length ? 'resources' : 'staff'} to increase capacity.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={onBack}
          style={styles.backButton}
          disabled={completing}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleComplete}
          disabled={completing}
          loading={completing}
          style={styles.completeButton}
        >
          Complete Setup
        </Button>
      </View>

      <Text variant="bodySmall" style={styles.hint}>
        🎉 You can always modify your setup later from the app
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: Colors.TEXT_SECONDARY,
  },
  description: {
    marginBottom: 24,
    color: Colors.TEXT_SECONDARY,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  count: {
    fontWeight: '700',
    color: Colors.PRIMARY,
  },
  itemList: {
    marginTop: 8,
    color: Colors.TEXT_SECONDARY,
  },
  divider: {
    marginVertical: 16,
  },
  warningCard: {
    borderWidth: 1,
    borderColor: Colors.WARNING,
  },
  capacityNumber: {
    fontWeight: '700',
    color: Colors.PRIMARY,
  },
  capacityDescription: {
    color: Colors.TEXT_SECONDARY,
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
  },
  warningText: {
    color: '#856404',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
  },
  completeButton: {
    flex: 1,
  },
  hint: {
    marginTop: 16,
    textAlign: 'center',
    color: Colors.TEXT_SECONDARY,
  },
});
