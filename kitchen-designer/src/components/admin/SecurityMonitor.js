import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Lock,
  Unlock,
  Activity,
  Clock,
  User,
  MapPin,
  Monitor,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';

/**
 * SecurityMonitor Component
 *
 * Displays security-related information for super admins including:
 * - Failed login attempts
 * - Currently locked accounts
 * - Activity audit logs
 * - Login success/failure statistics
 *
 * @param {string} token - Authentication token for API requests
 * @param {string} apiBase - Base URL for API endpoints
 */
const SecurityMonitor = ({ token, apiBase }) => {
  const [activeView, setActiveView] = useState('overview'); // overview, failed-logins, locked-accounts, audit-logs
  const [failedLogins, setFailedLogins] = useState([]);
  const [lockedAccounts, setLockedAccounts] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState(24); // Hours to look back for failed logins
  const [actionFilter, setActionFilter] = useState('all'); // Filter for activity logs

  // Fetch failed login attempts
  const fetchFailedLogins = async (hours = 24) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiBase}/api/admin/security/failed-logins?hours=${hours}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFailedLogins(data);
      } else {
        console.error('Failed to fetch failed logins');
      }
    } catch (error) {
      console.error('Error fetching failed logins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch locked accounts
  const fetchLockedAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiBase}/api/admin/security/locked-accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLockedAccounts(data);
      } else {
        console.error('Failed to fetch locked accounts');
      }
    } catch (error) {
      console.error('Error fetching locked accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch activity logs
  const fetchActivityLogs = async (action = null, limit = 100) => {
    try {
      setIsLoading(true);
      let url = `${apiBase}/api/admin/security/activity-logs?limit=${limit}`;
      if (action && action !== 'all') {
        url += `&action=${action}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivityLogs(data);
      } else {
        console.error('Failed to fetch activity logs');
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Unlock an account
  const unlockAccount = async (userId) => {
    if (!window.confirm('Are you sure you want to unlock this account?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/admin/security/unlock-account/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Account unlocked successfully');
        fetchLockedAccounts(); // Refresh the list
        fetchFailedLogins(timeFilter); // Refresh failed logins
      } else {
        alert('Failed to unlock account');
      }
    } catch (error) {
      console.error('Error unlocking account:', error);
      alert('Error unlocking account');
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (activeView === 'overview' || activeView === 'failed-logins') {
      fetchFailedLogins(timeFilter);
    }
    if (activeView === 'overview' || activeView === 'locked-accounts') {
      fetchLockedAccounts();
    }
    if (activeView === 'audit-logs') {
      fetchActivityLogs(actionFilter);
    }
  }, [activeView, timeFilter, actionFilter]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get action badge color
  const getActionColor = (action) => {
    const colors = {
      'login_success': 'bg-green-100 text-green-800',
      'login_failed': 'bg-yellow-100 text-yellow-800',
      'account_locked': 'bg-red-100 text-red-800',
      'logout': 'bg-gray-100 text-gray-800',
      'account_unlocked': 'bg-blue-100 text-blue-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  // Calculate statistics
  const stats = {
    totalFailedAttempts: failedLogins.filter(log => log.action === 'login_failed').length,
    lockedAccountsCount: lockedAccounts.length,
    recentActivity: activityLogs.length
  };

  return (
    <div className="security-monitor-container p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Security Monitor</h1>
        </div>
        <p className="text-gray-600">Monitor login attempts, locked accounts, and user activity</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveView('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'overview'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveView('failed-logins')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'failed-logins'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Failed Logins
        </button>
        <button
          onClick={() => setActiveView('locked-accounts')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'locked-accounts'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Lock className="w-4 h-4 inline mr-2" />
          Locked Accounts
        </button>
        <button
          onClick={() => setActiveView('audit-logs')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeView === 'audit-logs'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Audit Logs
        </button>
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Failed Attempts (24h)</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.totalFailedAttempts}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-yellow-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Locked Accounts</p>
                  <p className="text-3xl font-bold text-red-600">{stats.lockedAccountsCount}</p>
                </div>
                <Lock className="w-12 h-12 text-red-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Recent Activity</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.recentActivity}</p>
                </div>
                <Activity className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>
          </div>

          {/* Recent Failed Logins */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Recent Failed Login Attempts
              </h2>
              <button
                onClick={() => fetchFailedLogins(timeFilter)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {failedLogins.slice(0, 10).map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">{log.user_name}</p>
                      <p className="text-sm text-gray-600">{log.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(log.created_at)}</p>
                    {log.ip_address && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {log.ip_address}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {failedLogins.length === 0 && (
                <p className="text-center text-gray-500 py-8">No failed login attempts</p>
              )}
            </div>
          </div>

          {/* Locked Accounts */}
          {lockedAccounts.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-red-600" />
                Currently Locked Accounts
              </h2>
              <div className="space-y-2">
                {lockedAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900">{account.full_name || account.username}</p>
                        <p className="text-sm text-gray-600">{account.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Until {formatDate(account.account_locked_until)}
                        </p>
                        <p className="text-xs text-gray-400">{account.failed_login_attempts} failed attempts</p>
                      </div>
                      <button
                        onClick={() => unlockAccount(account.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Unlock className="w-3 h-3" />
                        Unlock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Failed Logins View */}
      {activeView === 'failed-logins' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Failed Login Attempts</h2>
            <div className="flex items-center gap-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={1}>Last Hour</option>
                <option value={24}>Last 24 Hours</option>
                <option value={168}>Last Week</option>
                <option value={720}>Last Month</option>
              </select>
              <button
                onClick={() => fetchFailedLogins(timeFilter)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">User</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Details</th>
                  <th className="text-left p-3 font-semibold text-gray-700">IP Address</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Date/Time</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {failedLogins.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{log.user_name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{log.details}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {log.ip_address || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{formatDate(log.created_at)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action === 'account_locked' ? 'Account Locked' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {failedLogins.length === 0 && (
              <p className="text-center text-gray-500 py-8">No failed login attempts found</p>
            )}
          </div>
        </div>
      )}

      {/* Locked Accounts View */}
      {activeView === 'locked-accounts' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Locked Accounts</h2>
            <button
              onClick={fetchLockedAccounts}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {lockedAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center gap-4">
                  <Lock className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{account.full_name || account.username}</p>
                    <p className="text-sm text-gray-600">{account.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {account.failed_login_attempts} failed attempts · Locked until {formatDate(account.account_locked_until)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => unlockAccount(account.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  Unlock Account
                </button>
              </div>
            ))}
            {lockedAccounts.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-green-500 mx-auto mb-3 opacity-50" />
                <p className="text-gray-500">No locked accounts</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs View */}
      {activeView === 'audit-logs' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Activity Audit Logs</h2>
            <div className="flex items-center gap-3">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Actions</option>
                <option value="login_success">Login Success</option>
                <option value="login_failed">Login Failed</option>
                <option value="logout">Logout</option>
                <option value="account_locked">Account Locked</option>
                <option value="account_unlocked">Account Unlocked</option>
              </select>
              <button
                onClick={() => fetchActivityLogs(actionFilter)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">User</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Action</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Details</th>
                  <th className="text-left p-3 font-semibold text-gray-700">IP Address</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Date/Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activityLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{log.user_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{log.details || '-'}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {log.ip_address || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activityLogs.length === 0 && (
              <p className="text-center text-gray-500 py-8">No activity logs found</p>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityMonitor;
