import React, { useState, useEffect } from 'react';
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
import { useStaffStore } from '@store/staffStore';
import { useResourceStore } from '@store/resourceStore';
import { CLINIC_CONFIG } from '../../config/clinicConfig';

interface StaffSetupScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

interface StaffFormData {
  name: string;
  phone: string;
  linkedResourceIds: string[];
}

const StaffSetupScreen: React.FC<StaffSetupScreenProps> = ({ navigation }) => {
  const { businessDraft, markStepCompleted } = useOnboardingStore();
  const { createOne, creating } = useStaffStore();
  const { items: resources, listByBusiness: loadResources } = useResourceStore();

  // Clinic build: always use Stylist terminology from clinicConfig
  const terminology = CLINIC_CONFIG.terminology;

  const [staffList, setStaffList] = useState<StaffFormData[]>([
    { name: '', phone: '', linkedResourceIds: [] },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (businessDraft.businessId) {
      loadResources(businessDraft.businessId);
    }
  }, [businessDraft.businessId]);

  const handleAddStaff = () => {
    setStaffList([...staffList, { name: '', phone: '', linkedResourceIds: [] }]);
  };

  const handleRemoveStaff = (index: number) => {
    if (staffList.length > 1) {
      setStaffList(staffList.filter((_, i) => i !== index));
    }
  };

  const handleUpdateStaff = (index: number, field: keyof StaffFormData, value: any) => {
    const updated = [...staffList];
    updated[index] = { ...updated[index], [field]: value };
    setStaffList(updated);
  };

  const toggleResourceLink = (staffIndex: number, resourceId: string) => {
    const staff = staffList[staffIndex];
    const isLinked = staff.linkedResourceIds.includes(resourceId);
    const newLinks = isLinked
      ? staff.linkedResourceIds.filter((id) => id !== resourceId)
      : [...staff.linkedResourceIds, resourceId];
    handleUpdateStaff(staffIndex, 'linkedResourceIds', newLinks);
  };

  const handleContinue = async () => {
    const validStaff = staffList.filter((s) => s.name.trim().length > 0);
    if (validStaff.length === 0) {
      Alert.alert(`Add ${terminology.staff}`, `Please add at least one ${terminology.staff.toLowerCase()}`);
      return;
    }

    const businessId = businessDraft.businessId;
    if (!businessId) {
      Alert.alert('Error', 'Business ID not found. Please restart onboarding.');
      return;
    }

    setIsLoading(true);
    try {
      let allSuccess = true;
      for (const staff of validStaff) {
        const result = await createOne(businessId, {
          name: staff.name.trim(),
          phone: staff.phone.trim() || undefined,
        });
        if (!result) { allSuccess = false; break; }
      }

      if (allSuccess) {
        markStepCompleted('staff');
        navigation.navigate('BusinessHours');
      } else {
        throw new Error(`Failed to create some ${terminology.staffPlural.toLowerCase()}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to create ${terminology.staffPlural.toLowerCase()}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      `Skip ${terminology.staff} Setup?`,
      `${terminology.staffPlural} are needed to manage bookings. Skip anyway?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            markStepCompleted('staff');
            navigation.navigate('BusinessHours');
          },
        },
      ]
    );
  };

  const isValid = () => staffList.some((s) => s.name.trim().length > 0);

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
                <Icon name="users" size={32} color={Colors.PRIMARY} />
              </View>
              <Text style={styles.title}>Setup {terminology.staffPlural}</Text>
              <Text style={styles.subtitle}>
                Add your hair stylists who will serve clients
              </Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '78%' }]} />
                </View>
                <Text style={styles.progressText}>Step 7 of 9</Text>
              </View>
            </View>
          </View>

          {/* Form Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Icon name="info" size={20} color={Colors.PRIMARY} />
                <Text style={styles.infoText}>
                  Add your team members. You can link each stylist to a specific chair if needed.
                </Text>
              </View>
            </View>

            {staffList.map((staff, index) => (
              <View key={index} style={styles.staffCard}>
                <View style={styles.staffHeader}>
                  <Text style={styles.staffTitle}>{terminology.staff} {index + 1}</Text>
                  {staffList.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveStaff(index)} style={styles.removeButton}>
                      <Icon name="x" size={20} color={Colors.ERROR} />
                    </TouchableOpacity>
                  )}
                </View>

                <Input
                  value={staff.name}
                  onChangeText={(value) => handleUpdateStaff(index, 'name', value)}
                  placeholder={`${terminology.staff} name`}
                  leftIcon="user"
                  containerStyle={styles.inputContainer}
                />
                <Input
                  value={staff.phone}
                  onChangeText={(value) => handleUpdateStaff(index, 'phone', value)}
                  placeholder="Phone number (optional)"
                  leftIcon="phone"
                  keyboardType="phone-pad"
                  containerStyle={styles.inputContainer}
                />

                {/* Chair Linking */}
                {resources.length > 0 && (
                  <View style={styles.resourceSection}>
                    <Text style={styles.resourceTitle}>Link to {terminology.resourcePlural} (Optional)</Text>
                    <View style={styles.resourceChips}>
                      {resources.map((resource) => (
                        <TouchableOpacity
                          key={resource.id}
                          style={[
                            styles.resourceChip,
                            staff.linkedResourceIds.includes(resource.id) && styles.resourceChipSelected,
                          ]}
                          onPress={() => toggleResourceLink(index, resource.id)}
                        >
                          <Icon
                            name="grid"
                            size={14}
                            color={staff.linkedResourceIds.includes(resource.id) ? Colors.TEXT : Colors.TEXT_SECONDARY}
                          />
                          <Text style={[
                            styles.resourceChipText,
                            staff.linkedResourceIds.includes(resource.id) && styles.resourceChipTextSelected,
                          ]}>
                            {resource.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addStaffButton} onPress={handleAddStaff}>
              <Icon name="plus" size={20} color={Colors.PRIMARY} />
              <Text style={styles.addStaffText}>Add Another {terminology.staff}</Text>
            </TouchableOpacity>

            {/* Examples */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Examples</Text>
              <View style={styles.examplesContainer}>
                {CLINIC_CONFIG.staffExamples.map((example, index) => (
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
              <Button title="Skip" onPress={handleSkip} variant="outline" size="large" style={styles.skipButton} disabled={isLoading || creating} />
              <Button title={`Add ${terminology.staffPlural}`} onPress={handleContinue} loading={isLoading || creating} disabled={!isValid()} size="large" style={styles.continueButton} />
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
  backButton: { position: 'absolute', top: Spacing.XL, left: Spacing.LG, width: 40, height: 40, borderRadius: BorderRadius.SM, backgroundColor: Colors.SURFACE, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  headerContent: { alignItems: 'center', paddingHorizontal: Spacing.LG, paddingTop: Spacing.XL },
  logoContainer: { width: 80, height: 80, borderRadius: BorderRadius.ROUND, backgroundColor: Colors.SURFACE, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.LG },
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
  staffCard: { backgroundColor: Colors.SURFACE, borderRadius: BorderRadius.LG, padding: Spacing.LG, marginBottom: Spacing.LG },
  staffHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.MD },
  staffTitle: { ...Typography.H4, color: Colors.TEXT },
  removeButton: { width: 32, height: 32, borderRadius: BorderRadius.SM, backgroundColor: Colors.ERROR + '20', justifyContent: 'center', alignItems: 'center' },
  inputContainer: { marginBottom: Spacing.MD },
  resourceSection: { marginTop: Spacing.MD },
  resourceTitle: { ...Typography.Body1, color: Colors.TEXT, fontWeight: '600', marginBottom: Spacing.SM },
  resourceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.SM },
  resourceChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.SURFACE_VARIANT, paddingHorizontal: Spacing.MD, paddingVertical: Spacing.SM, borderRadius: BorderRadius.MD, borderWidth: 1, borderColor: Colors.BORDER },
  resourceChipSelected: { backgroundColor: Colors.PRIMARY + '20', borderColor: Colors.PRIMARY },
  resourceChipText: { ...Typography.Body2, color: Colors.TEXT_SECONDARY, marginLeft: Spacing.XS },
  resourceChipTextSelected: { color: Colors.TEXT, fontWeight: '600' },
  addStaffButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.SURFACE, borderRadius: BorderRadius.LG, borderWidth: 2, borderColor: Colors.BORDER, borderStyle: 'dashed', paddingVertical: Spacing.LG, marginBottom: Spacing.XL },
  addStaffText: { ...Typography.Body1, color: Colors.PRIMARY, marginLeft: Spacing.SM, fontWeight: '600' },
  section: { marginBottom: Spacing.XL },
  sectionTitle: { ...Typography.H4, color: Colors.TEXT, marginBottom: Spacing.MD },
  examplesContainer: { gap: Spacing.MD },
  exampleItem: { backgroundColor: Colors.SURFACE, padding: Spacing.MD, borderRadius: BorderRadius.MD },
  exampleTitle: { ...Typography.Body1, color: Colors.TEXT, fontWeight: '600', marginBottom: Spacing.XS },
  exampleText: { ...Typography.Body2, color: Colors.TEXT_SECONDARY },
  footer: { paddingHorizontal: Spacing.LG, paddingBottom: Spacing.XL },
  buttonRow: { flexDirection: 'row', gap: Spacing.MD },
  skipButton: { flex: 1 },
  continueButton: { flex: 2 },
});

export default StaffSetupScreen;