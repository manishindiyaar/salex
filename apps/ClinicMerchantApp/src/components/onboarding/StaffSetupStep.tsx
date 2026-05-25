/**
 * StaffSetupStep Component
 * 
 * Second step of onboarding wizard.
 * Allows adding staff members with optional resource linking.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Chip, IconButton, Divider } from 'react-native-paper';
import { useStaffStore } from '../../store/staffStore';
import { useResourceStore } from '../../store/resourceStore';
import { Colors } from '../../theme/config';

// Define the type inline to avoid import issues
interface CreateStaffInput {
  name: string;
  phone?: string;
  linkedResourceIds?: string[];
}

interface StaffSetupStepProps {
  businessId: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface StaffFormData {
  name: string;
  phone: string;
  linkedResourceIds: string[];
}

export const StaffSetupStep: React.FC<StaffSetupStepProps> = ({
  businessId,
  onComplete,
  onSkip,
}) => {
  const [staffList, setStaffList] = useState<StaffFormData[]>([
    { name: '', phone: '', linkedResourceIds: [] },
  ]);
  const { createOne, creating } = useStaffStore();
  const { items: resources, listByBusiness } = useResourceStore();

  useEffect(() => {
    listByBusiness(businessId);
  }, [businessId]);

  const handleAddStaff = () => {
    setStaffList([...staffList, { name: '', phone: '', linkedResourceIds: [] }]);
  };

  const handleRemoveStaff = (index: number) => {
    if (staffList.length > 1) {
      setStaffList(staffList.filter((_, i) => i !== index));
    }
  };

  const handleUpdateStaff = (index: number, field: keyof StaffFormData, value: any) => {
    const updated = [...staffList];
    updated[index] = { ...updated[index], [field]: value };
    setStaffList(updated);
  };

  const toggleResourceLink = (staffIndex: number, resourceId: string) => {
    const staff = staffList[staffIndex];
    const isLinked = staff.linkedResourceIds.includes(resourceId);
    const newLinks = isLinked
      ? staff.linkedResourceIds.filter((id) => id !== resourceId)
      : [...staff.linkedResourceIds, resourceId];
    
    handleUpdateStaff(staffIndex, 'linkedResourceIds', newLinks);
  };

  const handleCreate = async () => {
    const validStaff = staffList.filter((s) => s.name.trim().length > 0);
    if (validStaff.length === 0) {
      return;
    }

    // Create staff members one by one
    let allSuccess = true;
    for (const staff of validStaff) {
      const payload: CreateStaffInput = {
        name: staff.name.trim(),
        phone: staff.phone.trim() || undefined,
      };
      
      const result = await createOne(businessId, payload);
      if (!result) {
        allSuccess = false;
        break;
      }

      // TODO: Link resources after staff creation
      // This would require calling the linkToResource endpoint
    }

    if (allSuccess) {
      onComplete();
    }
  };

  const isValid = () => {
    return staffList.some((s) => s.name.trim().length > 0);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text variant="bodyLarge" style={styles.description}>
        Add your team members. You can link them to specific resources if needed.
      </Text>

      {staffList.map((staff, index) => (
        <Card key={index} style={styles.staffCard}>
          <Card.Content>
            <View style={styles.staffHeader}>
              <Text variant="titleMedium">Staff Member {index + 1}</Text>
              {staffList.length > 1 && (
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => handleRemoveStaff(index)}
                />
              )}
            </View>

            <TextInput
              label="Name *"
              value={staff.name}
              onChangeText={(value) => handleUpdateStaff(index, 'name', value)}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Rajesh Kumar"
            />

            <TextInput
              label="Phone (Optional)"
              value={staff.phone}
              onChangeText={(value) => handleUpdateStaff(index, 'phone', value)}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., +919876543210"
              keyboardType="phone-pad"
            />

            {resources.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text variant="labelLarge" style={styles.linkLabel}>
                  Link to Resources (Optional)
                </Text>
                <View style={styles.chipContainer}>
                  {resources.map((resource) => (
                    <Chip
                      key={resource.id}
                      mode={staff.linkedResourceIds.includes(resource.id) ? 'flat' : 'outlined'}
                      selected={staff.linkedResourceIds.includes(resource.id)}
                      onPress={() => toggleResourceLink(index, resource.id)}
                      style={styles.chip}
                    >
                      {resource.name}
                    </Chip>
                  ))}
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      ))}

      <Button
        mode="outlined"
        onPress={handleAddStaff}
        icon="plus"
        style={styles.addButton}
      >
        Add Another Staff Member
      </Button>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={onSkip}
          style={styles.skipButton}
          disabled={creating}
        >
          Skip for Now
        </Button>
        <Button
          mode="contained"
          onPress={handleCreate}
          disabled={!isValid() || creating}
          loading={creating}
          style={styles.createButton}
        >
          Add Staff
        </Button>
      </View>

      <Text variant="bodySmall" style={styles.hint}>
        💡 You can add or edit staff later from the Staff screen
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    marginBottom: 24,
    color: Colors.TEXT_SECONDARY,
  },
  staffCard: {
    marginBottom: 16,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  linkLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  addButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  skipButton: {
    flex: 1,
  },
  createButton: {
    flex: 1,
  },
  hint: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: Colors.TEXT_SECONDARY,
  },
});
