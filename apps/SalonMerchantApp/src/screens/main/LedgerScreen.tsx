/**
 * LedgerScreen (Salon Ledger)
 *
 * A digital bahi-khata for salon owners — monthly/daily earnings,
 * payment history, staff performance, service performance, and full history.
 * Designed for simplicity: warm paper, white cards, clear numbers.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/config';
import { useBookingStore } from '../../store/bookingStore';
import { useBusinessStore } from '../../store/businessStore';
import { useHaptics } from '../../hooks/useHaptics';

// =============================================================================
// TYPES
// =============================================================================

type DateRange = 'today' | 'week' | 'month' | 'all';

interface BookingSlot {
  id: string;
  serviceName?: string;
  customerPhone?: string;
  scheduledAt: string;
  endAt?: string;
  totalPrice: number;
  status: string;
  source?: string;
  items?: Array<{ nameSnapshot?: string; priceSnapshot?: number; serviceId?: string }>;
  resource?: { id: string; name: string } | null;
  staff?: { id: string; name: string } | null;
  paymentMode?: string;
  paymentMethod?: string;
  completedAt?: string;
  updatedAt?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const isCompletedBooking = (booking: BookingSlot): boolean =>
  booking.status === 'COMPLETED';

const getBookingAmount = (booking: BookingSlot): number =>
  Number(booking.totalPrice) || 0;

const getBookingServiceName = (booking: BookingSlot): string => {
  if (booking.items && booking.items.length > 0) {
    return booking.items
      .map(item => item.nameSnapshot || 'Service')
      .join(' + ');
  }
  return booking.serviceName || 'Service';
};

const getBookingCustomerPhone = (booking: BookingSlot): string => {
  return booking.customerPhone || 'Walk-in';
};

const getBookingPaymentMethod = (booking: BookingSlot): string | null => {
  const mode = booking.paymentMode || booking.paymentMethod;
  if (!mode) return null;
  if (mode === 'CASH') return 'Cash';
  if (mode === 'UPI') return 'UPI';
  if (mode === 'OTHER') return 'Bank';
  return mode;
};

const getBookingPaidAt = (booking: BookingSlot): string => {
  return booking.completedAt || booking.updatedAt || booking.scheduledAt;
};

const mapBookingToSlot = (booking: any): BookingSlot => ({
  id: booking.id,
  serviceName: booking.serviceName,
  customerPhone: booking.customer?.phoneNumber || booking.customerPhone,
  scheduledAt: booking.scheduledAt,
  endAt: booking.endAt,
  totalPrice: Number(booking.totalPrice) || 0,
  status: booking.status,
  source: booking.source,
  items: booking.items || [],
  resource: booking.resource || null,
  staff: booking.staff || null,
  paymentMode: booking.paymentMode,
  paymentMethod: booking.paymentMethod,
  completedAt: booking.completedAt,
  updatedAt: booking.updatedAt,
});

/** Indian-grouped integer formatting (e.g. 1,24,000). */
const formatINR = (value: number): string => {
  const num = Math.round(value).toString();
  if (num.length <= 3) return num;
  let result = '';
  let count = 0;
  for (let i = num.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      result = ',' + result;
    }
    result = num[i] + result;
    count++;
  }
  return result;
};

const formatShortDate = (isoString: string): string => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatPhone = (phone: string): string => {
  if (!phone || /walk/i.test(phone)) return 'Walk-in';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
};

const getDateKey = (isoString: string): string => {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Aggregation helpers
const groupBookingsByDay = (bookings: BookingSlot[]) => {
  const map = new Map<string, BookingSlot[]>();
  bookings.forEach(b => {
    const key = getDateKey(b.scheduledAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  });
  // Sort by date descending
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, slots]) => ({ dateKey, slots }));
};

