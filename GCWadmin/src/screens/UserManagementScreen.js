import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  User,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, createUser, updateUser, deleteUser } from '../api/users';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';

const UserManagementScreen = () => {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'admin',
  });

  const [editForm, setEditForm] = useState({
    email: '',
    full_name: '',
    role: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setError('');
    setSuccess('');

    if (!newUser.username || !newUser.email || !newUser.password || !newUser.full_name) {
      setError('Please fill in all required fields');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await createUser({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
        role: newUser.role,
      });

      setSuccess('User created successfully');
      setNewUser({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        role: 'admin',
      });
      setShowAddUser(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      await updateUser(editingUser.id, {
        email: editForm.email,
        full_name: editForm.full_name,
        role: editForm.role,
      });

      setSuccess('User updated successfully');
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update user');
    }
  };

  const handleDeactivateUser = async (userId) => {
    Alert.alert('Deactivate User', 'Are you sure you want to deactivate this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(userId);
            setSuccess('User deactivated successfully');
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
          } catch (error) {
            Alert.alert('Error', 'Failed to deactivate user');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      email: user.email,
      full_name: user.full_name || '',
      role: user.role,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <Users size={24} color={COLORS.primary} />
            <Text style={styles.headerTitle}>User Management</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddUser(true)}>
            <UserPlus size={18} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add User</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error/Success Messages */}
      {error && (
        <View style={styles.errorMessage}>
          <AlertCircle size={16} color={COLORS.error} />
          <Text style={styles.errorMessageText}>{error}</Text>
        </View>
      )}

      {success && (
        <View style={styles.successMessage}>
          <Check size={16} color={COLORS.success} />
          <Text style={styles.successMessageText}>{success}</Text>
        </View>
      )}

      {/* Users List */}
      <ScrollView style={styles.content}>
        {users.map((user) => (
          <ContentGlass key={user.id} style={styles.userCard}>
            <View style={styles.userCardHeader}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <User size={24} color={COLORS.textSecondary} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.full_name || user.username}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(user)}
                >
                  <Edit2 size={18} color={COLORS.primary} />
                </TouchableOpacity>
                {user.is_active && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeactivateUser(user.id)}
                  >
                    <Trash2 size={18} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.userCardMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Role</Text>
                <View
                  style={[
                    styles.roleBadge,
                    user.role === 'super_admin'
                      ? styles.roleBadgeSuperAdmin
                      : styles.roleBadgeAdmin,
                  ]}
                >
                  {user.role === 'super_admin' && <Shield size={12} color="#9333EA" />}
                  <Text
                    style={[
                      styles.roleBadgeText,
                      user.role === 'super_admin'
                        ? styles.roleBadgeTextSuperAdmin
                        : styles.roleBadgeTextAdmin,
                    ]}
                  >
                    {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </Text>
                </View>
              </View>

              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    user.is_active ? styles.statusBadgeActive : styles.statusBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      user.is_active
                        ? styles.statusBadgeTextActive
                        : styles.statusBadgeTextInactive,
                    ]}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={[styles.metaItem, styles.metaItemFull]}>
                <Text style={styles.metaLabel}>Last Login</Text>
                <Text style={styles.metaValue}>{formatDate(user.last_login)}</Text>
              </View>
            </View>
          </ContentGlass>
        ))}
      </ScrollView>

      {/* Add User Modal */}
      {showAddUser && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddUser(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add New User</Text>

              <ScrollView style={styles.modalForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Username</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newUser.username}
                    onChangeText={(text) => setNewUser({ ...newUser, username: text })}
                    placeholder="Enter username"
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newUser.email}
                    onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                    placeholder="Enter email"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Full Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newUser.full_name}
                    onChangeText={(text) => setNewUser({ ...newUser, full_name: text })}
                    placeholder="Enter full name"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Password</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newUser.password}
                    onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                    placeholder="Enter password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newUser.confirmPassword}
                    onChangeText={(text) => setNewUser({ ...newUser, confirmPassword: text })}
                    placeholder="Confirm password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Role</Text>
                  <View style={styles.roleSelector}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        newUser.role === 'admin' && styles.roleOptionActive,
                      ]}
                      onPress={() => setNewUser({ ...newUser, role: 'admin' })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          newUser.role === 'admin' && styles.roleOptionTextActive,
                        ]}
                      >
                        Admin
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        newUser.role === 'super_admin' && styles.roleOptionActive,
                      ]}
                      onPress={() => setNewUser({ ...newUser, role: 'super_admin' })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          newUser.role === 'super_admin' && styles.roleOptionTextActive,
                        ]}
                      >
                        Super Admin
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowAddUser(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmitButton} onPress={handleCreateUser}>
                  <Text style={styles.modalSubmitButtonText}>Create User</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditingUser(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit User</Text>

              <ScrollView style={styles.modalForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Username</Text>
                  <TextInput
                    style={[styles.formInput, styles.formInputDisabled]}
                    value={editingUser.username}
                    editable={false}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.email}
                    onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                    placeholder="Enter email"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Full Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.full_name}
                    onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
                    placeholder="Enter full name"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Role</Text>
                  <View style={styles.roleSelector}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        editForm.role === 'admin' && styles.roleOptionActive,
                      ]}
                      onPress={() => setEditForm({ ...editForm, role: 'admin' })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          editForm.role === 'admin' && styles.roleOptionTextActive,
                        ]}
                      >
                        Admin
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        editForm.role === 'super_admin' && styles.roleOptionActive,
                      ]}
                      onPress={() => setEditForm({ ...editForm, role: 'super_admin' })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          editForm.role === 'super_admin' && styles.roleOptionTextActive,
                        ]}
                      >
                        Super Admin
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setEditingUser(null)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmitButton} onPress={handleUpdateUser}>
                  <Text style={styles.modalSubmitButtonText}>Update User</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING[4],
  },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: SPACING[5],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.md,
  },
  addButtonText: {
    ...TYPOGRAPHY.buttonMedium,
    color: COLORS.white,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[3],
    marginHorizontal: SPACING[5],
    marginTop: SPACING[4],
    backgroundColor: COLORS.error + '15',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    borderRadius: RADIUS.md,
  },
  errorMessageText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    flex: 1,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[3],
    marginHorizontal: SPACING[5],
    marginTop: SPACING[4],
    backgroundColor: COLORS.success + '15',
    borderWidth: 1,
    borderColor: COLORS.success + '40',
    borderRadius: RADIUS.md,
  },
  successMessageText: {
    ...TYPOGRAPHY.body,
    color: COLORS.success,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING[5],
  },
  userCard: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
    borderRadius: RADIUS.lg,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[4],
    paddingBottom: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: SPACING[3],
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '600',
  },
  userEmail: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: SPACING[1],
  },
  userActions: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginLeft: SPACING[3],
  },
  actionButton: {
    padding: SPACING[2],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[4],
  },
  metaItem: {
    flex: 0,
    minWidth: '45%',
  },
  metaItemFull: {
    minWidth: '100%',
  },
  metaLabel: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING[1],
  },
  metaValue: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  roleBadgeAdmin: {
    backgroundColor: COLORS.primary + '20',
  },
  roleBadgeSuperAdmin: {
    backgroundColor: '#9333EA20',
  },
  roleBadgeText: {
    ...TYPOGRAPHY.xs,
    fontWeight: '600',
  },
  roleBadgeTextAdmin: {
    color: COLORS.primary,
  },
  roleBadgeTextSuperAdmin: {
    color: '#9333EA',
  },
  statusBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  statusBadgeActive: {
    backgroundColor: COLORS.success + '20',
  },
  statusBadgeInactive: {
    backgroundColor: COLORS.error + '20',
  },
  statusBadgeText: {
    ...TYPOGRAPHY.xs,
    fontWeight: '600',
  },
  statusBadgeTextActive: {
    color: COLORS.success,
  },
  statusBadgeTextInactive: {
    color: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING[5],
    width: '100%',
    maxHeight: '90%',
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING[4],
  },
  modalForm: {
    marginBottom: SPACING[4],
  },
  formGroup: {
    marginBottom: SPACING[4],
  },
  formLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: SPACING[2],
  },
  formInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING[3],
  },
  formInputDisabled: {
    backgroundColor: COLORS.gray100,
    color: COLORS.textSecondary,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  roleOption: {
    flex: 1,
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  roleOptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  roleOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    ...TYPOGRAPHY.buttonMedium,
    color: COLORS.text,
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    ...TYPOGRAPHY.buttonMedium,
    color: COLORS.white,
  },
});

export default UserManagementScreen;
