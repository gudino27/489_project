// --------------------------------------
// import statements
//---------------------------------------

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Image,
  LogOut,
  Lock,
  IdCardLanyard,
  FileText,
  Users,
  BarChart,
  Shield
} from 'lucide-react';
// -------------------------------------------------
// Importing components for different functionalities
// These components will handle specific admin tasks
//  like price management, photo uploads,
//  employee management, etc 
// -------------------------------------------------
import sessionManager from './sessionManager';
import PriceManagement from './PriceManagement';
import CategoryPhotoManager from './catergoryPhotoManager';
import EmployeeManager from './EmployeeManager';
import DesignViewer from './DesignViewer';
import UserManagement from './UserManagement';
import './AdminPanel.css';
// ----------------------------------------------------
// Admin Panel Component
// This component handles the admin panel functionality
// including login, session management,
// and tab navigation
// It uses session management to maintain
// user authentication and provides access to different
// admin functionalities
// ----------------------------------------------------

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('prices');
  const [isLoading, setIsLoading] = useState(true);

  // Base API URL, can be set via environment variable
  // This allows flexibility for different environments (development, production, etc.)
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  //------------------------------------------------
  // useEffect hook to manage session initialization
  // and authentication
  // Initialize session and check authentication
  // status
  // This effect runs once on component mount to
  // check if the user is already authenticated
  // It also sets up a logout callback to clear
  // session data when the user logs out
  //------------------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      // Try to restore session from cookie
      const session = sessionManager.initSession();

      if (session) {
        // Validate session with backend
        try {
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${session.token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(session.token);
            setIsAuthenticated(true);
          } else {
            sessionManager.clearSession();
          }
        } catch (error) {
          console.error('Session validation error:', error);
        }
      }

      setIsLoading(false);
    };

    // Set logout callback
    sessionManager.setLogoutCallback(() => {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    });

    initAuth();
  }, []);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginCredentials)
      });

      const data = await response.json();

      if (response.ok) {
        // Save session to cookie
        sessionManager.saveSession(data.user, data.token);

        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);

        // Clear form
        setLoginCredentials({ username: '', password: '' });
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);

      // Fallback for development
      if (loginCredentials.username === 'admin' && loginCredentials.password === 'testing') {
        const mockUser = { username: 'admin', role: 'admin' };
        const mockToken = 'development-token';

        sessionManager.saveSession(mockUser, mockToken);
        setUser(mockUser);
        setToken(mockToken);
        setIsAuthenticated(true);
      } else {
        setLoginError('Failed to connect to server');
      }
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: sessionManager.getAuthHeaders()
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    sessionManager.clearSession();
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  };

  // Tab access control
  const getAvailableTabs = () => {
    const baseTabs = ['prices', 'photos', 'employees', 'designs'];
    if (user?.role === 'super_admin') {
      return [...baseTabs, 'users'];
    }
    return baseTabs;
  };
  const MainNavBar = () => {
    const navigateToPage = (page) => {
      const issameDomain = window.location.port === '3000';

      if (issameDomain) {
        window.location.href = `/pages/${page}`;
      } else {
        window.location.href = `http://127.0.0.1:5500/${page}`;
      }
    };

    return (
      <nav
        className="w-full flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: 'rgb(0, 0, 0)' }}
      >
        <button
          onClick={() => navigateToPage('home.html')}
          className="nav-link text-white"
        >
          Home
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateToPage('portfolio.html')}
            className="nav-link text-white"
          >
            Portfolio
          </button>
          <button
            onClick={() => navigateToPage('design.html')}
            className="nav-link text-white"
          >
            Design
          </button>
          <button
            onClick={() => navigateToPage('about.html')}
            className="nav-link text-white"
          >
            About
          </button>
          <button
            onClick={() => navigateToPage('contact.html')}
            className="nav-link text-white"
          >
            Contact
          </button>
          <span className="nav-link active text-white">
            Login
          </span>
        </div>
      </nav>
    );
  };
  // Login screen
  if (!isAuthenticated) {
    return (
            <><MainNavBar />
            <div className="min-h-screen bg-gray-100 flex items-center justify-center" style={{ backgroundColor: 'rgb(110, 110, 110)' }}>
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <div className="flex items-center justify-center mb-6">
            <Lock className="text-blue-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={loginCredentials.username}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, username: e.target.value })}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter username"
                required />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={loginCredentials.password}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter password"
                required />
            </div>
            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {loginError}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
            Contact your super admin for access
          </p>
        </div>
      </div></>
    );
  }
 

  // -----------------------------
  // Render the admin panel UI
  // This will display the header, navigation tabs, and content area based on the active tab
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Navigation Bar */}
      <MainNavBar />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Logged in as:</span>
              <span className="font-medium">{user?.username}</span>
              {user?.role === 'super_admin' && (
                <Shield className="text-purple-600" size={16} />
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Seconday Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <nav className="flex space-x-8">
            {getAvailableTabs().map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <div className="flex items-center gap-2">
                  {tab === 'prices' && <DollarSign size={18} />}
                  {tab === 'photos' && <Image size={18} />}
                  {tab === 'employees' && <IdCardLanyard size={18} />}
                  {tab === 'designs' && <FileText size={18} />}
                  {tab === 'users' && <Users size={18} />}
                  <span className="capitalize">{tab}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {activeTab === 'prices' && (
          <div className="p-6">
            {/*
             Price Management Tab 
             loaded in from a different component
             */}
            <PriceManagement token={token} API_BASE={API_BASE} />
          </div>
        )}

        {/*
         Photo Management Tab 
         loaded in from a different component
         */}
        {activeTab === 'photos' && (
          <CategoryPhotoManager token={token} API_BASE={API_BASE} />
        )}
        {/*
         Employee Management Tab
         This component will handle employee data management, including adding, editing, and deleting employees
        */}
        {activeTab === 'employees' && (<EmployeeManager token={token} API_BASE={API_BASE} />)}
        {/*
         Design Viewer Tab
        */}
        {activeTab === 'designs' && (<DesignViewer token={token} API_BASE={API_BASE} />)}
        {/*
         User Management Tab 
        */}
        {activeTab === 'users' && user?.role === 'super_admin' && (
          <UserManagement token={token} API_BASE={API_BASE} />
        )}
      
      </div>
    </div>
  );
};

export default AdminPanel;