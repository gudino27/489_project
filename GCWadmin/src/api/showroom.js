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
