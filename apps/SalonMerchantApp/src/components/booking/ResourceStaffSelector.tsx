/**
 * ResourceStaffSelector Component
 * 
 * Allows manual selection of resource and staff for a booking.
 * Shows availability status for each option.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, RadioButton, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { useResourceStore, ResourceWithStats } from '../../store/resourceStore';
import { useStaffStore, StaffWithStats } from '../../store/staffStore';
import { Colors } from '../../theme/config';

interface ResourceStaffSelectorProps {
  businessId: string;
  selectedResourceId?: string;
  selectedStaffId?: string;
  onResourceSelect: (resourceId: string | undefined) => void;
  onStaffSelect: (staffId: string | undefined) => void;
  scheduledAt: Date;
  durationMinutes: number;
}

export const ResourceStaffSelector: React.FC<ResourceStaffSelectorProps> = ({
  businessId,
  selectedResourceId,
  selectedStaffId,
  onResourceSelect,
  onStaffSelect,
  scheduledAt,
  durationMinutes,
}) => {
  const { items: resources, listByBusiness: loadResources, loading: loadingResources } = useResourceStore();
  const { items: staff, listByBusiness: loadStaff, loading: loadingStaff } = useStaffStore();

  useEffect(() => {
    loadResources(businessId);
    loadStaff(businessId);
  }, [businessId]);

  const activeResources = resources.filter((r) => r.isActive);
  const activeStaff = staff.filter((s) => s.isActive);

  if (loadingResources || loadingStaff) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading options...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Resource Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SELECT RESOURCE (OPTIONAL)</Text>
        <Text style={styles.sectionHint}>
          Leave unselected for automatic assignment
        </Text>

        <RadioButton.Group
          onValueChange={(value) => onResourceSelect(value === 'auto' ? undefined : value)}
          value={selectedResourceId || 'auto'}
        >
          <Card style={styles.optionCard}>
            <Card.Content style={styles.optionContent}>
              <RadioButton.Item
                label="Auto-assign (Recommended)"
                value="auto"
                labelStyle={styles.radioLabel}
              />
            </Card.Content>
          </Card>

          {activeResources.map((resource) => (
            <Card key={resource.id} style={styles.optionCard}>
              <Card.Content style={styles.optionContent}>
                <RadioButton.Item
                  label={resource.name}
                  value={resource.id}
                  labelStyle={styles.radioLabel}
                />
                {resource.utilizationPercent !== undefined && (
                  <Chip
                    mode="outlined"
                    compact
                    style={styles.utilizationChip}
                    textStyle={styles.chipText}
                  >
                    {resource.utilizationPercent}% utilized
                  </Chip>
                )}
              </Card.Content>
            </Card>
          ))}
        </RadioButton.Group>
      </View>

      {/* Staff Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SELECT STAFF (OPTIONAL)</Text>
        <Text style={styles.sectionHint}>
          Leave unselected for automatic assignment
        </Text>

        <RadioButton.Group
          onValueChange={(value) => onStaffSelect(value === 'auto' ? undefined : value)}
          value={selectedStaffId || 'auto'}
        >
          <Card style={styles.optionCard}>
            <Card.Content style={styles.optionContent}>
              <RadioButton.Item
                label="Auto-assign (Recommended)"
                value="auto"
                labelStyle={styles.radioLabel}
              />
            </Card.Content>
          </Card>

          {activeStaff.map((staffMember) => (
            <Card key={staffMember.id} style={styles.optionCard}>
              <Card.Content style={styles.optionContent}>
                <RadioButton.Item
                  label={staffMember.name}
                  value={staffMember.id}
                  labelStyle={styles.radioLabel}
                />
                {staffMember.utilizationPercent !== undefined && (
                  <Chip
                    mode="outlined"
                    compact
                    style={styles.utilizationChip}
                    textStyle={styles.chipText}
                  >
                    {staffMember.utilizationPercent}% utilized
                  </Chip>
                )}
              </Card.Content>
            </Card>
          ))}
        </RadioButton.Group>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: Colors.TEXT_SECONDARY,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.TEXT_SECONDARY,
    marginBottom: 12,
  },
  optionCard: {
    marginBottom: 8,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
  },
  radioLabel: {
    fontSize: 16,
  },
  utilizationChip: {
    height: 24,
  },
  chipText: {
    fontSize: 11,
  },
});
