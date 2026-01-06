import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

const PasswordChangeRequired = ({ username, onPasswordChanged, onCancel }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      setError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPassword, newPassword, confirmPassword]);

  // Password complexity validation
  const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push('Must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Must contain at least one special character');
    }

    return errors;
  };

  // Calculate password strength (0-5)
  const calculateStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return Math.min(strength, 5);
  };

  const getStrengthLabel = (strength) => {
    if (strength === 0) return { label: '', color: 'bg-gray-200' };
    if (strength <= 2) return { label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const handleNewPasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);

    // Validate password in real-time
    if (password) {
      const errors = validatePassword(password);
      setValidationErrors(errors);
      setPasswordStrength(calculateStrength(password));
    } else {
      setValidationErrors([]);
      setPasswordStrength(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password complexity
    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      setError('Password does not meet complexity requirements');
      return;
    }

    // Ensure new password is different from current
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/change-password-required`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Provide more specific error messages
        if (response.status === 401) {
          throw new Error('Current password is incorrect. Please try again.');
        } else if (response.status === 400) {
          throw new Error(data.error || 'Invalid request. Please check your input.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(data.error || 'Failed to change password');
        }
      }

      // Show success state before closing
      setSuccess(true);
      setIsLoading(false);

      // Wait 1.5 seconds to show success message, then proceed
      setTimeout(() => {
        onPasswordChanged(data.token, data.user);
      }, 500);

    } catch (err) {
      // Handle network errors specifically
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError(err.message);
      }
      setIsLoading(false);
    }
  };

  const strengthInfo = getStrengthLabel(passwordStrength);

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Password Changed!</h2>
          <p className="text-gray-600 mb-4">
            Your password has been updated successfully.
          </p>
          <p className="text-gray-500 text-sm">
            Logging you in...
          </p>
          <div className="mt-4">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">Password Change Required</h2>
        </div>
        <p className="text-gray-600 mb-6 ml-13">
          For security reasons, you must change your password before accessing the system.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={handleNewPasswordChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        level <= passwordStrength ? strengthInfo.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${
                    passwordStrength <= 2 ? 'text-red-600' :
                    passwordStrength <= 3 ? 'text-yellow-600' :
                    passwordStrength <= 4 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {strengthInfo.label}
                  </span>
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {newPassword && validationErrors.length > 0 && (
              <div className="mt-2 text-xs space-y-1">
                {validationErrors.map((err, index) => (
                  <div key={index} className="flex items-center gap-1 text-red-600">
                    <XCircle size={12} />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}
            {newPassword && validationErrors.length === 0 && (
              <div className="mt-2 flex items-center gap-1 text-green-600 text-xs">
                <CheckCircle size={12} />
                <span>Password meets all requirements</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-300'
                    : confirmPassword && newPassword === confirmPassword
                      ? 'border-green-300'
                      : 'border-gray-300'
                }`}
                required
                disabled={isLoading}
                placeholder="Re-enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs">
                <XCircle size={12} />
                <span>Passwords do not match</span>
              </div>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <div className="mt-1 flex items-center gap-1 text-green-600 text-xs">
                <CheckCircle size={12} />
                <span>Passwords match</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || validationErrors.length > 0 || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Changing Password...
                </span>
              ) : (
                'Change Password'
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Password Requirements Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Shield size={16} />
            Password Requirements
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              {newPassword && newPassword.length >= 8 ? (
                <CheckCircle size={12} className="text-green-600" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-gray-300"></span>
              )}
              At least 8 characters long
            </li>
            <li className="flex items-center gap-2">
              {newPassword && /[A-Z]/.test(newPassword) ? (
                <CheckCircle size={12} className="text-green-600" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-gray-300"></span>
              )}
              Contains uppercase letters (A-Z)
            </li>
            <li className="flex items-center gap-2">
              {newPassword && /[a-z]/.test(newPassword) ? (
                <CheckCircle size={12} className="text-green-600" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-gray-300"></span>
              )}
              Contains lowercase letters (a-z)
            </li>
            <li className="flex items-center gap-2">
              {newPassword && /\d/.test(newPassword) ? (
                <CheckCircle size={12} className="text-green-600" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-gray-300"></span>
              )}
              Contains numbers (0-9)
            </li>
            <li className="flex items-center gap-2">
              {newPassword && /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? (
                <CheckCircle size={12} className="text-green-600" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-gray-300"></span>
              )}
              Contains special characters (!@#$%^&*...)
            </li>
            <li className="flex items-center gap-2">
              {newPassword && currentPassword && newPassword !== currentPassword ? (
                <CheckCircle size={12} className="text-green-600" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-gray-300"></span>
              )}
              Different from your current password
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeRequired;
