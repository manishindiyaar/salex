import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import { GradientView, BookingCard } from '@components/index';
import { Colors, Spacing, Typography, BorderRadius } from '@theme/config';
import { useOnboardingStore } from '@store/onboardingStore';
import { useBusinessStore } from '@store/businessStore';
import { useServiceStore } from '@store/serviceStore';
import { useAuth } from '@context/AuthContext';
import { getBusinessMe } from '@services/businessService';

interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  weeklyBookings: number;
  weeklyRevenue: number;
  totalCustomers: number;
}

interface TodayBooking {
  id: string;
  customerName: string;
  service: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  price: number;
  duration: number;
}

const DashboardScreen: React.FC = () => {
  const { businessDraft } = useOnboardingStore();
  const { business, loading: businessLoading, fetchMe } = useBusinessStore();
  const { items: services = [], loading: servicesLoading, listByBusiness } = useServiceStore();
  const { mockUser, authEnabled, logout } = useAuth();
  const [businessName, setBusinessName] = useState('Loading...');
  
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    todayRevenue: 0,
    weeklyBookings: 0,
    weeklyRevenue: 0,
    totalCustomers: 0,
  });

  // Load real business data
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        if (!business && !businessLoading) {
          fetchMe();
        }
      } catch (error) {
        console.error('Failed to load business data:', error);
      }
    };

    loadBusinessData();
  }, [business, businessLoading, fetchMe]);

  // Load services when business is available
  useEffect(() => {
    if (business?.id) {
      console.log('📊 Loading services for dashboard:', business.id);
      listByBusiness(business.id, { page: 1, pageSize: 50 });
      setBusinessName(business.name || 'Your Business');
    }
  }, [business, listByBusiness]);

  // Update stats based on real services
  useEffect(() => {
    if (services && services.length >= 0) {
      console.log('📈 Updating dashboard stats with', services.length, 'services');
      // Calculate basic stats from services
      const totalRevenue = services.reduce((sum, service) => sum + (service.priceCents || 0), 0) / 100;
      
      setStats({
        todayBookings: Math.floor(services.length * 0.3), // Rough estimate: 30% of services might be booked today
        todayRevenue: Math.floor(totalRevenue * 0.2), // Rough estimate: 20% of total service value as daily revenue
        weeklyBookings: Math.floor(services.length * 2.1), // Rough estimate: each service booked ~2x per week
        weeklyRevenue: Math.floor(totalRevenue * 1.4), // Rough estimate: 140% of total service value as weekly revenue
        totalCustomers: services.length * 8, // Rough estimate: 8 customers per service on average
      });
    }
  }, [services]);

  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([
    {
      id: '1',
      customerName: 'Sarah Johnson',
      service: 'Haircut & Style',
      time: '09:00 AM',
      status: 'COMPLETED',
      price: 45,
      duration: 60,
    },
    {
      id: '2',
      customerName: 'Mike Chen',
      service: 'Beard Trim',
      time: '10:30 AM',
      status: 'COMPLETED',
      price: 25,
      duration: 30,
    },
    {
      id: '3',
      customerName: 'Emily Davis',
      service: 'Hair Color',
      time: '11:00 AM',
      status: 'IN_PROGRESS',
      price: 85,
      duration: 120,
    },
    {
      id: '4',
      customerName: 'James Wilson',
      service: 'Classic Haircut',
      time: '02:00 PM',
      status: 'CONFIRMED',
      price: 35,
      duration: 45,
    },
    {
      id: '5',
      customerName: 'Lisa Brown',
      service: 'Deep Conditioning',
      time: '03:30 PM',
      status: 'PENDING',
      price: 25,
      duration: 30,
    },
  ]);

  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      `Are you sure you want to sign out${mockUser?.displayName ? `, ${mockUser.displayName}` : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout();
            console.log('✅ User signed out successfully');
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh business data
      await fetchMe();
      
      // Reload services if business is available
      if (business?.id) {
        await listByBusiness(business.id, { page: 1, pageSize: 50 });
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const quickActions = [
    {
      id: 'new-booking',
      title: 'New Booking',
      icon: 'plus-circle',
      color: Colors.PRIMARY,
      onPress: () => console.log('New booking'),
    },
    {
      id: 'view-calendar',
      title: 'View Calendar',
      icon: 'calendar',
      color: Colors.SUCCESS,
      onPress: () => console.log('View calendar'),
    },
    {
      id: 'add-service',
      title: 'Add Service',
      icon: 'scissors',
      color: Colors.WARNING,
      onPress: () => console.log('Add service'),
    },
    {
      id: 'qr-code',
      title: 'Share QR',
      icon: 'square',
      color: Colors.PRIMARY,
      onPress: () => console.log('Share QR'),
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderStatCard = (title: string, value: string, subtitle: string, icon: string) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Icon name={icon} size={20} color={Colors.PRIMARY} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderQuickAction = ({ item }: { item: typeof quickActions[0] }) => (
    <TouchableOpacity
      style={styles.quickActionCard}
      onPress={item.onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: item.color + '20' }]}>
        <Icon name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={styles.quickActionText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderTodayBooking = ({ item }: { item: TodayBooking }) => (
    <View style={styles.bookingItem}>
      <View style={styles.bookingTime}>
        <Text style={styles.bookingTimeText}>{item.time}</Text>
      </View>
      <View style={styles.bookingDetails}>
        <Text style={styles.bookingCustomer}>{item.customerName}</Text>
        <Text style={styles.bookingService}>{item.service}</Text>
        <View style={styles.bookingMeta}>
          <Text style={styles.bookingPrice}>{formatCurrency(item.price)}</Text>
          <View style={styles.bookingDuration}>
            <Icon name="clock" size={12} color={Colors.TEXT_TERTIARY} />
            <Text style={styles.bookingDurationText}>{item.duration}min</Text>
          </View>
        </View>
      </View>
      <View style={[styles.bookingStatus, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.bookingStatusText}>{item.status}</Text>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return Colors.SUCCESS + '20';
      case 'IN_PROGRESS': return Colors.WARNING + '20';
      case 'CONFIRMED': return Colors.PRIMARY + '20';
      case 'PENDING': return Colors.TEXT_TERTIARY + '20';
      case 'CANCELLED': return Colors.ERROR + '20';
      default: return Colors.TEXT_TERTIARY + '20';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.BACKGROUND} />
      <GradientView variant="dark" style={styles.gradient}>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.PRIMARY}
              colors={[Colors.PRIMARY]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.businessName}>
                {businessName}
              </Text>
              {mockUser && (
                <Text style={styles.userName}>
                  Signed in as {mockUser.displayName}
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.notificationButton}>
                <Icon name="bell" size={24} color={Colors.TEXT} />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>3</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleLogout}
              >
                <Icon name="log-out" size={20} color={Colors.ERROR} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              {renderStatCard(
                'Today',
                stats.todayBookings.toString(),
                'bookings',
                'calendar'
              )}
              {renderStatCard(
                'Revenue',
                formatCurrency(stats.todayRevenue),
                'today',
                'dollar-sign'
              )}
            </View>
            <View style={styles.statsRow}>
              {renderStatCard(
                'This Week',
                stats.weeklyBookings.toString(),
                'bookings',
                'trending-up'
              )}
              {renderStatCard(
                'Customers',
                stats.totalCustomers.toString(),
                'total',
                'users'
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <FlatList
              data={quickActions}
              renderItem={renderQuickAction}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsList}
            />
          </View>

          {/* Today's Bookings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.bookingsList}>
              {todayBookings.map(booking => (
                <View key={booking.id}>
                  {renderTodayBooking({ item: booking })}
                </View>
              ))}
            </View>
          </View>

          {/* Business Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Insights</Text>
            <View style={styles.insightsCard}>
              <View style={styles.insightItem}>
                <Icon name="scissors" size={16} color={Colors.SUCCESS} />
                <Text style={styles.insightText}>
                  You have {services.length} services available
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Icon name="star" size={16} color={Colors.WARNING} />
                <Text style={styles.insightText}>
                  {businessName} is ready to accept bookings
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Icon name="clock" size={16} color={Colors.PRIMARY} />
                <Text style={styles.insightText}>
                  {business?.address ? 'Location set and ready' : 'Add your business address'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </GradientView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.XL,
    paddingBottom: Spacing.LG,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.MD,
  },
  greeting: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.XS,
  },
  businessName: {
    ...Typography.H2,
    color: Colors.TEXT,
  },
  userName: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
    marginTop: Spacing.XS,
    fontSize: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: Spacing.SM,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    ...Typography.Caption,
    color: Colors.TEXT,
    fontSize: 10,
    fontWeight: '700',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ERROR + '20',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    gap: Spacing.XS,
  },
  signOutText: {
    ...Typography.Caption,
    color: Colors.ERROR,
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: Spacing.LG,
    marginBottom: Spacing.XL,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  statTitle: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginLeft: Spacing.SM,
  },
  statValue: {
    ...Typography.H3,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  statSubtitle: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
  },
  section: {
    paddingHorizontal: Spacing.LG,
    marginBottom: Spacing.XL,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  sectionTitle: {
    ...Typography.H4,
    color: Colors.TEXT,
  },
  seeAllText: {
    ...Typography.Body2,
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  quickActionsList: {
    paddingRight: Spacing.LG,
  },
  quickActionCard: {
    alignItems: 'center',
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginRight: Spacing.MD,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    width: 100,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.MD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  quickActionText: {
    ...Typography.Body2,
    color: Colors.TEXT,
    textAlign: 'center',
    fontSize: 12,
  },
  bookingsList: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.MD,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  bookingTime: {
    width: 70,
    marginRight: Spacing.MD,
  },
  bookingTimeText: {
    ...Typography.Body2,
    color: Colors.PRIMARY,
    fontWeight: '600',
    fontSize: 12,
  },
  bookingDetails: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  bookingCustomer: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  bookingService: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.XS,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.MD,
  },
  bookingPrice: {
    ...Typography.Body2,
    color: Colors.SUCCESS,
    fontWeight: '600',
  },
  bookingDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingDurationText: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
    marginLeft: Spacing.XS,
  },
  bookingStatus: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  bookingStatusText: {
    ...Typography.Caption,
    color: Colors.TEXT,
    fontWeight: '600',
    fontSize: 10,
  },
  insightsCard: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  insightText: {
    ...Typography.Body2,
    color: Colors.TEXT,
    marginLeft: Spacing.MD,
    flex: 1,
  },
});

export default DashboardScreen;