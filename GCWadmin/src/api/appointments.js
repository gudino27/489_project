import api from './client';

/**
 * Appointments API Module
 * Handles all appointment-related API calls matching webapp functionality
 */

// Get all appointments with filters
export const getAppointments = async (statusFilter = 'all', dateFilter = 'upcoming') => {
  const response = await api.get(`/api/admin/appointments?status=${statusFilter}&filter=${dateFilter}`);
  return response.data;
};

// Get employees list
export const getEmployees = async () => {
  const response = await api.get('/api/employees');
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
export const getEmployeeAvailability = async (employeeId) => {
  const response = await api.get(`/api/admin/employees/${employeeId}/availability`);
  return response.data;
};

// Create employee availability
export const createAvailability = async (availabilityData) => {
  const response = await api.post('/api/admin/employee-availability', availabilityData);
  return response.data;
};

// Update availability
export const updateAvailability = async (id, availabilityData) => {
  const response = await api.put(`/api/admin/employee-availability/${id}`, availabilityData);
  return response.data;
};

// Delete availability
export const deleteAvailability = async (id) => {
  const response = await api.delete(`/api/admin/employee-availability/${id}`);
  return response.data;
};

// Get blocked times for an employee
export const getBlockedTimes = async (employeeId = null) => {
  const url = employeeId
    ? `/api/admin/employees/${employeeId}/blocked-times`
    : '/api/admin/blocked-times';
  const response = await api.get(url);
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

// Handle reschedule request
export const handleRescheduleRequest = async (appointmentId, action) => {
  const response = await api.post(`/api/admin/appointments/${appointmentId}/reschedule`, { action });
  return response.data;
};
