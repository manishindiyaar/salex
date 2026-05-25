/**
 * HomeScreen (Command Center)
 * 
 * High-Strength UI for the main dashboard.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../../navigation/TabNavigator';

import {
  RevenueBlock,
  GatedChaiBreakToggle,
  FloatingRequestCard,
  CheckoutDrawer,
  RevenueBurst,
  SlotCreatorDrawer,
  BookingDetailDrawer,
} from '@components/high-strength';
import type { 
  PendingBooking, 
  CheckoutBooking,
  PaymentMethod,
} from '@components/high-strength';
import { Colors, Spacing, Typography, BorderRadius, RevenueConfig } from '../../theme/config';
import { useBusinessStore } from '@store/businessStore';
import { useBookingStore } from '@store/bookingStore';
import { useServiceStore } from '@store/serviceStore';
import { useAuth } from '@context/AuthContext';
import { useHaptics } from '../../hooks/useHaptics';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { business, loading: businessLoading, fetchMe } = useBusinessStore();
  const { items: bookings, listByBusiness } = useBookingStore();
  const { items: services, listByBusiness: loadServices } = useServiceStore();
  const { logout } = useAuth();
  const haptics = useHaptics();
  const whatsappAccess = useFeatureAccess('whatsapp_booking');

  const [isChaiBreakActive, setIsChaiBreakActive] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [showRevenueBurst, setShowRevenueBurst] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingBooking | null>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<CheckoutBooking | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSlotCreator, setShowSlotCreator] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Helper functions for slot cards
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


  useEffect(() => {
    if (!business && !businessLoading) {
      fetchMe();
    }
  }, [business, businessLoading, fetchMe]);

  // Load bookings and services when business is available
  useEffect(() => {
    if (business?.id) {
      console.log('📚 Loading bookings and services for business:', business.id);
      listByBusiness(business.id);
      loadServices(business.id);
    }
  }, [business?.id, listByBusiness, loadServices]);

  // Debug: Log bookings when they change
  useEffect(() => {
    console.log('📅 Bookings updated:', bookings.length, 'bookings');
    if (bookings.length > 0) {
      console.log('📅 First booking:', JSON.stringify(bookings[0], null, 2));
    }
  }, [bookings]);

  useEffect(() => {
    if (bookings && bookings.length > 0) {
      const today = new Date().toDateString();
      const todayBookingsList = bookings.filter((b: any) => {
        const bookingDate = new Date(b.scheduledAt).toDateString();
        return bookingDate === today;
      });
      const completedToday = todayBookingsList.filter((b: any) => b.status === 'COMPLETED');
      const revenue = completedToday.reduce((sum: number, b: any) => {
        return sum + (Number(b.totalPrice) || 0);
      }, 0);
      const milestone = RevenueConfig.DEFAULT_MILESTONE;
      if (revenue >= milestone && lastMilestone < milestone) {
        setShowRevenueBurst(true);
        setLastMilestone(milestone);
        haptics.heavy();
      }
      setTodayRevenue(revenue);
      setTodayBookingsCount(completedToday.length);
    }
  }, [bookings, lastMilestone, haptics]);

  // Create a map of service IDs to names for quick lookup
  const serviceMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [services]);

  // Today's bookings for schedule display
  interface TodaySlot {
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

  const todaySlots: TodaySlot[] = React.useMemo(() => {
    console.log('📅 Computing todaySlots, bookings:', bookings.length, bookings);
    if (!bookings || bookings.length === 0) return [];
    const today = new Date().toDateString();
    const filtered = bookings.filter((b: any) => new Date(b.scheduledAt).toDateString() === today);
    console.log('📅 Today bookings:', filtered.length, filtered);
    
    return filtered
      .map((b: any) => {
        // Try to get service name from booking items or services
        let serviceName = 'Walk-in Service';
        
        console.log('📦 Processing booking:', b.id, 'items:', b.items, 'serviceIds:', b.serviceIds);
        
        // If booking has items array with service info (from backend)
        if (b.items && Array.isArray(b.items) && b.items.length > 0) {
          const names = b.items.map((item: any) => {
            // Backend returns nameSnapshot in BookingItem
            return item.nameSnapshot || item.service?.name || serviceMap[item.serviceId] || 'Service';
          });
          serviceName = names.join(', ');
        } else if (b.serviceIds && Array.isArray(b.serviceIds) && b.serviceIds.length > 0) {
          // If booking has serviceIds array
          const names = b.serviceIds.map((id: string) => serviceMap[id] || 'Service');
          serviceName = names.join(', ');
        }
        
        console.log('📦 Booking mapped:', b.id, 'serviceName:', serviceName, 'price:', b.totalPrice);
        
        return {
          id: b.id,
          serviceName,
          customerPhone: b.customer?.phoneNumber || b.customerId || 'Walk-in',
          scheduledAt: b.scheduledAt,
          endAt: b.endAt || b.scheduledAt, // fallback to start if no end
          totalPrice: Number(b.totalPrice) || 0,
          status: b.status,
          source: b.source || 'manual',
          items: b.items || [],
          resource: b.resource || null,
          staff: b.staff || null,
        };
      })
      .sort((a: TodaySlot, b: TodaySlot) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
  }, [bookings, serviceMap]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMe();
      if (business?.id) {
        await listByBusiness(business.id);
        await loadServices(business.id);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchMe, business?.id, listByBusiness, loadServices]);

  const handleChaiBreakToggle = useCallback((active: boolean) => {
    setIsChaiBreakActive(active);
    haptics.medium();
    if (!active) setPendingRequest(null);
  }, [haptics]);

  const handleSlotPress = useCallback((slot: any) => {
    haptics.light();
    setSelectedBooking(slot);
    setShowDetail(true);
  }, [haptics]);

  const handleAcceptRequest = useCallback(async (bookingId: string) => {
    haptics.heavy();
    console.log('Accept:', bookingId);
    setPendingRequest(null);
  }, [haptics]);

  const handleDenyRequest = useCallback(async (bookingId: string) => {
    haptics.heavy();
    console.log('Deny:', bookingId);
    setPendingRequest(null);
  }, [haptics]);

  const handleCheckout = useCallback(async (bookingId: string, paymentMethod: PaymentMethod) => {
    haptics.heavy();
    console.log('💳 Checkout:', bookingId, 'via', paymentMethod);
    
    // Check if business is suspended before processing checkout
    if (business && business.isActive === false) {
      Alert.alert(
        'Account Suspended',
        'Your business account has been suspended. Checkout operations are not available. Please contact support.',
        [{ text: 'OK' }]
      );
      setShowCheckout(false);
      setCheckoutBooking(null);
      return;
    }
    
    try {
      // Call the booking store's complete method to update status via API
      await useBookingStore.getState().complete(bookingId, paymentMethod);
      console.log('✅ Checkout completed successfully');
    } catch (error: any) {
      console.error('❌ Checkout failed:', error);
      
      // Check if it's a suspension error
      if (error.message && error.message.includes('Business account is suspended')) {
        Alert.alert(
          'Account Suspended',
          'Your business account has been suspended. Checkout operations are not available. Please contact support.',
          [{ text: 'OK' }]
        );
        setShowCheckout(false);
        setCheckoutBooking(null);
        return;
      }
    }
    
    setShowCheckout(false);
    setCheckoutBooking(null);
    
    // Refresh bookings list
    if (business?.id) await listByBusiness(business.id);
  }, [haptics, business, listByBusiness]);

  const handleFabPress = useCallback(() => {
    haptics.light();
    // Force load services before opening drawer
    if (business?.id) {
      console.log('🔄 Force loading services before opening drawer...');
      loadServices(business.id);
    }
    setShowSlotCreator(true);
  }, [haptics, business?.id, loadServices]);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
    ]);
  }, [logout]);

  const dateString = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });


  return (
    <SafeAreaView style={[styles.container, !isChaiBreakActive && styles.containerClosed]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.BACKGROUND} />
      
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.SALEX_GREEN}
            colors={[Colors.SALEX_GREEN]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.businessName}>{business?.name || 'Your Business'}</Text>
            <Text style={styles.dateText}>{dateString}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="log-out" size={20} color={Colors.ERROR} />
          </TouchableOpacity>
        </View>

        <View style={styles.revenueSection}>
          <RevenueBlock todayRevenue={todayRevenue} todayBookings={todayBookingsCount} />
        </View>

        <View style={styles.chaiBreakSection}>
          <GatedChaiBreakToggle isActive={isChaiBreakActive} onToggle={handleChaiBreakToggle} />
        </View>

        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>
            {todaySlots.length > 3 && (
              <Text style={styles.sectionCount}>{todaySlots.length} total</Text>
            )}
          </View>
          
          {todaySlots.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar" size={48} color={Colors.TEXT_TERTIARY} />
              <Text style={styles.emptyText}>No bookings today</Text>
              <Text style={styles.emptySubtext}>Tap + to create a manual booking</Text>
            </View>
          ) : (
            <View style={styles.slotsList}>
              {todaySlots.slice(0, 3).map(slot => {
                const statusColor = getStatusColor(slot.status);
                const isCompleted = slot.status === 'COMPLETED';
                const isCancelled = slot.status.includes('CANCELLED') || slot.status === 'REJECTED';
                
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.slotCard,
                      isCompleted && styles.slotCardCompleted,
                      isCancelled && styles.slotCardCancelled,
                    ]}
                    onPress={() => handleSlotPress(slot)}
                    activeOpacity={0.7}
                  >
                    {/* Left color indicator */}
                    <View style={[styles.slotIndicator, { backgroundColor: statusColor }]} />
                    
                    {/* Content */}
                    <View style={styles.slotContent}>
                      <Text style={styles.slotTimeText}>
                        {formatTimeRange(slot.scheduledAt, slot.endAt)}
                      </Text>
                      <Text style={styles.slotServiceText} numberOfLines={1}>
                        {slot.serviceName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              
              {todaySlots.length > 3 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => {
                    haptics.light();
                    navigation.navigate('Bookings');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showMoreText}>
                    Show {todaySlots.length - 3} more booking{todaySlots.length - 3 !== 1 ? 's' : ''}
                  </Text>
                  <Icon name="chevron-right" size={18} color={Colors.SALEX_GREEN} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleFabPress} activeOpacity={0.8}>
        <Icon name="plus" size={28} color={Colors.BACKGROUND} />
      </TouchableOpacity>

      {pendingRequest && isChaiBreakActive && whatsappAccess.allowed && (
        <FloatingRequestCard
          booking={pendingRequest}
          onAccept={handleAcceptRequest}
          onDeny={handleDenyRequest}
        />
      )}

      <CheckoutDrawer
        visible={showCheckout}
        booking={checkoutBooking}
        onCheckout={handleCheckout}
        onClose={() => { setShowCheckout(false); setCheckoutBooking(null); }}
      />

      <SlotCreatorDrawer
        visible={showSlotCreator}
        onClose={() => setShowSlotCreator(false)}
        onBookingCreated={onRefresh}
      />

      <BookingDetailDrawer
        visible={showDetail}
        booking={selectedBooking}
        onClose={() => {
          setShowDetail(false);
          setSelectedBooking(null);
        }}
        onStatusChange={onRefresh}
      />

      <RevenueBurst
        visible={showRevenueBurst}
        amount={todayRevenue}
        onComplete={() => setShowRevenueBurst(false)}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  containerClosed: { backgroundColor: Colors.CHAI_BREAK_OFF_BG },
  scrollContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.LG,
    paddingBottom: Spacing.MD,
  },
  headerLeft: { flex: 1 },
  businessName: { ...Typography.H2, color: Colors.TEXT, marginBottom: Spacing.XS },
  dateText: { ...Typography.Body2, color: Colors.TEXT_SECONDARY },
  logoutButton: {
    padding: Spacing.SM,
    backgroundColor: Colors.ERROR + '20',
    borderRadius: BorderRadius.MD,
  },
  revenueSection: { paddingHorizontal: Spacing.LG, paddingVertical: Spacing.MD },
  chaiBreakSection: { paddingHorizontal: Spacing.LG, paddingVertical: Spacing.MD },
  scheduleSection: { paddingHorizontal: Spacing.LG, paddingTop: Spacing.LG, paddingBottom: 100 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  sectionTitle: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
    letterSpacing: 1,
  },
  sectionCount: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
  },
  slotsList: { gap: Spacing.SM },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.SURFACE,
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
    height: '100%',
    minHeight: 56,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.XXL,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
  },
  emptyText: { ...Typography.Body1, color: Colors.TEXT_SECONDARY, marginTop: Spacing.MD },
  emptySubtext: { ...Typography.Caption, color: Colors.TEXT_TERTIARY, marginTop: Spacing.XS },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.MD,
    marginTop: Spacing.SM,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    borderWidth: 1,
    borderColor: Colors.SALEX_GREEN + '40',
    gap: Spacing.XS,
  },
  showMoreText: {
    ...Typography.Body2,
    color: Colors.SALEX_GREEN,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.SALEX_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.SALEX_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HomeScreen;
