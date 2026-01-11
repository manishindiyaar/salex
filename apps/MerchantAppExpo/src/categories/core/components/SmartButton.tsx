/**
 * SmartButton Component
 * 
 * A dynamic button component that automatically adapts its label and behavior
 * based on the current business category context. Supports action-specific
 * terminology and context-aware button states.
 */

import React, { useMemo } from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { SmartButtonProps } from '../types';
import { useTerminology, useHasCategoryContext } from '../context';
import { SmartText } from './SmartText';

/**
 * SmartButton Component
 * 
 * Renders a button with category-appropriate action terminology.
 * Automatically adapts button text based on action type and entity.
 */
export const SmartButton: React.FC<SmartButtonProps & TouchableOpacityProps> = ({
  actionType,
  entityType,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  children,
  ...touchableProps
}) => {
  const hasCategoryContext = useHasCategoryContext();
  const { getTerm, hasTerminology } = useTerminology();

  // Memoize the button text based on action and entity
  const buttonText = useMemo(() => {
    if (!hasCategoryContext || !hasTerminology) {
      // Fallback to default English terms
      return getDefaultActionText(actionType, entityType);
    }

    try {
      // Try to get category-specific action terminology
      const actionTerm = getTerm(actionType);
      const entityTerm = getTerm(entityType);
      
      // Combine action and entity terms
      return `${actionTerm} ${entityTerm}`;
    } catch (error) {
      console.warn(`⚠️ SmartButton failed to resolve terms for ${actionType} ${entityType}:`, error);
      return getDefaultActionText(actionType, entityType);
    }
  }, [actionType, entityType, hasCategoryContext, hasTerminology, getTerm]);

  // Handle button press
  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        defaultButtonStyle,
        style,
        disabled && disabledButtonStyle,
        loading && loadingButtonStyle,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={disabled || loading ? 1 : 0.7}
      {...touchableProps}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={textStyle?.color || '#FFFFFF'} 
          style={{ marginRight: 8 }}
        />
      ) : null}
      
      <SmartText
        termKey={actionType}
        context={`action_${entityType}`}
        fallback={buttonText}
        transform="capitalize"
        style={[
          defaultTextStyle,
          textStyle,
          disabled && disabledTextStyle,
        ]}
      >
        {children && ` ${children}`}
      </SmartText>
    </TouchableOpacity>
  );
};

/**
 * SmartActionButton Component
 * 
 * A specialized SmartButton for common actions with predefined styling.
 */
export const SmartActionButton: React.FC<
  Omit<SmartButtonProps, 'actionType'> & 
  TouchableOpacityProps & 
  {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
  }
> = ({
  entityType,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  style,
  textStyle,
  disabled = false,
  loading = false,
  children,
  ...touchableProps
}) => {
  // Determine action type based on variant
  const actionType = useMemo(() => {
    switch (variant) {
      case 'danger':
        return 'delete' as const;
      case 'success':
        return 'complete' as const;
      case 'secondary':
        return 'update' as const;
      default:
        return 'create' as const;
    }
  }, [variant]);

  return (
    <SmartButton
      actionType={actionType}
      entityType={entityType}
      onPress={onPress}
      style={[
        getVariantStyle(variant),
        getSizeStyle(size),
        fullWidth && { width: '100%' },
        style,
      ]}
      textStyle={[
        getVariantTextStyle(variant),
        getSizeTextStyle(size),
        textStyle,
      ]}
      disabled={disabled}
      loading={loading}
      {...touchableProps}
    >
      {children}
    </SmartButton>
  );
};

/**
 * SmartBookingButton Component
 * 
 * A specialized button for booking-related actions that adapts terminology
 * based on business category (Book vs Schedule vs Reserve).
 */
export const SmartBookingButton: React.FC<
  Omit<SmartButtonProps, 'actionType' | 'entityType'> & 
  TouchableOpacityProps & 
  {
    variant?: 'book' | 'reschedule' | 'cancel';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
  }
