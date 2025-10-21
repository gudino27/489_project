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
  Mail,
  MessageSquare,
  Send,
  Clock,
  X,
  RefreshCw,
  UserCheck,
} from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  getInvitations,
  sendInvitation,
  resendInvitation,
  cancelInvitation 
} from '../api/users';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';

const UserManagementScreen = () => {
  const { t, language } = useLanguage();
  const { token, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [creationMode, setCreationMode] = useState('manual');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'admin',
    phone: '',
    language: language || 'en',
    deliveryMethod: 'both',
  });

  const [editForm, setEditForm] = useState({
    email: '',
    full_name: '',
    role: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      Alert.alert(t('common.error'), t('userManagement.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const data = await getInvitations();
      setInvitations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]);
    }
  };

  const handleCreateUser = async () => {
    setError('');
    setSuccess('');

    if (creationMode === 'invite') {
      // Send invitation
      if (!newUser.email || !newUser.full_name) {
        setError('Email and full name are required for invitations');
        return;
      }

      try {
        await sendInvitation({
          email: newUser.email,
          phone: newUser.phone || null,
          full_name: newUser.full_name,
          role: newUser.role,
          language: newUser.language,
          deliveryMethod: newUser.deliveryMethod,
        });

        setSuccess('Invitation sent successfully');
        setNewUser({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          full_name: '',
          role: 'admin',
          phone: '',
          language: language || 'en',
          deliveryMethod: 'both',
        });
        setShowAddUser(false);
        fetchInvitations();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError(error.message || 'Failed to send invitation');
      }
      return;
    }

    // Manual user creation
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
        phone: '',
        language: language || 'en',
        deliveryMethod: 'both',
      });
      setShowAddUser(false);
      fetchInvitations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to send invitation');
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      await resendInvitation(invitationId);
      setSuccess('Invitation resent successfully');
      fetchInvitations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to resend invitation');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    Alert.alert('Cancel Invitation', 'Are you sure you want to cancel this invitation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelInvitation(invitationId);
            setSuccess('Invitation cancelled');
            fetchInvitations();
            setTimeout(() => setSuccess(''), 3000);
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel invitation');
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

  const getInvitationStatus = (invitation) => {
    if (invitation.status === 'completed') return { text: 'Completed', color: COLORS.success };
    if (invitation.status === 'expired') return { text: 'Expired', color: COLORS.danger };
    return { text: 'Pending', color: COLORS.warning };
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
    Alert.alert(t('userManagement.deactivateUser'), t('userManagement.deactivateConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('userManagement.deactivateUser'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(userId);
            setSuccess(t('userManagement.deactivated'));
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
          } catch (error) {
            Alert.alert(t('common.error'), t('userManagement.deactivateError'));
          }
        },
      },
    ]);
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
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              setCreationMode('manual');
              setShowAddUser(true);
            }}
          >
            <UserPlus size={18} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add User</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.tabActive]}
            onPress={() => setActiveTab('users')}
          >
            <Users size={18} color={activeTab === 'users' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
              Users ({users.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'invitations' && styles.tabActive]}
            onPress={() => setActiveTab('invitations')}
          >
            <Mail size={18} color={activeTab === 'invitations' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'invitations' && styles.tabTextActive]}>
              Invitations ({invitations.filter(inv => inv.status === 'pending').length})
            </Text>
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
        {activeTab === 'users' ? (
          // Users Tab
          users && users.length > 0 ? (
            users.map((user) => (
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
                        user.role === 'super_admin' && styles.roleBadgeSuperAdmin,
                      ]}
                    >
                      {user.role === 'super_admin' ? (
                        <Shield size={14} color={COLORS.white} />
                      ) : user.role === 'employee' ? (
                        <User size={14} color={COLORS.white} />
                      ) : (
                        <User size={14} color={COLORS.white} />
                      )}
                      <Text style={styles.roleBadgeText}>
                        {user.role === 'super_admin' ? 'Super Admin' : user.role === 'employee' ? 'Employee' : 'Admin'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Last Activity</Text>
                    <Text style={styles.metaValue}>{formatDate(user.last_activity)}</Text>
                  </View>
                </View>
              </ContentGlass>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Users size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateText}>No users found</Text>
            </View>
          )
        ) : (
          // Invitations Tab
          invitations && invitations.length > 0 ? (
            invitations.map((invitation) => {
              const status = getInvitationStatus(invitation);
              return (
                <ContentGlass key={invitation.id} style={styles.userCard}>
                  <View style={styles.userCardHeader}>
                    <View style={styles.userInfo}>
                      <View style={styles.userAvatar}>
                        <Mail size={24} color={COLORS.textSecondary} />
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{invitation.full_name}</Text>
                        <Text style={styles.userEmail}>{invitation.email}</Text>
                        {invitation.phone && (
                          <Text style={styles.userPhone}>{invitation.phone}</Text>
                        )}
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: status.color + '20' },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: status.color }]}>
                        {status.text}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.userCardMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Role</Text>
                      <View
                        style={[
                          styles.roleBadge,
                          invitation.role === 'super_admin' && styles.roleBadgeSuperAdmin,
                        ]}
                      >
                        {invitation.role === 'super_admin' ? (
                          <Shield size={14} color={COLORS.white} />
                        ) : invitation.role === 'employee' ? (
                          <User size={14} color={COLORS.white} />
                        ) : (
                          <User size={14} color={COLORS.white} />
                        )}
                        <Text style={styles.roleBadgeText}>
                          {invitation.role === 'super_admin' ? 'Super Admin' : invitation.role === 'employee' ? 'Employee' : 'Admin'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Created</Text>
                      <Text style={styles.metaValue}>{formatDate(invitation.created_at)}</Text>
                    </View>
                  </View>

                  {invitation.status === 'pending' && (
                    <View style={styles.invitationActions}>
                      <TouchableOpacity
                        style={styles.invitationActionButton}
                        onPress={() => handleResendInvitation(invitation.id)}
                      >
                        <RefreshCw size={16} color={COLORS.primary} />
                        <Text style={styles.invitationActionText}>Resend</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.invitationActionButton, styles.invitationCancelButton]}
                        onPress={() => handleCancelInvitation(invitation.id)}
                      >
                        <X size={16} color={COLORS.error} />
                        <Text style={[styles.invitationActionText, styles.invitationCancelText]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ContentGlass>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Mail size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateText}>No invitations found</Text>
            </View>
          )
        )}
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

              {/* Mode Toggle */}
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    creationMode === 'manual' && styles.modeButtonActive,
                  ]}
                  onPress={() => setCreationMode('manual')}
                >
                  <UserPlus size={16} color={creationMode === 'manual' ? COLORS.white : COLORS.primary} />
                  <Text
                    style={[
                      styles.modeButtonText,
                      creationMode === 'manual' && styles.modeButtonTextActive,
                    ]}
                  >
                    Manual Creation
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    creationMode === 'invite' && styles.modeButtonActive,
                  ]}
                  onPress={() => setCreationMode('invite')}
                >
                  <Send size={16} color={creationMode === 'invite' ? COLORS.white : COLORS.primary} />
                  <Text
                    style={[
                      styles.modeButtonText,
                      creationMode === 'invite' && styles.modeButtonTextActive,
                    ]}
                  >
                    Send Invitation
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                {/* Common Fields */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newUser.full_name}
                    onChangeText={(text) => setNewUser({ ...newUser, full_name: text })}
                    placeholder="Enter full name"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email *</Text>
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

                {creationMode === 'invite' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Phone *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={newUser.phone}
                      onChangeText={(text) => setNewUser({ ...newUser, phone: text })}
                      placeholder="Enter phone number"
                      placeholderTextColor={COLORS.textSecondary}
                      keyboardType="phone-pad"
                    />
                  </View>
                )}

                {creationMode === 'manual' && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Username *</Text>
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
                      <Text style={styles.formLabel}>Password *</Text>
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
                      <Text style={styles.formLabel}>Confirm Password *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={newUser.confirmPassword}
                        onChangeText={(text) => setNewUser({ ...newUser, confirmPassword: text })}
                        placeholder="Confirm password"
                        placeholderTextColor={COLORS.textSecondary}
                        secureTextEntry
                      />
                    </View>
                  </>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Role *</Text>
                  <View style={styles.roleSelector}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        newUser.role === 'employee' && styles.roleOptionActive,
                      ]}
                      onPress={() => setNewUser({ ...newUser, role: 'employee' })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          newUser.role === 'employee' && styles.roleOptionTextActive,
                        ]}
                      >
                        Employee
                      </Text>
                    </TouchableOpacity>
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

                {creationMode === 'invite' && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Delivery Method *</Text>
                      <View style={styles.deliverySelector}>
                        <TouchableOpacity
                          style={[
                            styles.deliveryOption,
                            newUser.deliveryMethod === 'email' && styles.deliveryOptionActive,
                          ]}
                          onPress={() => setNewUser({ ...newUser, deliveryMethod: 'email' })}
                        >
                          <Mail size={14} color={newUser.deliveryMethod === 'email' ? COLORS.white : COLORS.textSecondary} />
                          <Text
                            style={[
                              styles.deliveryOptionText,
                              newUser.deliveryMethod === 'email' && styles.deliveryOptionTextActive,
                            ]}
                          >
                            Email
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.deliveryOption,
                            newUser.deliveryMethod === 'sms' && styles.deliveryOptionActive,
                          ]}
                          onPress={() => setNewUser({ ...newUser, deliveryMethod: 'sms' })}
                        >
                          <MessageSquare size={14} color={newUser.deliveryMethod === 'sms' ? COLORS.white : COLORS.textSecondary} />
                          <Text
                            style={[
                              styles.deliveryOptionText,
                              newUser.deliveryMethod === 'sms' && styles.deliveryOptionTextActive,
                            ]}
                          >
                            SMS
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.deliveryOption,
                            newUser.deliveryMethod === 'both' && styles.deliveryOptionActive,
                          ]}
                          onPress={() => setNewUser({ ...newUser, deliveryMethod: 'both' })}
                        >
                          <Text
                            style={[
                              styles.deliveryOptionText,
                              newUser.deliveryMethod === 'both' && styles.deliveryOptionTextActive,
                            ]}
                          >
                            Both
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.infoBox}>
                      <AlertCircle size={16} color={COLORS.info} />
                      <Text style={styles.infoBoxText}>
                        User will receive a secure link to set up their account. Link expires in 7 days.
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowAddUser(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmitButton} onPress={handleCreateUser}>
                  <Text style={styles.modalSubmitButtonText}>
                    {creationMode === 'manual' ? 'Create User' : 'Send Invitation'}
                  </Text>
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
                        editForm.role === 'employee' && styles.roleOptionActive,
                      ]}
                      onPress={() => setEditForm({ ...editForm, role: 'employee' })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          editForm.role === 'employee' && styles.roleOptionTextActive,
                        ]}
                      >
                        Employee
                      </Text>
                    </TouchableOpacity>
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: SPACING[4],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[3],
    gap: SPACING[2],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modeToggle: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: SPACING[2],
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: COLORS.white,
  },
  deliverySelector: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  deliveryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[2],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: SPACING[1],
  },
  deliveryOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  deliveryOptionText: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  deliveryOptionTextActive: {
    color: COLORS.white,
  },
  infoBox: {
    flexDirection: 'row',
    gap: SPACING[2],
    padding: SPACING[3],
    backgroundColor: COLORS.info + '10',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.info + '30',
  },
  infoBoxText: {
    ...TYPOGRAPHY.xs,
    color: COLORS.info,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    ...TYPOGRAPHY.xs,
    fontWeight: '600',
  },
  userPhone: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginTop: SPACING[3],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  invitationActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '10',
    gap: SPACING[1],
  },
  invitationCancelButton: {
    backgroundColor: COLORS.error + '10',
  },
  invitationActionText: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  invitationCancelText: {
    color: COLORS.error,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[8],
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING[3],
  },
});

export default UserManagementScreen;
