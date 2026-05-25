/**
 * ImpactZonePresets Component
 * 
 * 4 massive preset buttons for quick slot creation.
 * HAIRCUT, SHAVE, COMBO, OTHER
 * Light haptic on tap, shows price in CalculatorText.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, TouchTarget } from '../../theme/config';
import { CalculatorText } from './CalculatorText';

export interface ServicePreset {
  id: string;
  label: string;
  emoji: string;
  price: number;
  duration: number;
}

export interface ImpactZonePresetsProps {
  presets: ServicePreset[];
  selectedIds: string[];
  onSelect: (preset: ServicePreset) => void;
  onDeselect: (presetId: string) => void;
  testID?: string;
}

// Default presets if none provided
export const DEFAULT_PRESETS: ServicePreset[] = [
  { id: 'haircut', label: 'HAIRCUT', emoji: '💇', price: 350, duration: 30 },
  { id: 'shave', label: 'SHAVE', emoji: '🧔', price: 200, duration: 20 },
  { id: 'combo', label: 'COMBO', emoji: '✂️', price: 500, duration: 45 },
  { id: 'other', label: 'OTHER', emoji: '📝', price: 0, duration: 30 },
];

interface PresetButtonProps {
  preset: ServicePreset;
  isSelected: boolean;
  onPress: () => void;
}

const PresetButton: React.FC<PresetButtonProps> = ({ preset, isSelected, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.presetButton,
          isSelected && styles.presetButtonSelected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.presetEmoji}>{preset.emoji}</Text>
        <Text style={[styles.presetLabel, isSelected && styles.presetLabelSelected]}>
          {preset.label}
        </Text>
        {preset.price > 0 && (
          <Text style={[styles.presetPrice, isSelected && styles.presetPriceSelected]}>
            ₹{preset.price}
          </Text>
        )}
        {preset.id === 'other' && (
          <Text style={styles.presetCustom}>Custom</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const ImpactZonePresets: React.FC<ImpactZonePresetsProps> = ({
  presets = DEFAULT_PRESETS,
  selectedIds,
  onSelect,
  onDeselect,
  testID,
}) => {
  // Calculate total from selected presets
  const selectedPresets = presets.filter(p => selectedIds.includes(p.id));
  const totalPrice = selectedPresets.reduce((sum, p) => sum + p.price, 0);
  const totalDuration = selectedPresets.reduce((sum, p) => sum + p.duration, 0);

  const handlePresetPress = (preset: ServicePreset) => {
    if (selectedIds.includes(preset.id)) {
      onDeselect(preset.id);
    } else {
      onSelect(preset);
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      {/* Price Display */}
      <View style={styles.priceDisplay}>
        <CalculatorText
          value={totalPrice}
          prefix="₹"
          size="lg"
          color={totalPrice > 0 ? Colors.PRIMARY : Colors.TEXT_TERTIARY}
          animated
        />
        {totalDuration > 0 && (
          <Text style={styles.durationText}>{totalDuration} minutes</Text>
        )}
      </View>

      {/* Preset Grid */}
      <View style={styles.grid}>
        {presets.map((preset) => (
          <PresetButton
            key={preset.id}
            preset={preset}
            isSelected={selectedIds.includes(preset.id)}
            onPress={() => handlePresetPress(preset)}
          />
        ))}
      </View>

      {/* Selection Summary */}
      {selectedIds.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {selectedIds.length} service{selectedIds.length > 1 ? 's' : ''} selected
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.LG,
  },
  priceDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.XL,
    paddingVertical: Spacing.LG,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
  },
  durationText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginTop: Spacing.XS,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.MD,
  },
  presetButton: {
    width: '47%',
    minHeight: TouchTarget.XL,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    borderWidth: 2,
    borderColor: Colors.BORDER,
    padding: Spacing.LG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonSelected: {
    borderColor: Colors.PRIMARY,
    backgroundColor: Colors.PRIMARY + '20',
  },
  presetEmoji: {
    fontSize: 32,
    marginBottom: Spacing.SM,
  },
  presetLabel: {
    ...Typography.H4,
    color: Colors.TEXT,
    fontWeight: '700',
    marginBottom: Spacing.XS,
  },
  presetLabelSelected: {
    color: Colors.PRIMARY,
  },
  presetPrice: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '600',
  },
  presetPriceSelected: {
    color: Colors.PRIMARY,
  },
  presetCustom: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
    fontStyle: 'italic',
  },
  summary: {
    marginTop: Spacing.LG,
    alignItems: 'center',
  },
  summaryText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
});

export default ImpactZonePresets;
