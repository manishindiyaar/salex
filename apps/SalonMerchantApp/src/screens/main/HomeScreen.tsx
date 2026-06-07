/**
 * HomeScreen (Command Center)
 *
 * Premium revenue-first dashboard:
 * - Business name + date
 * - Today's earnings block
 * - Today's schedule using compact RevenueBookingCards
 * - FAB for quick booking creation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Feather';

// LinearGradient — works in production/preview builds, gracefully falls back in Expo Go
let LinearGradient: any = null;
try {
  const mod = require('expo-linear-gradient');
  // Test if the native view is actually registered (won't be in Expo Go without rebuild)
  const { UIManager, Platform } = require('react-native');
  const viewName = 'ExpoLinearGradient';
  const isAvailable = Platform.OS === 'ios'
    ? UIManager.getViewManagerConfig?.(viewName) != null
    : UIManager.hasViewManagerConfig?.(viewName) ?? false;
  if (isAvailable || mod.LinearGradient?.__isNative === undefined) {
    // Try to use it — if native not available, we'll catch at next level
    LinearGradient = mod.LinearGradient;
  }
} catch (e) {
  // Not available
}
// Final safety: if LinearGradient but native crashes, just don't use it
// We'll just always use the fallback View in Expo Go
const USE_GRADIENT = false; // Set to true after native rebuild includes expo-linear-gradient
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../../navigation/TabNavigator';

import {
  RevenueBlock,
  FloatingRequestCard,
  CheckoutDrawer,
  RevenueBurst,
  SlotCreatorDrawer,
  BookingDetailDrawer,
  RevenueBookingCard,
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
  const insets = useSafeAreaInsets();
  const { business, loading: businessLoading, fetchMe } = useBusinessStore();
  const { items: bookings, listByBusiness } = useBookingStore();
  const { items: services, listByBusiness: loadServices } = useServiceStore();
  const { logout } = useAuth();
  const haptics = useHaptics();
  const whatsappAccess = useFeatureAccess('whatsapp_booking');

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

  useEffect(() => {
    if (!business && !businessLoading) {
      fetchMe();
    }
  }, [business, businessLoading, fetchMe]);

  useEffect(() => {
    if (business?.id) {
      listByBusiness(business.id);
      loadServices(business.id);
    }
  }, [business?.id, listByBusiness, loadServices]);

  useEffect(() => {
    if (bookings && bookings.length > 0) {
      const today = new Date().toDateString();
      const todayBookingsList = bookings.filter((b: any) => {
        return new Date(b.scheduledAt).toDateString() === today;
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

  // Service map for name lookup
  const serviceMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [services]);

  // Today's bookings
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
    if (!bookings || bookings.length === 0) return [];
    const today = new Date().toDateString();
    const filtered = bookings.filter((b: any) => new Date(b.scheduledAt).toDateString() === today);

    return filtered
      .map((b: any) => {
        let serviceName = 'Walk-in Service';
        if (b.items && Array.isArray(b.items) && b.items.length > 0) {
          const names = b.items.map((item: any) => {
            return item.nameSnapshot || item.service?.name || serviceMap[item.serviceId] || 'Service';
          });
          serviceName = names.join(', ');
        } else if (b.serviceIds && Array.isArray(b.serviceIds) && b.serviceIds.length > 0) {
          const names = b.serviceIds.map((id: string) => serviceMap[id] || 'Service');
          serviceName = names.join(', ');
        }

        return {
          id: b.id,
          serviceName,
          customerPhone: b.customer?.phoneNumber || b.customerPhone || 'Walk-in',
          scheduledAt: b.scheduledAt,
          endAt: b.endAt || b.scheduledAt,
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

  const handleSlotPress = useCallback((slot: any) => {
    haptics.light();
    setSelectedBooking(slot);
    setShowDetail(true);
  }, [haptics]);

  const handleAcceptRequest = useCallback(async (bookingId: string) => {
    haptics.heavy();
    setPendingRequest(null);
  }, [haptics]);

  const handleDenyRequest = useCallback(async (bookingId: string) => {
    haptics.heavy();
    setPendingRequest(null);
  }, [haptics]);

  const handleCheckout = useCallback(async (bookingId: string, paymentMethod: PaymentMethod) => {
    haptics.heavy();

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
      await useBookingStore.getState().complete(bookingId, paymentMethod);
    } catch (error: any) {
      if (error.message && error.message.includes('Business account is suspended')) {
        Alert.alert('Account Suspended', 'Your business account has been suspended.', [{ text: 'OK' }]);
        setShowCheckout(false);
        setCheckoutBooking(null);
        return;
      }
    }

    setShowCheckout(false);
    setCheckoutBooking(null);
    if (business?.id) await listByBusiness(business.id);
  }, [haptics, business, listByBusiness]);

  const handleFabPress = useCallback(() => {
    haptics.light();
    if (business?.id) loadServices(business.id);
    setShowSlotCreator(true);
  }, [haptics, business?.id, loadServices]);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  }, [logout]);

  const dateString = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.SALEX_GREEN} />

      {/* Fixed green backdrop — only covers the top, shows on pull-down refresh */}
      <View style={[styles.greenBackdrop, { height: insets.top + 300 }]} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.SURFACE}
            colors={[Colors.SALEX_GREEN]}
          />
        }
      >
        {/* Green gradient top zone — Chime-style diagonal sheen */}
        {USE_GRADIENT && LinearGradient ? (
          <LinearGradient
            colors={['#0A3D29', '#0F5C3C', '#1C8A57', '#0D4A30']}
            locations={[0, 0.45, 0.72, 1]}
            start={{ x: 0.05, y: 0 }}
            end={{ x: 0.95, y: 1 }}
            style={[styles.greenZone, { paddingTop: insets.top + Spacing.MD }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.businessName}>{business?.name || 'Your Business'}</Text>
                <Text style={styles.dateText}>{dateString}</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="log-out" size={18} color={Colors.SURFACE} />
              </TouchableOpacity>
            </View>

            {/* Revenue Block */}
            <View style={styles.revenueSection}>
              <RevenueBlock todayRevenue={todayRevenue} todayBookings={todayBookingsCount} />
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.greenZone, styles.greenZoneFallback, { paddingTop: insets.top + Spacing.MD }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.businessName}>{business?.name || 'Your Business'}</Text>
                <Text style={styles.dateText}>{dateString}</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="log-out" size={18} color={Colors.SURFACE} />
              </TouchableOpacity>
            </View>

            {/* Revenue Block */}
            <View style={styles.revenueSection}>
              <RevenueBlock todayRevenue={todayRevenue} todayBookings={todayBookingsCount} />
            </View>
          </View>
        )}

        {/* Today's Schedule */}
        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>
            <Text style={styles.sectionCount}>
              {todaySlots.length} booking{todaySlots.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {todaySlots.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar" size={32} color={Colors.TEXT_TERTIARY} />
              <Text style={styles.emptyText}>No bookings today</Text>
              <Text style={styles.emptySubtext}>Tap + to create a manual booking</Text>
            </View>
          ) : (
            <View style={styles.slotsList}>
              {todaySlots.map(slot => (
                <RevenueBookingCard
                  key={slot.id}
                  booking={slot}
                  compact
                  onPress={() => handleSlotPress(slot)}
                />
              ))}

              {todaySlots.length > 5 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => {
                    haptics.light();
                    navigation.navigate('Bookings');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.showMoreText}>View all in Bookings</Text>
                  <Icon name="chevron-right" size={16} color={Colors.SALEX_GREEN} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleFabPress} activeOpacity={0.85}>
        <Icon name="plus" size={26} color={Colors.BACKGROUND} />
      </TouchableOpacity>

      {/* Overlays */}
      {pendingRequest && whatsappAccess.allowed && (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  greenBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D4F35',
  },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  greenZone: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XL,
    borderBottomLeftRadius: BorderRadius.XL,
    borderBottomRightRadius: BorderRadius.XL,
  },
  greenZoneFallback: {
    backgroundColor: '#0D4F35',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.MD,
    paddingBottom: Spacing.SM,
  },
  headerLeft: { flex: 1 },
  businessName: { ...Typography.H2, color: Colors.SURFACE, marginBottom: 2 },
  dateText: { ...Typography.Body2, color: 'rgba(255, 255, 255, 0.75)' },
  logoutButton: {
    padding: Spacing.SM,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: BorderRadius.MD,
  },
  revenueSection: { paddingVertical: Spacing.SM },
  scheduleSection: { paddingHorizontal: Spacing.LG, paddingTop: Spacing.LG, paddingBottom: 200, backgroundColor: Colors.BACKGROUND, flexGrow: 1 },
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
    fontWeight: '700',
  },
  sectionCount: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
  },
  slotsList: { gap: 0 },
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
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    borderWidth: 1,
    borderColor: Colors.SALEX_GREEN + '30',
    gap: 6,
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
    width: 56,
    height: 56,
    borderRadius: 28,
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
