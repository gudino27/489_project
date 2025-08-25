import { useEffect, useRef, useState } from 'react';

const API_BASE = "https://api.gudinocustom.com";



// Get page category for Clarity tracking
const getPageCategory = (pagePath) => {
  if (!pagePath) return 'unknown';

  if (pagePath === '/' || pagePath === '/home') return 'homepage';
  if (pagePath.includes('/portfolio')) return 'portfolio';
  if (pagePath.includes('/design')) return 'design_tool';
  if (pagePath.includes('/about')) return 'about';
  if (pagePath.includes('/contact')) return 'contact';
  if (pagePath.includes('/admin')) return 'admin';
  if (pagePath.includes('/services')) return 'services';
  if (pagePath.includes('/areas')) return 'location_page';
  if (pagePath.includes('/testimonial')) return 'testimonial';

  return 'other';
};

// Generate a unique session ID
const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

// Get or create session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get user auth info if available
const getUserInfo = () => {
  try {
    const authToken = localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('authToken');

    if (authToken) {
      // Decode token to get user ID (basic implementation)
      try {
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        return payload.userId || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const useAnalytics = (pagePath) => {
  const [viewId, setViewId] = useState(null);
  const startTime = useRef(Date.now());
  const isTracking = useRef(false);

  // Track page view on mount
  useEffect(() => {
    if (!pagePath || isTracking.current) return;

    isTracking.current = true;
    startTime.current = Date.now();

    const trackPageView = async () => {
      try {
        const sessionId = getSessionId();
        const userId = getUserInfo();

        // Track with custom analytics
        const pageData = {
          page_path: pagePath,
          user_agent: navigator.userAgent,
          ip_address: null, // Will be filled by server
          referrer: document.referrer,
          session_id: sessionId,
          user_id: userId
        };

        const response = await fetch(`${API_BASE}/api/analytics/pageview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(pageData)
        });

        if (response.ok) {
          const result = await response.json();
          setViewId(result.viewId);
        }

       
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    };

    trackPageView();

    // Cleanup function to update time spent
    return () => {
      if (viewId) {
        const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

        // Send time spent data (fire and forget)
        fetch(`${API_BASE}/api/analytics/time`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            viewId,
            timeSpent
          })
        }).catch(() => { }); // Ignore errors for cleanup
      }
    };
  }, [pagePath]);

  // Update time spent when user leaves page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (viewId) {
        const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

        // Use sendBeacon for reliable delivery on page unload
        if (navigator.sendBeacon) {
          const data = JSON.stringify({ viewId, timeSpent });
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon(`${API_BASE}/api/analytics/time`, blob);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && viewId) {
        const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

        fetch(`${API_BASE}/api/analytics/time`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            viewId,
            timeSpent
          })
        }).catch(() => { });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [viewId]);

  return { viewId, sessionId: getSessionId() };
};

// Hook for tracking custom events
export const useEventTracking = () => {
  const trackEvent = async (eventName, eventData = {}) => {
    try {
      const sessionId = getSessionId();
      const userId = getUserInfo();

      // Track with custom analytics
      await fetch(`${API_BASE}/api/analytics/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          event_name: eventName,
          event_data: eventData,
          session_id: sessionId,
          user_id: userId,
          page_path: window.location.pathname
        })
      });

      // Track with Microsoft Clarity
      
    } catch (error) {
      console.error('Event tracking error:', error);
    }
  };

  return { trackEvent };
};