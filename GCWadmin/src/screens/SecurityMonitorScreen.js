import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  BarChart3, AlertTriangle, Lock, Unlock, FileText,
  User, Shield, RefreshCw, Clock, MapPin, CheckCircle,
  XCircle, Activity, Eye, ChevronDown,
} from 'lucide-react-native';

const SecurityMonitorScreen = () => {
  const { token, API_BASE, getAuthHeaders, getAuthHeadersJson } = useAuth();
  const { t } = useLanguage();

  // Define TABS with Lucide icon components
  const TABS = [
    { id: 'overview', label: t('securityMonitor.overview'), icon: BarChart3 },
    { id: 'failed-logins', label: t('securityMonitor.failedLogins'), icon: AlertTriangle },
    { id: 'locked-accounts', label: t('securityMonitor.lockedAccounts'), icon: Lock },
    { id: 'audit-logs', label: t('securityMonitor.auditLogs'), icon: FileText },
  ];

  const TIME_FILTERS = [
    { value: 1, label: t('securityMonitor.lastHour') },
    { value: 24, label: t('securityMonitor.last24Hours') },
    { value: 168, label: t('securityMonitor.lastWeek') },
    { value: 720, label: t('securityMonitor.lastMonth') },
  ];

  const ACTION_FILTERS = [
    { value: 'all', label: t('securityMonitor.allActions') },
    { value: 'login_success', label: t('securityMonitor.loginSuccess') },
    { value: 'login_failed', label: t('securityMonitor.loginFailed') },
    { value: 'logout', label: t('securityMonitor.logout') },
    { value: 'account_locked', label: t('securityMonitor.accountLocked') },
    { value: 'account_unlocked', label: t('securityMonitor.accountUnlocked') },
  ];

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [failedLogins, setFailedLogins] = useState([]);
  const [lockedAccounts, setLockedAccounts] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Filter states
  const [timeFilter, setTimeFilter] = useState(24);
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    if (activeTab === 'failed-logins') {
      fetchFailedLogins(timeFilter);
    } else if (activeTab === 'locked-accounts') {
      fetchLockedAccounts();
    } else if (activeTab === 'audit-logs') {
      fetchActivityLogs(actionFilter);
    } else if (activeTab === 'overview') {
      fetchData();
    }
  }, [activeTab, timeFilter, actionFilter, token]);

  const fetchData = async () => {
    if (!token) return;
    await Promise.all([
      fetchFailedLogins(timeFilter),
      fetchLockedAccounts(),
      fetchActivityLogs('all', 50),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchFailedLogins = async (hours = 24) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/security/failed-logins?hours=${hours}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setFailedLogins(data);
      } else {
        console.error(t('securityMonitor.errors.fetchFailedLogins'), response.status);
      }
    } catch (error) {
      console.error(t('securityMonitor.errors.fetchFailedLogins'), error);
    }
  };

  const fetchLockedAccounts = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/security/locked-accounts`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setLockedAccounts(data);
      } else {
        console.error(t('securityMonitor.errors.fetchLockedAccounts'), response.status);
      }
    } catch (error) {
      console.error(t('securityMonitor.errors.fetchLockedAccounts'), error);
    }
  };

  const fetchActivityLogs = async (action = 'all', limit = 100) => {
    if (!token) return;
    try {
      const actionParam = action === 'all' ? '' : `&action=${action}`;
      const response = await fetch(`${API_BASE}/api/admin/security/activity-logs?limit=${limit}${actionParam}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setActivityLogs(data);
      } else {
        console.error(t('securityMonitor.errors.fetchActivityLogs'), response.status);
      }
    } catch (error) {
      console.error(t('securityMonitor.errors.fetchActivityLogs'), error);
    }
  };

  const unlockAccount = async (userId) => {
    Alert.alert(
      t('securityMonitor.unlockAccount'),
      t('securityMonitor.unlockConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('securityMonitor.unlock'),
          onPress: async () => {
            if (!token) return;
            setLoading(true);
            try {
              const response = await fetch(`${API_BASE}/api/admin/security/unlock-account/${userId}`, {
                method: 'POST',
                headers: getAuthHeadersJson(),
              });

              if (response.ok) {
                Alert.alert('Success', 'Account unlocked successfully');
                fetchLockedAccounts();
                fetchActivityLogs(actionFilter);
              } else {
                Alert.alert('Error', 'Failed to unlock account');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to unlock account');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action) => {
    const colors = {
      login_success: { bg: '#d4edda', text: '#155724' },
      login_failed: { bg: '#fff3cd', text: '#856404' },
      account_locked: { bg: '#f8d7da', text: '#721c24' },
      logout: { bg: '#e2e3e5', text: '#383d41' },
      account_unlocked: { bg: '#d1ecf1', text: '#0c5460' },
    };
    return colors[action] || { bg: '#e2e3e5', text: '#383d41' };
  };

  // Helper function to get action icon component
  const getActionIcon = (action, size = 14) => {
    switch (action) {
      case 'login_success':
        return <CheckCircle size={size} color={COLORS.success} />;
      case 'login_failed':
        return <XCircle size={size} color={COLORS.warning} />;
      case 'account_locked':
        return <Lock size={size} color={COLORS.error} />;
      case 'account_unlocked':
        return <Unlock size={size} color={COLORS.primary} />;
      case 'logout':
        return <Activity size={size} color={COLORS.textLight} />;
      default:
        return <Activity size={size} color={COLORS.textLight} />;
    }
  };

  const stats = {
    totalFailedAttempts: failedLogins.filter((log) => log.action === 'login_failed').length,
    lockedAccountsCount: lockedAccounts.length,
    recentActivity: activityLogs.length,
  };

  const renderOverviewTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.error} colors={[COLORS.error]} />}
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <ContentGlass style={[styles.statCard, { borderLeftColor: COLORS.warning, borderLeftWidth: 4 }]}>
          <Text style={styles.statLabel}>Failed Attempts (24h)</Text>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.totalFailedAttempts}</Text>
          <View style={styles.statIconContainer}>
            <AlertTriangle size={40} color={COLORS.warning} style={{ opacity: 0.2 }} />
          </View>
        </ContentGlass>

        <ContentGlass style={[styles.statCard, { borderLeftColor: COLORS.error, borderLeftWidth: 4 }]}>
          <Text style={styles.statLabel}>Locked Accounts</Text>
          <Text style={[styles.statValue, { color: COLORS.error }]}>{stats.lockedAccountsCount}</Text>
          <View style={styles.statIconContainer}>
            <Lock size={40} color={COLORS.error} style={{ opacity: 0.2 }} />
          </View>
        </ContentGlass>

        <ContentGlass style={[styles.statCard, { borderLeftColor: COLORS.primary, borderLeftWidth: 4 }]}>
          <Text style={styles.statLabel}>Recent Activity</Text>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.recentActivity}</Text>
          <View style={styles.statIconContainer}>
            <BarChart3 size={40} color={COLORS.primary} style={{ opacity: 0.2 }} />
          </View>
        </ContentGlass>
      </View>

      {/* Recent Failed Logins */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <AlertTriangle size={18} color={COLORS.warning} />
          <Text style={styles.sectionTitle}>Recent Failed Logins</Text>
        </View>
        <TouchableOpacity onPress={() => fetchFailedLogins(timeFilter)} style={styles.refreshButton}>
          <RefreshCw size={12} color={COLORS.white} />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {failedLogins.slice(0, 10).map((log, index) => (
        <ContentGlass key={index} style={styles.logCard}>
          <View style={styles.logHeader}>
            <View style={styles.logUserContainer}>
              <User size={16} color={COLORS.text} />
              <Text style={styles.logUser}>{log.user_name}</Text>
            </View>
            <Text style={styles.logDate}>{formatDate(log.created_at)}</Text>
          </View>
          <Text style={styles.logDetails}>{log.details}</Text>
          {log.ip_address && (
            <View style={styles.logIpContainer}>
              <MapPin size={12} color={COLORS.textLight} />
              <Text style={styles.logIp}>{log.ip_address}</Text>
            </View>
          )}
        </ContentGlass>
      ))}

      {failedLogins.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No failed logins found</Text>
        </View>
      )}

      {/* Locked Accounts */}
      {lockedAccounts.length > 0 && (
        <>
          <View style={[styles.sectionTitleContainer, { paddingHorizontal: SPACING[4], marginTop: SPACING[5], marginBottom: SPACING[3] }]}>
            <Lock size={18} color={COLORS.error} />
            <Text style={styles.sectionTitle}>Currently Locked Accounts</Text>
          </View>
          {lockedAccounts.map((account) => (
            <ContentGlass key={account.id} style={styles.lockedAccountCard}>
              <View style={styles.lockedAccountHeader}>
                <View style={styles.lockedAccountInfo}>
                  <Text style={styles.lockedAccountName}>{account.full_name || account.username}</Text>
                  <Text style={styles.lockedAccountEmail}>{account.email}</Text>
                  <Text style={styles.lockedAccountDetails}>
                    {account.failed_login_attempts} failed attempts · Until {formatDate(account.account_locked_until)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.unlockButton}
                  onPress={() => unlockAccount(account.id)}
                  disabled={loading}
                >
                  <Unlock size={14} color={COLORS.white} />
                  <Text style={styles.unlockButtonText}>Unlock</Text>
                </TouchableOpacity>
              </View>
            </ContentGlass>
          ))}
        </>
      )}
    </ScrollView>
  );

  const renderFailedLoginsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Time Filter:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {TIME_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[styles.filterButton, timeFilter === filter.value && styles.filterButtonActive]}
              onPress={() => setTimeFilter(filter.value)}
            >
              <Text style={[styles.filterButtonText, timeFilter === filter.value && styles.filterButtonTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={failedLogins}
        keyExtractor={(item, index) => String(index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.error} colors={[COLORS.error]} />}
        renderItem={({ item }) => {
          const colors = getActionColor(item.action);
          return (
            <ContentGlass style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logUserContainer}>
                  <User size={16} color={COLORS.text} />
                  <Text style={styles.logUser}>{item.user_name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.text }]}>
                    {item.action === 'account_locked' ? t('securityMonitor.accountLocked') : t('securityMonitor.failed')}
                  </Text>
                </View>
              </View>
              <Text style={styles.logDetails}>{item.details}</Text>
              <View style={styles.logFooter}>
                {item.ip_address && (
                  <View style={styles.logIpContainer}>
                    <MapPin size={12} color={COLORS.textLight} />
                    <Text style={styles.logIp}>{item.ip_address}</Text>
                  </View>
                )}
                <View style={styles.logDateContainer}>
                  <Clock size={12} color={COLORS.textLight} />
                  <Text style={styles.logDate}>{formatDate(item.created_at)}</Text>
                </View>
              </View>
            </ContentGlass>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No failed logins found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );

  const renderLockedAccountsTab = () => (
    <FlatList
      data={lockedAccounts}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.error} colors={[COLORS.error]} />}
      renderItem={({ item }) => (
        <ContentGlass style={styles.lockedAccountCard}>
          <View style={styles.lockedAccountHeader}>
            <View style={styles.lockedAccountInfo}>
              <View style={styles.lockedAccountNameContainer}>
                <Lock size={16} color={COLORS.error} />
                <Text style={styles.lockedAccountName}>{item.full_name || item.username}</Text>
              </View>
              <Text style={styles.lockedAccountEmail}>{item.email}</Text>
              <Text style={styles.lockedAccountDetails}>
                {item.failed_login_attempts} failed attempts
              </Text>
              <View style={styles.lockedAccountDateContainer}>
                <Clock size={12} color={COLORS.textLight} />
                <Text style={styles.lockedAccountDate}>Until: {formatDate(item.account_locked_until)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={() => unlockAccount(item.id)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Unlock size={14} color={COLORS.white} />
                  <Text style={styles.unlockButtonText}>Unlock</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ContentGlass>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Shield size={64} color={COLORS.textLight} style={{ opacity: 0.5, marginBottom: SPACING[4] }} />
          <Text style={styles.emptyText}>No locked accounts</Text>
          <Text style={styles.emptySubtext}>All accounts are currently unlocked</Text>
        </View>
      }
      contentContainerStyle={styles.listContent}
    />
  );

  const renderAuditLogsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Action Filter:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {ACTION_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[styles.filterButton, actionFilter === filter.value && styles.filterButtonActive]}
              onPress={() => setActionFilter(filter.value)}
            >
              <Text style={[styles.filterButtonText, actionFilter === filter.value && styles.filterButtonTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={activityLogs}
        keyExtractor={(item, index) => String(index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.error} colors={[COLORS.error]} />}
        renderItem={({ item }) => {
          const colors = getActionColor(item.action);
          return (
            <ContentGlass style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logUserContainer}>
                  <User size={16} color={COLORS.text} />
                  <Text style={styles.logUser}>{item.user_name || 'System'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                  {getActionIcon(item.action, 12)}
                  <Text style={[styles.statusBadgeText, { color: colors.text, marginLeft: 4 }]}>
                    {item.action.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              {item.details && <Text style={styles.logDetails}>{item.details}</Text>}
              <View style={styles.logFooter}>
                {item.ip_address && (
                  <View style={styles.logIpContainer}>
                    <MapPin size={12} color={COLORS.textLight} />
                    <Text style={styles.logIp}>{item.ip_address}</Text>
                  </View>
                )}
                <View style={styles.logDateContainer}>
                  <Clock size={12} color={COLORS.textLight} />
                  <Text style={styles.logDate}>{formatDate(item.created_at)}</Text>
                </View>
              </View>
            </ContentGlass>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No activity logs found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'failed-logins':
        return renderFailedLoginsTab();
      case 'locked-accounts':
        return renderLockedAccountsTab();
      case 'audit-logs':
        return renderAuditLogsTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Shield size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Security Monitor</Text>
        </View>
        <Text style={styles.headerSubtitle}>Monitor security events and manage accounts</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <IconComponent size={16} color={activeTab === tab.id ? COLORS.error : COLORS.textLight} />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING[4],
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  headerTitle: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginTop: SPACING[1],
    marginLeft: SPACING[8], // Offset to align with title text
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 60,
  },
  tab: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    marginHorizontal: SPACING[1],
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  tabActive: {
    backgroundColor: COLORS.error + '20',
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.medium,
  },
  tabLabelActive: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.bold,
  },
  tabContent: {
    flex: 1,
  },
  statsContainer: {
    padding: SPACING[4],
    gap: SPACING[3],
  },
  statCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    position: 'relative',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.textLight,
    marginBottom: SPACING[2],
  },
  statValue: {
    fontSize: TYPOGRAPHY['4xl'] - 4,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: SPACING[1],
  },
  statIconContainer: {
    position: 'absolute',
    top: SPACING[4],
    right: SPACING[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[3],
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
  },
  logCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    marginHorizontal: SPACING[4],
    marginBottom: SPACING[3],
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  logUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    flex: 1,
  },
  logUser: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  logDetails: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginBottom: SPACING[2],
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logIpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  logIp: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  logDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  logDate: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  statusBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.base,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: TYPOGRAPHY.xs - 1,
    fontWeight: TYPOGRAPHY.semibold,
  },
  lockedAccountCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    marginHorizontal: SPACING[4],
    marginBottom: SPACING[3],
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  lockedAccountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockedAccountInfo: {
    flex: 1,
    marginRight: SPACING[3],
  },
  lockedAccountNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[1],
  },
  lockedAccountName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  lockedAccountEmail: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
  },
  lockedAccountDetails: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
  },
  lockedAccountDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  lockedAccountDate: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  unlockButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
    minWidth: 80,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING[1],
  },
  unlockButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  filterBar: {
    padding: SPACING[4],
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: SPACING[2],
  },
  filterButtonActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.xs + 1,
    color: COLORS.text,
  },
  filterButtonTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.semibold,
  },
  listContent: {
    paddingVertical: SPACING[4],
  },
  emptyState: {
    padding: SPACING[12],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.medium,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
});

export default SecurityMonitorScreen;
