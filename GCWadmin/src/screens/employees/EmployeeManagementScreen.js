import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {
  User,
  Trash2,
  Edit2,
  Save,
  Plus,
  GripVertical,
  Mail,
  Phone,
  Calendar,
  X,
  Camera,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { employeesApi } from '../../api/employees';
import { API_BASE } from '../../api/config';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants';

const EmployeeManagementScreen = () => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [uploading, setUploading] = useState(false);

  // New employee form state
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    position: '',
    bio: '',
    email: '',
    phone: '',
    joined_date: '',
    photo: null,
  });

  const loadEmployees = useCallback(async () => {
    if (!token) return;

    try {
      const data = await employeesApi.getEmployees(token);
      setEmployees(data);
    } catch (error) {
      console.error(t('employeeManager.loadError'), error);
      Alert.alert(t('common.error'), t('employeeManager.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleImagePick = async (employeeId = null, useCamera = false) => {
    try {
      // Request permissions
      const permissionMethod = useCamera
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
      
      const { status } = await permissionMethod();
      if (status !== 'granted') {
        Alert.alert(
          t('common.error'),
          useCamera ? t('employeeManager.cameraPermission') : t('employeeManager.galleryPermission')
        );
        return;
      }

      const launchMethod = useCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

      const result = await launchMethod({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (employeeId) {
          // Update existing employee photo
          setEmployees(employees.map(emp =>
            emp.id === employeeId ? { ...emp, newPhoto: result.assets[0] } : emp
          ));
        } else {
          // Set new employee photo
          setNewEmployee({ ...newEmployee, photo: result.assets[0] });
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(t('common.error'), t('employeeManager.pickImageError'));
    }
  };

  const showImageSourcePicker = (employeeId = null) => {
    Alert.alert(
      t('employeeManager.photo'),
      t('employeeManager.chooseSource'),
      [
        {
          text: t('employeeManager.camera'),
          onPress: () => handleImagePick(employeeId, true),
        },
        {
          text: t('employeeManager.gallery'),
          onPress: () => handleImagePick(employeeId, false),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ],
    );
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.position) {
      Alert.alert(t('common.error'), t('employeeManager.nameRequired'));
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('name', newEmployee.name);
      formData.append('position', newEmployee.position);
      formData.append('bio', newEmployee.bio);
      formData.append('email', newEmployee.email);
      formData.append('phone', newEmployee.phone);
      formData.append('joined_date', newEmployee.joined_date);

      if (newEmployee.photo) {
        formData.append('photo', {
          uri: newEmployee.photo.uri,
          type: 'image/jpeg',
          name: 'employee-photo.jpg',
        });
      }

      const result = await employeesApi.addEmployee(token, formData);
      setEmployees([...employees, result.employee]);
      setNewEmployee({
        name: '',
        position: '',
        bio: '',
        email: '',
        phone: '',
        joined_date: '',
        photo: null,
      });
      setIsAddingNew(false);
      Alert.alert(t('common.success'), t('employeeManager.added'));
    } catch (error) {
      console.error('Error adding employee:', error);
      Alert.alert(t('common.error'), t('employeeManager.addError'));
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateEmployee = async (id) => {
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('name', employee.name);
      formData.append('position', employee.position);
      formData.append('bio', employee.bio || '');
      formData.append('email', employee.email || '');
      formData.append('phone', employee.phone || '');

      if (employee.newPhoto) {
        formData.append('photo', {
          uri: employee.newPhoto.uri,
          type: 'image/jpeg',
          name: 'employee-photo.jpg',
        });
      }

      const result = await employeesApi.updateEmployee(token, id, formData);
      setEmployees(employees.map(emp =>
        emp.id === id ? result.employee : emp
      ));
      setEditingId(null);
      Alert.alert(t('common.success'), t('employeeManager.updated'));
    } catch (error) {
      console.error('Error updating employee:', error);
      Alert.alert(t('common.error'), t('employeeManager.updateError'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEmployee = (id) => {
    Alert.alert(
      t('employeeManager.deleteEmployee'),
      t('employeeManager.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await employeesApi.deleteEmployee(token, id);
              setEmployees(employees.filter(emp => emp.id !== id));
              Alert.alert(t('common.success'), t('employeeManager.deleted'));
            } catch (error) {
              console.error('Error deleting employee:', error);
              Alert.alert(t('common.error'), t('employeeManager.deleteError'));
            }
          },
        },
      ]
    );
  };

  const saveOrder = async () => {
    const employeeIds = employees.map(emp => emp.id);

    try {
      await employeesApi.reorderEmployees(token, employeeIds);
      setHasOrderChanges(false);
      setIsReordering(false);
      Alert.alert(t('common.success'), t('employeeManager.orderSaved'));
    } catch (error) {
      console.error(t('employeeManager.saveOrderError'), error);
      Alert.alert(t('common.error'), t('employeeManager.saveOrderError'));
    }
  };

  const handleDragEnd = ({ data }) => {
    setEmployees(data);
    setHasOrderChanges(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderEmployeeItem = ({ item, drag, isActive, getIndex }) => {
    const isEditing = editingId === item.id;

    return (
      <View style={[styles.employeeCard, isActive && styles.employeeCardDragging]}>
        {isEditing ? (
          // Edit Mode
          <View style={styles.editContainer}>
            {/* Photo Section */}
            <TouchableOpacity
              style={styles.photoUploadButton}
              onPress={() => showImageSourcePicker(item.id)}
            >
              {item.newPhoto || item.photo_url ? (
                <Image
                  source={{
                    uri: item.newPhoto
                      ? item.newPhoto.uri
                      : `${API_BASE}${item.photo_url}`,
                  }}
                  style={styles.employeePhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Camera size={32} color={COLORS.textLight} />
                </View>
              )}
            </TouchableOpacity>

            {/* Form Fields */}
            <View style={styles.formFields}>
              <View style={styles.row}>
                <View style={styles.field}>
                  <Text style={styles.label}>{t('employeeManager.name')} *</Text>
                  <TextInput
                    style={styles.input}
                    value={item.name}
                    onChangeText={(text) =>
                      setEmployees(employees.map(emp =>
                        emp.id === item.id ? { ...emp, name: text } : emp
                      ))
                    }
                    placeholder={t('employeeManager.namePlaceholder')}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>{t('employeeManager.position')} *</Text>
                  <TextInput
                    style={styles.input}
                    value={item.position}
                    onChangeText={(text) =>
                      setEmployees(employees.map(emp =>
                        emp.id === item.id ? { ...emp, position: text } : emp
                      ))
                    }
                    placeholder={t('employeeManager.positionPlaceholder')}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.field}>
                  <Text style={styles.label}>{t('employeeManager.email')}</Text>
                  <TextInput
                    style={styles.input}
                    value={item.email || ''}
                    onChangeText={(text) =>
                      setEmployees(employees.map(emp =>
                        emp.id === item.id ? { ...emp, email: text } : emp
                      ))
                    }
                    placeholder={t('employeeManager.emailPlaceholder')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>{t('employeeManager.phone')}</Text>
                  <TextInput
                    style={styles.input}
                    value={item.phone || ''}
                    onChangeText={(text) =>
                      setEmployees(employees.map(emp =>
                        emp.id === item.id ? { ...emp, phone: text } : emp
                      ))
                    }
                    placeholder={t('employeeManager.phonePlaceholder')}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.fullField}>
                <Text style={styles.label}>{t('employeeManager.bio')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={item.bio || ''}
                  onChangeText={(text) =>
                    setEmployees(employees.map(emp =>
                      emp.id === item.id ? { ...emp, bio: text } : emp
                    ))
                  }
                  placeholder={t('employeeManager.bioPlaceholder')}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => handleUpdateEmployee(item.id)}
                  disabled={uploading}
                >
                  <Save size={16} color={COLORS.white} />
                  <Text style={styles.saveButtonText}>
                    {uploading ? t('employeeManager.adding') : t('employeeManager.save')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditingId(null);
                    loadEmployees();
                  }}
                >
                  <X size={16} color={COLORS.white} />
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          // View Mode
          <View style={styles.viewContainer}>
            {/* Photo */}
            <View style={styles.photoSection}>
              {item.photo_url ? (
                <Image
                  source={{ uri: `${API_BASE}${item.photo_url}` }}
                  style={styles.employeePhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <User size={40} color={COLORS.textLight} />
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.infoSection}>
              <View style={styles.nameRow}>
                <View style={styles.nameContainer}>
                  <Text style={styles.employeeName}>{item.name}</Text>
                  <Text style={styles.employeePosition}>{item.position}</Text>
                </View>
                {!isReordering && (
                  <View style={styles.iconButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setEditingId(item.id)}
                    >
                      <Edit2 size={18} color={COLORS.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEmployee(item.id)}
                    >
                      <Trash2 size={18} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {item.bio && (
                <Text style={styles.bio} numberOfLines={2}>
                  {item.bio}
                </Text>
              )}

              <View style={styles.contactInfo}>
                {item.email && (
                  <View style={styles.contactItem}>
                    <Mail size={14} color={COLORS.textLight} />
                    <Text style={styles.contactText}>{item.email}</Text>
                  </View>
                )}
                {item.phone && (
                  <View style={styles.contactItem}>
                    <Phone size={14} color={COLORS.textLight} />
                    <Text style={styles.contactText}>{item.phone}</Text>
                  </View>
                )}
                {item.joined_date && (
                  <View style={styles.contactItem}>
                    <Calendar size={14} color={COLORS.textLight} />
                    <Text style={styles.contactText}>
                      Joined {formatDate(item.joined_date)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Drag Handle */}
            {isReordering && (
              <TouchableOpacity
                style={styles.dragHandle}
                onLongPress={drag}
                disabled={isActive}
              >
                <GripVertical size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.loadingText}>Loading employees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('employeeManager.title')}</Text>
        <View style={styles.headerButtons}>
          {isReordering ? (
            <>
              {hasOrderChanges && (
                <TouchableOpacity
                  style={styles.saveOrderButton}
                  onPress={saveOrder}
                >
                  <Save size={16} color={COLORS.white} />
                  <Text style={styles.saveOrderText}>{t('employeeManager.save')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.cancelOrderButton}
                onPress={() => {
                  setIsReordering(false);
                  setHasOrderChanges(false);
                  loadEmployees();
                }}
              >
                <Text style={styles.cancelOrderText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.reorderButton}
                onPress={() => setIsReordering(true)}
              >
                <GripVertical size={16} color={COLORS.text} />
                <Text style={styles.reorderButtonText}>{t('employeeManager.reorder')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAddingNew(true)}
              >
                <Plus size={20} color={COLORS.white} />
                <Text style={styles.addButtonText}>{t('employeeManager.add')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Add New Employee Form */}
      {isAddingNew && (
        <ScrollView style={styles.addForm}>
          <Text style={styles.formTitle}>Add New Team Member</Text>

          {/* Photo Upload */}
          <TouchableOpacity
            style={styles.photoUploadButton}
            onPress={() => showImageSourcePicker()}
          >
            {newEmployee.photo ? (
              <Image
                source={{ uri: newEmployee.photo.uri }}
                style={styles.employeePhoto}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={32} color={COLORS.textLight} />
                <Text style={styles.uploadPhotoText}>Tap to upload photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.formFields}>
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newEmployee.name}
                  onChangeText={(text) =>
                    setNewEmployee({ ...newEmployee, name: text })
                  }
                  placeholder={t('employeeManager.namePlaceholder')}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Position *</Text>
                <TextInput
                  style={styles.input}
                  value={newEmployee.position}
                  onChangeText={(text) =>
                    setNewEmployee({ ...newEmployee, position: text })
                  }
                  placeholder={t('employeeManager.positionPlaceholder')}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={newEmployee.email}
                  onChangeText={(text) =>
                    setNewEmployee({ ...newEmployee, email: text })
                  }
                  placeholder={t('employeeManager.emailPlaceholder')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={newEmployee.phone}
                  onChangeText={(text) =>
                    setNewEmployee({ ...newEmployee, phone: text })
                  }
                  placeholder={t('employeeManager.phonePlaceholder')}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.fullField}>
              <Text style={styles.label}>Joined Date</Text>
              <TextInput
                style={styles.input}
                value={newEmployee.joined_date}
                onChangeText={(text) =>
                  setNewEmployee({ ...newEmployee, joined_date: text })
                }
                placeholder={t('employeeManager.datePlaceholder')}
              />
            </View>

            <View style={styles.fullField}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newEmployee.bio}
                onChangeText={(text) =>
                  setNewEmployee({ ...newEmployee, bio: text })
                }
                placeholder={t('employeeManager.bioPlaceholder')}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddEmployee}
                disabled={uploading}
              >
                <Plus size={16} color={COLORS.white} />
                <Text style={styles.saveButtonText}>
                  {uploading ? t('employeeManager.adding') : t('employeeManager.addEmployee')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsAddingNew(false);
                  setNewEmployee({
                    name: '',
                    position: '',
                    bio: '',
                    email: '',
                    phone: '',
                    joined_date: '',
                    photo: null,
                  });
                }}
              >
                <X size={16} color={COLORS.white} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Employee List */}
      <FlatList
        data={employees}
        renderItem={renderEmployeeItem}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadEmployees();
            }}
            tintColor={COLORS.blue}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No employees yet</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => setIsAddingNew(true)}
            >
              <Text style={styles.addFirstButtonText}>Add First Employee</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING[3],
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[4],
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.gray200,
    borderRadius: RADIUS.lg,
  },
  reorderButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.blue,
    borderRadius: RADIUS.lg,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  saveOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.lg,
  },
  saveOrderText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  cancelOrderButton: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.gray500,
    borderRadius: RADIUS.lg,
  },
  cancelOrderText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  addForm: {
    backgroundColor: COLORS.gray100,
    padding: SPACING[4],
  },
  formTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[4],
  },
  photoUploadButton: {
    alignSelf: 'center',
    marginBottom: SPACING[4],
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPhotoText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
  employeePhoto: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.lg,
  },
  formFields: {
    gap: SPACING[3],
  },
  row: {
    flexDirection: 'row',
    gap: SPACING[3],
  },
  field: {
    flex: 1,
  },
  fullField: {
    width: '100%',
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginTop: SPACING[2],
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.blue,
    borderRadius: RADIUS.lg,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.gray500,
    borderRadius: RADIUS.lg,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING[2],
    paddingBottom: SPACING[20],
  },
  employeeCard: {
    backgroundColor: COLORS.white,
    margin: SPACING[2],
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    ...SHADOWS.sm,
  },
  employeeCardDragging: {
    ...SHADOWS.xl,
    opacity: 0.8,
  },
  editContainer: {
    gap: SPACING[3],
  },
  viewContainer: {
    flexDirection: 'row',
    gap: SPACING[3],
  },
  photoSection: {
    flexShrink: 0,
  },
  infoSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[2],
  },
  nameContainer: {
    flex: 1,
  },
  employeeName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  employeePosition: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
  iconButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginRight: -SPACING[2], // Shift buttons to align with card edge
  },
  editButton: {
    padding: SPACING[2],
    backgroundColor: COLORS.blue + '10',
    borderRadius: RADIUS.base,
  },
  deleteButton: {
    padding: SPACING[2],
    backgroundColor: COLORS.error + '10',
    borderRadius: RADIUS.base,
  },
  bio: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMedium,
    marginBottom: SPACING[2],
  },
  contactInfo: {
    gap: SPACING[2],
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  contactText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  dragHandle: {
    padding: SPACING[2],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING[12],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textMedium,
    marginTop: SPACING[3],
  },
  addFirstButton: {
    marginTop: SPACING[4],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.blue,
    borderRadius: RADIUS.lg,
  },
  addFirstButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
});

export default EmployeeManagementScreen;
