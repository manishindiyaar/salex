import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useBookingStore } from '../../store/bookingStore';
import { useBusinessStore } from '../../store/businessStore';

// NOTE:
// - This screen is wired to bookingStore for data and actions.
// - Replace the placeholder businessId with actual source (e.g., businessStore.business?.id or auth context).
// - Adjusted fields to match shared-types Booking shape by using safe fallbacks.

const formatWhen = (iso?: string | null) => {
  try {
    return iso ? new Date(iso).toLocaleString() : '—';
  } catch {
    return '—';
  }
};

const formatTitle = (item: any) => {
  // Prefer explicit customerName if present, otherwise show service name or the booking id
  return item.customerName ?? item.serviceName ?? item.id ?? 'Booking';
};

export default function BookingsScreen() {
  const { items, loading, listByBusiness, cancel } = useBookingStore();
  const { business, fetchMe } = useBusinessStore();

  useEffect(() => {
    // Fetch business data if not available
    if (!business) {
      fetchMe();
    }
  }, [business, fetchMe]);

  useEffect(() => {
    // Load bookings once we have business ID
    if (business?.id) {
      listByBusiness(business.id);
    }
  }, [business?.id, listByBusiness]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={items.length === 0 ? styles.center : undefined}
      data={items}
      keyExtractor={(b) => b.id}
      ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{formatTitle(item)}</Text>
          <Text style={styles.subtitle}>{formatWhen(item.startTime)}</Text>
          {item.status ? <Text style={styles.status}>Status: {item.status}</Text> : null}
          <TouchableOpacity onPress={() => cancel(item.id)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel booking</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    color: '#777',
  },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
  },
  subtitle: {
    marginTop: 4,
    color: '#555',
  },
  status: {
    marginTop: 4,
    color: '#333',
  },
  cancelBtn: {
    marginTop: 8,
  },
  cancelText: {
    color: '#B00020',
    fontWeight: '600',
  },
});
