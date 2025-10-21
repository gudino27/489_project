import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Edit2, Trash2, X, Save, Plus } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { ContentGlass } from '../components/GlassView';
import api from '../api/client';
import {
  formatTimePST,
  formatDatePST,
  extractPSTDate,
  extractPSTTime,
} from '../utils/timezoneHelpers';

const TimeEntryDetailsScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { date, employeeId } = route.params;
  const isAdmin = user?.role === 'super_admin';

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    clockInTime: '',
    clockOutTime: '',
    breakMinutes: '',
    notes: '',
  });
  const [auditLog, setAuditLog] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDayEntries();
  }, [date, employeeId]);

  const fetchDayEntries = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin
        ? `/api/timeclock/admin/entries?employeeId=${employeeId}&date=${date}`
        : `/api/timeclock/my-entries?startDate=${date}&endDate=${date}`;

      const response = await api.get(endpoint);
      if (response.data.success) {
        setEntries(response.data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      Alert.alert(t('common.error'), 'Failed to load time entries');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPress = async (entry) => {
    setEditingEntry(entry);
    setEditForm({
      clockInTime: extractPSTTime(entry.clock_in_time),
      clockOutTime: entry.clock_out_time ? extractPSTTime(entry.clock_out_time) : '',
      breakMinutes: String(entry.break_minutes || 0),
      notes: entry.notes || '',
    });

    // Fetch audit log for this entry
    if (isAdmin) {
      try {
        const response = await api.get(`/api/timeclock/admin/entry-audit/${entry.id}`);
        if (response.data.success) {
          setAuditLog(response.data.audit || []);
        }
      } catch (error) {
        console.error('Error fetching audit log:', error);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.clockInTime) {
      Alert.alert(t('common.error'), 'Clock in time is required');
      return;
    }

    if (!isAdmin) {
      Alert.alert(t('common.error'), 'Only admins can edit time entries');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(
        `/api/timeclock/admin/edit-entry/${editingEntry.id}`,
        {
          clockInTime: `${date} ${editForm.clockInTime}:00`,
          clockOutTime: editForm.clockOutTime ? `${date} ${editForm.clockOutTime}:00` : null,
          breakMinutes: parseInt(editForm.breakMinutes) || 0,
          notes: editForm.notes,
          reason: 'Edited via mobile app',
        }
      );

      if (response.data.success) {
        Alert.alert(t('common.success'), 'Entry updated successfully');
        setEditingEntry(null);
        fetchDayEntries();
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || 'Failed to update entry'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      Alert.alert(t('common.error'), 'Only admins can delete time entries');
      return;
    }

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this time entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const response = await api.delete(
                `/api/timeclock/admin/delete-entry/${editingEntry.id}`
              );

              if (response.data.success) {
                Alert.alert(t('common.success'), 'Entry deleted successfully');
                setEditingEntry(null);
                fetchDayEntries();
                // If no more entries, go back
                if (entries.length === 1) {
                  navigation.goBack();
                }
              }
            } catch (error) {
              Alert.alert(
                t('common.error'),
                error.response?.data?.message || 'Failed to delete entry'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const calculateDuration = (entry) => {
    if (!entry.clock_out_time) return 'In Progress';
    return `${parseFloat(entry.total_hours || 0).toFixed(2)} hrs`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <X size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Time Entries</Text>
          <Text style={styles.headerSubtitle}>{formatDatePST(date)}</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddTimeEntry', { employeeId, date })}
          >
            <Plus size={24} color={COLORS.blue} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {entries.length === 0 ? (
          <ContentGlass style={styles.emptyState}>
            <Clock size={48} color={COLORS.textLight} />
            <Text style={styles.emptyStateText}>No entries for this day</Text>
          </ContentGlass>
        ) : (
          entries.map((entry, index) => (
            <ContentGlass key={entry.id} style={styles.entryCard}>
              {editingEntry && editingEntry.id === entry.id ? (
                /* Edit Mode */
                <View>
                  <Text style={styles.entryTitle}>Edit Entry #{index + 1}</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Clock In Time *</Text>
                    <TextInput
                      style={styles.input}
                      value={editForm.clockInTime}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, clockInTime: text })
                      }
                      placeholder="HH:MM (24-hour)"
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Clock Out Time</Text>
                    <TextInput
                      style={styles.input}
                      value={editForm.clockOutTime}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, clockOutTime: text })
                      }
                      placeholder="HH:MM (24-hour)"
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Break Minutes</Text>
                    <TextInput
                      style={styles.input}
                      value={editForm.breakMinutes}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, breakMinutes: text })
                      }
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={editForm.notes}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, notes: text })
                      }
                      placeholder="Add notes..."
                      multiline
                      numberOfLines={3}
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>

                  {/* Audit Log */}
                  {auditLog.length > 0 && (
                    <View style={styles.auditSection}>
                      <Text style={styles.auditTitle}>Change History</Text>
                      {auditLog.map((log, idx) => (
                        <View key={idx} style={styles.auditEntry}>
                          <Text style={styles.auditUser}>
                            {log.modified_by_name || 'System'}
                          </Text>
                          <Text style={styles.auditAction}>
                            {log.reason || log.modification_type}
                          </Text>
                          <Text style={styles.auditTime}>
                            {formatDatePST(log.created_at)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => setEditingEntry(null)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <Trash2 size={16} color={COLORS.white} />
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.saveButton]}
                      onPress={handleSaveEdit}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <Save size={16} color={COLORS.white} />
                          <Text style={styles.saveButtonText}>Save</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* View Mode */
                <View>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>Entry #{index + 1}</Text>
                    {isAdmin && (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditPress(entry)}
                      >
                        <Edit2 size={18} color={COLORS.blue} />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Clock In:</Text>
                    <Text style={styles.detailValue}>
                      {formatTimePST(entry.clock_in_time)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Clock Out:</Text>
                    <Text style={styles.detailValue}>
                      {entry.clock_out_time
                        ? formatTimePST(entry.clock_out_time)
                        : 'Still clocked in'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration:</Text>
                    <Text style={[styles.detailValue, styles.durationValue]}>
                      {calculateDuration(entry)}
                    </Text>
                  </View>

                  {entry.break_minutes > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Break:</Text>
                      <Text style={styles.detailValue}>
                        {entry.break_minutes} minutes
                      </Text>
                    </View>
                  )}

                  {entry.is_manual_entry && (
                    <View style={styles.manualBadge}>
                      <Text style={styles.manualBadgeText}>📝 Manual Entry</Text>
                    </View>
                  )}
                </View>
              )}
            </ContentGlass>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: SPACING[3],
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING[3],
    padding: SPACING[2],
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textGray,
    marginTop: SPACING[1],
  },
  addButton: {
    marginLeft: SPACING[2],
    padding: SPACING[2],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING[4],
    paddingBottom: SPACING[8],
  },
  emptyState: {
    padding: SPACING[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textLight,
    marginTop: SPACING[3],
  },
  entryCard: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  entryTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.blue,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textGray,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  durationValue: {
    color: COLORS.blue,
  },
  notesSection: {
    marginTop: SPACING[3],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notesText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMedium,
    marginTop: SPACING[2],
    lineHeight: 20,
  },
  manualBadge: {
    marginTop: SPACING[3],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.infoDark + '20',
    alignSelf: 'flex-start',
  },
  manualBadgeText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.blue,
  },
  // Edit Form Styles
  formGroup: {
    marginBottom: SPACING[4],
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textMedium,
    marginBottom: SPACING[2],
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING[3],
    fontSize: TYPOGRAPHY.md,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  auditSection: {
    marginTop: SPACING[4],
    paddingTop: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  auditTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  auditEntry: {
    paddingVertical: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  auditUser: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  auditAction: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textGray,
    marginTop: SPACING[1],
  },
  auditTime: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginTop: SPACING[4],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[1],
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.md,
  },
  cancelButton: {
    backgroundColor: COLORS.gray200,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textMedium,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.blue,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
});

export default TimeEntryDetailsScreen;
