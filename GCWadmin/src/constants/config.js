import Config from 'react-native-config';

export const API_BASE = Config.API_BASE || 'https://api.gudinocustom.com';
export const API_URL = Config.API_URL || 'https://api.gudinocustom.com';
export const JWT_EXPIRES_IN = Config.JWT_EXPIRES_IN || '24h';

// App configuration
export const APP_CONFIG = {
  bundleId: 'com.gudinocustom.admin',
  displayName: 'GC Admin',
  minIOSVersion: '16.0',
  targetIOSVersion: '18.0',
};
