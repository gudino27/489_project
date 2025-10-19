import Constants from 'expo-constants';

// Access environment variables from expo-constants
const expoConfig = Constants.expoConfig?.extra || {};

export const API_BASE = expoConfig.API_BASE || 'https://api.gudinocustom.com';
export const API_URL = expoConfig.API_URL || 'https://api.gudinocustom.com';
export const JWT_EXPIRES_IN = expoConfig.JWT_EXPIRES_IN || '24h';
export const EAS_PROJECT_ID = expoConfig.EAS_PROJECT_ID || 'daeaf20a-5b3d-4456-8e9c-ce1c3bce4cbe';

// App configuration
export const APP_CONFIG = {
  bundleId: 'com.gudinocustom.admin',
  displayName: 'GC Admin',
  minIOSVersion: '16.0',
  targetIOSVersion: '18.0',
  easProjectId: EAS_PROJECT_ID,
};
