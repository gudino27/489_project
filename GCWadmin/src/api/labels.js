import api from './client';

// Get all line item labels
export const getLabels = async () => {
  const response = await api.get('/api/admin/line-item-labels');
  return response.data;
};

// Create new label
export const createLabel = async (labelData) => {
  const response = await api.post('/api/admin/line-item-labels', labelData);
  return response.data;
};

// Update label
export const updateLabel = async (labelId, labelData) => {
  const response = await api.put(`/api/admin/line-item-labels/${labelId}`, labelData);
  return response.data;
};

// Delete label
export const deleteLabel = async (labelId) => {
  const response = await api.delete(`/api/admin/line-item-labels/${labelId}`);
  return response.data;
};
