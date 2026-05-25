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
import { useResourceStore } from '@store/resourceStore';
import { CLINIC_CONFIG } from '../../config/clinicConfig';

interface ResourceSetupScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const ResourceSetupScreen: React.FC<ResourceSetupScreenProps> = ({ navigation }) => {
  const { businessDraft, markStepCompleted } = useOnboardingStore();
  const { bulkCreate, creating } = useResourceStore();

  // Clinic build: always use Chair terminology from clinicConfig
  const terminology = CLINIC_CONFIG.terminology;

  const [count, setCount] = useState('3');
  const [prefix, setPrefix] = useState<string>(terminology.resource);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ count?: string; prefix?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    const numCount = parseInt(count, 10);

    if (!count.trim()) {
      newErrors.count = 'Number of chairs is required';
    } else if (isNaN(numCount) || numCount < 1) {
      newErrors.count = 'Please enter a valid number (minimum 1)';
    } else if (numCount > 50) {
      newErrors.count = 'Maximum 50 chairs allowed';
    }

    if (!prefix.trim()) {
      newErrors.prefix = 'Chair name prefix is required';
    } else if (prefix.trim().length > 20) {
      newErrors.prefix = 'Prefix must be 20 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

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
        markStepCompleted('resources');
        navigation.navigate('StaffSetup');
      } else {
        throw new Error('Failed to create chairs');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create chairs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Chair Setup?',
      'Chairs are required for booking management. Without them, customers won\'t be able to book appointments.\n\nSkip anyway?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            markStepCompleted('resources');
            navigation.navigate('StaffSetup');
          },
        },
      ]
    );
  };

  const previewNames = () => {
    const numCount = parseInt(count, 10);
    if (isNaN(numCount) || numCount < 1) return [];
    const max = Math.min(numCount, 5);
    const names = [];
    for (let i = 1; i <= max; i++) names.push(`${prefix.trim()} ${i}`);
    if (numCount > 5) names.push(`... and ${numCount - 5} more`);
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
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color={Colors.TEXT} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.logoContainer}>
                <Icon name="grid" size={32} color={Colors.PRIMARY} />
              </View>
              <Text style={styles.title}>Setup {terminology.resourcePlural}</Text>
              <Text style={styles.subtitle}>
                Add rooms for your clinic — each room handles one appointment at a time
              </Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '67%' }]} />
                </View>
                <Text style={styles.progressText}>Step 6 of 9</Text>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Icon name="info" size={20} color={Colors.PRIMARY} />
                <Text style={styles.infoText}>
                  Each chair can handle one client at a time. You can always add more chairs later.
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chair Details</Text>
              <Input
                value={count}
                onChangeText={(text) => {
                  setCount(text);
                  if (errors.count) setErrors({ ...errors, count: undefined });
                }}
                placeholder="Number of chairs"
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
                  if (errors.prefix) setErrors({ ...errors, prefix: undefined });
                }}
                placeholder="Chair name prefix"
                error={errors.prefix}
                leftIcon="tag"
                containerStyle={styles.inputContainer}
                maxLength={20}
              />
            </View>

            {/* Preview */}
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

            {/* Examples */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Examples</Text>
              <View style={styles.examplesContainer}>
                {CLINIC_CONFIG.resourceExamples.map((example, index) => (
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
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  gradient: { flex: 1 },
  keyboardContainer: { flex: 1 },
  header: { paddingTop: Spacing.XL, paddingBottom: Spacing.LG },
  backButton: {
    position: 'absolute', top: Spacing.XL, left: Spacing.LG,
    width: 40, height: 40, borderRadius: BorderRadius.SM,
    backgroundColor: Colors.SURFACE, justifyContent: 'center',
    alignItems: 'center', zIndex: 1,
  },
  headerContent: { alignItems: 'center', paddingHorizontal: Spacing.LG, paddingTop: Spacing.XL },
  logoContainer: {
    width: 80, height: 80, borderRadius: BorderRadius.ROUND,
    backgroundColor: Colors.SURFACE, justifyContent: 'center',
    alignItems: 'center', marginBottom: Spacing.LG,
  },
  title: { ...Typography.H2, color: Colors.TEXT, textAlign: 'center', marginBottom: Spacing.SM },
  subtitle: { ...Typography.Body1, color: Colors.TEXT_SECONDARY, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.LG },
  progressContainer: { width: '100%', alignItems: 'center' },
  progressBar: { width: '80%', height: 4, backgroundColor: Colors.SURFACE, borderRadius: BorderRadius.SM, marginBottom: Spacing.XS },
  progressFill: { height: '100%', backgroundColor: Colors.PRIMARY, borderRadius: BorderRadius.SM },
  progressText: { ...Typography.Caption, color: Colors.TEXT_TERTIARY },
  content: { flex: 1, paddingHorizontal: Spacing.LG },
  infoSection: { marginBottom: Spacing.XL },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.SURFACE, padding: Spacing.LG, borderRadius: BorderRadius.LG, borderLeftWidth: 4, borderLeftColor: Colors.PRIMARY },
  infoText: { ...Typography.Body2, color: Colors.TEXT_SECONDARY, marginLeft: Spacing.MD, flex: 1, lineHeight: 20 },
  section: { marginBottom: Spacing.XL },
  sectionTitle: { ...Typography.H4, color: Colors.TEXT, marginBottom: Spacing.MD },
  inputContainer: { marginBottom: Spacing.MD },
  previewContainer: { backgroundColor: Colors.SURFACE, borderRadius: BorderRadius.LG, padding: Spacing.LG },
  previewItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.SM },
  previewText: { ...Typography.Body1, color: Colors.TEXT, marginLeft: Spacing.SM },
  examplesContainer: { gap: Spacing.MD },
  exampleItem: { backgroundColor: Colors.SURFACE, padding: Spacing.MD, borderRadius: BorderRadius.MD },
  exampleTitle: { ...Typography.Body1, color: Colors.TEXT, fontWeight: '600', marginBottom: Spacing.XS },
  exampleText: { ...Typography.Body2, color: Colors.TEXT_SECONDARY },
  footer: { paddingHorizontal: Spacing.LG, paddingBottom: Spacing.XL },
  buttonRow: { flexDirection: 'row', gap: Spacing.MD },
  skipButton: { flex: 1 },
  continueButton: { flex: 2 },
});

export default ResourceSetupScreen;