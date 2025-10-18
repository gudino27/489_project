// API Configuration
export const API_BASE = 'https://api.gudinocustom.com';

// Helper function to create headers with auth token
export const createAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`
});

export const createAuthHeadersJson = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

// Handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return error.response.data?.error || 'Server error occurred';
  } else if (error.request) {
    // Request made but no response
    return 'Network error - please check your connection';
  } else {
    // Error in request setup
    return error.message || 'An error occurred';
  }
};
