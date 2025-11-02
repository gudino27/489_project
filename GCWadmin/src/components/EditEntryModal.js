import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Clock, Trash2, Save, FileText } from 'lucide-react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { ContentGlass } from './GlassView';
import { formatDateTimePST } from '../utils/timezoneHelpers';

const EditEntryModal = ({
  visible,
  onClose,
  editingEntry,
  editForm,
  onFormChange,
  onSave,
  onDelete,
  auditLog,
  saving,
  deleting
}) => {
  const { t } = useLanguage();

  if (!editingEntry) return null;

  const handleSave = () => {
    // Validation
    if (!editForm.clockInTime) {
      Alert.alert(t('common.error'), t('timeclock.clock_in_time_required'));
      return;
    }

    // Validate time format
    const timeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!timeRegex.test(editForm.clockInTime)) {
      Alert.alert(t('common.error'), t('timeclock.invalid_datetime_format'));
      return;
    }

    if (editForm.clockOutTime && !timeRegex.test(editForm.clockOutTime)) {
      Alert.alert(t('common.error'), t('timeclock.invalid_datetime_format'));
      return;
    }

    onSave();
  };

  const handleDelete = () => {
    Alert.alert(
      t('timeclock.delete_entry'),
      t('timeclock.confirm_delete_entry'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: onDelete
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ContentGlass style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <Clock size={24} color={COLORS.accent} />
                <Text style={styles.modalTitle}>{t('timeclock.edit_entry')}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Entry Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('timeclock.entry_details')}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('timeclock.entry_id')}:</Text>
                  <Text style={styles.infoValue}>#{editingEntry.id}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('timeclock.date')}:</Text>
                  <Text style={styles.infoValue}>{editingEntry.date}</Text>
                </View>
              </View>

              {/* Editable Fields */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('timeclock.edit_times')}</Text>

                {/* Clock In Time */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('timeclock.clock_in_time')}</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.clockInTime}
                    onChangeText={(text) => onFormChange('clockInTime', text)}
                    placeholder={t('timeEntry.placeholders.datetimeFormat')}
                    placeholderTextColor={COLORS.textLight}
                  />
                  <Text style={styles.helperText}>
                    {t('timeclock.datetime_format_helper')}
                  </Text>
                </View>

                {/* Clock Out Time */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('timeclock.clock_out_time')}</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.clockOutTime}
                    onChangeText={(text) => onFormChange('clockOutTime', text)}
                    placeholder={t('timeEntry.placeholders.datetimeFormat')}
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>

                {/* Break Minutes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('timeclock.break_minutes')}</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.breakMinutes.toString()}
                    onChangeText={(text) => onFormChange('breakMinutes', text)}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>

                {/* Notes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('timeclock.edit_reason')}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editForm.notes}
                    onChangeText={(text) => onFormChange('notes', text)}
                    placeholder={t('timeclock.edit_reason_placeholder')}
                    placeholderTextColor={COLORS.textLight}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Audit Log */}
              {auditLog && auditLog.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.auditHeader}>
                    <FileText size={20} color={COLORS.accent} />
                    <Text style={styles.sectionTitle}>{t('timeclock.audit_trail')}</Text>
                  </View>

                  {auditLog.map((log, index) => (
                    <View key={index} style={styles.auditEntry}>
                      <View style={styles.auditDot} />
                      <View style={styles.auditContent}>
                        <Text style={styles.auditAction}>{log.action}</Text>
                        <Text style={styles.auditDetails}>{log.details}</Text>
                        <View style={styles.auditMeta}>
                          <Text style={styles.auditUser}>{log.edited_by_name}</Text>
                          <Text style={styles.auditTime}>
                            {formatDateTimePST(log.edited_at)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={handleDelete}
                  disabled={deleting || saving}
                >
                  {deleting ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <>
                      <Trash2 size={16} color={COLORS.background} />
                      <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                  disabled={saving || deleting}
                >
                  {saving ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <>
                      <Save size={16} color={COLORS.background} />
                      <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </ContentGlass>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalContent: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING[4],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[4],
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING[2],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glassDark,
  },
  modalBody: {
    maxHeight: 600,
  },
  section: {
    marginBottom: SPACING[5],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING[2],
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: SPACING[3],
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  input: {
    backgroundColor: COLORS.glassDark,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  textArea: {
    minHeight: 80,
  },
  helperText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  auditEntry: {
    flexDirection: 'row',
    marginBottom: SPACING[3],
  },
  auditDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 6,
    marginRight: SPACING[2],
  },
  auditContent: {
    flex: 1,
  },
  auditAction: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  auditDetails: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
  },
  auditMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  auditUser: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accent,
  },
  auditTime: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginTop: SPACING[4],
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    padding: SPACING[3],
    borderRadius: RADIUS.lg,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.background,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.background,
  },
});

export default EditEntryModal;
