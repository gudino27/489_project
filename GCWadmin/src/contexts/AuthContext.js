import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync, unregisterPushToken } from '../utils/notifications';
import {
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  getDeviceId,
  getDeviceType,
  checkBiometricSupport,
  hasShownBiometricPrompt,
  markBiometricPromptShown,
  enableBiometric,
  disableBiometric,
  isBiometricEnabled
} from '../utils/biometricAuth';

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
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const refreshingToken = useRef(false);

  // Initialize session on app start
  useEffect(() => {
    initializeAuth();
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const support = await checkBiometricSupport();
    const userEnabled = await isBiometricEnabled();
    setBiometricEnabled(support.supported && userEnabled);
  };

  const promptEnableBiometric = async () => {
    const support = await checkBiometricSupport();
    const hasPrompted = await hasShownBiometricPrompt();

    // Only prompt if device supports biometric and we haven't asked before
    if (support.supported && !hasPrompted) {
      await markBiometricPromptShown();
      return {
        shouldPrompt: true,
        biometricType: support.type === 'face' ? 'Face ID' : 'Touch ID'
      };
    }

    return { shouldPrompt: false };
  };

  const initializeAuth = async () => {
    try {
      // Try to get saved access token
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
            const expoPushToken = await registerForPushNotificationsAsync(savedToken, data.user.id);
            if (expoPushToken) {
              setPushToken(expoPushToken);
              await AsyncStorage.setItem('push_token', expoPushToken);
            }
          }
        } else if (response.status === 401) {
          // Access token expired, try to refresh with refresh token
          console.log('Access token expired, attempting refresh...');
          const refreshed = await refreshAccessToken();

          if (!refreshed) {
            // Refresh failed, clear session
            await clearSession();
          }
        } else {
          await clearSession();
        }
      } else {
        // No saved token, try refresh token with biometric auth
        const refreshed = await refreshAccessToken();

        if (!refreshed) {
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

  const refreshAccessToken = async () => {
    // Prevent multiple simultaneous refresh attempts
    if (refreshingToken.current) {
      return false;
    }

    refreshingToken.current = true;

    try {
      // Get refresh token from secure storage (may require biometric auth)
      // Pass true to require biometric if user has enabled it
      const refreshToken = await getRefreshToken(true);

      if (!refreshToken) {
        console.log('No refresh token available');
        refreshingToken.current = false;
        return false;
      }

      // Request new access token
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();

        // Save new access token
        await AsyncStorage.setItem('auth_token', data.token);
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);

        console.log('✅ Access token refreshed successfully');

        // Re-register push notifications if needed
        const savedPushToken = await AsyncStorage.getItem('push_token');
        if (!savedPushToken) {
          const expoPushToken = await registerForPushNotificationsAsync(data.token, data.user.id);
          if (expoPushToken) {
            setPushToken(expoPushToken);
            await AsyncStorage.setItem('push_token', expoPushToken);
          }
        }

        refreshingToken.current = false;
        return true;
      } else {
        console.log('Refresh token expired or invalid');
        refreshingToken.current = false;
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      refreshingToken.current = false;
      return false;
    }
  };

  const login = async (username, password) => {
    try {
      // Get device info for refresh token
      const deviceId = await getDeviceId();
      const deviceType = getDeviceType();

      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          deviceId,
          deviceType
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Save access token
        await AsyncStorage.setItem('auth_token', data.token);
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        // Store refresh token securely (in iOS Keychain)
        if (data.refreshToken) {
          await storeRefreshToken(data.refreshToken);
          console.log('✅ Refresh token stored securely');
        }

        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);

        console.log('✅ Login successful, tokens saved');

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
      // Get refresh token for revocation
      const refreshToken = await getRefreshToken(false); // Don't require biometric for logout

      // Unregister push token before logging out
      if (pushToken && token) {
        await unregisterPushToken(pushToken, token);
        await AsyncStorage.removeItem('push_token');
      }

      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });
      }

      // Delete refresh token from secure storage
      await deleteRefreshToken();
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
    biometricEnabled,
    login,
    logout,
    refreshAccessToken,
    promptEnableBiometric,
    enableBiometric,
    disableBiometric,
    getAuthHeaders,
    getAuthHeadersJson,
    API_BASE
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
