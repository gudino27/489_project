import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Clock,
  Ban,
} from 'lucide-react-native';
import { ContentGlass } from '../components/GlassView';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import * as appointmentsApi from '../api/appointments';

const TABS = [
  { id: 'appointments', label: 'Appointments', emoji: '📅' },
  { id: 'availability', label: 'Availability', emoji: '⏰' },
  { id: 'blocked', label: 'Blocked Times', emoji: '🚫' },
];

const AppointmentsScreen = () => {
  const { token } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming');

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, statusFilter, dateFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await appointmentsApi.getAppointments(statusFilter, dateFilter);
      setAppointments(data.appointments || []);

      const empData = await appointmentsApi.getEmployees();
      setEmployees(empData || []);
    } catch (err) {
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#FEF3C7', text: '#92400E' },
      confirmed: { bg: '#D1FAE5', text: '#065F46' },
      completed: { bg: '#DBEAFE', text: '#1E40AF' },
      cancelled: { bg: '#FEE2E2', text: '#991B1B' },
      no_show: { bg: '#F3F4F6', text: '#374151' },
      needs_reschedule: { bg: '#FED7AA', text: '#C2410C' },
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      await appointmentsApi.updateAppointmentStatus(id, status);
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const renderAppointmentsTab = () => (
    <View style={styles.tabContent}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
              style={styles.picker}
            >
              <Picker.Item label="All Statuses" value="all" />
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Confirmed" value="confirmed" />
              <Picker.Item label="Completed" value="completed" />
              <Picker.Item label="Cancelled" value="cancelled" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Date Range</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={dateFilter}
              onValueChange={(value) => setDateFilter(value)}
              style={styles.picker}
            >
              <Picker.Item label="Upcoming" value="upcoming" />
              <Picker.Item label="Today" value="today" />
              <Picker.Item label="This Week" value="week" />
              <Picker.Item label="Past" value="past" />
              <Picker.Item label="All" value="all" />
            </Picker>
          </View>
        </View>
      </View>

      {/* Appointments List */}
      {loading && appointments.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.centerContainer}>
          <Calendar size={48} color={COLORS.gray300} />
          <Text style={styles.emptyText}>No appointments found</Text>
        </View>
      ) : (
        <ScrollView style={styles.appointmentsList}>
          {appointments.map((apt) => {
            const statusColors = getStatusColor(apt.status);
            return (
              <View key={apt.id} style={styles.appointmentRow}>
                <View style={styles.appointmentCell}>
                  <Text style={styles.cellPrimary}>{formatDate(apt.appointment_date)}</Text>
                  <Text style={styles.cellSecondary}>{formatTime(apt.appointment_date)}</Text>
                  <Text style={styles.cellTertiary}>{apt.duration} min</Text>
                </View>

                <View style={styles.appointmentCell}>
                  <Text style={styles.cellPrimary}>{apt.client_name}</Text>
                  <Text style={styles.cellSecondary}>{apt.client_email}</Text>
                  <Text style={styles.cellSecondary}>{apt.client_phone}</Text>
                </View>

                <View style={styles.statusCell}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {apt.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsCell}>
                  {apt.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => updateAppointmentStatus(apt.id, 'confirmed')}
                    >
                      <CheckCircle size={20} color={COLORS.success} />
                    </TouchableOpacity>
                  )}
                  {apt.status === 'confirmed' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => updateAppointmentStatus(apt.id, 'completed')}
                    >
                      <CheckCircle size={20} color={COLORS.blue} />
                    </TouchableOpacity>
                  )}
                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => updateAppointmentStatus(apt.id, 'cancelled')}
                    >
                      <XCircle size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule Management</Text>
        <Text style={styles.headerSubtitle}>Manage appointments, availability, and blocked times</Text>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorClose}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} />
        }
      >
        <View style={styles.contentCard}>
          {activeTab === 'appointments' && renderAppointmentsTab()}
          {activeTab === 'availability' && (
            <View style={styles.centerContainer}>
              <Clock size={48} color={COLORS.gray300} />
              <Text style={styles.emptyText}>Availability management coming soon</Text>
            </View>
          )}
          {activeTab === 'blocked' && (
            <View style={styles.centerContainer}>
              <Ban size={48} color={COLORS.gray300} />
              <Text style={styles.emptyText}>Blocked times management coming soon</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.lg,
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 14,
  },
  errorClose: {
    fontSize: 24,
    color: '#EF4444',
    marginLeft: SPACING.sm,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: COLORS.white,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    marginRight: SPACING.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563EB',
  },
  tabEmoji: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  content: {
    flex: 1,
  },
  contentCard: {
    margin: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: SPACING.lg,
  },
  tabContent: {
    gap: SPACING.lg,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.lg,
  },
  filterGroup: {
    flex: 1,
    minWidth: 150,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: SPACING.xs,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 3,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: '#6B7280',
    fontSize: 14,
  },
  emptyText: {
    marginTop: SPACING.md,
    color: '#6B7280',
    fontSize: 14,
  },
  appointmentsList: {
    marginTop: SPACING.md,
  },
  appointmentRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  appointmentCell: {
    flex: 2,
    paddingRight: SPACING.md,
  },
  statusCell: {
    flex: 1,
    justifyContent: 'center',
  },
  actionsCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cellPrimary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  cellSecondary: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  cellTertiary: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    padding: SPACING.xs,
  },
});

export default AppointmentsScreen;
