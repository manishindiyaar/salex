import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BrandMark } from '../components/premium/BrandMark';
import { Colors } from '../theme/premium';

interface SplashScreenProps {
  navigation: {
    replace: (screen: string) => void;
  };
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.85)).current;

  React.useEffect(() => {
    // Start entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 30,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Pause for 850ms, then replace with WelcomeScreen
    const timer = setTimeout(() => {
      // Outward fade animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('Welcome');
      });
    }, 850);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <BrandMark size={88} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashScreen;
