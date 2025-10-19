import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync, unregisterPushToken } from '../utils/notifications';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE = 'https://api.gudinocustom.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pushToken, setPushToken] = useState(null);

  // Initialize session on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Try multiple token keys for backwards compatibility
      const savedToken = await AsyncStorage.getItem('auth_token') ||
                         await AsyncStorage.getItem('authToken') ||
                         await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('auth_user') ||
                        await AsyncStorage.getItem('user');
      const savedPushToken = await AsyncStorage.getItem('push_token');

      if (savedToken && savedUser) {
        // Validate session with backend
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(savedToken);
          setIsAuthenticated(true);

          // Restore push token if available
          if (savedPushToken) {
            setPushToken(savedPushToken);
          } else {
            // Re-register for push notifications if token was lost
            const expoPushToken = await registerForPushNotificationsAsync(savedToken, data.user.id);
            if (expoPushToken) {
              setPushToken(expoPushToken);
              await AsyncStorage.setItem('push_token', expoPushToken);
            }
          }
        } else {
          // Session invalid, clear storage
          await clearSession();
        }
      }
    } catch (error) {
      console.error('Session initialization error:', error);
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Save session with multiple keys for backwards compatibility
        await AsyncStorage.setItem('auth_token', data.token);
        await AsyncStorage.setItem('authToken', data.token); // Backwards compatibility
        await AsyncStorage.setItem('token', data.token); // Additional compatibility
        await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
        await AsyncStorage.setItem('user', JSON.stringify(data.user)); // Backwards compatibility

        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);

        console.log('✅ Login successful, token saved');

        // Register for push notifications
        const expoPushToken = await registerForPushNotificationsAsync(data.token, data.user.id);
        if (expoPushToken) {
          setPushToken(expoPushToken);
          await AsyncStorage.setItem('push_token', expoPushToken);
        }

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);

      // Fallback for development
      if (username === 'admin' && password === 'testing') {
        const mockUser = { username: 'admin', role: 'admin', id: 1 };
        const mockToken = 'development-token';

        await AsyncStorage.setItem('auth_token', mockToken);
        await AsyncStorage.setItem('authToken', mockToken);
        await AsyncStorage.setItem('token', mockToken);
        await AsyncStorage.setItem('auth_user', JSON.stringify(mockUser));
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));

        setUser(mockUser);
        setToken(mockToken);
        setIsAuthenticated(true);

        console.log('✅ Development login successful, token saved');

        // Register for push notifications in development too
        const expoPushToken = await registerForPushNotificationsAsync(mockToken, mockUser.id);
        if (expoPushToken) {
          setPushToken(expoPushToken);
          await AsyncStorage.setItem('push_token', expoPushToken);
        }

        return { success: true };
      }

      return { success: false, error: 'Failed to connect to server' };
    }
  };

  const logout = async () => {
    try {
      // Unregister push token before logging out
      if (pushToken && token) {
        await unregisterPushToken(pushToken, token);
        await AsyncStorage.removeItem('push_token');
      }

      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    await clearSession();
  };

  const clearSession = async () => {
    // Clear all token variants
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('auth_user');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('push_token');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setPushToken(null);
  };

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`
  });

  const getAuthHeadersJson = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    getAuthHeaders,
    getAuthHeadersJson,
    API_BASE
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
