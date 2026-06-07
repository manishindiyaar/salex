/**
 * BookingsScreen (Revenue Pipeline)
 *
 * The Bookings page reframed as a revenue control room:
 * - Revenue summary strip + 3 stat blocks (Potential / Expected / Earned)
 * - Premium pill date tabs with counts
 * - Status filter chips with dots
 * - Date groups summarised by count + value
 * - Premium RevenueBookingCard rows
 * - Tap to open the existing BookingDetailDrawer
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { useBookingStore } from '../../store/bookingStore';
import { useBusinessStore } from '../../store/businessStore';
import { useServiceStore } from '../../store/serviceStore';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/config';
import { useHaptics } from '../../hooks/useHaptics';
import { BookingDetailDrawer, SlotCreatorDrawer, RevenueBookingCard } from '../../components/high-strength';

type DateFilter = 'today' | 'tomorrow' | 'week' | 'all';
type StatusFilter = 'all' | 'PENDING' | 'CONFIRMED' | 'COMPLETED';

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

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'This Week' },
  { key: 'all', label: 'All' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: Colors.TEXT_SECONDARY },
  { key: 'PENDING', label: 'Pending', color: Colors.STATUS_PENDING },
  { key: 'CONFIRMED', label: 'Confirmed', color: Colors.STATUS_CONFIRMED },
  { key: 'COMPLETED', label: 'Done', color: Colors.STATUS_COMPLETED },
];

const isCancelledStatus = (status: string): boolean =>
  status.includes('CANCELLED') || status === 'REJECTED';

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

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

export default function BookingsScreen() {
  const { items: bookings, loading, listByBusiness } = useBookingStore();
  const { business, fetchMe } = useBusinessStore();
  const { items: services } = useServiceStore();
  const haptics = useHaptics();

  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingSlot | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showSlotCreator, setShowSlotCreator] = useState(false);

  // Service map for name lookup
  const serviceMap = useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [services]);

  useEffect(() => {
    if (!business) fetchMe();
  }, [business, fetchMe]);

  useEffect(() => {
    if (business?.id) {
      listByBusiness(business.id);
    }
  }, [business?.id, listByBusiness]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (business?.id) {
      await listByBusiness(business.id);
    }
    setRefreshing(false);
  }, [business?.id, listByBusiness]);

  const mapBooking = useCallback((b: any): BookingSlot => {
    let serviceName = 'Walk-in Service';
    if (b.items && Array.isArray(b.items) && b.items.length > 0) {
      const names = b.items.map((item: any) =>
        item.nameSnapshot || serviceMap[item.serviceId] || 'Service'
      );
      serviceName = names.join(', ');
    }

    return {
      id: b.id,
      serviceName,
      customerPhone: b.customer?.phoneNumber || 'Walk-in',
      scheduledAt: b.scheduledAt,
      endAt: b.endAt,
      totalPrice: Number(b.totalPrice) || 0,
      status: b.status,
      source: b.source || 'manual',
      items: b.items || [],
      resource: b.resource || null,
      staff: b.staff || null,
    };
  }, [serviceMap]);

  // Bookings within the selected DATE range (status filter not yet applied).
  // Used for the date-scoped revenue stats so the numbers stay meaningful.
  const dateScopedBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [] as BookingSlot[];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return bookings
      .filter((b: any) => {
        const bookingDate = new Date(b.scheduledAt);
        if (dateFilter === 'today') {
          return bookingDate.toDateString() === today.toDateString();
        } else if (dateFilter === 'tomorrow') {
          return bookingDate.toDateString() === tomorrow.toDateString();
        } else if (dateFilter === 'week') {
          return bookingDate >= today && bookingDate <= weekEnd;
        }
        return true;
      })
      .map(mapBooking);
  }, [bookings, dateFilter, mapBooking]);

  // Apply the status filter on top of the date scope.
  const filteredBookings = useMemo(() => {
    const list = statusFilter === 'all'
      ? dateScopedBookings
      : dateScopedBookings.filter(b => b.status === statusFilter);
    return [...list].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }, [dateScopedBookings, statusFilter]);

  // Revenue stats for the current date scope.
  const stats = useMemo(() => {
    let potential = 0;
    let expected = 0;
    let earned = 0;
    dateScopedBookings.forEach(b => {
      if (b.status === 'PENDING') potential += b.totalPrice;
      else if (b.status === 'CONFIRMED') expected += b.totalPrice;
      else if (b.status === 'COMPLETED') earned += b.totalPrice;
    });
    return { potential, expected, earned };
  }, [dateScopedBookings]);

  // Headline revenue value adapts to the active status filter.
  const headline = useMemo(() => {
    const count = filteredBookings.length;
    const sum = filteredBookings.reduce(
      (acc, b) => acc + (isCancelledStatus(b.status) ? 0 : b.totalPrice),
      0
    );
    let label = 'in pipeline';
    if (statusFilter === 'PENDING') label = 'potential';
    else if (statusFilter === 'CONFIRMED') label = 'expected';
    else if (statusFilter === 'COMPLETED') label = 'earned';
    return { value: sum, count, label };
  }, [filteredBookings, statusFilter]);

  // Per-date-filter counts for the pill tabs.
  const dateCounts = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return { today: 0, tomorrow: 0, week: 0, all: 0 };
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const counts = { today: 0, tomorrow: 0, week: 0, all: bookings.length };
    bookings.forEach((b: any) => {
      const d = new Date(b.scheduledAt);
      if (d.toDateString() === today.toDateString()) counts.today += 1;
      if (d.toDateString() === tomorrow.toDateString()) counts.tomorrow += 1;
      if (d >= today && d <= weekEnd) counts.week += 1;
    });
    return counts;
  }, [bookings]);

  const handleSlotPress = useCallback((slot: BookingSlot) => {
    haptics.light();
    setSelectedBooking(slot);
    setShowDetail(true);
  }, [haptics]);

  const handleDateFilterChange = useCallback((filter: DateFilter) => {
    haptics.light();
    setDateFilter(filter);
  }, [haptics]);

  const handleStatusFilterChange = useCallback((filter: StatusFilter) => {
    haptics.light();
    setStatusFilter(filter);
  }, [haptics]);

  // Group bookings by date with per-group revenue summary.
  const groupedBookings = useMemo(() => {
    const dateMap = new Map<string, BookingSlot[]>();
    filteredBookings.forEach(slot => {
      const dateKey = formatDate(slot.scheduledAt);
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, []);
      dateMap.get(dateKey)!.push(slot);
    });

    const groups: { date: string; slots: BookingSlot[]; value: number; word: string }[] = [];
    dateMap.forEach((slots, date) => {
      let value = 0;
      const words = new Set<string>();
      slots.forEach(s => {
        if (isCancelledStatus(s.status)) return;
        value += s.totalPrice;
        if (s.status === 'PENDING') words.add('potential');
        else if (s.status === 'CONFIRMED') words.add('expected');
        else if (s.status === 'COMPLETED') words.add('earned');
        else words.add('expected');
      });
      const word = words.size === 1 ? [...words][0] : 'expected';
      groups.push({ date, slots, value, word });
    });
    return groups;
  }, [filteredBookings]);

  const emptyCopy = useMemo(() => {
    if (statusFilter === 'PENDING') {
      return { title: 'No pending requests', subtitle: 'New WhatsApp requests will appear here.' };
    }
    if (statusFilter === 'COMPLETED') {
      return { title: 'No earned bookings yet', subtitle: 'Complete a booking to record revenue.' };
    }
    if (statusFilter === 'CONFIRMED') {
      return { title: 'No confirmed bookings', subtitle: 'Confirmed bookings will show expected revenue here.' };
    }
    if (dateFilter === 'today') {
      return { title: 'No bookings today', subtitle: 'Open a slot or share your booking link.' };
    }
    return { title: 'No bookings found', subtitle: 'Try changing the filters above.' };
  }, [statusFilter, dateFilter]);

  const renderHeader = () => (
    <View>
      {/* Revenue summary strip */}
      <View style={styles.summaryStrip}>
        <Text style={styles.summaryAmount}>₹{formatINR(headline.value)}</Text>
        <Text style={styles.summaryCaption}>
          {headline.label} from {headline.count} booking{headline.count !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Stat blocks */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={[styles.statLabel, { color: Colors.STATUS_PENDING }]}>POTENTIAL</Text>
          <Text style={styles.statValue}>₹{formatINR(stats.potential)}</Text>
          <Text style={styles.statSub}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={[styles.statLabel, { color: Colors.STATUS_CONFIRMED }]}>EXPECTED</Text>
          <Text style={styles.statValue}>₹{formatINR(stats.expected)}</Text>
          <Text style={styles.statSub}>Confirmed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={[styles.statLabel, { color: Colors.STATUS_COMPLETED }]}>EARNED</Text>
          <Text style={styles.statValue}>₹{formatINR(stats.earned)}</Text>
          <Text style={styles.statSub}>Completed</Text>
        </View>
      </View>

      {/* Date Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {DATE_FILTERS.map(filter => {
          const isActive = dateFilter === filter.key;
          const count = dateCounts[filter.key];
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => handleDateFilterChange(filter.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {filter.label}
              </Text>
              {count > 0 ? (
                <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
                  <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                    {count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusFilterContainer}
      >
        {STATUS_FILTERS.map(filter => {
          const isActive = statusFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.statusChip,
                isActive
                  ? { backgroundColor: filter.color + '14', borderColor: filter.color + '40' }
                  : { borderColor: Colors.BORDER },
              ]}
              onPress={() => handleStatusFilterChange(filter.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.statusChipDot, { backgroundColor: isActive ? filter.color : Colors.TEXT_TERTIARY }]} />
              <Text style={[styles.statusChipText, { color: isActive ? filter.color : Colors.TEXT_SECONDARY }]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.BACKGROUND} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            haptics.light();
            setShowSlotCreator(true);
          }}
          activeOpacity={0.85}
        >
          <Icon name="plus" size={22} color={Colors.BACKGROUND} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {renderHeader()}
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={groupedBookings}
          keyExtractor={(item) => item.date}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.SALEX_GREEN}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Icon name="calendar" size={28} color={Colors.TEXT_SECONDARY} />
              </View>
              <Text style={styles.emptyTitle}>{emptyCopy.title}</Text>
              <Text style={styles.emptySubtitle}>{emptyCopy.subtitle}</Text>
            </View>
          }
          renderItem={({ item: group }) => (
            <View>
              <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>{group.date}</Text>
                <Text style={styles.dateHeaderCount}>
                  {group.slots.length} booking{group.slots.length !== 1 ? 's' : ''}
                  {group.value > 0 ? ` · ₹${formatINR(group.value)} ${group.word}` : ''}
                </Text>
              </View>
              {group.slots.map(slot => (
                <View key={slot.id} style={styles.cardWrap}>
                  <RevenueBookingCard booking={slot} onPress={() => handleSlotPress(slot)} />
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Booking Detail Drawer */}
      <BookingDetailDrawer
        visible={showDetail}
        booking={selectedBooking}
        onClose={() => {
          setShowDetail(false);
          setSelectedBooking(null);
        }}
        onStatusChange={onRefresh}
      />

      {/* Slot Creator Drawer */}
      <SlotCreatorDrawer
        visible={showSlotCreator}
        onClose={() => setShowSlotCreator(false)}
        onBookingCreated={onRefresh}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.MD,
    paddingBottom: Spacing.SM,
  },
  title: {
    ...Typography.H2,
    color: Colors.TEXT,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.LG,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Revenue summary strip
  summaryStrip: {
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.XS,
    paddingBottom: Spacing.MD,
  },
  summaryAmount: {
    fontSize: 40,
    lineHeight: 46,
    color: Colors.TEXT,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  summaryCaption: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginTop: 2,
    textTransform: 'capitalize',
  },

  // Stat blocks
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.SM,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    borderWidth: 1,
    borderColor: 'rgba(3, 3, 31, 0.06)',
    ...Shadows.MD,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.BORDER,
    opacity: 0.6,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'Inter-Bold',
  },
  statValue: {
    fontSize: 17,
    color: Colors.TEXT,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 3,
  },
  statSub: {
    fontSize: 10,
    color: Colors.TEXT_TERTIARY,
    marginTop: 1,
    fontFamily: 'Inter-Regular',
  },

  // Date filter tabs
  filterContainer: {
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.LG,
    paddingBottom: Spacing.XS,
    gap: Spacing.SM,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    height: 38,
    borderRadius: BorderRadius.ROUND,
    backgroundColor: Colors.SURFACE_VARIANT,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: Colors.PRIMARY,
  },
  filterTabText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: Colors.BACKGROUND,
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(3, 3, 31, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.TEXT_SECONDARY,
    fontVariant: ['tabular-nums'],
  },
  filterCountTextActive: {
    color: Colors.BACKGROUND,
  },

  // Status chips
  statusFilterContainer: {
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.SM,
    paddingBottom: Spacing.XS,
    gap: Spacing.SM,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    height: 32,
    borderRadius: BorderRadius.ROUND,
    backgroundColor: Colors.SURFACE,
    borderWidth: 1.5,
    borderColor: Colors.BORDER,
    gap: 6,
  },
  statusChipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusChipText: {
    ...Typography.Caption,
    fontWeight: '700',
  },

  // List + states
  loadingContainer: {
    paddingVertical: Spacing.XXL,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.XXL,
    paddingTop: Spacing.XXL,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.SURFACE_VARIANT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  emptyTitle: {
    ...Typography.H3,
    color: Colors.TEXT,
    textAlign: 'center',
    marginBottom: Spacing.XS,
    fontWeight: '400',
  },
  emptySubtitle: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 100,
  },
  cardWrap: {
    paddingHorizontal: Spacing.LG,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.LG,
    paddingBottom: Spacing.SM,
  },
  dateHeaderText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '700',
  },
  dateHeaderCount: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: Spacing.SM,
  },
});
