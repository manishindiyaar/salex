/**
 * CalculatorText Component
 * 
 * Massive bold number display for critical data like prices and revenue.
 * Uses Calculator-style typography for maximum visibility.
 */

import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, TextStyle, ViewStyle } from 'react-native';
import { Colors, CalculatorTypography } from '../../theme/config';

export type CalculatorTextSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface CalculatorTextProps {
  /** The numeric value to display */
  value: number | string;
  /** Prefix to show before the number (e.g., "₹") */
  prefix?: string;
  /** Suffix to show after the number (e.g., "min") */
  suffix?: string;
  /** Size variant - sm: 32pt, md: 48pt, lg: 64pt, xl: 96pt, xxl: 128pt */
  size?: CalculatorTextSize;
  /** Text color - defaults to Salex Green for money */
  color?: string;
  /** Enable count-up animation when value changes */
  animated?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Additional text style */
  style?: TextStyle;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Format number with Indian numbering system (lakhs, crores)
 * e.g., 1,00,000 instead of 100,000
 */
const formatIndianNumber = (num: number): string => {
  const numStr = Math.floor(num).toString();
  if (numStr.length <= 3) return numStr;
  
  let result = '';
  let count = 0;
  
  for (let i = numStr.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      result = ',' + result;
    }
    result = numStr[i] + result;
    count++;
  }
  
  return result;
};

export const CalculatorText: React.FC<CalculatorTextProps> = ({
  value,
  prefix = '',
  suffix = '',
  size = 'md',
  color = Colors.PRIMARY,
  animated = false,
  animationDuration = 500,
  style,
  containerStyle,
  testID,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayValue = useRef(0);
  const [displayText, setDisplayText] = React.useState('0');

  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

  useEffect(() => {
    if (animated && typeof numericValue === 'number') {
      const startValue = displayValue.current;
      animatedValue.setValue(0);

      Animated.timing(animatedValue, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: false,
      }).start();

      const listener = animatedValue.addListener(({ value: progress }) => {
        const currentValue = startValue + (numericValue - startValue) * progress;
        displayValue.current = currentValue;
        setDisplayText(formatIndianNumber(currentValue));
      });

      return () => {
        animatedValue.removeListener(listener);
      };
    } else {
      displayValue.current = numericValue;
      setDisplayText(
        typeof numericValue === 'number' 
          ? formatIndianNumber(numericValue) 
          : String(value)
      );
    }
  }, [numericValue, animated, animationDuration, animatedValue, value]);

  const sizeStyle = CalculatorTypography[size];

  return (
    <Text
      testID={testID}
      style={[
        styles.base,
        {
          fontSize: sizeStyle.fontSize,
          lineHeight: sizeStyle.lineHeight,
          fontWeight: sizeStyle.fontWeight,
          color,
        },
        style,
      ]}
    >
      {prefix}{displayText}{suffix}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default CalculatorText;
