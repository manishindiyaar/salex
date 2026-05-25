/**
 * ChaiBreakToggle Component
 * 
 * Massive physical-style toggle switch for emergency stop functionality.
 * When OFF, the salon stops accepting new WhatsApp booking requests.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/config';

export interface ChaiBreakToggleProps {
  /** Whether the salon is accepting orders (true = accepting, false = on break) */
  isActive: boolean;
  /** Callback when toggle state changes */
  onToggle: (active: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

export const ChaiBreakToggle: React.FC<ChaiBreakToggleProps> = ({
  isActive,
  onToggle,
  disabled = false,
  testID,
}) => {
  const translateX = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [isActive, translateX]);

  const handlePress = async () => {
    if (disabled) return;

    // Trigger haptic feedback
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Scale animation for press feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle(!isActive);
  };

  const thumbTranslateX = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 76], // Move thumb from left to right
  });

  const trackColor = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.CHAI_BREAK_OFF_BG, Colors.PRIMARY + '40'],
  });

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, !isActive && styles.labelInactive]}>
          {isActive ? '☕ OPEN FOR BUSINESS' : '🛑 CHAI BREAK'}
        </Text>
        <Text style={[styles.sublabel, !isActive && styles.sublabelInactive]}>
          {isActive 
            ? 'Accepting WhatsApp bookings' 
            : 'Not accepting new bookings'}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={disabled}
        style={styles.touchable}
      >
        <Animated.View
          style={[
            styles.track,
            {
              backgroundColor: isActive ? Colors.PRIMARY + '30' : Colors.CHAI_BREAK_OFF_BG,
              borderColor: isActive ? Colors.PRIMARY : Colors.CHAI_BREAK_OFF_BORDER,
              transform: [{ scale: scaleAnim }],
            },
            disabled && styles.trackDisabled,
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: isActive ? Colors.PRIMARY : Colors.ERROR,
                transform: [{ translateX: thumbTranslateX }],
              },
            ]}
          >
            <Text style={styles.thumbIcon}>
              {isActive ? '✓' : '✕'}
            </Text>
          </Animated.View>

          <View style={styles.trackLabels}>
            <Text style={[styles.trackLabel, !isActive && styles.trackLabelActive]}>
              OFF
            </Text>
            <Text style={[styles.trackLabel, isActive && styles.trackLabelActive]}>
              ON
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.LG,
  },
  labelContainer: {
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  label: {
    ...Typography.H3,
    color: Colors.PRIMARY,
    fontWeight: '700',
    marginBottom: Spacing.XS,
  },
  labelInactive: {
    color: Colors.ERROR,
  },
  sublabel: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  sublabelInactive: {
    color: Colors.TEXT_TERTIARY,
  },
  touchable: {
    width: 140,
    height: 60,
  },
  track: {
    width: 140,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    position: 'relative',
  },
  trackDisabled: {
    opacity: 0.5,
  },
  thumb: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbIcon: {
    fontSize: 24,
    color: Colors.TEXT,
    fontWeight: '700',
  },
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'absolute',
    width: '100%',
  },
  trackLabel: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
    fontWeight: '600',
  },
  trackLabelActive: {
    color: Colors.TEXT,
  },
});

export default ChaiBreakToggle;
