/**
 * SlotCreatorDrawer
 * 
 * Bottom drawer for creating manual bookings (walk-ins).
 * Allows selecting services, scheduling time, and optionally
 * selecting resource/staff for the booking.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing, BorderRadius } from '../../theme/config';
import { useHaptics } from '../../hooks/useHaptics';
import { useServiceStore } from '../../store/serviceStore';
import { useBusinessStore } from '../../store/businessStore';
import { useResourceStore, ResourceWithStats } from '../../store/resourceStore';
import { useStaffStore, StaffWithStats } from '../../store/staffStore';
import { createBooking, checkAvailability } from '../../services/bookingService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SlotCreatorDrawerProps {
  visible: boolean;
  onClose: () => void;
  onBookingCreated?: (booking: any) => void;
}

export type { SlotCreatorDrawerProps };

// Generate time slots for the day (every 30 minutes from 9 AM to 9 PM)
const generateTimeSlots = (): { label: string; value: Date }[] => {
  const slots: { label: string; value: Date }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Add "Now" option
  slots.push({ label: 'Now', value: now });
  
  // Generate slots from current hour to 9 PM
  const startHour = Math.max(9, now.getHours());
  for (let hour = startHour; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotTime = new Date(today);
      slotTime.setHours(hour, minute, 0, 0);
      
      // Skip past times (except "Now")
      if (slotTime <= now) continue;
      
      const label = slotTime.toLocaleTimeString('en-IN', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      slots.push({ label, value: slotTime });
    }
  }
  
  return slots;
};

const SlotCreatorDrawer: React.FC<SlotCreatorDrawerProps> = ({
  visible,
  onClose,
  onBookingCreated,
}) => {
  const insets = useSafeAreaInsets();
  const { light, medium, heavy } = useHaptics();
  const { items: services } = useServiceStore();
  const { business } = useBusinessStore();
  const { items: resources, listByBusiness: loadResources, loading: loadingResources } = useResourceStore();
  const { items: staff, listByBusiness: loadStaff, loading: loadingStaff } = useStaffStore();

  // State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [slotAvailable, setSlotAvailable] = useState<boolean | null>(null);
  
  // Resource/Staff selection state
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>(undefined);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(undefined);
  const [showAllocationOptions, setShowAllocationOptions] = useState(false);

  // Generate time slots
  const timeSlots = useMemo(() => generateTimeSlots(), [visible]);
  
  // Filter active resources and staff
  const activeResources = useMemo(() => resources.filter(r => r.isActive), [resources]);
  const activeStaff = useMemo(() => staff.filter(s => s.isActive), [staff]);

  // Load resources and staff when drawer opens
  useEffect(() => {
    if (visible && business?.id) {
      loadResources(business.id);
      loadStaff(business.id);
    }
  }, [visible, business?.id]);

  // Reset state when drawer opens
  useEffect(() => {
    if (visible) {
      // Check if business is suspended when drawer opens
      if (business && business.isActive === false) {
        Alert.alert(
          'Account Suspended',
          'Your business account has been suspended. Manual booking is not available. Please contact support.',
          [
            { text: 'OK', onPress: onClose }
          ]
        );
        return;
      }

      setSelectedServices([]);
      setSelectedTimeSlot(new Date());
      setNotes('');
      setSlotAvailable(null);
      setSelectedResourceId(undefined);
      setSelectedStaffId(undefined);
      setShowAllocationOptions(false);
    }
  }, [visible, business, onClose]);

  // Calculate total price and duration
  const selectedServiceDetails = services.filter(s => selectedServices.includes(s.id));
  const totalPrice = selectedServiceDetails.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const totalDuration = selectedServiceDetails.reduce((sum, s) => sum + (s.duration || 30), 0);

  // Check availability when time or services change
  useEffect(() => {
    const checkSlot = async () => {
      if (!business?.id || selectedServices.length === 0) {
        setSlotAvailable(null);
        return;
      }

      // Check if business is suspended before making API call
      if (business.isActive === false) {
        Alert.alert(
          'Account Suspended',
          'Your business account has been suspended. Manual booking is not available. Please contact support.',
          [
            { text: 'OK', onPress: onClose }
          ]
        );
        return;
      }

      setCheckingAvailability(true);
      try {
        const result = await checkAvailability(
          business.id,
          selectedTimeSlot.toISOString(),
          totalDuration
        );
        setSlotAvailable(result.available);
      } catch (error: any) {
        console.error('Failed to check availability:', error);
        
        // Check if it's a suspension error
        if (error.message && error.message.includes('Business account is suspended')) {
          Alert.alert(
            'Account Suspended',
            'Your business account has been suspended. Manual booking is not available. Please contact support.',
            [
              { text: 'OK', onPress: onClose }
            ]
          );
          return;
        }
        
        setSlotAvailable(null);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const debounce = setTimeout(checkSlot, 300);
    return () => clearTimeout(debounce);
  }, [business?.id, selectedServices, selectedTimeSlot, totalDuration, onClose]);

  // Toggle service selection
  const toggleService = useCallback((serviceId: string) => {
    light();
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      }
      return [...prev, serviceId];
    });
  }, [light]);

  // Select time slot
  const selectTimeSlot = useCallback((slot: Date) => {
    light();
    setSelectedTimeSlot(slot);
  }, [light]);

  // Toggle allocation options visibility
  const toggleAllocationOptions = useCallback(() => {
    light();
    setShowAllocationOptions(prev => !prev);
  }, [light]);

  // Select resource
  const selectResource = useCallback((resourceId: string | undefined) => {
    light();
    setSelectedResourceId(resourceId);
  }, [light]);

  // Select staff
  const selectStaff = useCallback((staffId: string | undefined) => {
    light();
    setSelectedStaffId(staffId);
  }, [light]);

  // Create booking
  const handleBookNow = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('Select Service', 'Please select at least one service');
      return;
    }

    if (!business?.id) {
      Alert.alert('Error', 'Business not found');
      return;
    }

    // Check if business is suspended before creating booking
    if (business.isActive === false) {
      Alert.alert(
        'Account Suspended',
        'Your business account has been suspended. Manual booking is not available. Please contact support.',
        [
          { text: 'OK', onPress: onClose }
        ]
      );
      return;
    }

    medium();
    setIsLoading(true);

    try {
      const booking = await createBooking(business.id, {
        serviceIds: selectedServices,
        scheduledAt: selectedTimeSlot.toISOString(),
        source: 'walk-in',
        notes: notes.trim() || undefined,
        // Include resource/staff if manually selected
        resourceId: selectedResourceId,
        staffId: selectedStaffId,
      });

      heavy();
      console.log('✅ Manual booking created:', booking);
      
      onBookingCreated?.(booking);
      onClose();
      
      const timeStr = selectedTimeSlot.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      
      // Build allocation info for alert
      const resourceName = (booking as any)?.resource?.name;
      const staffName = (booking as any)?.staff?.name;
      const allocationInfo = resourceName || staffName 
        ? `\n${resourceName ? `Chair: ${resourceName}` : ''}${staffName ? `\nStaff: ${staffName}` : ''}`
        : '';
      
      Alert.alert(
        'Booking Created! 🎉',
        `Walk-in booking for ₹${totalPrice} at ${timeStr} created successfully.${allocationInfo}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Failed to create booking:', error);
      
      // Check if it's a suspension error
      if (error.message && error.message.includes('Business account is suspended')) {
        Alert.alert(
          'Account Suspended',
          'Your business account has been suspended. Manual booking is not available. Please contact support.',
          [
            { text: 'OK', onPress: onClose }
          ]
        );
        return;
      }
      
      // Check if it's a setup validation error
      if (error.message && error.message.includes('Please set up')) {
        Alert.alert(
          'Setup Required',
          error.message,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Setup',
              onPress: () => {
                onClose();
                // Navigate to resource/staff management screens
                // This would need to be passed as a prop or use navigation context
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Booking Failed',
          error.message || 'Could not create booking. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canBook = selectedServices.length > 0 && !isLoading && slotAvailable !== false;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={[styles.drawer, { paddingBottom: insets.bottom + Spacing.LG }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Walk-in</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={24} color={Colors.TEXT} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Time Slot Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SELECT TIME</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.timeSlotScroll}
              >
                {timeSlots.map((slot, index) => {
                  const isSelected = slot.value.getTime() === selectedTimeSlot.getTime() ||
                    (slot.label === 'Now' && selectedTimeSlot.getTime() === timeSlots[0]?.value.getTime());
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlotButton,
                        isSelected && styles.timeSlotButtonSelected,
                      ]}
                      onPress={() => selectTimeSlot(slot.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextSelected,
                      ]}>
                        {slot.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              {/* Availability indicator */}
              {selectedServices.length > 0 && (
                <View style={styles.availabilityContainer}>
                  {checkingAvailability ? (
                    <Text style={styles.availabilityChecking}>Checking availability...</Text>
                  ) : slotAvailable === true ? (
                    <Text style={styles.availabilityAvailable}>✓ Slot available</Text>
                  ) : slotAvailable === false ? (
                    <Text style={styles.availabilityUnavailable}>✗ Slot busy - choose another time</Text>
                  ) : null}
                </View>
              )}
            </View>

            {/* Service Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SELECT SERVICES</Text>
              {services.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceButton,
                      isSelected && styles.serviceButtonSelected,
                    ]}
                    onPress={() => toggleService(service.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.serviceInfo}>
                      <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                        {service.name}
                      </Text>
                      <Text style={styles.serviceDetails}>
                        ₹{Number(service.price || 0).toFixed(0)} • {service.duration} min
                      </Text>
                    </View>
                    {isSelected && (
                      <Icon name="check-circle" size={24} color={Colors.SALEX_GREEN} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special requests..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Resource/Staff Allocation (Collapsible) */}
            {(activeResources.length > 0 || activeStaff.length > 0) && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.allocationHeader}
                  onPress={toggleAllocationOptions}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sectionTitle}>ASSIGN RESOURCE/STAFF</Text>
                  <View style={styles.allocationToggle}>
                    <Text style={styles.allocationToggleText}>
                      {showAllocationOptions ? 'Hide' : 'Show'}
                    </Text>
                    <Icon 
                      name={showAllocationOptions ? 'chevron-up' : 'chevron-down'} 
                      size={16} 
                      color="#888" 
                    />
                  </View>
                </TouchableOpacity>
                
                {!showAllocationOptions && (
                  <Text style={styles.allocationHint}>
                    Auto-assigned by default • Tap to manually select
                  </Text>
                )}

                {showAllocationOptions && (
                  <View style={styles.allocationContent}>
                    {/* Resource Selection */}
                    {activeResources.length > 0 && (
                      <View style={styles.allocationGroup}>
                        <Text style={styles.allocationLabel}>Resource (Chair/Station)</Text>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.allocationScroll}
                        >
                          <TouchableOpacity
                            style={[
                              styles.allocationOption,
                              !selectedResourceId && styles.allocationOptionSelected,
                            ]}
                            onPress={() => selectResource(undefined)}
                            activeOpacity={0.7}
                          >
                            <Icon name="zap" size={16} color={!selectedResourceId ? Colors.SALEX_GREEN : '#888'} />
                            <Text style={[
                              styles.allocationOptionText,
                              !selectedResourceId && styles.allocationOptionTextSelected,
                            ]}>
                              Auto
                            </Text>
                          </TouchableOpacity>
                          
                          {activeResources.map((resource) => (
                            <TouchableOpacity
                              key={resource.id}
                              style={[
                                styles.allocationOption,
                                selectedResourceId === resource.id && styles.allocationOptionSelected,
                              ]}
                              onPress={() => selectResource(resource.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.allocationOptionText,
                                selectedResourceId === resource.id && styles.allocationOptionTextSelected,
                              ]}>
                                {resource.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Staff Selection */}
                    {activeStaff.length > 0 && (
                      <View style={styles.allocationGroup}>
                        <Text style={styles.allocationLabel}>Staff Member</Text>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.allocationScroll}
                        >
                          <TouchableOpacity
                            style={[
                              styles.allocationOption,
                              !selectedStaffId && styles.allocationOptionSelected,
                            ]}
                            onPress={() => selectStaff(undefined)}
                            activeOpacity={0.7}
                          >
                            <Icon name="zap" size={16} color={!selectedStaffId ? Colors.SALEX_GREEN : '#888'} />
                            <Text style={[
                              styles.allocationOptionText,
                              !selectedStaffId && styles.allocationOptionTextSelected,
                            ]}>
                              Auto
                            </Text>
                          </TouchableOpacity>
                          
                          {activeStaff.map((staffMember) => (
                            <TouchableOpacity
                              key={staffMember.id}
                              style={[
                                styles.allocationOption,
                                selectedStaffId === staffMember.id && styles.allocationOptionSelected,
                              ]}
                              onPress={() => selectStaff(staffMember.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.allocationOptionText,
                                selectedStaffId === staffMember.id && styles.allocationOptionTextSelected,
                              ]}>
                                {staffMember.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>
                ₹{totalPrice} • {totalDuration} min • {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.bookButton,
                !canBook && styles.bookButtonDisabled,
              ]}
              onPress={handleBookNow}
              disabled={!canBook}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.BACKGROUND} size="small" />
              ) : (
                <Text style={styles.bookButtonText}>
                  {slotAvailable === false ? 'Slot Unavailable' : 'Book Now'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawer: {
    backgroundColor: Colors.BACKGROUND,
    borderTopLeftRadius: BorderRadius.XL,
    borderTopRightRadius: BorderRadius.XL,
    height: SCREEN_HEIGHT * 0.8,
    minHeight: 500,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.SM,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.TEXT,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
  },
  section: {
    marginTop: Spacing.LG,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.MD,
  },
  timeSlotScroll: {
    marginHorizontal: -Spacing.LG,
    paddingHorizontal: Spacing.LG,
  },
  timeSlotButton: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.MD,
    marginRight: Spacing.SM,
    borderWidth: 2,
    borderColor: '#333',
  },
  timeSlotButtonSelected: {
    borderColor: Colors.SALEX_GREEN,
    backgroundColor: '#0a1a0a',
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.TEXT,
  },
  timeSlotTextSelected: {
    color: Colors.SALEX_GREEN,
  },
  availabilityContainer: {
    marginTop: Spacing.SM,
  },
  availabilityChecking: {
    fontSize: 14,
    color: '#888',
  },
  availabilityAvailable: {
    fontSize: 14,
    color: Colors.SALEX_GREEN,
    fontWeight: '600',
  },
  availabilityUnavailable: {
    fontSize: 14,
    color: Colors.ERROR,
    fontWeight: '600',
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderWidth: 2,
    borderColor: '#333',
  },
  serviceButtonSelected: {
    borderColor: Colors.SALEX_GREEN,
    backgroundColor: '#0a1a0a',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.TEXT,
  },
  serviceNameSelected: {
    color: Colors.SALEX_GREEN,
  },
  serviceDetails: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  notesInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    fontSize: 16,
    color: Colors.TEXT,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  // Allocation styles
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allocationToggleText: {
    fontSize: 12,
    color: '#888',
  },
  allocationHint: {
    fontSize: 12,
    color: '#666',
    marginTop: -Spacing.SM,
  },
  allocationContent: {
    marginTop: Spacing.SM,
  },
  allocationGroup: {
    marginBottom: Spacing.MD,
  },
  allocationLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: Spacing.SM,
  },
  allocationScroll: {
    marginHorizontal: -Spacing.LG,
    paddingHorizontal: Spacing.LG,
  },
  allocationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.MD,
    marginRight: Spacing.SM,
    borderWidth: 2,
    borderColor: '#333',
  },
  allocationOptionSelected: {
    borderColor: Colors.SALEX_GREEN,
    backgroundColor: '#0a1a0a',
  },
  allocationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.TEXT,
  },
  allocationOptionTextSelected: {
    color: Colors.SALEX_GREEN,
  },
  footer: {
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  totalContainer: {
    marginBottom: Spacing.MD,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.SALEX_GREEN,
    textAlign: 'center',
  },
  bookButton: {
    backgroundColor: Colors.SALEX_GREEN,
    borderRadius: BorderRadius.LG,
    paddingVertical: Spacing.LG,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#333',
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.BACKGROUND,
  },
});

export default SlotCreatorDrawer;
