import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Share } from 'react-native';
import { useBusinessStore } from '../../store/businessStore';
import { getBusinessQrCode } from '../../services/businessService';
import { Colors, Spacing, BorderRadius } from '../../theme/config';
import { showErrorToast } from '../../store/toastStore';

export default function QrCodeScreen() {
  const { business, loading: bizLoading, fetchMe } = useBusinessStore();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Ensure business is loaded for id
  useEffect(() => {
    if (!business && !bizLoading) {
       
      fetchMe();
    }
  }, [business, bizLoading, fetchMe]);

  const businessId = useMemo(() => business?.id, [business]);

  useEffect(() => {
    const run = async () => {
      if (!businessId) return;
      try {
        setLoading(true);
        const res = await getBusinessQrCode(businessId);
        setQrUrl(res.url);
      } catch (err: any) {
        const message = err?.message ?? 'Failed to load QR code';
        showErrorToast(message, err?.code);
      } finally {
        setLoading(false);
      }
    };
     
    run();
  }, [businessId]);

  const onShare = async () => {
    try {
      if (!qrUrl) return;
      await Share.share({
        message: `Scan to book with ${business?.name ?? 'our business'}: ${qrUrl}`,
        url: qrUrl,
        title: 'Business QR Code',
      });
    } catch (err: any) {
      const message = err?.message ?? 'Failed to share QR code';
      showErrorToast(message);
    }
  };

  if (bizLoading || loading || !businessId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Preparing your QR code...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Business QR Code</Text>
      {qrUrl ? (
        <View style={styles.card}>
          <Image
            source={{ uri: qrUrl }}
            style={styles.qr}
            resizeMode="contain"
          />
          <Text style={styles.sub}>Let customers scan to start booking via WhatsApp.</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
            <Text style={styles.shareText}>Share QR</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.errorText}>QR code not available.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.background,
  },
  heading: {
    fontWeight: '700',
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qr: {
    width: 280,
    height: 280,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
  },
  sub: {
    marginTop: Spacing.md,
    color: Colors.text,
  },
  shareBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
  },
  shareText: {
    color: Colors.background,
    fontWeight: '700',
  },
  loadingText: {
    color: Colors.text,
    marginTop: 8,
  },
  errorText: {
    color: '#B91C1C',
  },
});
