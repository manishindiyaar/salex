/**
 * RevenueBookingCard
 *
 * A premium "revenue ticket" card for bookings. Designed to make the salon
 * owner feel that every booking is money coming in — part salon booking,
 * part flight ticket, part collectible event card.
 *
 * Emotional anchor: totalPrice.
 *
 * Data contract is intentionally limited to the fields that already exist on a
 * booking slot. No backend changes, no new fields. Optional data is hidden
 * (never shown as an empty placeholder).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/config';
import { CalculatorText } from './CalculatorText';
import { canCallPhone, formatDisplayPhone, openPhoneDialer } from '../../utils/phone';

export interface RevenueBookingCardData {
  id: string;
  serviceName: string;
  customerPhone: string;
  scheduledAt: string;
  endAt?: string | null;
  totalPrice: number;
  status: string;
  source: string;
  items?: any[];
  resource?: { id: string; name: string } | null;
  staff?: { id: string; name: string } | null;
}

export interface RevenueBookingCardProps {
  booking: RevenueBookingCardData;
  onPress?: (booking: RevenueBookingCardData) => void;
  /** Compact mode hides lifecycle timeline and source row for a shorter card. */
  compact?: boolean;
  style?: ViewStyle;
}

// -----------------------------------------------------------------------------
// Status → visual language
// -----------------------------------------------------------------------------

interface StatusVisuals {
  badgeLabel: string;
  moneyLabel: string;
  accent: string;
  /** Stage index in the lifecycle (0..3), or -1 when cancelled/rejected. */
  activeStage: number;
  isCancelled: boolean;
  isCompleted: boolean;
}

const LIFECYCLE_STAGES = ['Requested', 'Confirmed', 'Service', 'Paid'];

const getStatusVisuals = (rawStatus: string): StatusVisuals => {
  const status = (rawStatus || '').toUpperCase();
  const isCancelled = status.includes('CANCELLED') || status === 'REJECTED';

  switch (status) {
    case 'PENDING':
      return {
        badgeLabel: 'NEW REQUEST',
        moneyLabel: 'POTENTIAL',
        accent: Colors.STATUS_PENDING, // restrained gold
        activeStage: 0,
        isCancelled: false,
        isCompleted: false,
      };
    case 'CONFIRMED':
      return {
        badgeLabel: 'CONFIRMED',
        moneyLabel: 'EXPECTED',
        accent: Colors.STATUS_CONFIRMED, // premium green
        activeStage: 1,
        isCancelled: false,
        isCompleted: false,
      };
    case 'IN_PROGRESS':
    case 'IN_SERVICE':
      return {
        badgeLabel: 'IN SERVICE',
        moneyLabel: 'ACTIVE',
        accent: Colors.STATUS_IN_PROGRESS, // deep slate
        activeStage: 2,
        isCancelled: false,
        isCompleted: false,
      };
    case 'COMPLETED':
      return {
        badgeLabel: 'PAID',
        moneyLabel: 'EARNED',
        accent: Colors.STATUS_COMPLETED, // green
        activeStage: 3,
        isCancelled: false,
        isCompleted: true,
      };
    case 'REJECTED':
      return {
        badgeLabel: 'REJECTED',
        moneyLabel: 'LOST',
        accent: Colors.STATUS_CANCELLED, // muted red
        activeStage: -1,
        isCancelled: true,
        isCompleted: false,
      };
    default:
      // CANCELLED_BY_USER / CANCELLED_BY_SALON / unknown
      return {
        badgeLabel: isCancelled ? 'CANCELLED' : status || 'BOOKING',
        moneyLabel: isCancelled ? 'LOST' : 'EXPECTED',
        accent: isCancelled ? Colors.STATUS_NO_SHOW : Colors.TEXT_SECONDARY, // soft grey
        activeStage: -1,
        isCancelled,
        isCompleted: false,
      };
  }
};

// -----------------------------------------------------------------------------
// Source → badge + descriptor
// -----------------------------------------------------------------------------

interface SourceVisuals {
  badge: string;
  descriptor: string;
  icon: keyof typeof Icon.glyphMap;
}

const getSourceVisuals = (rawSource: string): SourceVisuals => {
  const source = (rawSource || '').toLowerCase();
  if (source.includes('whatsapp')) {
    return { badge: 'WHATSAPP', descriptor: 'WhatsApp booking', icon: 'message-circle' };
  }
  if (source.includes('walk')) {
    return { badge: 'WALK-IN', descriptor: 'Walk-in booking', icon: 'user' };
  }
  return { badge: 'MANUAL', descriptor: 'Manual booking', icon: 'edit-3' };
};

