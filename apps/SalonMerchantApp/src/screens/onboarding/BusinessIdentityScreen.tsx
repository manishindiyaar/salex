import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { PremiumScreen } from '../../components/premium/PremiumScreen';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { FloatingLabelInput } from '../../components/premium/FloatingLabelInput';
import { Colors, Spacing, Typography } from '../../theme/premium';
import { useOnboardingStore } from '../../store/onboardingStore';
import { createBusiness, updateBusiness, getBusinessMe } from '../../services/businessService';
import { SALON_CONFIG } from '../../config/salonConfig';

interface BusinessIdentityScreenProps {
  route: {
    params: {
      businessId: string;
    };
  };
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const BusinessIdentityScreen: React.FC<BusinessIdentityScreenProps> = ({ route, navigation }) => {
  const { businessId: routeBusinessId } = route.params;
  const { businessDraft, userPhone, updateBusinessDraft } = useOnboardingStore();

  const [salonName, setSalonName] = useState(businessDraft.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!salonName.trim()) {
      setError('Please enter your salon name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Save name locally
      updateBusinessDraft({
        name: salonName.trim(),
        tagline: '',
        description: '',
      });

      let businessId = businessDraft.businessId;

      if (!businessId) {
        try {
          const existingBusiness = await getBusinessMe();
          businessId = existingBusiness.id;
        } catch (_notFound) {
          console.log('🆕 No business found, creating one...');
          const newBusiness = await createBusiness({
            name: salonName.trim(),
            phoneNumber: userPhone,
            category: SALON_CONFIG.category,
          });
          businessId = newBusiness.id;
        }

        updateBusinessDraft({ businessId });
      }

      if (!businessId) throw new Error('Failed to resolve business ID.');

      // Update business name on server
      await updateBusiness(businessId, {
        name: salonName.trim(),
      });

      // Route to Goals screen next
      navigation.navigate('Goals', { businessId });
    } catch (err: any) {
      console.error('🚨 Failed to save business identity:', err);
      Alert.alert('Error', 'Failed to save business details. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PremiumScreen showBackButton onBackPress={() => navigation.goBack()} scrollable>
      <View style={styles.content}>
        {/* Abstract edit/scissors icon above */}
        <View style={styles.iconContainer}>
          <Icon name="scissors" size={44} color={Colors.primaryInk} />
        </View>

        {/* Editorial Headline */}
        <Text style={[styles.title, Typography.sectionHeadline]}>
          What’s your salon called?
        </Text>

        <Text style={[styles.subtitle, Typography.body]}>
          This is the name clients will see when they book slots with you.
        </Text>

        {/* Form Input */}
        <View style={styles.formContainer}>
          <FloatingLabelInput
            label="Salon name"
            value={salonName}
            onChangeText={(text) => {
              setSalonName(text);
              setError(null);
            }}
            placeholder="e.g. Aura Hair Studio"
            editable={!isLoading}
            error={error || undefined}
          />
        </View>

        {/* Action button */}
        <View style={styles.actionContainer}>
          <PremiumButton
            title={isLoading ? 'SAVING...' : 'NEXT ➔'}
            variant="filled"
            disabled={!salonName.trim() || isLoading}
            loading={isLoading}
            onPress={handleContinue}
          />
        </View>
      </View>
    </PremiumScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  formContainer: {
    width: '100%',
    marginVertical: Spacing.xl,
  },
  actionContainer: {
    width: '100%',
    marginTop: Spacing.xl,
  },
});

export default BusinessIdentityScreen;