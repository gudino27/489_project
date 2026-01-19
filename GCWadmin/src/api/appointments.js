import api from './client';

// Get all appointments
export const getAppointments = async () => {
  const response = await api.get('/api/admin/appointments');
  return response.data;
};

// Create appointment
export const createAppointment = async (appointmentData) => {
  const response = await api.post('/api/admin/appointments', appointmentData);
  return response.data;
};

// Update appointment
export const updateAppointment = async (id, appointmentData) => {
  const response = await api.put(`/api/admin/appointments/${id}`, appointmentData);
  return response.data;
};

// Delete appointment
export const deleteAppointment = async (id) => {
  const response = await api.delete(`/api/admin/appointments/${id}`);
  return response.data;
};

// Get employee availability
export const getAvailability = async () => {
  const response = await api.get('/api/admin/availability');
  return response.data;
};

// Create availability
export const createAvailability = async (availabilityData) => {
  const response = await api.post('/api/admin/availability', availabilityData);
  return response.data;
};

// Update availability
export const updateAvailability = async (id, availabilityData) => {
  const response = await api.put(`/api/admin/availability/${id}`, availabilityData);
  return response.data;
};

// Delete availability
export const deleteAvailability = async (id) => {
  const response = await api.delete(`/api/admin/availability/${id}`);
  return response.data;
};

// Get blocked times
export const getBlockedTimes = async () => {
  const response = await api.get('/api/admin/blocked-times');
  return response.data;
};

// Create blocked time
export const createBlockedTime = async (blockedTimeData) => {
  const response = await api.post('/api/admin/blocked-times', blockedTimeData);
  return response.data;
};

// Delete blocked time
export const deleteBlockedTime = async (id) => {
  const response = await api.delete(`/api/admin/blocked-times/${id}`);
  return response.data;
};
