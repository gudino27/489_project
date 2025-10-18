import { API_BASE, createAuthHeaders, createAuthHeadersJson } from './config';

export const testimonialsApi = {
  // Get all testimonials
  getTestimonials: async (token) => {
    const response = await fetch(`${API_BASE}/api/admin/testimonials`, {
      headers: createAuthHeadersJson(token)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch testimonials');
  },

  // Get generated tokens
  getGeneratedTokens: async (token) => {
    const response = await fetch(`${API_BASE}/api/admin/testimonial-tokens`, {
      headers: createAuthHeadersJson(token)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch tokens');
  },

  // Send testimonial link
  sendTestimonialLink: async (token, linkData) => {
    const response = await fetch(`${API_BASE}/api/admin/testimonials/send-link`, {
      method: 'POST',
      headers: createAuthHeadersJson(token),
      body: JSON.stringify(linkData)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to send testimonial link');
  },

  // Update testimonial visibility
  updateTestimonial: async (token, testimonialId, updates) => {
    const response = await fetch(`${API_BASE}/api/admin/testimonials/${testimonialId}`, {
      method: 'PUT',
      headers: createAuthHeadersJson(token),
      body: JSON.stringify(updates)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to update testimonial');
  },

  // Delete testimonial
  deleteTestimonial: async (token, testimonialId) => {
    const response = await fetch(`${API_BASE}/api/admin/testimonials/${testimonialId}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token)
    });
    if (response.ok) {
      return true;
    }
    throw new Error('Failed to delete testimonial');
  },

  // Bulk update testimonials
  bulkUpdateTestimonials: async (token, testimonialIds, updates) => {
    const response = await fetch(`${API_BASE}/api/admin/testimonials/bulk-update`, {
      method: 'PUT',
      headers: createAuthHeadersJson(token),
      body: JSON.stringify({ testimonialIds, ...updates })
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to bulk update testimonials');
  }
};

export default testimonialsApi;
