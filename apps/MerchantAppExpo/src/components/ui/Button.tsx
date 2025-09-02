import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, BorderRadius, Shadows, TouchTarget } from '@theme/config';

// TODO: Re-enable once LinearGradient native module is configured
// import LinearGradient from 'react-native-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.base,
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const handlePress = () => {
    if (!loading && !disabled) {
      onPress();
    }
  };

  // Primary button - using solid color fallback until LinearGradient is configured
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[buttonStyle, styles.primary]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.text} size="small" />
        ) : (
          <Text style={textStyles}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // TODO: Re-enable gradient version once LinearGradient is configured
  // if (variant === 'primary') {
  //   return (
  //     <TouchableOpacity
  //       style={[buttonStyle, { padding: 0 }]}
  //       onPress={handlePress}
  //       activeOpacity={0.8}
  //       disabled={disabled || loading}
  //     >
  //       <LinearGradient
  //         colors={[Colors.PRIMARY, Colors.PRIMARY_END]}
  //         start={{ x: 0, y: 0 }}
  //         end={{ x: 1, y: 0 }}
  //         style={[styles.gradient, styles[size], disabled && styles.disabledGradient]}
  //       >
  //         {loading ? (
  //           <ActivityIndicator color={Colors.TEXT} size="small" />
  //         ) : (
  //           <Text style={textStyles}>{title}</Text>
  //         )}
  //       </LinearGradient>
  //     </TouchableOpacity>
  //   );
  // }

  // Other button variants
  return (
    <TouchableOpacity
      style={[buttonStyle, styles[variant]]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? Colors.primary : Colors.text} 
          size="small" 
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    ...Shadows.SM,
  },
  
  // Sizes
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: TouchTarget.MIN,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: TouchTarget.MD,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: TouchTarget.LG,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surface,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Gradient for primary button
  gradient: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  
  // States
  disabled: {
    backgroundColor: '#E5E7EB',
    ...Shadows.SM,
  },
  disabledGradient: {
    opacity: 0.5,
  },
  
  // Text styles
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
  smallText: {
    ...Typography.body,
  },
  mediumText: {
    ...Typography.heading3,
  },
  largeText: {
    ...Typography.heading2,
    fontSize: 18,
  },
  
  // Text colors by variant
  primaryText: {
    color: Colors.background,
  },
  secondaryText: {
    color: Colors.text,
  },
  outlineText: {
    color: Colors.primary,
  },
  ghostText: {
    color: Colors.primary,
  },
  disabledText: {
    color: '#9CA3AF',
  },
});

export default Button;