> = ({
  onPress,
  variant = 'book',
  size = 'medium',
  fullWidth = false,
  style,
  textStyle,
  disabled = false,
  loading = false,
  children,
  ...touchableProps
}) => {
  const actionType = useMemo(() => {
    switch (variant) {
      case 'reschedule':
        return 'schedule' as const;
      case 'cancel':
        return 'cancel' as const;
      default:
        return 'book' as const;
    }
  }, [variant]);

  const buttonVariant = useMemo(() => {
    switch (variant) {
      case 'cancel':
        return 'danger';
      case 'reschedule':
        return 'secondary';
      default:
        return 'primary';
    }
  }, [variant]);

  return (
    <SmartButton
      actionType={actionType}
      entityType="appointment"
      onPress={onPress}
      style={[
        getVariantStyle(buttonVariant),
        getSizeStyle(size),
        fullWidth && { width: '100%' },
        style,
      ]}
      textStyle={[
        getVariantTextStyle(buttonVariant),
        getSizeTextStyle(size),
        textStyle,
      ]}
      disabled={disabled}
      loading={loading}
      {...touchableProps}
    >
      {children}
    </SmartButton>
  );
};

/**
 * SmartIconButton Component
 * 
 * A button that shows only an icon with smart tooltip text.
 */
export const SmartIconButton: React.FC<
  SmartButtonProps & 
  TouchableOpacityProps & 
  {
    icon: React.ReactNode;
    size?: number;
    tooltip?: boolean;
  }
> = ({
  actionType,
  entityType,
  onPress,
  icon,
  size = 24,
  tooltip = false,
  style,
  disabled = false,
  loading = false,
  ...touchableProps
}) => {
  return (
    <TouchableOpacity
      style={[
        iconButtonStyle,
        { width: size + 16, height: size + 16 },
        style,
        disabled && disabledButtonStyle,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={disabled || loading ? 1 : 0.7}
      {...touchableProps}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#666" />
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
};

/**
 * Get default action text for fallback scenarios
 */
function getDefaultActionText(
  actionType: SmartButtonProps['actionType'],
  entityType: SmartButtonProps['entityType']
): string {
  const actionMap = {
    book: 'Book',
    schedule: 'Schedule',
    reserve: 'Reserve',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    cancel: 'Cancel',
    complete: 'Complete',
  };

  const entityMap = {
    appointment: 'Appointment',
    service: 'Service',
    staff: 'Staff',
    resource: 'Resource',
    customer: 'Customer',
  };

  const action = actionMap[actionType] || actionType;
  const entity = entityMap[entityType] || entityType;

  return `${action} ${entity}`;
}

/**
 * Get variant-specific button styles
 */
function getVariantStyle(variant: string) {
  const styles = {
    primary: {
      backgroundColor: '#00FF00', // Salex Green
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#00FF00',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    danger: {
      backgroundColor: '#FF4444',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    success: {
      backgroundColor: '#44FF44',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
  };

  return styles[variant as keyof typeof styles] || styles.primary;
}

/**
 * Get variant-specific text styles
 */
function getVariantTextStyle(variant: string) {
  const styles = {
    primary: {
      color: '#000000', // Black text on green background
      fontWeight: '600' as const,
      fontSize: 16,
    },
    secondary: {
      color: '#00FF00', // Green text on transparent background
      fontWeight: '600' as const,
      fontSize: 16,
    },
    danger: {
      color: '#FFFFFF',
      fontWeight: '600' as const,
      fontSize: 16,
    },
    success: {
      color: '#000000',
      fontWeight: '600' as const,
      fontSize: 16,
    },
  };

  return styles[variant as keyof typeof styles] || styles.primary;
}

/**
 * Get size-specific button styles
 */
function getSizeStyle(size: string) {
  const styles = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
    },
  };

  return styles[size as keyof typeof styles] || styles.medium;
}

/**
 * Get size-specific text styles
 */
function getSizeTextStyle(size: string) {
  const styles = {
    small: {
      fontSize: 14,
    },
    medium: {
      fontSize: 16,
    },
    large: {
      fontSize: 18,
    },
  };

  return styles[size as keyof typeof styles] || styles.medium;
}

// Default styles
const defaultButtonStyle = {
  backgroundColor: '#00FF00',
  borderRadius: 8,
  paddingVertical: 12,
  paddingHorizontal: 24,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const defaultTextStyle = {
  color: '#000000',
  fontWeight: '600' as const,
  fontSize: 16,
};

const disabledButtonStyle = {
  backgroundColor: '#CCCCCC',
  opacity: 0.6,
};

const disabledTextStyle = {
  color: '#666666',
};

const loadingButtonStyle = {
  opacity: 0.8,
};

const iconButtonStyle = {
  borderRadius: 8,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  backgroundColor: 'transparent',
};

// Export default as SmartButton
export default SmartButton;