import { API_BASE, createAuthHeaders } from './config';

export const employeesApi = {
  // Get all employees
  getEmployees: async (token) => {
    const response = await fetch(`${API_BASE}/api/employees`, {
      headers: createAuthHeaders(token)
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch employees');
  },

  // Add employee
  addEmployee: async (token, formData) => {
    const response = await fetch(`${API_BASE}/api/employees`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: formData
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to add employee');
  },

  // Update employee
  updateEmployee: async (token, employeeId, formData) => {
    const response = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
      method: 'PUT',
      headers: createAuthHeaders(token),
      body: formData
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to update employee');
  },

  // Delete employee
  deleteEmployee: async (token, employeeId) => {
    const response = await fetch(`${API_BASE}/api/employees/${employeeId}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token)
    });
    if (response.ok) {
      return true;
    }
    throw new Error('Failed to delete employee');
  },

  // Reorder employees
  reorderEmployees: async (token, employeeIds) => {
    const response = await fetch(`${API_BASE}/api/employees/reorder`, {
      method: 'PUT',
      headers: {
        ...createAuthHeaders(token),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ employeeIds })
    });
    if (response.ok || response.status === 204) {
      return true;
    }
    throw new Error('Failed to reorder employees');
  }
};

export default employeesApi;
