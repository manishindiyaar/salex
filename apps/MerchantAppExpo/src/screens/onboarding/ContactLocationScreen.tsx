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
import Icon from 'react-native-vector-icons/Feather';

import { Button, Input, GradientView } from '@components/index';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';
import { useOnboardingStore } from '@store/onboardingStore';
import { updateBusiness } from '@services/businessService';
import { formatPhoneToE164 } from '../../utils/phoneUtils';

interface ContactLocationScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const ContactLocationScreen: React.FC<ContactLocationScreenProps> = ({ navigation }) => {
  const { businessDraft, updateBusinessDraft } = useOnboardingStore();

  // Form state
  const [phoneNumber, setPhoneNumber] = useState(businessDraft.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(businessDraft.whatsApp || '');
  const [email, setEmail] = useState(businessDraft.email || '');
  const [street, setStreet] = useState(businessDraft.address?.street || '');
  const [city, setCity] = useState(businessDraft.address?.city || '');
  const [state, setState] = useState(businessDraft.address?.state || '');
  const [zipCode, setZipCode] = useState(businessDraft.address?.zip || '');
  const [country, setCountry] = useState(businessDraft.address?.country || 'US');
  const [isLoading, setIsLoading] = useState(false);
  const [usePhoneForWhatsApp, setUsePhoneForWhatsApp] = useState(true);

  // Validation state
  const [errors, setErrors] = useState<{
    phoneNumber?: string;
    whatsappNumber?: string;
    email?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Phone validation
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Business phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // WhatsApp validation (if different from phone)
    if (!usePhoneForWhatsApp && whatsappNumber.trim()) {
      if (!/^\+?[\d\s\-\(\)]{10,}$/.test(whatsappNumber.trim())) {
        newErrors.whatsappNumber = 'Please enter a valid WhatsApp number';
      }
    }

    // Email validation (optional but if provided, must be valid)
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Address validation
    if (!street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!state.trim()) {
      newErrors.state = 'State/Province is required';
    }
    if (!zipCode.trim()) {
      newErrors.zipCode = 'ZIP/Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Get business ID from store
      const businessId = businessDraft.businessId;
      if (!businessId) {
        throw new Error('Business ID not found. Please restart onboarding.');
      }

      // Format phone number to E.164 format (e.g., +919876543210)
      const formattedPhone = formatPhoneToE164(phoneNumber.trim(), '+91');

      // Update the business draft in store
      const updatedDraft = {
        phone: formattedPhone,
        whatsApp: usePhoneForWhatsApp ? formattedPhone : formatPhoneToE164(whatsappNumber.trim(), '+91'),
        email: email.trim() || undefined,
        address: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zipCode.trim(),
          country: country.trim(),
        },
      };

      updateBusinessDraft(updatedDraft);

      // Update business in backend with real API call
      // Note: Address is stored in the onboarding draft but not sent to backend
      // as the Business model doesn't have an address field yet
      await updateBusiness(businessId, {
        phoneNumber: formattedPhone,
      });

      console.log('✅ Business contact & location updated successfully');
      navigation.navigate('ServicesPricing');
    } catch (error) {
      console.error('🚨 Failed to update business contact & location:', error);
      Alert.alert('Error', 'Failed to save contact & location details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    Alert.alert(
      'Use Current Location',
      'This would normally request location permission and auto-fill your address. For now, please enter your address manually.',
      [{ text: 'OK' }]
    );
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
                <Icon name="map-pin" size={32} color={Colors.PRIMARY} />
              </View>
              <Text style={styles.title}>Contact & Location</Text>
              <Text style={styles.subtitle}>
                Help customers find and contact you
              </Text>
              
              {/* Progress indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '60%' }]} />
                </View>
                <Text style={styles.progressText}>Step 3 of 5</Text>
              </View>
            </View>
          </View>

          {/* Form Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Contact Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <Input
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (usePhoneForWhatsApp) {
                    setWhatsappNumber(text);
                  }
                  if (errors.phoneNumber) {
                    setErrors({ ...errors, phoneNumber: undefined });
                  }
                }}
                placeholder="Business phone number"
                error={errors.phoneNumber}
                leftIcon="phone"
                keyboardType="phone-pad"
                containerStyle={styles.inputContainer}
              />

              {/* WhatsApp Toggle */}
              <TouchableOpacity
                style={styles.toggleContainer}
                onPress={() => {
                  setUsePhoneForWhatsApp(!usePhoneForWhatsApp);
                  if (!usePhoneForWhatsApp) {
                    setWhatsappNumber(phoneNumber);
                  }
                }}
              >
                <View style={styles.toggleRow}>
                  <Icon 
                    name={usePhoneForWhatsApp ? 'check-square' : 'square'} 
                    size={20} 
                    color={usePhoneForWhatsApp ? Colors.PRIMARY : Colors.TEXT_SECONDARY} 
                  />
                  <Text style={styles.toggleText}>
                    Use same number for WhatsApp
                  </Text>
                </View>
              </TouchableOpacity>

              {!usePhoneForWhatsApp && (
                <Input
                  value={whatsappNumber}
                  onChangeText={(text) => {
                    setWhatsappNumber(text);
                    if (errors.whatsappNumber) {
                      setErrors({ ...errors, whatsappNumber: undefined });
                    }
                  }}
                  placeholder="WhatsApp number (if different)"
                  error={errors.whatsappNumber}
                  leftIcon="message-circle"
                  keyboardType="phone-pad"
                  containerStyle={styles.inputContainer}
                />
              )}

              <Input
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                placeholder="Email address (optional)"
                error={errors.email}
                leftIcon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={styles.inputContainer}
              />
            </View>

            {/* Business Address Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Business Address</Text>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleUseCurrentLocation}
                >
                  <Icon name="navigation" size={16} color={Colors.PRIMARY} />
                  <Text style={styles.locationButtonText}>Use Current Location</Text>
                </TouchableOpacity>
              </View>
              
              <Input
                value={street}
                onChangeText={(text) => {
                  setStreet(text);
                  if (errors.street) {
                    setErrors({ ...errors, street: undefined });
                  }
                }}
                placeholder="Street address"
                error={errors.street}
                leftIcon="home"
                containerStyle={styles.inputContainer}
              />

              <View style={styles.row}>
                <Input
                  value={city}
                  onChangeText={(text) => {
                    setCity(text);
                    if (errors.city) {
                      setErrors({ ...errors, city: undefined });
                    }
                  }}
                  placeholder="City"
                  error={errors.city}
                  containerStyle={StyleSheet.flatten([styles.inputContainer, styles.halfWidth])}
                />
                
                <Input
                  value={state}
                  onChangeText={(text) => {
                    setState(text);
                    if (errors.state) {
                      setErrors({ ...errors, state: undefined });
                    }
                  }}
                  placeholder="State/Province"
                  error={errors.state}
                  containerStyle={StyleSheet.flatten([styles.inputContainer, styles.halfWidth])}
                />
              </View>

              <View style={styles.row}>
                <Input
                  value={zipCode}
                  onChangeText={(text) => {
                    setZipCode(text);
                    if (errors.zipCode) {
                      setErrors({ ...errors, zipCode: undefined });
                    }
                  }}
                  placeholder="ZIP/Postal Code"
                  error={errors.zipCode}
                  containerStyle={StyleSheet.flatten([styles.inputContainer, styles.halfWidth])}
                />
                
                <Input
                  value={country}
                  onChangeText={setCountry}
                  placeholder="Country"
                  containerStyle={StyleSheet.flatten([styles.inputContainer, styles.halfWidth])}
                />
              </View>
            </View>

            {/* Contact Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Preferences</Text>
              <Text style={styles.sectionDescription}>
                How would you like customers to reach you?
              </Text>
              
              <View style={styles.preferencesContainer}>
                <View style={styles.preferenceItem}>
                  <Icon name="phone" size={20} color={Colors.PRIMARY} />
                  <Text style={styles.preferenceText}>Phone calls</Text>
                  <Icon name="check-circle" size={16} color={Colors.SUCCESS} />
                </View>
                
                <View style={styles.preferenceItem}>
                  <Icon name="message-circle" size={20} color={Colors.PRIMARY} />
                  <Text style={styles.preferenceText}>WhatsApp messages</Text>
                  <Icon name="check-circle" size={16} color={Colors.SUCCESS} />
                </View>
                
                {email.trim() && (
                  <View style={styles.preferenceItem}>
                    <Icon name="mail" size={20} color={Colors.PRIMARY} />
                    <Text style={styles.preferenceText}>Email</Text>
                    <Icon name="check-circle" size={16} color={Colors.SUCCESS} />
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title="Continue"
              onPress={handleContinue}
              loading={isLoading}
              disabled={!phoneNumber.trim() || !street.trim() || !city.trim()}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.MD,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.MD,
  },
  halfWidth: {
    flex: 1,
  },
  toggleContainer: {
    marginBottom: Spacing.MD,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    marginLeft: Spacing.SM,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.SURFACE,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  locationButtonText: {
    ...Typography.Body2,
    color: Colors.PRIMARY,
    marginLeft: Spacing.XS,
    fontSize: 13,
  },
  preferencesContainer: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.SM,
  },
  preferenceText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    flex: 1,
    marginLeft: Spacing.MD,
  },
  footer: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XL,
  },
});

export default ContactLocationScreen;