import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  PlayCircle,
  Edit,
  Trash2,
  Image as ImageIcon,
  FileText,
  RefreshCw,
  Send,
  Mail,
  MessageSquare
} from 'lucide-react';
import sessionManager from '../utils/sessionManager';
import { useLanguage } from '../../contexts/LanguageContext';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

const ProjectTimelineManager = () => {
  const { t } = useLanguage();
  const [timelines, setTimelines] = useState([]);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [createMode, setCreateMode] = useState('invoice'); // 'invoice' or 'standalone'
  const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'details'
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSendLinkModal, setShowSendLinkModal] = useState(false);

  // Get auth headers
  const getAuthHeaders = () => {
    const session = sessionManager.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': session?.token ? `Bearer ${session.token}` : ''
    };
  };

  // Load timelines
  useEffect(() => {
    loadTimelines();
    loadInvoices();
  }, []);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadTimelines = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/timelines`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setTimelines(data);
      }
    } catch (error) {
      console.error('Error loading timelines:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/invoices`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const createTimeline = async (invoiceId, clientLanguage) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/timeline`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ invoice_id: invoiceId, client_language: clientLanguage })
      });

      if (response.ok) {
        await loadTimelines();
        setShowCreateModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create timeline');
      }
    } catch (error) {
      console.error('Error creating timeline:', error);
      alert('Failed to create timeline');
    }
  };

  const createStandaloneTimeline = async (clientName, clientEmail, clientPhone, clientLanguage) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/timeline/standalone`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          client_language: clientLanguage
        })
      });

      if (response.ok) {
        const data = await response.json();
        await loadTimelines();
        setShowCreateModal(false);

        // Load the newly created timeline and ask admin if they want to send link now
        const timelineResponse = await fetch(`${API_BASE}/api/admin/timeline/${data.timeline.id}`, {
          headers: getAuthHeaders()
        });

        if (timelineResponse.ok) {
          const timelineData = await timelineResponse.json();
          setSelectedTimeline(timelineData);
          if (isMobile) {
            setMobileView('details');
          }

          // Show send link modal to ask admin if they want to send now
          setTimeout(() => {
            if (window.confirm(`Timeline created successfully!\\n\\nDo you want to send the timeline link to ${clientName} now?`)) {
              setShowSendLinkModal(true);
            }
          }, 300);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create standalone timeline');
      }
    } catch (error) {
      console.error('Error creating standalone timeline:', error);
      alert('Failed to create standalone timeline');
    }
  };

  const addCustomPhase = async (timelineId, phaseData) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/timeline/${timelineId}/phase`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(phaseData)
      });

      if (response.ok) {
        if (phaseData.sendNotification) {
          alert('Custom phase added and notification sent to client!');
        } else {
          alert('Custom phase added!');
        }
        // Reload timeline details using the correct method
        const isInvoiceBased = !!selectedTimeline?.invoice_id;
        await loadTimelineDetails(
          isInvoiceBased ? selectedTimeline.invoice_id : selectedTimeline.id,
          isInvoiceBased
        );
        setShowAddPhaseModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add custom phase');
      }
    } catch (error) {
      console.error('Error adding custom phase:', error);
      alert('Failed to add custom phase');
    }
  };

  const loadTimelineDetails = async (timelineIdOrInvoiceId, isInvoiceBased = true) => {
    try {
      const endpoint = isInvoiceBased
        ? `${API_BASE}/api/admin/timeline/invoice/${timelineIdOrInvoiceId}`
        : `${API_BASE}/api/admin/timeline/${timelineIdOrInvoiceId}`;

      const response = await fetch(endpoint, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTimeline(data);
        // Switch to details view on mobile
        if (isMobile) {
          setMobileView('details');
        }
      }
    } catch (error) {
      console.error('Error loading timeline details:', error);
    }
  };

  const updatePhase = async (phaseId, updates) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/timeline/phase/${phaseId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        // Reload timeline details
        if (selectedTimeline) {
          const isInvoiceBased = !!selectedTimeline.invoice_id;
          await loadTimelineDetails(
            isInvoiceBased ? selectedTimeline.invoice_id : selectedTimeline.id,
            isInvoiceBased
          );
        }
        await loadTimelines();
      }
    } catch (error) {
      console.error('Error updating phase:', error);
      alert('Failed to update phase');
    }
  };

  const deleteTimeline = async (timelineId) => {
    if (!window.confirm('Are you sure you want to delete this timeline?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/timeline/${timelineId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        await loadTimelines();
        setSelectedTimeline(null);
      }
    } catch (error) {
      console.error('Error deleting timeline:', error);
      alert('Failed to delete timeline');
    }
  };

  const updateTimelineLanguage = async (timelineId, newLanguage) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/timeline/${timelineId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ client_language: newLanguage })
      });

      if (response.ok) {
        // Update local state
        setSelectedTimeline(prev => ({
          ...prev,
          client_language: newLanguage
        }));

        // Reload timelines to update list
        await loadTimelines();

        alert(`Language updated to ${newLanguage === 'es' ? 'Español' : 'English'}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update language');
      }
    } catch (error) {
      console.error('Error updating language:', error);
      alert('Failed to update language');
    }
  };

  const sendTimelineLink = async (method) => {
    if (!selectedTimeline) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/timeline/${selectedTimeline.id}/send-link`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ method })
      });

      if (response.ok) {
        const data = await response.json();
        let message = '';

        if (method === 'email' && data.results.email === 'sent') {
          message = 'Email sent successfully!';
        } else if (method === 'sms' && data.results.sms === 'sent') {
          message = 'SMS sent successfully!';
        } else if (method === 'both') {
          const emailStatus = data.results.email === 'sent' ? '✓ Email' : data.results.email === 'no_email' ? '⚠ No email address' : '✗ Email failed';
          const smsStatus = data.results.sms === 'sent' ? '✓ SMS' : data.results.sms === 'no_phone' ? '⚠ No phone number' : '✗ SMS failed';
          message = `${emailStatus}\n${smsStatus}`;
        }

        alert(message || 'Link sent!');
        setShowSendLinkModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send link');
      }
    } catch (error) {
      console.error('Error sending timeline link:', error);
      alert('Failed to send timeline link');
    }
  };

  // Phase name translations
  const getPhaseLabel = (phaseKey) => {
    const labels = {
      design: 'Design',
      materials: 'Materials Ordered',
      fabrication: 'Fabrication',
      installation: 'Installation',
      completion: 'Completion'
    };
    return labels[phaseKey] || phaseKey;
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const styles = {
      pending: { bg: '#FEF3C7', color: '#92400E', icon: Circle },
      in_progress: { bg: '#DBEAFE', color: '#1E40AF', icon: PlayCircle },
      completed: { bg: '#D1FAE5', color: '#065F46', icon: CheckCircle }
    };

    const style = styles[status] || styles.pending;
    const Icon = style.icon;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: isMobile ? '0.5rem 1rem' : '0.25rem 0.75rem',
        borderRadius: '9999px',
        background: style.bg,
        color: style.color,
        fontSize: isMobile ? '0.875rem' : '0.875rem',
        fontWeight: '500'
      }}>
        <Icon size={isMobile ? 16 : 14} />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Phase editor component
  const PhaseEditor = ({ phase }) => {
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
      status: phase.status,
      estimated_completion: phase.estimated_completion || '',
      notes: phase.notes || ''
    });

    const handleSave = async () => {
      await updatePhase(phase.id, formData);
      setEditing(false);
    };

    if (!editing) {
      return (
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: 'white',
          borderRadius: isMobile ? '12px' : '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem',
            gap: '1rem'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: isMobile ? '1.125rem' : '1.125rem',
                fontWeight: '600',
                marginBottom: '0.75rem'
              }}>
                {getPhaseLabel(phase.phase_name_key)}
              </h3>
              <StatusBadge status={phase.status} />
            </div>
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: isMobile ? '0.75rem' : '0.5rem',
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: isMobile ? '44px' : 'auto',
                minHeight: isMobile ? '44px' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Edit size={isMobile ? 20 : 18} />
            </button>
          </div>

          {phase.estimated_completion && (
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
              <strong>Est. Completion:</strong> {new Date(phase.estimated_completion).toLocaleDateString()}
            </p>
          )}

          {phase.actual_completion && (
            <p style={{ fontSize: '0.875rem', color: '#10B981', marginBottom: '0.5rem' }}>
              <strong>Completed:</strong> {new Date(phase.actual_completion).toLocaleDateString()}
            </p>
          )}

          {phase.notes && (
            <p style={{ fontSize: '0.875rem', color: '#374151', marginTop: '0.75rem', padding: '0.75rem', background: '#F9FAFB', borderRadius: '4px' }}>
              {phase.notes}
            </p>
          )}
        </div>
      );
    }

    return (
      <div style={{
        padding: '1.5rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1rem',
        border: '2px solid #3B82F6'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          Edit: {getPhaseLabel(phase.phase_name_key)}
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            Estimated Completion
          </label>
          <input
            type="date"
            value={formData.estimated_completion}
            onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontFamily: 'inherit'
            }}
            placeholder="Add notes about this phase..."
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setEditing(false)}
            style={{
              padding: '0.5rem 1rem',
              background: '#F3F4F6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '0.5rem 1rem',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <RefreshCw size={48} className="animate-spin" style={{ margin: '0 auto', color: '#6B7280' }} />
        <p style={{ marginTop: '1rem', color: '#6B7280' }}>Loading timelines...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '1rem' : '2rem', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      {/* Header - Desktop */}
      {!isMobile && (
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Project Timelines</h1>
            <p style={{ color: '#6B7280' }}>Manage project progress and client updates</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            <Plus size={20} />
            Create Timeline
          </button>
        </div>
      )}

      {/* Mobile Header - Only show when in list view */}
      {isMobile && mobileView === 'list' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Project Timelines</h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Manage project progress</p>
        </div>
      )}

      {/* Mobile Details Header - Back button */}
      {isMobile && mobileView === 'details' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setMobileView('list')}
            style={{
              padding: '0.5rem',
              background: '#F3F4F6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Timeline Details</h1>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: !isMobile && selectedTimeline ? '1fr 2fr' : '1fr',
        gap: '2rem'
      }}>
        {/* Timeline List - Hide on mobile when viewing details */}
        <div style={{ display: isMobile && mobileView === 'details' ? 'none' : 'block' }}>
          <h2 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '600',
            marginBottom: isMobile ? '1.25rem' : '1rem',
            color: '#111827'
          }}>
            All Timelines ({timelines.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {timelines.map(timeline => {
              const isInvoiceBased = !!timeline.invoice_id;
              const displayName = timeline.client_name || 'Unknown Client';
              const displaySubtitle = isInvoiceBased
                ? `Invoice #${timeline.invoice_number}`
                : timeline.client_email || 'Standalone Project';

              return (
                <div
                  key={timeline.id}
                  onClick={() => loadTimelineDetails(isInvoiceBased ? timeline.invoice_id : timeline.id, isInvoiceBased)}
                  style={{
                    padding: isMobile ? '1.25rem' : '1rem',
                    background: 'white',
                    borderRadius: isMobile ? '12px' : '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    border: selectedTimeline?.id === timeline.id ? '2px solid #3B82F6' : '2px solid transparent',
                    transition: 'all 0.2s',
                    minHeight: isMobile ? '80px' : 'auto'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{displayName}</p>
                      <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{displaySubtitle}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {!isInvoiceBased && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#DBEAFE',
                          color: '#1E40AF',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          Standalone
                        </span>
                      )}
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: '#F3F4F6',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {timeline.client_language === 'es' ? 'ES' : 'EN'}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                    Created {new Date(timeline.created_at).toLocaleDateString()}
                  </p>
                </div>
              );
            })}

            {timelines.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                <Calendar size={48} style={{ margin: '0 auto 1rem' }} />
                <p>No timelines yet. Create one to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Details - Show on desktop always, on mobile only when in details view */}
        {selectedTimeline && (!isMobile || mobileView === 'details') && (
          <div>
            {/* Client Information Header */}
            <div style={{
              background: 'white',
              borderRadius: isMobile ? '12px' : '8px',
              padding: isMobile ? '1.5rem' : '1.25rem',
              marginBottom: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '2px solid #3B82F6'
            }}>
              {/* Client Name and Avatar */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                gap: isMobile ? '1rem' : '0.75rem',
                marginBottom: isMobile ? '1rem' : '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: isMobile ? '100%' : 'auto' }}>
                  <div style={{
                    width: isMobile ? '48px' : '40px',
                    height: isMobile ? '48px' : '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: isMobile ? '1.25rem' : '1.125rem',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {selectedTimeline.client_name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: isMobile ? '1.125rem' : '1.125rem',
                      fontWeight: '700',
                      marginBottom: '0.25rem',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: isMobile ? 'normal' : 'nowrap'
                    }}>
                      {selectedTimeline.client_name}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6B7280'
                    }}>
                      {selectedTimeline.invoice_number
                        ? `Invoice #${selectedTimeline.invoice_number}`
                        : selectedTimeline.client_name}
                    </p>
                  </div>
                </div>

                {/* Language Selector and Send Link Button - Desktop only */}
                {!isMobile && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <select
                      value={selectedTimeline.client_language || 'en'}
                      onChange={(e) => updateTimelineLanguage(selectedTimeline.id, e.target.value)}
                      style={{
                        padding: '0.375rem 0.5rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        background: 'white',
                        color: '#374151'
                      }}
                    >
                      <option value="en">🇺🇸 English</option>
                      <option value="es">🇲🇽 Español</option>
                    </select>

                    <button
                      onClick={() => setShowSendLinkModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.5rem',
                        background: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#2563EB'}
                      onMouseLeave={(e) => e.target.style.background = '#3B82F6'}
                    >
                      <Send size={16} />
                      <span>Send Link</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Language Selector and Send Link Button - Mobile only */}
              {isMobile && (
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <select
                    value={selectedTimeline.client_language || 'en'}
                    onChange={(e) => updateTimelineLanguage(selectedTimeline.id, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      background: 'white',
                      color: '#374151',
                      minHeight: '44px'
                    }}
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="es">🇲🇽 Español</option>
                  </select>

                  <button
                    onClick={() => setShowSendLinkModal(true)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      minHeight: '44px'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#2563EB'}
                    onMouseLeave={(e) => e.target.style.background = '#3B82F6'}
                  >
                    <Send size={16} />
                    <span>Send Link</span>
                  </button>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: isMobile ? '0.75rem' : '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #E5E7EB'
              }}>
                {selectedTimeline.client_email && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Email</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                      {selectedTimeline.client_email}
                    </p>
                  </div>
                )}
                {selectedTimeline.client_phone && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Phone</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                      {selectedTimeline.client_phone}
                    </p>
                  </div>
                )}
                {selectedTimeline.invoice_number && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Invoice</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                      #{selectedTimeline.invoice_number}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delete Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '1.5rem'
            }}>
              <button
                onClick={() => deleteTimeline(selectedTimeline.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: isMobile ? '0.75rem 1.25rem' : '0.5rem 1rem',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  fontWeight: '500',
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: 'center'
                }}
              >
                <Trash2 size={isMobile ? 20 : 16} />
                Delete Timeline
              </button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              {selectedTimeline.phases && selectedTimeline.phases.map(phase => (
                <PhaseEditor key={phase.id} phase={phase} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile - Only show in list view */}
      {isMobile && mobileView === 'list' && (
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '1.5rem',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <Plus size={28} />
        </button>
      )}

      {/* Create Timeline Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: isMobile ? '16px 16px 0 0' : '12px',
            padding: isMobile ? '1.5rem' : '2rem',
            maxWidth: '500px',
            width: isMobile ? '100%' : '90%',
            maxHeight: isMobile ? '90vh' : 'auto',
            overflowY: isMobile ? 'auto' : 'visible',
            position: isMobile ? 'fixed' : 'relative',
            bottom: isMobile ? 0 : 'auto',
            left: isMobile ? 0 : 'auto',
            right: isMobile ? 0 : 'auto'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Create Project Timeline</h2>

            {/* Mode Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setCreateMode('invoice')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: createMode === 'invoice' ? '2px solid #2563EB' : '1px solid #D1D5DB',
                  background: createMode === 'invoice' ? '#EFF6FF' : 'white',
                  color: createMode === 'invoice' ? '#2563EB' : '#6B7280',
                  borderRadius: '8px',
                  fontWeight: createMode === 'invoice' ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                With Invoice
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('standalone')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: createMode === 'standalone' ? '2px solid #2563EB' : '1px solid #D1D5DB',
                  background: createMode === 'standalone' ? '#EFF6FF' : 'white',
                  color: createMode === 'standalone' ? '#2563EB' : '#6B7280',
                  borderRadius: '8px',
                  fontWeight: createMode === 'standalone' ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Standalone
              </button>
            </div>

            {createMode === 'invoice' ? (
              <CreateTimelineForm
                invoices={invoices}
                onSubmit={createTimeline}
                onCancel={() => setShowCreateModal(false)}
              />
            ) : (
              <CreateStandaloneForm
                onSubmit={createStandaloneTimeline}
                onCancel={() => setShowCreateModal(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Send Link Modal */}
      {showSendLinkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: isMobile ? 'center' : 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? '1rem' : 0
        }} onClick={() => setShowSendLinkModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: isMobile ? '1.5rem' : '2rem',
            maxWidth: '400px',
            width: isMobile ? '100%' : '90%',
            maxHeight: isMobile ? '85vh' : 'auto',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
              Send Timeline Link
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
              Choose how to send the project timeline link to {selectedTimeline?.client_name}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Email Option */}
              {selectedTimeline?.client_email && (
                <button
                  onClick={() => sendTimelineLink('email')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: 'white',
                    border: '2px solid #3B82F6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: isMobile ? '60px' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#EFF6FF';
                    e.currentTarget.style.borderColor = '#2563EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#3B82F6';
                  }}
                >
                  <div style={{
                    padding: '0.75rem',
                    background: '#DBEAFE',
                    borderRadius: '8px'
                  }}>
                    <Mail size={24} className="text-blue-600" style={{ color: '#2563EB' }} />
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#111827' }}>Email</p>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>{selectedTimeline.client_email}</p>
                  </div>
                </button>
              )}

              {/* SMS Option */}
              {selectedTimeline?.client_phone && (
                <button
                  onClick={() => sendTimelineLink('sms')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: 'white',
                    border: '2px solid #10B981',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: isMobile ? '60px' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ECFDF5';
                    e.currentTarget.style.borderColor = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#10B981';
                  }}
                >
                  <div style={{
                    padding: '0.75rem',
                    background: '#D1FAE5',
                    borderRadius: '8px'
                  }}>
                    <MessageSquare size={24} style={{ color: '#059669' }} />
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#111827' }}>Text Message</p>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>{selectedTimeline.client_phone}</p>
                  </div>
                </button>
              )}

              {/* Both Option */}
              {selectedTimeline?.client_email && selectedTimeline?.client_phone && (
                <button
                  onClick={() => sendTimelineLink('both')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: 'white',
                    border: '2px solid #8B5CF6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: isMobile ? '60px' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F5F3FF';
                    e.currentTarget.style.borderColor = '#7C3AED';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#8B5CF6';
                  }}
                >
                  <div style={{
                    padding: '0.75rem',
                    background: '#EDE9FE',
                    borderRadius: '8px'
                  }}>
                    <Send size={24} style={{ color: '#7C3AED' }} />
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#111827' }}>Email & SMS</p>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Send via both methods</p>
                  </div>
                </button>
              )}
            </div>

            <button
              onClick={() => setShowSendLinkModal(false)}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem' : '0.75rem',
                marginTop: '1rem',
                background: '#F3F4F6',
                color: '#6B7280',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Timeline Form Component
