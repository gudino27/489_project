import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Login
export const login = async (username, password) => {
  try {
    const response = await apiClient.post('/api/auth/login', {
      username,
      password,
    });

    if (response.data.token && response.data.user) {
      // Save token and user to AsyncStorage
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Login failed' };
  }
};

// Logout
export const logout = async () => {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of API call result
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/api/auth/me');
    return response.data.user;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to get user' };
  }
};

// Validate session
export const validateSession = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      return null;
    }

    const user = await getCurrentUser();
    return user;
  } catch (error) {
    // Session invalid, clear storage
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    return null;
  }
};

// Forgot password
export const forgotPassword = async (email) => {
  try {
    const response = await apiClient.post('/api/auth/forgot-password', {
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to send reset email' };
  }
};
