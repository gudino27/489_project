// Push notification token management routes
const express = require('express');
const router = express.Router();
const { userDb } = require('../db-helpers');
const { authenticateUser } = require('../middleware/auth');

/**
 * POST /api/admin/push-tokens
 * Register a push notification token for the authenticated user
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { token, device_type } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    if (!device_type) {
      return res.status(400).json({ error: 'Device type is required' });
    }

    const db = await userDb();

    // Check if token already exists for this user
    const existingToken = await db.get(
      'SELECT id FROM push_tokens WHERE token = ? AND user_id = ?',
      [token, userId]
    );

    if (existingToken) {
      // Update existing token
      await db.run(
        `UPDATE push_tokens 
         SET is_active = 1, 
             last_used_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP,
             device_type = ?
         WHERE id = ?`,
        [device_type, existingToken.id]
      );

      console.log(`✅ Push token updated for user ${userId}`);
      return res.json({ 
        success: true, 
        message: 'Push token updated',
        token_id: existingToken.id
      });
    }

    // Insert new token
    const result = await db.run(
      `INSERT INTO push_tokens (user_id, token, device_type, is_active)
       VALUES (?, ?, ?, 1)`,
      [userId, token, device_type]
    );

    console.log(`✅ Push token registered for user ${userId}`);
    res.status(201).json({ 
      success: true, 
      message: 'Push token registered',
      token_id: result.lastID
    });

  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

/**
 * DELETE /api/admin/push-tokens/:token
 * Unregister a push notification token
 */
router.delete('/:token', authenticateUser, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    const db = await userDb();

    // Deactivate the token instead of deleting (for audit trail)
    const result = await db.run(
      `UPDATE push_tokens 
       SET is_active = 0, 
           updated_at = CURRENT_TIMESTAMP
       WHERE token = ? AND user_id = ?`,
      [token, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Push token not found' });
    }

    console.log(`✅ Push token unregistered for user ${userId}`);
    res.json({ 
      success: true, 
      message: 'Push token unregistered' 
    });

  } catch (error) {
    console.error('Error unregistering push token:', error);
    res.status(500).json({ error: 'Failed to unregister push token' });
  }
});

/**
 * GET /api/admin/push-tokens
 * Get all active push tokens for the authenticated user
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await userDb();

    const tokens = await db.all(
      `SELECT id, token, device_type, last_used_at, created_at
       FROM push_tokens
       WHERE user_id = ? AND is_active = 1
       ORDER BY last_used_at DESC`,
      [userId]
    );

    res.json({ 
      success: true, 
      tokens 
    });

  } catch (error) {
    console.error('Error fetching push tokens:', error);
    res.status(500).json({ error: 'Failed to fetch push tokens' });
  }
});

/**
 * DELETE /api/admin/push-tokens
 * Unregister all push tokens for the authenticated user
 */
router.delete('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await userDb();

    const result = await db.run(
      `UPDATE push_tokens 
       SET is_active = 0, 
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [userId]
    );

    console.log(`✅ All push tokens unregistered for user ${userId}`);
    res.json({ 
      success: true, 
      message: `${result.changes} push token(s) unregistered` 
    });

  } catch (error) {
    console.error('Error unregistering push tokens:', error);
    res.status(500).json({ error: 'Failed to unregister push tokens' });
  }
});

module.exports = router;
