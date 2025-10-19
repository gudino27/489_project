/**
 * API Helper with Auto-Refresh
 * Automatically refreshes access tokens when they expire
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRefreshToken } from './biometricAuth';

const API_BASE = 'https://api.gudinocustom.com';

let refreshTokenPromise = null;

/**
 * Make an authenticated API request with auto-refresh
 * @param {string} endpoint - API endpoint (e.g., '/api/admin/invoices')
 * @param {Object} options - Fetch options
 * @param {Function} refreshAccessToken - Function to refresh access token from AuthContext
 * @returns {Promise<Response>} - Fetch response
 */
export async function apiRequest(endpoint, options = {}, refreshAccessToken = null) {
  // Get current access token
  let token = await AsyncStorage.getItem('auth_token');

  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  // Make the request
  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  // If unauthorized and we have a refresh function, try to refresh
  if (response.status === 401 && refreshAccessToken) {
    console.log('Access token expired, attempting auto-refresh...');

    // Prevent multiple simultaneous refresh attempts
    if (!refreshTokenPromise) {
      refreshTokenPromise = refreshAccessToken().finally(() => {
        refreshTokenPromise = null;
      });
    }

    const refreshed = await refreshTokenPromise;

    if (refreshed) {
      // Retry request with new token
      token = await AsyncStorage.getItem('auth_token');
      headers['Authorization'] = `Bearer ${token}`;

      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });
    }
  }

  return response;
}

/**
 * Convenience method for GET requests
 */
export async function apiGet(endpoint, refreshAccessToken = null) {
  return apiRequest(endpoint, { method: 'GET' }, refreshAccessToken);
}

/**
 * Convenience method for POST requests
 */
export async function apiPost(endpoint, data, refreshAccessToken = null) {
  return apiRequest(
    endpoint,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    },
    refreshAccessToken
  );
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut(endpoint, data, refreshAccessToken = null) {
  return apiRequest(
    endpoint,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    },
    refreshAccessToken
  );
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete(endpoint, refreshAccessToken = null) {
  return apiRequest(endpoint, { method: 'DELETE' }, refreshAccessToken);
}

/**
 * Example usage in a component:
 *
 * import { apiGet, apiPost } from '../utils/api';
 * import { useAuth } from '../contexts/AuthContext';
 *
 * function MyComponent() {
 *   const { refreshAccessToken } = useAuth();
 *
 *   const fetchData = async () => {
 *     const response = await apiGet('/api/admin/invoices', refreshAccessToken);
 *     const data = await response.json();
 *     return data;
 *   };
 *
 *   const updateData = async (invoiceData) => {
 *     const response = await apiPost('/api/admin/invoices', invoiceData, refreshAccessToken);
 *     return response;
 *   };
 * }
 */
