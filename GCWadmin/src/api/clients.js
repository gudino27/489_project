import api from './client';

// Get all clients
export const getClients = async () => {
  const response = await api.get('/api/admin/clients');
  return response.data;
};

// Get single client
export const getClient = async (clientId) => {
  const response = await api.get(`/api/admin/clients/${clientId}`);
  return response.data;
};

// Create new client
export const createClient = async (clientData) => {
  const response = await api.post('/api/admin/clients', clientData);
  return response.data;
};

// Update client
export const updateClient = async (clientId, clientData) => {
  const response = await api.put(`/api/admin/clients/${clientId}`, clientData);
  return response.data;
};

// Delete client
export const deleteClient = async (clientId) => {
  const response = await api.delete(`/api/admin/clients/${clientId}`);
  return response.data;
};

// Archive client
export const archiveClient = async (clientId) => {
  const response = await api.patch(`/api/admin/clients/${clientId}/archive`);
  return response.data;
};

// Get client's invoice history
export const getClientInvoices = async (clientId) => {
  const response = await api.get(`/api/admin/clients/${clientId}/invoices`);
  return response.data;
};
