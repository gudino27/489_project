import api from './client';

/**
 * Project Timelines API Module
 * Handles all timeline-related API calls matching webapp functionality
 */

// Get all timelines
export const getTimelines = async () => {
  const response = await api.get('/api/admin/timelines');
  return response.data;
};

// Get all invoices (for picker when creating timeline)
export const getInvoices = async () => {
  const response = await api.get('/api/admin/invoices');
  return response.data;
};

// Create timeline from invoice
export const createTimeline = async (invoiceId, clientLanguage = 'en') => {
  const response = await api.post('/api/admin/timeline', {
    invoice_id: invoiceId,
    client_language: clientLanguage,
  });
  return response.data;
};

// Create standalone timeline (without invoice)
export const createStandaloneTimeline = async (clientName, clientEmail, clientPhone, clientLanguage = 'en') => {
  const response = await api.post('/api/admin/timeline/standalone', {
    client_name: clientName,
    client_email: clientEmail,
    client_phone: clientPhone,
    client_language: clientLanguage,
  });
  return response.data;
};

// Get timeline by ID
export const getTimelineById = async (timelineId) => {
  const response = await api.get(`/api/admin/timeline/${timelineId}`);
  return response.data;
};

// Get timeline by invoice ID
export const getTimelineByInvoiceId = async (invoiceId) => {
  const response = await api.get(`/api/admin/timeline/invoice/${invoiceId}`);
  return response.data;
};

// Update timeline (language, etc.)
export const updateTimeline = async (id, timelineData) => {
  const response = await api.put(`/api/admin/timeline/${id}`, timelineData);
  return response.data;
};

// Delete timeline
export const deleteTimeline = async (id) => {
  const response = await api.delete(`/api/admin/timeline/${id}`);
  return response.data;
};

// Add phase to timeline
export const addTimelinePhase = async (timelineId, phaseData) => {
  const response = await api.post(`/api/admin/timeline/${timelineId}/phase`, phaseData);
  return response.data;
};

// Update phase (webapp uses just phaseId)
export const updatePhase = async (phaseId, updates) => {
  const response = await api.put(`/api/admin/timeline/phase/${phaseId}`, updates);
  return response.data;
};

// Update timeline phase (legacy compatibility)
export const updateTimelinePhase = async (timelineId, phaseId, phaseData) => {
  const response = await api.put(`/api/admin/timeline/${timelineId}/phase/${phaseId}`, phaseData);
  return response.data;
};

// Delete timeline phase
export const deleteTimelinePhase = async (timelineId, phaseId) => {
  const response = await api.delete(`/api/admin/timeline/${timelineId}/phase/${phaseId}`);
  return response.data;
};

// Send timeline link via email/SMS
export const sendTimelineLink = async (timelineId, method) => {
  const response = await api.post(`/api/admin/timeline/${timelineId}/send-link`, {
    method, // 'email', 'sms', or 'both'
  });
  return response.data;
};
