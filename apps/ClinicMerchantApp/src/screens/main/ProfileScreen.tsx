/**
 * ProfileScreen (My Account)
 * 
 * High-Strength styled account screen with:
 * - Business profile header with avatar
 * - Quick stats card
 * - Clean menu sections
 * - Edit business info modal
 * - Edit business hours modal
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';
import { useBusinessStore } from '../../store/businessStore';
import { useServiceStore } from '../../store/serviceStore';
import { useBookingStore } from '../../store/bookingStore';
import { useResourceStore } from '../../store/resourceStore';
import { useStaffStore } from '../../store/staffStore';
import { useAuth } from '../../context/AuthContext';
import { useHaptics } from '../../hooks/useHaptics';
import { useCategoryConfig } from '../../hooks/useCategoryConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SubscriptionCard,
  TrialBanner,
  GraceBanner,
  ExpiredAlert,
  AccountSuspendedBanner,
  SubscriptionInfo,
} from '../../components/subscription';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  color?: string;
  onPress: () => void;
  rightText?: string;
  danger?: boolean;
}

// Helper function to format category label for display
const formatCategoryLabel = (category: string): string => {
  const categoryLabels: Record<string, string> = {
    SALON: 'Salon',
    SPA: 'Spa',
    CLINIC: 'Clinic',
    BEAUTY_PARLOR: 'Beauty Parlor',
    FITNESS: 'Fitness Center',
    BARBERSHOP: 'Barbershop',
    WELLNESS: 'Wellness Center',
  };
  return categoryLabels[category] || category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, ' ');
};

const ProfileScreen: React.FC = () => {
  const { business, loading, updating, updatingHours, fetchMe, update, updateHours } = useBusinessStore();
  const { items: services } = useServiceStore();
  const { items: bookings } = useBookingStore();
  const { items: resources } = useResourceStore();
  const { items: staff } = useStaffStore();
  const { logout } = useAuth();
  const haptics = useHaptics();
  const navigation = useNavigation<any>();
  const categoryConfig = useCategoryConfig();

  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    phoneNumber: '',
  });

  // Business hours state
  const [businessHours, setBusinessHours] = useState<{
    [key: string]: { open: string; close: string; closed: boolean };
  }>({});

  // Subscription info derived from business
  const subscriptionInfo = useMemo((): SubscriptionInfo | null => {
    const subscription = (business as any)?.subscription;
    if (!subscription) return null;

    const now = new Date();
    let daysRemaining: number | undefined;

    if (subscription.status === 'TRIAL' && subscription.trialEndsAt) {
      const trialEnd = new Date(subscription.trialEndsAt);
      daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    } else if (subscription.currentPeriodEnd) {
      const periodEnd = new Date(subscription.currentPeriodEnd);
      daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return {
      plan: subscription.plan,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      daysRemaining,
    };
  }, [business]);

  // Check if business is suspended
  const isBusinessSuspended = business?.isActive === false;

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (business) {
      setEditForm({
        name: business.name || '',
        phoneNumber: business.phoneNumber || '',
      });

      if (business.hoursOfOperation) {
        setBusinessHours(business.hoursOfOperation as any);
      } else {
        setBusinessHours({
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '10:00', close: '16:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: true },
        });
      }
    }
  }, [business]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMe();
    setRefreshing(false);
  }, [fetchMe]);

  // Calculate stats
  const completedBookings = bookings?.filter((b: any) => b.status === 'COMPLETED').length || 0;
  const totalRevenue = bookings
    ?.filter((b: any) => b.status === 'COMPLETED')
    .reduce((sum: number, b: any) => sum + (Number(b.totalPrice) || 0), 0) || 0;

  const handleSaveBusinessInfo = async () => {
    if (!business || !editForm.name.trim()) return;
    
    haptics.medium();
    try {
      await update(business.id, {
        name: editForm.name.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
      });
      haptics.heavy();
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update business:', error);
      Alert.alert('Error', 'Failed to update business info');
    }
  };

  const handleSaveBusinessHours = async () => {
    if (!business) return;
    
    haptics.medium();
    try {
      await updateHours(business.id, businessHours);
      haptics.heavy();
      setShowHoursModal(false);
    } catch (error) {
      console.error('Failed to update hours:', error);
      Alert.alert('Error', 'Failed to update business hours');
    }
  };

  const toggleDayClosed = (day: string) => {
    haptics.light();
    setBusinessHours(prev => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day]?.closed },
    }));
  };

  const handleLogout = () => {
    haptics.medium();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['@salex_onboarded', 'business_id']);
            logout();
          } catch (error) {
            logout();
          }
        },
      },
    ]);
  };

  const businessMenuItems: MenuItem[] = [
    {
      id: 'edit-info',
      title: 'Business Information',
      icon: 'edit-3',
      onPress: () => {
        haptics.light();
        setShowEditModal(true);
      },
    },
    {
      id: 'hours',
      title: 'Business Hours',
      icon: 'clock',
      onPress: () => {
        haptics.light();
        setShowHoursModal(true);
      },
    },
    {
      id: 'resources',
      title: `${categoryConfig.terminology.resourcePlural}`,
      icon: 'grid',
      rightText: `${resources.filter(r => r.isActive).length} active`,
      onPress: () => {
        haptics.light();
        navigation.navigate('ResourceManagement');
      },
    },
    {
      id: 'staff',
      title: categoryConfig.terminology.staffPlural,
      icon: 'users',
      rightText: `${staff.filter(s => s.isActive).length} active`,
      onPress: () => {
        haptics.light();
        navigation.navigate('StaffManagement');
      },
    },
    {
      id: 'qr-code',
      title: 'QR Code',
      icon: 'maximize',
      rightText: business?.routingCode || '----',
      onPress: () => {
        haptics.light();
        Alert.alert('QR Code', `Your routing code is: ${business?.routingCode || 'Not set'}`);
      },
    },
  ];

  const settingsMenuItems: MenuItem[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'bell',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings coming soon'),
    },
    {
      id: 'language',
      title: 'Language',
      icon: 'globe',
      rightText: 'English',
      onPress: () => Alert.alert('Coming Soon', 'Language settings coming soon'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle',
      onPress: () => Alert.alert('Support', 'Contact us at support@salex.app'),
    },
  ];

  const accountMenuItems: MenuItem[] = [
    {
      id: 'logout',
      title: 'Sign Out',
      icon: 'log-out',
      danger: true,
      onPress: handleLogout,
    },
  ];

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
        <Icon 
          name={item.icon} 
          size={20} 
          color={item.danger ? Colors.ERROR : Colors.TEXT} 
        />
      </View>
      <Text style={[styles.menuTitle, item.danger && styles.menuTitleDanger]}>
        {item.title}
      </Text>
      {item.rightText ? (
        <Text style={styles.menuRightText}>{item.rightText}</Text>
      ) : (
        <Icon name="chevron-right" size={20} color={Colors.TEXT_TERTIARY} />
      )}
    </TouchableOpacity>
  );

  const renderMenuSection = (title: string, items: MenuItem[]) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {items.map((item, index) => renderMenuItem(item, index === items.length - 1))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.BACKGROUND} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => {
            haptics.light();
            setShowEditModal(true);
          }}
        >
          <Icon name="settings" size={22} color={Colors.TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.SALEX_GREEN}
          />
        }
      >
        {/* Account Suspended Banner */}
        {isBusinessSuspended && (
          <AccountSuspendedBanner />
        )}

        {/* Subscription Status Banners */}
        {subscriptionInfo?.status === 'TRIAL' && subscriptionInfo.daysRemaining !== undefined && (
          <View style={styles.bannerContainer}>
            <TrialBanner
              daysRemaining={subscriptionInfo.daysRemaining}
              onUpgrade={() => Alert.alert('Upgrade', 'Contact support to upgrade your plan')}
            />
          </View>
        )}

        {subscriptionInfo?.status === 'GRACE' && subscriptionInfo.daysRemaining !== undefined && (
          <View style={styles.bannerContainer}>
            <GraceBanner daysRemaining={subscriptionInfo.daysRemaining} />
          </View>
        )}

        {subscriptionInfo?.status === 'EXPIRED' && (
          <View style={styles.bannerContainer}>
            <ExpiredAlert />
          </View>
        )}

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Icon name="briefcase" size={32} color={Colors.SALEX_GREEN} />
            </View>
          </View>
          <Text style={styles.businessName}>
            {loading ? 'Loading...' : business?.name || 'Your Business'}
          </Text>
          <Text style={styles.businessType}>
            {business?.category ? formatCategoryLabel(business.category) : 'Business'}
          </Text>
          {business?.phoneNumber && (
            <View style={styles.phoneRow}>
              <Icon name="phone" size={14} color={Colors.TEXT_TERTIARY} />
              <Text style={styles.phoneText}>{business.phoneNumber}</Text>
            </View>
          )}
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{services.length}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedBookings}</Text>
            <Text style={styles.statLabel}>{categoryConfig.terminology.bookingPlural}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.SALEX_GREEN }]}>
              ₹{totalRevenue.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        {/* Subscription Card */}
        {subscriptionInfo && (
          <View style={styles.subscriptionSection}>
            <SubscriptionCard
              subscription={subscriptionInfo}
              onUpgrade={() => Alert.alert('Upgrade', 'Contact support to upgrade your plan')}
            />
          </View>
        )}

        {/* Menu Sections */}
        {renderMenuSection('Business', businessMenuItems)}
        {renderMenuSection('Settings', settingsMenuItems)}
        {renderMenuSection('Account', accountMenuItems)}

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Salex v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Business Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Business</Text>
              <TouchableOpacity 
                onPress={handleSaveBusinessInfo}
                disabled={updating || !editForm.name.trim()}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={Colors.SALEX_GREEN} />
                ) : (
                  <Text style={[
                    styles.modalSave,
                    !editForm.name.trim() && styles.modalSaveDisabled
                  ]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                  placeholder="Enter business name"
                  placeholderTextColor={Colors.TEXT_TERTIARY}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.phoneNumber}
                  onChangeText={(text) => setEditForm({ ...editForm, phoneNumber: text })}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={Colors.TEXT_TERTIARY}
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Business Hours Modal */}
      <Modal
        visible={showHoursModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHoursModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHoursModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Business Hours</Text>
            <TouchableOpacity onPress={handleSaveBusinessHours} disabled={updatingHours}>
              {updatingHours ? (
                <ActivityIndicator size="small" color={Colors.SALEX_GREEN} />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            {Object.entries(businessHours).map(([day, hours]) => (
              <View key={day} style={styles.dayRow}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Text>
                  {!hours?.closed && (
                    <Text style={styles.dayHours}>
                      {hours?.open || '09:00'} - {hours?.close || '18:00'}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.dayToggle,
                    hours?.closed ? styles.dayToggleClosed : styles.dayToggleOpen,
                  ]}
                  onPress={() => toggleDayClosed(day)}
                >
                  <Text style={[
                    styles.dayToggleText,
                    hours?.closed ? styles.dayToggleTextClosed : styles.dayToggleTextOpen,
                  ]}>
                    {hours?.closed ? 'Closed' : 'Open'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};


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
  headerTitle: {
    ...Typography.H2,
    color: Colors.TEXT,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.MD,
  },
  subscriptionSection: {
    paddingHorizontal: Spacing.LG,
    marginBottom: Spacing.LG,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: Spacing.XL,
    paddingHorizontal: Spacing.LG,
  },
  avatarContainer: {
    marginBottom: Spacing.MD,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.SALEX_GREEN + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.SALEX_GREEN,
  },
  businessName: {
    ...Typography.H2,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  businessType: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.SM,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  phoneText: {
    ...Typography.Body2,
    color: Colors.TEXT_TERTIARY,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.SURFACE,
    marginHorizontal: Spacing.LG,
    marginBottom: Spacing.LG,
    borderRadius: BorderRadius.LG,
    paddingVertical: Spacing.LG,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.BORDER,
  },
  statValue: {
    ...Typography.H3,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  statLabel: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
  },
  menuSection: {
    marginBottom: Spacing.LG,
    paddingHorizontal: Spacing.LG,
  },
  sectionTitle: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.SM,
    marginLeft: Spacing.SM,
  },
  menuCard: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  menuIconDanger: {
    backgroundColor: Colors.ERROR + '15',
  },
  menuTitle: {
    ...Typography.Body1,
    color: Colors.TEXT,
    flex: 1,
  },
  menuTitleDanger: {
    color: Colors.ERROR,
  },
  menuRightText: {
    ...Typography.Body2,
    color: Colors.TEXT_TERTIARY,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.XL,
  },
  versionText: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  modalCancel: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
  },
  modalTitle: {
    ...Typography.H3,
    color: Colors.TEXT,
  },
  modalSave: {
    ...Typography.Body1,
    color: Colors.SALEX_GREEN,
    fontWeight: '600',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalForm: {
    flex: 1,
    padding: Spacing.LG,
  },
  inputGroup: {
    marginBottom: Spacing.LG,
  },
  inputLabel: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.SM,
  },
  textInput: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.MD,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    ...Typography.Body1,
    color: Colors.TEXT,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Hours modal styles
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.SURFACE,
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.SM,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
  },
  dayHours: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
    marginTop: 2,
  },
  dayToggle: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    minWidth: 70,
    alignItems: 'center',
  },
  dayToggleOpen: {
    backgroundColor: Colors.SALEX_GREEN + '20',
  },
  dayToggleClosed: {
    backgroundColor: Colors.ERROR + '20',
  },
  dayToggleText: {
    ...Typography.Caption,
    fontWeight: '600',
  },
  dayToggleTextOpen: {
    color: Colors.SALEX_GREEN,
  },
  dayToggleTextClosed: {
    color: Colors.ERROR,
  },
});

export default ProfileScreen;
