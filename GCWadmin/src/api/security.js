import api from './client';

// Get security logs
export const getSecurityLogs = async () => {
  const response = await api.get('/api/security/logs');
  return response.data;
};

// Get failed login attempts
export const getFailedLogins = async () => {
  const response = await api.get('/api/security/failed-logins');
  return response.data;
};

// Get active sessions
export const getActiveSessions = async () => {
  const response = await api.get('/api/security/sessions');
  return response.data;
};

// Terminate session
export const terminateSession = async (sessionId) => {
  const response = await api.delete(`/api/security/sessions/${sessionId}`);
  return response.data;
};
