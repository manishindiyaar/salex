/**
 * BookingDetailDrawer
 * 
 * Bottom drawer showing booking details with action buttons.
 * Actions depend on booking status:
 * - PENDING: Confirm, Reject
 * - CONFIRMED: Cancel, Complete (with Cash/Bank payment selection)
 * 
 * Backend Flow:
 * - PENDING → CONFIRMED (confirm) or REJECTED (reject)
 * - CONFIRMED → COMPLETED (checkout with paymentMode: CASH/UPI)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Feather';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';
import { useHaptics } from '../../hooks/useHaptics';
import { useBookingStore } from '../../store/bookingStore';
import { useBusinessStore } from '../../store/businessStore';
import { CalculatorText } from './CalculatorText';
import { canCallPhone, formatDisplayPhone, openPhoneDialer } from '../../utils/phone';

interface BookingSlot {
  id: string;
  serviceName: string;
  customerPhone: string;
  scheduledAt: string;
  endAt: string;
  totalPrice: number;
  status: string;
  source: string;
  items: any[];
  resource?: { id: string; name: string } | null;
  staff?: { id: string; name: string } | null;
}

interface BookingDetailDrawerProps {
  visible: boolean;
  booking: BookingSlot | null;
  onClose: () => void;
  onStatusChange?: () => void;
}

export const BookingDetailDrawer: React.FC<BookingDetailDrawerProps> = ({
  visible,
  booking,
  onClose,
  onStatusChange,
}) => {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { confirm, cancel, reject, complete } = useBookingStore();
  const { business } = useBusinessStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING': return '#FFA500';
      case 'CONFIRMED': return Colors.SALEX_GREEN;
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED_BY_USER':
      case 'CANCELLED_BY_SALON':
      case 'REJECTED': return Colors.ERROR;
      default: return Colors.TEXT_SECONDARY;
    }
  };

  const handleConfirm = useCallback(async () => {
    if (!booking) return;
    
    // Check if business is suspended before confirming booking
    if (business && business.isActive === false) {
      Alert.alert(
        'Account Suspended',
        'Your business account has been suspended. Booking operations are not available. Please contact support.',
        [{ text: 'OK', onPress: onClose }]
      );
      return;
    }
    
    haptics.medium();
    setIsLoading(true);

    try {
      await confirm(booking.id);
      haptics.heavy();
      onStatusChange?.();
      onClose();
    } catch (error: any) {
      console.error('Confirm failed:', error);
      
      // Check if it's a suspension error
      if (error.message && error.message.includes('Business account is suspended')) {
        Alert.alert(
          'Account Suspended',
          'Your business account has been suspended. Booking operations are not available. Please contact support.',
          [{ text: 'OK', onPress: onClose }]
        );
        return;
      }
      
      Alert.alert('Error', 'Failed to confirm booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [booking, confirm, haptics, onStatusChange, onClose, business]);

  const handleReject = useCallback(async () => {
    if (!booking) return;
    
    // Check if business is suspended before rejecting booking
    if (business && business.isActive === false) {
      Alert.alert(
        'Account Suspended',
        'Your business account has been suspended. Booking operations are not available. Please contact support.',
        [{ text: 'OK', onPress: onClose }]
      );
      return;
    }
    
    haptics.medium();
    setIsLoading(true);

    try {
      await reject(booking.id);
      haptics.heavy();
      onStatusChange?.();
      onClose();
    } catch (error: any) {
      console.error('Reject failed:', error);
      
      // Check if it's a suspension error
      if (error.message && error.message.includes('Business account is suspended')) {
        Alert.alert(
          'Account Suspended',
          'Your business account has been suspended. Booking operations are not available. Please contact support.',
          [{ text: 'OK', onPress: onClose }]
        );
        return;
      }
      
      Alert.alert('Error', 'Failed to reject booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [booking, reject, haptics, onStatusChange, onClose, business]);

  const handleCancel = useCallback(async () => {
    if (!booking) return;
    
    // Check if business is suspended before canceling booking
    if (business && business.isActive === false) {
      Alert.alert(
        'Account Suspended',
        'Your business account has been suspended. Booking operations are not available. Please contact support.',
        [{ text: 'OK', onPress: onClose }]
      );
      return;
    }
    
    haptics.medium();
    setIsLoading(true);

    try {
      await cancel(booking.id);
      haptics.heavy();
      onStatusChange?.();
      onClose();
    } catch (error: any) {
      console.error('Cancel failed:', error);
      
      // Check if it's a suspension error
      if (error.message && error.message.includes('Business account is suspended')) {
        Alert.alert(
          'Account Suspended',
          'Your business account has been suspended. Booking operations are not available. Please contact support.',
          [{ text: 'OK', onPress: onClose }]
        );
        return;
      }
      
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [booking, cancel, haptics, onStatusChange, onClose, business]);

  const handleComplete = useCallback(async (paymentMethod: 'CASH' | 'BANK') => {
    if (!booking) return;
    
    // Check if business is suspended before completing booking
    if (business && business.isActive === false) {
      Alert.alert(
        'Account Suspended',
        'Your business account has been suspended. Booking operations are not available. Please contact support.',
        [{ text: 'OK', onPress: onClose }]
      );
      return;
    }
    
    haptics.heavy();
    setIsLoading(true);

    try {
      await complete(booking.id, paymentMethod);
      haptics.heavy();
      setShowPaymentOptions(false);
      onStatusChange?.();
      onClose();
    } catch (error: any) {
      console.error('Complete failed:', error);
      
      // Check if it's a suspension error
      if (error.message && error.message.includes('Business account is suspended')) {
        Alert.alert(
          'Account Suspended',
          'Your business account has been suspended. Booking operations are not available. Please contact support.',
          [{ text: 'OK', onPress: onClose }]
        );
        return;
      }
      
      Alert.alert('Error', 'Failed to complete booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [booking, complete, haptics, onStatusChange, onClose, business]);

  const confirmAction = (action: string) => {
    switch (action) {
      case 'confirm':
        Alert.alert(
          'Confirm Booking',
          'Are you sure you want to confirm this booking?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: handleConfirm },
          ]
        );
        break;
      case 'reject':
        Alert.alert(
          'Reject Booking',
          'Are you sure you want to reject this booking?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reject', style: 'destructive', onPress: handleReject },
          ]
        );
        break;
      case 'cancel':
        Alert.alert(
          'Cancel Booking',
          'Are you sure you want to cancel this booking?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes, Cancel', style: 'destructive', onPress: handleCancel },
          ]
        );
        break;
    }
  };

  if (!booking) return null;

  const statusColor = getStatusColor(booking.status);
  const isPending = booking.status === 'PENDING';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isTerminal = ['COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_SALON', 'REJECTED'].includes(booking.status);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={[styles.drawer, { paddingBottom: insets.bottom + Spacing.LG }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {booking.status.replace(/_/g, ' ')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={24} color={Colors.TEXT} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Price */}
            <View style={styles.priceContainer}>
              <CalculatorText
                value={booking.totalPrice}
                prefix="₹"
                size="lg"
                color={Colors.SALEX_GREEN}
              />
            </View>

            {/* Service Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SERVICE</Text>
              <Text style={styles.serviceName}>{booking.serviceName}</Text>
            </View>

            {/* Time Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SCHEDULED</Text>
              <View style={styles.timeRow}>
                <Icon name="calendar" size={16} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.timeText}>{formatDate(booking.scheduledAt)}</Text>
              </View>
              <View style={styles.timeRow}>
                <Icon name="clock" size={16} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.timeText}>
                  {formatTime(booking.scheduledAt)} - {formatTime(booking.endAt)}
                </Text>
              </View>
            </View>

            {/* Customer Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CUSTOMER</Text>
              {canCallPhone(booking.customerPhone) ? (
                <>
                  <View style={styles.customerRow}>
                    <Icon name="phone" size={16} color={Colors.TEXT_SECONDARY} />
                    <Text style={styles.customerText}>
                      {formatDisplayPhone(booking.customerPhone)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callCustomerButton}
                    onPress={() => {
                      haptics.light();
                      openPhoneDialer(booking.customerPhone);
                    }}
                    activeOpacity={0.7}
                    accessibilityLabel="Call customer"
                    accessibilityRole="button"
                  >
                    <Icon name="phone" size={16} color={Colors.SALEX_GREEN} />
                    <Text style={styles.callCustomerText}>Call Customer</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.customerRow}>
                  <Icon name="user" size={16} color={Colors.TEXT_TERTIARY} />
                  <Text style={styles.noContactText}>No contact number saved</Text>
                </View>
              )}
              {booking.source === 'whatsapp' && (
                <View style={styles.sourceRow}>
                  <Text style={styles.sourceEmoji}>💬</Text>
                  <Text style={styles.sourceText}>Booked via WhatsApp</Text>
                </View>
              )}
            </View>

            {/* Allocation Info */}
            {(booking.resource || booking.staff) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ASSIGNED TO</Text>
                {booking.resource && (
                  <View style={styles.allocationRow}>
                    <Icon name="grid" size={16} color={Colors.PRIMARY} />
                    <Text style={styles.allocationText}>{booking.resource.name}</Text>
                  </View>
                )}
                {booking.staff && (
                  <View style={styles.allocationRow}>
                    <Icon name="user" size={16} color={Colors.PRIMARY} />
                    <Text style={styles.allocationText}>{booking.staff.name}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Items */}
            {booking.items && booking.items.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ITEMS</Text>
                {booking.items.map((item: any, index: number) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.nameSnapshot || 'Service'}</Text>
                    <Text style={styles.itemPrice}>₹{Number(item.priceSnapshot || 0)}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          {!isTerminal && (
            <View style={styles.actionsContainer}>
              {isPending && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => confirmAction('reject')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.ERROR} size="small" />
                    ) : (
                      <>
                        <Icon name="x" size={20} color={Colors.ERROR} />
                        <Text style={[styles.actionText, { color: Colors.ERROR }]}>Reject</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={() => confirmAction('confirm')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.BACKGROUND} size="small" />
                    ) : (
                      <>
                        <Icon name="check" size={20} color={Colors.BACKGROUND} />
                        <Text style={[styles.actionText, { color: Colors.BACKGROUND }]}>Confirm</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
              {isConfirmed && !showPaymentOptions && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => confirmAction('cancel')}
                    disabled={isLoading}
                  >
                    <Icon name="x-circle" size={20} color={Colors.ERROR} />
                    <Text style={[styles.actionText, { color: Colors.ERROR }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => {
                      haptics.light();
                      setShowPaymentOptions(true);
                    }}
                    disabled={isLoading}
                  >
                    <Icon name="check-circle" size={20} color={Colors.BACKGROUND} />
                    <Text style={[styles.actionText, { color: Colors.BACKGROUND }]}>Complete</Text>
                  </TouchableOpacity>
                </>
              )}
              {isConfirmed && showPaymentOptions && (
                <View style={styles.paymentOptionsContainer}>
                  <Text style={styles.paymentTitle}>Select Payment Method</Text>
                  <View style={styles.paymentButtons}>
                    <TouchableOpacity
                      style={[styles.paymentButton, styles.cashButton]}
                      onPress={() => handleComplete('CASH')}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={Colors.SALEX_GREEN} size="small" />
                      ) : (
                        <>
                          <Icon name="dollar-sign" size={24} color={Colors.SALEX_GREEN} />
                          <Text style={styles.paymentButtonText}>Cash</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.paymentButton, styles.bankButton]}
                      onPress={() => handleComplete('BANK')}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#00AAFF" size="small" />
                      ) : (
                        <>
                          <Icon name="smartphone" size={24} color="#00AAFF" />
                          <Text style={[styles.paymentButtonText, { color: '#00AAFF' }]}>UPI/Bank</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setShowPaymentOptions(false)}
                  >
                    <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawer: {
    backgroundColor: Colors.BACKGROUND,
    borderTopLeftRadius: BorderRadius.XL,
    borderTopRightRadius: BorderRadius.XL,
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.SM,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.BORDER,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.ROUND,
    gap: Spacing.XS,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...Typography.Caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.SURFACE_VARIANT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: Spacing.LG,
  },
  priceContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.XL,
  },
  section: {
    marginBottom: Spacing.LG,
  },
  sectionTitle: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.SM,
  },
  serviceName: {
    ...Typography.H3,
    color: Colors.TEXT,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  timeText: {
    ...Typography.Body1,
    color: Colors.TEXT,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  customerText: {
    ...Typography.Body1,
    color: Colors.TEXT,
  },
  noContactText: {
    ...Typography.Body1,
    color: Colors.TEXT_TERTIARY,
    fontStyle: 'italic',
  },
  callCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
    marginTop: Spacing.SM,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    backgroundColor: Colors.SALEX_GREEN + '15',
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: Colors.SALEX_GREEN + '30',
    alignSelf: 'flex-start',
  },
  callCustomerText: {
    ...Typography.Body2,
    color: Colors.SALEX_GREEN,
    fontWeight: '600',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
    marginTop: Spacing.XS,
  },
  sourceEmoji: {
    fontSize: 14,
  },
  sourceText: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  allocationText: {
    ...Typography.Body1,
    color: Colors.TEXT,
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
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.LG,
    gap: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.LG,
    gap: Spacing.SM,
  },
  rejectButton: {
    backgroundColor: Colors.ERROR + '20',
    borderWidth: 1,
    borderColor: Colors.ERROR,
  },
  confirmButton: {
    backgroundColor: Colors.SALEX_GREEN,
  },
  cancelButton: {
    backgroundColor: Colors.ERROR + '20',
    borderWidth: 1,
    borderColor: Colors.ERROR,
  },
  completeButton: {
    backgroundColor: Colors.SALEX_GREEN,
  },
  actionText: {
    ...Typography.Body1,
    fontWeight: '700',
  },
  paymentOptionsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  paymentTitle: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
    marginBottom: Spacing.MD,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: Spacing.MD,
    width: '100%',
  },
  paymentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.LG,
    borderRadius: BorderRadius.LG,
    borderWidth: 2,
    gap: Spacing.SM,
  },
  cashButton: {
    backgroundColor: Colors.SALEX_GREEN + '15',
    borderColor: Colors.SALEX_GREEN,
  },
  bankButton: {
    backgroundColor: '#00AAFF15',
    borderColor: '#00AAFF',
  },
  paymentButtonText: {
    ...Typography.Body1,
    color: Colors.SALEX_GREEN,
    fontWeight: '700',
  },
  backButton: {
    marginTop: Spacing.MD,
    paddingVertical: Spacing.SM,
  },
  backButtonText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
});

export default BookingDetailDrawer;
