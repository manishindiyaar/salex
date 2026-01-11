import React, { useState, useMemo } from 'react';
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
import Icon from 'react-native-vector-icons/Feather';

import { Button, Input, GradientView } from '@components/index';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';
import { useOnboardingStore } from '@store/onboardingStore';
import { useResourceStore } from '@store/resourceStore';
import { BusinessCategory } from '../../types/business';
import { TerminologyConfig } from '@services/templateService';

interface ResourceSetupScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

// Category-specific resource configurations
const CATEGORY_RESOURCE_CONFIG: Record<BusinessCategory, { prefix: string; examples: { title: string; text: string }[] }> = {
  [BusinessCategory.SALON]: {
    prefix: 'Chair',
    examples: [
      { title: 'Hair Salon', text: 'Chair 1, Chair 2, Chair 3...' },
      { title: 'Wash Station', text: 'Wash 1, Wash 2...' },
    ],
  },
  [BusinessCategory.CLINIC]: {
    prefix: 'Room',
    examples: [
      { title: 'Treatment Room', text: 'Room 1, Room 2, Room 3...' },
      { title: 'Consultation', text: 'Consultation 1, Consultation 2...' },
    ],
  },
  [BusinessCategory.SPA]: {
    prefix: 'Room',
    examples: [
      { title: 'Massage Room', text: 'Room 1, Room 2, Room 3...' },
      { title: 'Treatment Suite', text: 'Suite 1, Suite 2...' },
    ],
  },
  [BusinessCategory.BEAUTY_PARLOR]: {
    prefix: 'Station',
    examples: [
      { title: 'Beauty Station', text: 'Station 1, Station 2, Station 3...' },
      { title: 'Makeup Area', text: 'Makeup 1, Makeup 2...' },
    ],
  },
  [BusinessCategory.FITNESS]: {
    prefix: 'Station',
    examples: [
      { title: 'Training Station', text: 'Station 1, Station 2, Station 3...' },
      { title: 'Equipment', text: 'Equipment 1, Equipment 2...' },
    ],
  },
  [BusinessCategory.OTHER]: {
    prefix: 'Resource',
    examples: [
      { title: 'General', text: 'Resource 1, Resource 2, Resource 3...' },
    ],
  },
};