const CreateTimelineForm = ({ invoices, onSubmit, onCancel }) => {
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [language, setLanguage] = useState('en');

  // Filter invoices that don't have timelines yet
  const availableInvoices = invoices.filter(inv => !inv.has_timeline);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedInvoice) {
      onSubmit(parseInt(selectedInvoice), language);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
          Select Invoice
        </label>
        <select
          value={selectedInvoice}
          onChange={(e) => setSelectedInvoice(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        >
          <option value="">Choose an invoice...</option>
          {availableInvoices.map(invoice => (
            <option key={invoice.id} value={invoice.id}>
              Invoice #{invoice.invoice_number} - {invoice.client_name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
          Client Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#F3F4F6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!selectedInvoice}
          style={{
            padding: '0.75rem 1.5rem',
            background: selectedInvoice ? '#3B82F6' : '#D1D5DB',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: selectedInvoice ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Create Timeline
        </button>
      </div>
    </form>
  );
};

// Create Standalone Timeline Form Component
const CreateStandaloneForm = ({ onSubmit, onCancel }) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [language, setLanguage] = useState('en');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(clientName, clientEmail, clientPhone, language);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
          Client Name *
        </label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
          placeholder="John Doe"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
          Client Email *
        </label>
        <input
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          required
          placeholder="john@example.com"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
          Client Phone (optional)
        </label>
        <input
          type="tel"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          placeholder="+1 (555) 123-4567"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
          Client Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div style={{
        padding: '1rem',
        background: '#EFF6FF',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        color: '#1E40AF'
      }}>
        📧 An email with the timeline access link will be automatically sent to the client.
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#F3F4F6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!clientName || !clientEmail}
          style={{
            padding: '0.75rem 1.5rem',
            background: (clientName && clientEmail) ? '#3B82F6' : '#D1D5DB',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (clientName && clientEmail) ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Create Standalone Timeline
        </button>
      </div>
    </form>
  );
};

export default ProjectTimelineManager;
