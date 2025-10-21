import api from './client';

// Get all users
export const getUsers = async () => {
  const response = await api.get('/api/users');
  // Backend returns { success: true, users: [...] }
  return response.data.users || [];
};

// Get single user
export const getUser = async (userId) => {
  const response = await api.get(`/api/users/${userId}`);
  return response.data;
};

// Create new user
export const createUser = async (userData) => {
  const response = await api.post('/api/users', userData);
  return response.data;
};

// Update user
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/api/users/${userId}`, userData);
  return response.data;
};

// Delete user
export const deleteUser = async (userId) => {
  const response = await api.delete(`/api/users/${userId}`);
  return response.data;
};

// Activate/Deactivate user
export const toggleUserStatus = async (userId) => {
  const response = await api.patch(`/api/users/${userId}/toggle-status`);
  return response.data;
};
