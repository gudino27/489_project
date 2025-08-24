import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Clock,
  Eye,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw,
  MessageSquare,
  Star,
  Camera,
  Send
} from 'lucide-react';

const Analytics = ({ token, API_BASE }) => {
  const [stats, setStats] = useState(null);
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [testimonialStats, setTestimonialStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Fetch analytics stats
      const statsResponse = await fetch(`${API_BASE}/api/analytics/stats?days=${dateRange}`, {
        headers,
        credentials: 'include'
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch analytics stats');
      }

      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch realtime stats
      const realtimeResponse = await fetch(`${API_BASE}/api/analytics/realtime`, {
        headers,
        credentials: 'include'
      });

      if (realtimeResponse.ok) {
        const realtimeData = await realtimeResponse.json();
        setRealtimeStats(realtimeData);
      }

      // Fetch testimonial analytics
      const testimonialResponse = await fetch(`${API_BASE}/api/admin/testimonial-analytics?days=${dateRange}`, {
        headers,
        credentials: 'include'
      });

      if (testimonialResponse.ok) {
        const testimonialData = await testimonialResponse.json();
        setTestimonialStats(testimonialData);
      }

      setError(null);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange, token]);

  // Auto-refresh realtime stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [dateRange, token]);

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles'
    });
  };

  if (loading && !stats) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Analytics</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Website traffic and user behavior insights</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Realtime Stats */}
      {realtimeStats && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-medium text-green-800">Live Stats</h3>
          </div>
          <p className="text-green-700">
            <strong>{realtimeStats.activeSessions}</strong> active users in the last 30 minutes
          </p>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Page Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.pageViews?.reduce((total, page) => total + page.view_count, 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.pageViews?.reduce((total, page) => total + page.unique_sessions, 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Time on Site</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(
                  stats?.pageViews?.reduce((total, page, index, array) =>
                    total + (page.avg_time_spent || 0), 0
                  ) / (stats?.pageViews?.length || 1)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Most Popular Page</p>
              <p className="text-lg font-bold text-gray-900">
                {stats?.pageViews?.[0]?.page_path || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial Analytics Section */}
      {testimonialStats && (
        <>
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Testimonial Analytics</h3>

            {/* Testimonial Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {testimonialStats.submissions.total_submissions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {testimonialStats.submissions.avg_rating ? testimonialStats.submissions.avg_rating.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Camera className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">With Photos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {testimonialStats.submissions.submissions_with_photos}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Send className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {testimonialStats.link_activity.conversion_rate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rating Distribution */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900">Rating Distribution</h4>
                </div>
                <div className="p-6">
                  {testimonialStats.rating_distribution.map((rating) => (
                    <div key={rating.rating} className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-600 w-12">
                          {rating.rating} ★
                        </span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{
                                width: `${(rating.count / testimonialStats.submissions.total_submissions) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">{rating.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Types */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900">Project Types</h4>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {testimonialStats.project_types.map((project) => (
                      <div key={project.project_type} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {project.project_type}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            (Avg: {project.avg_rating?.toFixed(1)} ★)
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">{project.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Views Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Pages</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Page</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Views</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Avg. Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.pageViews?.slice(0, 8).map((page, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-4 text-sm text-gray-900">{page.page_path}</td>
                      <td className="py-2 px-4 text-sm text-gray-600">{page.view_count}</td>
                      <td className="py-2 px-4 text-sm text-gray-600">
                        {formatTime(page.avg_time_spent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Browser Stats */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Browser Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.browsers?.map((browser, index) => {
                const total = stats.browsers.reduce((sum, b) => sum + b.count, 0);
                const percentage = ((browser.count / total) * 100).toFixed(1);

                return (
                  <div key={index} className="flex items-center">
                    <div className="flex items-center w-20">
                      {browser.browser === 'Chrome' && <Monitor className="h-4 w-4 text-blue-500 mr-2" />}
                      {browser.browser === 'Firefox' && <Globe className="h-4 w-4 text-orange-500 mr-2" />}
                      {browser.browser === 'Safari' && <Smartphone className="h-4 w-4 text-gray-500 mr-2" />}
                      {browser.browser === 'Edge' && <Monitor className="h-4 w-4 text-blue-400 mr-2" />}
                      {browser.browser === 'Other' && <Globe className="h-4 w-4 text-gray-400 mr-2" />}
                      <span className="text-sm text-gray-600">{browser.browser}</span>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 w-16 text-right">
                      {browser.count} ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Views Chart */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Daily Page Views</h3>
        </div>
        <div className="p-6">
          <div className="space-y-2">
            {stats?.dailyViews?.slice(0, 14).map((day, index) => {
              const maxViews = Math.max(...stats.dailyViews.map(d => d.views));
              const percentage = (day.views / maxViews) * 100;

              return (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-sm text-gray-600">
                    {formatDate(day.date)}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {day.views}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 w-16 text-right">
                    {day.unique_sessions} sessions
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {realtimeStats?.recentViews?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Page Views</h3>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {realtimeStats.recentViews.slice(0, 10).map((view, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="text-sm text-gray-900">{view.page_path}</div>
                    {view.time_spent_seconds && (
                      <div className="ml-2 text-xs text-gray-500">
                        ({formatTime(view.time_spent_seconds)})
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(view.viewed_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;