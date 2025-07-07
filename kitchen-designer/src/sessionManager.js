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
        console.log('Session expired due to inactivity');
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

// Add activity listeners
if (typeof window !== 'undefined') {
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, () => {
      sessionManager.updateActivity();
    });
  });
}

export default sessionManager;