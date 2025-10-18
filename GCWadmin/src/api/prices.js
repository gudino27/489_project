import { API_BASE, createAuthHeaders, createAuthHeadersJson } from './config';

export const pricesApi = {
  // Get cabinet prices
  getCabinetPrices: async (token) => {
    const response = await fetch(`${API_BASE}/api/prices/cabinets`, {
      headers: createAuthHeaders(token)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch cabinet prices');
  },

  // Update cabinet prices
  updateCabinetPrices: async (token, prices) => {
    const response = await fetch(`${API_BASE}/api/prices/cabinets`, {
      method: 'PUT',
      headers: createAuthHeadersJson(token),
      body: JSON.stringify(prices)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to update cabinet prices');
  },

  // Get material multipliers
  getMaterialMultipliers: async (token) => {
    const response = await fetch(`${API_BASE}/api/prices/materials`, {
      headers: createAuthHeaders(token)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch materials');
  },

  // Update material multipliers
  updateMaterialMultipliers: async (token, materials) => {
    const response = await fetch(`${API_BASE}/api/prices/materials`, {
      method: 'PUT',
      headers: createAuthHeadersJson(token),
      body: JSON.stringify(materials)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to update materials');
  },

  // Get color pricing
  getColorPricing: async (token) => {
    const response = await fetch(`${API_BASE}/api/prices/colors`, {
      headers: createAuthHeaders(token)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch color pricing');
  },

  // Update color pricing
  updateColorPricing: async (token, colors) => {
    const response = await fetch(`${API_BASE}/api/prices/colors`, {
      method: 'PUT',
      headers: createAuthHeadersJson(token),
      body: JSON.stringify(colors)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to update color pricing');
  },

  // Get wall pricing
  getWallPricing: async (token) => {
    const response = await fetch(`${API_BASE}/api/prices/walls`, {
      headers: createAuthHeaders(token)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch wall pricing');
  },

  // Update wall pricing
  updateWallPricing: async (token, walls) => {
    const response = await fetch(`${API_BASE}/api/prices/walls`, {
      method: 'PUT',
      headers: createAuthHeadersJson(token),
      body: JSON.stringify(walls)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to update wall pricing');
  },

  // Get wall availability
  getWallAvailability: async (token) => {
    const response = await fetch(`${API_BASE}/api/prices/wall-availability`, {
      headers: createAuthHeaders(token)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch wall availability');
  },

  // Update wall availability
  updateWallAvailability: async (token, availability) => {
    const response = await fetch(`${API_BASE}/api/prices/wall-availability`, {
      method: 'PUT',
      headers: createAuthHeadersJson(token),
      body: JSON.stringify(availability)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to update wall availability');
  },

  // Load all prices at once
  loadAllPrices: async (token) => {
    const [cabinets, materials, colors, walls, wallAvailability] = await Promise.all([
      pricesApi.getCabinetPrices(token),
      pricesApi.getMaterialMultipliers(token),
      pricesApi.getColorPricing(token),
      pricesApi.getWallPricing(token),
      pricesApi.getWallAvailability(token)
    ]);

    return {
      cabinets,
      materials,
      colors,
      walls,
      wallAvailability
    };
  },

  // Save all prices at once
  saveAllPrices: async (token, { cabinets, materials, colors, walls, wallAvailability }) => {
    const responses = await Promise.all([
      pricesApi.updateCabinetPrices(token, cabinets),
      pricesApi.updateMaterialMultipliers(token, materials),
      pricesApi.updateColorPricing(token, colors),
      pricesApi.updateWallPricing(token, walls),
      pricesApi.updateWallAvailability(token, wallAvailability)
    ]);

    return responses.every(r => r !== null);
  }
};

export default pricesApi;
