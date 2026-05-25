import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { useServiceStore } from '../../store/serviceStore';
import { useBusinessStore } from '../../store/businessStore';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme/config';
import { Button, Input } from '../../components';

export default function ServicesScreen() {
  const { items = [], loading, listByBusiness, createForBusiness, updateOne, deleteOne } = useServiceStore();
  const { business, loading: bizLoading, fetchMe } = useBusinessStore();
  
  // Modal state for adding new services
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration: '',
    description: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    price?: string;
    duration?: string;
  }>({});
  const [isCreating, setIsCreating] = useState(false);

  // Modal state for editing services
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [editService, setEditService] = useState({
    name: '',
    price: '',
    duration: '',
    description: '',
  });
  const [editErrors, setEditErrors] = useState<{
    name?: string;
    price?: string;
    duration?: string;
  }>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Ensure business profile is loaded (to get business.id)
  useEffect(() => {
    if (!business && !bizLoading) {
      fetchMe();
    }
  }, [business, bizLoading, fetchMe]);

  const businessId = useMemo(() => business?.id, [business]);

  // Load services when businessId available
  useEffect(() => {
    if (businessId) {
      listByBusiness(businessId, { page: 1, pageSize: 50 });
      console.log('✅ Loading services for business:', businessId);
    } else {
      console.log('⚠️ No businessId available for loading services');
    }
  }, [businessId, listByBusiness]);

  // VALIDATION FUNCTIONS
  const validateService = (service: typeof newService) => {
    const newErrors: typeof errors = {};

    if (!service.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    const price = parseFloat(service.price);
    if (!service.price.trim() || isNaN(price) || price <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    const duration = parseInt(service.duration, 10);
    if (!service.duration.trim() || isNaN(duration) || duration <= 0) {
      newErrors.duration = 'Please enter a valid duration in minutes';
    }

    return { errors: newErrors, isValid: Object.keys(newErrors).length === 0 };
  };

  // ADD SERVICE FUNCTIONS
  const handleCreateService = async () => {
    const validation = validateService(newService);
    setErrors(validation.errors);
    
    if (!validation.isValid || !businessId) return;

    setIsCreating(true);
    try {
      const servicePayload = {
        name: newService.name.trim(),
        description: newService.description.trim() || undefined,
        durationMinutes: parseInt(newService.duration, 10),
        price: parseFloat(newService.price), // API expects price in dollars
      };
      
      await createForBusiness(businessId, servicePayload as any);
      
      // Reset form and close modal
      resetAddModal();
      console.log('✅ Service created successfully');
    } catch (error) {
      console.error('❌ Failed to create service:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetAddModal = () => {
    setNewService({ name: '', price: '', duration: '', description: '' });
    setErrors({});
    setShowAddModal(false);
  };

  // EDIT SERVICE FUNCTIONS
  const handleEditService = (service: any) => {
    console.log('🔧 Opening edit modal for service:', service);
    
    // Extract actual service data in case it's wrapped in API response
    const actualService = service.data || service;
    
    setEditingService(actualService);
    setEditService({
      name: actualService.name || '',
      price: String(actualService.price || 0),
      duration: String(actualService.durationMinutes || 0),
      description: actualService.description || '',
    });
    setEditErrors({});
    setShowEditModal(true);
    
    console.log('✅ Edit modal opened with data');
  };

  const handleUpdateService = async () => {
    const validation = validateService(editService);
    setEditErrors(validation.errors);
    
    if (!validation.isValid || !businessId || !editingService) return;

    setIsUpdating(true);
    try {
      const servicePayload = {
        name: editService.name.trim(),
        description: editService.description.trim() || undefined,
        durationMinutes: parseInt(editService.duration, 10),
        price: parseFloat(editService.price),
      };
      
      await updateOne(editingService.id, servicePayload as any);
      
      // Reset form and close modal
      resetEditModal();
      console.log('✅ Service updated successfully');
    } catch (error) {
      console.error('❌ Failed to update service:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const resetEditModal = () => {
    setEditService({ name: '', price: '', duration: '', description: '' });
    setEditErrors({});
    setEditingService(null);
    setShowEditModal(false);
  };

  // DELETE SERVICE FUNCTION
  const handleDeleteService = (serviceId: string, serviceName: string) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${serviceName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting service:', serviceId);
              await deleteOne(serviceId);
              console.log('✅ Service deleted successfully');
            } catch (error) {
              console.error('❌ Failed to delete service:', error);
            }
          }
        }
      ]
    );
  };

  // LOADING STATE
  if (bizLoading || (!businessId && loading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Services</Text>
          <Text style={styles.headerSubtitle}>
            {items.length === 0 ? 'No services yet' : `${items.length} service${items.length === 1 ? '' : 's'}`}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)} 
          style={styles.addButton}
          disabled={!businessId}
        >
          <Icon name="plus" size={20} color={Colors.TEXT} />
        </TouchableOpacity>
      </View>

      {/* Services List */}
      <FlatList
        contentContainerStyle={items.length === 0 ? styles.center : styles.listContainer}
        data={items}
        keyExtractor={(s) => s.id}
        refreshing={loading}
        onRefresh={() => businessId && listByBusiness(businessId, { page: 1, pageSize: 50 })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="scissors" size={48} color={Colors.TEXT_TERTIARY} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No services yet</Text>
            <Text style={styles.emptyDescription}>
              Add your first service to start accepting bookings
            </Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={() => setShowAddModal(true)}
              disabled={!businessId}
            >
              <Icon name="plus" size={16} color={Colors.PRIMARY} />
              <Text style={styles.emptyAddText}>Add Service</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.serviceInfo}>
                <Text style={styles.title}>{item.name}</Text>
                {item.description && <Text style={styles.subtitle}>{item.description}</Text>}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity 
                  onPress={() => handleEditService(item)}
                  style={styles.actionBtn}
                >
                  <Icon name="edit-2" size={16} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDeleteService(item.id, item.name)}
                  style={[styles.actionBtn, styles.deleteBtn]}
                >
                  <Icon name="trash-2" size={16} color={Colors.ERROR} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Text style={[styles.metaText, { color: Colors.SUCCESS }]}>₹</Text>
                <Text style={styles.metaText}>
                  {Number((item as any).price || 0).toFixed(0)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="clock" size={14} color={Colors.TEXT_SECONDARY} />
                <Text style={styles.metaText}>{Math.round(item.durationMinutes ?? item.duration ?? 0)} min</Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Add Service Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetAddModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={resetAddModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Service</Text>
              <TouchableOpacity 
                onPress={handleCreateService} 
                style={[styles.saveButton, (!newService.name.trim() || !newService.price.trim() || !newService.duration.trim()) && styles.saveButtonDisabled]}
                disabled={isCreating || !newService.name.trim() || !newService.price.trim() || !newService.duration.trim()}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={Colors.PRIMARY} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
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
                  placeholder="Price (₹)"
                  error={errors.price}
                  leftIcon="dollar-sign"
                  keyboardType="numeric"
                  containerStyle={styles.halfWidth}
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
                  containerStyle={styles.halfWidth}
                />
              </View>

              <Input
                value={newService.description}
                onChangeText={(text) => setNewService({ ...newService, description: text })}
                placeholder="Description (optional)"
                leftIcon="file-text"
                multiline
                numberOfLines={3}
                containerStyle={styles.inputContainer}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetEditModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={resetEditModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Service</Text>
              <TouchableOpacity 
                onPress={handleUpdateService} 
                style={[styles.saveButton, (!editService.name.trim() || !editService.price.trim() || !editService.duration.trim()) && styles.saveButtonDisabled]}
                disabled={isUpdating || !editService.name.trim() || !editService.price.trim() || !editService.duration.trim()}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={Colors.PRIMARY} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Input
                value={editService.name}
                onChangeText={(text) => {
                  setEditService({ ...editService, name: text });
                  if (editErrors.name) setEditErrors({ ...editErrors, name: undefined });
                }}
                placeholder="Service name"
                error={editErrors.name}
                leftIcon="scissors"
                containerStyle={styles.inputContainer}
              />

              <View style={styles.row}>
                <Input
                  value={editService.price}
                  onChangeText={(text) => {
                    setEditService({ ...editService, price: text });
                    if (editErrors.price) setEditErrors({ ...editErrors, price: undefined });
                  }}
                  placeholder="Price (₹)"
                  error={editErrors.price}
                  leftIcon="dollar-sign"
                  keyboardType="numeric"
                  containerStyle={styles.halfWidth}
                />
                
                <Input
                  value={editService.duration}
                  onChangeText={(text) => {
                    setEditService({ ...editService, duration: text });
                    if (editErrors.duration) setEditErrors({ ...editErrors, duration: undefined });
                  }}
                  placeholder="Duration (min)"
                  error={editErrors.duration}
                  leftIcon="clock"
                  keyboardType="numeric"
                  containerStyle={styles.halfWidth}
                />
              </View>

              <Input
                value={editService.description}
                onChangeText={(text) => setEditService({ ...editService, description: text })}
                placeholder="Description (optional)"
                leftIcon="file-text"
                multiline
                numberOfLines={3}
                containerStyle={styles.inputContainer}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  center: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    marginTop: Spacing.MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    backgroundColor: Colors.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.H2,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  headerSubtitle: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.LG,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: Spacing.LG,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.XL * 2,
  },
  emptyIcon: {
    marginBottom: Spacing.LG,
  },
  emptyTitle: {
    ...Typography.H3,
    color: Colors.TEXT,
    marginBottom: Spacing.SM,
  },
  emptyDescription: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: Spacing.XL,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY + '20',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.LG,
    gap: Spacing.XS,
  },
  emptyAddText: {
    ...Typography.Body1,
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  serviceInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  title: {
    ...Typography.H4,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  subtitle: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.SM,
    backgroundColor: Colors.SURFACE_VARIANT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: Colors.ERROR + '20',
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.LG,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  metaText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    fontWeight: '600',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    backgroundColor: Colors.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  cancelButton: {
    width: 60,
  },
  cancelButtonText: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
  },
  modalTitle: {
    ...Typography.H3,
    color: Colors.TEXT,
    textAlign: 'center',
  },
  saveButton: {
    width: 60,
    alignItems: 'flex-end',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...Typography.Body1,
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.LG,
  },
  inputContainer: {
    marginBottom: Spacing.LG,
  },
  halfWidth: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.MD,
    marginBottom: Spacing.LG,
  },
});