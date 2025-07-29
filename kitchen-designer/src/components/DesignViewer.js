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
  Trash2
} from 'lucide-react';
import DesignPreview from './DesignPreview';

const DesignViewer = () => {
  const [designs, setDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, new, viewed
  const [stats, setStats] = useState({
    totalDesigns: 0,
    statusBreakdown: { pending: 0, new: 0, viewed: 0 },
    totalRevenue: 0, averageOrderValue: 0, recentDesigns: 0
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

  // Add the auth headers helper function
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  useEffect(() => {
    loadDesigns();
    loadStats();
  }, [filter]);

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
        console.log('Stats data received:', data);
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
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');

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
    if (!window.confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
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
  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Designs - Always show if data exists */}
        {typeof stats.totalDesigns === 'number' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Designs</p>
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
                <p className="text-sm text-gray-600">New Designs</p>
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
                <p className="text-sm text-gray-600">Viewed</p>
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
              All Designs
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${filter === 'new'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              New {stats.statusBreakdown && ((stats.statusBreakdown.pending || 0) + (stats.statusBreakdown.new || 0)) > 0 ? 
                `(${(stats.statusBreakdown.pending || 0) + (stats.statusBreakdown.new || 0)})` : ''}
            </button>
            <button
              onClick={() => setFilter('viewed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${filter === 'viewed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Viewed {stats.statusBreakdown && (stats.statusBreakdown.viewed || 0) > 0 ? 
                `(${stats.statusBreakdown.viewed})` : ''}
            </button>
          </nav>
        </div>
      </div>

      {/* Designs List */}
      {loading && !selectedDesign ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {designs.map((design) => (
                <tr key={design.id} className={design.status === 'new' ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {design.status === 'new' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        NEW
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Viewed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{design.client_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center mt-1">
                        <Phone className="w-3 h-3 mr-1" />
                        <span className="text-xs">{design.client_phone ? formatPhoneNumber(design.client_phone) : 'open to see #' }</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        <span className="text-xs">{design.client_email}</span>
                      </div>

                      {/* Preference indicator with icon */}
                      <div className="flex items-center mt-1">
                        {getContactIcon(design.contact_preference)}
                        <span className="ml-1 text-xs text-blue-600">preferred</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${design.total_price?.toFixed(2)}
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
            <div className="text-center py-8 text-gray-500">
              No designs found
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
    </div>
  );
};

export default DesignViewer;
