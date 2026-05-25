/**
 * BookingSuccessOverlay
 *
 * Full-screen success animation that plays over the walk-in booking drawer
 * when "Book Now" is tapped and the booking is created.
 *
 * Matches the Transitions.dev spec:
 *   — Wrapper: fade + rotate + Y-bob (spring) + blur (via opacity)
 *   — Checkmark: stroke-draw illusion via animated scaleX on two arms
 *   — No SVG lib needed: pure RN Animated API
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Colors } from '../../theme/config';

const { width: SW, height: SH } = Dimensions.get('window');

interface BookingSuccessOverlayProps {
  visible: boolean;
  amount: number;
  timeStr: string;
  onAnimationEnd?: () => void;
}

const BookingSuccessOverlay: React.FC<BookingSuccessOverlayProps> = ({
  visible,
  amount,
  timeStr,
  onAnimationEnd,
}) => {
  // ── Wrapper animations (fade + rotate + Y-bob) ──────────────────────
  const opacity    = useRef(new Animated.Value(0)).current;
  const rotate     = useRef(new Animated.Value(1)).current; // 1 = 80deg, 0 = 0deg
  const translateY = useRef(new Animated.Value(1)).current; // 1 = +40px, 0 = 0

  // ── Circle scale pop ────────────────────────────────────────────────
  const circleScale = useRef(new Animated.Value(0)).current;

  // ── Check arm animations ─────────────────────────────────────────────
  // The checkmark has two arms: a short "left arm" (/) and a long "right arm" (\)
  const shortArmScale = useRef(new Animated.Value(0)).current;
  const longArmScale  = useRef(new Animated.Value(0)).current;

  // ── Text fade ────────────────────────────────────────────────────────
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(12)).current;

  // ── Background overlay ───────────────────────────────────────────────
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      // Reset all values immediately
      opacity.setValue(0);
      rotate.setValue(1);
      translateY.setValue(1);
      circleScale.setValue(0);
      shortArmScale.setValue(0);
      longArmScale.setValue(0);
      textOpacity.setValue(0);
      textTranslateY.setValue(12);
      bgOpacity.setValue(0);
      return;
    }

    const EASE_OUT    = Easing.bezier(0.22, 1, 0.36, 1);
    const EASE_SPRING = Easing.bezier(0.34, 1.35, 0.64, 1);
    const EASE_PATH   = Easing.bezier(0.22, 1, 0.36, 1);

    // 1. Background fades in
    Animated.timing(bgOpacity, {
      toValue: 1,
      duration: 300,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start();

    // 2. Wrapper: fade + rotate + Y-bob in parallel (t=0)
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 550,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 0,
        duration: 550,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 450,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Circle pops in with spring overshoot (t=0)
    Animated.spring(circleScale, {
      toValue: 1,
      delay: 0,
      tension: 180,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // 4. Short arm draws (t=80ms) — left downstroke of the check
    Animated.timing(shortArmScale, {
      toValue: 1,
      duration: 200,
      delay: 80,
      easing: EASE_PATH,
      useNativeDriver: true,
    }).start();

    // 5. Long arm draws after short arm (t=80+200=280ms)
    Animated.timing(longArmScale, {
      toValue: 1,
      duration: 300,
      delay: 280,
      easing: EASE_PATH,
      useNativeDriver: true,
    }).start();

    // 6. Text slides up and fades in (t=350ms)
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        delay: 350,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 400,
        delay: 350,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
    ]).start();

    // 7. Auto-close after 1.8s total
    const closeTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 300,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationEnd?.();
      });
    }, 1800);

    return () => clearTimeout(closeTimer);
  }, [visible]);

  if (!visible) return null;

  const rotateInterp = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '80deg'],
  });

  const translateYInterp = translateY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  return (
    <Animated.View
      style={[styles.backdrop, { opacity: bgOpacity }]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            opacity,
            transform: [
              { rotate: rotateInterp },
              { translateY: translateYInterp },
            ],
          },
        ]}
      >
        {/* ── Green circle ── */}
        <Animated.View
          style={[
            styles.circle,
            { transform: [{ scale: circleScale }] },
          ]}
        >
          {/* ── Checkmark arms ── */}
          {/* Short left arm: bottom-left to midpoint */}
          <Animated.View
            style={[
              styles.checkArmShort,
              {
                transformOrigin: 'left bottom',
                transform: [
                  { translateX: -1 },
                  { translateY: 0 },
                  { rotate: '45deg' },
                  { scaleX: shortArmScale },
                ],
              },
            ]}
          />
          {/* Long right arm: midpoint to top-right */}
          <Animated.View
            style={[
              styles.checkArmLong,
              {
                transform: [
                  { translateX: 7 },
                  { translateY: -3 },
                  { rotate: '-55deg' },
                  { scaleX: longArmScale },
                ],
              },
            ]}
          />
        </Animated.View>

        {/* ── Label text ── */}
        <Animated.View
          style={[
            styles.labelWrapper,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.successLabel}>Booking Confirmed!</Text>
          <Text style={styles.successSub}>
            ₹{amount} · {timeStr}
          </Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const CIRCLE = 88;
const STROKE = 5;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 3, 31, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: Colors.SALEX_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.SALEX_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
  // Short left arm of the checkmark (going down-left → mid)
  checkArmShort: {
    position: 'absolute',
    width: 18,
    height: STROKE,
    backgroundColor: '#fff',
    borderRadius: STROKE / 2,
    left: '50%',
    top: '50%',
    marginLeft: -18,
    marginTop: 4,
  },
  // Long right arm of the checkmark (mid → up-right)
  checkArmLong: {
    position: 'absolute',
    width: 32,
    height: STROKE,
    backgroundColor: '#fff',
    borderRadius: STROKE / 2,
    left: '50%',
    top: '50%',
    marginLeft: -7,
    marginTop: -6,
  },
  labelWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  successLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  successSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
});

export default BookingSuccessOverlay;
