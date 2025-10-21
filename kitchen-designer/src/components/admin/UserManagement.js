import React, { useState, useEffect } from 'react';
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
  UserCheck
} from 'lucide-react';
import { formatDatePacific, formatDateTimePacific } from '../../utils/dateUtils';
import { useLanguage } from '../../contexts/LanguageContext';

const UserManagement = ({ token, API_BASE }) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Invitation system state
  const [invitations, setInvitations] = useState([]);
  const [creationMode, setCreationMode] = useState('manual'); // 'manual' or 'invite'
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'invitations'

  const initialUserState = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'admin',
    phone: '',
    language: 'en',
    deliveryMethod: 'email'
  };

  const [newUser, setNewUser] = useState(initialUserState);

  const resetUserForm = () => {
    setNewUser(initialUserState);
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
  }, []);



  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      // Backend returns { success: true, users: [...] }
      setUsers(data.users || []);
    } catch (error) {
      setError('Failed to load users');
      setUsers([]);
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch invitations');

      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (creationMode === 'manual') {
      // Manual creation - validate passwords
      if (newUser.password !== newUser.confirmPassword) {
        setError(t('userManagement.passwordMismatch'));
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            username: newUser.username,
            email: newUser.email,
            password: newUser.password,
            full_name: newUser.full_name,
            role: newUser.role
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || t('userManagement.created'));
        }

        setSuccess(t('userManagement.created'));
        resetUserForm();
        setShowAddUser(false);
        fetchUsers();
      } catch (error) {
        setError(error.message);
      }
    } else {
      // Invitation mode
      handleSendInvitation(e);
    }
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!newUser.full_name || !newUser.role) {
      setError('Full name and role are required');
      return;
    }

    // Email and phone are always required
    if (!newUser.email || !newUser.email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!newUser.phone || !newUser.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/users/send-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newUser.email || null,
          phone: newUser.phone || null,
          full_name: newUser.full_name,
          role: newUser.role,
          language: newUser.language,
          deliveryMethod: newUser.deliveryMethod
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccess(`Invitation sent successfully via ${newUser.deliveryMethod}`);
      resetUserForm();
      setShowAddUser(false);
      fetchInvitations();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation');
      }

      setSuccess('Invitation resent successfully');
      fetchInvitations();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/users/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invitation');
      }

      setSuccess('Invitation cancelled successfully');
      fetchInvitations();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error(t('userManagement.updated'));

      setSuccess(t('userManagement.updated'));
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      setError('Failed to update user');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm(t('userManagement.deactivateConfirm'))) return;

    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(t('userManagement.deactivated'));

      setSuccess(t('userManagement.deactivated'));
      fetchUsers();
    } catch (error) {
      setError('Failed to deactivate user');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('userManagement.never');
    const result = formatDateTimePacific(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return result;
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('userManagement.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
          <Users className="text-blue-600" />
          {t('userManagement.title')}
        </h2>
        <button
          onClick={() => {
            resetUserForm();
            setCreationMode('manual');
            setShowAddUser(true);
          }}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          style={{ minHeight: '44px' }}
        >
          <UserPlus size={18} />
          {t('userManagement.addNewUser')}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users size={18} />
              Active Users ({users.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'invitations'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Mail size={18} />
              Pending Invitations ({invitations.filter(inv => !inv.used_at).length})
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <Check size={18} />
          {success}
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto h-half">
          <div key={`modal-${creationMode}`} className="bg-white rounded-lg p-2 sm:my-2 max-w-md overflow-y-auto" style={{height: '80vh', width: '100%' }}>
            <div className="p-2 sm:p-2 border-b border-gray-100">
              <h3 className="text-lg sm:text-xl font-bold">{t('userManagement.addNewUser')}</h3>
            </div>
            <div className="p-2 sm:p-6 overflow-y-auto flex-1">
            {/* Mode Toggle */}
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <label className="block text-xs sm:text-sm font-medium mb-1.5">Creation Mode</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetUserForm();
                    setCreationMode('manual');
                  }}
                  className={`flex-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    creationMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    <UserCheck size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Manual Creation</span>
                    <span className="sm:hidden">Manual</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetUserForm();
                    setCreationMode('invite');
                  }}
                  className={`flex-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    creationMode === 'invite'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    <Send size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Send Invitation</span>
                    <span className="sm:hidden">Invite</span>
                  </span>
                </button>
              </div>
            </div>

            <div>
              <div className="space-y-1">
                {creationMode === 'manual' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('userManagement.username')}</label>
                      <input
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('userManagement.email')}</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('userManagement.fullName')}</label>
                      <input
                        type="text"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('userManagement.password')}</label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('userManagement.confirmPassword')}</label>
                      <input
                        type="password"
                        value={newUser.confirmPassword}
                        onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('userManagement.role')}</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="employee">{t('userManagement.employee')}</option>
                        <option value="admin">{t('userManagement.admin')}</option>
                        <option value="super_admin">{t('userManagement.superAdmin')}</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('userManagement.fullName')} *</label>
                      <input
                        type="text"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('userManagement.role')} *</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="employee">{t('userManagement.employee')}</option>
                        <option value="admin">{t('userManagement.admin')}</option>
                        <option value="super_admin">{t('userManagement.superAdmin')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('userManagement.email')} *</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                        autoComplete="off"
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="+1234567890"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Delivery Method *</label>
                      <select
                        value={newUser.deliveryMethod}
                        onChange={(e) => setNewUser({ ...newUser, deliveryMethod: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="email">Email Only</option>
                        <option value="sms">SMS Only</option>
                        <option value="both">Both Email & SMS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Language</label>
                      <select
                        value={newUser.language}
                        onChange={(e) => setNewUser({ ...newUser, language: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> The recipient will receive a secure link valid for 7 days. 
                        They can choose their own username and password.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  resetUserForm();
                  setShowAddUser(false);
                  setCreationMode('manual');
                }}
                className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('userManagement.cancel')}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleCreateUser(e);
                }}
                className="w-full sm:flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                {creationMode === 'manual' ? (
                  <>
                    <UserCheck size={16} />
                    {t('userManagement.createUser')}
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('userManagement.user')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('userManagement.role')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('userManagement.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('userManagement.lastLogin')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('userManagement.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users && users.length > 0 ? users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.full_name || user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'super_admin'
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'employee'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                    }`}>
                    {user.role === 'super_admin' && <Shield size={12} />}
                    {user.role === 'super_admin' 
                      ? t('userManagement.superAdmin') 
                      : user.role === 'employee'
                      ? t('userManagement.employee')
                      : t('userManagement.admin')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                    }`}>
                    {user.is_active ? t('userManagement.active') : t('userManagement.inactive')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.last_login)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit user"
                    >
                      <Edit2 size={16} />
                    </button>
                    {user.is_active && (
                      <button
                        onClick={() => handleDeactivateUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Deactivate user"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Active Users Tab Content */}
      {activeTab === 'users' && (
        <>
          {/* Users Cards - Mobile */}
          <div className="lg:hidden space-y-4">
            {users && users.length > 0 ? users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center flex-1">
                <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={24} className="text-gray-600" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{user.full_name || user.username}</div>
                  <div className="text-sm text-gray-500 truncate">{user.email}</div>
                </div>
              </div>
              <div className="flex gap-2 ml-3">
                <button
                  onClick={() => setEditingUser(user)}
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                  title="Edit user"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <Edit2 size={18} />
                </button>
                {user.is_active && (
                  <button
                    onClick={() => handleDeactivateUser(user.id)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                    title="Deactivate user"
                    style={{ minHeight: '44px', minWidth: '44px' }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
              <div>
                <div className="text-xs text-gray-500 mb-1">Role</div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'super_admin'
                    ? 'bg-purple-100 text-purple-800'
                    : user.role === 'employee'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                  }`}>
                  {user.role === 'super_admin' && <Shield size={12} />}
                  {user.role === 'super_admin' 
                    ? 'Super Admin' 
                    : user.role === 'employee'
                    ? 'Employee'
                    : 'Admin'}
                </span>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                  }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="col-span-2">
                <div className="text-xs text-gray-500 mb-1">Last Login</div>
                <div className="text-sm text-gray-700">{formatDate(user.last_login)}</div>
              </div>
            </div>
          </div>
            )) : (
              <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
                No users found
              </div>
            )}
          </div>
        </>
      )}

      {/* Pending Invitations Tab Content */}
      {activeTab === 'invitations' && (
        <>
          {/* Invitations Table - Desktop */}
          <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitations && invitations.length > 0 ? invitations.map((invitation) => {
                    const isExpired = new Date(invitation.expires_at) < new Date();
                    const isUsed = !!invitation.used_at;
                    const isPending = !isUsed && !isExpired;

                    return (
                      <tr key={invitation.id} className={isUsed || isExpired ? 'bg-gray-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{invitation.full_name}</div>
                            <div className="text-sm text-gray-500">
                              {invitation.email && <div className="flex items-center gap-1"><Mail size={12} /> {invitation.email}</div>}
                              {invitation.phone && <div className="flex items-center gap-1"><MessageSquare size={12} /> {invitation.phone}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invitation.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800'
                              : invitation.role === 'employee'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {invitation.role === 'super_admin' && <Shield size={12} />}
                            {invitation.role === 'super_admin' 
                              ? 'Super Admin' 
                              : invitation.role === 'employee'
                              ? 'Employee'
                              : 'Admin'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invitation.email && invitation.phone ? 'Email & SMS' : invitation.email ? 'Email' : 'SMS'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isUsed ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Completed
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Expired
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
                              <Clock size={12} />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invitation.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {isPending && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleResendInvitation(invitation.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Resend invitation"
                              >
                                <RefreshCw size={16} />
                              </button>
                              <button
                                onClick={() => handleCancelInvitation(invitation.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel invitation"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No invitations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invitations Cards - Mobile */}
          <div className="lg:hidden space-y-4">
            {invitations && invitations.length > 0 ? invitations.map((invitation) => {
              const isExpired = new Date(invitation.expires_at) < new Date();
              const isUsed = !!invitation.used_at;
              const isPending = !isUsed && !isExpired;

              return (
                <div key={invitation.id} className={`bg-white rounded-lg shadow p-4 ${isUsed || isExpired ? 'opacity-75' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{invitation.full_name}</div>
                      <div className="text-sm text-gray-500 mt-1 space-y-1">
                        {invitation.email && (
                          <div className="flex items-center gap-1">
                            <Mail size={12} /> {invitation.email}
                          </div>
                        )}
                        {invitation.phone && (
                          <div className="flex items-center gap-1">
                            <MessageSquare size={12} /> {invitation.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    {isPending && (
                      <div className="flex gap-2 ml-3">
                        <button
                          onClick={() => handleResendInvitation(invitation.id)}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                          title="Resend"
                          style={{ minHeight: '44px', minWidth: '44px' }}
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                          title="Cancel"
                          style={{ minHeight: '44px', minWidth: '44px' }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Role</div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invitation.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-800'
                          : invitation.role === 'employee'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {invitation.role === 'super_admin' && <Shield size={12} />}
                        {invitation.role === 'super_admin' 
                          ? 'Super Admin' 
                          : invitation.role === 'employee'
                          ? 'Employee'
                          : 'Admin'}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      {isUsed ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      ) : isExpired ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
                          <Clock size={12} />
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="col-span-2">
                      <div className="text-xs text-gray-500 mb-1">Created</div>
                      <div className="text-sm text-gray-700">{formatDate(invitation.created_at)}</div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
                No invitations found
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md my-8 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-4">{t('userManagement.editUser')}</h3>
            <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('userManagement.username')}</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    disabled
                    className="w-full p-2 border rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('userManagement.email')}</label>
                  <input
                    type="email"
                    id="edit-email"
                    defaultValue={editingUser.email}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('userManagement.fullName')}</label>
                  <input
                    type="text"
                    id="edit-fullname"
                    defaultValue={editingUser.full_name}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('userManagement.role')}</label>
                  <select
                    id="edit-role"
                    defaultValue={editingUser.role}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="employee">{t('userManagement.employee')}</option>
                    <option value="admin">{t('userManagement.admin')}</option>
                    <option value="super_admin">{t('userManagement.superAdmin')}</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('userManagement.cancel')}
                </button>
                <button
                  onClick={() => {
                    const email = document.getElementById('edit-email').value;
                    const full_name = document.getElementById('edit-fullname').value;
                    const role = document.getElementById('edit-role').value;
                    handleUpdateUser(editingUser.id, { email, full_name, role });
                  }}
                  className="w-full sm:flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('userManagement.updateUser')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
