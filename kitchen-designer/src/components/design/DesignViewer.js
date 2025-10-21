import React, { useState, useEffect } from 'react';
import {
  FileText,
  Eye,
  Download,
  Phone,
  Mail,
  Home,
  Bath,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Trash2,
  Settings
} from 'lucide-react';
import DesignPreview from './DesignPreview';
import sessionManager from '../utils/sessionManager';
import { useLanguage } from '../../contexts/LanguageContext';

const DesignViewer = ({ token, API_BASE, userRole }) => {
  const { t } = useLanguage();
  const [designs, setDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, new, viewed
  const [stats, setStats] = useState({
    totalDesigns: 0,
    statusBreakdown: { pending: 0, new: 0, viewed: 0 },
    totalRevenue: 0, averageOrderValue: 0, recentDesigns: 0
  });

  // New state for enhanced functionality
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Notification settings state (super admin only)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    notificationType: 'email',
    adminEmail: '',
    adminPhone: ''
  });
  const [selectedDesigns, setSelectedDesigns] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteValues, setNoteValues] = useState({});
  const [statusChanging, setStatusChanging] = useState(null);

  // API_BASE now comes from props

  // Add the auth headers helper function
  const getAuthHeaders = () => {
    const session = sessionManager.initSession();
    const token = session ? session.token : null;
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  useEffect(() => {
    loadDesigns();
    loadStats();
    fetchNotificationSettings();
  }, [filter]);

  // Fetch notification settings (super admin only)
  const fetchNotificationSettings = async () => {
    if (userRole !== 'super_admin' || !API_BASE || !token) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/design-notification-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(data);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  // Update notification settings
  const updateNotificationSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/design-notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notificationType: notificationSettings.notificationType })
      });

      if (response.ok) {
        setShowSettingsModal(false);
        alert('Design notification settings updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update settings: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Updated loadDesigns with auth headers
  const loadDesigns = async () => {
    setLoading(true);
    try {
      const url = filter === 'all'
        ? `${API_BASE}/api/designs`
        : `${API_BASE}/api/designs?status=${filter}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setDesigns(data);
      } else if (response.status === 401) {
        // Handle unauthorized access
        console.error('Unauthorized access - please log in again');
        // You might want to redirect to login here
      }
    } catch (error) {
      console.error('Error loading designs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Updated loadStats with auth headers
  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/designs/stats`, {
      });

      if (response.ok) {
        const data = await response.json();
        //console.log('Stats data received:', data);
        setStats(data);
      } else if (response.status === 401) {
        console.error('Unauthorized access to stats');
      }
      else {
        console.error('Failed to fetch stats:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Updated viewDesign with auth headers
  const viewDesign = async (designId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/designs/${designId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedDesign(data);
        // Reload designs to update status
        loadDesigns();
        loadStats();
      } else if (response.status === 401) {
        console.error('Unauthorized access to design details');
      }
    } catch (error) {
      console.error('Error loading design:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (designId, clientName) => {
    try {
      // Get the auth token from sessionManager
      const session = sessionManager.initSession();
      const token = session ? session.token : null;

      const response = await fetch(`${API_BASE}/api/designs/${designId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `design-${clientName.replace(/\s+/g, '-')}-${designId}.pdf`;

      // Append to body, click, and remove
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please make sure you are logged in.');
    }
  };

  // Updated deleteDesign with auth headers
  const deleteDesign = async (designId) => {
    if (!window.confirm(t('designViewer.deleteConfirm'))) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/designs/${designId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Remove from local state
        setDesigns(designs.filter(d => d.id !== designId));
        // Reload stats
        loadStats();
        // Close detail view if it's the deleted design
        if (selectedDesign && selectedDesign.id === designId) {
          setSelectedDesign(null);
        }
      } else if (response.status === 401) {
        alert('Unauthorized - please log in again');
      } else {
        alert('Failed to delete design');
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      alert('Error deleting design');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    });
  };

  const getContactIcon = (preference) => {
    switch (preference) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'text': return <MessageSquare className="w-4 h-4" />;
      default: return null;
    }
  };
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';

    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Check if it's a valid US phone number (10 digits)
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)})-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // If it's 11 digits and starts with 1, format as +1 (xxx)-xxx-xxxx
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)})-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    // If it doesn't match expected patterns, return as-is
    return phoneNumber;
  };

  // Sorting functionality
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedDesigns = () => {
    const sortableDesigns = [...designs];
    if (sortConfig.key) {
      sortableDesigns.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle special cases
        if (sortConfig.key === 'total_price') {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
        } else if (sortConfig.key === 'created_at') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableDesigns;
  };

  // Bulk delete functionality
  const toggleDesignSelection = (designId) => {
    const newSelected = new Set(selectedDesigns);
    if (newSelected.has(designId)) {
      newSelected.delete(designId);
    } else {
      newSelected.add(designId);
    }
    setSelectedDesigns(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDesigns.size === designs.length) {
      setSelectedDesigns(new Set());
    } else {
      setSelectedDesigns(new Set(designs.map(d => d.id)));
    }
  };

  const bulkDeleteDesigns = async () => {
    if (selectedDesigns.size === 0) return;

    if (!window.confirm(`${t('designViewer.bulkDeleteConfirm')} ${selectedDesigns.size} ${t('designViewer.bulkDeleteConfirmEnd')}`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const deletePromises = Array.from(selectedDesigns).map(designId =>
        fetch(`${API_BASE}/api/designs/${designId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })
      );

      await Promise.all(deletePromises);

      // Remove deleted designs from local state
      setDesigns(designs.filter(d => !selectedDesigns.has(d.id)));
      setSelectedDesigns(new Set());

      // Reload stats
      loadStats();

      // Close detail view if it's one of the deleted designs
      if (selectedDesign && selectedDesigns.has(selectedDesign.id)) {
        setSelectedDesign(null);
      }
    } catch (error) {
      console.error('Error bulk deleting designs:', error);
      alert('Error deleting some designs. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Quick note functionality
  const saveNote = async (designId, note) => {
    try {
      const response = await fetch(`${API_BASE}/api/designs/${designId}/note`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ note })
      });

      if (response.ok) {
        // Update local state
        setDesigns(designs.map(d =>
          d.id === designId ? { ...d, admin_note: note } : d
        ));
        setEditingNote(null);
        setNoteValues({ ...noteValues, [designId]: note });
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  };

  // Status change functionality
  const changeStatus = async (designId, newStatus) => {
    //console.log('Changing status for design:', designId, 'to:', newStatus);
    setStatusChanging(designId);
    try {
      const headers = getAuthHeaders();
      //console.log('Request headers:', headers);

      const response = await fetch(`${API_BASE}/api/designs/${designId}/status`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ status: newStatus })
      });

      //console.log('Response status:', response.status);

      if (response.ok) {
        //console.log('Status update successful');
        // Update local state
        setDesigns(designs.map(d =>
          d.id === designId ? { ...d, status: newStatus } : d
        ));
        loadStats(); // Refresh stats
      } else {
        const errorText = await response.text();
        console.error('Status update failed:', response.status, errorText);
        alert(`Failed to change status: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Failed to change status');
    } finally {
      setStatusChanging(null);
    }
  };

  // Keyboard shortcuts - moved after function declarations
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle shortcuts when no modal is open and not typing in input
      if (selectedDesign || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.key === 'Delete' && selectedDesigns.size > 0) {
        event.preventDefault();
        bulkDeleteDesigns();
      }

      if (event.key === 'Escape') {
        setSelectedDesigns(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedDesigns, selectedDesign]);

  return (
    <div className="p-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Designs - Always show if data exists */}
        {typeof stats.totalDesigns === 'number' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('designViewer.totalDesigns')}</p>
                <p className="text-2xl font-bold">{stats.totalDesigns}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        )}

        {/* New Designs - Only show if there are new designs */}
        {stats.statusBreakdown && ((stats.statusBreakdown.pending || 0) + (stats.statusBreakdown.new || 0)) > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('designViewer.newDesigns')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(stats.statusBreakdown.pending || 0) + (stats.statusBreakdown.new || 0)}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        )}

        {/* Viewed Designs - Only show if there are viewed designs */}
        {stats.statusBreakdown && (stats.statusBreakdown.viewed || 0) > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('designViewer.viewed')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.statusBreakdown.viewed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${filter === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {t('designViewer.allDesigns')}
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${filter === 'new'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {t('designViewer.new')} {stats.statusBreakdown && ((stats.statusBreakdown.pending || 0) + (stats.statusBreakdown.new || 0)) > 0 ?
                `(${(stats.statusBreakdown.pending || 0) + (stats.statusBreakdown.new || 0)})` : ''}
            </button>
            <button
              onClick={() => setFilter('viewed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${filter === 'viewed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {t('designViewer.viewed')} {stats.statusBreakdown && (stats.statusBreakdown.viewed || 0) > 0 ?
                `(${stats.statusBreakdown.viewed})` : ''}
            </button>
          </nav>
        </div>
      </div>

      {/* Notification Settings for Super Admin */}
      {userRole === 'super_admin' && (
        <div className="mb-6 flex justify-between items-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm flex-1 mr-4">
            <strong>{t('designViewer.customerDesignNotifications')}:</strong> {t('designViewer.currentlySending')}{' '}
            <span className="font-medium">
              {notificationSettings.notificationType === 'email' ? t('designViewer.emailOnly') :
               notificationSettings.notificationType === 'sms' ? t('designViewer.smsOnly') :
               t('designViewer.bothEmailSMS')}
            </span>
            {' '}{t('designViewer.whenCustomersSubmit')}.
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm relative"
            title={`Design Notifications: ${notificationSettings.notificationType.toUpperCase()}`}
          >
            <Settings size={16} />
            {t('designViewer.notificationSettings')}
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
              notificationSettings.notificationType === 'email' ? 'bg-green-500' :
              notificationSettings.notificationType === 'sms' ? 'bg-blue-500' :
              'bg-purple-500'
            }`}></span>
          </button>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedDesigns.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedDesigns.size} {t('designViewer.designsSelected')}
            </span>
            <button
              onClick={bulkDeleteDesigns}
              disabled={bulkActionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {bulkActionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('designViewer.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t('designViewer.deleteSelected')}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Designs List */}
      {loading && !selectedDesign ? (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">{t('designViewer.loadingDesigns')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {getSortedDesigns().map((design) => (
              <div key={design.id} className="border-b border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDesigns.has(design.id)}
                      onChange={() => toggleDesignSelection(design.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{design.client_name}</h3>
                      <p className="text-sm text-gray-500">${design.total_price?.toFixed(2)}</p>
                    </div>
                  </div>
                  {design.status === 'new' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {t('designViewer.new').toUpperCase()}
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {t('designViewer.viewed')}
                    </span>
                  )}
                </div>
                <div className="mb-2">
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Phone className="w-3 h-3 mr-1" />
                    {design.client_phone ? (
                      <a href={`tel:${design.client_phone}`} className="text-blue-600 hover:underline">
                        {formatPhoneNumber(design.client_phone)}
                      </a>
                    ) : (
                      <span>{t('designViewer.openToSeeNumber')}</span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="w-3 h-3 mr-1" />
                    <a href={`mailto:${design.client_email}`} className="text-blue-600 hover:underline">
                      {design.client_email}
                    </a>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{formatDate(design.created_at)}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewDesign(design.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadPDF(design.id, design.client_name)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteDesign(design.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDesigns.size === designs.length && designs.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    {t('designViewer.status')}
                    {sortConfig.key === 'status' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('client_name')}
                >
                  <div className="flex items-center gap-1">
                    {t('designViewer.client')}
                    {sortConfig.key === 'client_name' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('designViewer.contact')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total_price')}
                >
                  <div className="flex items-center gap-1">
                    {t('designViewer.total')}
                    {sortConfig.key === 'total_price' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('designViewer.notes')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    {t('designViewer.submittedColumn')}
                    {sortConfig.key === 'created_at' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('designViewer.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedDesigns().map((design) => (
                <tr key={design.id} className={`${design.status === 'new' ? 'bg-blue-50' : ''} ${selectedDesigns.has(design.id) ? 'bg-blue-25' : ''} hover:bg-gray-50`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedDesigns.has(design.id)}
                      onChange={() => toggleDesignSelection(design.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={design.status}
                      onChange={(e) => changeStatus(design.id, e.target.value)}
                      disabled={statusChanging === design.id}
                      className={`text-xs rounded px-2 py-1 border-0 font-semibold ${design.status === 'new'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                        } ${statusChanging === design.id ? 'opacity-50' : 'cursor-pointer hover:bg-opacity-80'}`}
                    >
                      <option value="new">{t('designViewer.new')}</option>
                      <option value="viewed">{t('designViewer.viewed')}</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{design.client_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center mt-1">
                        <Phone className="w-3 h-3 mr-1" />
                        {design.client_phone ? (
                          <a
                            href={`tel:${design.client_phone}`}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            title={t('designViewer.clickToCall')}
                          >
                            {formatPhoneNumber(design.client_phone)}
                          </a>
                        ) : (
                          <span className="text-xs">{t('designViewer.openToSeeNumber')}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        <a
                          href={`mailto:${design.client_email}`}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          title={t('designViewer.clickToEmail')}
                        >
                          {design.client_email}
                        </a>
                      </div>

                      {/* Preference indicator with icon */}
                      <div className="flex items-center mt-1">
                        {getContactIcon(design.contact_preference)}
                        <span className="ml-1 text-xs text-blue-600">{t('designViewer.preferred')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${design.total_price?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingNote === design.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={noteValues[design.id] !== undefined ? noteValues[design.id] : (design.admin_note || '')}
                          onChange={(e) => setNoteValues({ ...noteValues, [design.id]: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const noteValue = noteValues[design.id] !== undefined ? noteValues[design.id] : '';
                              saveNote(design.id, noteValue);
                            }
                            if (e.key === 'Escape') {
                              setEditingNote(null);
                            }
                          }}
                          className="text-xs border border-gray-300 rounded px-2 py-1 w-32"
                          placeholder={t('designViewer.addNote')}
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            const noteValue = noteValues[design.id] !== undefined ? noteValues[design.id] : '';
                            saveNote(design.id, noteValue);
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingNote(null)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingNote(design.id);
                          setNoteValues({ ...noteValues, [design.id]: design.admin_note || '' });
                        }}
                        className="text-xs text-gray-500 cursor-pointer hover:text-blue-600 min-h-[20px]"
                        title={t('designViewer.clickToAddNote')}
                      >
                        {design.admin_note || t('designViewer.addNote')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(design.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewDesign(design.id)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Eye className="w-5 h-5 inline" />
                    </button>
                    <button
                      onClick={() => downloadPDF(design.id, design.client_name)}
                      className="text-gray-600 hover:text-gray-900 mr-4"
                    >
                      <Download className="w-5 h-5 inline" />
                    </button>
                    <button
                      onClick={() => deleteDesign(design.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {designs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No designs found</h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all'
                  ? "No design submissions yet. Designs will appear here when clients submit them."
                  : `No ${filter} designs found. Try switching to a different filter.`
                }
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  View All Designs
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Design Detail Modal */}
      {selectedDesign && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-70 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-6 pt-32">
            <div className="bg-white rounded-lg max-w-4xl w-full my-12">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">Design Details</h2>
                  <button
                    onClick={() => setSelectedDesign(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Client Information */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3">Client Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedDesign.client_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact Preference</p>
                      <p className="font-medium flex items-center">
                        {getContactIcon(selectedDesign.contact_preference)}
                        <span className="ml-2">{selectedDesign.contact_preference}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact Information</p>
                      <p className=' font-medium'>email: {selectedDesign.client_email}</p>
                      <p className=' font-medium'>phone: {formatPhoneNumber(selectedDesign.client_phone)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submitted</p>
                      <p className="font-medium">{formatDate(selectedDesign.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Design Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-3">Design Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Estimate</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${selectedDesign.total_price?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rooms Included</p>
                      <div className="flex gap-2 mt-1">
                        {selectedDesign.include_kitchen && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Home className="w-3 h-3 mr-1" /> Kitchen
                          </span>
                        )}
                        {selectedDesign.include_bathroom && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Bath className="w-3 h-3 mr-1" /> Bathroom
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Design Preview */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Design Visualization</h3>
                  <DesignPreview
                    designData={selectedDesign}
                    hasKitchen={selectedDesign.include_kitchen && selectedDesign.kitchen_data}
                    hasBathroom={selectedDesign.include_bathroom && selectedDesign.bathroom_data}
                  />
                </div>

                {/* Room Details */}
                {selectedDesign.kitchen_data && selectedDesign.include_kitchen && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-3">Kitchen Details</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Room Dimensions: {selectedDesign.kitchen_data.dimensions.width}' × {selectedDesign.kitchen_data.dimensions.height}' × {selectedDesign.kitchen_data.dimensions.wallHeight}" height
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Total Items: {selectedDesign.kitchen_data.elements.length}
                    </p>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Cabinet Summary:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {selectedDesign.kitchen_data.elements
                          .filter(el => el.category === 'cabinet')
                          .map((cabinet, idx) => (
                            <li key={idx}>
                              • {cabinet.type} ({cabinet.width}" × {cabinet.depth}") -
                              Material: {selectedDesign.kitchen_data.materials[cabinet.id] || 'laminate'}
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                  </div>
                )}

                {selectedDesign.bathroom_data && selectedDesign.include_bathroom && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-3">Bathroom Details</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Room Dimensions: {selectedDesign.bathroom_data.dimensions.width}' × {selectedDesign.bathroom_data.dimensions.height}' × {selectedDesign.bathroom_data.dimensions.wallHeight}" height
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Total Items: {selectedDesign.bathroom_data.elements.length}
                    </p>
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Cabinet Summary:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {selectedDesign.bathroom_data.elements
                          .filter(el => el.category === 'cabinet')
                          .map((cabinet, idx) => (
                            <li key={idx}>
                              • {cabinet.type} ({cabinet.width}" × {cabinet.depth}") -
                              Material: {selectedDesign.bathroom_data.materials[cabinet.id] || 'laminate'}
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                  </div>
                )}

                {/* Customer Comments */}
                {selectedDesign.comments && (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Customer Notes</h3>
                    <p className="text-gray-700">{selectedDesign.comments}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      deleteDesign(selectedDesign.id);
                      setSelectedDesign(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Design
                  </button>
                  <div className="flex gap-4">
                    <button
                      onClick={() => downloadPDF(selectedDesign.id, selectedDesign.client_name)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <a
                      href={`mailto:${selectedDesign.client_email}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email Client
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {showSettingsModal && userRole === 'super_admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings size={20} />
              Customer Design Notification Settings
            </h3>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Choose how you want to receive notifications when customers submit new cabinet designs.
              </p>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="notificationType"
                    value="email"
                    checked={notificationSettings.notificationType === 'email'}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, notificationType: e.target.value }))}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Email Only</div>
                    <div className="text-sm text-gray-500">Send to: {notificationSettings.adminEmail}</div>
                  </div>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="notificationType"
                    value="sms"
                    checked={notificationSettings.notificationType === 'sms'}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, notificationType: e.target.value }))}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">SMS Only</div>
                    <div className="text-sm text-gray-500">Send to: Configured SMS recipients</div>
                  </div>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="notificationType"
                    value="both"
                    checked={notificationSettings.notificationType === 'both'}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, notificationType: e.target.value }))}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Both Email & SMS</div>
                    <div className="text-sm text-gray-500">Email + configured SMS recipients</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  // Reset to current settings
                  fetchNotificationSettings();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={updateNotificationSettings}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Settings size={16} />
                    Update Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignViewer;
