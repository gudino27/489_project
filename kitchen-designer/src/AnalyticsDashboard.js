import React, { useState, useEffect } from 'react';
import {
  BarChart,
  TrendingUp,
  Users,
  Eye,
  Activity,
  Calendar,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard = ({ token, API_BASE }) => {
  const [analytics, setAnalytics] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      
      // Fetch analytics data
      const analyticsResponse = await fetch(`${API_BASE}/api/analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!analyticsResponse.ok) throw new Error('Failed to fetch analytics');

      const analyticsData = await analyticsResponse.json();
      setAnalytics(analyticsData);

      // Fetch recent activity logs
      const logsResponse = await fetch(`${API_BASE}/api/activity-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!logsResponse.ok) throw new Error('Failed to fetch activity logs');

      const logsData = await logsResponse.json();
      setActivityLogs(logsData.slice(0, 10)); // Show last 10 activities
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatNumber = (num) => {
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    const icons = {
      'login': '🔐',
      'logout': '👋',
      'create_user': '👤',
      'update_user': '✏️',
      'delete_user': '🗑️',
      'update_prices': '💰',
      'upload_photo': '📷',
      'delete_photo': '🖼️',
      'save_design': '🎨'
    };
    return icons[action] || '📋';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart className="text-blue-600" />
          Analytics Dashboard
        </h2>
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Page Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analytics?.pageViews?.reduce((sum, page) => sum + page.views, 0) || 0)}
              </p>
            </div>
            <Eye className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analytics?.uniqueVisitors || 0)}
              </p>
            </div>
            <Users className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analytics?.activitySummary?.reduce((sum, activity) => sum + activity.count, 0) || 0)}
              </p>
            </div>
            <Activity className="text-purple-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Most Viewed</p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {analytics?.pageViews?.[0]?.page_path || 'N/A'}
              </p>
            </div>
            <TrendingUp className="text-orange-600" size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Traffic Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Traffic</h3>
          <div className="h-64">
            {analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Top Pages Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
          <div className="h-64">
            {analytics?.pageViews && analytics.pageViews.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={analytics.pageViews.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="page_path" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#10B981" />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {activityLogs.length > 0 ? (
            activityLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getActionIcon(log.action)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {log.username || 'System'} - {log.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(log.created_at)}</p>
                  </div>
                </div>
                {log.metadata && (
                  <div className="text-sm text-gray-600">
                    {JSON.parse(log.metadata).ip || ''}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analytics?.activitySummary?.map((activity) => (
            <div key={activity.action} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{activity.count}</p>
              <p className="text-sm text-gray-600">{activity.action.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;