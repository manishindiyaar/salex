import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/premium';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  prefix?: string;
  error?: string;
  success?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value = '',
  prefix,
  error,
  success,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  placeholder,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e: any) => { setIsFocused(true); onFocus?.(e); };
  const handleBlur  = (e: any) => { setIsFocused(false); onBlur?.(e); };

  const borderColor = error
    ? Colors.error
    : success
    ? Colors.success
    : isFocused
    ? Colors.primaryInk
    : Colors.mutedBorder;

  // Show the label above the input only when there is a value or it is focused
  const isActive = isFocused || !!value;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Static label — shown above field when active */}
      {isActive && (
        <Text style={[styles.floatedLabel, labelStyle]}>{label}</Text>
      )}

      <View
        style={[
          styles.container,
          {
            borderColor,
            borderWidth: isFocused || !!error || !!success ? 1.5 : 1,
            backgroundColor: isFocused ? Colors.white : Colors.background,
            marginTop: isActive ? 4 : 0,
          },
        ]}
      >
        {/* Prefix shown only when active */}
        {prefix && isActive && (
          <Text style={styles.prefixText}>{prefix}</Text>
        )}

        <TextInput
          {...props}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isActive ? (placeholder ?? '') : label}
          placeholderTextColor={Colors.secondaryText}
          style={[styles.input, inputStyle]}
          selectionColor={Colors.primaryInk}
        />
      </View>

      {!!error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  floatedLabel: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.primaryInk,
    marginLeft: Spacing.lg,
    marginBottom: 2,
  },
  container: {
    height: 56,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixText: {
    ...Typography.inputText,
    marginRight: 4,
    color: Colors.primaryInk,
  },
  input: {
    flex: 1,
    ...Typography.inputText,
    padding: 0,
    color: Colors.primaryInk,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
