import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, BorderRadius } from '../../theme/premium';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'filled',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const opacityValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isFilled = variant === 'filled';

  return (
    <Animated.View
      style={[
        styles.buttonWrapper,
        fullWidth && styles.fullWidth,
        {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={[
          styles.button,
          isFilled ? styles.filledButton : styles.outlineButton,
          disabled && styles.disabledButton,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isFilled ? Colors.white : Colors.primaryInk} size="small" />
        ) : (
          <Text
            style={[
              styles.text,
              isFilled ? styles.filledText : styles.outlineText,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  button: {
    height: 56, // Premium 56-64px height
    width: '100%',
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderWidth: 1.5,
  },
  filledButton: {
    backgroundColor: Colors.primaryInk,
    borderColor: Colors.primaryInk,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: Colors.primaryInk,
  },
  disabledButton: {
    backgroundColor: Colors.disabledSurface,
    borderColor: Colors.disabledSurface,
  },
  text: {
    ...Typography.ctaMono,
  },
  filledText: {
    color: Colors.white,
  },
  outlineText: {
    color: Colors.primaryInk,
  },
  disabledText: {
    color: Colors.secondaryText,
    opacity: 0.6,
  },
});
