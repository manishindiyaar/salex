import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors, Spacing, Typography, BorderRadius } from '../../theme/premium';
import { useAuth } from '../../context/AuthContext';
import { useOnboardingStore } from '../../store/onboardingStore';
import { createBusinessService } from '../../services/serviceService';
import { PremiumBottomSheet } from '../../components/premium/PremiumBottomSheet';
import { PremiumButton } from '../../components/premium/PremiumButton';

interface ReviewCompleteScreenProps {
  navigation: {
    reset: (config: { index: number; routes: Array<{ name: string }> }) => void;
  };
}

const ReviewCompleteScreen: React.FC<ReviewCompleteScreenProps> = ({ navigation }) => {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  
  const { completeOnboarding } = useAuth();
  const { businessDraft } = useOnboardingStore();

  const handleGoLivePress = () => {
    // Trigger notification bottom sheet first
    setShowNotificationPrompt(true);
  };

  const handleNotificationAction = async () => {
    setShowNotificationPrompt(false);
    setIsGeneratingQR(true);
    
    try {
      const businessId = businessDraft.businessId;
      if (!businessId) {
        throw new Error('Business not found. Please restart onboarding.');
      }

      // Save business_id to AsyncStorage for main app
      await AsyncStorage.setItem('business_id', businessId);
      console.log('✅ Business ID saved:', businessId);

      // Save all services to the database
      if (businessDraft.services && businessDraft.services.length > 0) {
        console.log('💾 Saving', businessDraft.services.length, 'services...');

        for (const serviceDraft of businessDraft.services) {
          try {
            const servicePayload = {
              name: serviceDraft.name,
              description: serviceDraft.description,
              durationMinutes: serviceDraft.duration,
              price: serviceDraft.price,
            };

            await createBusinessService(businessId, servicePayload as any);
          } catch (serviceError) {
            console.error('❌ Failed to save service:', serviceDraft.name, serviceError);
          }
        }
      }
      
      // Simulate QR code setup
      setTimeout(() => {
        setQrReady(true);
        setIsGeneratingQR(false);
        completeOnboarding();
      }, 1800);
    } catch (error) {
      console.error('Go live failed:', error);
      setIsGeneratingQR(false);
    }
  };

  if (qrReady) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.content}>
          <View style={styles.successCard}>
            <Icon name="check-circle" size={80} color={Colors.success} style={styles.icon} />
            <Text style={[styles.title, Typography.sectionHeadline]}>You're all set! 🎉</Text>
            <Text style={[styles.subtitle, Typography.body]}>
              Your salon booking system is now live and ready.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={styles.content}>
        <View style={styles.successCard}>
          <Icon name="check-circle" size={60} color={Colors.success} style={styles.icon} />
          <Text style={[styles.title, Typography.sectionHeadline]}>Ready to Go Live!</Text>
          <Text style={[styles.subtitle, Typography.body]}>
            Your business profile is complete and your digital QR code is ready.
          </Text>
        </View>

        <View style={styles.features}>
          {[
            { icon: 'check-circle', text: 'Business profile created' },
            { icon: 'clock', text: 'Services added with pricing' },
            { icon: 'calendar', text: 'Business hours configured' },
            { icon: 'smartphone', text: 'QR code generated for customers' },
          ].map((feature, index) => (
            <View key={index} style={styles.feature}>
              <Icon name={feature.icon as any} size={20} color={Colors.success} style={styles.featureIcon} />
              <Text style={[styles.featureText, Typography.body]}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PremiumButton
          title={isGeneratingQR ? 'GO LIVE NOW...' : 'GO LIVE NOW 🚀'}
          variant="filled"
          disabled={isGeneratingQR}
          loading={isGeneratingQR}
          onPress={handleGoLivePress}
        />
      </View>

      {/* Premium Notification Permission Sheet */}
      <PremiumBottomSheet
        visible={showNotificationPrompt}
        onClose={() => setShowNotificationPrompt(false)}
      >
        <View style={styles.promptContent}>
          <Icon name="bell" size={44} color={Colors.primaryInk} style={styles.promptIcon} />
          
          <Text style={[styles.promptTitle, Typography.sectionHeadline]}>
            Don’t miss a booking
          </Text>
          
          <Text style={[styles.promptText, Typography.body]}>
            Get notified when a customer books, cancels, or your day needs attention.
          </Text>
          
          <PremiumButton
            title="REMIND ME"
            variant="filled"
            onPress={handleNotificationAction}
          />
          
          <TouchableOpacity 
            style={styles.maybeLaterBtn} 
            onPress={handleNotificationAction}
          >
            <Text style={[styles.maybeLaterText, Typography.caption]}>
              MAYBE LATER
            </Text>
          </TouchableOpacity>
        </View>
      </PremiumBottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  successCard: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.mutedBorder,
  },
  icon: {
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
  features: {
    backgroundColor: Colors.selectedSurface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureIcon: {
    marginRight: Spacing.md,
  },
  featureText: {
    color: Colors.primaryInk,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  promptContent: {
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  promptIcon: {
    marginBottom: Spacing.md,
  },
  promptTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  promptText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  maybeLaterBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  maybeLaterText: {
    color: Colors.secondaryText,
    textDecorationLine: 'underline',
  },
});

export default ReviewCompleteScreen;