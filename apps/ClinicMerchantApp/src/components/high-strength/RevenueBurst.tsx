/**
 * RevenueBurst Component
 * 
 * Full-screen celebration animation when revenue milestones are hit.
 * 128pt green number fills the screen with heavy haptic feedback.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, AnimationDurations } from '../../theme/config';
import { CalculatorText } from './CalculatorText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface RevenueBurstProps {
  /** Whether the animation is visible */
  visible: boolean;
  /** The revenue amount to display */
  amount: number;
  /** Callback when animation completes */
  onComplete: () => void;
  /** Test ID for testing */
  testID?: string;
}

export const RevenueBurst: React.FC<RevenueBurstProps> = ({
  visible,
  amount,
  onComplete,
  testID,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const triggerHaptic = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  useEffect(() => {
    if (visible) {
      runAnimation();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      flashAnim.setValue(1);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const runAnimation = async () => {
    // Initial haptic
    await triggerHaptic();

    // Phase 1: Flash (0.1s)
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 2: Scale up (0.3s)
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 3: Pulse 3 times with haptics (0.9s)
    const pulseSequence: Animated.CompositeAnimation[] = [];
    for (let i = 0; i < 3; i++) {
      pulseSequence.push(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ])
      );
    }

    // Run pulses with haptics
    setTimeout(async () => {
      await triggerHaptic();
      Animated.sequence(pulseSequence).start();
    }, 300);

    setTimeout(async () => {
      await triggerHaptic();
    }, 600);

    setTimeout(async () => {
      await triggerHaptic();
    }, 900);

    // Phase 4: Fade out (0.2s) after 1.8s total
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete();
      });
    }, AnimationDurations.revenueBurst - 200);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      testID={testID}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Flash overlay */}
        <Animated.View
          style={[
            styles.flashOverlay,
            {
              opacity: flashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            },
          ]}
        />

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
              ],
            },
          ]}
        >
          <Text style={styles.milestone}>🎉 MILESTONE! 🎉</Text>
          
          <View style={styles.amountContainer}>
            <CalculatorText
              value={amount}
              prefix="₹"
              size="xxl"
              color={Colors.PRIMARY}
            />
          </View>

          <Text style={styles.congratsText}>
            Great work today!
          </Text>
        </Animated.View>

        {/* Confetti particles (simplified) */}
        <View style={styles.confettiContainer}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: i % 2 === 0 ? Colors.PRIMARY : Colors.WARNING,
                  transform: [
                    { rotate: `${Math.random() * 360}deg` },
                    { scale: scaleAnim },
                  ],
                  opacity: opacityAnim,
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.PRIMARY,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  milestone: {
    ...Typography.H2,
    color: Colors.PRIMARY,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 2,
  },
  amountContainer: {
    marginVertical: 20,
  },
  congratsText: {
    ...Typography.H4,
    color: Colors.TEXT_SECONDARY,
    marginTop: 20,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

export default RevenueBurst;
