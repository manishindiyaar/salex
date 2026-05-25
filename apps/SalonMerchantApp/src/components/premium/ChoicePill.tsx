import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon from '@expo/vector-icons/Feather';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/premium';

interface ChoicePillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const ChoicePill: React.FC<ChoicePillProps> = ({
  label,
  selected,
  onPress,
  style,
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.container,
          selected ? styles.selectedContainer : styles.unselectedContainer,
          style,
        ]}
      >
        <Text style={[styles.text, selected ? styles.selectedText : styles.unselectedText]}>
          {label}
        </Text>
        
        {/* Subtle Checkmark indicator */}
        <Icon
          name={selected ? "check" : "circle"}
          size={18}
          color={selected ? Colors.primaryInk : Colors.mutedBorder}
          style={styles.icon}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1.5,
    width: '100%',
  },
  unselectedContainer: {
    backgroundColor: Colors.white,
    borderColor: Colors.mutedBorder,
  },
  selectedContainer: {
    backgroundColor: Colors.selectedSurface, // #F5F3F1 selected
    borderColor: Colors.primaryInk,           // Stronger border
  },
  text: {
    ...Typography.body,
    fontSize: 16,
  },
  unselectedText: {
    color: Colors.secondaryText,
  },
  selectedText: {
    color: Colors.primaryInk,
    fontFamily: 'Inter-Medium',
  },
  icon: {
    marginLeft: Spacing.md,
  },
});
