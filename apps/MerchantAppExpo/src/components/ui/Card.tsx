import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '@theme/config';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  onPress,
  style,
  disabled = false,
}) => {
  const cardStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[`padding_${padding}` as keyof typeof styles],
    disabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.MD,
    backgroundColor: Colors.SURFACE,
  },
  
  // Variants
  default: {
    backgroundColor: Colors.SURFACE,
  },
  elevated: {
    backgroundColor: Colors.SURFACE,
    ...Shadows.MD,
  },
  outlined: {
    backgroundColor: Colors.SURFACE,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  
  // Padding options
  padding_none: {
    padding: 0,
  },
  padding_small: {
    padding: Spacing.SM,
  },
  padding_medium: {
    padding: Spacing.MD,
  },
  padding_large: {
    padding: Spacing.LG,
  },
  
  // States
  disabled: {
    opacity: 0.6,
  },
});

export default Card;