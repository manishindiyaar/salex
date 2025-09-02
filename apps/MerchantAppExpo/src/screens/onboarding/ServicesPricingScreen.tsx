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
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import { Button, Input, GradientView } from '@components/index';
import { Colors, Spacing, Typography, BorderRadius } from '@theme/config';
import { useOnboardingStore } from '@store/onboardingStore';
// Service interface matching BusinessDraft.services
interface ServiceDraft {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  description?: string;
}

interface ServicesPricingScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const ServicesPricingScreen: React.FC<ServicesPricingScreenProps> = ({ navigation }) => {
  const { businessDraft, updateBusinessDraft } = useOnboardingStore();
  
  // Initialize with existing services or empty array
  const [services, setServices] = useState<ServiceDraft[]>(businessDraft.services || []);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  
  // New service form state
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration: '',
    category: '',
    description: '',
  });

  const [errors, setErrors] = useState<{
    name?: string;
    price?: string;
    duration?: string;
  }>({});

  // Service templates based on business type
  const getServiceTemplates = () => {
    const businessType = businessDraft.businessType || 'SALON';
    const templates: Record<string, ServiceDraft[]> = {
      'SALON': [
        { id: '1', name: 'Haircut & Style', price: 45, duration: 60, category: 'Hair', description: 'Professional haircut with styling' },
        { id: '2', name: 'Hair Color', price: 85, duration: 120, category: 'Hair', description: 'Full hair coloring service' },
        { id: '3', name: 'Highlights', price: 95, duration: 150, category: 'Hair', description: 'Partial or full highlights' },
        { id: '4', name: 'Blowout', price: 35, duration: 45, category: 'Hair', description: 'Professional hair blowout' },
        { id: '5', name: 'Deep Conditioning', price: 25, duration: 30, category: 'Treatment', description: 'Intensive hair treatment' },
      ],
      'SPA': [
        { id: '1', name: 'Facial Treatment', price: 75, duration: 60, category: 'Facial', description: 'Deep cleansing facial' },
        { id: '2', name: 'Full Body Massage', price: 90, duration: 60, category: 'Massage', description: 'Relaxing full body massage' },
        { id: '3', name: 'Manicure', price: 35, duration: 45, category: 'Nails', description: 'Complete nail care and polish' },
        { id: '4', name: 'Pedicure', price: 45, duration: 60, category: 'Nails', description: 'Foot care and nail treatment' },
        { id: '5', name: 'Body Wrap', price: 85, duration: 90, category: 'Treatment', description: 'Detoxifying body treatment' },
      ],
      'BARBER_SHOP': [
        { id: '1', name: 'Classic Haircut', price: 25, duration: 30, category: 'Hair', description: 'Traditional men\'s haircut' },
        { id: '2', name: 'Beard Trim', price: 15, duration: 20, category: 'Grooming', description: 'Professional beard trimming' },
        { id: '3', name: 'Hot Towel Shave', price: 35, duration: 45, category: 'Shaving', description: 'Traditional straight razor shave' },
        { id: '4', name: 'Hair Wash & Style', price: 20, duration: 25, category: 'Hair', description: 'Shampoo and styling' },
        { id: '5', name: 'Mustache Trim', price: 10, duration: 15, category: 'Grooming', description: 'Precision mustache grooming' },
      ],
      'CLINIC': [
        { id: '1', name: 'Consultation', price: 50, duration: 30, category: 'Consultation', description: 'Initial skin assessment' },
        { id: '2', name: 'Acne Treatment', price: 85, duration: 45, category: 'Treatment', description: 'Targeted acne therapy' },
        { id: '3', name: 'Anti-Aging Facial', price: 120, duration: 90, category: 'Facial', description: 'Advanced anti-aging treatment' },
        { id: '4', name: 'Chemical Peel', price: 95, duration: 60, category: 'Treatment', description: 'Professional chemical peel' },
        { id: '5', name: 'Microdermabrasion', price: 75, duration: 45, category: 'Treatment', description: 'Skin resurfacing treatment' },
      ],
    };
    return templates[businessType] || templates.SALON;
  };

  const validateService = () => {
    const newErrors: typeof errors = {};

    if (!newService.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    const price = parseFloat(newService.price);
    if (!newService.price.trim() || isNaN(price) || price <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    const duration = parseInt(newService.duration, 10);
    if (!newService.duration.trim() || isNaN(duration) || duration <= 0) {
      newErrors.duration = 'Please enter a valid duration in minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddService = () => {
    if (!validateService()) {
      return;
    }

    const service: ServiceDraft = {
      id: Date.now().toString(),
      name: newService.name.trim(),
      price: parseFloat(newService.price),
      duration: parseInt(newService.duration, 10),
      category: newService.category.trim() || 'General',
      description: newService.description.trim() || undefined,
    };

    setServices([...services, service]);
    setNewService({ name: '', price: '', duration: '', category: '', description: '' });
    setShowAddService(false);
    setErrors({});
  };

  const handleAddTemplate = (template: ServiceDraft) => {
    // Check if service already exists
    const exists = services.some(s => s.name.toLowerCase() === template.name.toLowerCase());
    if (exists) {
      Alert.alert('Service Exists', 'This service is already in your list.');
      return;
    }

    const templateService: ServiceDraft = {
      ...template,
      id: Date.now().toString(),
    };
    setServices([...services, templateService]);
  };

  const handleRemoveService = (serviceId: string) => {
    Alert.alert(
      'Remove Service',
      'Are you sure you want to remove this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setServices(services.filter(s => s.id !== serviceId))
        }
      ]
    );
  };

  const handleContinue = async () => {
    if (services.length === 0) {
      Alert.alert(
        'Add Services',
        'Please add at least one service to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    // Update the business draft in store
    updateBusinessDraft({
      services: services,
    });

    // Mock API delay - in production would save to backend
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('BusinessHours');
    }, 1000);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const renderService = ({ item }: { item: ServiceDraft }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveService(item.id)}
        >
          <Icon name="x" size={20} color={Colors.TEXT_SECONDARY} />
        </TouchableOpacity>
      </View>
      <View style={styles.serviceDetails}>
        <View style={styles.serviceDetail}>
          <Icon name="dollar-sign" size={16} color={Colors.PRIMARY} />
          <Text style={styles.serviceDetailText}>${item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.serviceDetail}>
          <Icon name="clock" size={16} color={Colors.PRIMARY} />
          <Text style={styles.serviceDetailText}>{formatDuration(item.duration)}</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.serviceDescription}>{item.description}</Text>
      )}
    </View>
  );

  const renderTemplate = ({ item }: { item: ServiceDraft }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => handleAddTemplate(item)}
    >
      <View style={styles.templateHeader}>
        <Text style={styles.templateName}>{item.name}</Text>
        <Icon name="plus" size={16} color={Colors.PRIMARY} />
      </View>
      <View style={styles.templateDetails}>
        <Text style={styles.templatePrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.templateDuration}>{formatDuration(item.duration)}</Text>
      </View>
    </TouchableOpacity>
  );

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
                <Icon name="scissors" size={32} color={Colors.PRIMARY} />
              </View>
              <Text style={styles.title}>Services & Pricing</Text>
              <Text style={styles.subtitle}>
                Add the services you offer to customers
              </Text>
              
              {/* Progress indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, styles.progressFill80]} />
                </View>
                <Text style={styles.progressText}>Step 4 of 5</Text>
              </View>
            </View>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Current Services */}
            {services.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Services ({services.length})</Text>
                <FlatList
                  data={services}
                  renderItem={renderService}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* Add Custom Service */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.addServiceButton}
                onPress={() => setShowAddService(!showAddService)}
              >
                <Icon name={showAddService ? 'minus' : 'plus'} size={20} color={Colors.PRIMARY} />
                <Text style={styles.addServiceText}>Add Custom Service</Text>
              </TouchableOpacity>

              {showAddService && (
                <View style={styles.addServiceForm}>
                  <Input
                    value={newService.name}
                    onChangeText={(text) => {
                      setNewService({ ...newService, name: text });
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    placeholder="Service name"
                    error={errors.name}
                    leftIcon="scissors"
                    containerStyle={styles.inputContainer}
                  />

                  <View style={styles.row}>
                    <Input
                      value={newService.price}
                      onChangeText={(text) => {
                        setNewService({ ...newService, price: text });
                        if (errors.price) setErrors({ ...errors, price: undefined });
                      }}
                      placeholder="Price ($)"
                      error={errors.price}
                      leftIcon="dollar-sign"
                      keyboardType="numeric"
                      containerStyle={StyleSheet.flatten([styles.inputContainer, styles.halfWidth])}
                    />
                    
                    <Input
                      value={newService.duration}
                      onChangeText={(text) => {
                        setNewService({ ...newService, duration: text });
                        if (errors.duration) setErrors({ ...errors, duration: undefined });
                      }}
                      placeholder="Duration (min)"
                      error={errors.duration}
                      leftIcon="clock"
                      keyboardType="numeric"
                      containerStyle={StyleSheet.flatten([styles.inputContainer, styles.halfWidth])}
                    />
                  </View>

                  <Input
                    value={newService.category}
                    onChangeText={(text) => setNewService({ ...newService, category: text })}
                    placeholder="Category (optional)"
                    leftIcon="tag"
                    containerStyle={styles.inputContainer}
                  />

                  <Input
                    value={newService.description}
                    onChangeText={(text) => setNewService({ ...newService, description: text })}
                    placeholder="Description (optional)"
                    leftIcon="file-text"
                    multiline
                    numberOfLines={2}
                    containerStyle={styles.inputContainer}
                  />

                  <View style={styles.formActions}>
                    <Button
                      title="Cancel"
                      onPress={() => {
                        setShowAddService(false);
                        setNewService({ name: '', price: '', duration: '', category: '', description: '' });
                        setErrors({});
                      }}
                      variant="outline"
                      size="medium"
                      style={styles.cancelButton}
                    />
                    <Button
                      title="Add Service"
                      onPress={handleAddService}
                      size="medium"
                      style={styles.addButton}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Service Templates */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Add Templates</Text>
              <Text style={styles.sectionDescription}>
                Popular services for your business type
              </Text>
              <FlatList
                data={getServiceTemplates()}
                renderItem={renderTemplate}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templatesList}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title="Continue"
              onPress={handleContinue}
              loading={isLoading}
              disabled={services.length === 0}
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
  progressFill80: {
    width: '80%',
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
    marginBottom: Spacing.SM,
  },
  sectionDescription: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.MD,
    lineHeight: 20,
  },
  serviceCard: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...Typography.H4,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  serviceCategory: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  removeButton: {
    padding: Spacing.XS,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginBottom: Spacing.SM,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.LG,
  },
  serviceDetailText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    marginLeft: Spacing.XS,
    fontWeight: '600',
  },
  serviceDescription: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    lineHeight: 20,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.SURFACE,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.LG,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    borderStyle: 'dashed',
    marginBottom: Spacing.MD,
  },
  addServiceText: {
    ...Typography.Body1,
    color: Colors.PRIMARY,
    marginLeft: Spacing.SM,
    fontWeight: '600',
  },
  addServiceForm: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
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
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.MD,
    marginTop: Spacing.SM,
  },
  cancelButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
  templatesList: {
    paddingRight: Spacing.LG,
  },
  templateCard: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginRight: Spacing.MD,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    width: 140,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  templateName: {
    ...Typography.Body1,
    color: Colors.TEXT,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  templateDetails: {
    alignItems: 'flex-start',
  },
  templatePrice: {
    ...Typography.H4,
    color: Colors.PRIMARY,
    fontSize: 16,
    marginBottom: Spacing.XS,
  },
  templateDuration: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XL,
  },
});

export default ServicesPricingScreen;