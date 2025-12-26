// Instagram Feed Routes
// Handles fetching, managing, and displaying Instagram posts
const express = require('express');
const router = express.Router();
const { instagramDb } = require('../db-helpers');
const { authenticateUser, requireRole } = require('../middleware/auth');
const fetch = require('node-fetch');

// PUBLIC ROUTES

// Get approved Instagram posts for public display
router.get('/posts', async (req, res) => {
  try {
    const posts = await instagramDb.getPosts(true); // Only approved posts
    res.json(posts);
  } catch (error) {
    console.error('[INSTAGRAM] Error fetching approved posts:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram posts' });
  }
});

// ADMIN ROUTES

// Get all Instagram posts (admin only)
router.get('/admin/posts', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const posts = await instagramDb.getPosts(false); // All posts
    res.json(posts);
  } catch (error) {
    console.error('[INSTAGRAM ADMIN] Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram posts' });
  }
});

// Fetch new posts from Instagram API (admin only)
router.post('/admin/fetch', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    // Get current settings
    const settings = await instagramDb.getSettings();

    if (!settings || !settings.access_token) {
      return res.status(400).json({ error: 'Instagram access token not configured' });
    }

    // Check if token is expired
    if (settings.token_expires_at && new Date(settings.token_expires_at) < new Date()) {
      return res.status(401).json({ error: 'Instagram access token expired. Please re-authenticate.' });
    }

    // Fetch posts from Instagram Graph API
    // Note: Requires Instagram Business account connected to Facebook Page
    // Get Instagram Business Account ID first, then fetch media
    const apiUrl = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${settings.access_token}&limit=25`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error('[INSTAGRAM API] Error:', data.error);
      return res.status(400).json({ error: data.error.message || 'Instagram API error' });
    }

    // Save posts to database
    const savedPosts = [];
    if (data.data && Array.isArray(data.data)) {
      for (const post of data.data) {
        // Save all media types: IMAGE, VIDEO, and CAROUSEL_ALBUM
        if (post.media_type === 'IMAGE' || post.media_type === 'VIDEO' || post.media_type === 'CAROUSEL_ALBUM') {
          const postId = await instagramDb.upsertPost({
            post_id: post.id,
            media_type: post.media_type,
            media_url: post.media_url,
            permalink: post.permalink,
            caption: post.caption || '',
            timestamp: post.timestamp
          });
          savedPosts.push(postId);
        }
      }
    }

    // Update last fetch time
    await instagramDb.updateSettings({
      last_fetch_at: new Date().toISOString()
    });

    res.json({
      success: true,
      fetched: savedPosts.length,
      message: `Successfully fetched ${savedPosts.length} posts from Instagram`
    });

  } catch (error) {
    console.error('[INSTAGRAM FETCH] Error:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram posts: ' + error.message });
  }
});

// Update Instagram post (approval, display order)
router.put('/admin/posts/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.approved !== undefined) {
      updates.approved = req.body.approved;
    }
    if (req.body.display_order !== undefined) {
      updates.display_order = parseInt(req.body.display_order);
    }

    await instagramDb.updatePost(parseInt(id), updates);
    res.json({ success: true, message: 'Post updated successfully' });
  } catch (error) {
    console.error('[INSTAGRAM UPDATE] Error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete Instagram post
router.delete('/admin/posts/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await instagramDb.deletePost(parseInt(id));
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('[INSTAGRAM DELETE] Error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Get Instagram settings
router.get('/admin/settings', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const settings = await instagramDb.getSettings();
    // Don't send the full access token to the frontend, just indicate if it exists
    const safeSettings = {
      ...settings,
      access_token: settings.access_token ? '***CONFIGURED***' : null,
      token_configured: !!settings.access_token
    };
    res.json(safeSettings);
  } catch (error) {
    console.error('[INSTAGRAM SETTINGS] Error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update Instagram settings (super admin only)
router.put('/admin/settings', authenticateUser, requireRole(['super_admin']), async (req, res) => {
  try {
    const updates = {};

    if (req.body.access_token !== undefined) {
      updates.access_token = req.body.access_token;

      // If setting a new token, calculate expiration (60 days for Instagram Basic Display)
      if (req.body.access_token) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 60);
        updates.token_expires_at = expiresAt.toISOString();
      }
    }

    if (req.body.auto_refresh_enabled !== undefined) {
      updates.auto_refresh_enabled = req.body.auto_refresh_enabled;
    }

    await instagramDb.updateSettings(updates);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('[INSTAGRAM SETTINGS UPDATE] Error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
