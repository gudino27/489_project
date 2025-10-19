import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
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
  Send,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { analyticsApi } from '../api/analytics';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';

const AnalyticsScreen = () => {
  const { token } = useAuth();

  const [stats, setStats] = useState(null);
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [testimonialStats, setTestimonialStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState(30);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchStats = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      // Fetch analytics stats
      const statsData = await analyticsApi.getStats(token, dateRange);
      setStats(statsData);

      // Fetch realtime stats
      try {
        const realtimeData = await analyticsApi.getRealtimeStats(token);
        setRealtimeStats(realtimeData);
      } catch (err) {
        console.log('Realtime stats not available');
      }

      // Fetch testimonial analytics
      try {
        const testimonialData = await analyticsApi.getTestimonialAnalytics(token, dateRange);
        setTestimonialStats(testimonialData);
      } catch (err) {
        console.log('Testimonial analytics not available');
      }

      setError(null);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Analytics</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchStats()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalPageViews = stats?.pageViews?.reduce((total, page) => total + page.view_count, 0) || 0;
  const totalSessions = stats?.pageViews?.reduce((total, page) => total + page.unique_sessions, 0) || 0;
  const avgTimeOnSite = stats?.pageViews?.reduce((total, page) => total + (page.avg_time_spent || 0), 0) / (stats?.pageViews?.length || 1);
  const mostPopularPage = stats?.pageViews?.[0]?.page_path || 'N/A';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
          <Text style={styles.headerSubtitle}>Website traffic and insights</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.dateRangeSelector}>
            <TouchableOpacity
              style={[styles.dateRangeButton, dateRange === 7 && styles.dateRangeButtonActive]}
              onPress={() => setDateRange(7)}
            >
              <Text style={[styles.dateRangeText, dateRange === 7 && styles.dateRangeTextActive]}>7d</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateRangeButton, dateRange === 30 && styles.dateRangeButtonActive]}
              onPress={() => setDateRange(30)}
            >
              <Text style={[styles.dateRangeText, dateRange === 30 && styles.dateRangeTextActive]}>30d</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateRangeButton, dateRange === 90 && styles.dateRangeButtonActive]}
              onPress={() => setDateRange(90)}
            >
              <Text style={[styles.dateRangeText, dateRange === 90 && styles.dateRangeTextActive]}>90d</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={() => fetchStats()} disabled={loading}>
            <RefreshCw size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Realtime Stats */}
        {realtimeStats && realtimeStats.activeSessions > 0 && (
          <View style={styles.realtimeCard}>
            <View style={styles.realtimePulse} />
            <Text style={styles.realtimeTitle}>Live Stats</Text>
            <Text style={styles.realtimeText}>
              <Text style={styles.realtimeCount}>{realtimeStats.activeSessions}</Text> active users in the last 30 minutes
            </Text>
          </View>
        )}

        {/* Key Metrics */}
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <ContentGlass style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Eye size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.metricLabel}>Total Page Views</Text>
            <Text style={styles.metricValue}>{totalPageViews}</Text>
          </ContentGlass>

          <ContentGlass style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Users size={24} color={COLORS.success} />
            </View>
            <Text style={styles.metricLabel}>Unique Sessions</Text>
            <Text style={styles.metricValue}>{totalSessions}</Text>
          </ContentGlass>

          <ContentGlass style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#9333EA20' }]}>
              <Clock size={24} color="#9333EA" />
            </View>
            <Text style={styles.metricLabel}>Avg. Time on Site</Text>
            <Text style={styles.metricValue}>{formatTime(avgTimeOnSite)}</Text>
          </ContentGlass>

          <ContentGlass style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: COLORS.warning + '20' }]}>
              <TrendingUp size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.metricLabel}>Popular Page</Text>
            <Text style={styles.metricPopularPage}>{mostPopularPage}</Text>
          </ContentGlass>
        </View>

        {/* Testimonial Analytics */}
        {testimonialStats && (
          <>
            <Text style={styles.sectionTitle}>Testimonial Analytics</Text>
            <View style={styles.metricsGrid}>
              <ContentGlass style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: COLORS.primary + '20' }]}>
                  <MessageSquare size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.metricLabel}>Total Submissions</Text>
                <Text style={styles.metricValue}>{testimonialStats.submissions?.total_submissions || 0}</Text>
              </ContentGlass>

              <ContentGlass style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: '#FCD34D40' }]}>
                  <Star size={24} color="#FCD34D" />
                </View>
                <Text style={styles.metricLabel}>Average Rating</Text>
                <Text style={styles.metricValue}>
                  {testimonialStats.submissions?.avg_rating ? testimonialStats.submissions.avg_rating.toFixed(1) : 'N/A'}
                </Text>
              </ContentGlass>

              <ContentGlass style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: COLORS.success + '20' }]}>
                  <Camera size={24} color={COLORS.success} />
                </View>
                <Text style={styles.metricLabel}>With Photos</Text>
                <Text style={styles.metricValue}>{testimonialStats.submissions?.submissions_with_photos || 0}</Text>
              </ContentGlass>

              <ContentGlass style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: '#9333EA20' }]}>
                  <Send size={24} color="#9333EA" />
                </View>
                <Text style={styles.metricLabel}>Conversion Rate</Text>
                <Text style={styles.metricValue}>{testimonialStats.link_activity?.conversion_rate || 0}%</Text>
              </ContentGlass>
            </View>

            {/* Rating Distribution */}
            {testimonialStats.rating_distribution && testimonialStats.rating_distribution.length > 0 && (
              <ContentGlass style={styles.chartCard}>
                <Text style={styles.chartTitle}>Rating Distribution</Text>
                {testimonialStats.rating_distribution.map((rating) => {
                  const percentage = (rating.count / (testimonialStats.submissions?.total_submissions || 1)) * 100;
                  return (
                    <View key={rating.rating} style={styles.ratingRow}>
                      <Text style={styles.ratingLabel}>{rating.rating} ★</Text>
                      <View style={styles.ratingBarContainer}>
                        <View style={[styles.ratingBar, { width: `${percentage}%` }]} />
                      </View>
                      <Text style={styles.ratingCount}>{rating.count}</Text>
                    </View>
                  );
                })}
              </ContentGlass>
            )}

            {/* Project Types */}
            {testimonialStats.project_types && testimonialStats.project_types.length > 0 && (
              <ContentGlass style={styles.chartCard}>
                <Text style={styles.chartTitle}>Project Types</Text>
                {testimonialStats.project_types.map((project) => (
                  <View key={project.project_type} style={styles.projectRow}>
                    <View style={styles.projectInfo}>
                      <Text style={styles.projectName}>{project.project_type}</Text>
                      <Text style={styles.projectRating}>Avg: {project.avg_rating?.toFixed(1)} ★</Text>
                    </View>
                    <Text style={styles.projectCount}>{project.count}</Text>
                  </View>
                ))}
              </ContentGlass>
            )}
          </>
        )}

        {/* Top Pages */}
        {stats?.pageViews && stats.pageViews.length > 0 && (
          <ContentGlass style={styles.chartCard}>
            <Text style={styles.chartTitle}>Top Pages</Text>
            {stats.pageViews.slice(0, 8).map((page, index) => (
              <View key={index} style={styles.pageRow}>
                <View style={styles.pageInfo}>
                  <Text style={styles.pagePath}>{page.page_path}</Text>
                  <Text style={styles.pageTime}>{formatTime(page.avg_time_spent)}</Text>
                </View>
                <Text style={styles.pageViews}>{page.view_count}</Text>
              </View>
            ))}
          </ContentGlass>
        )}

        {/* Browser Breakdown */}
        {stats?.browsers && stats.browsers.length > 0 && (
          <ContentGlass style={styles.chartCard}>
            <Text style={styles.chartTitle}>Browser Breakdown</Text>
            {stats.browsers.map((browser, index) => {
              const total = stats.browsers.reduce((sum, b) => sum + b.count, 0);
              const percentage = ((browser.count / total) * 100).toFixed(1);

              return (
                <View key={index} style={styles.browserRow}>
                  <View style={styles.browserInfo}>
                    {browser.browser === 'Chrome' && <Monitor size={16} color={COLORS.primary} />}
                    {browser.browser === 'Firefox' && <Globe size={16} color="#FF7139" />}
                    {browser.browser === 'Safari' && <Smartphone size={16} color={COLORS.textSecondary} />}
                    {browser.browser === 'Edge' && <Monitor size={16} color="#0078D4" />}
                    {browser.browser === 'Other' && <Globe size={16} color={COLORS.textSecondary} />}
                    <Text style={styles.browserName}>{browser.browser}</Text>
                  </View>
                  <View style={styles.browserBarContainer}>
                    <View style={[styles.browserBar, { width: `${percentage}%` }]} />
                  </View>
                  <Text style={styles.browserCount}>
                    {browser.count} ({percentage}%)
                  </Text>
                </View>
              );
            })}
          </ContentGlass>
        )}

        {/* Daily Views Chart */}
        {stats?.dailyViews && stats.dailyViews.length > 0 && (
          <ContentGlass style={styles.chartCard}>
            <Text style={styles.chartTitle}>Daily Page Views</Text>
            {stats.dailyViews.slice(0, 14).map((day, index) => {
              const maxViews = Math.max(...stats.dailyViews.map((d) => d.views));
              const percentage = (day.views / maxViews) * 100;

              return (
                <View key={index} style={styles.dailyRow}>
                  <Text style={styles.dailyDate}>{formatDate(day.date)}</Text>
                  <View style={styles.dailyBarContainer}>
                    <View style={[styles.dailyBar, { width: `${percentage}%` }]}>
                      <Text style={styles.dailyBarText}>{day.views}</Text>
                    </View>
                  </View>
                  <Text style={styles.dailySessions}>{day.unique_sessions} sessions</Text>
                </View>
              );
            })}
          </ContentGlass>
        )}

        {/* Recent Activity */}
        {realtimeStats?.recentViews && realtimeStats.recentViews.length > 0 && (
          <ContentGlass style={styles.chartCard}>
            <Text style={styles.chartTitle}>Recent Page Views</Text>
            {realtimeStats.recentViews.slice(0, 10).map((view, index) => (
              <View key={index} style={styles.recentRow}>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentPath}>{view.page_path}</Text>
                  {view.time_spent_seconds && (
                    <Text style={styles.recentTime}>({formatTime(view.time_spent_seconds)})</Text>
                  )}
                </View>
                <Text style={styles.recentTimestamp}>
                  {new Date(view.viewed_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </ContentGlass>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING[4],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[5],
  },
  errorTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.error,
    marginBottom: SPACING[2],
  },
  errorMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[4],
  },
  retryButton: {
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.md,
  },
  retryButtonText: {
    ...TYPOGRAPHY.buttonMedium,
    color: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: SPACING[5],
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: SPACING[1],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginTop: SPACING[3],
  },
  dateRangeSelector: {
    flexDirection: 'row',
    gap: SPACING[2],
    flex: 1,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dateRangeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateRangeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  dateRangeTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  refreshButton: {
    padding: SPACING[2],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    flex: 1,
    padding: SPACING[5],
  },
  realtimeCard: {
    padding: SPACING[4],
    backgroundColor: COLORS.success + '15',
    borderWidth: 1,
    borderColor: COLORS.success + '40',
    borderRadius: RADIUS.lg,
    marginBottom: SPACING[5],
  },
  realtimePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginBottom: SPACING[2],
  },
  realtimeTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.success,
    fontWeight: '600',
    marginBottom: SPACING[1],
  },
  realtimeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.success,
  },
  realtimeCount: {
    fontWeight: '700',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
    marginBottom: SPACING[5],
  },
  metricCard: {
    width: '48%',
    padding: SPACING[4],
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  metricLabel: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  metricValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '700',
  },
  metricPopularPage: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartCard: {
    padding: SPACING[5],
    borderRadius: RADIUS.lg,
    marginBottom: SPACING[4],
  },
  chartTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING[4],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  ratingLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    width: 40,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    marginHorizontal: SPACING[3],
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#FCD34D',
    borderRadius: 4,
  },
  ratingCount: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  projectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    fontWeight: '500',
  },
  projectRating: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING[1],
  },
  projectCount: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  pageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  pageInfo: {
    flex: 1,
  },
  pagePath: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
  },
  pageTime: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING[1],
  },
  pageViews: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  browserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  browserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    width: 80,
  },
  browserName: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  browserBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    marginHorizontal: SPACING[3],
    overflow: 'hidden',
  },
  browserBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  browserCount: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    width: 80,
    textAlign: 'right',
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  dailyDate: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    width: 60,
  },
  dailyBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    marginHorizontal: SPACING[3],
    overflow: 'hidden',
  },
  dailyBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    justifyContent: 'center',
    paddingRight: SPACING[2],
    alignItems: 'flex-end',
  },
  dailyBarText: {
    ...TYPOGRAPHY.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  dailySessions: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    width: 70,
    textAlign: 'right',
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  recentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentPath: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
  },
  recentTime: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING[2],
  },
  recentTimestamp: {
    ...TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
});

export default AnalyticsScreen;
