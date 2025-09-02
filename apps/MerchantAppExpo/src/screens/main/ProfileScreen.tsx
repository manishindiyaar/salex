import React from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import { GradientView, Button, Input } from '@components/index';
import { Colors, Spacing, Typography, BorderRadius } from '@theme/config';
import { useOnboardingStore } from '@store/onboardingStore';
import { useServiceStore } from '@store/serviceStore';
import { useBusinessStore } from '@store/businessStore';
import { useAuth } from '@context/AuthContext';
import { useState, useEffect } from 'react';
import { getBusinessMe } from '@services/businessService';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Business types from the database schema
type BusinessType = 'SALON' | 'GENERAL_STORE' | 'FOOD_VENDOR';  


interface ProfileMenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  onPress: () => void;
  showChevron?: boolean;
}

const ProfileScreen: React.FC = () => {
  const { reset } = useOnboardingStore();
  const { items: services = [] } = useServiceStore();
  const { business, loading, updating, updatingHours, fetchMe, update, updateHours } = useBusinessStore();
  const { logout } = useAuth();
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    businessType: 'SALON' as BusinessType,
    phoneNumber: '',
    address: '',
  });
  
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phoneNumber?: string;
    address?: string;
  }>({});
  
  // Business hours state - loaded from database
  const [businessHours, setBusinessHours] = useState<{
    [key: string]: { open: string; close: string; closed: boolean };
  }>({});
  
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Loading...',
    type: 'SALON' as BusinessType,
    phone: '+1234567890',
    address: 'Loading address...',
  });

  // Load business data on component mount
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);
  
  // Update local state when business data changes
  useEffect(() => {
    if (business) {
      setBusinessInfo({
        name: business.name || 'Your Business',
        type: business.businessType || 'SALON',
        phone: business.phoneNumber || '+1234567890',
        address: business.address || 'Business address not set',
      });
      
      // Update form with business data
      setEditForm({
        name: business.name || '',
        businessType: business.businessType || 'SALON',
        phoneNumber: business.phoneNumber || '',
        address: business.address || '',
      });
      
      // Load business hours from database
      if (business.hoursOfOperation) {
        setBusinessHours(business.hoursOfOperation);
      } else {
        // Set default hours if none exist
        setBusinessHours({
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '10:00', close: '16:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: true },
        });
      }
    }
  }, [business]);

  // FORM VALIDATION
  const validateForm = () => {
    const errors: typeof formErrors = {};
    
    if (!editForm.name.trim()) {
      errors.name = 'Business name is required';
    } else if (editForm.name.length < 2 || editForm.name.length > 100) {
      errors.name = 'Business name must be between 2 and 100 characters';
    }
    
    if (!editForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\+[1-9]\d{1,14}$/.test(editForm.phoneNumber)) {
      errors.phoneNumber = 'Phone number must be in E.164 format (e.g., +1234567890)';
    }
    
    if (!editForm.address.trim()) {
      errors.address = 'Business address is required';
    } else if (editForm.address.length < 10 || editForm.address.length > 200) {
      errors.address = 'Address must be between 10 and 200 characters';
    }
    
    return { errors, isValid: Object.keys(errors).length === 0 };
  };
  
  // MODAL HANDLERS
  const handleEditBusinessInfo = () => {
    if (business) {
      setEditForm({
        name: business.name || '',
        businessType: business.businessType || 'SALON',
        phoneNumber: business.phoneNumber || '',
        address: business.address || '',
      });
      setFormErrors({});
      setShowEditModal(true);
    }
  };
  
  const handleSaveBusinessInfo = async () => {
    const validation = validateForm();
    setFormErrors(validation.errors);
    
    if (!validation.isValid || !business) return;
    
    try {
      await update(business.id, {
        name: editForm.name.trim(),
        businessType: editForm.businessType as any, // Cast to work around shared-types limitation
        phoneNumber: editForm.phoneNumber.trim(),
        address: editForm.address.trim(),
      });
      setShowEditModal(false);
    } catch (error) {
      console.error('❌ Failed to update business:', error);
    }
  };
  
  const resetEditModal = () => {
    setShowEditModal(false);
    setFormErrors({});
  };
  
  // BUSINESS HOURS HANDLERS
  const handleEditBusinessHours = () => {
    setShowHoursModal(true);
  };
  
  const handleSaveBusinessHours = async () => {
    if (!business) return;
    
    try {
      await updateHours(business.id, businessHours);
      setShowHoursModal(false);
    } catch (error) {
      console.error('❌ Failed to update business hours:', error);
    }
  };
  
  const resetHoursModal = () => {
    setShowHoursModal(false);
  };
  
  const updateDayHours = (day: string, field: 'open' | 'close', value: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }));
  };
  
  const toggleDayClosed = (day: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed: !prev[day]?.closed,
      }
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all app data
              await AsyncStorage.multiRemove(['@salex_onboarded', 'business_id']);
              reset();
              logout();
              console.log('✅ Logout completed - all data cleared');
            } catch (error) {
              console.error('❌ Logout error:', error);
              // Still proceed with logout
              reset();
              logout();
            }
          }
        }
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset your app to the onboarding flow. This is useful for testing. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all app data
              await AsyncStorage.multiRemove(['@salex_onboarded', 'business_id']);
              reset();
              logout();
              console.log('✅ Onboarding reset completed - all data cleared');
            } catch (error) {
              console.error('❌ Reset error:', error);
              // Still proceed with reset
              reset();
              logout();
            }
          }
        }
      ]
    );
  };

  const menuSections: { title: string; items: ProfileMenuItem[] }[] = [
    {
      title: 'Business',
      items: [
        {
          id: 'business-info',
          title: 'Business Information',
          subtitle: 'Name, address, contact details',
          icon: 'briefcase',
          color: Colors.PRIMARY,
          onPress: handleEditBusinessInfo,
          showChevron: true,
        },
        {
          id: 'business-hours',
          title: 'Business Hours',
          subtitle: 'Operating hours and availability',
          icon: 'clock',
          color: Colors.SUCCESS,
          onPress: handleEditBusinessHours,
          showChevron: true,
        },
        {
          id: 'services',
          title: 'Manage Services',
          subtitle: 'Add, edit, or remove services',
          icon: 'scissors',
          color: Colors.WARNING,
          onPress: () => console.log('Manage services'),
          showChevron: true,
        },
        {
          id: 'qr-code',
          title: 'QR Code',
          subtitle: 'Share your booking link',
          icon: 'square',
          color: Colors.PRIMARY,
          onPress: () => console.log('QR code'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          id: 'reports',
          title: 'Business Reports',
          subtitle: 'Revenue, bookings, and insights',
          icon: 'bar-chart-2',
          color: Colors.SUCCESS,
          onPress: () => console.log('Reports'),
          showChevron: true,
        },
        {
          id: 'customer-insights',
          title: 'Customer Insights',
          subtitle: 'Customer behavior and preferences',
          icon: 'users',
          color: Colors.PRIMARY,
          onPress: () => console.log('Customer insights'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Manage notification preferences',
          icon: 'bell',
          color: Colors.WARNING,
          onPress: () => console.log('Notifications'),
          showChevron: true,
        },
        {
          id: 'privacy',
          title: 'Privacy & Security',
          subtitle: 'Data and security settings',
          icon: 'shield',
          color: Colors.SUCCESS,
          onPress: () => console.log('Privacy'),
          showChevron: true,
        },
        {
          id: 'backup',
          title: 'Backup & Sync',
          subtitle: 'Data backup and synchronization',
          icon: 'cloud',
          color: Colors.PRIMARY,
          onPress: () => console.log('Backup'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'FAQs and customer support',
          icon: 'help-circle',
          color: Colors.PRIMARY,
          onPress: () => console.log('Help'),
          showChevron: true,
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          icon: 'message-square',
          color: Colors.SUCCESS,
          onPress: () => console.log('Feedback'),
          showChevron: true,
        },
        {
          id: 'about',
          title: 'About Salex',
          subtitle: 'App version and information',
          icon: 'info',
          color: Colors.TEXT_SECONDARY,
          onPress: () => console.log('About'),
          showChevron: true,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'reset-onboarding',
          title: 'Reset Onboarding',
          subtitle: 'Go back to onboarding (for testing)',
          icon: 'refresh-cw',
          color: Colors.WARNING,
          onPress: handleResetOnboarding,
          showChevron: false,
        },
        {
          id: 'logout',
          title: 'Logout',
          subtitle: 'Sign out of your account',
          icon: 'log-out',
          color: Colors.ERROR,
          onPress: handleLogout,
          showChevron: false,
        },
      ],
    },
  ];

  const getBusinessTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      'SALON': 'Hair Salon',
      'GENERAL_STORE': 'General Store',
      'FOOD_VENDOR': 'Food Vendor',
    };
    return types[type] || type;
  };

  const renderMenuItem = (item: ProfileMenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
        <Icon name={item.icon} size={20} color={item.color} />
      </View>
      
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        {item.subtitle && (
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      
      {item.showChevron && (
        <Icon name="chevron-right" size={20} color={Colors.TEXT_SECONDARY} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.BACKGROUND} />
      <GradientView variant="dark" style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.editButton} onPress={handleEditBusinessInfo}>
              <Icon name="edit-2" size={20} color={Colors.PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
              <Icon name="log-out" size={20} color={Colors.ERROR} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Business Info Card */}
          <View style={styles.businessCard}>
            <View style={styles.businessHeader}>
              <View style={styles.businessIcon}>
                <Icon name="briefcase" size={32} color={Colors.PRIMARY} />
              </View>
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{businessInfo.name}</Text>
                <Text style={styles.businessType}>
                  {getBusinessTypeDisplay(businessInfo.type)}
                </Text>
              </View>
            </View>

            <View style={styles.businessDetails}>
              <View style={styles.businessDetail}>
                <Icon name="phone" size={16} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.businessDetailText}>{businessInfo.phone}</Text>
              </View>
              
              
              <View style={styles.businessDetail}>
                <Icon name="map-pin" size={16} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.businessDetailText} numberOfLines={3}>
                  {businessInfo.address}
                </Text>
              </View>
              
              {loading && (
                <View style={styles.businessDetail}>
                  <ActivityIndicator size="small" color={Colors.TEXT_SECONDARY} style={{width: 16, height: 16}} />
                  <Text style={styles.businessDetailText}>Loading business data...</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{services.length * 12}</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{services.length}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Menu Sections */}
          {/* Edit Business Modal */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={resetEditModal}
        >
          <SafeAreaView style={styles.modalContainer}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={resetEditModal} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Business</Text>
                <TouchableOpacity 
                  onPress={handleSaveBusinessInfo} 
                  style={[styles.saveButton, (!editForm.name.trim() || !editForm.phoneNumber.trim() || !editForm.address.trim()) && styles.saveButtonDisabled]}
                  disabled={updating || !editForm.name.trim() || !editForm.phoneNumber.trim() || !editForm.address.trim()}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color={Colors.PRIMARY} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                <Input
                  value={editForm.name}
                  onChangeText={(text) => {
                    setEditForm({ ...editForm, name: text });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                  }}
                  placeholder="Business name"
                  error={formErrors.name}
                  leftIcon="briefcase"
                  containerStyle={styles.inputContainer}
                />

                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Business Type</Text>
                  <View style={styles.pickerButtonsContainer}>
                    {(['SALON', 'GENERAL_STORE', 'FOOD_VENDOR'] as BusinessType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.pickerButton,
                          editForm.businessType === type && styles.pickerButtonSelected,
                        ]}
                        onPress={() => setEditForm({ ...editForm, businessType: type })}
                      >
                        <Text style={[
                          styles.pickerButtonText,
                          editForm.businessType === type && styles.pickerButtonTextSelected,
                        ]}>
                          {getBusinessTypeDisplay(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Input
                  value={editForm.phoneNumber}
                  onChangeText={(text) => {
                    setEditForm({ ...editForm, phoneNumber: text });
                    if (formErrors.phoneNumber) setFormErrors({ ...formErrors, phoneNumber: undefined });
                  }}
                  placeholder="Phone number (e.g., +1234567890)"
                  error={formErrors.phoneNumber}
                  leftIcon="phone"
                  keyboardType="phone-pad"
                  containerStyle={styles.inputContainer}
                />

                <Input
                  value={editForm.address}
                  onChangeText={(text) => {
                    setEditForm({ ...editForm, address: text });
                    if (formErrors.address) setFormErrors({ ...formErrors, address: undefined });
                  }}
                  placeholder="Business address"
                  error={formErrors.address}
                  leftIcon="map-pin"
                  multiline
                  numberOfLines={3}
                  containerStyle={styles.inputContainer}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>

        {/* Business Hours Modal */}
        <Modal
          visible={showHoursModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={resetHoursModal}
        >
          <SafeAreaView style={styles.modalContainer}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={resetHoursModal} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Business Hours</Text>
                <TouchableOpacity 
                  onPress={handleSaveBusinessHours} 
                  style={styles.saveButton}
                  disabled={updatingHours}
                >
                  {updatingHours ? (
                    <ActivityIndicator size="small" color={Colors.PRIMARY} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                {Object.entries(businessHours).map(([day, hours]) => (
                  <View key={day} style={styles.dayHoursContainer}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayName}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.closedToggle,
                          hours?.closed && styles.closedToggleActive,
                        ]}
                        onPress={() => toggleDayClosed(day)}
                      >
                        <Text style={[
                          styles.closedToggleText,
                          hours?.closed && styles.closedToggleTextActive,
                        ]}>
                          {hours?.closed ? 'Closed' : 'Open'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {!hours?.closed && (
                      <View style={styles.timeInputsContainer}>
                        <View style={styles.timeInput}>
                          <Text style={styles.timeLabel}>Open</Text>
                          <TouchableOpacity style={styles.timeButton}>
                            <Text style={styles.timeButtonText}>
                              {hours?.open || '09:00'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        
                        <Icon name="minus" size={16} color={Colors.TEXT_SECONDARY} />
                        
                        <View style={styles.timeInput}>
                          <Text style={styles.timeLabel}>Close</Text>
                          <TouchableOpacity style={styles.timeButton}>
                            <Text style={styles.timeButtonText}>
                              {hours?.close || '17:00'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
                
                <View style={styles.hoursNote}>
                  <Icon name="info" size={16} color={Colors.TEXT_TERTIARY} />
                  <Text style={styles.hoursNoteText}>
                    These hours will be displayed to customers when booking services
                  </Text>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>

        {/* Menu Sections */}
        {menuSections.map((section) => (
            <View key={section.title} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuItems}>
                {section.items.map((item, itemIndex) => (
                  <View key={item.id}>
                    {renderMenuItem(item)}
                    {itemIndex < section.items.length - 1 && (
                      <View style={styles.menuSeparator} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Salex v1.0.0</Text>
            <Text style={styles.versionSubtext}>
              Made with ❤️ for salon owners
            </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.XL,
    paddingBottom: Spacing.LG,
  },
  headerTitle: {
    ...Typography.H2,
    color: Colors.TEXT,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.SM,
    backgroundColor: Colors.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.SM,
    backgroundColor: Colors.ERROR + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XL,
  },
  businessCard: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  businessIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.MD,
    backgroundColor: Colors.PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    ...Typography.H3,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  businessType: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
  },
  businessDetails: {
    gap: Spacing.SM,
  },
  businessDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessDetailText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginLeft: Spacing.SM,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.H3,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  statLabel: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
  },
  menuSection: {
    marginBottom: Spacing.LG,
  },
  sectionTitle: {
    ...Typography.H4,
    color: Colors.TEXT,
    marginBottom: Spacing.MD,
  },
  menuItems: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.LG,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.SM,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.MD,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  menuSubtitle: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: Colors.BORDER,
    marginLeft: Spacing.LG + 40 + Spacing.MD,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.LG,
  },
  versionText: {
    ...Typography.Body2,
    color: Colors.TEXT_TERTIARY,
    marginBottom: Spacing.XS,
  },
  versionSubtext: {
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
    backgroundColor: Colors.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  cancelButton: {
    width: 60,
  },
  cancelButtonText: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
  },
  modalTitle: {
    ...Typography.H3,
    color: Colors.TEXT,
    textAlign: 'center',
  },
  saveButton: {
    width: 60,
    alignItems: 'flex-end',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...Typography.Body1,
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.LG,
  },
  inputContainer: {
    marginBottom: Spacing.LG,
  },
  pickerContainer: {
    marginBottom: Spacing.LG,
  },
  pickerLabel: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
    marginBottom: Spacing.SM,
  },
  pickerButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.SM,
    flexWrap: 'wrap',
  },
  pickerButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    backgroundColor: Colors.SURFACE_VARIANT,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  pickerButtonSelected: {
    backgroundColor: Colors.PRIMARY + '20',
    borderColor: Colors.PRIMARY,
  },
  pickerButtonText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  pickerButtonTextSelected: {
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  
  // Business Hours Modal Styles
  dayHoursContainer: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  dayName: {
    ...Typography.H4,
    color: Colors.TEXT,
  },
  closedToggle: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    backgroundColor: Colors.SURFACE_VARIANT,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  closedToggleActive: {
    backgroundColor: Colors.ERROR + '20',
    borderColor: Colors.ERROR,
  },
  closedToggleText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '600',
  },
  closedToggleTextActive: {
    color: Colors.ERROR,
  },
  timeInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.MD,
  },
  timeInput: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    ...Typography.Caption,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.XS,
  },
  timeButton: {
    backgroundColor: Colors.SURFACE_VARIANT,
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    minWidth: 80,
    alignItems: 'center',
  },
  timeButtonText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
  },
  hoursNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY + '10',
    borderRadius: BorderRadius.SM,
    padding: Spacing.MD,
    marginTop: Spacing.LG,
    gap: Spacing.SM,
  },
  hoursNoteText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    flex: 1,
    lineHeight: 18,
  },
});

export default ProfileScreen;