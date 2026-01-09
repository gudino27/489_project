import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, X, Eye, EyeOff, Trash2, AlertCircle, Instagram, Settings, ExternalLink, Square, CheckSquare, Save, Plus, Link } from 'lucide-react';
import sessionManager from '../utils/sessionManager';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

const InstagramManager = () => {
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  // oEmbed state
  const [oembedPosts, setOembedPosts] = useState([]);           // Saved posts for oEmbed display
  const [availablePosts, setAvailablePosts] = useState([]);     // Fetched posts available for selection
  const [selectedPosts, setSelectedPosts] = useState(new Set()); // Post IDs selected for saving
  const [oembedLoading, setOembedLoading] = useState(false);
  const [oembedFetching, setOembedFetching] = useState(false);
  const [oembedSaving, setOembedSaving] = useState(false);
  const [showOembedSection, setShowOembedSection] = useState(true);

  // Manual URL input state
  const [manualUrl, setManualUrl] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);

  // Get auth headers
  const getAuthHeaders = () => {
    const session = sessionManager.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': session?.token ? `Bearer ${session.token}` : ''
    };
  };

  // Load posts and settings on mount
  useEffect(() => {
    loadPosts();
    loadSettings();
    loadOembedPosts();
  }, []);

  // Load all Instagram posts
  const loadPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/posts`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        setError('Failed to load Instagram posts');
      }
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Error loading posts');
    } finally {
      setLoading(false);
    }
  };

  // Load Instagram settings
  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/settings`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  // Fetch new posts from Instagram API
  const fetchFromInstagram = async () => {
    setFetching(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/fetch`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Successfully fetched Instagram posts');
        loadPosts(); // Reload posts
        loadSettings(); // Reload settings
      } else {
        setError(data.error || 'Failed to fetch from Instagram');
      }
    } catch (err) {
      console.error('Error fetching from Instagram:', err);
      setError('Error connecting to Instagram');
    } finally {
      setFetching(false);
    }
  };

  // Toggle post approval
  const toggleApproval = async (postId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/posts/${postId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ approved: !currentStatus })
      });

      if (response.ok) {
        setPosts(posts.map(p =>
          p.id === postId ? { ...p, approved: !currentStatus } : p
        ));
      } else {
        setError('Failed to update post');
      }
    } catch (err) {
      console.error('Error updating post:', err);
      setError('Error updating post');
    }
  };

  // Update display order
  const updateDisplayOrder = async (postId, order) => {
    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/posts/${postId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ display_order: parseInt(order) })
      });

      if (response.ok) {
        setPosts(posts.map(p =>
          p.id === postId ? { ...p, display_order: parseInt(order) } : p
        ));
      }
    } catch (err) {
      console.error('Error updating display order:', err);
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this Instagram post?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        setSuccess('Post deleted successfully');
      } else {
        setError('Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Error deleting post');
    }
  };

  // Save access token
  const saveAccessToken = async () => {
    if (!accessToken.trim()) {
      setError('Please enter an access token');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ access_token: accessToken })
      });

      if (response.ok) {
        setSuccess('Access token saved successfully');
        setAccessToken('');
        setShowSettings(false);
        loadSettings();
      } else {
        setError('Failed to save access token');
      }
    } catch (err) {
      console.error('Error saving token:', err);
      setError('Error saving access token');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Approved and unapproved posts
  const approvedPosts = posts.filter(p => p.approved);
  const unapprovedPosts = posts.filter(p => !p.approved);

  // ============================================================
  // OEMBED FUNCTIONS (for Meta App Review)
  // ============================================================

  // Load saved oEmbed posts
  const loadOembedPosts = async () => {
    setOembedLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/oembed`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setOembedPosts(data);
      }
    } catch (err) {
      console.error('Error loading oEmbed posts:', err);
    } finally {
      setOembedLoading(false);
    }
  };

  // Fetch available posts for oEmbed selection
  const fetchOembedAvailable = async () => {
    setOembedFetching(true);
    setError('');
    setAvailablePosts([]);
    setSelectedPosts(new Set());

    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/oembed/available`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        setAvailablePosts(data);
        setSuccess(`Found ${data.length} posts available for selection`);
      } else {
        setError(data.error || 'Failed to fetch available posts');
      }
    } catch (err) {
      console.error('Error fetching available posts:', err);
      setError('Error connecting to Instagram');
    } finally {
      setOembedFetching(false);
    }
  };

  // Toggle post selection
  const togglePostSelection = (postId) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  // Save selected posts for oEmbed
  const saveSelectedOembedPosts = async () => {
    if (selectedPosts.size === 0) {
      setError('Please select at least one post to save');
      return;
    }

    setOembedSaving(true);
    setError('');

    try {
      // Get full post data for selected posts
      const postsToSave = availablePosts
        .filter(p => selectedPosts.has(p.post_id))
        .map(p => ({
          post_id: p.post_id,
          permalink: p.permalink,
          media_url: p.media_url,
          caption: p.caption,
          timestamp: p.timestamp
        }));

      const response = await fetch(`${API_BASE}/api/instagram/admin/oembed/save`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ posts: postsToSave })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || `Saved ${selectedPosts.size} posts for oEmbed display`);
        setSelectedPosts(new Set());
        setAvailablePosts([]); // Clear available posts
        loadOembedPosts(); // Reload saved posts
      } else {
        setError(data.error || 'Failed to save posts');
      }
    } catch (err) {
      console.error('Error saving oEmbed posts:', err);
      setError('Error saving posts');
    } finally {
      setOembedSaving(false);
    }
  };

  // Remove saved oEmbed post
  const removeOembedPost = async (postId) => {
    if (!window.confirm('Remove this post from oEmbed display?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/oembed/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setOembedPosts(oembedPosts.filter(p => p.id !== postId));
        setSuccess('Post removed from oEmbed display');
      } else {
        setError('Failed to remove post');
      }
    } catch (err) {
      console.error('Error removing oEmbed post:', err);
      setError('Error removing post');
    }
  };

  // Update oEmbed post display order
  const updateOembedOrder = async (postId, order) => {
    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/oembed/${postId}/order`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ order: parseInt(order) })
      });

      if (response.ok) {
        setOembedPosts(oembedPosts.map(p =>
          p.id === postId ? { ...p, display_order: parseInt(order) } : p
        ));
      }
    } catch (err) {
      console.error('Error updating oEmbed order:', err);
    }
  };

  // Add Instagram post by URL (manual entry - no API token required!)
  const addPostByUrl = async () => {
    if (!manualUrl.trim()) {
      setError('Please enter an Instagram URL');
      return;
    }

    // Basic validation
    const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/;
    if (!instagramUrlPattern.test(manualUrl)) {
      setError('Invalid Instagram URL. Please use a URL like https://www.instagram.com/p/ABC123/ or https://www.instagram.com/reel/ABC123/');
      return;
    }

    setAddingUrl(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/instagram/admin/oembed/add-url`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ url: manualUrl })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Instagram post added successfully!');
        setManualUrl('');
        loadOembedPosts(); // Reload the list
      } else {
        setError(data.error || 'Failed to add Instagram post');
      }
    } catch (err) {
      console.error('Error adding post by URL:', err);
      setError('Error adding Instagram post');
    } finally {
      setAddingUrl(false);
    }
  };

  return (
    <div className="instagram-manager" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Instagram size={32} className="text-pink-600" />
            Instagram Feed Manager
          </h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '0.5rem 1rem',
              background: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Settings size={16} />
            Settings
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div style={{ background: '#F3F4F6', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Instagram Graph API Settings</h3>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>
              To connect Instagram, you need to use the Instagram Graph API (requires Facebook App + Instagram Business account).
              <a href="https://developers.facebook.com/docs/instagram-api/getting-started"
                 target="_blank"
                 rel="noopener noreferrer"
                 style={{ color: '#2563EB', marginLeft: '0.5rem' }}>
                Learn how to set up Instagram Graph API →
              </a>
            </p>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem', padding: '0.75rem', background: '#FEF3C7', borderRadius: '0.375rem' }}>
              <strong>Steps to get access token:</strong>
              <ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>Create a Facebook App at developers.facebook.com</li>
                <li>Add Instagram Graph API product</li>
                <li>Connect your Instagram Business account to a Facebook Page</li>
                <li>Generate a long-lived access token (60 days, can be refreshed)</li>
                <li>Paste the token below</li>
              </ol>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Access Token:
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Enter Instagram access token"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={saveAccessToken}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Save Token
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setAccessToken('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
            </div>
            {settings && settings.token_configured && (
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#10B981' }}>
                ✓ Access token is configured
              </p>
            )}
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div style={{
            padding: '1rem',
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '1rem',
            background: '#D1FAE5',
            color: '#065F46',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Check size={20} />
            {success}
          </div>
        )}

        {/* Stats and Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Total Posts</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{posts.length}</p>
          </div>
          <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Approved</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>{approvedPosts.length}</p>
          </div>
          <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Pending</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B' }}>{unapprovedPosts.length}</p>
          </div>
          <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={fetchFromInstagram}
              disabled={fetching || !settings?.token_configured}
              style={{
                padding: '0.75rem 1.5rem',
                background: fetching ? '#9CA3AF' : '#E11D48',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: fetching || !settings?.token_configured ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RefreshCw size={20} className={fetching ? 'animate-spin' : ''} />
              {fetching ? 'Fetching...' : 'Fetch from Instagram'}
            </button>
          </div>
        </div>

        {!settings?.token_configured && (
          <div style={{ padding: '1rem', background: '#FEF3C7', color: '#92400E', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Please configure your Instagram access token in Settings before fetching posts.
          </div>
        )}

        {settings?.last_fetch_at && (
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>
            Last fetch: {formatDate(settings.last_fetch_at)}
          </p>
        )}
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto', color: '#6B7280' }} />
          <p style={{ marginTop: '1rem', color: '#6B7280' }}>Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '0.5rem' }}>
          <Instagram size={48} style={{ margin: '0 auto', color: '#D1D5DB' }} />
          <p style={{ marginTop: '1rem', fontSize: '1.125rem', color: '#6B7280' }}>No Instagram posts yet</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#9CA3AF' }}>
            {settings?.token_configured
              ? 'Click "Fetch from Instagram" to load your posts'
              : 'Configure your access token in Settings first'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {posts.map(post => (
            <div
              key={post.id}
              style={{
                background: 'white',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: post.approved ? '2px solid #10B981' : '2px solid #E5E7EB'
              }}
            >
              {/* Image */}
              <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                <img
                  src={post.media_url}
                  alt={post.caption || 'Instagram post'}
                  style={{ width: '100%', height: '300px', objectFit: 'cover', cursor: 'pointer' }}
                />
              </a>

              {/* Content */}
              <div style={{ padding: '1rem' }}>
                {/* Caption */}
                {post.caption && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    marginBottom: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {post.caption}
                  </p>
                )}

                {/* Date */}
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '1rem' }}>
                  {formatDate(post.timestamp)}
                </p>

                {/* Display Order */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: '0.25rem' }}>
                    Display Order:
                  </label>
                  <input
                    type="number"
                    value={post.display_order}
                    onChange={(e) => updateDisplayOrder(post.id, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => toggleApproval(post.id, post.approved)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: post.approved ? '#10B981' : '#F59E0B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {post.approved ? <Eye size={16} /> : <EyeOff size={16} />}
                    {post.approved ? 'Approved' : 'Approve'}
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    style={{
                      padding: '0.5rem',
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* OEMBED SECTION - For Meta App Review */}
      {/* ============================================================ */}
      <div style={{ marginTop: '3rem', borderTop: '2px solid #E5E7EB', paddingTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Instagram size={24} style={{ color: '#E11D48' }} />
            oEmbed Posts (Meta App Review)
          </h2>
          <a
            href="/instagram-embed"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #FCAF45)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ExternalLink size={16} />
            View Public Demo Page
          </a>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
          Select posts to display on the public oEmbed demo page at <code style={{ background: '#F3F4F6', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>/instagram-embed</code>.
          This page demonstrates Instagram oEmbed integration for Meta's app review.
        </p>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#F0FDF4', padding: '1rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #BBF7D0' }}>
            <p style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '0.25rem' }}>Saved for Display</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>{oembedPosts.length}</p>
          </div>
          {selectedPosts.size > 0 && (
            <div style={{ background: '#EFF6FF', padding: '1rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #BFDBFE' }}>
              <p style={{ fontSize: '0.75rem', color: '#1E40AF', marginBottom: '0.25rem' }}>Selected to Add</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1E40AF' }}>{selectedPosts.size}</p>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* MANUAL URL INPUT - No API Token Required! */}
        {/* ============================================================ */}
        <div style={{ 
          background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          marginBottom: '2rem',
          border: '2px solid #F9A8D4'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Link size={20} style={{ color: '#DB2777' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#831843' }}>
              Add Post by URL (Recommended)
            </h3>
            <span style={{ 
              background: '#10B981', 
              color: 'white', 
              fontSize: '0.625rem', 
              padding: '0.125rem 0.5rem', 
              borderRadius: '9999px',
              fontWeight: '600'
            }}>
              NO API TOKEN NEEDED
            </span>
          </div>
          
          <p style={{ fontSize: '0.875rem', color: '#9D174D', marginBottom: '1rem' }}>
            Simply paste Instagram post URLs below. Works without any Facebook/Instagram API setup!
            <br />
            <span style={{ fontSize: '0.75rem', color: '#BE185D' }}>
              Supports: Posts (instagram.com/p/...), Reels (instagram.com/reel/...), and IGTV (instagram.com/tv/...)
            </span>
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/ABC123/"
              onKeyDown={(e) => e.key === 'Enter' && addPostByUrl()}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '2px solid #F9A8D4',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
            <button
              onClick={addPostByUrl}
              disabled={addingUrl || !manualUrl.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: addingUrl ? '#9CA3AF' : 'linear-gradient(135deg, #EC4899, #DB2777)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: addingUrl || !manualUrl.trim() ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              {addingUrl ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {addingUrl ? 'Adding...' : 'Add Post'}
            </button>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#BE185D', marginTop: '0.75rem' }}>
            💡 Tip: Copy the URL from any public Instagram post by clicking the "..." menu and selecting "Copy Link"
          </p>
        </div>

        {/* Fetch & Select Section (API method - optional) */}
        <div style={{ background: '#F9FAFB', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Fetch from Instagram API (Optional)</h3>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                Requires Facebook Page Access Token - use manual URL input above if you don't have API access
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={fetchOembedAvailable}
                disabled={oembedFetching || !settings?.token_configured}
                style={{
                  padding: '0.5rem 1rem',
                  background: oembedFetching ? '#9CA3AF' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: oembedFetching || !settings?.token_configured ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <RefreshCw size={16} className={oembedFetching ? 'animate-spin' : ''} />
                {oembedFetching ? 'Fetching...' : 'Fetch Available Posts'}
              </button>
              {selectedPosts.size > 0 && (
                <button
                  onClick={saveSelectedOembedPosts}
                  disabled={oembedSaving}
                  style={{
                    padding: '0.5rem 1rem',
                    background: oembedSaving ? '#9CA3AF' : '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: oembedSaving ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Save size={16} />
                  {oembedSaving ? 'Saving...' : `Save Selected (${selectedPosts.size})`}
                </button>
              )}
            </div>
          </div>

          {/* Available Posts Grid */}
          {availablePosts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {availablePosts.map(post => (
                <div
                  key={post.post_id}
                  onClick={() => !post.already_saved && togglePostSelection(post.post_id)}
                  style={{
                    background: 'white',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    cursor: post.already_saved ? 'not-allowed' : 'pointer',
                    border: selectedPosts.has(post.post_id) ? '3px solid #3B82F6' : post.already_saved ? '2px solid #10B981' : '2px solid #E5E7EB',
                    opacity: post.already_saved ? 0.7 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={post.media_url}
                      alt={post.caption || 'Instagram post'}
                      style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: post.already_saved ? '#10B981' : selectedPosts.has(post.post_id) ? '#3B82F6' : 'white',
                      borderRadius: '0.25rem',
                      padding: '0.25rem'
                    }}>
                      {post.already_saved ? (
                        <Check size={16} style={{ color: 'white' }} />
                      ) : selectedPosts.has(post.post_id) ? (
                        <CheckSquare size={16} style={{ color: 'white' }} />
                      ) : (
                        <Square size={16} style={{ color: '#6B7280' }} />
                      )}
                    </div>
                    {post.already_saved && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: '#10B981',
                        color: 'white',
                        fontSize: '0.625rem',
                        textAlign: 'center',
                        padding: '0.125rem'
                      }}>
                        Already Saved
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#6B7280' }}>
                    {formatDate(post.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem' }}>
              Click "Fetch Available Posts" to load posts from Instagram for selection
            </p>
          )}
        </div>

        {/* Saved oEmbed Posts Section */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Saved oEmbed Posts ({oembedPosts.length})
          </h3>

          {oembedLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto', color: '#6B7280' }} />
            </div>
          ) : oembedPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: '#F9FAFB', borderRadius: '0.5rem' }}>
              <p style={{ color: '#6B7280' }}>No posts saved for oEmbed display yet.</p>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Add posts using the URL input above, or fetch from the Instagram API if you have access.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {oembedPosts.map(post => (
                <div
                  key={post.id}
                  style={{
                    background: 'white',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '2px solid #10B981'
                  }}
                >
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                    {post.media_url ? (
                      <img
                        src={post.media_url}
                        alt={post.caption || 'Instagram post'}
                        style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '180px', 
                        background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #FCAF45)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <Instagram size={48} />
                        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.9 }}>Click to view on Instagram</p>
                      </div>
                    )}
                  </a>
                  <div style={{ padding: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.5rem' }}>
                      {formatDate(post.timestamp)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#6B7280' }}>Order:</label>
                      <input
                        type="number"
                        value={post.display_order}
                        onChange={(e) => updateOembedOrder(post.id, e.target.value)}
                        style={{
                          width: '60px',
                          padding: '0.25rem 0.5rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}
                      />
                    </div>
                    <button
                      onClick={() => removeOembedPost(post.id)}
                      style={{
                        width: '100%',
                        padding: '0.375rem',
                        background: '#FEE2E2',
                        color: '#991B1B',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstagramManager;
