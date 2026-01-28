import api from './client';

// Get all showroom rooms
export const getShowroomRooms = async () => {
  const response = await api.get('/api/showroom/admin/rooms');
  return response.data;
};

// Create showroom room
export const createShowroomRoom = async (roomData) => {
  const response = await api.post('/api/showroom/admin/rooms', roomData);
  return response.data;
};

// Update showroom room
export const updateShowroomRoom = async (id, roomData) => {
  const response = await api.put(`/api/showroom/admin/rooms/${id}`, roomData);
  return response.data;
};

// Delete showroom room
export const deleteShowroomRoom = async (id) => {
  const response = await api.delete(`/api/showroom/admin/rooms/${id}`);
  return response.data;
};

// Get showroom settings
export const getShowroomSettings = async () => {
  const response = await api.get('/api/showroom/admin/settings');
  return response.data;
};

// Update showroom settings
export const updateShowroomSettings = async (settings) => {
  const response = await api.put('/api/showroom/admin/settings', settings);
  return response.data;
};

// Material Categories
export const getMaterialCategories = async () => {
  const response = await api.get('/api/showroom/admin/material-categories');
  return response.data;
};

export const createMaterialCategory = async (categoryData) => {
  const response = await api.post('/api/showroom/admin/material-categories', categoryData);
  return response.data;
};

export const updateMaterialCategory = async (id, categoryData) => {
  const response = await api.put(`/api/showroom/admin/material-categories/${id}`, categoryData);
  return response.data;
};

export const deleteMaterialCategory = async (id) => {
  const response = await api.delete(`/api/showroom/admin/material-categories/${id}`);
  return response.data;
};

// Materials
export const getMaterials = async (categoryId = null) => {
  const url = categoryId
    ? `/api/showroom/admin/materials?category_id=${categoryId}`
    : '/api/showroom/admin/materials';
  const response = await api.get(url);
  return response.data;
};

export const createMaterial = async (materialData) => {
  const response = await api.post('/api/showroom/admin/materials', materialData);
  return response.data;
};

export const updateMaterial = async (id, materialData) => {
  const response = await api.put(`/api/showroom/admin/materials/${id}`, materialData);
  return response.data;
};

export const deleteMaterial = async (id) => {
  const response = await api.delete(`/api/showroom/admin/materials/${id}`);
  return response.data;
};

// Swappable Elements
export const getElements = async (roomId = null) => {
  const url = roomId
    ? `/api/showroom/admin/elements?room_id=${roomId}`
    : '/api/showroom/admin/elements';
  const response = await api.get(url);
  return response.data;
};

export const createElement = async (elementData) => {
  const response = await api.post('/api/showroom/admin/elements', elementData);
  return response.data;
};

export const updateElement = async (id, elementData) => {
  const response = await api.put(`/api/showroom/admin/elements/${id}`, elementData);
  return response.data;
};

export const deleteElement = async (id) => {
  const response = await api.delete(`/api/showroom/admin/elements/${id}`);
  return response.data;
};

// Material Linking to Elements
export const linkMaterialToElement = async (elementId, materialId) => {
  const response = await api.post(`/api/showroom/admin/elements/${elementId}/link-material`, {
    material_id: materialId,
  });
  return response.data;
};

export const unlinkMaterialFromElement = async (elementId, materialId) => {
  const response = await api.delete(`/api/showroom/admin/elements/${elementId}/unlink-material/${materialId}`);
  return response.data;
};

// Demo Data
export const seedDemoData = async () => {
  const response = await api.post('/api/showroom/admin/seed-demo');
  return response.data;
};

export const clearDemoData = async () => {
  const response = await api.delete('/api/showroom/admin/clear-demo');
  return response.data;
};
