// Instagram Feed Routes
// Handles fetching, managing, and displaying Instagram posts
const express = require('express');
const router = express.Router();
const { instagramDb, instagramOembedDb } = require('../db-helpers');
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

// ============================================================
// OEMBED PUBLIC ROUTES (for Meta App Review)
// ============================================================

// Get oEmbed HTML for a single Instagram post URL
// GET /api/instagram/oembed?url=https://www.instagram.com/p/POST_ID/
router.get('/oembed', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate Instagram URL format
    const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/;
    if (!instagramUrlPattern.test(url)) {
      return res.status(400).json({ error: 'Invalid Instagram URL format' });
    }

    const appId = process.env.FB_APP_ID;
    const appSecret = process.env.FB_APP_SECRET;

    if (!appId || !appSecret) {
      return res.status(500).json({ error: 'Instagram oEmbed not configured. Please set FB_APP_ID and FB_APP_SECRET.' });
    }

    // App token format: app-id|app-secret
    const appToken = `${appId}|${appSecret}`;
    const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${appToken}`;

    const response = await fetch(oembedUrl);
    const data = await response.json();

    if (data.error) {
      console.error('[OEMBED] Meta API error:', data.error);
      return res.status(400).json({ error: data.error.message || 'Failed to fetch oEmbed data' });
    }

    res.json({
      html: data.html,
      width: data.width,
      author_name: data.author_name,
      provider_name: data.provider_name
    });
  } catch (error) {
    console.error('[OEMBED] Error:', error);
    res.status(500).json({ error: 'Failed to fetch oEmbed data' });
  }
});

// Get all saved oEmbed posts with their embed HTML for public display
// GET /api/instagram/oembed-posts
router.get('/oembed-posts', async (req, res) => {
  try {
    const posts = await instagramOembedDb.getPosts();

    // If no posts, return empty array
    if (!posts || posts.length === 0) {
      return res.json([]);
    }

    const appId = process.env.FB_APP_ID;
    const appSecret = process.env.FB_APP_SECRET;

    // If oEmbed not configured, return posts without HTML (frontend will use blockquote embed)
    if (!appId || !appSecret) {
      console.log('[OEMBED-POSTS] FB credentials not configured, returning posts without embed HTML');
      return res.json(posts.map(p => ({ ...p, html: null })));
    }

    const appToken = `${appId}|${appSecret}`;

    // Fetch oEmbed HTML for each post
    const postsWithEmbed = await Promise.all(posts.map(async (post) => {
      try {
        const oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(post.permalink)}&access_token=${appToken}`;
        const response = await fetch(oembedUrl);
        const data = await response.json();

        if (data.error) {
          console.log(`[OEMBED-POSTS] oEmbed error for ${post.permalink}:`, data.error.message);
          return { ...post, html: null };
        }

        return {
          ...post,
          html: data.html,
          author_name: data.author_name
        };
      } catch (err) {
        console.log(`[OEMBED-POSTS] Error fetching oEmbed for ${post.permalink}:`, err.message);
        return { ...post, html: null };
      }
    }));

    res.json(postsWithEmbed);
  } catch (error) {
    console.error('[OEMBED-POSTS] Error:', error);
    res.status(500).json({ error: 'Failed to fetch oEmbed posts' });
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
// UPDATED: Uses Instagram Graph API with Facebook Login (Basic Display API deprecated Dec 4, 2024)
router.post('/admin/fetch', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    // Get current settings
    const settings = await instagramDb.getSettings();

    if (!settings || !settings.access_token) {
      return res.status(400).json({ 
        error: 'Instagram access token not configured',
        help: 'You need a Facebook Page Access Token with instagram_basic and instagram_content_publish permissions. The Instagram account must be a Business or Creator account connected to a Facebook Page.'
      });
    }

    // Check if token is expired
    if (settings.token_expires_at && new Date(settings.token_expires_at) < new Date()) {
      return res.status(401).json({ error: 'Instagram access token expired. Please re-authenticate.' });
    }

    // Step 1: Get Instagram Business Account ID from Facebook Page
    // The access_token should be a Facebook Page Access Token
    let igUserId = settings.instagram_business_account_id;

    if (!igUserId) {
      // Try to get Instagram Business Account ID from the connected Facebook Page
      const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=${settings.access_token}`;
      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        console.error('[INSTAGRAM API] Error fetching pages:', pagesData.error);
        return res.status(400).json({ 
          error: pagesData.error.message || 'Failed to fetch Facebook Pages',
          help: 'Make sure you have a valid Facebook Page Access Token with pages_show_list permission.'
        });
      }

      // Find a page with connected Instagram Business Account
      const pageWithIG = pagesData.data?.find(page => page.instagram_business_account);
      if (!pageWithIG) {
        return res.status(400).json({ 
          error: 'No Instagram Business Account found',
          help: 'Your Facebook Page must be connected to an Instagram Business or Creator account. Go to your Facebook Page Settings > Instagram to connect your account.'
        });
      }

      igUserId = pageWithIG.instagram_business_account.id;
      
      // Save the Instagram Business Account ID for future use
      await instagramDb.updateSettings({
        instagram_business_account_id: igUserId
      });
    }

    // Step 2: Fetch media from Instagram Business Account
    // Using Instagram Graph API (not Basic Display API)
    const apiUrl = `https://graph.facebook.com/v21.0/${igUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url&access_token=${settings.access_token}&limit=25`;

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
            // For videos, use thumbnail_url as media_url fallback
            media_url: post.media_url || post.thumbnail_url,
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
      token_configured: !!settings.access_token,
      ig_account_configured: !!settings.instagram_business_account_id,
      api_type: 'Instagram Graph API (Facebook Login)' // Indicate which API is being used
    };
    res.json(safeSettings);
  } catch (error) {
    console.error('[INSTAGRAM SETTINGS] Error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update Instagram settings (super admin only)
// UPDATED: Facebook Page Access Tokens can be long-lived (never expire) or short-lived (1 hour)
router.put('/admin/settings', authenticateUser, requireRole(['super_admin']), async (req, res) => {
  try {
    const updates = {};

    if (req.body.access_token !== undefined) {
      updates.access_token = req.body.access_token;

      // Clear the cached Instagram Business Account ID when token changes
      // It will be re-fetched on next API call
      updates.instagram_business_account_id = null;

      // For Facebook Page Access Tokens:
      // - Short-lived tokens expire in ~1 hour
      // - Long-lived tokens can last ~60 days or never expire (for Page tokens)
      // Default to 60 days, but user can provide explicit expiration
      if (req.body.access_token) {
        if (req.body.token_expires_at) {
          updates.token_expires_at = req.body.token_expires_at;
        } else if (req.body.is_long_lived) {
          // Long-lived page tokens typically don't expire
          updates.token_expires_at = null;
        } else {
          // Default: assume 60 days for safety
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 60);
          updates.token_expires_at = expiresAt.toISOString();
        }
      }
    }

    if (req.body.auto_refresh_enabled !== undefined) {
      updates.auto_refresh_enabled = req.body.auto_refresh_enabled;
    }

    // Allow manually setting Instagram Business Account ID
    if (req.body.instagram_business_account_id !== undefined) {
      updates.instagram_business_account_id = req.body.instagram_business_account_id;
    }

    await instagramDb.updateSettings(updates);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('[INSTAGRAM SETTINGS UPDATE] Error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ============================================================
// OEMBED ADMIN ROUTES
// ============================================================

// Get saved oEmbed posts (admin view)
// GET /api/instagram/admin/oembed
router.get('/admin/oembed', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const posts = await instagramOembedDb.getPosts();
    res.json(posts);
  } catch (error) {
    console.error('[OEMBED ADMIN] Error fetching saved posts:', error);
    res.status(500).json({ error: 'Failed to fetch oEmbed posts' });
  }
});

// Fetch available posts from Instagram for oEmbed selection (NOT saved, just displayed)
// GET /api/instagram/admin/oembed/available
// UPDATED: Uses Instagram Graph API with Facebook Login (Basic Display API deprecated Dec 4, 2024)
router.get('/admin/oembed/available', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const settings = await instagramDb.getSettings();

    if (!settings || !settings.access_token) {
      return res.status(400).json({ 
        error: 'Instagram access token not configured. Please set up in Settings.',
        help: 'You need a Facebook Page Access Token. The Instagram account must be a Business or Creator account connected to a Facebook Page.'
      });
    }

    if (settings.token_expires_at && new Date(settings.token_expires_at) < new Date()) {
      return res.status(401).json({ error: 'Instagram access token expired. Please re-authenticate.' });
    }

    // Get Instagram Business Account ID
    let igUserId = settings.instagram_business_account_id;

    if (!igUserId) {
      // Try to get Instagram Business Account ID from the connected Facebook Page
      const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=${settings.access_token}`;
      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        return res.status(400).json({ 
          error: pagesData.error.message || 'Failed to fetch Facebook Pages',
          help: 'Make sure you have a valid Facebook Page Access Token.'
        });
      }

      const pageWithIG = pagesData.data?.find(page => page.instagram_business_account);
      if (!pageWithIG) {
        return res.status(400).json({ 
          error: 'No Instagram Business Account found',
          help: 'Your Facebook Page must be connected to an Instagram Business or Creator account.'
        });
      }

      igUserId = pageWithIG.instagram_business_account.id;
      
      // Save for future use
      await instagramDb.updateSettings({
        instagram_business_account_id: igUserId
      });
    }

    // Fetch posts from Instagram Graph API
    const apiUrl = `https://graph.facebook.com/v21.0/${igUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url&access_token=${settings.access_token}&limit=25`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error('[OEMBED AVAILABLE] Instagram API error:', data.error);
      return res.status(400).json({ error: data.error.message || 'Instagram API error' });
    }

    // Get already saved post IDs to mark them
    const savedPosts = await instagramOembedDb.getPosts();
    const savedPostIds = new Set(savedPosts.map(p => p.post_id));

    // Format posts for selection UI
    const availablePosts = (data.data || [])
      .filter(post => post.media_type === 'IMAGE' || post.media_type === 'VIDEO' || post.media_type === 'CAROUSEL_ALBUM')
      .map(post => ({
        post_id: post.id,
        media_type: post.media_type,
        media_url: post.media_url || post.thumbnail_url,
        permalink: post.permalink,
        caption: post.caption || '',
        timestamp: post.timestamp,
        already_saved: savedPostIds.has(post.id)
      }));

    res.json(availablePosts);
  } catch (error) {
    console.error('[OEMBED AVAILABLE] Error:', error);
    res.status(500).json({ error: 'Failed to fetch available posts: ' + error.message });
  }
});

// Save selected posts to oEmbed table
// POST /api/instagram/admin/oembed/save
router.post('/admin/oembed/save', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ error: 'No posts provided' });
    }

    // Save each selected post
    const savedIds = await instagramOembedDb.addPosts(posts);

    res.json({
      success: true,
      saved: savedIds.length,
      message: `Successfully saved ${savedIds.length} post(s) for oEmbed display`
    });
  } catch (error) {
    console.error('[OEMBED SAVE] Error:', error);
    res.status(500).json({ error: 'Failed to save posts' });
  }
});

