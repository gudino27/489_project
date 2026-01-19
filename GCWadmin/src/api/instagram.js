import api from './client';

// Get all Instagram posts
export const getInstagramPosts = async () => {
  const response = await api.get('/api/instagram/admin/posts');
  return response.data;
};

// Fetch new posts from Instagram
export const fetchInstagramPosts = async () => {
  const response = await api.post('/api/instagram/admin/fetch');
  return response.data;
};

// Get Instagram settings
export const getInstagramSettings = async () => {
  const response = await api.get('/api/instagram/admin/settings');
  return response.data;
};

// Update Instagram settings
export const updateInstagramSettings = async (settings) => {
  const response = await api.put('/api/instagram/admin/settings', settings);
  return response.data;
};

// Toggle post visibility
export const toggleInstagramPost = async (postId) => {
  const response = await api.post(`/api/instagram/admin/posts/${postId}/toggle`);
  return response.data;
};

// Delete Instagram post
export const deleteInstagramPost = async (postId) => {
  const response = await api.delete(`/api/instagram/admin/posts/${postId}`);
  return response.data;
};
