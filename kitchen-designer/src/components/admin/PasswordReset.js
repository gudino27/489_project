import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, XCircle } from 'lucide-react';
import Navigation from '../ui/Navigation';

const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [username, setUsername] = useState('');

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
      return;
    }

    // Validate token
    const validateToken = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/validate-reset-token/${token}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setTokenValid(true);
          setUsername(data.username);
        } else {
          const data = await response.json();
          setError(data.error || 'Invalid or expired reset link');
          setTokenValid(false);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setError('Failed to validate reset link');
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token, API_BASE]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96 text-center">
            <XCircle className="text-red-600 mx-auto mb-4" size={48} />
            <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">This password reset link is invalid or missing.</p>
            <button
              onClick={() => navigate('/admin')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </>
    );
  }

  if (tokenValid === false) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96 text-center">
            <XCircle className="text-red-600 mx-auto mb-4" size={48} />
            <h2 className="text-2xl font-bold text-red-600 mb-4">Expired Reset Link</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/admin')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Request New Reset Link
            </button>
          </div>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96 text-center">
            <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
            <h2 className="text-2xl font-bold text-green-600 mb-4">Password Reset Successful</h2>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You will be redirected to the login page in a few seconds.
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Login Now
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" style={{ backgroundColor: 'rgb(110, 110, 110)' }}>
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <div className="flex items-center justify-center mb-6">
            <Lock className="text-blue-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Reset Password</h2>
          {username && (
            <p className="text-gray-600 text-center mb-6">
              Resetting password for: <strong>{username}</strong>
            </p>
          )}

          {tokenValid === null ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Validating reset link...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/admin')}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PasswordReset;