import api from './client';

// Get SMS routing config
export const getSmsRouting = async () => {
  const response = await api.get('/api/sms-routing');
  return response.data;
};

// Update SMS routing
export const updateSmsRouting = async (routingData) => {
  const response = await api.put('/api/sms-routing', routingData);
  return response.data;
};

// Test SMS (legacy - by phone number)
export const testSms = async (phoneNumber, message) => {
  const response = await api.post('/api/sms-routing/test', { phoneNumber, message });
  return response.data;
};

// Get SMS settings
export const getSmsSettings = async () => {
  const response = await api.get('/api/admin/sms-routing/settings');
  return response.data;
};

// Update SMS settings by message type
export const updateSmsSettings = async (messageType, settings) => {
  const response = await api.put(`/api/admin/sms-routing/settings/${messageType}`, settings);
  return response.data;
};

// Get recipients
export const getRecipients = async () => {
  const response = await api.get('/api/admin/sms-routing/recipients');
  return response.data;
};

// Add recipient
export const addRecipient = async (recipientData) => {
  const response = await api.post('/api/admin/sms-routing/recipients', recipientData);
  return response.data;
};

// Update recipient
export const updateRecipient = async (id, recipientData) => {
  const response = await api.put(`/api/admin/sms-routing/recipients/${id}`, recipientData);
  return response.data;
};

// Delete recipient
export const deleteRecipient = async (id) => {
  const response = await api.delete(`/api/admin/sms-routing/recipients/${id}`);
  return response.data;
};

// Get SMS history
export const getSmsHistory = async (limit = 50) => {
  const response = await api.get(`/api/admin/sms-routing/history?limit=${limit}`);
  return response.data;
};

// Test SMS by message type
export const testSmsByType = async (messageType, message) => {
  const response = await api.post(`/api/admin/sms-routing/test/${messageType}`, { message });
  return response.data;
};
