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
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';
import { useOnboardingStore } from '@store/onboardingStore';
import { createBusiness, getBusinessMe } from '@services/businessService';
import { formatPhoneToE164 } from '../../utils/phoneUtils';
import { BusinessCategory } from '../../types/business';
import { templateService, NicheTemplate } from '@services/templateService';
// Temporarily disable category system imports to test Prisma issue
// import { 
//   setupCategorySystem, 
//   initializeCategory,
//   getTemplateByCategory 
// } from '../../categories';

interface BusinessTypeCardProps {
  type: {
    id: BusinessCategory;
    name: string;
    icon: string;
    description: string;
  };
  isSelected: boolean;
  onPress: () => void;
  onPreview?: () => void;
}

const BusinessTypeCard: React.FC<BusinessTypeCardProps> = ({ type, isSelected, onPress, onPreview }) => {
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
      
      {onPreview && (
        <TouchableOpacity 
          style={styles.previewButton}
          onPress={onPreview}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="eye" size={16} color={Colors.TEXT_SECONDARY} />
        </TouchableOpacity>
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
  const { businessDraft, updateBusinessDraft, updateStepsForTemplate } = useOnboardingStore();
  const [selectedType, setSelectedType] = React.useState<BusinessCategory | null>(
    (businessDraft.businessType as BusinessCategory) || null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [categorySystemReady, setCategorySystemReady] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<NicheTemplate | null>(null);

  // Initialize category system on mount
  React.useEffect(() => {
    const initializeCategorySystem = async () => {
      try {
        console.log('🔄 Initializing category system...');
        // await setupCategorySystem();
        setCategorySystemReady(true);
        console.log('✅ Category system ready (disabled for testing)');
      } catch (error) {
        console.error('❌ Failed to initialize category system:', error);
        // Continue without category system for now
        setCategorySystemReady(true);
      }
    };

    initializeCategorySystem();
  }, []);

  const showTemplatePreview = (category: BusinessCategory) => {
    // Template preview is temporarily disabled
    Alert.alert('Preview Not Available', 'Template preview is not available at this time.');
  };

  const handleContinue = async () => {
    if (!selectedType) {
      Alert.alert('Selection Required', 'Please select your business type to continue');
      return;
    }

    setIsLoading(true);

    try {
      console.log(`🔄 Processing business type selection: ${selectedType}`);

      // Load the selected template
      let template: NicheTemplate | null = null;
      try {
        template = await templateService.getTemplateByCategory(selectedType);
        setSelectedTemplate(template);
        console.log(`✅ Template loaded for ${selectedType}:`, template.displayName);
      } catch (templateError) {
        console.warn('⚠️ Template loading failed, continuing without:', templateError);
      }

      // Initialize the selected category template
      if (categorySystemReady) {
        try {
          // await initializeCategory(selectedType);
          console.log(`✅ Category template initialized: ${selectedType} (disabled for testing)`);
        } catch (templateError) {
          console.warn('⚠️ Template initialization failed, continuing without:', templateError);
        }
      }

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
            template: template, // Store template in draft
          });
          
          navigation.navigate('BusinessIdentity', { 
            businessType: selectedType,
            businessId: business.id,
            template: template,
          });
          return;
        }
      } catch (existingError) {
        console.log('🔍 No existing business found, will create new one');
      }

      // Create new business if none exists
      // Format phone number to E.164 format
      const formattedPhone = businessDraft.phone 
        ? formatPhoneToE164(businessDraft.phone, '+91') 
        : '+911234567890'; // Default placeholder

      // Get business name suggestion from template
      const businessNameSuggestion = template 
        ? `My ${template.displayName}` 
        : `My ${selectedType} Business`;
      
      business = await createBusiness({
        name: businessNameSuggestion,
        phoneNumber: formattedPhone,
        category: selectedType, // Include the selected category
      });

      console.log('✅ Business created successfully:', business);

      // Store business ID, type, and template in onboarding draft
      updateBusinessDraft({ 
        businessType: selectedType,
        businessId: business.id,
        template: template, // Store template for use in subsequent screens
      });

      // Update steps based on template modules
      if (template) {
        updateStepsForTemplate();
      }

      navigation.navigate('BusinessIdentity', { 
        businessType: selectedType,
        businessId: business.id,
        template: template,
      });
    } catch (error) {
      console.error('🚨 Business creation failed:', error);
      Alert.alert('Error', 'Failed to create business. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: { id: BusinessCategory; name: string; icon: string; description: string } }) => (
    <BusinessTypeCard
      type={item}
      isSelected={selectedType === item.id}
      onPress={() => setSelectedType(item.id)}
      onPreview={() => showTemplatePreview(item.id)}
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
              { id: BusinessCategory.SALON, name: 'Hair Salon', icon: '💄', description: 'Hair styling, coloring & treatments' },
              { id: BusinessCategory.SPA, name: 'Wellness Spa', icon: '💅', description: 'Massage, wellness & relaxation' },
              { id: BusinessCategory.CLINIC, name: 'Beauty Clinic', icon: '🧴', description: 'Skincare & aesthetic services' },
              { id: BusinessCategory.BEAUTY_PARLOR, name: 'Beauty Parlor', icon: '💄', description: 'Bridal & event beauty services' },
              { id: BusinessCategory.FITNESS, name: 'Fitness Center', icon: '💪', description: 'Personal training & group classes' },
              { id: BusinessCategory.OTHER, name: 'Other Business', icon: '🏪', description: 'Other service-based business' },
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
            title={isLoading ? "Setting up..." : "Continue"}
            onPress={handleContinue}
            disabled={!selectedType || isLoading}
            size="large"
            fullWidth
            style={styles.continueButton}
          />
          
          <TouchableOpacity
            style={styles.skipButton}
            disabled={isLoading}
            onPress={() => {
              Alert.alert(
                'Skip Business Type',
                'This will set "Hair Salon" as your default business type. You can change this later in settings.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Continue',
                    onPress: async () => {
                      setIsLoading(true);
                      try {
                        // Load salon template
                        let template: NicheTemplate | null = null;
                        try {
                          template = await templateService.getTemplateByCategory(BusinessCategory.SALON);
                          console.log('✅ Salon template loaded for skip');
                        } catch (templateError) {
                          console.warn('⚠️ Template loading failed:', templateError);
                        }

                        // Initialize salon template
                        if (categorySystemReady) {
                          try {
                          // await initializeCategory(BusinessCategory.SALON);
                          console.log('✅ Salon template initialized (disabled for testing)');
                          } catch (templateError) {
                            console.warn('⚠️ Template initialization failed:', templateError);
                          }
                        }

                        // Create business with real API call
                        // Format phone number to E.164 format
                        const formattedPhone = businessDraft.phone 
                          ? formatPhoneToE164(businessDraft.phone, '+91') 
                          : '+911234567890'; // Default placeholder
                        
                        const business = await createBusiness({
                          name: template ? `My ${template.displayName}` : 'My Hair Salon',
                          phoneNumber: formattedPhone,
                          category: BusinessCategory.SALON, // Include the category
                        });
                        
                        // Store business ID, type, and template in onboarding draft
                        updateBusinessDraft({ 
                          businessType: BusinessCategory.SALON,
                          businessId: business.id,
                          template: template,
                        });
                        
                        // Update steps based on template modules
                        if (template) {
                          updateStepsForTemplate();
                        }
                        
                        navigation.navigate('BusinessIdentity', { 
                          businessType: BusinessCategory.SALON,
                          businessId: business.id,
                          template: template,
                        });
                      } catch (error) {
                        console.error('🚨 Business creation failed:', error);
                        Alert.alert('Error', 'Failed to create business. Please try again.');
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={[styles.skipButtonText, isLoading && styles.skipButtonTextDisabled]}>
              Skip for now
            </Text>
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
  previewButton: {
    position: 'absolute',
    top: Spacing.MD,
    left: Spacing.MD,
    zIndex: 1,
    backgroundColor: Colors.SURFACE_VARIANT,
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
  skipButtonTextDisabled: {
    opacity: 0.5,
  },
});

export default BusinessTypeScreen;