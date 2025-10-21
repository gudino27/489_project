import { API_URL } from '../constants/config';

export const designsApi = {
  // Get all designs with optional filter
  getDesigns: async (token, status = null) => {
    try {
      const url = status
        ? `${API_URL}/api/designs?status=${status}`
        : `${API_URL}/api/designs`;

      console.log('📡 Fetching designs from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch designs: ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 Designs received:', Array.isArray(data) ? data.length : 'Not an array', data);
      
      // Server returns a plain array of designs
      if (!Array.isArray(data)) {
        console.error('❌ Expected array but got:', typeof data, data);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching designs:', error);
      throw error;
    }
  },

  // Get design statistics
  getStats: async (token) => {
    try {
      console.log('📊 Fetching design stats...');

      const response = await fetch(`${API_URL}/api/designs/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch design stats: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Stats received:', data);
      
      // Server returns stats object directly
      return data;
    } catch (error) {
      console.error('❌ Error fetching design stats:', error);
      throw error;
    }
  },

  // Get single design details (also marks as viewed)
  getDesignById: async (token, designId) => {
    try {
      console.log('🔍 Fetching design details for ID:', designId);

      const response = await fetch(`${API_URL}/api/designs/${designId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch design details: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 Design details received:', data);
      
      // Server returns design object directly
      return data;
    } catch (error) {
      console.error('❌ Error fetching design details:', error);
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
