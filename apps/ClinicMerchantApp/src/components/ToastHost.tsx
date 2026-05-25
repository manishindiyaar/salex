import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useToastStore } from '../store/toastStore';

const bgForType = (type: 'error' | 'success' | 'info') => {
  switch (type) {
    case 'error':
      return '#B00020';
    case 'success':
      return '#1B5E20';
    default:
      return '#263238';
  }
};

export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  const sorted = useMemo(
    () => [...toasts].sort((a, b) => a.ts - b.ts),
    [toasts]
  );

  if (sorted.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={styles.stack}>
        {sorted.map((t) => (
          <View key={t.id} style={[styles.toast, { backgroundColor: bgForType(t.type) }]}>
            <View style={styles.textWrap}>
              <Text style={styles.message}>
                {t.message}
                {t.code ? ` (${t.code})` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => dismiss(t.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: Platform.select({ ios: 24, android: 24, default: 24 }),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  stack: {
    width: '92%',
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  textWrap: {
    flex: 1,
    paddingRight: 12,
  },
  message: {
    color: '#fff',
    fontSize: 14,
  },
  close: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
});
