import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../theme/premium';

interface IllustrationStageProps {
  index: number;
}

export const IllustrationStage: React.FC<IllustrationStageProps> = ({ index }) => {
  // Let's add minor floating animation to make illustrations feel "alive"
  const floatAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const renderIllustration = () => {
    switch (index) {
      case 0:
        // Slide 1: Salon mirror, scissors abstract motif
        return (
          <View style={styles.stage}>
            <View style={[styles.circleBackdrop, { backgroundColor: Colors.accentOlive + '15' }]} />
            <Animated.View style={[styles.mainElement, { transform: [{ translateY }] }]}>
              {/* Abstract Mirror frame */}
              <View style={[styles.archFrame, { borderColor: Colors.accentGold }]} />
              {/* Petal reflection */}
              <View style={[styles.floatingPetal, { backgroundColor: Colors.accentRose + '80' }]} />
              {/* Cut reflection line */}
              <View style={[styles.diagonalLine, { backgroundColor: Colors.primaryInk }]} />
              <View style={[styles.diagonalLineOffset, { backgroundColor: Colors.primaryInk }]} />
            </Animated.View>
          </View>
        );
      case 1:
        // Slide 2: Bookings, staff, slots grid composition
        return (
          <View style={styles.stage}>
            <View style={[styles.circleBackdrop, { backgroundColor: Colors.accentRose + '15' }]} />
            <Animated.View style={[styles.mainElement, { transform: [{ translateY }] }]}>
              {/* Grid cards */}
              <View style={styles.gridCard} />
              <View style={[styles.gridCardSecondary, { borderColor: Colors.accentOlive }]} />
              {/* Stylist profile marker */}
              <View style={[styles.stylistMarker, { backgroundColor: Colors.accentGold }]} />
              {/* Booking slot pill */}
              <View style={[styles.bookingSlotPill, { backgroundColor: Colors.primaryInk }]} />
            </Animated.View>
          </View>
        );
      case 2:
        // Slide 3: Salon business planning/dashboard overview
        return (
          <View style={styles.stage}>
            <View style={[styles.circleBackdrop, { backgroundColor: Colors.accentGold + '15' }]} />
            <Animated.View style={[styles.mainElement, { transform: [{ translateY }] }]}>
              {/* Editorial line graphs/columns */}
              <View style={[styles.graphColumn, styles.graphCol1, { height: 75, backgroundColor: Colors.accentOlive + '60' }]} />
              <View style={[styles.graphColumn, styles.graphCol2, { height: 105, backgroundColor: Colors.primaryInk }]} />
              <View style={[styles.graphColumn, styles.graphCol3, { height: 60, backgroundColor: Colors.accentRose + '60' }]} />
              {/* Rising balance bubble */}
              <View style={[styles.risingBubble, { backgroundColor: Colors.accentGold }]} />
            </Animated.View>
          </View>
        );
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderIllustration()}</View>;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  stage: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleBackdrop: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  mainElement: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Slide 1 elements
  archFrame: {
    width: 72,
    height: 96,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 2,
    position: 'absolute',
  },
  floatingPetal: {
    width: 28,
    height: 44,
    borderRadius: 14,
    position: 'absolute',
    bottom: 32,
    right: 36,
    transform: [{ rotate: '-15deg' }],
  },
  diagonalLine: {
    width: 2,
    height: 56,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  diagonalLineOffset: {
    width: 2,
    height: 56,
    position: 'absolute',
    transform: [{ rotate: '-45deg' }],
  },
  // Slide 2 elements
  gridCard: {
    width: 72,
    height: 88,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primaryInk,
    backgroundColor: Colors.white,
    position: 'absolute',
    left: 32,
    top: 32,
  },
  gridCardSecondary: {
    width: 56,
    height: 64,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: Colors.white,
    position: 'absolute',
    right: 32,
    top: 48,
  },
  stylistMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    left: 44,
    top: 68,
  },
  bookingSlotPill: {
    width: 40,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    right: 40,
    top: 60,
  },
  // Slide 3 elements
  graphColumn: {
    width: 18,
    borderRadius: 9,
    position: 'absolute',
    bottom: 24,
  },
  graphCol1: {
    left: 44,
  },
  graphCol2: {
    left: 71,
  },
  graphCol3: {
    left: 98,
  },
  risingBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: 'absolute',
    top: 24,
    left: 48,
  },
});

