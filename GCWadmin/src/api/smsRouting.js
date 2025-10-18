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

// Test SMS
export const testSms = async (phoneNumber, message) => {
  const response = await api.post('/api/sms-routing/test', { phoneNumber, message });
  return response.data;
};
