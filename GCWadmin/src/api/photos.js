import { API_BASE, createAuthHeaders, createAuthHeadersJson } from './config';

export const photosApi = {
  // Get all photos
  getPhotos: async (token) => {
    const response = await fetch(`${API_BASE}/api/photos`, {
      headers: createAuthHeaders(token)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch photos');
  },

  // Upload photo
  uploadPhoto: async (token, formData) => {
    const response = await fetch(`${API_BASE}/api/photos`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: formData
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to upload photo');
  },

  // Update photo
  updatePhoto: async (token, photoId, updates) => {
    const response = await fetch(`${API_BASE}/api/photos/${photoId}`, {
      method: 'PUT',
      headers: createAuthHeadersJson(token),
      body: JSON.stringify(updates)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to update photo');
  },

  // Delete photo
  deletePhoto: async (token, photoId) => {
    const response = await fetch(`${API_BASE}/api/photos/${photoId}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token)
    });
    if (response.ok) {
      return true;
    }
    throw new Error('Failed to delete photo');
  },

  // Reorder photos
  reorderPhotos: async (token, photoIds) => {
    const response = await fetch(`${API_BASE}/api/photos/reorder`, {
      method: 'PUT',
      headers: createAuthHeadersJson(token),
      body: JSON.stringify({ photoIds })
    });
    if (response.ok || response.status === 204) {
      return true;
    }
    throw new Error('Failed to reorder photos');
  }
};

export default photosApi;
