/**
 * TimelineSlot Component
 * 
 * Calendar-style appointment slot with color-coded status.
 * Shows time, phone number, service, and price.
 * Tap to expand for full details and actions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/config';
import { CalculatorText } from './CalculatorText';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type BookingStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export interface TimelineSlotData {
  id: string;
  phoneNumber: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
  startTime: string; // ISO string
  status: BookingStatus;
  /** Progress percentage for IN_PROGRESS bookings (0-100) */
  progress?: number;
}

export interface TimelineSlotProps {
  booking: TimelineSlotData;
  onConfirm?: (id: string) => void;
  onDeny?: (id: string) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onCheckout?: (id: string) => void;
  testID?: string;
}

const getStatusConfig = (status: BookingStatus) => {
  switch (status) {
    case 'PENDING':
      return {
        bgColor: Colors.STATUS_PENDING_BG,
        borderColor: Colors.STATUS_PENDING,
        textColor: Colors.STATUS_PENDING,
        label: '⏳ WAITING',
        icon: 'clock',
      };
    case 'CONFIRMED':
      return {
        bgColor: Colors.STATUS_CONFIRMED_BG,
        borderColor: Colors.STATUS_CONFIRMED,
        textColor: Colors.STATUS_CONFIRMED,
        label: '📅 UPCOMING',
        icon: 'check-circle',
      };
    case 'IN_PROGRESS':
      return {
        bgColor: Colors.STATUS_IN_PROGRESS_BG,
        borderColor: Colors.STATUS_IN_PROGRESS,
        textColor: Colors.STATUS_IN_PROGRESS,
        label: '🔵 IN PROGRESS',
        icon: 'play-circle',
      };
    case 'COMPLETED':
      return {
        bgColor: Colors.STATUS_COMPLETED_BG,
        borderColor: Colors.STATUS_COMPLETED,
        textColor: Colors.STATUS_COMPLETED,
        label: '✓ DONE',
        icon: 'check',
      };
    case 'CANCELLED':
      return {
        bgColor: Colors.STATUS_CANCELLED_BG,
        borderColor: Colors.STATUS_CANCELLED,
        textColor: Colors.STATUS_CANCELLED,
        label: '✕ CANCELLED',
        icon: 'x-circle',
      };
    case 'NO_SHOW':
      return {
        bgColor: 'rgba(136, 136, 136, 0.2)',
        borderColor: Colors.TEXT_TERTIARY,
        textColor: Colors.TEXT_TERTIARY,
        label: '👻 NO SHOW',
        icon: 'user-x',
      };
    default:
      return {
        bgColor: Colors.SURFACE,
        borderColor: Colors.BORDER,
        textColor: Colors.TEXT_SECONDARY,
        label: status,
        icon: 'help-circle',
      };
  }
};

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase();
};

const formatPhoneNumber = (phone: string): string => {
  // Format as +91 98765 43210
  if (phone.startsWith('+91') && phone.length === 13) {
    return `${phone.slice(0, 3)} ${phone.slice(3, 8)} ${phone.slice(8)}`;
  }
  return phone;
};

