import api from './client';

// Get analytics data
export const getAnalytics = async () => {
  const response = await api.get('/api/analytics');
  return response.data;
};

// Get revenue metrics
export const getRevenueMetrics = async (startDate, endDate) => {
  const response = await api.get('/api/analytics/revenue', {
    params: { startDate, endDate },
  });
  return response.data;
};

// Get customer analytics
export const getCustomerAnalytics = async () => {
  const response = await api.get('/api/analytics/customers');
  return response.data;
};
