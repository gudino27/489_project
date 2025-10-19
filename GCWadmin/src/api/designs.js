import { API_URL } from '../constants/config';

export const designsApi = {
  // Get all designs with optional filter
  getDesigns: async (token, status = null) => {
    try {
      const url = status
        ? `${API_URL}/api/designs?status=${status}`
        : `${API_URL}/api/designs`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch designs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching designs:', error);
      throw error;
    }
  },

  // Get design statistics
  getStats: async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/designs/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch design stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching design stats:', error);
      throw error;
    }
  },

  // Get single design details (also marks as viewed)
  getDesignById: async (token, designId) => {
    try {
      const response = await fetch(`${API_URL}/api/designs/${designId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch design details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching design details:', error);
      throw error;
    }
  },

  // Delete a design
  deleteDesign: async (token, designId) => {
    try {
      const response = await fetch(`${API_URL}/api/designs/${designId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete design');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting design:', error);
      throw error;
    }
  },

  // Download design PDF (returns the download URL)
  getDesignPdfUrl: (designId) => {
    return `${API_URL}/api/designs/${designId}/pdf`;
  },

  // Update design status
  updateStatus: async (token, designId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/designs/${designId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  },

  // Update admin note
  updateNote: async (token, designId, note) => {
    try {
      const response = await fetch(`${API_URL}/api/designs/${designId}/note`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },
};
