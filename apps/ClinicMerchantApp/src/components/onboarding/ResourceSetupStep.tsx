/**
 * ResourceSetupStep Component
 * 
 * First step of onboarding wizard.
 * Allows bulk creation of resources (chairs/stations).
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card, Chip } from 'react-native-paper';
import { useResourceStore } from '../../store/resourceStore';
import { Colors } from '../../theme/config';

interface ResourceSetupStepProps {
  businessId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const ResourceSetupStep: React.FC<ResourceSetupStepProps> = ({
  businessId,
  onComplete,
  onSkip,
}) => {
  const [count, setCount] = useState('');
  const [prefix, setPrefix] = useState('Chair');
  const { bulkCreate, creating } = useResourceStore();

  const handleCreate = async () => {
    const numCount = parseInt(count, 10);
    if (isNaN(numCount) || numCount < 1 || numCount > 50) {
      return;
    }

    const result = await bulkCreate(businessId, {
      resources: Array.from({ length: numCount }, (_, i) => ({
        name: `${prefix} ${i + 1}`,
        isActive: true,
      })),
    });

    if (result) {
      onComplete();
    }
  };

  const isValid = () => {
    const numCount = parseInt(count, 10);
    return !isNaN(numCount) && numCount >= 1 && numCount <= 50 && prefix.trim().length > 0;
  };

  const previewNames = () => {
    const numCount = parseInt(count, 10);
    if (isNaN(numCount) || numCount < 1) return [];
    
    const max = Math.min(numCount, 5);
    const names = [];
    for (let i = 1; i <= max; i++) {
      names.push(`${prefix} ${i}`);
    }
    if (numCount > 5) {
      names.push(`... and ${numCount - 5} more`);
    }
    return names;
  };

  return (
    <View style={styles.container}>
      <Text variant="bodyLarge" style={styles.description}>
        How many chairs or stations do you have? We'll create them all at once.
      </Text>

      <TextInput
        label="Number of Resources"
        value={count}
        onChangeText={setCount}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        placeholder="e.g., 5"
        maxLength={2}
      />

      <TextInput
        label="Resource Name Prefix"
        value={prefix}
        onChangeText={setPrefix}
        mode="outlined"
        style={styles.input}
        placeholder="e.g., Chair, Station, Room"
      />

      {previewNames().length > 0 && (
        <Card style={styles.previewCard}>
          <Card.Content>
            <Text variant="labelLarge" style={styles.previewTitle}>
              Preview:
            </Text>
            <View style={styles.chipContainer}>
              {previewNames().map((name, idx) => (
                <Chip
                  key={idx}
                  mode="outlined"
                  style={styles.chip}
                  textStyle={styles.chipText}
                >
                  {name}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

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
          Create Resources
        </Button>
      </View>

      <Text variant="bodySmall" style={styles.hint}>
        💡 You can add or edit resources later from the Resources screen
      </Text>
    </View>
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
  input: {
    marginBottom: 16,
  },
  previewCard: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: Colors.SURFACE_VARIANT,
  },
  previewTitle: {
    marginBottom: 12,
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
  chipText: {
    fontSize: 12,
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
    textAlign: 'center',
    color: Colors.TEXT_SECONDARY,
  },
});
