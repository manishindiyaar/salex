/**
 * QuickBookButton Component
 * 
 * One-tap booking button with auto-assignment.
 * Creates a booking immediately with automatic resource and staff allocation.
 */

import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { createBooking } from '../../services/bookingService';
import { useBusinessStore } from '../../store/businessStore';
import { Colors } from '../../theme/config';

interface QuickBookButtonProps {
  businessId: string;
  serviceIds: string[];
  onBookingCreated?: (booking: any) => void;
  disabled?: boolean;
  style?: any;
}

export const QuickBookButton: React.FC<QuickBookButtonProps> = ({
  businessId,
  serviceIds,
  onBookingCreated,
  disabled,
  style,
}) => {
  const [creating, setCreating] = useState(false);
  const { business } = useBusinessStore();

  const handleQuickBook = async () => {
    if (serviceIds.length === 0) {
      Alert.alert('No Services', 'Please select at least one service');
      return;
    }

    // Check if business is suspended before creating booking
    if (business && business.isActive === false) {
      Alert.alert(
        'Account Suspended',
        'Your business account has been suspended. Manual booking is not available. Please contact support.',
        [{ text: 'OK' }]
      );
      return;
    }

    setCreating(true);

    try {
      const booking = await createBooking(businessId, {
        serviceIds,
        scheduledAt: new Date().toISOString(),
        source: 'manual',
        // No resourceId or staffId - triggers auto-assignment
      });

      console.log('✅ Quick booking created with auto-assignment:', booking);

      onBookingCreated?.(booking);

      Alert.alert(
        'Booking Created! 🎉',
        `Walk-in booking created and automatically assigned.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Failed to create quick booking:', error);
      
      // Check if it's a suspension error
      if (error.message && error.message.includes('Business account is suspended')) {
        Alert.alert(
          'Account Suspended',
          'Your business account has been suspended. Manual booking is not available. Please contact support.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      Alert.alert(
        'Booking Failed',
        error.message || 'Could not create booking. Please try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Button
      mode="contained"
      onPress={handleQuickBook}
      disabled={disabled || creating || serviceIds.length === 0}
      loading={creating}
      style={[styles.button, style]}
      icon="flash"
    >
      Quick Book Now
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
  },
});