const ResourceSetupScreen: React.FC<ResourceSetupScreenProps> = ({ navigation }) => {
  const { businessDraft, markStepCompleted, getVisibleSteps } = useOnboardingStore();
  const { bulkCreate, creating } = useResourceStore();

  // Get terminology from template or fallback to category-specific config
  const terminology: TerminologyConfig = useMemo(() => {
    if (businessDraft.template?.terminology) {
      return businessDraft.template.terminology;
    }
    
    // Fallback to category-specific defaults
    const category = (businessDraft.businessType as BusinessCategory) || BusinessCategory.SALON;
    const categoryConfig = CATEGORY_RESOURCE_CONFIG[category] || CATEGORY_RESOURCE_CONFIG[BusinessCategory.SALON];
    
    return {
      resource: categoryConfig.prefix,
      resourcePlural: `${categoryConfig.prefix}s`,
      staff: 'Staff',
      staffPlural: 'Staff Members',
      booking: 'Booking',
      bookingPlural: 'Bookings',
      customer: 'Customer',
      customerPlural: 'Customers',
    };
  }, [businessDraft.template, businessDraft.businessType]);

  // Get category-specific examples
  const categoryConfig = useMemo(() => {
    const category = (businessDraft.businessType as BusinessCategory) || BusinessCategory.SALON;
    return CATEGORY_RESOURCE_CONFIG[category] || CATEGORY_RESOURCE_CONFIG[BusinessCategory.SALON];
  }, [businessDraft.businessType]);

  // Form state - use template terminology for defaults
  const [count, setCount] = useState('3'); // Default to 3 resources
  const [prefix, setPrefix] = useState(terminology.resource); // Use template terminology
  const [isLoading, setIsLoading] = useState(false);

  // Update prefix when terminology changes
  React.useEffect(() => {
    setPrefix(terminology.resource);
  }, [terminology.resource]);

  // Check if this step should be skipped based on enabled modules
  React.useEffect(() => {
    const template = businessDraft.template;
    if (template && !template.enabledModules.includes('resource_management')) {
      // Skip this step and go to next visible step
      markStepCompleted('resources');
      const visibleSteps = getVisibleSteps();
      const currentIndex = visibleSteps.findIndex(step => step.id === 'resources');
      const nextStep = visibleSteps[currentIndex + 1];
      if (nextStep) {
        navigation.navigate(getScreenNameForStep(nextStep.id));
      }
    }
  }, [businessDraft.template, navigation, markStepCompleted, getVisibleSteps]);

  const getScreenNameForStep = (stepId: string): string => {
    const screenMap: Record<string, string> = {
      'staff': 'StaffSetup',
      'business_hours': 'BusinessHours',
      'review': 'ReviewComplete',
    };
    return screenMap[stepId] || 'StaffSetup';
  };

  // Validation state
  const [errors, setErrors] = useState<{
    count?: string;
    prefix?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Count validation
    const numCount = parseInt(count, 10);
    if (!count.trim()) {
      newErrors.count = 'Number of resources is required';
    } else if (isNaN(numCount) || numCount < 1) {
      newErrors.count = 'Please enter a valid number (minimum 1)';
    } else if (numCount > 50) {
      newErrors.count = 'Maximum 50 resources allowed';
    }

    // Prefix validation
    if (!prefix.trim()) {
      newErrors.prefix = `${terminology.resource} name prefix is required`;
    } else if (prefix.trim().length > 20) {
      newErrors.prefix = 'Prefix must be 20 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    const businessId = businessDraft.businessId;
    if (!businessId) {
      Alert.alert('Error', 'Business ID not found. Please restart onboarding.');
      return;
    }

    setIsLoading(true);

    try {
      const numCount = parseInt(count, 10);
      const result = await bulkCreate(businessId, {
        resources: Array.from({ length: numCount }, (_, i) => ({
          name: `${prefix.trim()} ${i + 1}`,
          isActive: true,
        })),
      });

      if (result) {
        console.log(`✅ ${terminology.resourcePlural} created successfully`);
        markStepCompleted('resources');
        navigation.navigate('StaffSetup');
      } else {
        throw new Error('Failed to create resources');
      }
    } catch (error) {
      console.error('🚨 Failed to create resources:', error);
      Alert.alert('Error', `Failed to create ${terminology.resourcePlural.toLowerCase()}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      `Skip ${terminology.resource} Setup?`,
      `${terminology.resourcePlural} (${terminology.resourcePlural.toLowerCase()}) are required for booking management. Without them, customers won't be able to book appointments.\n\nAre you sure you want to skip this step?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip Anyway',
          style: 'destructive',
          onPress: () => {
            markStepCompleted('resources');
            navigation.navigate('StaffSetup');
          }
        }
      ]
    );
  };

  // Generate preview names
  const previewNames = () => {
    const numCount = parseInt(count, 10);
    if (isNaN(numCount) || numCount < 1) return [];
    
    const max = Math.min(numCount, 5);
    const names = [];
    for (let i = 1; i <= max; i++) {
      names.push(`${prefix.trim()} ${i}`);
    }
    if (numCount > 5) {
      names.push(`... and ${numCount - 5} more`);
    }
    return names;
  };

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
                <Icon name="grid" size={32} color={Colors.PRIMARY} />
              </View>
              <Text style={styles.title}>Setup {terminology.resourcePlural}</Text>
              <Text style={styles.subtitle}>
                Add {terminology.resourcePlural.toLowerCase()} for your business
              </Text>
              
              {/* Progress indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '70%' }]} />
                </View>
                <Text style={styles.progressText}>Step 6 of 10</Text>
              </View>
            </View>
          </View>

          {/* Form Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Icon name="info" size={20} color={Colors.PRIMARY} />
                <Text style={styles.infoText}>
                  {terminology.resourcePlural} help manage capacity and appointments. Each {terminology.resource.toLowerCase()} can handle one booking at a time.
                </Text>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{terminology.resource} Details</Text>
              
              <Input
                value={count}
                onChangeText={(text) => {
                  setCount(text);
                  if (errors.count) {
                    setErrors({ ...errors, count: undefined });
                  }
                }}
                placeholder={`Number of ${terminology.resourcePlural.toLowerCase()}`}
                error={errors.count}
                leftIcon="hash"
                keyboardType="number-pad"
                containerStyle={styles.inputContainer}
                maxLength={2}
              />

              <Input
                value={prefix}
                onChangeText={(text) => {
                  setPrefix(text);
                  if (errors.prefix) {
                    setErrors({ ...errors, prefix: undefined });
                  }
                }}
                placeholder={`${terminology.resource} name prefix`}
                error={errors.prefix}
                leftIcon="tag"
                containerStyle={styles.inputContainer}
                maxLength={20}
              />
            </View>

            {/* Preview Section */}
            {previewNames().length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preview</Text>
                <View style={styles.previewContainer}>
                  {previewNames().map((name, index) => (
                    <View key={index} style={styles.previewItem}>
                      <Icon name="grid" size={16} color={Colors.PRIMARY} />
                      <Text style={styles.previewText}>{name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Examples Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Examples for your business type</Text>
              <View style={styles.examplesContainer}>
                {categoryConfig.examples.map((example, index) => (
                  <View key={index} style={styles.exampleItem}>
                    <Text style={styles.exampleTitle}>{example.title}</Text>
                    <Text style={styles.exampleText}>{example.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <Button
                title="Skip"
                onPress={handleSkip}
                variant="outline"
                size="large"
                style={styles.skipButton}
                disabled={isLoading || creating}
              />
              <Button
                title={`Create ${terminology.resourcePlural}`}
                onPress={handleContinue}
                loading={isLoading || creating}
                disabled={!count.trim() || !prefix.trim()}
                size="large"
                style={styles.continueButton}
              />
            </View>
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
  infoSection: {
    marginBottom: Spacing.XL,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.SURFACE,
    padding: Spacing.LG,
    borderRadius: BorderRadius.LG,
    borderLeftWidth: 4,
    borderLeftColor: Colors.PRIMARY,
  },
  infoText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginLeft: Spacing.MD,
    flex: 1,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.XL,
  },
  sectionTitle: {
    ...Typography.H4,
    color: Colors.TEXT,
    marginBottom: Spacing.MD,
  },
  inputContainer: {
    marginBottom: Spacing.MD,
  },
  previewContainer: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
  },
  previewText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    marginLeft: Spacing.SM,
  },
  examplesContainer: {
    gap: Spacing.MD,
  },
  exampleItem: {
    backgroundColor: Colors.SURFACE,
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
  },
  exampleTitle: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  exampleText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  footer: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XL,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  skipButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
});

export default ResourceSetupScreen;