export const TimelineSlot: React.FC<TimelineSlotProps> = ({
  booking,
  onConfirm,
  onDeny,
  onStart,
  onComplete,
  onCancel,
  onCheckout,
  testID,
}) => {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = getStatusConfig(booking.status);

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const renderActions = () => {
    switch (booking.status) {
      case 'PENDING':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => onConfirm?.(booking.id)}
            >
              <Icon name="check" size={18} color={Colors.TEXT} />
              <Text style={styles.actionButtonText}>CONFIRM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.denyButton]}
              onPress={() => onDeny?.(booking.id)}
            >
              <Icon name="x" size={18} color={Colors.TEXT} />
              <Text style={styles.actionButtonText}>DENY</Text>
            </TouchableOpacity>
          </View>
        );
      case 'CONFIRMED':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => onStart?.(booking.id)}
            >
              <Icon name="play" size={18} color={Colors.TEXT} />
              <Text style={styles.actionButtonText}>START</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => onCancel?.(booking.id)}
            >
              <Icon name="x" size={18} color={Colors.TEXT} />
              <Text style={styles.actionButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        );
      case 'IN_PROGRESS':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => onComplete?.(booking.id)}
            >
              <Icon name="check" size={18} color={Colors.TEXT} />
              <Text style={styles.actionButtonText}>COMPLETE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => onCancel?.(booking.id)}
            >
              <Icon name="x" size={18} color={Colors.TEXT} />
              <Text style={styles.actionButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        );
      case 'COMPLETED':
        return (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.checkoutButton]}
              onPress={() => onCheckout?.(booking.id)}
            >
              <Icon name="credit-card" size={18} color={Colors.BACKGROUND} />
              <Text style={[styles.actionButtonText, { color: Colors.BACKGROUND }]}>
                CHECKOUT
              </Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      testID={testID}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: statusConfig.bgColor,
            borderLeftColor: statusConfig.borderColor,
          },
        ]}
      >
        {/* Compact View */}
        <View style={styles.compactRow}>
          <View style={styles.timeBox}>
            <Text style={styles.timeText}>{formatTime(booking.startTime)}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.phoneNumber}>
              📱 {formatPhoneNumber(booking.phoneNumber)}
            </Text>
            <Text style={styles.serviceText}>
              {booking.serviceName} • ₹{booking.price} • {booking.durationMinutes}min
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <Text style={[styles.statusLabel, { color: statusConfig.textColor }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Progress Bar for IN_PROGRESS */}
        {booking.status === 'IN_PROGRESS' && booking.progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${booking.progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(booking.durationMinutes * (1 - booking.progress / 100))} min left
            </Text>
          </View>
        )}

        {/* Expanded View */}
        {expanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <CalculatorText
                value={booking.price}
                prefix="₹"
                size="md"
                color={statusConfig.textColor}
              />
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Icon name="clock" size={14} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.detailText}>{booking.durationMinutes} minutes</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="scissors" size={14} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.detailText}>{booking.serviceName}</Text>
              </View>
            </View>

            {renderActions()}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.MD,
    borderLeftWidth: 4,
    marginBottom: Spacing.SM,
    overflow: 'hidden',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.MD,
  },
  timeBox: {
    backgroundColor: Colors.SURFACE,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.MD,
  },
  timeText: {
    ...Typography.Body2,
    color: Colors.TEXT,
    fontWeight: '700',
    fontSize: 12,
  },
  infoContainer: {
    flex: 1,
  },
  phoneNumber: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
    marginBottom: 2,
  },
  serviceText: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
  },
  statusContainer: {
    marginLeft: Spacing.SM,
  },
  statusLabel: {
    ...Typography.Caption,
    fontWeight: '700',
    fontSize: 10,
  },
  progressContainer: {
    paddingHorizontal: Spacing.MD,
    paddingBottom: Spacing.SM,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.SURFACE,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.STATUS_IN_PROGRESS,
    borderRadius: 2,
  },
  progressText: {
    ...Typography.Caption,
    color: Colors.STATUS_IN_PROGRESS,
    marginTop: 4,
    textAlign: 'right',
    fontSize: 10,
  },
  expandedContent: {
    paddingHorizontal: Spacing.MD,
    paddingBottom: Spacing.MD,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.BORDER,
    marginBottom: Spacing.MD,
  },
  priceRow: {
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.XL,
    marginBottom: Spacing.LG,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  detailText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    gap: Spacing.XS,
  },
  actionButtonText: {
    ...Typography.Body2,
    color: Colors.TEXT,
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: Colors.STATUS_CONFIRMED,
  },
  denyButton: {
    backgroundColor: Colors.ERROR,
  },
  startButton: {
    backgroundColor: Colors.STATUS_IN_PROGRESS,
  },
  completeButton: {
    backgroundColor: Colors.STATUS_COMPLETED,
  },
  cancelButton: {
    backgroundColor: Colors.ERROR + '80',
  },
  checkoutButton: {
    backgroundColor: Colors.PRIMARY,
  },
});

export default TimelineSlot;
