import { API_URL } from '../constants/config';

export const analyticsApi = {
  // Get analytics stats
  getStats: async (token, days = 30) => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/stats?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics stats:', error);
      throw error;
    }
  },

  // Get realtime stats
  getRealtimeStats: async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/realtime`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch realtime stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching realtime stats:', error);
      throw error;
    }
  },

  // Get testimonial analytics
  getTestimonialAnalytics: async (token, days = 30) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/testimonial-analytics?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch testimonial analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching testimonial analytics:', error);
      throw error;
    }
  },
};
