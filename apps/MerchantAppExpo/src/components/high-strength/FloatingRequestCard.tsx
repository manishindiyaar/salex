/**
 * FloatingRequestCard Component
 * 
 * Swipeable card for WhatsApp booking requests.
 * Swipe UP to accept, swipe DOWN to deny.
 * Heavy haptic feedback on threshold crossing.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme/config';
import { CalculatorText } from './CalculatorText';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

export interface PendingBookingService {
  name: string;
  price: number;
  duration: number;
}

export interface PendingBooking {
  id: string;
  phoneNumber: string;
  services: PendingBookingService[];
  totalPrice: number;
  totalDuration: number;
  requestedTime: string; // ISO string
  createdAt: string;
}

export interface FloatingRequestCardProps {
  booking: PendingBooking;
  onAccept: (bookingId: string) => Promise<void>;
  onDeny: (bookingId: string) => Promise<void>;
  testID?: string;
}

const formatPhoneNumber = (phone: string): string => {
  if (phone.startsWith('+91') && phone.length === 13) {
    return `${phone.slice(0, 3)} ${phone.slice(3, 8)} ${phone.slice(8)}`;
  }
  return phone;
};

const formatRequestedTime = (isoString: string): string => {
  const date = new Date(isoString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return isToday ? `Today, ${timeStr}` : date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  }) + `, ${timeStr}`;
};

export const FloatingRequestCard: React.FC<FloatingRequestCardProps> = ({
  booking,
  onAccept,
  onDeny,
  testID,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const hasTriggeredHaptic = useRef(false);
  const isAnimating = useRef(false);

  const triggerHaptic = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        hasTriggeredHaptic.current = false;
        Animated.spring(scale, {
          toValue: 0.98,
          useNativeDriver: true,
        }).start();
      },

      onPanResponderMove: (_, gestureState) => {
        if (isAnimating.current) return;

        translateY.setValue(gestureState.dy);

        // Trigger haptic when crossing threshold
        if (Math.abs(gestureState.dy) > SWIPE_THRESHOLD && !hasTriggeredHaptic.current) {
          hasTriggeredHaptic.current = true;
          triggerHaptic();
        }
      },

      onPanResponderRelease: async (_, gestureState) => {
        if (isAnimating.current) return;

        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        // Check if swipe exceeded threshold
        if (gestureState.dy < -SWIPE_THRESHOLD) {
          // Swipe UP - Accept
          isAnimating.current = true;
          await triggerHaptic();
          
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -SCREEN_HEIGHT,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(async () => {
            await onAccept(booking.id);
          });
        } else if (gestureState.dy > SWIPE_THRESHOLD) {
          // Swipe DOWN - Deny
          isAnimating.current = true;
          await triggerHaptic();
          
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: SCREEN_HEIGHT,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(async () => {
            await onDeny(booking.id);
          });
        } else {
          // Return to center
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Calculate rotation based on swipe
  const rotate = translateY.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-5deg', '0deg', '5deg'],
    extrapolate: 'clamp',
  });

  // Calculate hint opacity
  const acceptHintOpacity = translateY.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const denyHintOpacity = translateY.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0.3, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrapper} testID={testID}>
      {/* Swipe Hints */}
      <Animated.View style={[styles.hintContainer, styles.hintTop, { opacity: acceptHintOpacity }]}>
        <Icon name="chevron-up" size={24} color={Colors.PRIMARY} />
        <Text style={styles.hintText}>SWIPE UP TO ACCEPT</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateY },
              { rotate },
              { scale },
            ],
            opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.headerText}>NEW BOOKING REQUEST</Text>
          </View>
        </View>

        {/* Price Display */}
        <View style={styles.priceContainer}>
          <CalculatorText
            value={booking.totalPrice}
            prefix="₹"
            size="lg"
            color={Colors.PRIMARY}
          />
        </View>

        {/* Customer Info */}
        <View style={styles.customerInfo}>
          <Text style={styles.phoneNumber}>
            📱 {formatPhoneNumber(booking.phoneNumber)}
          </Text>
        </View>

        {/* Services */}
        <View style={styles.servicesContainer}>
          {booking.services.map((service, index) => (
            <View key={index} style={styles.serviceChip}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDetails}>
                ₹{service.price} • {service.duration}min
              </Text>
            </View>
          ))}
        </View>

        {/* Time Info */}
        <View style={styles.timeInfo}>
          <View style={styles.timeRow}>
            <Icon name="calendar" size={14} color={Colors.TEXT_SECONDARY} />
            <Text style={styles.timeText}>{formatRequestedTime(booking.requestedTime)}</Text>
          </View>
          <View style={styles.timeRow}>
            <Icon name="clock" size={14} color={Colors.TEXT_SECONDARY} />
            <Text style={styles.timeText}>Total: {booking.totalDuration} minutes</Text>
          </View>
        </View>
      </Animated.View>

      {/* Deny Hint */}
      <Animated.View style={[styles.hintContainer, styles.hintBottom, { opacity: denyHintOpacity }]}>
        <Text style={[styles.hintText, { color: Colors.ERROR }]}>SWIPE DOWN TO DENY</Text>
        <Icon name="chevron-down" size={24} color={Colors.ERROR} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  hintContainer: {
    position: 'absolute',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  hintTop: {
    top: 60,
  },
  hintBottom: {
    bottom: 60,
  },
  hintText: {
    ...Typography.Caption,
    color: Colors.PRIMARY,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.XL,
    padding: Spacing.XL,
    borderWidth: 2,
    borderColor: Colors.PRIMARY + '50',
    ...Shadows.XL,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY + '20',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.ROUND,
    gap: Spacing.SM,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.PRIMARY,
  },
  headerText: {
    ...Typography.Caption,
    color: Colors.PRIMARY,
    fontWeight: '700',
    letterSpacing: 1,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: Spacing.LG,
    paddingVertical: Spacing.MD,
    backgroundColor: Colors.BACKGROUND,
    borderRadius: BorderRadius.LG,
  },
  customerInfo: {
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  phoneNumber: {
    ...Typography.H4,
    color: Colors.TEXT,
    fontWeight: '600',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.SM,
    marginBottom: Spacing.LG,
  },
  serviceChip: {
    backgroundColor: Colors.SURFACE_VARIANT,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
  },
  serviceName: {
    ...Typography.Body2,
    color: Colors.TEXT,
    fontWeight: '600',
  },
  serviceDetails: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
    marginTop: 2,
  },
  timeInfo: {
    alignItems: 'center',
    gap: Spacing.XS,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  timeText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
});

export default FloatingRequestCard;
