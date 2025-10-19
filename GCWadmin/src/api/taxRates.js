import api from './client';

// Get all tax rates
export const getTaxRates = async () => {
  const response = await api.get('/api/admin/tax-rates');
  return response.data;
};

// Create new tax rate
export const createTaxRate = async (taxRateData) => {
  const response = await api.post('/api/admin/tax-rates', taxRateData);
  return response.data;
};

// Update tax rate
export const updateTaxRate = async (taxRateId, taxRateData) => {
  const response = await api.put(`/api/admin/tax-rates/${taxRateId}`, taxRateData);
  return response.data;
};

// Delete tax rate
export const deleteTaxRate = async (taxRateId) => {
  const response = await api.delete(`/api/admin/tax-rates/${taxRateId}`);
  return response.data;
};

// Bulk create tax rates
export const bulkCreateTaxRates = async (taxRatesArray) => {
  const response = await api.post('/api/admin/tax-rates/bulk', { taxRates: taxRatesArray });
  return response.data;
};
