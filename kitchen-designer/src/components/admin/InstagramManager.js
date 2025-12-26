import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, X, Eye, EyeOff, Trash2, AlertCircle, Instagram, Settings } from 'lucide-react';
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
    </div>
  );
};

export default InstagramManager;
