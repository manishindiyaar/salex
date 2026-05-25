import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';

import { Button, Input, GradientView } from '@components/index';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';
import { useOnboardingStore } from '@store/onboardingStore';
import { createBusiness, updateBusiness, getBusinessMe } from '@services/businessService';
import { CLINIC_CONFIG } from '../../config/clinicConfig';

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
  const { businessId } = route.params;
  const { businessDraft, userPhone, updateBusinessDraft } = useOnboardingStore();
  
  // Clinic build: category is always CLINIC
  const businessType = CLINIC_CONFIG.category;

  // Form state
  const [businessName, setBusinessName] = useState(businessDraft.name || '');
  const [tagline, setTagline] = useState(businessDraft.tagline || '');
  const [description, setDescription] = useState(businessDraft.description || '');
  const [isLoading, setIsLoading] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<{
    businessName?: string;
    tagline?: string;
    description?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Business name validation
    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    } else if (businessName.trim().length < 2) {
      newErrors.businessName = 'Business name must be at least 2 characters';
    } else if (businessName.trim().length > 50) {
      newErrors.businessName = 'Business name must be less than 50 characters';
    }

    // Tagline validation (optional but if provided, must be valid)
    if (tagline.trim() && tagline.trim().length > 100) {
      newErrors.tagline = 'Tagline must be less than 100 characters';
    }

    // Description validation (optional but if provided, must be valid)
    if (description.trim() && description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Save name/tagline/description to local draft first
      updateBusinessDraft({
        name: businessName.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
      });

      let businessId = businessDraft.businessId;

      if (!businessId) {
        // Step 1: Check if user already has a business (e.g. after app restart)
        try {
          const existingBusiness = await getBusinessMe();
          businessId = existingBusiness.id;
          console.log('✅ Found existing business:', businessId);
        } catch (_notFound) {
          // Step 2: No business yet — create one for this Salon user
          console.log('🆕 No business found, creating one...');
          const newBusiness = await createBusiness({
            name: businessName.trim(),
            phoneNumber: userPhone, // Phone used during OTP auth (E.164 format)
            category: CLINIC_CONFIG.category,
          });
          businessId = newBusiness.id;
          console.log('✅ Business created:', businessId);
        }

        // Store the real business ID in the onboarding draft
        updateBusinessDraft({ businessId });
      }

      // Step 3: PATCH the business with the name (update if it already existed)
      if (!businessId) throw new Error('Failed to resolve business ID.');
      
      await updateBusiness(businessId, {
        name: businessName.trim(),
      });

      console.log('✅ Business identity saved successfully');
      navigation.navigate('ContactLocation');
    } catch (error) {
      console.error('🚨 Failed to save business identity:', error);
      Alert.alert('Error', 'Failed to save business details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clinic-specific name suggestions
  const nameSuggestions = [
    'City Health Clinic',
    'CareFirst Medical Center',
    'Wellness Clinic',
  ];

  // Clinic-specific tagline suggestions
  const getSuggestedTaglines = () => [
    'Your health, our priority',
    'Compassionate care for you',
    'Wellness starts here',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.BACKGROUND} />
      <GradientView variant="dark" style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color={Colors.TEXT} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={styles.logoContainer}>
                <Icon name="edit-3" size={32} color={Colors.PRIMARY} />
              </View>
              <Text style={styles.title}>Tell us about your business</Text>
              <Text style={styles.subtitle}>
                Set up your Clinic identity
              </Text>
              
              {/* Progress indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '40%' }]} />
                </View>
                <Text style={styles.progressText}>Step 2 of 5</Text>
              </View>
            </View>
          </View>

          {/* Form Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Business Name Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Name *</Text>
              <Input
                value={businessName}
                onChangeText={(text) => {
                  setBusinessName(text);
                  if (errors.businessName) {
                    setErrors({ ...errors, businessName: undefined });
                  }
                }}
                placeholder="Enter your business name"
                error={errors.businessName}
                leftIcon="briefcase"
                maxLength={50}
                containerStyle={styles.inputContainer}
              />
              
              {/* Name Suggestions */}
              {businessName.length === 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                  <View style={styles.suggestionsRow}>
                    {nameSuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionChip}
                        onPress={() => setBusinessName(suggestion)}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Tagline Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tagline</Text>
              <Text style={styles.sectionDescription}>
                A catchy phrase that describes what you do
              </Text>
              <Input
                value={tagline}
                onChangeText={(text) => {
                  setTagline(text);
                  if (errors.tagline) {
                    setErrors({ ...errors, tagline: undefined });
                  }
                }}
                placeholder="e.g., Your beauty, our artistry"
                error={errors.tagline}
                leftIcon="edit"
                maxLength={100}
                containerStyle={styles.inputContainer}
              />

              {/* Tagline Suggestions */}
              {tagline.length === 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Popular taglines:</Text>
                  <View style={styles.suggestionsRow}>
                    {getSuggestedTaglines().map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionChip}
                        onPress={() => setTagline(suggestion)}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Description Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionDescription}>
                Tell customers what makes your business special
              </Text>
              <Input
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (errors.description) {
                    setErrors({ ...errors, description: undefined });
                  }
                }}
                placeholder="Describe your services, experience, and what sets you apart..."
                error={errors.description}
                leftIcon="file-text"
                multiline
                numberOfLines={4}
                maxLength={500}
                containerStyle={styles.textAreaContainer}
              />
              <Text style={styles.characterCount}>
                {description.length}/500 characters
              </Text>
            </View>

            {/* Preview Section */}
            {businessName.trim() && (
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Preview</Text>
                <View style={styles.previewCard}>
                  <Text style={styles.previewBusinessName}>{businessName.trim()}</Text>
                  {tagline.trim() && (
                    <Text style={styles.previewTagline}>{tagline.trim()}</Text>
                  )}
                  <Text style={styles.previewBusinessType}>Clinic</Text>
                  {description.trim() && (
                    <Text style={styles.previewDescription} numberOfLines={3}>
                      {description.trim()}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title="Continue"
              onPress={handleContinue}
              loading={isLoading}
              disabled={!businessName.trim()}
              size="large"
              fullWidth
            />
          </View>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.XL,
    paddingBottom: Spacing.LG,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.XL,
    left: Spacing.LG,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.SM,
    backgroundColor: Colors.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.XL,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.ROUND,
    backgroundColor: Colors.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  title: {
    ...Typography.H2,
    color: Colors.TEXT,
    textAlign: 'center',
    marginBottom: Spacing.SM,
  },
  subtitle: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.LG,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.XS,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.PRIMARY,
    borderRadius: BorderRadius.SM,
  },
  progressText: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
  },
  section: {
    marginBottom: Spacing.XL,
  },
  sectionTitle: {
    ...Typography.H4,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  sectionDescription: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.MD,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: Spacing.MD,
  },
  textAreaContainer: {
    marginBottom: Spacing.SM,
  },
  characterCount: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
    textAlign: 'right',
  },
  suggestionsContainer: {
    marginTop: Spacing.SM,
  },
  suggestionsTitle: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.SM,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
  },
  suggestionChip: {
    backgroundColor: Colors.SURFACE,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  suggestionText: {
    ...Typography.Body2,
    color: Colors.TEXT,
    fontSize: 13,
  },
  previewSection: {
    marginBottom: Spacing.XL,
  },
  previewTitle: {
    ...Typography.H4,
    color: Colors.TEXT,
    marginBottom: Spacing.MD,
  },
  previewCard: {
    backgroundColor: Colors.SURFACE,
    padding: Spacing.LG,
    borderRadius: BorderRadius.LG,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
  },
  previewBusinessName: {
    ...Typography.H3,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  previewTagline: {
    ...Typography.Body1,
    color: Colors.PRIMARY,
    fontStyle: 'italic',
    marginBottom: Spacing.SM,
  },
  previewBusinessType: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.MD,
  },
  previewDescription: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XL,
  },
});

export default BusinessIdentityScreen;