import api from './client';

// Get all timelines
export const getTimelines = async () => {
  const response = await api.get('/api/admin/timelines');
  return response.data;
};

// Create timeline
export const createTimeline = async (timelineData) => {
  const response = await api.post('/api/admin/timeline', timelineData);
  return response.data;
};

// Update timeline
export const updateTimeline = async (id, timelineData) => {
  const response = await api.put(`/api/admin/timeline/${id}`, timelineData);
  return response.data;
};

// Delete timeline
export const deleteTimeline = async (id) => {
  const response = await api.delete(`/api/admin/timeline/${id}`);
  return response.data;
};

// Add phase to timeline
export const addTimelinePhase = async (timelineId, phaseData) => {
  const response = await api.post(`/api/admin/timeline/${timelineId}/phase`, phaseData);
  return response.data;
};

// Update timeline phase
export const updateTimelinePhase = async (timelineId, phaseId, phaseData) => {
  const response = await api.put(`/api/admin/timeline/${timelineId}/phase/${phaseId}`, phaseData);
  return response.data;
};

// Delete timeline phase
export const deleteTimelinePhase = async (timelineId, phaseId) => {
  const response = await api.delete(`/api/admin/timeline/${timelineId}/phase/${phaseId}`);
  return response.data;
};
