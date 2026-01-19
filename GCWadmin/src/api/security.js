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

// Get failed logins with time filter
export const getFailedLoginsByHours = async (hours = 24) => {
  const response = await api.get(`/api/admin/security/failed-logins?hours=${hours}`);
  return response.data;
};

// Get locked accounts
export const getLockedAccounts = async () => {
  const response = await api.get('/api/admin/security/locked-accounts');
  return response.data;
};

// Unlock account
export const unlockAccount = async (userId) => {
  const response = await api.post(`/api/admin/security/unlock-account/${userId}`);
  return response.data;
};

// Get activity logs with filter
export const getActivityLogs = async (action = 'all', limit = 100) => {
  const actionParam = action === 'all' ? '' : `&action=${action}`;
  const response = await api.get(`/api/admin/security/activity-logs?limit=${limit}${actionParam}`);
  return response.data;
};
