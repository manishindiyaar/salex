/**
 * Staff Management Screen
 * 
 * Allows merchants to manage staff members.
 * Supports CRUD, resource linking, and deactivation.
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
import { useStaffStore } from '../../store/staffStore';
import { useResourceStore } from '../../store/resourceStore';
import { useBusinessStore } from '../../store/businessStore';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme/config';
import { Input } from '../../components';
import { useCategoryConfig } from '../../hooks/useCategoryConfig';

export default function StaffManagementScreen() {
  const { items = [], loading, creating, listByBusiness, createOne, updateOne, deactivate, reactivate, linkToResource, unlinkFromResource } = useStaffStore();
  const { items: resources, listByBusiness: listResources } = useResourceStore();
  const { business, loading: bizLoading, fetchMe } = useBusinessStore();
  const categoryConfig = useCategoryConfig();
  const { staff, staffPlural, resource, resourcePlural } = categoryConfig.terminology;

  // Modal state for adding staff
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '' });
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Modal state for editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [editStaff, setEditStaff] = useState({ name: '', phone: '' });
  const [editErrors, setEditErrors] = useState<{ name?: string }>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal state for linking resources
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingStaff, setLinkingStaff] = useState<any>(null);

  // Ensure business profile is loaded
  useEffect(() => {
    if (!business && !bizLoading) {
      fetchMe();
    }
  }, [business, bizLoading, fetchMe]);

  const businessId = useMemo(() => business?.id, [business]);

  // Load staff and resources when businessId available
  useEffect(() => {
    if (businessId) {
      listByBusiness(businessId, true);
      listResources(businessId, false);
    }
  }, [businessId, listByBusiness, listResources]);

  // Filter active/inactive
  const activeStaff = useMemo(() => items.filter((s) => s.isActive), [items]);
  const inactiveStaff = useMemo(() => items.filter((s) => !s.isActive), [items]);
  const activeResources = useMemo(() => resources.filter((r) => r.isActive), [resources]);

  // Validation
  const validateStaff = (staff: typeof newStaff) => {
    const newErrors: typeof errors = {};
    if (!staff.name.trim()) {
      newErrors.name = 'Staff name is required';
    }
    return { errors: newErrors, isValid: Object.keys(newErrors).length === 0 };
  };

  // Create handler
  const handleCreate = async () => {
    if (!businessId) return;

    const validation = validateStaff(newStaff);
    setErrors(validation.errors);
    if (!validation.isValid) return;

    await createOne(businessId, {
      name: newStaff.name.trim(),
      phone: newStaff.phone.trim() || undefined,
    });

    // Link to resources after creation if any were selected
    if (selectedResourceIds.length > 0) {
      // We'll need to get the created staff ID and link resources
      // For now, we'll refresh the list and let the user link manually
      await listByBusiness(businessId, true);
    }

    resetAddModal();
  };

  const resetAddModal = () => {
    setNewStaff({ name: '', phone: '' });
    setSelectedResourceIds([]);
    setErrors({});
    setShowAddModal(false);
  };

  // Edit handlers
  const handleEdit = (staff: any) => {
    setEditingStaff(staff);
    setEditStaff({
      name: staff.name || '',
      phone: staff.phone || '',
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingStaff) return;

    const validation = validateStaff(editStaff);
    setEditErrors(validation.errors);
    if (!validation.isValid) return;

    setIsUpdating(true);
    await updateOne(editingStaff.id, {
      name: editStaff.name.trim(),
      phone: editStaff.phone.trim() || undefined,
    });
    setIsUpdating(false);
    resetEditModal();
  };

  const resetEditModal = () => {
    setEditStaff({ name: '', phone: '' });
    setEditErrors({});
    setEditingStaff(null);
    setShowEditModal(false);
  };

  // Deactivate/Reactivate handlers
  const handleDeactivate = (staffMember: any) => {
    Alert.alert(
      `Deactivate ${staff}`,
      `Are you sure you want to deactivate "${staffMember.name}"? They won't be assigned to new bookings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => deactivate(staffMember.id),
        },
      ]
    );
  };

  const handleReactivate = (staffMember: any) => {
    Alert.alert(
      `Reactivate ${staff}`,
      `Reactivate "${staffMember.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: () => reactivate(staffMember.id),
        },
      ]
    );
  };

  // Resource linking handlers
  const handleOpenLinkModal = (staff: any) => {
    setLinkingStaff(staff);
    setShowLinkModal(true);
  };

  const handleToggleResourceLink = async (resourceId: string) => {
    if (!linkingStaff) return;

    const isLinked = linkingStaff.linkedResources?.some((r: any) => r.id === resourceId);
    
    if (isLinked) {
      await unlinkFromResource(linkingStaff.id, resourceId);
    } else {
      await linkToResource(linkingStaff.id, { resourceId });
    }

    // Refresh staff list to get updated linked resources
    if (businessId) {
      await listByBusiness(businessId, true);
      // Update linkingStaff with fresh data
      const updated = items.find((s) => s.id === linkingStaff.id);
      if (updated) setLinkingStaff(updated);
    }
  };

  // Toggle resource selection for new staff
  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResourceIds((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  // Loading state
  if (bizLoading || (!businessId && loading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading {staffPlural.toLowerCase()}...</Text>
      </View>
    );
  }

  const renderStaff = ({ item }: { item: any }) => (
    <View style={[styles.card, !item.isActive && styles.cardInactive]}>
      <View style={styles.cardRow}>
        <View style={styles.staffInfo}>
          <View style={styles.nameRow}>
            <Icon name="user" size={18} color={item.isActive ? Colors.PRIMARY : Colors.TEXT_TERTIARY} />
            <Text style={[styles.title, !item.isActive && styles.titleInactive]}>{item.name}</Text>
          </View>
          {item.phone && (
            <Text style={styles.subtitle}>{item.phone}</Text>
          )}
          {item.linkedResources && item.linkedResources.length > 0 && (
            <View style={styles.linkedResources}>
              {item.linkedResources.map((r: any) => (
                <View key={r.id} style={styles.linkedBadge}>
                  <Icon name="grid" size={12} color={Colors.PRIMARY} />
                  <Text style={styles.linkedText}>{r.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.actions}>
          {item.isActive ? (
            <>
              <TouchableOpacity onPress={() => handleOpenLinkModal(item)} style={styles.actionBtn}>
                <Icon name="link" size={16} color={Colors.SECONDARY} />
              </TouchableOpacity>
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
          <Text style={styles.headerTitle}>{staffPlural}</Text>
          <Text style={styles.headerSubtitle}>
            {activeStaff.length} active{inactiveStaff.length > 0 ? `, ${inactiveStaff.length} inactive` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton} disabled={!businessId}>
          <Icon name="plus" size={20} color={Colors.BACKGROUND} />
        </TouchableOpacity>
      </View>

      {/* Staff List */}
      <FlatList
        contentContainerStyle={items.length === 0 ? styles.center : styles.listContainer}
        data={[...activeStaff, ...inactiveStaff]}
        keyExtractor={(s) => s.id}
        refreshing={loading}
        onRefresh={() => businessId && listByBusiness(businessId, true)}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color={Colors.TEXT_TERTIARY} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No {staffPlural.toLowerCase()} yet</Text>
            <Text style={styles.emptyDescription}>
              Add your team members to assign them to bookings
            </Text>
            <TouchableOpacity style={styles.emptyAddButton} onPress={() => setShowAddModal(true)} disabled={!businessId}>
              <Icon name="plus" size={16} color={Colors.PRIMARY} />
              <Text style={styles.emptyAddText}>Add {staff}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={renderStaff}
      />

      {/* Add Staff Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAddModal}>
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={resetAddModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add {staff}</Text>
              <TouchableOpacity onPress={handleCreate} style={styles.saveButton} disabled={creating}>
                {creating ? (
                  <ActivityIndicator size="small" color={Colors.PRIMARY} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Input
                value={newStaff.name}
                onChangeText={(text) => {
                  setNewStaff({ ...newStaff, name: text });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder={`${staff} name`}
                error={errors.name}
                leftIcon="user"
                containerStyle={styles.inputContainer}
              />
              <Input
                value={newStaff.phone}
                onChangeText={(text) => setNewStaff({ ...newStaff, phone: text })}
                placeholder="Phone number (optional)"
                leftIcon="phone"
                keyboardType="phone-pad"
                containerStyle={styles.inputContainer}
              />

              {activeResources.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Link to {resourcePlural.toLowerCase()} (optional)</Text>
                  <View style={styles.resourceGrid}>
                    {activeResources.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[
                          styles.resourceChip,
                          selectedResourceIds.includes(r.id) && styles.resourceChipSelected,
                        ]}
                        onPress={() => toggleResourceSelection(r.id)}
                      >
                        <Icon
                          name={selectedResourceIds.includes(r.id) ? 'check-square' : 'square'}
                          size={16}
                          color={selectedResourceIds.includes(r.id) ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                        />
                        <Text
                          style={[
                            styles.resourceChipText,
                            selectedResourceIds.includes(r.id) && styles.resourceChipTextSelected,
                          ]}
                        >
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetEditModal}>
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={resetEditModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit {staff}</Text>
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
                value={editStaff.name}
                onChangeText={(text) => {
                  setEditStaff({ ...editStaff, name: text });
                  if (editErrors.name) setEditErrors({ ...editErrors, name: undefined });
                }}
                placeholder={`${staff} name`}
                error={editErrors.name}
                leftIcon="user"
                containerStyle={styles.inputContainer}
              />
              <Input
                value={editStaff.phone}
                onChangeText={(text) => setEditStaff({ ...editStaff, phone: text })}
                placeholder="Phone number (optional)"
                leftIcon="phone"
                keyboardType="phone-pad"
                containerStyle={styles.inputContainer}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Link Resources Modal */}
      <Modal visible={showLinkModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowLinkModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.cancelButton} />
            <Text style={styles.modalTitle}>Link {resourcePlural}</Text>
            <TouchableOpacity onPress={() => setShowLinkModal(false)} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            <Text style={styles.linkDescription}>
              Link {linkingStaff?.name} to specific {resourcePlural.toLowerCase()}. When a linked {resource.toLowerCase()} is booked, this {staff.toLowerCase()} will be preferred.
            </Text>
            <View style={styles.resourceGrid}>
              {activeResources.map((r) => {
                const isLinked = linkingStaff?.linkedResources?.some((lr: any) => lr.id === r.id);
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.resourceChip, isLinked && styles.resourceChipSelected]}
                    onPress={() => handleToggleResourceLink(r.id)}
                  >
                    <Icon
                      name={isLinked ? 'check-square' : 'square'}
                      size={16}
                      color={isLinked ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                    />
                    <Text style={[styles.resourceChipText, isLinked && styles.resourceChipTextSelected]}>
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
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
  staffInfo: {
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
    marginBottom: Spacing.SM,
  },
  linkedResources: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.XS,
    marginLeft: 26,
    marginTop: Spacing.XS,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY + '15',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
    gap: 4,
  },
  linkedText: {
    ...Typography.Caption,
    color: Colors.PRIMARY,
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
  inputContainer: {
    marginBottom: Spacing.LG,
  },
  sectionLabel: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
    marginBottom: Spacing.MD,
  },
  linkDescription: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.LG,
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
  },
  resourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.SURFACE_VARIANT,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    gap: Spacing.XS,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  resourceChipSelected: {
    backgroundColor: Colors.PRIMARY + '15',
    borderColor: Colors.PRIMARY,
  },
  resourceChipText: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
  },
  resourceChipTextSelected: {
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
});