const aggregateByStaff = (bookings: BookingSlot[]) => {
  const map = new Map<string, { name: string; revenue: number; count: number }>();
  bookings.filter(isCompletedBooking).forEach(b => {
    const staffName = b.staff?.name || 'Unassigned';
    const existing = map.get(staffName) || { name: staffName, revenue: 0, count: 0 };
    existing.revenue += getBookingAmount(b);
    existing.count += 1;
    map.set(staffName, existing);
  });
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
};

const aggregateByService = (bookings: BookingSlot[]) => {
  const map = new Map<string, { name: string; revenue: number; count: number }>();
  bookings.filter(isCompletedBooking).forEach(b => {
    if (b.items && b.items.length > 0) {
      b.items.forEach(item => {
        const name = item.nameSnapshot || 'Service';
        const price = Number(item.priceSnapshot) || 0;
        const existing = map.get(name) || { name, revenue: 0, count: 0 };
        existing.revenue += price;
        existing.count += 1;
        map.set(name, existing);
      });
    } else {
      const name = b.serviceName || 'Service';
      const existing = map.get(name) || { name, revenue: 0, count: 0 };
      existing.revenue += getBookingAmount(b);
      existing.count += 1;
      map.set(name, existing);
    }
  });
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
};

// Status display helpers
const getStatusDisplay = (status: string): { label: string; color: string; bgColor: string } => {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETED') return { label: 'PAID', color: Colors.success, bgColor: Colors.STATUS_COMPLETED_BG };
  if (s === 'CONFIRMED') return { label: 'EXPECTED', color: Colors.success, bgColor: Colors.STATUS_CONFIRMED_BG };
  if (s === 'PENDING') return { label: 'POTENTIAL', color: Colors.warning, bgColor: Colors.STATUS_PENDING_BG };
  if (s.includes('CANCELLED') || s === 'REJECTED') return { label: 'LOST', color: Colors.error, bgColor: Colors.STATUS_CANCELLED_BG };
  return { label: status, color: Colors.muted, bgColor: Colors.STATUS_IN_PROGRESS_BG };
};

// =============================================================================
// DATE RANGE FILTER
// =============================================================================

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All' },
];

const filterByDateRange = (bookings: BookingSlot[], range: DateRange): BookingSlot[] => {
  if (range === 'all') return bookings;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return bookings.filter(b => {
    const d = new Date(b.scheduledAt);
    if (Number.isNaN(d.getTime())) return false;

    if (range === 'today') {
      return d >= todayStart;
    }
    if (range === 'week') {
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
      return d >= weekStart;
    }
    if (range === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return d >= monthStart;
    }
    return true;
  });
};

// =============================================================================
// SECTION COMPONENTS
// =============================================================================

// Expandable section wrapper
const Section: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}> = ({ title, icon, children, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const haptics = useHaptics();

  return (
    <View style={sectionStyles.container}>
      <TouchableOpacity
        style={sectionStyles.header}
        onPress={() => { haptics.light(); setExpanded(!expanded); }}
        activeOpacity={0.7}
      >
        <Icon name={icon as any} size={18} color={Colors.text} />
        <Text style={sectionStyles.title}>{title}</Text>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.muted} />
      </TouchableOpacity>
      {expanded && <View style={sectionStyles.body}>{children}</View>}
    </View>
  );
};

