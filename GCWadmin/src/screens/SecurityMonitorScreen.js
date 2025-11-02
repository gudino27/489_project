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
import { COLORS } from '../constants/colors';
import { ContentGlass } from '../components/GlassView';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const SecurityMonitorScreen = () => {
  const { token, API_BASE, getAuthHeaders, getAuthHeadersJson } = useAuth();
  const { t } = useLanguage();

  const TABS = [
    { id: 'overview', label: t('securityMonitor.overview'), icon: '📊' },
    { id: 'failed-logins', label: t('securityMonitor.failedLogins'), icon: '⚠️' },
    { id: 'locked-accounts', label: t('securityMonitor.lockedAccounts'), icon: '🔒' },
    { id: 'audit-logs', label: t('securityMonitor.auditLogs'), icon: '📋' },
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

  const stats = {
    totalFailedAttempts: failedLogins.filter((log) => log.action === 'login_failed').length,
    lockedAccountsCount: lockedAccounts.length,
    recentActivity: activityLogs.length,
  };

  const renderOverviewTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <ContentGlass style={[styles.statCard, { borderLeftColor: '#ffc107', borderLeftWidth: 4 }]}>
          <Text style={styles.statLabel}>Failed Attempts (24h)</Text>
          <Text style={[styles.statValue, { color: '#ffc107' }]}>{stats.totalFailedAttempts}</Text>
          <Text style={styles.statIcon}>⚠️</Text>
        </ContentGlass>

        <ContentGlass style={[styles.statCard, { borderLeftColor: COLORS.error, borderLeftWidth: 4 }]}>
          <Text style={styles.statLabel}>Locked Accounts</Text>
          <Text style={[styles.statValue, { color: COLORS.error }]}>{stats.lockedAccountsCount}</Text>
          <Text style={styles.statIcon}>🔒</Text>
        </ContentGlass>

        <ContentGlass style={[styles.statCard, { borderLeftColor: COLORS.primary, borderLeftWidth: 4 }]}>
          <Text style={styles.statLabel}>Recent Activity</Text>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.recentActivity}</Text>
          <Text style={styles.statIcon}>📊</Text>
        </ContentGlass>
      </View>

      {/* Recent Failed Logins */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⚠️ Recent Failed Logins</Text>
        <TouchableOpacity onPress={() => fetchFailedLogins(timeFilter)} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {failedLogins.slice(0, 10).map((log, index) => (
        <ContentGlass key={index} style={styles.logCard}>
          <View style={styles.logHeader}>
            <Text style={styles.logUser}>👤 {log.user_name}</Text>
            <Text style={styles.logDate}>{formatDate(log.created_at)}</Text>
          </View>
          <Text style={styles.logDetails}>{log.details}</Text>
          {log.ip_address && <Text style={styles.logIp}>📍 {log.ip_address}</Text>}
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
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>🔒 Currently Locked Accounts</Text>
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
                  <Text style={styles.unlockButtonText}>🔓 Unlock</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const colors = getActionColor(item.action);
          return (
            <ContentGlass style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logUser}>👤 {item.user_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.text }]}>
                    {item.action === 'account_locked' ? t('securityMonitor.accountLocked') : t('securityMonitor.failed')}
                  </Text>
                </View>
              </View>
              <Text style={styles.logDetails}>{item.details}</Text>
              <View style={styles.logFooter}>
                {item.ip_address && <Text style={styles.logIp}>📍 {item.ip_address}</Text>}
                <Text style={styles.logDate}>{formatDate(item.created_at)}</Text>
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <ContentGlass style={styles.lockedAccountCard}>
          <View style={styles.lockedAccountHeader}>
            <View style={styles.lockedAccountInfo}>
              <Text style={styles.lockedAccountName}>🔒 {item.full_name || item.username}</Text>
              <Text style={styles.lockedAccountEmail}>{item.email}</Text>
              <Text style={styles.lockedAccountDetails}>
                {item.failed_login_attempts} failed attempts
              </Text>
              <Text style={styles.lockedAccountDate}>Until: {formatDate(item.account_locked_until)}</Text>
            </View>
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={() => unlockAccount(item.id)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.unlockButtonText}>🔓 Unlock</Text>
              )}
            </TouchableOpacity>
          </View>
        </ContentGlass>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛡️</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const colors = getActionColor(item.action);
          return (
            <ContentGlass style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logUser}>👤 {item.user_name || 'System'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.text }]}>
                    {item.action.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              {item.details && <Text style={styles.logDetails}>{item.details}</Text>}
              <View style={styles.logFooter}>
                {item.ip_address && <Text style={styles.logIp}>📍 {item.ip_address}</Text>}
                <Text style={styles.logDate}>{formatDate(item.created_at)}</Text>
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
        <Text style={styles.headerTitle}>🛡️ Security Monitor</Text>
        <Text style={styles.headerSubtitle}>Monitor security events and manage accounts</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
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
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 60,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.error + '20',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.error,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 40,
    opacity: 0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  logCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logUser: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  logDetails: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logIp: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  logDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lockedAccountCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
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
    marginRight: 12,
  },
  lockedAccountName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  lockedAccountEmail: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  lockedAccountDetails: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  lockedAccountDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  unlockButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  unlockButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  filterBar: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  filterButtonText: {
    fontSize: 13,
    color: COLORS.text,
  },
  filterButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 16,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
});

export default SecurityMonitorScreen;
