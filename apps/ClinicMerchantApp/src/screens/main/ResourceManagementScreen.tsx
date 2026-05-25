/**
 * Resource Management Screen
 * 
 * Allows merchants to manage physical resources (chairs, beds, rooms, stations).
 * Supports bulk creation, individual CRUD, and deactivation.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { useResourceStore } from '../../store/resourceStore';
import { useBusinessStore } from '../../store/businessStore';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme/config';
import { Input } from '../../components';
import { useCategoryConfig } from '../../hooks/useCategoryConfig';

export default function ResourceManagementScreen() {
  const { items = [], loading, creating, listByBusiness, createOne, bulkCreate, updateOne, deactivate, reactivate } = useResourceStore();
  const { business, loading: bizLoading, fetchMe } = useBusinessStore();
  const categoryConfig = useCategoryConfig();
  const { resource, resourcePlural } = categoryConfig.terminology;

  // Modal state for adding resources
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('bulk');
  const [newResource, setNewResource] = useState({ name: '', description: '' });
  const [bulkConfig, setBulkConfig] = useState({ count: '5', prefix: resource });
  const [errors, setErrors] = useState<{ name?: string; count?: string }>({});

  // Modal state for editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [editResource, setEditResource] = useState({ name: '', description: '' });
  const [editErrors, setEditErrors] = useState<{ name?: string }>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Ensure business profile is loaded
  useEffect(() => {
    if (!business && !bizLoading) {
      fetchMe();
    }
  }, [business, bizLoading, fetchMe]);

  const businessId = useMemo(() => business?.id, [business]);

  // Load resources when businessId available
  useEffect(() => {
    if (businessId) {
      listByBusiness(businessId, true); // Include inactive
    }
  }, [businessId, listByBusiness]);

  // Filter active/inactive
  const activeResources = useMemo(() => items.filter((r) => r.isActive), [items]);
  const inactiveResources = useMemo(() => items.filter((r) => !r.isActive), [items]);

  // Validation
  const validateSingle = () => {
    const newErrors: typeof errors = {};
    if (!newResource.name.trim()) {
      newErrors.name = 'Resource name is required';
    }
    return { errors: newErrors, isValid: Object.keys(newErrors).length === 0 };
  };

  const validateBulk = () => {
    const newErrors: typeof errors = {};
    const count = parseInt(bulkConfig.count, 10);
    if (isNaN(count) || count < 1 || count > 50) {
      newErrors.count = 'Enter a number between 1 and 50';
    }
    return { errors: newErrors, isValid: Object.keys(newErrors).length === 0 };
  };

  // Create handlers
  const handleCreate = async () => {
    if (!businessId) return;

    if (addMode === 'single') {
      const validation = validateSingle();
      setErrors(validation.errors);
      if (!validation.isValid) return;

      const payload: any = {
        name: newResource.name.trim(),
      };
      if (newResource.description.trim()) {
        payload.description = newResource.description.trim();
      }
      await createOne(businessId, payload);
    } else {
      const validation = validateBulk();
      setErrors(validation.errors);
      if (!validation.isValid) return;

      await bulkCreate(businessId, {
        resources: Array.from({ length: parseInt(bulkConfig.count, 10) }, (_, i) => ({
          name: `${bulkConfig.prefix.trim() || 'Chair'} ${i + 1}`,
          isActive: true,
        })),
      });
    }

    resetAddModal();
  };

  const resetAddModal = () => {
    setNewResource({ name: '', description: '' });
    setBulkConfig({ count: '5', prefix: resource });
    setErrors({});
    setShowAddModal(false);
  };

  // Edit handlers
  const handleEdit = (resource: any) => {
    setEditingResource(resource);
    setEditResource({
      name: resource.name || '',
      description: resource.description || '',
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingResource) return;

    const newErrors: typeof editErrors = {};
    if (!editResource.name.trim()) {
      newErrors.name = 'Resource name is required';
    }
    setEditErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsUpdating(true);
    await updateOne(editingResource.id, {
      name: editResource.name.trim(),
      description: editResource.description.trim() || undefined,
    });
    setIsUpdating(false);
    resetEditModal();
  };

  const resetEditModal = () => {
    setEditResource({ name: '', description: '' });
    setEditErrors({});
    setEditingResource(null);
    setShowEditModal(false);
  };

  // Deactivate/Reactivate handlers
  const handleDeactivate = (resourceItem: any) => {
    Alert.alert(
      `Deactivate ${resource}`,
      `Are you sure you want to deactivate "${resourceItem.name}"? It won't be available for new bookings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => deactivate(resourceItem.id),
        },
      ]
    );
  };

  const handleReactivate = (resourceItem: any) => {
    Alert.alert(
      `Reactivate ${resource}`,
      `Reactivate "${resourceItem.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: () => reactivate(resourceItem.id),
        },
      ]
    );
  };

  // Loading state
  if (bizLoading || (!businessId && loading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading {resourcePlural.toLowerCase()}...</Text>
      </View>
    );
  }

  const renderResource = ({ item }: { item: any }) => (
    <View style={[styles.card, !item.isActive && styles.cardInactive]}>
      <View style={styles.cardRow}>
        <View style={styles.resourceInfo}>
          <View style={styles.nameRow}>
            <Icon name="grid" size={18} color={item.isActive ? Colors.PRIMARY : Colors.TEXT_TERTIARY} />
            <Text style={[styles.title, !item.isActive && styles.titleInactive]}>{item.name}</Text>
          </View>
          {item.description && (
            <Text style={styles.subtitle}>{item.description}</Text>
          )}
        </View>
        <View style={styles.actions}>
          {item.isActive ? (
            <>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                <Icon name="edit-2" size={16} color={Colors.PRIMARY} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeactivate(item)} style={[styles.actionBtn, styles.deactivateBtn]}>
                <Icon name="pause" size={16} color={Colors.WARNING} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => handleReactivate(item)} style={[styles.actionBtn, styles.reactivateBtn]}>
              <Icon name="play" size={16} color={Colors.SUCCESS} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {item.utilizationPercent !== undefined && (
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Icon name="activity" size={14} color={Colors.TEXT_SECONDARY} />
            <Text style={styles.metaText}>{item.utilizationPercent}% utilization</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{resourcePlural}</Text>
          <Text style={styles.headerSubtitle}>
            {activeResources.length} active{inactiveResources.length > 0 ? `, ${inactiveResources.length} inactive` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton} disabled={!businessId}>
          <Icon name="plus" size={20} color={Colors.TEXT} />
        </TouchableOpacity>
      </View>

      {/* Resources List */}
      <FlatList
        contentContainerStyle={items.length === 0 ? styles.center : styles.listContainer}
        data={[...activeResources, ...inactiveResources]}
        keyExtractor={(r) => r.id}
        refreshing={loading}
        onRefresh={() => businessId && listByBusiness(businessId, true)}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="grid" size={48} color={Colors.TEXT_TERTIARY} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No {resourcePlural.toLowerCase()} yet</Text>
            <Text style={styles.emptyDescription}>
              Add {resourcePlural.toLowerCase()} to manage your capacity
            </Text>
            <TouchableOpacity style={styles.emptyAddButton} onPress={() => setShowAddModal(true)} disabled={!businessId}>
              <Icon name="plus" size={16} color={Colors.PRIMARY} />
              <Text style={styles.emptyAddText}>Add {resourcePlural}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={renderResource}
      />

      {/* Add Resource Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAddModal}>
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={resetAddModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add {resourcePlural}</Text>
              <TouchableOpacity onPress={handleCreate} style={styles.saveButton} disabled={creating}>
                {creating ? (
                  <ActivityIndicator size="small" color={Colors.PRIMARY} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Mode Toggle */}
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[styles.modeBtn, addMode === 'bulk' && styles.modeBtnActive]}
                  onPress={() => setAddMode('bulk')}
                >
                  <Icon name="layers" size={16} color={addMode === 'bulk' ? Colors.PRIMARY : Colors.TEXT_SECONDARY} />
                  <Text style={[styles.modeBtnText, addMode === 'bulk' && styles.modeBtnTextActive]}>Bulk Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, addMode === 'single' && styles.modeBtnActive]}
                  onPress={() => setAddMode('single')}
                >
                  <Icon name="plus-square" size={16} color={addMode === 'single' ? Colors.PRIMARY : Colors.TEXT_SECONDARY} />
                  <Text style={[styles.modeBtnText, addMode === 'single' && styles.modeBtnTextActive]}>Single</Text>
                </TouchableOpacity>
              </View>

              {addMode === 'bulk' ? (
                <>
                  <Text style={styles.sectionLabel}>How many {resourcePlural.toLowerCase()}?</Text>
                  <View style={styles.row}>
                    <Input
                      value={bulkConfig.count}
                      onChangeText={(text) => {
                        setBulkConfig({ ...bulkConfig, count: text });
                        if (errors.count) setErrors({ ...errors, count: undefined });
                      }}
                      placeholder="Count"
                      error={errors.count}
                      keyboardType="numeric"
                      containerStyle={styles.halfWidth}
                    />
                    <Input
                      value={bulkConfig.prefix}
                      onChangeText={(text) => setBulkConfig({ ...bulkConfig, prefix: text })}
                      placeholder="Name prefix"
                      containerStyle={styles.halfWidth}
                    />
                  </View>
                  <Text style={styles.previewText}>
                    Preview: {bulkConfig.prefix || resource} 1, {bulkConfig.prefix || resource} 2, ...
                  </Text>
                </>
              ) : (
                <>
                  <Input
                    value={newResource.name}
                    onChangeText={(text) => {
                      setNewResource({ ...newResource, name: text });
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    placeholder={`${resource} name`}
                    error={errors.name}
                    leftIcon="grid"
                    containerStyle={styles.inputContainer}
                  />
                  <Input
                    value={newResource.description}
                    onChangeText={(text) => setNewResource({ ...newResource, description: text })}
                    placeholder="Description (optional)"
                    leftIcon="file-text"
                    multiline
                    numberOfLines={2}
                    containerStyle={styles.inputContainer}
                  />
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Edit Resource Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetEditModal}>
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={resetEditModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit {resource}</Text>
              <TouchableOpacity onPress={handleUpdate} style={styles.saveButton} disabled={isUpdating}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color={Colors.PRIMARY} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Input
                value={editResource.name}
                onChangeText={(text) => {
                  setEditResource({ ...editResource, name: text });
                  if (editErrors.name) setEditErrors({ ...editErrors, name: undefined });
                }}
                placeholder={`${resource} name`}
                error={editErrors.name}
                leftIcon="grid"
                containerStyle={styles.inputContainer}
              />
              <Input
                value={editResource.description}
                onChangeText={(text) => setEditResource({ ...editResource, description: text })}
                placeholder="Description (optional)"
                leftIcon="file-text"
                multiline
                numberOfLines={2}
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
  cardInactive: {
    opacity: 0.6,
    borderColor: Colors.TEXT_TERTIARY,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resourceInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.SM,
    marginBottom: Spacing.XS,
  },
  title: {
    ...Typography.H4,
    color: Colors.TEXT,
  },
  titleInactive: {
    color: Colors.TEXT_TERTIARY,
  },
  subtitle: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginLeft: 26,
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
  deactivateBtn: {
    backgroundColor: Colors.WARNING + '20',
  },
  reactivateBtn: {
    backgroundColor: Colors.SUCCESS + '20',
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.LG,
    marginTop: Spacing.MD,
    paddingTop: Spacing.MD,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.XS,
  },
  metaText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.SURFACE_VARIANT,
    borderRadius: BorderRadius.LG,
    padding: Spacing.XS,
    marginBottom: Spacing.XL,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    gap: Spacing.XS,
  },
  modeBtnActive: {
    backgroundColor: Colors.SURFACE,
  },
  modeBtnText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  modeBtnTextActive: {
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  sectionLabel: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
    marginBottom: Spacing.MD,
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
    marginBottom: Spacing.MD,
  },
  previewText: {
    ...Typography.Body2,
    color: Colors.TEXT_TERTIARY,
    fontStyle: 'italic',
  },
});
