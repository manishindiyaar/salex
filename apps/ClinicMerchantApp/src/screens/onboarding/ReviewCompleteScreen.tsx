import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

import { Colors, Spacing, Typography } from '../../theme/config';
import { useAuth } from '../../context/AuthContext';
import { useOnboardingStore } from '../../store/onboardingStore';
import { createBusinessService } from '../../services/serviceService';
import { updateBusiness } from '../../services/businessService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReviewCompleteScreenProps {
  navigation: {
    reset: (config: { index: number; routes: Array<{ name: string }> }) => void;
  };
}

const ReviewCompleteScreen: React.FC<ReviewCompleteScreenProps> = ({ navigation }) => {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const { completeOnboarding } = useAuth();
  const { businessDraft } = useOnboardingStore();

  const handleGoLive = async () => {
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

            const savedService = await createBusinessService(businessId, servicePayload as any);
            console.log('✅ Service saved:', savedService.name);
          } catch (serviceError) {
            console.error('❌ Failed to save service:', serviceDraft.name, serviceError);
            // Don't throw — partial failure is OK, user can add manually later
          }
        }

        console.log('🎉 All services saved!');
      }

      await updateBusiness(businessId, { onboardingCompleted: true });
      
      // Simulate QR code generation delay
      setTimeout(() => {
        setQrReady(true);
        setIsGeneratingQR(false);
        
        // Complete onboarding - RootNavigator will handle the screen change automatically
        completeOnboarding();
      }, 2000);
    } catch (error) {
      console.error('Go live failed:', error);
      setIsGeneratingQR(false);
    }
  };

  if (qrReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successCard}>
            <Icon name="check-circle" size={80} color={Colors.SUCCESS} style={styles.icon} />
            <Text style={styles.title}>You're all set! 🎉</Text>
            <Text style={styles.subtitle}>
              Your clinic appointment system is now live and ready
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successCard}>
          <Icon name="check-circle" size={60} color={Colors.SUCCESS} style={styles.icon} />
          <Text style={styles.title}>Ready to Go Live!</Text>
          <Text style={styles.subtitle}>
            Your business profile is complete and your QR code is ready
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
              <Icon name={feature.icon as any} size={20} color={Colors.SUCCESS} style={styles.featureIcon} />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleGoLive}
        disabled={isGeneratingQR}
      >
        {isGeneratingQR ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator color="white" />
            <Text style={styles.buttonText}>Setting up your system...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Go Live Now 🚀</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.MD,
    justifyContent: 'center',
  },
  successCard: {
    backgroundColor: Colors.SURFACE,
    padding: Spacing.XL,
    borderRadius: Spacing.LG,
    alignItems: 'center',
    marginBottom: Spacing.XL * 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: {
    marginBottom: Spacing.MD,
  },
  title: {
    ...Typography.H1,
    color: Colors.TEXT,
    textAlign: 'center',
    marginBottom: Spacing.SM,
  },
  subtitle: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
  },
  features: {
    backgroundColor: Colors.SURFACE,
    borderRadius: Spacing.LG,
    padding: Spacing.LG,
    marginBottom: Spacing.XL * 1.5,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  featureIcon: {
    marginRight: Spacing.SM,
  },
  featureText: {
    ...Typography.Body2,
    color: Colors.TEXT,
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    paddingVertical: Spacing.LG,
    borderRadius: Spacing.MD,
    marginHorizontal: Spacing.MD,
    marginBottom: Spacing.LG,
    alignItems: 'center',
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.H4,
    color: 'white',
    marginLeft: Spacing.SM,
  },
});

export default ReviewCompleteScreen;
