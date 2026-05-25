/**
 * OnboardingWizard Component
 * 
 * Multi-step wizard for initial business setup.
 * Guides merchants through resource and staff configuration.
 * 
 * Steps:
 * 1. Resource Setup - Add chairs/stations
 * 2. Staff Setup - Add team members
 * 3. Review - Confirm configuration
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, ProgressBar, IconButton } from 'react-native-paper';
import { ResourceSetupStep } from './ResourceSetupStep';
import { StaffSetupStep } from './StaffSetupStep';
import { ReviewStep } from './ReviewStep';
import { Colors } from '../../theme/config';

interface OnboardingWizardProps {
  visible: boolean;
  businessId: string;
  onComplete: () => void;
  onDismiss: () => void;
}

type WizardStep = 'resources' | 'staff' | 'review';

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  visible,
  businessId,
  onComplete,
  onDismiss,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('resources');
  const [resourcesCreated, setResourcesCreated] = useState(false);
  const [staffCreated, setStaffCreated] = useState(false);

  const steps: WizardStep[] = ['resources', 'staff', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = (currentStepIndex + 1) / steps.length;

  const handleNext = () => {
    if (currentStep === 'resources') {
      setCurrentStep('staff');
    } else if (currentStep === 'staff') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'staff') {
      setCurrentStep('resources');
    } else if (currentStep === 'review') {
      setCurrentStep('staff');
    }
  };

  const handleResourcesComplete = () => {
    setResourcesCreated(true);
    handleNext();
  };

  const handleStaffComplete = () => {
    setStaffCreated(true);
    handleNext();
  };

  const handleComplete = () => {
    onComplete();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'resources':
        return 'Setup Resources';
      case 'staff':
        return 'Add Staff';
      case 'review':
        return 'Review & Complete';
      default:
        return '';
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              {currentStepIndex > 0 && (
                <IconButton
                  icon="arrow-left"
                  size={24}
                  onPress={handleBack}
                />
              )}
              <Text variant="headlineSmall" style={styles.title}>
                {getStepTitle()}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={onDismiss}
              />
            </View>
            <ProgressBar
              progress={progress}
              color={Colors.PRIMARY}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.stepIndicator}>
              Step {currentStepIndex + 1} of {steps.length}
            </Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {currentStep === 'resources' && (
              <ResourceSetupStep
                businessId={businessId}
                onComplete={handleResourcesComplete}
                onSkip={handleNext}
              />
            )}
            {currentStep === 'staff' && (
              <StaffSetupStep
                businessId={businessId}
                onComplete={handleStaffComplete}
                onSkip={handleNext}
              />
            )}
            {currentStep === 'review' && (
              <ReviewStep
                businessId={businessId}
                onComplete={handleComplete}
                onBack={handleBack}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '90%',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  progressBar: {
    marginTop: 12,
    height: 4,
    borderRadius: 2,
  },
  stepIndicator: {
    marginTop: 8,
    textAlign: 'center',
    color: Colors.TEXT_SECONDARY,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});
