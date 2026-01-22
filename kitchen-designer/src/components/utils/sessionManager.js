import Cookies from 'js-cookie';

const SESSION_COOKIE = 'admin_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

class SessionManager {
  constructor() {
    this.lastActivity = Date.now();
    this.inactivityTimer = null;
    this.onLogout = null;
  }

  // Initialize session from cookie
  initSession() {
    const sessionData = Cookies.get(SESSION_COOKIE);
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);

        // Check if session is still valid
        if (session.expiresAt > Date.now()) {
          this.startInactivityTimer();
          return session;
        } else {
          this.clearSession();
        }
      } catch (error) {
        console.error('Invalid session data:', error);
        this.clearSession();
      }
    }
    return null;
  }

  // Save session to cookie
  saveSession(user, token) {
    const session = {
      user,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION
    };

    // Set cookie with secure options
    Cookies.set(SESSION_COOKIE, JSON.stringify(session), {
      expires: new Date(session.expiresAt),
      sameSite: 'strict',
      secure: window.location.protocol === 'https:'
    });

    this.startInactivityTimer();
    return session;
  }

  // Clear session
  clearSession() {
    Cookies.remove(SESSION_COOKIE);
    this.stopInactivityTimer();

    if (this.onLogout) {
      this.onLogout();
    }
  }

  // Update activity timestamp
  updateActivity() {
    this.lastActivity = Date.now();

    // Update session expiry
    const sessionData = Cookies.get(SESSION_COOKIE);
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        session.expiresAt = Date.now() + SESSION_DURATION;

        Cookies.set(SESSION_COOKIE, JSON.stringify(session), {
          expires: new Date(session.expiresAt),
          sameSite: 'strict',
          secure: window.location.protocol === 'https:'
        });
      } catch (error) {
        console.error('Error updating session:', error);
      }
    }
  }

  // Start inactivity timer
  startInactivityTimer() {
    this.stopInactivityTimer();

    this.inactivityTimer = setInterval(() => {
      if (Date.now() - this.lastActivity > INACTIVITY_TIMEOUT) {
        //console.log('Session expired due to inactivity');
        this.clearSession();
      }
    }, 60000); // Check every minute
  }

  // Stop inactivity timer
  stopInactivityTimer() {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  // Set logout callback
  setLogoutCallback(callback) {
    this.onLogout = callback;
  }

  // Get current session
  getSession() {
    const sessionData = Cookies.get(SESSION_COOKIE);
    if (sessionData) {
      try {
        return JSON.parse(sessionData);
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  // Check if session is valid
  isAuthenticated() {
    const session = this.getSession();
    return session && session.expiresAt > Date.now();
  }

  // Get auth headers for API calls
  getAuthHeaders() {
    const session = this.getSession();
    if (session && session.token) {
      return {
        'Authorization': `Bearer ${session.token}`
      };
    }
    return {};
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Add activity listeners with throttling to prevent mobile performance issues
if (typeof window !== 'undefined') {
  // Throttle function to limit cookie updates - prevents excessive writes on mobile
  let lastActivityUpdate = 0;
  const THROTTLE_INTERVAL = 30000; // 30 seconds - only update cookie every 30s max

  const throttledUpdateActivity = () => {
    const now = Date.now();
    // Always update in-memory timestamp
    sessionManager.lastActivity = now;

    // Only update cookie if enough time has passed
    if (now - lastActivityUpdate >= THROTTLE_INTERVAL) {
      lastActivityUpdate = now;
      sessionManager.updateActivity();
    }
  };

  // Use passive listeners for scroll/touch to improve mobile performance
  const passiveOptions = { passive: true };

  // Desktop events - track with throttle
  window.addEventListener('mousedown', throttledUpdateActivity);
  window.addEventListener('keydown', throttledUpdateActivity);

  // Mobile events - use passive listeners and throttle aggressively
  window.addEventListener('touchstart', throttledUpdateActivity, passiveOptions);
  window.addEventListener('scroll', throttledUpdateActivity, passiveOptions);
}

export default sessionManager;