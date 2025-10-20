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
  DollarSign
} from 'lucide-react';
import { formatDatePacific, formatDateTimePacific } from '../../utils/dateUtils';
import { useLanguage } from '../../contexts/LanguageContext';

const UserManagement = ({ token, API_BASE }) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [payrollInfo, setPayrollInfo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'admin'
  });

  const [payrollData, setPayrollData] = useState({
    employmentType: 'hourly',
    hourlyRate: '',
    overtimeRate: '',
    salary: '',
    payPeriodType: 'biweekly',
  });

  useEffect(() => {
    fetchUsers();
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
      setUsers(data);
    } catch (error) {
      setError('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      setNewUser({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        role: 'admin'
      });
      setShowAddUser(false);
      fetchUsers();
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

  const handleEditPayroll = async (user) => {
    setEditingPayroll(user);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/timeclock/admin/payroll-info/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.payrollInfo) {
        setPayrollData({
          employmentType: data.payrollInfo.employment_type || 'hourly',
          hourlyRate: data.payrollInfo.hourly_rate || '',
          overtimeRate: data.payrollInfo.overtime_rate || '',
          salary: data.payrollInfo.salary || '',
          payPeriodType: data.payrollInfo.pay_period_type || 'biweekly',
        });
      } else {
        // No existing payroll info, use defaults
        setPayrollData({
          employmentType: 'hourly',
          hourlyRate: '',
          overtimeRate: '',
          salary: '',
          payPeriodType: 'biweekly',
        });
      }
    } catch (error) {
      console.error('Error fetching payroll info:', error);
      setError('Failed to load payroll info');
    }
  };

  const handleSavePayroll = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingPayroll) return;

    try {
      const response = await fetch(`${API_BASE}/api/timeclock/admin/payroll-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: editingPayroll.id,
          employmentType: payrollData.employmentType,
          hourlyRate: payrollData.hourlyRate ? parseFloat(payrollData.hourlyRate) : null,
          overtimeRate: payrollData.overtimeRate ? parseFloat(payrollData.overtimeRate) : null,
          salary: payrollData.salary ? parseFloat(payrollData.salary) : null,
          payPeriodType: payrollData.payPeriodType,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save payroll info');
      }

      setSuccess('Payroll info saved successfully');
      setEditingPayroll(null);
      setPayrollData({
        employmentType: 'hourly',
        hourlyRate: '',
        overtimeRate: '',
        salary: '',
        payPeriodType: 'biweekly',
      });
    } catch (error) {
      setError(error.message);
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
    console.log('🕐 Formatting date:', dateString, '→', result);
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
          onClick={() => setShowAddUser(true)}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          style={{ minHeight: '44px' }}
        >
          <UserPlus size={18} />
          {t('userManagement.addNewUser')}
        </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{t('userManagement.addNewUser')}</h3>
            <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('userManagement.username')}</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('userManagement.email')}</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('userManagement.fullName')}</label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('userManagement.password')}</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('userManagement.confirmPassword')}</label>
                  <input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
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
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('userManagement.cancel')}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleCreateUser(e);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('userManagement.createUser')}
                </button>
              </div>
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
            {users.map((user) => (
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
                    {user.role === 'employee' && (
                      <button
                        onClick={() => handleEditPayroll(user)}
                        className="text-green-600 hover:text-green-900"
                        title="Manage payroll"
                      >
                        <DollarSign size={16} />
                      </button>
                    )}
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
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Users Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {users.map((user) => (
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
        ))}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{t('userManagement.editUser')}</h3>
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
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('userManagement.updateUser')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Info Modal */}
      {editingPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign size={24} className="text-green-600" />
              Payroll Info - {editingPayroll.full_name || editingPayroll.username}
            </h3>
            <form onSubmit={handleSavePayroll}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employment Type</label>
                  <select
                    value={payrollData.employmentType}
                    onChange={(e) => setPayrollData({ ...payrollData, employmentType: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  >
                    <option value="hourly">Hourly</option>
                    <option value="salary">Salary</option>
                  </select>
                </div>

                {payrollData.employmentType === 'hourly' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Hourly Rate ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={payrollData.hourlyRate}
                        onChange={(e) => setPayrollData({ ...payrollData, hourlyRate: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., 18.50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Overtime Rate ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={payrollData.overtimeRate}
                        onChange={(e) => setPayrollData({ ...payrollData, overtimeRate: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., 27.75 (1.5x rate)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave blank to auto-calculate as 1.5× hourly rate
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Annual Salary ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={payrollData.salary}
                      onChange={(e) => setPayrollData({ ...payrollData, salary: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., 50000"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Pay Period Type</label>
                  <select
                    value={payrollData.payPeriodType}
                    onChange={(e) => setPayrollData({ ...payrollData, payPeriodType: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-Weekly (Every 2 weeks)</option>
                    <option value="semimonthly">Semi-Monthly (Twice a month)</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2 text-blue-900">Summary</h4>
                  <div className="text-sm space-y-1 text-blue-800">
                    {payrollData.employmentType === 'hourly' ? (
                      <>
                        <p>Base Rate: ${payrollData.hourlyRate || '0.00'}/hour</p>
                        <p>
                          OT Rate: ${payrollData.overtimeRate || (parseFloat(payrollData.hourlyRate || 0) * 1.5).toFixed(2)}/hour
                        </p>
                        {payrollData.hourlyRate && (
                          <p className="font-semibold mt-2">
                            Est. Weekly: ${(parseFloat(payrollData.hourlyRate) * 40).toFixed(2)} (40 hrs)
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p>Annual Salary: ${payrollData.salary || '0.00'}</p>
                        {payrollData.salary && payrollData.payPeriodType && (
                          <p className="font-semibold mt-2">
                            Per Pay Period: ${(
                              parseFloat(payrollData.salary) /
                              (payrollData.payPeriodType === 'weekly' ? 52 :
                               payrollData.payPeriodType === 'biweekly' ? 26 :
                               payrollData.payPeriodType === 'semimonthly' ? 24 : 12)
                            ).toFixed(2)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPayroll(null);
                    setPayrollData({
                      employmentType: 'hourly',
                      hourlyRate: '',
                      overtimeRate: '',
                      salary: '',
                      payPeriodType: 'biweekly',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save Payroll Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