// Remove a saved oEmbed post
// DELETE /api/instagram/admin/oembed/:id
router.delete('/admin/oembed/:id', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await instagramOembedDb.removePost(parseInt(id));
    res.json({ success: true, message: 'Post removed from oEmbed display' });
  } catch (error) {
    console.error('[OEMBED DELETE] Error:', error);
    res.status(500).json({ error: 'Failed to remove post' });
  }
});

// Update display order for an oEmbed post
// PUT /api/instagram/admin/oembed/:id/order
router.put('/admin/oembed/:id/order', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { order } = req.body;

    if (order === undefined) {
      return res.status(400).json({ error: 'Order value required' });
    }

    await instagramOembedDb.updateOrder(parseInt(id), parseInt(order));
    res.json({ success: true, message: 'Display order updated' });
  } catch (error) {
    console.error('[OEMBED ORDER] Error:', error);
    res.status(500).json({ error: 'Failed to update display order' });
  }
});

// ============================================================
// MANUAL URL INPUT (No API Token Required - oEmbed Only)
// This is the recommended approach since Instagram Basic Display API was deprecated
// ============================================================

// Add Instagram post by URL (manual entry)
// POST /api/instagram/admin/oembed/add-url
router.post('/admin/oembed/add-url', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Instagram URL is required' });
    }

    // Validate Instagram URL format
    const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/;
    if (!instagramUrlPattern.test(url)) {
      return res.status(400).json({ 
        error: 'Invalid Instagram URL format',
        help: 'URL should be like: https://www.instagram.com/p/ABC123/ or https://www.instagram.com/reel/ABC123/'
      });
    }

    // Extract post ID from URL
    const match = url.match(/instagram\.com\/(p|reel|tv)\/([\w-]+)/);
    const postId = match ? match[2] : `manual_${Date.now()}`;
    const mediaType = match ? (match[1] === 'reel' ? 'VIDEO' : 'IMAGE') : 'IMAGE';

    // Clean the permalink (remove query params)
    const cleanUrl = url.split('?')[0];
    const permalink = cleanUrl.endsWith('/') ? cleanUrl : cleanUrl + '/';

    // Check if post already exists
    const existingPosts = await instagramOembedDb.getPosts();
    if (existingPosts.some(p => p.permalink === permalink || p.post_id === postId)) {
      return res.status(400).json({ error: 'This Instagram post has already been added' });
    }

    // Try to get oEmbed data for preview (optional - will still work without it)
    let caption = '';
    let authorName = '';
    
    const appId = process.env.FB_APP_ID;
    const appSecret = process.env.FB_APP_SECRET;

    if (appId && appSecret) {
      try {
        const appToken = `${appId}|${appSecret}`;
        const oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(permalink)}&access_token=${appToken}`;
        const response = await fetch(oembedUrl);
        const data = await response.json();
        
        if (!data.error) {
          authorName = data.author_name || '';
          // Caption not available from oEmbed, but we confirm the URL is valid
        }
      } catch (err) {
        // oEmbed failed, but we can still save the URL
        console.log('[OEMBED] Could not fetch oEmbed preview, saving URL anyway');
      }
    }

    // Save the post
    const savedIds = await instagramOembedDb.addPosts([{
      post_id: postId,
      permalink: permalink,
      media_url: null, // Will be rendered via oEmbed
      caption: caption || `Post by ${authorName || 'Instagram'}`,
      timestamp: new Date().toISOString()
    }]);

    res.json({
      success: true,
      message: 'Instagram post added successfully! It will be displayed using oEmbed.',
      post_id: postId,
      permalink: permalink
    });

  } catch (error) {
    console.error('[OEMBED ADD-URL] Error:', error);
    res.status(500).json({ error: 'Failed to add Instagram post: ' + error.message });
  }
});

// Bulk add Instagram posts by URLs
// POST /api/instagram/admin/oembed/add-urls
router.post('/admin/oembed/add-urls', authenticateUser, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'At least one Instagram URL is required' });
    }

    const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/;
    const existingPosts = await instagramOembedDb.getPosts();
    const existingPermalinks = new Set(existingPosts.map(p => p.permalink));

    const postsToAdd = [];
    const errors = [];

    for (const url of urls) {
      if (!instagramUrlPattern.test(url)) {
        errors.push({ url, error: 'Invalid URL format' });
        continue;
      }

      const match = url.match(/instagram\.com\/(p|reel|tv)\/([\w-]+)/);
      const postId = match ? match[2] : `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const cleanUrl = url.split('?')[0];
      const permalink = cleanUrl.endsWith('/') ? cleanUrl : cleanUrl + '/';

      if (existingPermalinks.has(permalink)) {
        errors.push({ url, error: 'Already exists' });
        continue;
      }

      postsToAdd.push({
        post_id: postId,
        permalink: permalink,
        media_url: null,
        caption: '',
        timestamp: new Date().toISOString()
      });

      existingPermalinks.add(permalink); // Prevent duplicates within this batch
    }

    let savedCount = 0;
    if (postsToAdd.length > 0) {
      const savedIds = await instagramOembedDb.addPosts(postsToAdd);
      savedCount = savedIds.length;
    }

    res.json({
      success: true,
      message: `Added ${savedCount} post(s)${errors.length > 0 ? `, ${errors.length} skipped` : ''}`,
      added: savedCount,
      skipped: errors.length,
      errors: errors
    });

  } catch (error) {
    console.error('[OEMBED ADD-URLS] Error:', error);
    res.status(500).json({ error: 'Failed to add Instagram posts: ' + error.message });
  }
});

module.exports = router;
