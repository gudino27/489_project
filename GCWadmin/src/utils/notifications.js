import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_URL, EAS_PROJECT_ID } from '../constants/config';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get Expo push token
 * @param {string} authToken - User authentication token
 * @param {number} userId - User ID
 * @returns {Promise<string|null>} Expo push token or null if failed
 */
export async function registerForPushNotificationsAsync(authToken, userId) {
  let token;

  // Check if running on physical device
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission to receive push notifications was denied');
    return null;
  }

  try {
    // Get Expo push token with explicit project ID
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID
    });
    token = pushTokenData.data;

    // Register token with backend
    await registerTokenWithBackend(token, authToken, userId);

    console.log('Push token registered:', token);
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Register push token with backend server
 * @param {string} pushToken - Expo push token
 * @param {string} authToken - User authentication token
 * @param {number} userId - User ID
 */
async function registerTokenWithBackend(pushToken, authToken, userId) {
  try {
    console.log('Registering push token with:', `${API_URL}/api/admin/push-tokens`);
    console.log('Auth token:', authToken ? 'Present' : 'Missing');
    console.log('User ID:', userId);

    const response = await fetch(`${API_URL}/api/admin/push-tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: pushToken,
        user_id: userId,
        device_type: Platform.OS,
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Backend error:', errorData);
      throw new Error(`Failed to register push token: ${response.status} - ${errorData}`);
    }

    console.log('Push token registered with backend');
  } catch (error) {
    console.error('Error registering token with backend:', error);
    throw error;
  }
}

/**
 * Remove push token from backend when user logs out
 * @param {string} pushToken - Expo push token to remove
 * @param {string} authToken - User authentication token
 */
export async function unregisterPushToken(pushToken, authToken) {
  try {
    await fetch(`${API_URL}/api/admin/push-tokens/${pushToken}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Push token unregistered');
  } catch (error) {
    console.error('Error unregistering push token:', error);
  }
}

/**
 * Set up notification listeners
 * @returns {Object} Subscription objects to clean up later
 */
export function setupNotificationListeners() {
  // Listen for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Listen for user interactions with notifications
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification clicked:', response);

    // Handle navigation based on notification data
    const data = response.notification.request.content.data;
    if (data?.screen) {
      // You can navigate to specific screens based on notification data
      console.log('Navigate to:', data.screen);
    }
  });

  return {
    notificationListener,
    responseListener,
  };
}

/**
 * Clean up notification listeners
 * @param {Object} listeners - Notification listener subscriptions
 */
export function cleanupNotificationListeners(listeners) {
  if (listeners?.notificationListener) {
    Notifications.removeNotificationSubscription(listeners.notificationListener);
  }
  if (listeners?.responseListener) {
    Notifications.removeNotificationSubscription(listeners.responseListener);
  }
}