const sectionStyles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.LG,
    marginBottom: Spacing.LG,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.LG,
    overflow: 'hidden',
    ...Shadows.SM,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD + 2,
    gap: Spacing.SM,
  },
  title: {
    flex: 1,
    ...Typography.H4,
    color: Colors.text,
  },
  body: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.LG,
  },
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const LedgerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const haptics = useHaptics();
  const { items: bookings, listByBusiness } = useBookingStore();
  const { business } = useBusinessStore();

  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!business?.id) return;
    setRefreshing(true);
    await listByBusiness(business.id);
    setRefreshing(false);
  }, [business?.id, listByBusiness]);

  // Filtered bookings for selected range
  const rangeBookings = useMemo(
    () => filterByDateRange(bookings.map(mapBookingToSlot), dateRange),
    [bookings, dateRange]
  );

  const completedInRange = useMemo(
    () => rangeBookings.filter(isCompletedBooking),
    [rangeBookings]
  );

  // Revenue summary
  const summary = useMemo(() => {
    let earned = 0;
    let cash = 0;
    let upi = 0;
    let tracked = 0;

    completedInRange.forEach(b => {
      const amt = getBookingAmount(b);
      earned += amt;
      const pm = (b.paymentMode || b.paymentMethod || '').toUpperCase();
      if (pm === 'CASH') { cash += amt; tracked++; }
      else if (pm === 'UPI' || pm === 'OTHER') { upi += amt; tracked++; }
    });

    return {
      earned,
      bookingCount: completedInRange.length,
      cash,
      upi,
      hasPaymentData: tracked > 0,
    };
  }, [completedInRange]);

  // Daily earnings
  const dailyGroups = useMemo(
    () => groupBookingsByDay(completedInRange),
    [completedInRange]
  );

  // Staff performance
  const staffPerf = useMemo(
    () => aggregateByStaff(rangeBookings),
    [rangeBookings]
  );

  // Service performance
  const servicePerf = useMemo(
    () => aggregateByService(rangeBookings),
    [rangeBookings]
  );

  // Full history (all statuses in range)
  const fullHistory = useMemo(
    () => [...rangeBookings].sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    ),
    [rangeBookings]
  );

  // Payment history (completed only, sorted by paid date)
  const paymentHistory = useMemo(
    () => [...completedInRange].sort(
      (a, b) => new Date(getBookingPaidAt(b)).getTime() - new Date(getBookingPaidAt(a)).getTime()
    ),
    [completedInRange]
  );

  // Empty state check
  const isEmpty = rangeBookings.length === 0;
  const noCompleted = completedInRange.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => { haptics.light(); navigation.goBack(); }}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Salon Ledger</Text>
          <Text style={styles.headerSubtitle}>Business history and payments</Text>
        </View>
      </View>

      {/* Date Range Filter */}
      <View style={styles.filterRow}>
        {DATE_RANGES.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterPill, dateRange === key && styles.filterPillActive]}
            onPress={() => { haptics.light(); setDateRange(key); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterPillText, dateRange === key && styles.filterPillTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.success} />
        }
      >
        {/* Revenue Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryValue}>₹{formatINR(summary.earned)}</Text>
              <Text style={styles.summaryLabel}>Earned</Text>
            </View>
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryValue}>{summary.bookingCount}</Text>
              <Text style={styles.summaryLabel}>Bookings</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            {summary.hasPaymentData ? (
              <>
                <View style={styles.summaryBlock}>
                  <Text style={styles.summaryValue}>₹{formatINR(summary.cash)}</Text>
                  <Text style={styles.summaryLabel}>Cash</Text>
                </View>
                <View style={styles.summaryBlock}>
                  <Text style={styles.summaryValue}>₹{formatINR(summary.upi)}</Text>
                  <Text style={styles.summaryLabel}>UPI / Bank</Text>
                </View>
              </>
            ) : (
              <View style={styles.summaryBlockFull}>
                <Text style={styles.summaryHint}>Payment method breakdown not tracked yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Empty State */}
        {isEmpty && (
          <View style={styles.emptyState}>
            <Icon name="book-open" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptySubtitle}>Try another date range.</Text>
          </View>
        )}

        {!isEmpty && noCompleted && (
          <View style={styles.emptyState}>
            <Icon name="credit-card" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No paid bookings yet</Text>
            <Text style={styles.emptySubtitle}>Complete bookings to build your ledger.</Text>
          </View>
        )}

        {/* Daily Earnings */}
        {dailyGroups.length > 0 && (
          <Section title="Daily Earnings" icon="bar-chart-2">
            {dailyGroups.map(({ dateKey, slots }) => {
              const dayTotal = slots.reduce((sum, b) => sum + getBookingAmount(b), 0);
              return (
                <View key={dateKey} style={styles.dayRow}>
                  <View style={styles.dayLeft}>
                    <Text style={styles.dayDate}>{formatShortDate(slots[0].scheduledAt)}</Text>
                    <Text style={styles.dayCount}>{slots.length} booking{slots.length > 1 ? 's' : ''}</Text>
                  </View>
                  <Text style={styles.dayRevenue}>₹{formatINR(dayTotal)}</Text>
                </View>
              );
            })}
          </Section>
        )}

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <Section title="Payment History" icon="credit-card" defaultExpanded={false}>
            {paymentHistory.slice(0, 20).map(b => {
              const pm = getBookingPaymentMethod(b);
              return (
                <View key={b.id} style={styles.paymentRow}>
                  <View style={styles.paymentLeft}>
                    <View style={styles.paymentAmountRow}>
                      <Text style={styles.paymentAmount}>₹{formatINR(getBookingAmount(b))}</Text>
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>PAID</Text>
                      </View>
                    </View>
                    <Text style={styles.paymentService} numberOfLines={1}>
                      {getBookingServiceName(b)}
                    </Text>
                    <Text style={styles.paymentMeta} numberOfLines={1}>
                      {formatPhone(getBookingCustomerPhone(b))}
                    </Text>
                    <View style={styles.paymentBottomRow}>
                      {b.staff && <Text style={styles.paymentStaff}>{b.staff.name}</Text>}
                      {b.staff && b.resource && <Text style={styles.paymentDot}>·</Text>}
                      {b.resource && <Text style={styles.paymentStaff}>{b.resource.name}</Text>}
                    </View>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentDate}>{formatDateTime(getBookingPaidAt(b))}</Text>
                    {pm && <Text style={styles.paymentMode}>{pm}</Text>}
                  </View>
                </View>
              );
            })}
          </Section>
        )}

        {/* Staff Performance */}
        {staffPerf.length > 0 && (
          <Section title="Staff Performance" icon="users" defaultExpanded={false}>
            {staffPerf.map(s => (
              <View key={s.name} style={styles.perfRow}>
                <View style={styles.perfLeft}>
                  <Text style={styles.perfName}>{s.name}</Text>
                  <Text style={styles.perfCount}>
                    {s.count} booking{s.count > 1 ? 's' : ''}
                    {s.count > 0 ? ` · avg ₹${formatINR(Math.round(s.revenue / s.count))}` : ''}
                  </Text>
                </View>
                <Text style={styles.perfRevenue}>₹{formatINR(s.revenue)}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Service Performance */}
        {servicePerf.length > 0 && (
          <Section title="Service Performance" icon="scissors" defaultExpanded={false}>
            {servicePerf.map(s => (
              <View key={s.name} style={styles.perfRow}>
                <View style={styles.perfLeft}>
                  <Text style={styles.perfName}>{s.name}</Text>
                  <Text style={styles.perfCount}>
                    {s.count} booking{s.count > 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.perfRevenue}>₹{formatINR(s.revenue)}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Full History */}
        {fullHistory.length > 0 && (
          <Section title="Full History" icon="list" defaultExpanded={false}>
            {fullHistory.slice(0, 30).map(b => {
              const display = getStatusDisplay(b.status);
              const isCancelled = b.status.includes('CANCELLED') || b.status === 'REJECTED';
              return (
                <View key={b.id} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <View style={styles.historyTopRow}>
                      <View style={[styles.historyBadge, { backgroundColor: display.bgColor }]}>
                        <Text style={[styles.historyBadgeText, { color: display.color }]}>
                          {display.label}
                        </Text>
                      </View>
                      <Text style={[
                        styles.historyAmount,
                        isCancelled && styles.historyAmountCancelled,
                      ]}>
                        ₹{formatINR(getBookingAmount(b))}
                      </Text>
                    </View>
                    <Text style={styles.historyService} numberOfLines={1}>
                      {getBookingServiceName(b)}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {formatPhone(getBookingCustomerPhone(b))} · {formatDateTime(b.scheduledAt)}
                    </Text>
                    {(b.staff || b.resource) && (
                      <Text style={styles.historyAssignment}>
                        {[b.staff?.name, b.resource?.name].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
            {fullHistory.length > 30 && (
              <Text style={styles.moreText}>+ {fullHistory.length - 30} more bookings</Text>
            )}
          </Section>
        )}

        <View style={{ height: Spacing.XXL }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.LG,
    paddingBottom: Spacing.SM,
    gap: Spacing.MD,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.H2,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.Caption,
    color: Colors.muted,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    gap: Spacing.SM,
  },
  filterPill: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.ROUND,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    ...Typography.Caption,
    color: Colors.muted,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  // Revenue Summary Card
  summaryCard: {
    marginHorizontal: Spacing.LG,
    marginBottom: Spacing.LG,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    ...Shadows.SM,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: Spacing.MD,
  },
  summaryBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.SM,
  },
  summaryBlockFull: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.SM,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    ...Typography.Caption,
    color: Colors.muted,
    marginTop: 2,
  },
  summaryHint: {
    ...Typography.Caption,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.XXL + Spacing.XL,
    paddingHorizontal: Spacing.XL,
  },
  emptyTitle: {
    ...Typography.H3,
    color: Colors.text,
    marginTop: Spacing.LG,
  },
  emptySubtitle: {
    ...Typography.Body2,
    color: Colors.muted,
    marginTop: Spacing.XS,
    textAlign: 'center',
  },
  // Daily Earnings
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.SM + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER + '40',
  },
  dayLeft: {
    flex: 1,
  },
  dayDate: {
    ...Typography.Body1,
    color: Colors.text,
    fontWeight: '600',
  },
  dayCount: {
    ...Typography.Caption,
    color: Colors.muted,
    marginTop: 1,
  },
  dayRevenue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: Colors.success,
    fontVariant: ['tabular-nums'],
  },
  // Payment History
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER + '40',
  },
  paymentLeft: {
    flex: 1,
    paddingRight: Spacing.SM,
  },
  paymentAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: Colors.text,
  },
  paidBadge: {
    backgroundColor: Colors.STATUS_COMPLETED_BG,
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: BorderRadius.SM,
  },
  paidBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.success,
    letterSpacing: 0.8,
    fontFamily: 'Inter-Bold',
  },
  paymentService: {
    ...Typography.Body2,
    color: Colors.text,
    marginTop: 4,
  },
  paymentMeta: {
    ...Typography.Caption,
    color: Colors.muted,
    marginTop: 2,
  },
  paymentBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  paymentStaff: {
    ...Typography.Caption,
    color: Colors.textTertiary,
  },
  paymentDot: {
    ...Typography.Caption,
    color: Colors.textTertiary,
    marginHorizontal: 4,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentDate: {
    ...Typography.Caption,
    color: Colors.muted,
  },
  paymentMode: {
    ...Typography.Caption,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  // Staff / Service Performance
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.SM + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER + '40',
  },
  perfLeft: {
    flex: 1,
  },
  perfName: {
    ...Typography.Body1,
    color: Colors.text,
    fontWeight: '600',
  },
  perfCount: {
    ...Typography.Caption,
    color: Colors.muted,
    marginTop: 1,
  },
  perfRevenue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: Colors.success,
    fontVariant: ['tabular-nums'],
  },
  // Full History
  historyRow: {
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER + '40',
  },
  historyLeft: {
    flex: 1,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: BorderRadius.SM,
  },
  historyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: 'Inter-Bold',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  historyAmountCancelled: {
    color: Colors.muted,
    textDecorationLine: 'line-through',
  },
  historyService: {
    ...Typography.Body2,
    color: Colors.text,
    marginTop: 4,
  },
  historyMeta: {
    ...Typography.Caption,
    color: Colors.muted,
    marginTop: 2,
  },
  historyAssignment: {
    ...Typography.Caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  moreText: {
    ...Typography.Caption,
    color: Colors.muted,
    textAlign: 'center',
    paddingTop: Spacing.MD,
  },
});

export default LedgerScreen;
