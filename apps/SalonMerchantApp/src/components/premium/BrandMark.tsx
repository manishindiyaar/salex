import React from 'react';
import { StyleSheet, Animated } from 'react-native';

interface BrandMarkProps {
  size?: number;
  animate?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 64, animate = false }) => {
  const scaleAnim = React.useRef(new Animated.Value(animate ? 0.92 : 1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animate) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animate]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  return (
    <Animated.Image
      source={require('../../../assets/salex_logo_bg_remove.png')}
      style={[
        styles.logo,
        {
          width: size,
          height: size,
          transform: [{ scale: scaleAnim }, { rotate: rotation }],
        },
      ]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});
