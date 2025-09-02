import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import { Button, GradientView } from '@components/index';
import { Colors, Spacing, Typography, BorderRadius } from '@theme/config';
import { useOnboardingStore } from '@store/onboardingStore';
import { createBusiness, getBusinessMe } from '@services/businessService';

interface BusinessTypeCardProps {
  type: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
  isSelected: boolean;
  onPress: () => void;
}

const BusinessTypeCard: React.FC<BusinessTypeCardProps> = ({ type, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Icon name="check" size={16} color={Colors.TEXT} />
        </View>
      )}
      
      <View style={[
        styles.iconContainer,
        isSelected && styles.iconContainerSelected,
      ]}>
        <Text style={[styles.iconText, isSelected && styles.iconTextSelected]}>{type.icon}</Text>
      </View>
      
      <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{type.name}</Text>
      <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>
        {type.description}
      </Text>
    </TouchableOpacity>
  );
};

interface BusinessTypeScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

const BusinessTypeScreen: React.FC<BusinessTypeScreenProps> = ({ navigation }) => {
  const { businessDraft, updateBusinessDraft } = useOnboardingStore();
  const [selectedType, setSelectedType] = React.useState<string | null>(businessDraft.businessType || null);

  const handleContinue = async () => {
    if (!selectedType) {
      Alert.alert('Selection Required', 'Please select your business type to continue');
      return;
    }

    try {
      // Check if user already has a business
      let business;
      try {
        business = await getBusinessMe();
        if (business) {
          console.log('✅ Existing business found:', business);
          // User already has a business, use it instead of creating new one
          updateBusinessDraft({ 
            businessType: selectedType,
            businessId: business.id,
            name: business.name,
            phone: business.phoneNumber,
            address: business.address,
          });
          
          navigation.navigate('BusinessIdentity', { 
            businessType: selectedType,
            businessId: business.id, 
          });
          return;
        }
      } catch (existingError) {
        console.log('🔍 No existing business found, will create new one');
      }

      // Create new business if none exists
      business = await createBusiness({
        name: `My ${selectedType} Business`, // Temporary name, will be updated in next step
        businessType: 'SALON', // Currently only SALON is supported in the backend
        phoneNumber: businessDraft.phone || '+1234567890', // Default E.164 format phone
        address: 'Temporary address - will be updated in contact screen', // Required field
      });

      console.log('✅ Business created successfully:', business);

      // Store business ID and type in onboarding draft
      updateBusinessDraft({ 
        businessType: selectedType,
        businessId: business.id 
      });

      navigation.navigate('BusinessIdentity', { 
        businessType: selectedType,
        businessId: business.id, 
      });
    } catch (error) {
      console.error('🚨 Business creation failed:', error);
      Alert.alert('Error', 'Failed to create business. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: { id: string; name: string; icon: string; description: string } }) => (
    <BusinessTypeCard
      type={item}
      isSelected={selectedType === item.id}
      onPress={() => setSelectedType(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.BACKGROUND} />
      <GradientView variant="dark" style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="briefcase" size={32} color={Colors.PRIMARY} />
          </View>
          <Text style={styles.title}>Choose your business type</Text>
          <Text style={styles.subtitle}>
            Select the category that best describes your business
          </Text>
          
          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '20%' }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 5</Text>
          </View>
        </View>

        {/* Business Type Cards */}
        <View style={styles.content}>
          <FlatList
            data={[
              { id: 'SALON', name: 'Hair Salon', icon: '💄', description: 'Hair styling, coloring & treatments' },
              { id: 'SPA', name: 'Beauty Spa', icon: '💅', description: 'Wellness, massage & relaxation' },
              { id: 'BARBER_SHOP', name: 'Barber Shop', icon: '✂️', description: 'Men\'s grooming & haircuts' },
              { id: 'CLINIC', name: 'Beauty Clinic', icon: '🧴', description: 'Skincare & aesthetic services' },
            ]}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            numColumns={2}
            columnWrapperStyle={styles.row}
          />
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedType}
            size="large"
            fullWidth
            style={styles.continueButton}
          />
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              Alert.alert(
                'Skip Business Type',
                'This will set "Hair Salon" as your default business type. You can change this later in settings.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Continue',
                    onPress: async () => {
                      try {
                        // Create business with real API call - all fields are required
                        const business = await createBusiness({
                          name: 'My Hair Salon',
                          businessType: 'SALON', // Currently only SALON is supported in the backend
                          phoneNumber: businessDraft.phone || '+1234567890', // Default E.164 format phone
                          address: 'Temporary address - will be updated in contact screen', // Required field
                        });
                        
                        // Store business ID and type in onboarding draft
                        updateBusinessDraft({ 
                          businessType: 'SALON',
                          businessId: business.id 
                        });
                        
                        navigation.navigate('BusinessIdentity', { 
                          businessType: 'SALON',
                          businessId: business.id,
                        });
                      } catch (error) {
                        console.error('🚨 Business creation failed:', error);
                        Alert.alert('Error', 'Failed to create business. Please try again.');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.XXL,
    paddingBottom: Spacing.XL,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.ROUND,
    backgroundColor: Colors.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.XL,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    ...Typography.H1,
    color: Colors.TEXT,
    textAlign: 'center',
    marginBottom: Spacing.MD,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.XL,
    fontSize: 18,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '85%',
    height: 6,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.SM,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.PRIMARY,
    borderRadius: BorderRadius.SM,
  },
  progressText: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
  },
  listContainer: {
    paddingVertical: Spacing.LG,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.XL,
    marginBottom: Spacing.LG,
    marginHorizontal: Spacing.SM,
    borderWidth: 2,
    borderColor: Colors.BORDER,
    position: 'relative',
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSelected: {
    backgroundColor: Colors.SURFACE,
    borderColor: Colors.PRIMARY,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  selectedIndicator: {
    position: 'absolute',
    top: Spacing.MD,
    right: Spacing.MD,
    zIndex: 1,
    backgroundColor: Colors.PRIMARY,
    borderRadius: BorderRadius.ROUND,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.LG,
    backgroundColor: Colors.SURFACE_VARIANT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.LG,
    alignSelf: 'center',
  },
  iconContainerSelected: {
    backgroundColor: Colors.PRIMARY + '20',
  },
  iconText: {
    fontSize: 28,
  },
  iconTextSelected: {
    fontSize: 30,
  },
  cardTitle: {
    ...Typography.H3,
    color: Colors.TEXT,
    textAlign: 'center',
    marginBottom: Spacing.SM,
    fontSize: 18,
    fontWeight: '600',
  },
  cardTitleSelected: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  cardDescription: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  cardDescriptionSelected: {
    color: Colors.TEXT,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XL,
    paddingTop: Spacing.LG,
  },
  continueButton: {
    marginBottom: Spacing.LG,
    backgroundColor: Colors.PRIMARY,
    borderRadius: BorderRadius.LG,
    paddingVertical: Spacing.LG,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.MD,
    paddingHorizontal: Spacing.LG,
    borderRadius: BorderRadius.MD,
  },
  skipButtonText: {
    ...Typography.Body1,
    color: Colors.TEXT_TERTIARY,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default BusinessTypeScreen;