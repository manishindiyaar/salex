import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/config';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface BookingData {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  servicePrice: number;
  duration: number; // in minutes
  scheduledTime: string; // ISO string
  status: BookingStatus;
  notes?: string;
  createdAt: string;
}

interface BookingCardProps {
  booking: BookingData;
  onAccept?: (bookingId: string) => void;
  onReject?: (bookingId: string) => void;
  onPress?: (booking: BookingData) => void;
  variant?: 'default' | 'compact';
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onAccept,
  onReject,
  onPress,
  variant = 'default',
}) => {
  const statusConfig = getStatusConfig(booking.status);
  const timeFormatted = formatTime(booking.scheduledTime);
  const durationFormatted = `${booking.duration}min`;

  const handlePress = () => {
    if (onPress) {
      onPress(booking);
    }
  };

  return (
    <Card 
      style={StyleSheet.flatten([styles.card, statusConfig.style])}
      onPress={booking.status !== 'PENDING' ? handlePress : undefined}
    >
      <View style={styles.header}>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
        <Text style={styles.timeText}>{timeFormatted}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{booking.customerName}</Text>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{booking.serviceName}</Text>
            <Text style={styles.serviceDetails}>
              ₹{booking.servicePrice} • {durationFormatted}
            </Text>
          </View>
        </View>

        {booking.notes && (
          <View style={styles.notesContainer}>
            <Icon name="message-circle" size={14} color={Colors.TEXT_TERTIARY} />
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}
      </View>

      {booking.status === 'PENDING' && (onAccept || onReject) && (
        <View style={styles.actionsContainer}>
          {onReject && (
            <Button
              title="Decline"
              variant="outline"
              size="small"
              onPress={() => onReject(booking.id)}
              style={styles.actionButton}
            />
          )}
          {onAccept && (
            <Button
              title="Accept"
              variant="primary"
              size="small"
              onPress={() => onAccept(booking.id)}
              style={styles.actionButton}
            />
          )}
        </View>
      )}

      {booking.status === 'CONFIRMED' && (
        <View style={styles.confirmedBadge}>
          <Icon name="check-circle" size={16} color={Colors.CONFIRMED} />
          <Text style={styles.confirmedText}>Confirmed</Text>
        </View>
      )}
    </Card>
  );
};

// Helper function to get status configuration
const getStatusConfig = (status: BookingStatus) => {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Pending',
        color: Colors.PENDING,
        style: {
          borderLeftWidth: 4,
          borderLeftColor: Colors.PENDING,
        },
      };
    case 'CONFIRMED':
      return {
        label: 'Confirmed',
        color: Colors.CONFIRMED,
        style: {
          borderLeftWidth: 4,
          borderLeftColor: Colors.CONFIRMED,
        },
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        color: Colors.CANCELLED,
        style: {
          opacity: 0.7,
          borderLeftWidth: 4,
          borderLeftColor: Colors.CANCELLED,
        },
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        color: Colors.COMPLETED,
        style: {
          opacity: 0.8,
          borderLeftWidth: 4,
          borderLeftColor: Colors.COMPLETED,
        },
      };
    default:
      return {
        label: 'Unknown',
        color: Colors.TEXT_TERTIARY,
        style: {},
      };
  }
};

// Helper function to format time
const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.SM,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.XS,
  },
  statusText: {
    ...Typography.Caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '600',
  },
  content: {
    marginBottom: Spacing.SM,
  },
  customerInfo: {
    marginBottom: Spacing.XS,
  },
  customerName: {
    ...Typography.H4,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    flex: 1,
  },
  serviceDetails: {
    ...Typography.Body2,
    color: Colors.TEXT_TERTIARY,
    fontWeight: '500',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.SM,
    padding: Spacing.SM,
    backgroundColor: Colors.SURFACE_VARIANT,
    borderRadius: BorderRadius.SM,
  },
  notesText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginLeft: Spacing.XS,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.SM,
    marginTop: Spacing.SM,
    paddingTop: Spacing.SM,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
  },
  actionButton: {
    minWidth: 80,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: Spacing.XS,
  },
  confirmedText: {
    ...Typography.Caption,
    color: Colors.CONFIRMED,
    marginLeft: Spacing.XS,
    fontWeight: '600',
  },
});

export default BookingCard;