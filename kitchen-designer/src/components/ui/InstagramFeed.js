import React, { useState, useEffect } from 'react';
import { Instagram, AlertCircle } from 'lucide-react';
import InstagramPost from './InstagramPost';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

/**
 * InstagramFeed - Display grid of approved Instagram posts
 *
 * Features:
 * - Fetches approved Instagram posts from backend
 * - Responsive grid layout
 * - Loading and error states
 * - Configurable post limit
 * - Link to full Instagram profile
 */
const InstagramFeed = ({ limit = 6, showTitle = true, className = '' }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Instagram profile URL
  const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/gudinocustomwoodworking?igsh=MWNqZjhyaWtjOGhcg==';

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/instagram/posts`);

      if (response.ok) {
        const data = await response.json();
        // Sort by display_order, then by timestamp (newest first)
        const sortedPosts = data.sort((a, b) => {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order;
          }
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        setPosts(sortedPosts.slice(0, limit));
      } else {
        setError('Failed to load Instagram posts');
      }
    } catch (err) {
      console.error('Error loading Instagram posts:', err);
      setError('Error loading Instagram feed');
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if there are no posts and not loading
  if (!loading && posts.length === 0) {
    return null;
  }

  return (
    <div className={`instagram-feed ${className}`} style={{ padding: '3rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        {showTitle && (
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Instagram size={32} className="text-pink-600" />
              <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                Follow Us on Instagram
              </h2>
            </div>
            <p style={{ fontSize: '1.125rem', color: '#6B7280', marginBottom: '1.5rem' }}>
              See our latest custom woodworking projects and inspiration
            </p>
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #FCAF45)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '9999px',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Instagram size={20} />
              @gudinocustomwoodworking
            </a>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div
              style={{
                display: 'inline-block',
                width: '48px',
                height: '48px',
                border: '4px solid #E5E7EB',
                borderTop: '4px solid #E11D48',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            <p style={{ marginTop: '1rem', color: '#6B7280' }}>Loading Instagram feed...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            style={{
              padding: '1.5rem',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Posts Grid */}
        {!loading && posts.length > 0 && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                marginBottom: '2rem'
              }}
            >
              {posts.map(post => (
                <InstagramPost key={post.id} post={post} />
              ))}
            </div>

            {/* See More Link */}
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <a
                href={INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 2rem',
                  border: '2px solid #E11D48',
                  color: '#E11D48',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E11D48';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#E11D48';
                }}
              >
                View More on Instagram
                <Instagram size={20} />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InstagramFeed;
