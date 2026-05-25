import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors, Spacing } from '../../theme/premium';

interface StepDotsProps {
  total: number;
  activeIndex: number;
  onDotPress?: (index: number) => void;
}

interface StepDotProps {
  index: number;
  isActive: boolean;
  onDotPress?: (index: number) => void;
}

const StepDot: React.FC<StepDotProps> = ({ index, isActive, onDotPress }) => {
  const widthAnim = React.useRef(new Animated.Value(isActive ? 18 : 6)).current;

  React.useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: isActive ? 18 : 6,
      friction: 7,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [isActive, widthAnim]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onDotPress}
      onPress={() => onDotPress?.(index)}
      style={styles.touchArea}
    >
      <Animated.View
        style={[
          styles.dot,
          {
            width: widthAnim,
            backgroundColor: isActive ? Colors.primaryInk : Colors.mutedBorder,
            opacity: isActive ? 1 : 0.6,
          },
        ]}
      />
    </TouchableOpacity>
  );
};

export const StepDots: React.FC<StepDotsProps> = ({ total, activeIndex, onDotPress }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <StepDot
          key={index}
          index={index}
          isActive={index === activeIndex}
          onDotPress={onDotPress}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: Spacing.lg,
  },
  touchArea: {
    padding: Spacing.xs,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
