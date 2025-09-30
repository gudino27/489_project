import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Phone,
  User,
  Settings,
  History,
  TestTube,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatDateTimePacific, formatTimePacific } from '../../utils/dateUtils';

const SmsRoutingManager = ({ token, API_BASE }) => {
  const [activeView, setActiveView] = useState('settings');
  const [smsSettings, setSmsSettings] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [newRecipient, setNewRecipient] = useState({
    message_type: 'design_submission',
    employee_id: '',
    phone_number: '',
    name: '',
    priority_order: 1
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchSmsSettings(),
      fetchRecipients(),
      fetchEmployees(),
      fetchHistory()
    ]);
  };

  const fetchSmsSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSmsSettings(data);
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
    }
  };

  const fetchRecipients = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/recipients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecipients(data);
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/employees?includeInactive=false`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/history?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const updateSmsSettings = async (messageType, settings) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/settings/${messageType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSuccess('SMS settings updated successfully');
        fetchSmsSettings();
      } else {
        setError('Failed to update SMS settings');
      }
    } catch (error) {
      setError('Error updating SMS settings');
    } finally {
      setLoading(false);
    }
  };

  const addRecipient = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/recipients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRecipient)
      });

      if (response.ok) {
        setSuccess('Recipient added successfully');
        setNewRecipient({
          message_type: 'design_submission',
          employee_id: '',
          phone_number: '',
          name: '',
          priority_order: 1
        });
        setShowAddForm(false);
        fetchRecipients();
      } else {
        setError('Failed to add recipient');
      }
    } catch (error) {
      setError('Error adding recipient');
    } finally {
      setLoading(false);
    }
  };

  const updateRecipient = async (id, data) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/recipients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setSuccess('Recipient updated successfully');
        setEditingRecipient(null);
        fetchRecipients();
      } else {
        setError('Failed to update recipient');
      }
    } catch (error) {
      setError('Error updating recipient');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recipient?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/recipients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Recipient deleted successfully');
        fetchRecipients();
      } else {
        setError('Failed to delete recipient');
      }
    } catch (error) {
      setError('Error deleting recipient');
    } finally {
      setLoading(false);
    }
  };

  const testSmsRouting = async (messageType) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/sms-routing/test/${messageType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: `Test SMS routing for ${messageType} - sent at ${formatTimePacific(new Date())}`
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSuccess(`Test SMS sent successfully to ${result.details.totalSent} recipient(s)`);
        fetchHistory();
      } else {
        setError(`Test SMS failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      setError('Error testing SMS routing');
    } finally {
      setLoading(false);
    }
  };

  const messageTypes = [
    { value: 'design_submission', label: 'Design Submissions', description: 'New kitchen/bathroom design requests' },
    { value: 'test_sms', label: 'Test SMS', description: 'SMS system testing' }
  ];

  const formatDate = (dateString) => {
    return formatDateTimePacific(dateString);
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="text-blue-600" size={24} />
            <span className="hidden sm:inline">SMS Routing Manager</span>
            <span className="sm:hidden">SMS Manager</span>
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Configure SMS message routing for different types of notifications</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
            <button onClick={clearMessages} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle size={16} />
            {success}
            <button onClick={clearMessages} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide">
            {[
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'recipients', label: 'Recipients', icon: User },
              { id: 'history', label: 'History', icon: History }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`flex items-center gap-2 px-3 py-3 sm:px-4 sm:py-2 border-b-2 font-medium text-sm transition-colors min-h-[44px] sm:min-h-auto flex-shrink-0 whitespace-nowrap ${
                  activeView === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden text-xs">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeView === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">SMS Routing Settings</h2>

            {messageTypes.map((messageType) => {
              const settings = smsSettings.find(s => s.message_type === messageType.value) || {
                is_enabled: true,
                routing_mode: 'single'
              };

              return (
                <div key={messageType.value} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{messageType.label}</h3>
                      <p className="text-gray-600">{messageType.description}</p>
                    </div>
                    <button
                      onClick={() => testSmsRouting(messageType.value)}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-3 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 min-h-[44px] sm:min-h-auto"
                    >
                      <TestTube size={16} />
                      Test
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={settings.is_enabled ? '1' : '0'}
                        onChange={(e) => updateSmsSettings(messageType.value, {
                          ...settings,
                          is_enabled: e.target.value === '1'
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">Enabled</option>
                        <option value="0">Disabled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Routing Mode
                      </label>
                      <select
                        value={settings.routing_mode}
                        onChange={(e) => updateSmsSettings(messageType.value, {
                          ...settings,
                          routing_mode: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="single">Single Recipient (First Priority)</option>
                        <option value="all">All Recipients</option>
                        <option value="rotation">Rotation (Not implemented)</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeView === 'recipients' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900">SMS Recipients</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] sm:min-h-auto justify-center sm:justify-start"
              >
                <Plus size={16} />
                Add Recipient
              </button>
            </div>

            {showAddForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Recipient</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Type
                    </label>
                    <select
                      value={newRecipient.message_type}
                      onChange={(e) => setNewRecipient({ ...newRecipient, message_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {messageTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee (Optional)
                    </label>
                    <select
                      value={newRecipient.employee_id}
                      onChange={(e) => {
                        const employeeId = e.target.value;
                        const employee = employees.find(emp => emp.id === parseInt(employeeId));
                        setNewRecipient({
                          ...newRecipient,
                          employee_id: employeeId,
                          name: employee ? employee.name : newRecipient.name,
                          phone_number: employee ? employee.phone || newRecipient.phone_number : newRecipient.phone_number
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Employee (Optional)</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newRecipient.name}
                      onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Recipient name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newRecipient.phone_number}
                      onChange={(e) => setNewRecipient({ ...newRecipient, phone_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1234567890"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Order
                    </label>
                    <input
                      type="number"
                      value={newRecipient.priority_order}
                      onChange={(e) => setNewRecipient({ ...newRecipient, priority_order: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                  <button
                    onClick={addRecipient}
                    disabled={loading || !newRecipient.name || !newRecipient.phone_number}
                    className="flex items-center gap-2 px-4 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 min-h-[44px] sm:min-h-auto justify-center"
                  >
                    <Save size={16} />
                    Add Recipient
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex items-center gap-2 px-4 py-3 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 min-h-[44px] sm:min-h-auto justify-center"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Recipients List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name & Message Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recipients.map((recipient) => (
                    <tr key={recipient.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{recipient.name}</div>
                          <div className="text-sm text-gray-500">
                            {messageTypes.find(t => t.value === recipient.message_type)?.label}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone size={16} className="mr-2 text-gray-400" />
                          {recipient.phone_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {recipient.employee_name || 'External'}
                        {recipient.position && (
                          <div className="text-xs text-gray-500">{recipient.position}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {recipient.priority_order}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          recipient.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {recipient.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingRecipient(recipient)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Edit recipient"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => deleteRecipient(recipient.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Delete recipient"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'history' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">SMS Routing History</h2>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message Preview
                      </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock size={16} className="mr-2 text-gray-400" />
                          {formatDate(entry.sent_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {messageTypes.find(t => t.value === entry.message_type)?.label || entry.message_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{entry.recipient_name}</div>
                          <div className="text-sm text-gray-500">{entry.recipient_phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.delivery_status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : entry.delivery_status === 'delivered'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.delivery_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {entry.message_content}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* Edit Recipient Modal */}
        {editingRecipient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Recipient</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editingRecipient.name}
                    onChange={(e) => setEditingRecipient({ ...editingRecipient, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editingRecipient.phone_number}
                    onChange={(e) => setEditingRecipient({ ...editingRecipient, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Order
                  </label>
                  <input
                    type="number"
                    value={editingRecipient.priority_order}
                    onChange={(e) => setEditingRecipient({ ...editingRecipient, priority_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editingRecipient.is_active ? '1' : '0'}
                    onChange={(e) => setEditingRecipient({ ...editingRecipient, is_active: e.target.value === '1' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 mt-6">
                <button
                  onClick={() => updateRecipient(editingRecipient.id, editingRecipient)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 min-h-[44px] sm:min-h-auto justify-center"
                >
                  <Save size={16} />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingRecipient(null)}
                  className="flex items-center gap-2 px-4 py-3 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 min-h-[44px] sm:min-h-auto justify-center"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmsRoutingManager;