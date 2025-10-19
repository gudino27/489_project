/**
 * Biometric Authentication Utility
 * Handles Face ID/Touch ID for secure refresh token storage
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REFRESH_TOKEN_KEY = 'refresh_token_secure';
const DEVICE_ID_KEY = 'device_id';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_PROMPT_SHOWN_KEY = 'biometric_prompt_shown';

/**
 * Check if device supports biometric authentication
 * @returns {Promise<{supported: boolean, type: string}>}
 */
export async function checkBiometricSupport() {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricType = 'none';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'face';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
    }

    return {
      supported: compatible && enrolled,
      type: biometricType,
      enrolled
    };
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return { supported: false, type: 'none', enrolled: false };
  }
}

/**
 * Authenticate user with biometrics
 * @param {string} reason - Reason for authentication (displayed to user)
 * @returns {Promise<boolean>} - Success status
 */
export async function authenticateWithBiometrics(reason = 'Authenticate to continue') {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false, // Allow passcode as fallback
      cancelLabel: 'Cancel'
    });

    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
}

/**
 * Store refresh token securely
 * @param {string} refreshToken - The refresh token to store
 * @returns {Promise<boolean>} - Success status
 */
export async function storeRefreshToken(refreshToken) {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    });
    return true;
  } catch (error) {
    console.error('Error storing refresh token:', error);
    return false;
  }
}

/**
 * Retrieve refresh token with biometric authentication
 * @param {boolean} requireBiometric - Whether to require biometric auth
 * @returns {Promise<string|null>} - Refresh token or null
 */
export async function getRefreshToken(requireBiometric = true) {
  try {
    // Check if user has enabled biometric
    const userEnabled = await isBiometricEnabled();

    // Check if biometric is required, enabled by user, and supported by device
    if (requireBiometric && userEnabled) {
      const biometricSupport = await checkBiometricSupport();

      if (biometricSupport.supported) {
        const authenticated = await authenticateWithBiometrics(
          'Unlock to access your account'
        );

        if (!authenticated) {
          console.log('Biometric authentication failed or cancelled');
          return null;
        }
      }
    }

    // Retrieve token from secure storage
    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error retrieving refresh token:', error);
    return null;
  }
}

/**
 * Delete refresh token from secure storage
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteRefreshToken() {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error deleting refresh token:', error);
    return false;
  }
}

/**
 * Get or generate device ID for this device
 * @returns {Promise<string>} - Device ID
 */
export async function getDeviceId() {
  try {
    // Try to get existing device ID
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    // Generate new one if doesn't exist
    if (!deviceId) {
      deviceId = `${Device.osName}-${Device.modelName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to a generated ID
    return `${Device.osName}-${Date.now()}`;
  }
}

/**
 * Get device type string
 * @returns {string} - Device type (ios/android)
 */
export function getDeviceType() {
  return Device.osName?.toLowerCase() || 'unknown';
}

/**
 * Check if user has been prompted for biometric setup
 * @returns {Promise<boolean>} - Whether prompt has been shown
 */
export async function hasShownBiometricPrompt() {
  try {
    const shown = await AsyncStorage.getItem(BIOMETRIC_PROMPT_SHOWN_KEY);
    return shown === 'true';
  } catch (error) {
    console.error('Error checking biometric prompt status:', error);
    return false;
  }
}

/**
 * Mark that biometric prompt has been shown
 * @returns {Promise<void>}
 */
export async function markBiometricPromptShown() {
  try {
    await AsyncStorage.setItem(BIOMETRIC_PROMPT_SHOWN_KEY, 'true');
  } catch (error) {
    console.error('Error marking biometric prompt as shown:', error);
  }
}

/**
 * Enable biometric authentication
 * @returns {Promise<boolean>} - Success status
 */
export async function enableBiometric() {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    return true;
  } catch (error) {
    console.error('Error enabling biometric:', error);
    return false;
  }
}

/**
 * Disable biometric authentication
 * @returns {Promise<boolean>} - Success status
 */
export async function disableBiometric() {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
    return true;
  } catch (error) {
    console.error('Error disabling biometric:', error);
    return false;
  }
}

/**
 * Check if user has enabled biometric authentication
 * @returns {Promise<boolean>} - Whether biometric is enabled by user
 */
export async function isBiometricEnabled() {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking biometric enabled status:', error);
    return false;
  }
}
