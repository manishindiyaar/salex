/**
 * BookingsScreen (High-Strength Bookings Tab)
 * 
 * Full booking management with:
 * - Date filter tabs (Today, Tomorrow, This Week, All)
 * - Status filter chips (All, Pending, Confirmed, Completed)
 * - Cool slot cards with status indicators
 * - Tap to open booking detail drawer
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
import Icon from 'react-native-vector-icons/Feather';
import { useBookingStore } from '../../store/bookingStore';
import { useBusinessStore } from '../../store/businessStore';
import { useServiceStore } from '../../store/serviceStore';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';
import { useHaptics } from '../../hooks/useHaptics';
import { BookingDetailDrawer, SlotCreatorDrawer } from '../../components/high-strength';

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
  { key: 'PENDING', label: 'Pending', color: '#FFA500' },
  { key: 'CONFIRMED', label: 'Confirmed', color: Colors.SALEX_GREEN },
  { key: 'COMPLETED', label: 'Done', color: '#4CAF50' },
];

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

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatTimeRange = (startIso: string, endIso: string): string => {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
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

  // Filter bookings
  const filteredBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return bookings
      .filter((b: any) => {
        const bookingDate = new Date(b.scheduledAt);
        
        // Date filter
        if (dateFilter === 'today') {
          if (bookingDate.toDateString() !== today.toDateString()) return false;
        } else if (dateFilter === 'tomorrow') {
          if (bookingDate.toDateString() !== tomorrow.toDateString()) return false;
        } else if (dateFilter === 'week') {
          if (bookingDate < today || bookingDate > weekEnd) return false;
        }
        
        // Status filter
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        
        return true;
      })
      .map((b: any): BookingSlot => {
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
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [bookings, dateFilter, statusFilter, serviceMap]);

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

  const renderSlotCard = ({ item }: { item: BookingSlot }) => {
    const statusColor = getStatusColor(item.status);
    const isCompleted = item.status === 'COMPLETED';
    const isCancelled = item.status.includes('CANCELLED') || item.status === 'REJECTED';

    return (
      <TouchableOpacity
        style={[
          styles.slotCard,
          isCompleted && styles.slotCardCompleted,
          isCancelled && styles.slotCardCancelled,
        ]}
        onPress={() => handleSlotPress(item)}
        activeOpacity={0.7}
      >
        {/* Left color indicator - matching HomeScreen design */}
        <View style={[styles.slotIndicator, { backgroundColor: statusColor }]} />
        
        {/* Content */}
        <View style={styles.slotContent}>
          <Text style={styles.slotTimeText}>
            {formatTimeRange(item.scheduledAt, item.endAt)}
          </Text>
          <Text style={styles.slotServiceText} numberOfLines={1}>
            {item.serviceName}
          </Text>
          
          {/* Meta row with customer and price */}
          <View style={styles.slotMeta}>
            <View style={styles.metaItem}>
              <Icon name="phone" size={12} color={Colors.TEXT_TERTIARY} />
              <Text style={styles.metaText}>{item.customerPhone}</Text>
            </View>
            <Text style={[styles.priceText, { color: statusColor }]}>
              ₹{item.totalPrice}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateHeader = (date: string, slots: BookingSlot[]) => (
    <View style={styles.dateHeader}>
      <Text style={styles.dateHeaderText}>{date}</Text>
      <Text style={styles.dateHeaderCount}>{slots.length} booking{slots.length !== 1 ? 's' : ''}</Text>
    </View>
  );

  // Group bookings by date
  const groupedBookings = useMemo(() => {
    const groups: { date: string; slots: BookingSlot[] }[] = [];
    const dateMap = new Map<string, BookingSlot[]>();

    filteredBookings.forEach(slot => {
      const dateKey = formatDate(slot.scheduledAt);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(slot);
    });

    dateMap.forEach((slots, date) => {
      groups.push({ date, slots });
    });

    return groups;
  }, [filteredBookings]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.BACKGROUND} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            haptics.light();
            setShowSlotCreator(true);
          }}
        >
          <Icon name="plus" size={20} color={Colors.BACKGROUND} />
        </TouchableOpacity>
      </View>

      {/* Date Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {DATE_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              dateFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => handleDateFilterChange(filter.key)}
          >
            <Text style={[
              styles.filterTabText,
              dateFilter === filter.key && styles.filterTabTextActive,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Status Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilterScroll}
        contentContainerStyle={styles.statusFilterContainer}
      >
        {STATUS_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.statusChip,
              statusFilter === filter.key && { backgroundColor: filter.color + '30', borderColor: filter.color },
            ]}
            onPress={() => handleStatusFilterChange(filter.key)}
          >
            <View style={[styles.statusChipDot, { backgroundColor: filter.color }]} />
            <Text style={[
              styles.statusChipText,
              statusFilter === filter.key && { color: filter.color },
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bookings List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="calendar" size={64} color={Colors.TEXT_TERTIARY} />
          <Text style={styles.emptyTitle}>No bookings found</Text>
          <Text style={styles.emptySubtitle}>
            {dateFilter === 'today' ? "You're free today! 🎉" : 'Try changing the filters'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedBookings}
          keyExtractor={(item) => item.date}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.SALEX_GREEN}
            />
          }
          renderItem={({ item: group }) => (
            <View>
              {renderDateHeader(group.date, group.slots)}
              {group.slots.map(slot => (
                <View key={slot.id}>
                  {renderSlotCard({ item: slot })}
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
    paddingTop: Spacing.LG,
    paddingBottom: Spacing.MD,
  },
  title: {
    ...Typography.H2,
    color: Colors.TEXT,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.SALEX_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterContainer: {
    paddingHorizontal: Spacing.LG,
    gap: Spacing.SM,
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.ROUND,
    backgroundColor: Colors.SURFACE,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  filterTabActive: {
    backgroundColor: Colors.SALEX_GREEN + '20',
    borderColor: Colors.SALEX_GREEN,
  },
  filterTabText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: Colors.SALEX_GREEN,
  },
  statusFilterScroll: {
    maxHeight: 44,
    marginTop: Spacing.SM,
  },
  statusFilterContainer: {
    paddingHorizontal: Spacing.LG,
    gap: Spacing.SM,
    flexDirection: 'row',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.ROUND,
    backgroundColor: Colors.SURFACE,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    gap: Spacing.XS,
  },
  statusChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusChipText: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.XXL,
  },
  emptyTitle: {
    ...Typography.H3,
    color: Colors.TEXT_SECONDARY,
    marginTop: Spacing.LG,
  },
  emptySubtitle: {
    ...Typography.Body2,
    color: Colors.TEXT_TERTIARY,
    marginTop: Spacing.SM,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: Colors.SURFACE,
    marginHorizontal: Spacing.LG,
    marginBottom: Spacing.SM,
    borderRadius: BorderRadius.MD,
    overflow: 'hidden',
  },
  slotCardCompleted: {
    opacity: 0.6,
  },
  slotCardCancelled: {
    opacity: 0.4,
  },
  slotIndicator: {
    width: 4,
    alignSelf: 'stretch',
  },
  slotContent: {
    flex: 1,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
  },
  slotTimeText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
  },
  slotServiceText: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
    marginTop: 2,
  },
  slotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.SM,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
  },
  priceText: {
    ...Typography.Body2,
    fontWeight: '700',
  },
});