// -----------------------------------------------------------------------------
// Formatting helpers
// -----------------------------------------------------------------------------

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/** Returns duration in minutes, or null when end is missing/invalid/<= start. */
const getDurationMinutes = (startIso: string, endIso?: string | null): number | null => {
  if (!endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  const diffMin = Math.round((end - start) / 60000);
  return diffMin > 0 ? diffMin : null;
};

const formatPhone = (phone: string): string => {
  // Use shared utility for display formatting, fallback to raw
  return formatDisplayPhone(phone) || phone;
};

const getAssignmentLabel = (
  resource?: { name: string } | null,
  staff?: { name: string } | null,
): string | null => {
  const resourceName = resource?.name?.trim();
  const staffName = staff?.name?.trim();
  if (resourceName && staffName) return `${resourceName} · ${staffName}`;
  if (resourceName) return resourceName;
  if (staffName) return staffName;
  return null;
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const RevenueBookingCard: React.FC<RevenueBookingCardProps> = ({
  booking,
  onPress,
  compact = false,
  style,
}) => {
  const visuals = getStatusVisuals(booking.status);
  const source = getSourceVisuals(booking.source);
  const { isCancelled, isCompleted, accent } = visuals;

  const startTime = formatTime(booking.scheduledAt);
  const durationMin = getDurationMinutes(booking.scheduledAt, booking.endAt);
  const endTime = durationMin != null && booking.endAt ? formatTime(booking.endAt) : null;
  const phone = formatPhone(booking.customerPhone);
  const isWalkInPhone = !phone || /walk/i.test(booking.customerPhone);
  const isCallable = canCallPhone(booking.customerPhone);
  const assignment = getAssignmentLabel(booking.resource, booking.staff);

  const moneyColor = isCancelled ? Colors.muted : accent;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress ? () => onPress(booking) : undefined}
      disabled={!onPress}
      style={[
        styles.card,
        compact && styles.cardCompact,
        isCompleted && styles.cardCompleted,
        isCancelled && styles.cardCancelled,
        style,
      ]}
    >
      {/* Status accent line — the ticket's color signature */}
      <View style={[styles.accentStrip, { backgroundColor: accent }]} />

      <View style={[styles.body, compact && styles.bodyCompact]}>
        {/* Top row: status + source (left) · money (right) */}
        <View style={styles.topRow}>
          <View style={styles.badgesColumn}>
            <View style={[styles.statusBadge, { backgroundColor: accent + '14', borderColor: accent + '2E' }]}>
              <Text style={[styles.statusBadgeText, { color: accent }]} numberOfLines={1}>
                {visuals.badgeLabel}
              </Text>
            </View>
            {!compact && (
              <View style={styles.sourceRow}>
                <Icon name={source.icon} size={11} color={Colors.TEXT_TERTIARY} />
                <Text style={styles.sourceBadgeText} numberOfLines={1}>
                  {source.badge}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.moneyBlock}>
            <CalculatorText
              value={booking.totalPrice}
              prefix="₹"
              size="sm"
              color={moneyColor}
              style={isCancelled ? styles.moneyCancelled : undefined}
            />
            <Text style={[styles.moneyLabel, { color: isCancelled ? Colors.muted : accent }]}>
              {visuals.moneyLabel}
            </Text>
          </View>
        </View>

        {/* Service name + customer */}
        <Text style={styles.serviceName} numberOfLines={1}>
          {booking.serviceName}
        </Text>
        {!isWalkInPhone ? (
          <View style={styles.metaRow}>
            <Icon name="phone" size={12} color={Colors.TEXT_SECONDARY} />
            <Text style={styles.phoneText}>{phone}</Text>
            {isCallable && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={(e) => {
                  e.stopPropagation?.();
                  openPhoneDialer(booking.customerPhone);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Call customer"
                accessibilityRole="button"
              >
                <Icon name="phone" size={14} color={Colors.SALEX_GREEN} />
              </TouchableOpacity>
            )}
          </View>
        ) : !compact ? (
          <View style={styles.metaRow}>
            <Icon name={source.icon} size={12} color={Colors.TEXT_TERTIARY} />
            <Text style={styles.sourceDescriptor}>{source.descriptor}</Text>
          </View>
        ) : null}

        {/* Time row — flight-ticket inspired */}
        <View style={[styles.timeSection, compact && styles.timeSectionCompact]}>
          <Text style={[styles.timeText, compact && styles.timeTextCompact]}>{startTime}</Text>
          <View style={styles.timeLineWrap}>
            <View style={styles.timeLine} />
            {endTime ? (
              <View style={styles.durationPill}>
                <Icon name="clock" size={9} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.durationText}>{durationMin} min</Text>
              </View>
            ) : null}
            {endTime ? <View style={styles.timeLine} /> : null}
          </View>
          {endTime ? <Text style={[styles.timeText, compact && styles.timeTextCompact]}>{endTime}</Text> : null}
        </View>

        {/* Assignment row — only when resource/staff exists */}
        {assignment ? (
          <View style={styles.assignmentRow}>
            <Icon
              name={booking.resource ? 'grid' : 'user'}
              size={12}
              color={Colors.TEXT_TERTIARY}
            />
            <Text style={styles.assignmentText} numberOfLines={1}>
              {assignment}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Divider + Lifecycle — hidden in compact mode */}
      {!compact && (
        <>
          <View style={styles.divider} />
          <View style={[styles.lifecycle, isCancelled && styles.lifecycleCancelled]}>
            {LIFECYCLE_STAGES.map((stage, i) => {
              const last = i === LIFECYCLE_STAGES.length - 1;
              const dotFilled = !isCancelled && i <= visuals.activeStage;
              const dotActive = !isCancelled && i === visuals.activeStage;
              const leftFilled = !isCancelled && i > 0 && visuals.activeStage >= i;
              const rightFilled = !isCancelled && !last && visuals.activeStage > i;

              return (
                <View key={stage} style={styles.stageCell}>
                  <View style={styles.stageTrack}>
                    <View
                      style={[
                        styles.halfLine,
                        i === 0 && styles.halfLineHidden,
                        leftFilled && { backgroundColor: accent },
                      ]}
                    />
                    <View
                      style={[
                        styles.stageDot,
                        dotFilled && { backgroundColor: accent, borderColor: accent },
                        dotActive && styles.stageDotActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.halfLine,
                        last && styles.halfLineHidden,
                        rightFilled && { backgroundColor: accent },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.stageLabel,
                      dotActive && { color: accent, fontWeight: '700' },
                      isCancelled && styles.stageLabelCancelled,
                    ]}
                    numberOfLines={1}
                  >
                    {stage}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    borderWidth: 1,
    borderColor: 'rgba(3, 3, 31, 0.06)',
    marginBottom: Spacing.MD,
    overflow: 'hidden',
    ...Shadows.MD,
  },
  cardCompact: {
    marginBottom: Spacing.SM,
  },
  cardCompleted: {
    opacity: 0.96,
  },
  cardCancelled: {
    opacity: 0.55,
  },
  accentStrip: {
    height: 3,
  },
  body: {
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.MD,
    paddingBottom: Spacing.SM,
  },
  bodyCompact: {
    paddingTop: Spacing.SM,
    paddingBottom: Spacing.SM,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgesColumn: {
    flexShrink: 1,
    gap: 5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.SM,
    paddingVertical: 3,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: 'Inter-Bold',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.TEXT_TERTIARY,
    fontFamily: 'Inter-Bold',
  },
  moneyBlock: {
    alignItems: 'flex-end',
    paddingLeft: Spacing.SM,
  },
  moneyCancelled: {
    textDecorationLine: 'line-through',
  },
  moneyLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: -1,
    fontFamily: 'Inter-Bold',
  },

  // Service + meta
  serviceName: {
    fontSize: 21,
    lineHeight: 25,
    color: Colors.TEXT,
    fontFamily: 'InstrumentSerif-Regular',
    marginTop: Spacing.SM,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  phoneText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    flex: 1,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.SALEX_GREEN + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceDescriptor: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
  },

  // Time section
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.MD,
  },
  timeSectionCompact: {
    marginTop: Spacing.SM,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.TEXT,
    fontFamily: 'Inter-Bold',
    fontVariant: ['tabular-nums'],
  },
  timeTextCompact: {
    fontSize: 14,
  },
  timeLineWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.SM,
  },
  timeLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.BORDER,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    marginHorizontal: 6,
    borderRadius: BorderRadius.ROUND,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    backgroundColor: Colors.SURFACE,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.TEXT_SECONDARY,
    fontFamily: 'Inter-SemiBold',
  },

  // Assignment
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.SM,
  },
  assignmentText: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '600',
    flexShrink: 1,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.BORDER,
    marginHorizontal: Spacing.LG,
    opacity: 0.6,
  },

  // Lifecycle
  lifecycle: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.SM + 2,
    paddingBottom: Spacing.MD,
  },
  lifecycleCancelled: {
    opacity: 0.5,
  },
  stageCell: {
    flex: 1,
    alignItems: 'center',
  },
  stageTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  halfLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.BORDER,
  },
  halfLineHidden: {
    backgroundColor: 'transparent',
  },
  stageDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: Colors.BORDER,
    backgroundColor: Colors.SURFACE,
  },
  stageDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stageLabel: {
    fontSize: 9,
    color: Colors.TEXT_TERTIARY,
    marginTop: 5,
    fontFamily: 'Inter-Regular',
  },
  stageLabelCancelled: {
    textDecorationLine: 'line-through',
  },
});

export default RevenueBookingCard;
