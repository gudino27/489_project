import apiClient from './client';

// Get all invoices
export const getAllInvoices = async () => {
  try {
    const response = await apiClient.get('/api/admin/invoices');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to get invoices' };
  }
};

// Get invoice by ID
export const getInvoiceById = async (id) => {
  try {
    const response = await apiClient.get(`/api/admin/invoices/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to get invoice' };
  }
};

// Create new invoice
export const createInvoice = async (invoiceData) => {
  try {
    const response = await apiClient.post('/api/admin/invoices', invoiceData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to create invoice' };
  }
};

// Update invoice
export const updateInvoice = async (id, invoiceData) => {
  try {
    const response = await apiClient.put(`/api/admin/invoices/${id}`, invoiceData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to update invoice' };
  }
};

// Delete invoice
export const deleteInvoice = async (id) => {
  try {
    const response = await apiClient.delete(`/api/admin/invoices/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to delete invoice' };
  }
};

// Get invoice tracking data
export const getInvoiceTracking = async () => {
  try {
    const response = await apiClient.get('/api/admin/invoices/tracking');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to get invoice tracking' };
  }
};

// Email invoice
export const emailInvoice = async (id, emailData) => {
  try {
    const response = await apiClient.post(`/api/admin/invoices/${id}/email`, emailData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to send invoice email' };
  }
};

// Send SMS reminder
export const sendInvoiceSMS = async (id, smsData) => {
  try {
    const response = await apiClient.post(`/api/admin/invoices/${id}/sms`, smsData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to send SMS' };
  }
};

// Generate invoice PDF
export const generateInvoicePDF = async (id, language = 'en') => {
  try {
    const response = await apiClient.get(`/api/admin/invoices/${id}/pdf`, {
      params: { lang: language },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to generate PDF' };
  }
};

// Add payment to invoice
export const addPayment = async (id, paymentData) => {
  try {
    const response = await apiClient.post(`/api/admin/invoices/${id}/payments`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to add payment' };
  }
};

// Get clients
export const getAllClients = async () => {
  try {
    const response = await apiClient.get('/api/admin/clients');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to get clients' };
  }
};

// Search clients
export const searchClients = async (searchTerm) => {
  try {
    const response = await apiClient.get('/api/admin/clients/search', {
      params: { q: searchTerm },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to search clients' };
  }
};

// Create client
export const createClient = async (clientData) => {
  try {
    const response = await apiClient.post('/api/admin/clients', clientData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to create client' };
  }
};

// Get line item labels
export const getLineItemLabels = async () => {
  try {
    const response = await apiClient.get('/api/admin/line-item-labels');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to get line item labels' };
  }
};

// Get tax rates
export const getTaxRates = async () => {
  try {
    const response = await apiClient.get('/api/admin/tax-rates');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to get tax rates' };
  }
};
