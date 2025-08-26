// --------------------------------------
// import statements
//---------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Image,
  LogOut,
  Lock,
  IdCardLanyard,
  FileText,
  Users,
  Shield,
  BarChart3,
  MessageSquare,
  Receipt
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
// -------------------------------------------------
// Importing components for different functionalities
// These components will handle specific admin tasks
//  like price management, photo uploads,
//  employee management, etc
// -------------------------------------------------
import sessionManager from '../utils/sessionManager';
import PriceManagement from './PriceManagement';
import CategoryPhotoManager from './catergoryPhotoManager';
import EmployeeManager from './EmployeeManager';
import DesignViewer from '../design/DesignViewer';
import UserManagement from './UserManagement';
import Analytics from '../ui/Analytics';
import TestimonialManager from './TestimonialManager';
import InvoiceManager from './InvoiceManager';
import MainNavBar from '../ui/Navigation';
import '../css/admin.css';
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
  const navigate = useNavigate();

  // Language context
  const { t } = useLanguage();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('prices');
  const [isLoading, setIsLoading] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  // Base API URL, can be set via environment variable
  // This allows flexibility for different environments (development, production, etc.)
  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setLoginError('');

    if (!forgotPasswordEmail) {
      setLoginError('Please enter your email address');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetMessage(data.message);
        setForgotPasswordEmail('');
      } else {
        setLoginError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setLoginError('Failed to send reset email. Please try again.');
    }
  };

  // Tab access control
  const getAvailableTabs = () => {
    const baseTabs = ['prices', 'photos', 'employees', 'designs', 'invoices', 'testimonials'];
    if (user?.role === 'super_admin') {
      return [...baseTabs, 'users', 'analytics'];
    }
    return baseTabs;
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
            <h2 className="text-2xl font-bold text-center mb-6">
              {showForgotPassword ? 'Reset Password' : 'Admin Login'}
            </h2>

            {!showForgotPassword ? (
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">{t('admin.username')}</label>
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={loginCredentials.username}
                    onChange={(e) => setLoginCredentials({ ...loginCredentials, username: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder={t('admin.enterUsername')}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">{t('admin.password')}</label>
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={loginCredentials.password}
                    onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder={t('admin.enterPassword')}
                    required
                  />
                </div>
                <div className="mb-6 text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {t('admin.forgotPassword')}
                  </button>
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
                  {t('admin.login')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">{t('admin.emailAddress')}</label>
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder={t('admin.enterEmailAddress')}
                    required />
                </div>
                {loginError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {loginError}
                  </div>
                )}
                {resetMessage && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {resetMessage}
                  </div>
                )}
                <div className="space-y-3">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    {t('admin.sendResetLink')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetMessage('');
                      setLoginError('');
                      setForgotPasswordEmail('');
                    }}
                    className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition"
                  >
                    {t('admin.backToLogin')}
                  </button>
                </div>
              </form>
            )}

            <p className="text-xs text-gray-500 text-center mt-4">
              {showForgotPassword
                ? t('admin.enterEmail')
                : t('admin.contactAdmin')
              }
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
        <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
          <h1 className="text-xl md:text-2xl font-bold">{t('admin.title')}</h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 order-1 md:order-2">
              <span className="text-sm md:text-medium text-gray-800">{t('admin.welcome')}</span>
              <span className="font-medium text-sm md:text-base">{user?.username}</span>
              {user?.role === 'super_admin' && (
                <Shield className="text-purple-600" size={16} />
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 transition order-3"
              title={t('admin.logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Navigation Tabs with Glass Effect */}
      <div className="admin-nav-glass">
        <div className="px-4 md:px-6 py-2">
          <nav className="flex flex-wrap gap-1 md:gap-2 justify-center md:justify-start">
            {getAvailableTabs().map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`admin-tab-glass font-medium text-xs md:text-sm transition ${activeTab === tab
                  ? 'active text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                <div className="flex items-center gap-1 md:gap-2 tab-content">
                  {tab === 'prices' && <DollarSign size={16} className="md:w-[18px] md:h-[18px]" />}
                  {tab === 'photos' && <Image size={16} className="md:w-[18px] md:h-[18px]" />}
                  {tab === 'employees' && <IdCardLanyard size={16} className="md:w-[18px] md:h-[18px]" />}
                  {tab === 'designs' && <FileText size={16} className="md:w-[18px] md:h-[18px]" />}
                  {tab === 'invoices' && <Receipt size={16} className="md:w-[18px] md:h-[18px]" />}
                  {tab === 'testimonials' && <MessageSquare size={16} className="md:w-[18px] md:h-[18px]" />}
                  {tab === 'users' && <Users size={16} className="md:w-[18px] md:h-[18px]" />}
                  {tab === 'analytics' && <BarChart3 size={16} className="md:w-[18px] md:h-[18px]" />}
                  <span className="hidden sm:inline">{t(`admin.tabs.${tab}`)}</span>
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
            <PriceManagement token={token} API_BASE={API_BASE} userRole={user?.role} />
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
        {activeTab === 'designs' && (<DesignViewer token={token} API_BASE={API_BASE} userRole={user?.role} />)}
        {/*
         Invoice Management Tab
        */}
        {activeTab === 'invoices' && (<InvoiceManager token={token} API_BASE={API_BASE} userRole={user?.role} />)}
        {/*
         Testimonial Management Tab
        */}
        {activeTab === 'testimonials' && (<TestimonialManager token={token} API_BASE={API_BASE} userRole={user?.role} />)}
        {/*
         User Management Tab
        */}
        {activeTab === 'users' && user?.role === 'super_admin' && (
          <UserManagement token={token} API_BASE={API_BASE} />
        )}
        {/*
         Analytics Tab
        */}
        {activeTab === 'analytics' && user?.role === 'super_admin' && (
          <Analytics token={token} API_BASE={API_BASE} />
        )}

      </div>
    </div>
  );
};

export default AdminPanel;
