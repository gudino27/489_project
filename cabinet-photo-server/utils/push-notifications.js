/**
 * Push Notification Utility
 * Handles sending push notifications via Expo Push Notification service
 */

const { userDb } = require('../db-helpers');

// Expo Push Notification API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a push notification to specific users
 * @param {number[]} userIds - Array of user IDs to send notification to
 * @param {Object} notification - Notification details
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} notification.data - Additional data to send with notification
 * @param {string} notification.sound - Sound to play (default: 'default')
 * @param {number} notification.badge - Badge count
 * @returns {Promise<Object>} - Result of sending notifications
 */
async function sendPushNotification(userIds, notification) {
  try {
    // Get active push tokens for the specified users
    const db = await userDb();
    const placeholders = userIds.map(() => '?').join(',');

    const tokens = await db.all(
      `SELECT token, user_id, device_type
       FROM push_tokens
       WHERE user_id IN (${placeholders}) AND is_active = 1`,
      userIds
    );

    if (tokens.length === 0) {
      console.log('⚠️ No active push tokens found for users:', userIds);
      return { success: true, sent: 0, message: 'No active push tokens found' };
    }

    // Prepare messages for Expo Push API
    const messages = tokens.map(tokenData => ({
      to: tokenData.token,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      badge: notification.badge || 0,
      priority: 'high',
      channelId: 'default'
    }));

    // Send notifications to Expo Push API
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Expo Push API error:', result);
      throw new Error('Failed to send push notifications');
    }

    // Process results and handle errors
    const errors = [];
    const successes = [];

    result.data.forEach((ticket, index) => {
      if (ticket.status === 'error') {
        errors.push({
          token: tokens[index].token,
          error: ticket.message,
          details: ticket.details
        });

        // If token is invalid, mark it as inactive
        if (ticket.details?.error === 'DeviceNotRegistered') {
          db.run(
            'UPDATE push_tokens SET is_active = 0 WHERE token = ?',
            [tokens[index].token]
          ).catch(err => console.error('Error deactivating token:', err));
        }
      } else {
        successes.push({
          token: tokens[index].token,
          ticketId: ticket.id
        });

        // Update last_used_at for successful sends
        db.run(
          'UPDATE push_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token = ?',
          [tokens[index].token]
        ).catch(err => console.error('Error updating token last_used_at:', err));
      }
    });

    console.log(`✅ Push notifications sent: ${successes.length} success, ${errors.length} errors`);

    if (errors.length > 0) {
      console.error('Push notification errors:', errors);
    }

    return {
      success: true,
      sent: successes.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('❌ Error sending push notifications:', error);
    throw error;
  }
}

/**
 * Send notification to all admin users
 * @param {Object} notification - Notification details
 * @returns {Promise<Object>} - Result of sending notifications
 */
async function sendToAdmins(notification) {
  try {
    const db = await userDb();

    // Get all admin user IDs
    const admins = await db.all(
      `SELECT id FROM users WHERE role = 'admin' AND is_active = 1`
    );

    if (admins.length === 0) {
      console.log('⚠️ No active admin users found');
      return { success: true, sent: 0, message: 'No active admin users' };
    }

    const adminIds = admins.map(admin => admin.id);
    return await sendPushNotification(adminIds, notification);

  } catch (error) {
    console.error('❌ Error sending notifications to admins:', error);
    throw error;
  }
}

/**
 * Send notification when a testimonial link is opened
 * @param {Object} data - Testimonial link data
 * @param {string} data.clientName - Name of the client
 * @returns {Promise<Object>} - Result of sending notification
 */
async function notifyTestimonialLinkOpened(data) {
  return await sendToAdmins({
    title: 'Testimonial Link Opened',
    body: `${data.clientName} has opened their testimonial link.`,
    data: {
      type: 'testimonial_opened',
      clientName: data.clientName,
      screen: 'Testimonials'
    },
    badge: 1
  });
}

/**
 * Send notification when a testimonial is submitted
 * @param {Object} data - Testimonial submission data
 * @param {string} data.clientName - Name of the client
 * @param {number} data.rating - Rating given
 * @param {string} data.projectType - Type of project
 * @returns {Promise<Object>} - Result of sending notification
 */
async function notifyTestimonialSubmitted(data) {
  return await sendToAdmins({
    title: 'New Testimonial Received',
    body: `${data.clientName} submitted a ${data.rating}-star review for ${data.projectType}`,
    data: {
      type: 'testimonial_submitted',
      clientName: data.clientName,
      rating: data.rating,
      projectType: data.projectType,
      screen: 'Testimonials'
    },
    badge: 1
  });
}

/**
 * Send notification when an invoice is opened for the first time
 * @param {Object} data - Invoice data
 * @param {string} data.clientName - Name of the client
 * @param {string} data.invoiceNumber - Invoice number
 * @returns {Promise<Object>} - Result of sending notification
 */
async function notifyInvoiceOpened(data) {
  return await sendToAdmins({
    title: 'Invoice Opened',
    body: `${data.clientName} has opened invoice ${data.invoiceNumber}.`,
    data: {
      type: 'invoice_opened',
      clientName: data.clientName,
      invoiceNumber: data.invoiceNumber,
      screen: 'Invoices'
    },
    badge: 1
  });
}

/**
 * Send notification when a client views updated invoice changes
 * @param {Object} data - Invoice data
 * @param {string} data.clientName - Name of the client
 * @param {string} data.invoiceNumber - Invoice number
 * @returns {Promise<Object>} - Result of sending notification
 */
async function notifyInvoiceChangesViewed(data) {
  return await sendToAdmins({
    title: 'Invoice Changes Viewed',
    body: `${data.clientName} has viewed the updated invoice ${data.invoiceNumber}.`,
    data: {
      type: 'invoice_changes_viewed',
      clientName: data.clientName,
      invoiceNumber: data.invoiceNumber,
      screen: 'Invoices'
    },
    badge: 1
  });
}

module.exports = {
  sendPushNotification,
  sendToAdmins,
  notifyTestimonialLinkOpened,
  notifyTestimonialSubmitted,
  notifyInvoiceOpened,
  notifyInvoiceChangesViewed
};
