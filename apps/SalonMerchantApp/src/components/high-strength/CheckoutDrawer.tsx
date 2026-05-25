/**
 * CheckoutDrawer Component
 * 
 * Physical reconcile checkout with drag-to-pay functionality.
 * Drag the total amount into CASH or BANK targets to complete payment.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon from '@expo/vector-icons/Feather';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme/config';
import { CalculatorText } from './CalculatorText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TARGET_SIZE = 100;
const DRAG_THRESHOLD = 60;

export type PaymentMethod = 'CASH' | 'BANK';

export interface BookingItem {
  name: string;
  price: number;
}

export interface CheckoutBooking {
  id: string;
  phoneNumber: string;
  items: BookingItem[];
  totalPrice: number;
  startTime: string;
}

export interface CheckoutDrawerProps {
  visible: boolean;
  booking: CheckoutBooking | null;
  onCheckout: (bookingId: string, paymentMethod: PaymentMethod) => Promise<void>;
  onClose: () => void;
  testID?: string;
}

const formatPhoneNumber = (phone: string): string => {
  if (phone.startsWith('+91') && phone.length === 13) {
    return `${phone.slice(0, 3)} ${phone.slice(3, 8)} ${phone.slice(8)}`;
  }
  return phone;
};

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return isToday ? `Today ${timeStr}` : date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  }) + ` ${timeStr}`;
};

export const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({
  visible,
  booking,
  onCheckout,
  onClose,
  testID,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredTarget, setHoveredTarget] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetsMeasured, setTargetsMeasured] = useState(false);

  const cashTargetRef = useRef<View>(null);
  const bankTargetRef = useRef<View>(null);
  const cashPosition = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const bankPosition = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  // Store booking ref for panResponder
  const bookingRef = useRef(booking);
  bookingRef.current = booking;

  const triggerHaptic = async (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(style);
    }
  };

  const checkTargetHit = useCallback((x: number, y: number): PaymentMethod | null => {
    const cash = cashPosition.current;
    const bank = bankPosition.current;
    
    // Check CASH target (left side)
    if (
      x >= cash.x - DRAG_THRESHOLD &&
      x <= cash.x + cash.width + DRAG_THRESHOLD &&
      y >= cash.y - DRAG_THRESHOLD &&
      y <= cash.y + cash.height + DRAG_THRESHOLD
    ) {
      return 'CASH';
    }

    // Check BANK target (right side)
    if (
      x >= bank.x - DRAG_THRESHOLD &&
      x <= bank.x + bank.width + DRAG_THRESHOLD &&
      y >= bank.y - DRAG_THRESHOLD &&
      y <= bank.y + bank.height + DRAG_THRESHOLD
    ) {
      return 'BANK';
    }

    return null;
  }, []);

  const resetPosition = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
    ]).start();
  }, [translateX, translateY, scale]);

  const handleCheckout = useCallback(async (target: PaymentMethod) => {
    const currentBooking = bookingRef.current;
    if (!currentBooking) return;
    
    console.log('💳 Processing checkout:', currentBooking.id, 'via', target);
    setIsProcessing(true);
    
    try {
      await onCheckout(currentBooking.id, target);
      console.log('✅ Checkout successful');
    } catch (error) {
      console.error('❌ Checkout failed:', error);
    } finally {
      setIsProcessing(false);
      resetPosition();
    }
  }, [onCheckout, resetPosition]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isProcessing,
      onMoveShouldSetPanResponder: () => !isProcessing,

      onPanResponderGrant: () => {
        setIsDragging(true);
        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: true,
        }).start();
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      },

      onPanResponderMove: (evt, gestureState) => {
        translateX.setValue(gestureState.dx);
        translateY.setValue(gestureState.dy);

        // Check if hovering over a target using page coordinates
        const pageX = evt.nativeEvent.pageX;
        const pageY = evt.nativeEvent.pageY;
        const target = checkTargetHit(pageX, pageY);

        if (target !== hoveredTarget) {
          setHoveredTarget(target);
          if (target) {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
      },

      onPanResponderRelease: async (evt) => {
        setIsDragging(false);
        
        const pageX = evt.nativeEvent.pageX;
        const pageY = evt.nativeEvent.pageY;
        const target = checkTargetHit(pageX, pageY);

        console.log('🎯 Drop position:', { pageX, pageY }, 'Target:', target);
        console.log('📍 Cash position:', cashPosition.current);
        console.log('📍 Bank position:', bankPosition.current);

        if (target) {
          // Success - dropped on target
          await triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
          
          // Animate shrink then process
          Animated.spring(scale, {
            toValue: 0.5,
            useNativeDriver: true,
          }).start(() => {
            handleCheckout(target);
          });
        } else {
          // Return to center
          resetPosition();
        }

        setHoveredTarget(null);
      },
    })
  ).current;

  const measureTargets = useCallback(() => {
    // Delay measurement to ensure layout is complete
    setTimeout(() => {
      cashTargetRef.current?.measureInWindow((x, y, width, height) => {
        cashPosition.current = { x, y, width, height };
        console.log('📏 Cash target measured:', { x, y, width, height });
      });
      bankTargetRef.current?.measureInWindow((x, y, width, height) => {
        bankPosition.current = { x, y, width, height };
        console.log('📏 Bank target measured:', { x, y, width, height });
        setTargetsMeasured(true);
      });
    }, 100);
  }, []);

  // Reset state when drawer opens/closes
  useEffect(() => {
    if (visible) {
      resetPosition();
      setHoveredTarget(null);
      setIsProcessing(false);
      setTargetsMeasured(false);
    }
  }, [visible, resetPosition]);

  if (!booking) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.overlay}>
        <View style={styles.drawer} onLayout={measureTargets}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={24} color={Colors.TEXT_SECONDARY} />
            </TouchableOpacity>
            <Text style={styles.title}>CHECKOUT</Text>
            <View style={styles.closeButton} />
          </View>

          {/* Draggable Amount */}
          <View style={styles.amountContainer}>
            <Animated.View
              style={[
                styles.draggableAmount,
                {
                  transform: [
                    { translateX },
                    { translateY },
                    { scale },
                  ],
                },
                isDragging && styles.draggableAmountActive,
              ]}
              {...panResponder.panHandlers}
            >
              <CalculatorText
                value={booking.totalPrice}
                prefix="₹"
                size="xl"
                color={Colors.PRIMARY}
              />
              <Text style={styles.dragHint}>
                {isProcessing ? 'PROCESSING...' : isDragging ? 'DROP ON TARGET' : '← DRAG TO PAY →'}
              </Text>
            </Animated.View>
          </View>

          {/* Booking Info */}
          <View style={styles.bookingInfo}>
            <Text style={styles.phoneNumber}>
              📱 {formatPhoneNumber(booking.phoneNumber)} • {formatTime(booking.startTime)}
            </Text>
          </View>

          {/* Items List */}
          <View style={styles.itemsList}>
            {booking.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
            ))}
          </View>

          {/* Payment Targets */}
          <View style={styles.targetsContainer}>
            <View
              ref={cashTargetRef}
              style={[
                styles.paymentTarget,
                hoveredTarget === 'CASH' && styles.paymentTargetHovered,
                hoveredTarget === 'CASH' && { borderColor: Colors.PRIMARY },
              ]}
            >
              <Text style={styles.targetEmoji}>💵</Text>
              <Text style={[
                styles.targetLabel,
                hoveredTarget === 'CASH' && styles.targetLabelHovered,
              ]}>
                CASH
              </Text>
            </View>

            <View
              ref={bankTargetRef}
              style={[
                styles.paymentTarget,
                hoveredTarget === 'BANK' && styles.paymentTargetHovered,
                hoveredTarget === 'BANK' && { borderColor: Colors.SECONDARY },
              ]}
            >
              <Text style={styles.targetEmoji}>🏦</Text>
              <Text style={[
                styles.targetLabel,
                hoveredTarget === 'BANK' && styles.targetLabelHovered,
              ]}>
                BANK
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: Colors.SURFACE,
    borderTopLeftRadius: BorderRadius.XL,
    borderTopRightRadius: BorderRadius.XL,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.LG,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.H3,
    color: Colors.TEXT,
    fontWeight: '700',
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.XXL,
  },
  draggableAmount: {
    backgroundColor: Colors.BACKGROUND,
    paddingHorizontal: Spacing.XXL,
    paddingVertical: Spacing.XL,
    borderRadius: BorderRadius.XL,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.PRIMARY + '50',
    ...Shadows.LG,
  },
  draggableAmountActive: {
    borderColor: Colors.PRIMARY,
    ...Shadows.XL,
  },
  dragHint: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
    marginTop: Spacing.SM,
    letterSpacing: 1,
  },
  bookingInfo: {
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    marginBottom: Spacing.MD,
  },
  phoneNumber: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  itemsList: {
    paddingHorizontal: Spacing.LG,
    marginBottom: Spacing.XL,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  itemName: {
    ...Typography.Body1,
    color: Colors.TEXT,
  },
  itemPrice: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '600',
  },
  targetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.LG,
  },
  paymentTarget: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: TARGET_SIZE / 2,
    backgroundColor: Colors.SURFACE_VARIANT,
    borderWidth: 3,
    borderColor: Colors.BORDER,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTargetHovered: {
    backgroundColor: Colors.PRIMARY + '20',
    borderStyle: 'solid',
  },
  targetEmoji: {
    fontSize: 32,
    marginBottom: Spacing.XS,
  },
  targetLabel: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '700',
  },
  targetLabelHovered: {
    color: Colors.TEXT,
  },
});

export default CheckoutDrawer;
