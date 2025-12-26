import React from 'react';
import { Instagram, ExternalLink } from 'lucide-react';

/**
 * InstagramPost - Individual Instagram post component
 *
 * Displays a single Instagram post (image or video) with caption and link
 * Supports both IMAGE, VIDEO, and CAROUSEL_ALBUM media types
 */
const InstagramPost = ({ post, className = '' }) => {
  const isVideo = post.media_type === 'VIDEO';

  return (
    <div
      className={`instagram-post ${className}`}
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      {/* Media (Image or Video) */}
      <a
        href={post.permalink}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', position: 'relative' }}
      >
        {isVideo ? (
          <video
            src={post.media_url}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover'
            }}
            muted
            loop
            playsInline
            onMouseOver={(e) => e.currentTarget.play()}
            onMouseOut={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
        ) : (
          <img
            src={post.media_url}
            alt={post.caption || 'Instagram post'}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover'
            }}
            loading="lazy"
          />
        )}

        {/* Instagram overlay icon */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '50%',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Instagram size={20} color="white" />
        </div>

        {/* External link icon on hover */}
        <div
          className="external-link-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
        >
          <ExternalLink size={32} color="white" />
        </div>
      </a>

      {/* Caption */}
      {post.caption && (
        <div style={{ padding: '1rem' }}>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#374151',
              lineHeight: '1.5',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              margin: 0
            }}
          >
            {post.caption}
          </p>
        </div>
      )}

      {/* View on Instagram link */}
      <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #E5E7EB', paddingTop: '0.75rem', marginTop: post.caption ? '0' : '1rem' }}>
        <a
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#E11D48',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          View on Instagram
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};

export default InstagramPost;
