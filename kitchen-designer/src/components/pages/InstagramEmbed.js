import React, { useState, useEffect, useRef } from 'react';
import { Instagram, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import Navigation from '../ui/Navigation';
import Footer from '../ui/Footer';
import SEO from '../ui/SEO';
import '../css/sms-compliance.css';
import { useLanguage } from '../../contexts/LanguageContext';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

// Instagram oEmbed Demo Page
// This page demonstrates Instagram oEmbed integration for Meta's App Review
const InstagramEmbed = () => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    loadOembedPosts();
  }, []);

  // Load Instagram embed.js script when posts are loaded
  // Use ref to prevent multiple script injections which can cause service worker conflicts
  useEffect(() => {
    if (posts.length > 0 && !scriptLoadedRef.current) {
      // Check if script already exists in DOM
      const existingScript = document.querySelector('script[src*="instagram.com/embed.js"]');

      if (existingScript) {
        // Script already exists, just process embeds
        scriptLoadedRef.current = true;
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
        return;
      }

      // Add Instagram embed script only once
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);

      // Process embeds when script loads
      script.onload = () => {
        scriptLoadedRef.current = true;
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      };

      // Don't remove script on cleanup - keep it loaded
      // Multiple add/remove cycles cause issues with service worker caching
    }
  }, [posts]);

  const loadOembedPosts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/instagram/oembed-posts`);
      const data = await response.json();

      if (response.ok) {
        setPosts(data);
      } else {
        setError(data.error || 'Failed to load Instagram posts');
      }
    } catch (err) {
      console.error('Error loading oEmbed posts:', err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Instagram Gallery | Gudino Custom Woodworking"
        description="View our latest custom woodworking projects embedded directly from Instagram. See kitchen cabinets, bathroom vanities, and more from Gudino Custom Woodworking."
        keywords="instagram, custom cabinets, woodworking projects, kitchen design, bathroom vanity, gudino custom"
        canonical="https://gudinocustom.com/instagram-embed"
      />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #414141 0%, #000000 100%)'
      }}>
        <Navigation />
        <div style={{ height: '1vh' }}></div>

        <div className="sms-compliance-container">
          <div className="sms-content" style={{ borderRadius: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <Instagram size={32} style={{ color: '#E11D48' }} />
                <h1 className="sms-header" style={{
                  margin: 0,
                  borderBottom: 'none',
                  paddingBottom: 0,
                  fontSize: '28px'
                }}>
                  {t('instagram.title')}
                </h1>
              </div>

              <p style={{
                color: '#d1d5db',
                marginBottom: '1.5rem',
                maxWidth: '600px',
                margin: '0 auto 1.5rem'
              }}>
                {t('instagram.subtitle')}
              </p>

              <a
                href="https://www.instagram.com/gudinocustomwoodworking"
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
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <Instagram size={20} />
                {t('instagram.followButton')}
                <ExternalLink size={16} />
              </a>
            </div>

            {/* Loading State */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <RefreshCw
                  size={48}
                  style={{
                    margin: '0 auto',
                    color: '#E11D48',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                <p style={{ marginTop: '1rem', color: '#d1d5db', fontSize: '1.125rem' }}>
                  {t('instagram.loading')}
                </p>
                <style>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="sms-highlight-box" style={{
                background: 'rgba(239, 68, 68, 0.2)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* No Posts State */}
            {!loading && !error && posts.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '4rem'
              }}>
                <Instagram size={64} style={{ margin: '0 auto', color: '#6B7280' }} />
                <p style={{ marginTop: '1rem', fontSize: '1.25rem', color: '#e5e7eb' }}>
                  {t('instagram.noPosts')}
                </p>
                <p style={{ marginTop: '0.5rem', color: '#9ca3af' }}>
                  {t('instagram.noPostsMessage')}
                </p>
              </div>
            )}

            {/* Posts Grid - oEmbed HTML */}
            {!loading && posts.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
                justifyItems: 'center'
              }}>
                {posts.map((post, index) => (
                  <div
                    key={post.id || index}
                    style={{
                      maxWidth: '540px',
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {post.html ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: post.html }}
                        style={{ minHeight: '400px' }}
                      />
                    ) : (
                      <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#9ca3af'
                      }}>
                        <p>{t('instagram.unableToLoad')}</p>
                        {post.oembed_error && (
                          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            {post.oembed_error}
                          </p>
                        )}
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            marginTop: '1rem',
                            color: '#E11D48',
                            textDecoration: 'underline'
                          }}
                        >
                          {t('instagram.viewOnInstagram')}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Meta Review Info Box */}
            <div className="sms-highlight-box" style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ margin: 0 }}>
                {t('instagram.metaInfo')}
                <br />
                {t('instagram.metaInfoDetail')}
              </p>
            </div>

            {/* View More Button */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <a
                href="https://www.instagram.com/gudinocustomwoodworking"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 2rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {t('instagram.viewMore')}
                <ExternalLink size={18} />
              </a>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default InstagramEmbed;
