import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Analytics hook
export const useAnalytics = () => {
  const location = useLocation();
  const [visitorId] = useState(() => {
    let id = localStorage.getItem('visitor_id');
    if (!id) {
      id = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('visitor_id', id);
    }
    return id;
  });
  
  // Track the last tracked path to avoid duplicates
  const lastTrackedPath = useRef('');
  const isTracking = useRef(false);

  const trackPageView = useCallback(async (pagePath) => {
    // Prevent duplicate tracking
    if (isTracking.current || lastTrackedPath.current === pagePath) {
      return;
    }

    isTracking.current = true;
    lastTrackedPath.current = pagePath;

    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page_path: pagePath,
          visitor_id: visitorId,
          referrer: document.referrer || null
        })
      });
    } catch (error) {
      // Silently fail - don't break the app if analytics fails
      console.error('Analytics tracking error:', error);
    } finally {
      isTracking.current = false;
    }
  }, [visitorId]);

  useEffect(() => {
    // Only track if the path actually changed
    if (location.pathname !== lastTrackedPath.current) {
      // Debounce the tracking to avoid rapid fire
      const timer = setTimeout(() => {
        trackPageView(location.pathname);
      }, 500); // Wait 500ms before tracking

      return () => clearTimeout(timer);
    }
  }, [location.pathname, trackPageView]);

  return { 
    trackPageView: () => {}, // Do nothing
    visitorId: 'disabled' 
  };
};