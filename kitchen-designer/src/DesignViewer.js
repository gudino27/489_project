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
  const [stats, setStats] = useState({ total: 0, new_count: 0, viewed_count: 0 });

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadDesigns();
    loadStats();
  }, [filter]);

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
      }
    } catch (error) {
      console.error('Error loading designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/designs/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const viewDesign = async (designId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/designs/${designId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedDesign(data);
        // Reload designs to update status
        loadDesigns();
        loadStats();
      }
    } catch (error) {
      console.error('Error loading design:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (designId, clientName) => {
    window.open(`${API_BASE}/api/designs/${designId}/pdf`, '_blank');
  };

  const deleteDesign = async (designId) => {
    if (!window.confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/designs/${designId}`, {
        method: 'DELETE'
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
      hour12: true, // Use 12-hour format with AM/PM
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use user's local timezone


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

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Designs</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Designs</p>
              <p className="text-2xl font-bold text-blue-600">{stats.new_count}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Viewed</p>
              <p className="text-2xl font-bold text-green-600">{stats.viewed_count}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
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
              New ({stats.new_count})
            </button>
            <button
              onClick={() => setFilter('viewed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${filter === 'viewed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Viewed ({stats.viewed_count})
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
                    <div className="flex items-center text-sm text-gray-500">
                      {getContactIcon(design.contact_preference)}
                      <span className="ml-2">
                        {design.contact_preference === 'email' ? design.client_email : design.client_phone}
                      </span>
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                    <p className="text-sm text-gray-600">
                      {selectedDesign.contact_preference === 'email' ? 'Email' : 'Phone'}
                    </p>
                    <p className="font-medium">
                      {selectedDesign.contact_preference === 'email'
                        ? selectedDesign.client_email
                        : selectedDesign.client_phone}
                    </p>
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
              <div className="flex justify-between">
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
      )}
    </div>
  );
};

export default DesignViewer;