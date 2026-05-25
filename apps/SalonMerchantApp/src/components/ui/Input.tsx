import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { Colors, Typography, BorderRadius, Spacing } from '../../theme/config';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  required = false,
  style,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  const inputContainerStyle: ViewStyle[] = [
    styles.inputContainer,
    focused && styles.inputContainerFocused,
    error && styles.inputContainerError,
  ].filter(Boolean) as ViewStyle[];

  const inputStyle: ViewStyle[] = [
    styles.input,
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
    style,
  ].filter(Boolean) as ViewStyle[];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <Icon 
            name={leftIcon as any} 
            size={20} 
            color={focused ? Colors.PRIMARY : Colors.TEXT_TERTIARY}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={inputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={Colors.TEXT_TERTIARY}
          selectionColor={Colors.PRIMARY}
          {...props}
        />
        
        {rightIcon && (
          <Icon 
            name={rightIcon as any} 
            size={20} 
            color={focused ? Colors.PRIMARY : Colors.TEXT_TERTIARY}
            style={styles.rightIcon}
            onPress={onRightIconPress}
          />
        )}
      </View>
      
      {(error || hint) && (
        <View style={styles.helperContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={14} color={Colors.ERROR} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : hint ? (
            <Text style={styles.hintText}>{hint}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.MD,
  },
  labelContainer: {
    marginBottom: Spacing.SM,
  },
  label: {
    ...Typography.Body2,
    color: Colors.TEXT,
    fontWeight: '500',
  },
  required: {
    color: Colors.ERROR,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    paddingHorizontal: Spacing.MD,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: Colors.BORDER_FOCUS,
    backgroundColor: Colors.SURFACE_VARIANT,
  },
  inputContainerError: {
    borderColor: Colors.ERROR,
  },
  input: {
    flex: 1,
    ...Typography.Body1,
    color: Colors.TEXT,
    paddingVertical: Spacing.SM,
    paddingHorizontal: 0,
  },
  inputWithLeftIcon: {
    marginLeft: Spacing.SM,
  },
  inputWithRightIcon: {
    marginRight: Spacing.SM,
  },
  leftIcon: {
    marginRight: Spacing.XS,
  },
  rightIcon: {
    marginLeft: Spacing.XS,
  },
  helperContainer: {
    marginTop: Spacing.XS,
    paddingHorizontal: Spacing.XS,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.Caption,
    color: Colors.ERROR,
    marginLeft: Spacing.XS,
  },
  hintText: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
  },
});

export default Input;